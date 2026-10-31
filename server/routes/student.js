// Student-only API routes. Mounted at /api/student behind requireRoleApi('student'),
// so every route here already knows the visitor is a logged-in student.

const express = require('express');
const { findStudentById } = require('../models/students');
const { cleanQuery, searchBatchLectures, searchBatchAssignments } = require('../models/search');

const router = express.Router();

// GET /api/student/dashboard - data for the student dashboard (just the name for now)
router.get('/dashboard', (req, res) => {
  res.json({ name: req.session.user.name });
});

// GET /api/student/search?q=... - Ctrl+K search for students. It only reads data.
// The batch comes from the database, never from the browser, so a student can only find their own batch's work.
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

  // Lectures and assignments have no student pages yet (step 11), so these open the dashboard for now
  res.json({
    results: [
      ...lectures.map((lecture) => ({
        type: 'Lecture',
        title: lecture.title,
        date: lecture.starts_at,
        url: '/student/dashboard',
      })),
      ...assignments.map((assignment) => ({
        type: 'Assignment',
        title: assignment.title,
        date: assignment.due_at,
        url: '/student/dashboard',
      })),
    ],
  });
});

module.exports = router;
