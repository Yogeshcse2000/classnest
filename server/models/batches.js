// All SQL for the batches table lives here.

const db = require('../db');

// Every batch, newest first, with how many students, lectures and assignments are in it
const SELECT_BATCH = `
  SELECT b.id, b.name, b.description, b.start_date, b.created_at,
         (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id)::int AS student_count,
         (SELECT COUNT(*) FROM lectures l WHERE l.batch_id = b.id)::int AS lecture_count,
         (SELECT COUNT(*) FROM assignments a WHERE a.batch_id = b.id)::int AS assignment_count
  FROM batches b`;

async function listBatches() {
  const { rows } = await db.query(`${SELECT_BATCH} ORDER BY b.id DESC`);
  return rows;
}

async function findBatchById(id) {
  const { rows } = await db.query(`${SELECT_BATCH} WHERE b.id = $1`, [id]);
  return rows[0];
}

// Case doesn't matter: "Web Dev" and "web dev" count as the same name
async function findBatchByName(name) {
  const { rows } = await db.query('SELECT id FROM batches WHERE LOWER(name) = LOWER($1)', [name]);
  return rows[0];
}

async function createBatch({ name, startDate, description }) {
  const { rows } = await db.query(
    'INSERT INTO batches (name, description, start_date, created_at) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, description, startDate, new Date().toISOString()]
  );
  return rows[0].id;
}

// How many students, lectures and assignments still belong to this batch
async function countBatchLinks(id) {
  const count = async (table) => {
    const { rows } = await db.query(`SELECT COUNT(*)::int AS n FROM ${table} WHERE batch_id = $1`, [id]);
    return rows[0].n;
  };
  return { students: await count('students'), lectures: await count('lectures'), assignments: await count('assignments') };
}

async function deleteBatch(id) {
  await db.query('DELETE FROM batches WHERE id = $1', [id]);
}

module.exports = { listBatches, findBatchById, findBatchByName, createBatch, countBatchLinks, deleteBatch };
