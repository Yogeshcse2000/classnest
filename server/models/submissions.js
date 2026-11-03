// All SQL for the submissions table lives here.

const db = require('../db');

// is_late is saved as 0 or 1, so it becomes true or false before it leaves this file.
// Only safe columns are selected for pages: file_path never goes to the browser.
const withLate = (row) => (row ? { ...row, is_late: Boolean(row.is_late) } : row);

async function findSubmission(assignmentId, studentId) {
  const { rows } = await db.query(
    'SELECT original_name, submitted_at, is_late FROM submissions WHERE assignment_id = $1 AND student_id = $2',
    [assignmentId, studentId]
  );
  return withLate(rows[0]);
}

// One student's submissions, for the dashboard. Each row says which assignment it belongs to.
async function listStudentSubmissions(studentId) {
  const { rows } = await db.query('SELECT assignment_id, submitted_at, is_late FROM submissions WHERE student_id = $1', [
    studentId,
  ]);
  return rows.map(withLate);
}

// Saves a student's work. Each student has one row per assignment, so uploading again replaces that row.
// A transaction runs as one step: the old file name is read and the new one written with nothing in between.
// The lock makes two uploads for the same student and assignment take turns, so no file is lost track of.
// Gives back the old file's name, or null if this is the first upload.
// If the assignment was deleted during the upload (Postgres error 23503), the error gets a "gone" field,
// so routes never need to know about Postgres.
async function saveSubmission({ assignmentId, studentId, filePath, originalName, submittedAt, isLate }) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1, $2)', [assignmentId, studentId]);
    const { rows } = await client.query(
      'SELECT file_path FROM submissions WHERE assignment_id = $1 AND student_id = $2',
      [assignmentId, studentId]
    );
    await client.query(
      `INSERT INTO submissions (assignment_id, student_id, file_path, original_name, submitted_at, is_late)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (assignment_id, student_id) DO UPDATE SET
         file_path = EXCLUDED.file_path,
         original_name = EXCLUDED.original_name,
         submitted_at = EXCLUDED.submitted_at,
         is_late = EXCLUDED.is_late`,
      [assignmentId, studentId, filePath, originalName, submittedAt, isLate ? 1 : 0]
    );
    await client.query('COMMIT');
    return rows[0] ? rows[0].file_path : null;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (error.code === '23503') error.gone = true;
    throw error;
  } finally {
    client.release();
  }
}

async function countAssignmentSubmissions(assignmentId) {
  const { rows } = await db.query('SELECT COUNT(*)::int AS n FROM submissions WHERE assignment_id = $1', [assignmentId]);
  return rows[0].n;
}

// Every student in a batch with their work for one assignment. Students who haven't submitted have empty submission fields.
async function listAssignmentRoster(assignmentId, batchId) {
  const { rows } = await db.query(
    `SELECT st.id, st.name, st.username, su.id AS submission_id, su.original_name, su.submitted_at, su.is_late
     FROM students st
     LEFT JOIN submissions su ON su.student_id = st.id AND su.assignment_id = $1
     WHERE st.batch_id = $2
     ORDER BY LOWER(st.name), st.id`,
    [assignmentId, batchId]
  );
  return rows.map(withLate);
}

// The newest work across all batches, for the admin dashboard
async function listLatestSubmissions(limit) {
  const { rows } = await db.query(
    `SELECT su.id, su.assignment_id, su.submitted_at, su.is_late, st.name AS student_name, a.title AS assignment_title
     FROM submissions su
     JOIN students st ON st.id = su.student_id
     JOIN assignments a ON a.id = su.assignment_id
     ORDER BY su.submitted_at DESC, su.id DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map(withLate);
}

// How much work has been handed in across all batches, for the admin dashboard
async function countSubmissions() {
  const { rows } = await db.query('SELECT COUNT(*)::int AS total, COALESCE(SUM(is_late), 0)::int AS late FROM submissions');
  return rows[0];
}

// What a download needs. This is the only function that reads file_path for sending.
async function findSubmissionFile(id) {
  const { rows } = await db.query(
    `SELECT su.file_path, su.assignment_id, st.username, a.title AS assignment_title
     FROM submissions su
     JOIN students st ON st.id = su.student_id
     JOIN assignments a ON a.id = su.assignment_id
     WHERE su.id = $1`,
    [id]
  );
  return rows[0];
}

module.exports = {
  findSubmission,
  listStudentSubmissions,
  saveSubmission,
  countAssignmentSubmissions,
  listAssignmentRoster,
  listLatestSubmissions,
  countSubmissions,
  findSubmissionFile,
};
