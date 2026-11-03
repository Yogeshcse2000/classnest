// All SQL for the admins table lives here.
// Functions are async, so the code that calls them does not care which database is behind them.

const db = require('../db');

// Emails are stored trimmed and lowercase, so "Admin@X.com " matches "admin@x.com"
function cleanEmail(email) {
  return String(email).trim().toLowerCase();
}

async function findAdminByEmail(email) {
  const { rows } = await db.query('SELECT * FROM admins WHERE email = $1', [cleanEmail(email)]);
  return rows[0];
}

async function createAdmin({ name, email, passwordHash }) {
  const { rows } = await db.query(
    'INSERT INTO admins (name, email, password_hash, created_at) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, cleanEmail(email), passwordHash, new Date().toISOString()]
  );
  return rows[0].id;
}

module.exports = { findAdminByEmail, createAdmin };
