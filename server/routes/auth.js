// API routes for logging in and out. Mounted at /api/auth

const express = require('express');
const bcrypt = require('bcryptjs');
const { findAdminByEmail } = require('../models/admins');
const { findStudentByUsername } = require('../models/students');
const { dashboards } = require('../middleware/auth');
const { SESSION_COOKIE } = require('../session');

const router = express.Router();

// POST /api/auth/login  body: { role, identifier, password }
// identifier is the email for admins and the username for students
router.post('/login', async (req, res) => {
  const { role, identifier, password } = req.body || {};

  if (role !== 'admin' && role !== 'student') {
    return res.status(400).json({ error: 'Please choose Admin or Student.' });
  }
  if (typeof identifier !== 'string' || typeof password !== 'string' || !identifier.trim() || !password.trim()) {
    return res.status(400).json({ error: 'Please fill in both fields.' });
  }

  const account = role === 'admin' ? await findAdminByEmail(identifier) : await findStudentByUsername(identifier);

  // bcrypt hashes the typed password and checks it against the saved hash.
  // trim() removes spaces around it, which easily sneak in when copying and pasting.
  const passwordOk = account ? await bcrypt.compare(password.trim(), account.password_hash) : false;

  if (!passwordOk) {
    // Same message either way, so nobody can find out which emails/usernames exist
    const what = role === 'admin' ? 'email' : 'username';
    return res.status(401).json({ error: `Wrong ${what} or password. Please try again.` });
  }

  // Start a brand-new session (new ID) so an old cookie can't be reused
  await new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
  req.session.user = { id: account.id, name: account.name, role };

  res.json({ user: req.session.user, redirect: dashboards[role] });
});

// POST /api/auth/logout - ends the session and removes the cookie
router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie(SESSION_COOKIE);
    res.json({ redirect: '/' });
  });
});

// GET /api/auth/me - who is logged in right now?
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in.' });
  }
  res.json({ user: req.session.user });
});

module.exports = router;
