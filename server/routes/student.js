// Student-only API routes. Mounted at /api/student behind requireRoleApi('student'),
// so every route here already knows the visitor is a logged-in student.
// The session says who the student is, and the database says which batch they are in. Nothing here reads a batch
// from the URL or the request body, so a student can only ever reach their own batch's work.

const express = require('express');
const { findStudentById } = require('../models/students');
const { listBatchLectures } = require('../models/lectures');
const { listBatchAssignments } = require('../models/assignments');
const { cleanQuery, searchBatchLectures, searchBatchAssignments } = require('../models/search');
const { lectureStatus, deadlineStatus } = require('../utils/dates');

const router = express.Router();

// GET /api/student/dashboard - everything on the student dashboard.
// The server works out every status, and sends its own time so the page's countdowns follow the server's clock.
router.get('/dashboard', async (req, res) => {
  const student = await findStudentById(req.session.user.id);
  const [lectures, assignments] = student
    ? await Promise.all([listBatchLectures(student.batch_id), listBatchAssignments(student.batch_id)])
    : [[], []];

  const now = Date.now();
  const lecturesWithStatus = (status) =>
    lectures.filter((lecture) => lectureStatus(lecture.starts_at, lecture.duration_minutes, now) === status);

  // Only the fields the page shows. The Meet link is only sent while a lecture is live, and finished lectures not at all.
  res.json({
    name: req.session.user.name,
    now: new Date(now).toISOString(),
    live: lecturesWithStatus('Live now').map(({ id, title, starts_at, meet_link }) => ({ id, title, starts_at, meet_link })),
    upcoming: lecturesWithStatus('Upcoming').map(({ id, title, starts_at }) => ({ id, title, starts_at })),
    assignments: assignments.map(({ id, title, description, due_at }) => ({
      id,
      title,
      description,
      due_at,
      deadline_status: deadlineStatus(due_at, now),
    })),
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

  // Each result opens its item on the dashboard. Finished lectures are hidden there, so they are left out here too.
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
        url: `/student/dashboard#assignment-${assignment.id}`,
      })),
    ],
  });
});

module.exports = router;
