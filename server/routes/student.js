// Student-only API routes. Mounted at /api/student behind requireRoleApi('student'),
// so every route here already knows the visitor is a logged-in student.

const express = require('express');

const router = express.Router();

// GET /api/student/dashboard - data for the student dashboard (just the name for now)
router.get('/dashboard', (req, res) => {
  res.json({ name: req.session.user.name });
});

module.exports = router;
