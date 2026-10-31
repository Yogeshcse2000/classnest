// Admin API routes for students' uploaded work. Mounted at /api/admin/submissions (admins only).
// This is the only way to get a file back out of the server, so only a logged-in admin can ever download one.

const express = require('express');
const { findSubmissionFile } = require('../../models/submissions');
const { sendFile } = require('../../storage');
const { toId } = require('../../utils/ids');

const router = express.Router();

// "Build a Landing Page!" -> "build-a-landing-page". A title with no English letters or numbers falls back to its ID.
function titleForFile(title, assignmentId) {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
  return words || `assignment-${assignmentId}`;
}

// GET /api/admin/submissions/:id/download - sends the .zip with a clean name like priya.sharma_landing-page.zip
router.get('/:id/download', async (req, res) => {
  const submission = await findSubmissionFile(toId(req.params.id));
  if (!submission) {
    return res.status(404).json({ error: 'That submission no longer exists.' });
  }

  const downloadName = `${submission.username}_${titleForFile(submission.assignment_title, submission.assignment_id)}.zip`;
  sendFile(res, submission.file_path, downloadName, (error) => {
    if (!error || res.headersSent) return; // sent, or stopped partway because the admin cancelled
    if (error.status !== 404) console.error(error.stack);
    res.status(404).json({ error: "That file can't be found on the server." });
  });
});

module.exports = router;
