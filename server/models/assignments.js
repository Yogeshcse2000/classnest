// All SQL for the assignments table lives here.

const db = require('../db');

// Dates are all saved in the same ISO format, so sorting them as text gives the right order
const SELECT_ASSIGNMENT = `
  SELECT a.id, a.batch_id, b.name AS batch_name, a.title, a.description, a.due_at, a.created_at
  FROM assignments a
  JOIN batches b ON b.id = a.batch_id`;

// Every assignment, with how many students in its batch have handed in work
async function listAssignments() {
  return db
    .prepare(
      `SELECT a.id, a.batch_id, b.name AS batch_name, a.title, a.description, a.due_at, a.created_at,
              (SELECT COUNT(*) FROM students s WHERE s.batch_id = a.batch_id) AS student_count,
              (SELECT COUNT(*)
               FROM submissions su
               JOIN students s ON s.id = su.student_id
               WHERE su.assignment_id = a.id AND s.batch_id = a.batch_id) AS submitted_count
       FROM assignments a
       JOIN batches b ON b.id = a.batch_id
       ORDER BY a.due_at, a.id`
    )
    .all();
}

// One batch's assignments, earliest deadline first
async function listBatchAssignments(batchId) {
  return db.prepare(`${SELECT_ASSIGNMENT} WHERE a.batch_id = ? ORDER BY a.due_at, a.id`).all(batchId);
}

async function findAssignmentById(id) {
  return db.prepare(`${SELECT_ASSIGNMENT} WHERE a.id = ?`).get(id);
}

async function createAssignment({ batchId, title, description, dueAt }) {
  const result = db
    .prepare('INSERT INTO assignments (batch_id, title, description, due_at, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(batchId, title, description, dueAt, new Date().toISOString());
  return result.lastInsertRowid;
}

async function updateAssignment(id, { batchId, title, description, dueAt }) {
  db.prepare('UPDATE assignments SET batch_id = ?, title = ?, description = ?, due_at = ? WHERE id = ?').run(
    batchId,
    title,
    description,
    dueAt,
    id
  );
}

// Students' work must never vanish by accident. If the database refuses because submissions still point at this
// assignment, the error gets a "hasSubmissions" field, so routes never need to know about SQLite.
async function deleteAssignment(id) {
  try {
    db.prepare('DELETE FROM assignments WHERE id = ?').run(id);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') error.hasSubmissions = true;
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
