// Admin API routes for students. Mounted at /api/admin/students (admins only).

const express = require('express');
const bcrypt = require('bcryptjs');
const {
  listStudents,
  findStudentById,
  findStudentByEmail,
  usernameTaken,
  createStudent,
} = require('../../models/students');
const { findBatchById } = require('../../models/batches');
const { usernameBase, generateTempPassword } = require('../../utils/credentials');

const router = express.Router();

// Trimmed text, or '' if the value isn't text
const text = (value) => (typeof value === 'string' ? value.trim() : '');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/admin/students - all students, newest first
router.get('/', async (req, res) => {
  res.json({ students: await listStudents() });
});

// POST /api/admin/students  body: { name, email, batchId }
// Creates the student with an automatic username and temporary password.
router.post('/', async (req, res) => {
  const body = req.body || {};
  const name = text(body.name);
  const email = text(body.email).toLowerCase();
  const batchId = Number(body.batchId);

  if (!name) {
    return res.status(400).json({ error: "Please enter the student's name." });
  }
  if (name.length > 80) {
    return res.status(400).json({ error: 'The name is too long (80 characters max).' });
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Please enter a valid email address, like priya@example.com.' });
  }
  if (!Number.isInteger(batchId) || !(await findBatchById(batchId))) {
    return res.status(400).json({ error: 'Please choose a batch.' });
  }
  if (await findStudentByEmail(email)) {
    return res.status(409).json({ error: `A student with the email ${email} already exists.` });
  }

  // Find a free username: priya.sharma, then priya.sharma2, priya.sharma3, ...
  const base = usernameBase(name);
  let username = base;
  let number = 2;
  while (await usernameTaken(username)) {
    username = `${base}${number}`;
    number++;
  }

  // Only the hash is saved. The plain password is sent back this one time so the admin can hand it over.
  const password = generateTempPassword();
  const passwordHash = await bcrypt.hash(password, 10);
  const id = await createStudent({ name, username, email, passwordHash, batchId });

  res.status(201).json({
    student: await findStudentById(id),
    credentials: { username, password },
  });
});

module.exports = router;
