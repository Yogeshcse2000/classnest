// All SQL for the admins table lives here.
// Functions are async so this file can later be swapped for Postgres
// without changing the code that calls it.

const db = require('../db');

// Emails are stored trimmed and lowercase, so "Admin@X.com " matches "admin@x.com"
function cleanEmail(email) {
  return String(email).trim().toLowerCase();
}

async function findAdminByEmail(email) {
  return db.prepare('SELECT * FROM admins WHERE email = ?').get(cleanEmail(email));
}

async function createAdmin({ name, email, passwordHash }) {
  const result = db
    .prepare('INSERT INTO admins (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)')
    .run(name, cleanEmail(email), passwordHash, new Date().toISOString());
  return result.lastInsertRowid;
}

module.exports = { findAdminByEmail, createAdmin };
