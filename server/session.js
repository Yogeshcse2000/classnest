// Login sessions. After login, the browser gets a cookie holding a random session ID.
// The server keeps what that ID means ("this is admin #1") in the sessions table,
// so people stay logged in even when the server restarts.
// When moving to Postgres, replace SQLiteStore with the "connect-pg-simple" package.

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

// Teaches express-session how to save, load and delete sessions in SQLite
class SQLiteStore extends session.Store {
  get(sid, done) {
    try {
      const row = db.prepare('SELECT data, expires_at FROM sessions WHERE sid = ?').get(sid);
      done(null, row && row.expires_at > Date.now() ? JSON.parse(row.data) : null);
    } catch (err) {
      done(err);
    }
  }

  set(sid, sess, done = () => {}) {
    try {
      db.prepare(
        `INSERT INTO sessions (sid, data, expires_at) VALUES (?, ?, ?)
         ON CONFLICT (sid) DO UPDATE SET data = excluded.data, expires_at = excluded.expires_at`
      ).run(sid, JSON.stringify(sess), expiresAt(sess));
      done(null);
    } catch (err) {
      done(err);
    }
  }

  touch(sid, sess, done = () => {}) {
    try {
      db.prepare('UPDATE sessions SET expires_at = ? WHERE sid = ?').run(expiresAt(sess), sid);
      done(null);
    } catch (err) {
      done(err);
    }
  }

  destroy(sid, done = () => {}) {
    try {
      db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
      done(null);
    } catch (err) {
      done(err);
    }
  }
}

// Remove expired sessions now and then every hour
function clearExpired() {
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
}
clearExpired();
setInterval(clearExpired, ONE_HOUR).unref();

// Logs a student out on every device, by removing their saved sessions. Who a session belongs to is inside its JSON,
// so it is read here in code. That keeps the SQL plain, for the move to Postgres.
function endStudentSessions(studentId) {
  const remove = db.prepare('DELETE FROM sessions WHERE sid = ?');
  for (const { sid, data } of db.prepare('SELECT sid, data FROM sessions').all()) {
    const { user } = JSON.parse(data);
    if (user?.role === 'student' && user.id === studentId) remove.run(sid);
  }
}

const sessionMiddleware = session({
  name: SESSION_COOKIE,
  secret: process.env.SESSION_SECRET, // used to sign the cookie so it can't be faked
  store: new SQLiteStore(),
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
