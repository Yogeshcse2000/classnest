// All SQL for the students table lives here.

const db = require('../db');

// Usernames are stored trimmed and lowercase, so "Priya " matches "priya"
function cleanUsername(username) {
  return String(username).trim().toLowerCase();
}

async function findStudentByUsername(username) {
  return db.prepare('SELECT * FROM students WHERE username = ?').get(cleanUsername(username));
}

module.exports = { findStudentByUsername };
