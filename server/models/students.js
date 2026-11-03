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
  const { rows } = await db.query('SELECT * FROM students WHERE username = $1', [clean(username)]);
  return rows[0];
}

async function findStudentByEmail(email) {
  const { rows } = await db.query('SELECT id FROM students WHERE email = $1', [clean(email)]);
  return rows[0];
}

async function usernameTaken(username) {
  const { rows } = await db.query('SELECT 1 FROM students WHERE username = $1', [clean(username)]);
  return rows.length > 0;
}

async function listStudents() {
  const { rows } = await db.query(`${SELECT_STUDENT} ORDER BY s.id DESC`);
  return rows;
}

async function countStudents() {
  const { rows } = await db.query('SELECT COUNT(*)::int AS n FROM students');
  return rows[0].n;
}

// created_at is saved in one ISO format, so comparing it as text gives the right answer
async function countStudentsSince(date) {
  const { rows } = await db.query('SELECT COUNT(*)::int AS n FROM students WHERE created_at >= $1', [date]);
  return rows[0].n;
}

async function findStudentById(id) {
  const { rows } = await db.query(`${SELECT_STUDENT} WHERE s.id = $1`, [id]);
  return rows[0];
}

// The database's unique rules have the final say. If they refuse this student (Postgres error 23505), the error
// gets a "duplicate" field saying what clashed ('email' or 'username'), so routes never need to know about Postgres.
async function createStudent({ name, username, email, passwordHash, batchId }) {
  try {
    const { rows } = await db.query(
      `INSERT INTO students (name, username, email, password_hash, batch_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [name, clean(username), clean(email), passwordHash, batchId, new Date().toISOString()]
    );
    return rows[0].id;
  } catch (error) {
    if (error.code === '23505') {
      error.duplicate = String(error.constraint).includes('email') ? 'email' : 'username';
    }
    throw error;
  }
}

async function updateStudentPassword(id, passwordHash) {
  await db.query('UPDATE students SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
}

module.exports = {
  findStudentByUsername,
  findStudentByEmail,
  usernameTaken,
  listStudents,
  countStudents,
  countStudentsSince,
  findStudentById,
  createStudent,
  updateStudentPassword,
};
