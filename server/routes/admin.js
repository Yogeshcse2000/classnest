// Admin-only API routes. Mounted at /api/admin behind requireRoleApi('admin'),
// so every route here already knows the visitor is a logged-in admin.

const express = require('express');
const { listLectures } = require('../models/lectures');
const { listBatches } = require('../models/batches');
const { countStudents, countStudentsSince } = require('../models/students');
const { listLatestSubmissions, countSubmissions } = require('../models/submissions');
const { utcToIst, istToday, istMonthStart, istGreeting, lectureStatus, submissionStatus } = require('../utils/dates');

const router = express.Router();

const LATEST_SUBMISSIONS = 5;
const UPCOMING_LECTURES = 4;

// GET /api/admin/dashboard - data for the admin dashboard
router.get('/dashboard', async (req, res) => {
  const now = Date.now();
  const today = istToday(now);
  const [batches, lectures, students, newStudents, submissions, latest] = await Promise.all([
    listBatches(),
    listLectures(),
    countStudents(),
    countStudentsSince(istMonthStart(now)),
    countSubmissions(),
    listLatestSubmissions(LATEST_SUBMISSIONS),
  ]);
  const startingLater = batches.filter((batch) => batch.start_date > today).length;
  const notDone = lectures
    .map((lecture) => ({ ...lecture, status: lectureStatus(lecture.starts_at, lecture.duration_minutes, now) }))
    .filter((lecture) => lecture.status !== 'Done');

  res.json({
    name: req.session.user.name,
    now: new Date(now).toISOString(),
    today,
    greeting: istGreeting(now),
    stats: {
      activeBatches: batches.length - startingLater,
      startingLater,
      students,
      newStudents,
      lectures: lectures.length,
      lecturesToday: lectures.filter((lecture) => utcToIst(lecture.starts_at).startsWith(today)).length,
      submissions: submissions.total,
      lateSubmissions: submissions.late,
    },
    upcomingLectures: notDone.slice(0, UPCOMING_LECTURES).map(({ id, title, starts_at, batch_name, status }) => ({
      id,
      title,
      starts_at,
      batch_name,
      status,
    })),
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
