// All SQL for the Ctrl+K search lives here.
// These functions only read (SELECT). They never change any data.

const db = require('../db');

const MAX_RESULTS = 5; // the most results in each group
const MAX_QUERY_LENGTH = 80;

// What the visitor typed, made safe to use. Anything that isn't plain text counts as an empty search.
function cleanQuery(value) {
  return typeof value === 'string' ? value.trim().slice(0, MAX_QUERY_LENGTH) : '';
}

// In LIKE, % and _ are wildcards. Escape them, so typing "100%" looks for exactly that.
function contains(query) {
  return `%${query.replace(/[\\%_]/g, '\\$&')}%`;
}

const SELECT_LECTURE = `
  SELECT l.id, l.title, l.starts_at, l.batch_id, b.name AS batch_name
  FROM lectures l
  JOIN batches b ON b.id = l.batch_id`;

const SELECT_ASSIGNMENT = `
  SELECT a.id, a.title, a.due_at, a.batch_id, b.name AS batch_name
  FROM assignments a
  JOIN batches b ON b.id = a.batch_id`;

// Only the columns search needs (never the password hash)
async function searchStudents(query) {
  const text = contains(query);
  return db
    .prepare(
      `SELECT id, name, username, email
       FROM students
       WHERE name LIKE ? ESCAPE '\\' OR username LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\'
       ORDER BY name
       LIMIT ?`
    )
    .all(text, text, text, MAX_RESULTS);
}

async function searchBatches(query) {
  return db
    .prepare(
      `SELECT b.id, b.name, (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id) AS student_count
       FROM batches b
       WHERE b.name LIKE ? ESCAPE '\\'
       ORDER BY b.name
       LIMIT ?`
    )
    .all(contains(query), MAX_RESULTS);
}

// Admins: lectures from every batch
async function searchLectures(query) {
  return db
    .prepare(`${SELECT_LECTURE} WHERE l.title LIKE ? ESCAPE '\\' ORDER BY l.starts_at DESC LIMIT ?`)
    .all(contains(query), MAX_RESULTS);
}

// Admins: assignments from every batch
async function searchAssignments(query) {
  return db
    .prepare(`${SELECT_ASSIGNMENT} WHERE a.title LIKE ? ESCAPE '\\' ORDER BY a.due_at DESC LIMIT ?`)
    .all(contains(query), MAX_RESULTS);
}

// Students: only the lectures of one batch
async function searchBatchLectures(query, batchId) {
  return db
    .prepare(`${SELECT_LECTURE} WHERE l.batch_id = ? AND l.title LIKE ? ESCAPE '\\' ORDER BY l.starts_at DESC LIMIT ?`)
    .all(batchId, contains(query), MAX_RESULTS);
}

// Students: only the assignments of one batch
async function searchBatchAssignments(query, batchId) {
  return db
    .prepare(`${SELECT_ASSIGNMENT} WHERE a.batch_id = ? AND a.title LIKE ? ESCAPE '\\' ORDER BY a.due_at DESC LIMIT ?`)
    .all(batchId, contains(query), MAX_RESULTS);
}

module.exports = {
  cleanQuery,
  searchStudents,
  searchBatches,
  searchLectures,
  searchAssignments,
  searchBatchLectures,
  searchBatchAssignments,
};
