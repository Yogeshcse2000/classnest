// Admin-only API routes. Mounted at /api/admin behind requireRoleApi('admin'),
// so every route here already knows the visitor is a logged-in admin.

const express = require('express');
const { countLectures, findNextLecture } = require('../models/lectures');
const { countAssignments } = require('../models/assignments');

const router = express.Router();

// GET /api/admin/dashboard - data for the admin dashboard
router.get('/dashboard', async (req, res) => {
  const [lectureCount, assignmentCount, nextLecture] = await Promise.all([
    countLectures(),
    countAssignments(),
    findNextLecture(new Date().toISOString()),
  ]);
  res.json({ name: req.session.user.name, lectureCount, assignmentCount, nextLecture: nextLecture || null });
});

router.use('/batches', require('./admin/batches')); // /api/admin/batches
router.use('/students', require('./admin/students')); // /api/admin/students
router.use('/lectures', require('./admin/lectures')); // /api/admin/lectures
router.use('/assignments', require('./admin/assignments')); // /api/admin/assignments
router.use('/search', require('./admin/search')); // /api/admin/search

module.exports = router;
