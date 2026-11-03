// All SQL for the lectures table lives here.

const db = require('../db');

// Dates are all saved in the same ISO format, so sorting and comparing them as text gives the right order
const SELECT_LECTURE = `
  SELECT l.id, l.batch_id, b.name AS batch_name, l.title, l.meet_link, l.starts_at, l.duration_minutes, l.created_at
  FROM lectures l
  JOIN batches b ON b.id = l.batch_id`;

async function listLectures() {
  const { rows } = await db.query(`${SELECT_LECTURE} ORDER BY l.starts_at, l.id`);
  return rows;
}

// One batch's lectures, earliest first
async function listBatchLectures(batchId) {
  const { rows } = await db.query(`${SELECT_LECTURE} WHERE l.batch_id = $1 ORDER BY l.starts_at, l.id`, [batchId]);
  return rows;
}

async function findLectureById(id) {
  const { rows } = await db.query(`${SELECT_LECTURE} WHERE l.id = $1`, [id]);
  return rows[0];
}

async function createLecture({ batchId, title, meetLink, startsAt, durationMinutes }) {
  const { rows } = await db.query(
    `INSERT INTO lectures (batch_id, title, meet_link, starts_at, duration_minutes, created_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [batchId, title, meetLink, startsAt, durationMinutes, new Date().toISOString()]
  );
  return rows[0].id;
}

async function updateLecture(id, { batchId, title, meetLink, startsAt }) {
  await db.query('UPDATE lectures SET batch_id = $1, title = $2, meet_link = $3, starts_at = $4 WHERE id = $5', [
    batchId,
    title,
    meetLink,
    startsAt,
    id,
  ]);
}

async function deleteLecture(id) {
  await db.query('DELETE FROM lectures WHERE id = $1', [id]);
}

module.exports = {
  listLectures,
  listBatchLectures,
  findLectureById,
  createLecture,
  updateLecture,
  deleteLecture,
};
