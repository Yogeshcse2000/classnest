// Admin API routes for assignments. Mounted at /api/admin/assignments (admins only).

const express = require('express');
const {
  listAssignments,
  findAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} = require('../../models/assignments');
const { findBatchById } = require('../../models/batches');
const { countAssignmentSubmissions, listAssignmentRoster } = require('../../models/submissions');
const {
  utcToIst,
  istToUtc,
  deadlineStatus,
  openFirst,
  minutesLeft,
  minutesLate,
  submissionStatus,
} = require('../../utils/dates');
const { toId } = require('../../utils/ids');

const router = express.Router();

// Trimmed text, or '' if the value isn't text
const text = (value) => (typeof value === 'string' ? value.trim() : '');

// What the browser receives. The server works out the time left, so it always follows the server's clock.
function assignmentView(assignment, now) {
  return {
    ...assignment,
    due_at_local: utcToIst(assignment.due_at),
    deadline_status: deadlineStatus(assignment.due_at, now),
    minutes_left: minutesLeft(assignment.due_at, now),
  };
}

// Reads the form. Gives back the clean values, and an error message for each wrong field.
async function readAssignment(body = {}) {
  const assignment = {
    title: text(body.title),
    description: text(body.description),
    dueAt: istToUtc(text(body.dueAt)),
    batchId: toId(body.batchId),
  };

  const fields = {};
  if (!assignment.title) {
    fields.title = 'Please give the assignment a title.';
  } else if (assignment.title.length > 120) {
    fields.title = 'The title is too long (120 characters max).';
  }
  if (!assignment.description) {
    fields.description = 'Please describe the assignment.';
  } else if (assignment.description.length > 2000) {
    fields.description = 'The description is too long (2000 characters max).';
  }
  if (!assignment.dueAt) {
    fields.dueAt = 'Please pick a deadline.';
  }
  if (!assignment.batchId) {
    fields.batchId = 'Please choose a batch.';
  } else if (!(await findBatchById(assignment.batchId))) {
    fields.batchId = 'That batch no longer exists. Please choose another.';
  }

  return { assignment, fields };
}

function sendFieldErrors(res, fields) {
  res.status(400).json({ error: 'Please check the highlighted fields.', fields });
}

// GET /api/admin/assignments - all assignments, open ones first
router.get('/', async (req, res) => {
  const now = Date.now();
  const assignments = openFirst(await listAssignments(), now);
  res.json({ assignments: assignments.map((assignment) => assignmentView(assignment, now)) });
});

// GET /api/admin/assignments/:id/submissions - every student in the batch, whether they have submitted or not
router.get('/:id/submissions', async (req, res) => {
  const assignment = await findAssignmentById(toId(req.params.id));
  if (!assignment) {
    return res.status(404).json({ error: 'That assignment no longer exists.' });
  }

  const roster = await listAssignmentRoster(assignment.id, assignment.batch_id);
  const students = roster.map((student) => ({
    ...student,
    status: submissionStatus(student.submitted_at, student.is_late),
    minutes_late: student.is_late ? minutesLate(assignment.due_at, student.submitted_at) : 0,
  }));
  const count = (status) => students.filter((student) => student.status === status).length;

  res.json({
    assignment: assignmentView(assignment, Date.now()),
    counts: { submitted: count('Submitted'), late: count('Late'), notSubmitted: count('Not submitted') },
    students,
  });
});

// POST /api/admin/assignments  body: { title, description, dueAt, batchId }
router.post('/', async (req, res) => {
  const { assignment, fields } = await readAssignment(req.body);
  if (assignment.dueAt && new Date(assignment.dueAt).getTime() <= Date.now()) {
    fields.dueAt = 'The deadline must be in the future.';
  }
  if (Object.keys(fields).length) {
    return sendFieldErrors(res, fields);
  }

  const id = await createAssignment(assignment);
  res.status(201).json({ assignment: assignmentView(await findAssignmentById(id), Date.now()) });
});

// PUT /api/admin/assignments/:id  body: { title, description, dueAt, batchId }
// A past deadline is allowed here, so the admin can still fix the text of a closed assignment.
router.put('/:id', async (req, res) => {
  const existing = await findAssignmentById(toId(req.params.id));
  if (!existing) {
    return res.status(404).json({ error: 'That assignment no longer exists.' });
  }

  const { assignment, fields } = await readAssignment(req.body);
  // The submissions view lists the assignment's batch, so moving it would hide the work already handed in
  if (!fields.batchId && assignment.batchId !== existing.batch_id && (await countAssignmentSubmissions(existing.id))) {
    fields.batchId = 'Students have already submitted work, so this assignment must stay in its batch.';
  }
  if (Object.keys(fields).length) {
    return sendFieldErrors(res, fields);
  }

  await updateAssignment(existing.id, assignment);
  res.json({ assignment: assignmentView(await findAssignmentById(existing.id), Date.now()) });
});

// DELETE /api/admin/assignments/:id
router.delete('/:id', async (req, res) => {
  const assignment = await findAssignmentById(toId(req.params.id));
  if (!assignment) {
    return res.status(404).json({ error: 'That assignment no longer exists.' });
  }

  try {
    await deleteAssignment(assignment.id);
  } catch (error) {
    if (!error.hasSubmissions) throw error;
    return res.status(409).json({ error: `Students have submitted work for "${assignment.title}", so it can't be deleted.` });
  }
  res.json({ deleted: assignment.id });
});

module.exports = router;
