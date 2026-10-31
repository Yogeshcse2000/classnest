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

const emailTakenMessage = (email) => `A student with the email ${email} already exists.`;

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
    return res.status(409).json({ error: emailTakenMessage(email) });
  }

  // Only the hash is saved. The plain password is sent back this one time so the admin can hand it over.
  const password = generateTempPassword();
  const passwordHash = await bcrypt.hash(password, 10);

  // Find a free username: priya.sharma, then priya.sharma2, priya.sharma3, ...
  // This comes after the slow hashing, and the database still has the final say, because two enrolls
  // can arrive together. If one takes a username first, the other simply moves on to the next number.
  const base = usernameBase(name);
  let username = base;
  let number = 2;
  while (true) {
    if (!(await usernameTaken(username))) {
      try {
        const id = await createStudent({ name, username, email, passwordHash, batchId });
        return res.status(201).json({
          student: await findStudentById(id),
          credentials: { username, password },
        });
      } catch (error) {
        if (error.duplicate === 'email') {
          return res.status(409).json({ error: emailTakenMessage(email) });
        }
        if (error.duplicate !== 'username') throw error;
      }
    }
    username = `${base}${number}`;
    number++;
  }
});

module.exports = router;
