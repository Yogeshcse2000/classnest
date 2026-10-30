// All SQL for the batches table lives here.

const db = require('../db');

// Every batch, newest first, with how many students are in it
const SELECT_BATCH = `
  SELECT b.id, b.name, b.description, b.start_date, b.created_at,
         (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id) AS student_count
  FROM batches b`;

async function listBatches() {
  return db.prepare(`${SELECT_BATCH} ORDER BY b.id DESC`).all();
}

async function findBatchById(id) {
  return db.prepare(`${SELECT_BATCH} WHERE b.id = ?`).get(id);
}

// Case doesn't matter: "Web Dev" and "web dev" count as the same name
async function findBatchByName(name) {
  return db.prepare('SELECT id FROM batches WHERE LOWER(name) = LOWER(?)').get(name);
}

async function createBatch({ name, startDate, description }) {
  const result = db
    .prepare('INSERT INTO batches (name, description, start_date, created_at) VALUES (?, ?, ?, ?)')
    .run(name, description, startDate, new Date().toISOString());
  return result.lastInsertRowid;
}

// How many students, lectures and assignments still belong to this batch
async function countBatchLinks(id) {
  const count = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE batch_id = ?`).get(id).n;
  return { students: count('students'), lectures: count('lectures'), assignments: count('assignments') };
}

async function deleteBatch(id) {
  db.prepare('DELETE FROM batches WHERE id = ?').run(id);
}

module.exports = { listBatches, findBatchById, findBatchByName, createBatch, countBatchLinks, deleteBatch };
