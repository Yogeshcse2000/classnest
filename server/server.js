// Load settings from the .env file into process.env
require('dotenv').config({ quiet: true });

const path = require('path');
const express = require('express');

// Open the database (creates data/classnest.db and the tables on first run)
require('./db');

const { sessionMiddleware } = require('./session');
const { dashboards, requireRoleApi, requireRolePage } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');

// Once deployed behind a hosting service's proxy, trust it so secure cookies work
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(express.json()); // read JSON sent by the browser into req.body
app.use(sessionMiddleware); // read the login cookie into req.session

// ---------- API routes ----------

// A tiny API route to check that the server is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'ClassNest' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', requireRoleApi('admin'), adminRoutes);
app.use('/api/student', requireRoleApi('student'), studentRoutes);

// Any other /api address doesn't exist
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

// ---------- Pages ----------

// Login page: if already logged in, skip straight to the dashboard
app.get(['/', '/index.html'], (req, res, next) => {
  if (req.session.user) {
    return res.redirect(dashboards[req.session.user.role]);
  }
  next();
});

// Protected pages live in pages/ (not public/), so the only way to reach them is through these guards.
// extensions: ['html'] lets /admin/dashboard open dashboard.html
const pageOptions = { extensions: ['html'], index: 'dashboard.html' };
app.use('/admin', requireRolePage('admin'), express.static(path.join(ROOT, 'pages', 'admin'), pageOptions));
app.use('/student', requireRolePage('student'), express.static(path.join(ROOT, 'pages', 'student'), pageOptions));

// Everything in public/ (login page, CSS, JS) is open to everyone
app.use(express.static(path.join(ROOT, 'public')));

// Short messages for requests the server can't accept
const REQUEST_ERRORS = {
  400: 'That request could not be read. Please try again.',
  413: 'That request is too big.',
};

// Sends a short, friendly error. A 4xx error means the request was bad, so the server has nothing to log.
// Only the stack trace is logged, never the whole error: it can hold the request body, and so a password.
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode;
  if (status >= 400 && status < 500) {
    return res.status(status).json({ error: REQUEST_ERRORS[status] || 'That request could not be processed.' });
  }
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server. Please try again.' });
});

// Start listening for requests.
// Express also calls this when starting fails, so check for an error before saying the server is running.
app.listen(PORT, (error) => {
  if (error?.code === 'EADDRINUSE') {
    console.error(`ClassNest did NOT start: port ${PORT} is already in use.`);
    console.error('Another copy of the server is probably still running, and it is using your old code.');
    console.error('Press Ctrl+C in that terminal to stop it, then start the server again.');
    process.exit(1);
  }
  if (error) {
    console.error('ClassNest did NOT start:', error.message);
    process.exit(1);
  }
  console.log(`ClassNest is running at http://localhost:${PORT}`);
});
