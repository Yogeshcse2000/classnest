// Dates and times. The database always keeps UTC, the world's standard clock, as ISO text: 2026-10-30T14:00:00.000Z
// Admins type India time (IST), which is always 5 hours 30 minutes ahead of UTC. India has no daylight saving,
// so that gap never changes. All time checks use the server's clock (Date.now()), never the browser's.

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const IST_OFFSET_MINUTES = 330;

// A UTC date from the database -> India time for a date-and-time box, like "2026-10-30T19:30"
function utcToIst(utc) {
  return new Date(new Date(utc).getTime() + IST_OFFSET_MINUTES * MINUTE).toISOString().slice(0, 16);
}

// India time from a date-and-time box -> UTC for the database. Gives null if it isn't a real date and time.
function istToUtc(value) {
  if (!/^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+05:30`);
  if (Number.isNaN(date.getTime())) return null;
  const utc = date.toISOString();
  return utcToIst(utc) === value ? utc : null; // otherwise 31 Feb would quietly become 3 March
}

// Today's date in India, like "2026-10-30"
function istToday(now) {
  return utcToIst(new Date(now).toISOString()).slice(0, 10);
}

// Upcoming before the start time, Live now until the lecture's length has passed, then Done
function lectureStatus(startsAt, durationMinutes, now) {
  const start = new Date(startsAt).getTime();
  if (now < start) return 'Upcoming';
  return now < start + durationMinutes * MINUTE ? 'Live now' : 'Done';
}

// 'closed' after the deadline, 'soon' within the last 24 hours, otherwise 'open'
function deadlineStatus(dueAt, now) {
  const timeLeft = new Date(dueAt).getTime() - now;
  if (timeLeft <= 0) return 'closed';
  return timeLeft <= DAY ? 'soon' : 'open';
}

// Whole minutes until the deadline, and never below 0
function minutesLeft(dueAt, now) {
  return Math.max(0, Math.floor((new Date(dueAt).getTime() - now) / MINUTE));
}

// Late means uploaded after the deadline, by the server's clock
function isLate(dueAt, now) {
  return now > new Date(dueAt).getTime();
}

// The words shown for a student's work on an assignment. submittedAt is empty if they haven't handed anything in.
function submissionStatus(submittedAt, late) {
  if (!submittedAt) return 'Not submitted';
  return late ? 'Late' : 'Submitted';
}

module.exports = { utcToIst, istToUtc, istToday, lectureStatus, deadlineStatus, minutesLeft, isLate, submissionStatus };
