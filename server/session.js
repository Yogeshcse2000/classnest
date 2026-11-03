// Login sessions. After login, the browser gets a cookie holding a random session ID.
// The server keeps what that ID means ("this is admin #1") in the sessions table,
// so people stay logged in even when the server restarts.

const session = require('express-session');
const db = require('./db');

const SESSION_COOKIE = 'classnest.sid';
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is missing. Add it to your .env file (see .env.example).');
}

function expiresAt(sess) {
  return sess.cookie && sess.cookie.expires ? new Date(sess.cookie.expires).getTime() : Date.now() + ONE_WEEK;
}

// Teaches express-session how to save, load and delete sessions in Postgres
class PostgresStore extends session.Store {
  get(sid, done) {
    db.query('SELECT data, expires_at FROM sessions WHERE sid = $1', [sid]).then(
      ({ rows }) => {
        const row = rows[0];
        done(null, row && Number(row.expires_at) > Date.now() ? JSON.parse(row.data) : null);
      },
      (err) => done(err)
    );
  }

  set(sid, sess, done = () => {}) {
    db.query(
      `INSERT INTO sessions (sid, data, expires_at) VALUES ($1, $2, $3)
       ON CONFLICT (sid) DO UPDATE SET data = EXCLUDED.data, expires_at = EXCLUDED.expires_at`,
      [sid, JSON.stringify(sess), expiresAt(sess)]
    ).then(() => done(null), (err) => done(err));
  }

  touch(sid, sess, done = () => {}) {
    db.query('UPDATE sessions SET expires_at = $1 WHERE sid = $2', [expiresAt(sess), sid]).then(
      () => done(null),
      (err) => done(err)
    );
  }

  destroy(sid, done = () => {}) {
    db.query('DELETE FROM sessions WHERE sid = $1', [sid]).then(() => done(null), (err) => done(err));
  }
}

// Remove expired sessions now and then every hour
function clearExpired() {
  db.query('DELETE FROM sessions WHERE expires_at <= $1', [Date.now()]).catch((err) =>
    console.error('Could not clear old sessions:', err.message)
  );
}
clearExpired();
setInterval(clearExpired, ONE_HOUR).unref();

// Logs a student out on every device, by removing their saved sessions. Who a session belongs to is inside its JSON,
// so it is read here in code. That keeps the SQL plain.
async function endStudentSessions(studentId) {
  const { rows } = await db.query('SELECT sid, data FROM sessions');
  for (const { sid, data } of rows) {
    const { user } = JSON.parse(data);
    if (user?.role === 'student' && user.id === studentId) await db.query('DELETE FROM sessions WHERE sid = $1', [sid]);
  }
}

const sessionMiddleware = session({
  name: SESSION_COOKIE,
  secret: process.env.SESSION_SECRET, // used to sign the cookie so it can't be faked
  store: new PostgresStore(),
  resave: false, // don't re-save a session that didn't change
  saveUninitialized: false, // only create a session once someone logs in
  cookie: {
    httpOnly: true, // page JavaScript can't read the cookie
    sameSite: 'lax', // other websites can't send it along with their requests
    secure: process.env.NODE_ENV === 'production', // HTTPS only once deployed
    maxAge: ONE_WEEK, // stay logged in for 7 days
  },
});

module.exports = { sessionMiddleware, SESSION_COOKIE, endStudentSessions };
