// All SQL for the students table lives here.

const db = require('../db');

// Usernames and emails are stored trimmed and lowercase, so "Priya " matches "priya"
function clean(value) {
  return String(value).trim().toLowerCase();
}

// The columns that are safe to send to the browser (never the password hash)
const SELECT_STUDENT = `
  SELECT s.id, s.name, s.username, s.email, s.batch_id, b.name AS batch_name, s.created_at
  FROM students s
  JOIN batches b ON b.id = s.batch_id`;

async function findStudentByUsername(username) {
  return db.prepare('SELECT * FROM students WHERE username = ?').get(clean(username));
}

async function findStudentByEmail(email) {
  return db.prepare('SELECT id FROM students WHERE email = ?').get(clean(email));
}

async function usernameTaken(username) {
  return Boolean(db.prepare('SELECT 1 FROM students WHERE username = ?').get(clean(username)));
}

async function listStudents() {
  return db.prepare(`${SELECT_STUDENT} ORDER BY s.id DESC`).all();
}

async function findStudentById(id) {
  return db.prepare(`${SELECT_STUDENT} WHERE s.id = ?`).get(id);
}

// The database's unique rules have the final say. If they refuse this student, the error
// gets a "duplicate" field saying what clashed ('email' or 'username'), so routes never need to know about SQLite.
async function createStudent({ name, username, email, passwordHash, batchId }) {
  try {
    const result = db
      .prepare(
        'INSERT INTO students (name, username, email, password_hash, batch_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(name, clean(username), clean(email), passwordHash, batchId, new Date().toISOString());
    return result.lastInsertRowid;
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      error.duplicate = error.message.includes('students.email') ? 'email' : 'username';
    }
    throw error;
  }
}

module.exports = {
  findStudentByUsername,
  findStudentByEmail,
  usernameTaken,
  listStudents,
  findStudentById,
  createStudent,
};
