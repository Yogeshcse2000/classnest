// GET /api/admin/search?q=... - Ctrl+K search for admins. It only reads data.
// Mounted inside the admin routes, so only a logged-in admin can reach it.

const express = require('express');
const {
  cleanQuery,
  searchStudents,
  searchBatches,
  searchLectures,
  searchAssignments,
} = require('../../models/search');

const router = express.Router();

const PAGES = [
  { title: 'Dashboard', url: '/admin/dashboard' },
  { title: 'Batches', url: '/admin/batches' },
  { title: 'Students', url: '/admin/students' },
];

router.get('/', async (req, res) => {
  const query = cleanQuery(req.query.q);

  const pages = PAGES.filter((page) => page.title.toLowerCase().includes(query.toLowerCase())).map((page) => ({
    type: 'Page',
    ...page,
  }));

  // With nothing typed yet, just offer the pages
  if (!query) {
    return res.json({ results: pages });
  }

  const [students, batches, lectures, assignments] = await Promise.all([
    searchStudents(query),
    searchBatches(query),
    searchLectures(query),
    searchAssignments(query),
  ]);

  res.json({
    results: [
      ...students.map((student) => ({
        type: 'Student',
        title: student.name,
        detail: [student.username, student.email].filter(Boolean).join(' · '),
        url: `/admin/students#student-${student.id}`,
      })),
      ...batches.map((batch) => ({
        type: 'Batch',
        title: batch.name,
        detail: `${batch.student_count} ${batch.student_count === 1 ? 'student' : 'students'}`,
        url: `/admin/batches#batch-${batch.id}`,
      })),
      // Lectures and assignments have no pages yet (steps 9 and 10), so these open their batch for now
      ...lectures.map((lecture) => ({
        type: 'Lecture',
        title: lecture.title,
        detail: lecture.batch_name,
        date: lecture.starts_at,
        url: `/admin/batches#batch-${lecture.batch_id}`,
      })),
      ...assignments.map((assignment) => ({
        type: 'Assignment',
        title: assignment.title,
        detail: assignment.batch_name,
        date: assignment.due_at,
        url: `/admin/batches#batch-${assignment.batch_id}`,
      })),
      ...pages,
    ],
  });
});

module.exports = router;
