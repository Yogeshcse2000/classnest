// All SQL for the submissions table lives here.

const db = require('../db');

// is_late is saved as 0 or 1, so it becomes true or false before it leaves this file.
// Only safe columns are selected for pages: file_path never goes to the browser.
const withLate = (row) => (row ? { ...row, is_late: Boolean(row.is_late) } : row);

async function findSubmission(assignmentId, studentId) {
  const row = db
    .prepare('SELECT original_name, submitted_at, is_late FROM submissions WHERE assignment_id = ? AND student_id = ?')
    .get(assignmentId, studentId);
  return withLate(row);
}

// One student's submissions, for the dashboard. Each row says which assignment it belongs to.
async function listStudentSubmissions(studentId) {
  const rows = db.prepare('SELECT assignment_id, submitted_at, is_late FROM submissions WHERE student_id = ?').all(studentId);
  return rows.map(withLate);
}

// Saves a student's work. Each student has one row per assignment, so uploading again replaces that row.
// A transaction runs as one step: the old file name is read and the new one written with nothing in between,
// so two uploads at once can't lose track of a file. Gives back the old file's name, or null if this is the first upload.
// If the assignment was deleted during the upload, the error gets a "gone" field, so routes never need to know about SQLite.
const saveRow = db.transaction(({ assignmentId, studentId, filePath, originalName, submittedAt, isLate }) => {
  const old = db
    .prepare('SELECT file_path FROM submissions WHERE assignment_id = ? AND student_id = ?')
    .get(assignmentId, studentId);
  db.prepare(
    `INSERT INTO submissions (assignment_id, student_id, file_path, original_name, submitted_at, is_late)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (assignment_id, student_id) DO UPDATE SET
       file_path = excluded.file_path,
       original_name = excluded.original_name,
       submitted_at = excluded.submitted_at,
       is_late = excluded.is_late`
  ).run(assignmentId, studentId, filePath, originalName, submittedAt, isLate ? 1 : 0);
  return old ? old.file_path : null;
});

async function saveSubmission(submission) {
  try {
    return saveRow(submission);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') error.gone = true;
    throw error;
  }
}

async function countAssignmentSubmissions(assignmentId) {
  return db.prepare('SELECT COUNT(*) AS n FROM submissions WHERE assignment_id = ?').get(assignmentId).n;
}

// Every student in a batch with their work for one assignment. Students who haven't submitted have empty submission fields.
async function listAssignmentRoster(assignmentId, batchId) {
  const rows = db
    .prepare(
      `SELECT st.id, st.name, st.username, su.id AS submission_id, su.original_name, su.submitted_at, su.is_late
       FROM students st
       LEFT JOIN submissions su ON su.student_id = st.id AND su.assignment_id = ?
       WHERE st.batch_id = ?
       ORDER BY LOWER(st.name), st.id`
    )
    .all(assignmentId, batchId);
  return rows.map(withLate);
}

// The newest work across all batches, for the admin dashboard
async function listLatestSubmissions(limit) {
  const rows = db
    .prepare(
      `SELECT su.id, su.assignment_id, su.submitted_at, su.is_late, st.name AS student_name, a.title AS assignment_title
       FROM submissions su
       JOIN students st ON st.id = su.student_id
       JOIN assignments a ON a.id = su.assignment_id
       ORDER BY su.submitted_at DESC, su.id DESC
       LIMIT ?`
    )
    .all(limit);
  return rows.map(withLate);
}

// What a download needs. This is the only function that reads file_path for sending.
async function findSubmissionFile(id) {
  return db
    .prepare(
      `SELECT su.file_path, su.assignment_id, st.username, a.title AS assignment_title
       FROM submissions su
       JOIN students st ON st.id = su.student_id
       JOIN assignments a ON a.id = su.assignment_id
       WHERE su.id = ?`
    )
    .get(id);
}

module.exports = {
  findSubmission,
  listStudentSubmissions,
  saveSubmission,
  countAssignmentSubmissions,
  listAssignmentRoster,
  listLatestSubmissions,
  findSubmissionFile,
};
