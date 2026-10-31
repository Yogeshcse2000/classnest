// Admin-only API routes. Mounted at /api/admin behind requireRoleApi('admin'),
// so every route here already knows the visitor is a logged-in admin.

const express = require('express');
const { countLectures, findNextLecture } = require('../models/lectures');
const { countAssignments } = require('../models/assignments');
const { listLatestSubmissions } = require('../models/submissions');
const { submissionStatus } = require('../utils/dates');

const router = express.Router();

const LATEST_SUBMISSIONS = 5;

// GET /api/admin/dashboard - data for the admin dashboard
router.get('/dashboard', async (req, res) => {
  const [lectureCount, assignmentCount, nextLecture, latest] = await Promise.all([
    countLectures(),
    countAssignments(),
    findNextLecture(new Date().toISOString()),
    listLatestSubmissions(LATEST_SUBMISSIONS),
  ]);
  res.json({
    name: req.session.user.name,
    lectureCount,
    assignmentCount,
    nextLecture: nextLecture || null,
    latestSubmissions: latest.map((submission) => ({
      ...submission,
      status: submissionStatus(submission.submitted_at, submission.is_late),
    })),
  });
});

router.use('/batches', require('./admin/batches')); // /api/admin/batches
router.use('/students', require('./admin/students')); // /api/admin/students
router.use('/lectures', require('./admin/lectures')); // /api/admin/lectures
router.use('/assignments', require('./admin/assignments')); // /api/admin/assignments
router.use('/submissions', require('./admin/submissions')); // /api/admin/submissions
router.use('/search', require('./admin/search')); // /api/admin/search

module.exports = router;
