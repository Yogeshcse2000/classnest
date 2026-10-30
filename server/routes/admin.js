// Admin-only API routes. Mounted at /api/admin behind requireRoleApi('admin'),
// so every route here already knows the visitor is a logged-in admin.

const express = require('express');

const router = express.Router();

// GET /api/admin/dashboard - data for the admin dashboard (just the name for now)
router.get('/dashboard', (req, res) => {
  res.json({ name: req.session.user.name });
});

router.use('/batches', require('./admin/batches')); // /api/admin/batches
router.use('/students', require('./admin/students')); // /api/admin/students

module.exports = router;
