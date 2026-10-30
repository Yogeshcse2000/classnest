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
app.get('/', (req, res, next) => {
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

// If something breaks inside a route, log it and send a friendly error
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server. Please try again.' });
});

// Start listening for requests
app.listen(PORT, () => {
  console.log(`ClassNest is running at http://localhost:${PORT}`);
});
