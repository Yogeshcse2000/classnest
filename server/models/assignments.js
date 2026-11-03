// All SQL for the assignments table lives here.

const db = require('../db');

// Dates are all saved in the same ISO format, so sorting them as text gives the right order
const SELECT_ASSIGNMENT = `
  SELECT a.id, a.batch_id, b.name AS batch_name, a.title, a.description, a.due_at, a.created_at
  FROM assignments a
  JOIN batches b ON b.id = a.batch_id`;

// Every assignment, with how many students in its batch have handed in work
async function listAssignments() {
  const { rows } = await db.query(
    `SELECT a.id, a.batch_id, b.name AS batch_name, a.title, a.description, a.due_at, a.created_at,
            (SELECT COUNT(*) FROM students s WHERE s.batch_id = a.batch_id)::int AS student_count,
            (SELECT COUNT(*)
             FROM submissions su
             JOIN students s ON s.id = su.student_id
             WHERE su.assignment_id = a.id AND s.batch_id = a.batch_id)::int AS submitted_count
     FROM assignments a
     JOIN batches b ON b.id = a.batch_id
     ORDER BY a.due_at, a.id`
  );
  return rows;
}

// One batch's assignments, earliest deadline first
async function listBatchAssignments(batchId) {
  const { rows } = await db.query(`${SELECT_ASSIGNMENT} WHERE a.batch_id = $1 ORDER BY a.due_at, a.id`, [batchId]);
  return rows;
}

async function findAssignmentById(id) {
  const { rows } = await db.query(`${SELECT_ASSIGNMENT} WHERE a.id = $1`, [id]);
  return rows[0];
}

async function createAssignment({ batchId, title, description, dueAt }) {
  const { rows } = await db.query(
    'INSERT INTO assignments (batch_id, title, description, due_at, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [batchId, title, description, dueAt, new Date().toISOString()]
  );
  return rows[0].id;
}

async function updateAssignment(id, { batchId, title, description, dueAt }) {
  await db.query('UPDATE assignments SET batch_id = $1, title = $2, description = $3, due_at = $4 WHERE id = $5', [
    batchId,
    title,
    description,
    dueAt,
    id,
  ]);
}

// Students' work must never vanish by accident. If the database refuses because submissions still point at this
// assignment (Postgres error 23503), the error gets a "hasSubmissions" field, so routes never need to know about Postgres.
async function deleteAssignment(id) {
  try {
    await db.query('DELETE FROM assignments WHERE id = $1', [id]);
  } catch (error) {
    if (error.code === '23503') error.hasSubmissions = true;
    throw error;
  }
}

module.exports = {
  listAssignments,
  listBatchAssignments,
  findAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
};
