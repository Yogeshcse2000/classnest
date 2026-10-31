// Student-only API routes. Mounted at /api/student behind requireRoleApi('student'),
// so every route here already knows the visitor is a logged-in student.
// The session says who the student is, and the database says which batch they are in. Nothing here reads a batch
// from the URL or the request body, so a student can only ever reach their own batch's work.

const express = require('express');
const { findStudentById } = require('../models/students');
const { listBatchLectures } = require('../models/lectures');
const { listBatchAssignments, findAssignmentById } = require('../models/assignments');
const { findSubmission, listStudentSubmissions, saveSubmission } = require('../models/submissions');
const { cleanQuery, searchBatchLectures, searchBatchAssignments } = require('../models/search');
const { lectureStatus, deadlineStatus, openFirst, isLate, submissionStatus } = require('../utils/dates');
const { toId } = require('../utils/ids');
const { receiveZip } = require('../middleware/upload');
const { saveFile, deleteFile } = require('../storage');

const router = express.Router();

// One batch's assignments for a student's pages, open ones first, each with that student's own status
async function assignmentList(student, now) {
  const [assignments, submissions] = await Promise.all([
    listBatchAssignments(student.batch_id),
    listStudentSubmissions(student.id),
  ]);
  return openFirst(assignments, now).map(({ id, title, due_at }) => {
    const submission = submissions.find((item) => item.assignment_id === id);
    return {
      id,
      title,
      due_at,
      deadline_status: deadlineStatus(due_at, now),
      submission_status: submissionStatus(submission?.submitted_at, submission?.is_late),
    };
  });
}

// What the page shows about a student's own work. The saved file's path is never sent, and neither is any way to download it.
function submissionView(submission) {
  if (!submission) return null;
  const { original_name, submitted_at, is_late } = submission;
  return { original_name, submitted_at, is_late, status: submissionStatus(submitted_at, is_late) };
}

// Runs before anything else on the routes below. An assignment from another batch gets the same answer as one
// that doesn't exist, and that answer comes before the upload is read, so nothing from that student is ever stored.
async function findOwnAssignment(req, res, next) {
  const student = await findStudentById(req.session.user.id);
  const assignment = await findAssignmentById(toId(req.params.id));
  if (!student || !assignment || assignment.batch_id !== student.batch_id) {
    return res.status(404).json({ error: "That assignment isn't available." });
  }
  req.student = student;
  req.assignment = assignment;
  next();
}

// GET /api/student/me - who is logged in, for the sidebar
router.get('/me', async (req, res) => {
  const student = await findStudentById(req.session.user.id);
  res.json({ user: { name: req.session.user.name, batch_name: student?.batch_name ?? '' } });
});

// GET /api/student/dashboard - everything on the student dashboard.
// The server works out every status, and sends its own time so the page's countdowns follow the server's clock.
router.get('/dashboard', async (req, res) => {
  const student = await findStudentById(req.session.user.id);
  const now = Date.now();
  const [lectures, assignments] = student
    ? await Promise.all([listBatchLectures(student.batch_id), assignmentList(student, now)])
    : [[], []];

  const lecturesWithStatus = (status) =>
    lectures.filter((lecture) => lectureStatus(lecture.starts_at, lecture.duration_minutes, now) === status);

  // Only the fields the page shows. The Meet link is only sent while a lecture is live, and finished lectures not at all.
  res.json({
    name: req.session.user.name,
    batch_name: student?.batch_name ?? '',
    now: new Date(now).toISOString(),
    live: lecturesWithStatus('Live now').map(({ id, title, starts_at, duration_minutes, meet_link }) => ({
      id,
      title,
      starts_at,
      duration_minutes,
      meet_link,
    })),
    upcoming: lecturesWithStatus('Upcoming').map(({ id, title, starts_at, duration_minutes }) => ({
      id,
      title,
      starts_at,
      duration_minutes,
    })),
    assignments,
  });
});

// GET /api/student/assignments - the list on the Assignments page
router.get('/assignments', async (req, res) => {
  const student = await findStudentById(req.session.user.id);
  const now = Date.now();
  res.json({
    now: new Date(now).toISOString(),
    assignments: student ? await assignmentList(student, now) : [],
  });
});

// GET /api/student/assignments/:id - one assignment on the Assignments page, with the student's own work
router.get('/assignments/:id', findOwnAssignment, async (req, res) => {
  const { id, title, description, due_at, batch_name } = req.assignment;
  const submission = await findSubmission(id, req.student.id);
  res.json({
    name: req.student.name,
    now: new Date().toISOString(),
    assignment: { id, title, description, due_at, batch_name },
    submission: submissionView(submission),
  });
});

// POST /api/student/assignments/:id/submission - upload a .zip as the "file" field. Uploading again replaces the old file.
// The new file is saved first and the old one deleted last, so a failure at any step leaves the old submission whole.
router.post('/assignments/:id/submission', findOwnAssignment, receiveZip, async (req, res) => {
  const { assignment, student, file } = req;

  // Taken after the whole file has arrived. Late uploads are allowed, and only flagged.
  const now = Date.now();
  const filePath = await saveFile(file.buffer);

  let oldFilePath;
  try {
    oldFilePath = await saveSubmission({
      assignmentId: assignment.id,
      studentId: student.id,
      filePath,
      originalName: file.originalname,
      submittedAt: new Date(now).toISOString(),
      isLate: isLate(assignment.due_at, now),
    });
  } catch (error) {
    await deleteFile(filePath); // no row points at this file, so nothing else would ever remove it
    if (error.gone) return res.status(404).json({ error: "That assignment isn't available." });
    throw error;
  }
  if (oldFilePath) await deleteFile(oldFilePath);

  res.status(201).json({
    now: new Date().toISOString(),
    submission: submissionView(await findSubmission(assignment.id, student.id)),
  });
});

// GET /api/student/search?q=... - Ctrl+K search for students. It only reads data.
router.get('/search', async (req, res) => {
  const query = cleanQuery(req.query.q);
  const student = await findStudentById(req.session.user.id);
  if (!query || !student) {
    return res.json({ results: [] });
  }

  const [lectures, assignments] = await Promise.all([
    searchBatchLectures(query, student.batch_id),
    searchBatchAssignments(query, student.batch_id),
  ]);

  // Lectures open on the dashboard, where finished ones are hidden, so they are left out here too.
  // Assignments open on the Assignments page.
  const now = Date.now();
  const onDashboard = lectures.filter((lecture) => lectureStatus(lecture.starts_at, lecture.duration_minutes, now) !== 'Done');

  res.json({
    results: [
      ...onDashboard.map((lecture) => ({
        type: 'Lecture',
        title: lecture.title,
        date: lecture.starts_at,
        url: `/student/dashboard#lecture-${lecture.id}`,
      })),
      ...assignments.map((assignment) => ({
        type: 'Assignment',
        title: assignment.title,
        date: assignment.due_at,
        url: `/student/assignments?assignment=${assignment.id}`,
      })),
    ],
  });
});

module.exports = router;
