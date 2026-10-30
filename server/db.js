// Opens the SQLite database file and makes sure all tables exist.
// Other files get the database with: const db = require('./db');

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Where the database file lives (data/classnest.db by default)
const dbPath = path.resolve(__dirname, '..', process.env.DB_PATH || 'data/classnest.db');

// Create the data/ folder if it is missing, then open (or create) the file
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

// SQLite only checks links between tables (foreign keys) when this is on
db.pragma('foreign_keys = ON');

// "IF NOT EXISTS" means: create the table the first time, skip it after that.
// So restarting the server never wipes your data.
// Dates are saved as ISO text, e.g. 2026-10-30T14:00:00.000Z
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS batches (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    description TEXT,
    start_date  TEXT,
    created_at  TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    batch_id      INTEGER NOT NULL REFERENCES batches(id),
    created_at    TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lectures (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id         INTEGER NOT NULL REFERENCES batches(id),
    title            TEXT    NOT NULL,
    meet_link        TEXT    NOT NULL,
    starts_at        TEXT    NOT NULL,
    duration_minutes INTEGER NOT NULL,
    created_at       TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id    INTEGER NOT NULL REFERENCES batches(id),
    title       TEXT    NOT NULL,
    description TEXT,
    due_at      TEXT    NOT NULL,
    created_at  TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id),
    student_id    INTEGER NOT NULL REFERENCES students(id),
    file_path     TEXT    NOT NULL,
    original_name TEXT    NOT NULL,
    submitted_at  TEXT    NOT NULL,
    UNIQUE (assignment_id, student_id)
  );
`);

module.exports = db;
