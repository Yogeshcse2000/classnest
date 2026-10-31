// All SQL for the lectures table lives here.

const db = require('../db');

// Dates are all saved in the same ISO format, so sorting and comparing them as text gives the right order
const SELECT_LECTURE = `
  SELECT l.id, l.batch_id, b.name AS batch_name, l.title, l.meet_link, l.starts_at, l.duration_minutes, l.created_at
  FROM lectures l
  JOIN batches b ON b.id = l.batch_id`;

async function listLectures() {
  return db.prepare(`${SELECT_LECTURE} ORDER BY l.starts_at, l.id`).all();
}

// One batch's lectures, earliest first
async function listBatchLectures(batchId) {
  return db.prepare(`${SELECT_LECTURE} WHERE l.batch_id = ? ORDER BY l.starts_at, l.id`).all(batchId);
}

async function findLectureById(id) {
  return db.prepare(`${SELECT_LECTURE} WHERE l.id = ?`).get(id);
}

async function countLectures() {
  return db.prepare('SELECT COUNT(*) AS n FROM lectures').get().n;
}

// The first lecture that starts after this moment
async function findNextLecture(after) {
  return db.prepare(`${SELECT_LECTURE} WHERE l.starts_at > ? ORDER BY l.starts_at, l.id LIMIT 1`).get(after);
}

async function createLecture({ batchId, title, meetLink, startsAt, durationMinutes }) {
  const result = db
    .prepare(
      'INSERT INTO lectures (batch_id, title, meet_link, starts_at, duration_minutes, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(batchId, title, meetLink, startsAt, durationMinutes, new Date().toISOString());
  return result.lastInsertRowid;
}

async function updateLecture(id, { batchId, title, meetLink, startsAt }) {
  db.prepare('UPDATE lectures SET batch_id = ?, title = ?, meet_link = ?, starts_at = ? WHERE id = ?').run(
    batchId,
    title,
    meetLink,
    startsAt,
    id
  );
}

async function deleteLecture(id) {
  db.prepare('DELETE FROM lectures WHERE id = ?').run(id);
}

module.exports = {
  listLectures,
  listBatchLectures,
  findLectureById,
  countLectures,
  findNextLecture,
  createLecture,
  updateLecture,
  deleteLecture,
};
