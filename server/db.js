// Connects to the Supabase Postgres database and makes sure all tables exist.
// Other files get the database with: const db = require('./db');
// and then run SQL with: await db.query('SELECT ... WHERE id = $1', [id]);

const { Pool } = require('pg');

// The address (with password) of the database. It lives in .env only and is never printed or logged.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is missing. Add it to your .env file (see .env.example).');
  process.exit(1);
}

// Supabase needs an encrypted connection. A database on your own computer does not.
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 5,
  allowExitOnIdle: true, // lets the seed scripts finish instead of waiting for idle connections
});

// An idle connection can drop (for example when the internet blips). Log only the message, never the address.
pool.on('error', (error) => console.error('Database connection problem:', error.message));

// "IF NOT EXISTS" means: create the table the first time, skip it after that.
// So restarting the server never wipes your data.
// Dates are saved as ISO text, e.g. 2026-10-30T14:00:00.000Z, so sorting them as text gives the right order.
// is_late is 0 or 1. expires_at is a time in milliseconds, which is why it needs BIGINT.
const ready = pool
  .query(
    `
  CREATE TABLE IF NOT EXISTS admins (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS batches (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    start_date  TEXT,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    username      TEXT NOT NULL UNIQUE,
    email         TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    batch_id      INTEGER NOT NULL REFERENCES batches(id),
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lectures (
    id               SERIAL PRIMARY KEY,
    batch_id         INTEGER NOT NULL REFERENCES batches(id),
    title            TEXT NOT NULL,
    meet_link        TEXT NOT NULL,
    starts_at        TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    created_at       TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id          SERIAL PRIMARY KEY,
    batch_id    INTEGER NOT NULL REFERENCES batches(id),
    title       TEXT NOT NULL,
    description TEXT,
    due_at      TEXT NOT NULL,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id            SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id),
    student_id    INTEGER NOT NULL REFERENCES students(id),
    file_path     TEXT NOT NULL,
    original_name TEXT NOT NULL,
    submitted_at  TEXT NOT NULL,
    is_late       INTEGER NOT NULL DEFAULT 0,
    UNIQUE (assignment_id, student_id)
  );

  -- Who is logged in
  CREATE TABLE IF NOT EXISTS sessions (
    sid        TEXT   PRIMARY KEY,
    data       TEXT   NOT NULL,
    expires_at BIGINT NOT NULL
  );
`
  )
  .catch((error) => {
    console.error('Could not set up the database:', error.message);
    console.error('Check that DATABASE_URL in your .env file is correct.');
    process.exit(1);
  });

// Runs one SQL statement once the tables exist. $1, $2 ... in the text are filled from the params list.
// Gives back the usual pg result: result.rows is the list of rows, result.rowCount how many were changed.
async function query(text, params) {
  await ready;
  return pool.query(text, params);
}

// For steps that must run together as one unit (a transaction): gives back a connection to use, then release() it.
async function getClient() {
  await ready;
  return pool.connect();
}

module.exports = { query, getClient, ready };
