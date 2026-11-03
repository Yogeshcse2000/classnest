// All SQL for the Ctrl+K search lives here.
// These functions only read (SELECT). They never change any data.

const db = require('../db');

const MAX_RESULTS = 5; // the most results in each group
const MAX_QUERY_LENGTH = 80;

// What the visitor typed, made safe to use. Anything that isn't plain text counts as an empty search.
function cleanQuery(value) {
  return typeof value === 'string' ? value.trim().slice(0, MAX_QUERY_LENGTH) : '';
}

// In ILIKE (a search that ignores capital letters), % and _ are wildcards. Escape them, so typing "100%" looks for exactly that.
function contains(query) {
  return `%${query.replace(/[\\%_]/g, '\\$&')}%`;
}

const SELECT_LECTURE = `
  SELECT l.id, l.title, l.starts_at, l.duration_minutes, l.batch_id, b.name AS batch_name
  FROM lectures l
  JOIN batches b ON b.id = l.batch_id`;

const SELECT_ASSIGNMENT = `
  SELECT a.id, a.title, a.due_at, a.batch_id, b.name AS batch_name
  FROM assignments a
  JOIN batches b ON b.id = a.batch_id`;

// Only the columns search needs (never the password hash)
async function searchStudents(query) {
  const { rows } = await db.query(
    `SELECT id, name, username, email
     FROM students
     WHERE name ILIKE $1 ESCAPE '\\' OR username ILIKE $1 ESCAPE '\\' OR email ILIKE $1 ESCAPE '\\'
     ORDER BY name
     LIMIT $2`,
    [contains(query), MAX_RESULTS]
  );
  return rows;
}

async function searchBatches(query) {
  const { rows } = await db.query(
    `SELECT b.id, b.name, (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id)::int AS student_count
     FROM batches b
     WHERE b.name ILIKE $1 ESCAPE '\\'
     ORDER BY b.name
     LIMIT $2`,
    [contains(query), MAX_RESULTS]
  );
  return rows;
}

// Admins: lectures from every batch
async function searchLectures(query) {
  const { rows } = await db.query(
    `${SELECT_LECTURE} WHERE l.title ILIKE $1 ESCAPE '\\' ORDER BY l.starts_at DESC LIMIT $2`,
    [contains(query), MAX_RESULTS]
  );
  return rows;
}

// Admins: assignments from every batch
async function searchAssignments(query) {
  const { rows } = await db.query(
    `${SELECT_ASSIGNMENT} WHERE a.title ILIKE $1 ESCAPE '\\' ORDER BY a.due_at DESC LIMIT $2`,
    [contains(query), MAX_RESULTS]
  );
  return rows;
}

// Students: only the lectures of one batch
async function searchBatchLectures(query, batchId) {
  const { rows } = await db.query(
    `${SELECT_LECTURE} WHERE l.batch_id = $1 AND l.title ILIKE $2 ESCAPE '\\' ORDER BY l.starts_at DESC LIMIT $3`,
    [batchId, contains(query), MAX_RESULTS]
  );
  return rows;
}

// Students: only the assignments of one batch
async function searchBatchAssignments(query, batchId) {
  const { rows } = await db.query(
    `${SELECT_ASSIGNMENT} WHERE a.batch_id = $1 AND a.title ILIKE $2 ESCAPE '\\' ORDER BY a.due_at DESC LIMIT $3`,
    [batchId, contains(query), MAX_RESULTS]
  );
  return rows;
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
