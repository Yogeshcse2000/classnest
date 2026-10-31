// Admin API routes for lectures. Mounted at /api/admin/lectures (admins only).

const express = require('express');
const {
  listLectures,
  findLectureById,
  createLecture,
  updateLecture,
  deleteLecture,
} = require('../../models/lectures');
const { findBatchById } = require('../../models/batches');
const { utcToIst, istToUtc, lectureStatus } = require('../../utils/dates');
const { toId } = require('../../utils/ids');

const router = express.Router();

const LECTURE_MINUTES = 60; // a lecture counts as "Live now" for 1 hour from its start
const PAST_WARNING = 'Saved, but this date and time has already passed.';

// Must start with https://meet.google.com/ and have a meeting code after it. Only plain link characters are allowed.
const MEET_LINK_PATTERN = /^https:\/\/meet\.google\.com\/[\w-][\w\-/?&=%.]*$/;

// Trimmed text, or '' if the value isn't text
const text = (value) => (typeof value === 'string' ? value.trim() : '');

const isPast = (startsAt) => new Date(startsAt).getTime() <= Date.now();

// What the browser receives. The server works out the status, so it always follows the server's clock.
function lectureView(lecture, now) {
  return {
    ...lecture,
    starts_at_local: utcToIst(lecture.starts_at),
    status: lectureStatus(lecture.starts_at, lecture.duration_minutes, now),
  };
}

// Reads the form. Gives back the clean values, and an error message for each wrong field.
async function readLecture(body = {}) {
  const lecture = {
    title: text(body.title),
    meetLink: text(body.meetLink),
    startsAt: istToUtc(text(body.startsAt)),
    batchId: toId(body.batchId),
  };

  const fields = {};
  if (!lecture.title) {
    fields.title = 'Please give the lecture a title.';
  } else if (lecture.title.length > 120) {
    fields.title = 'The title is too long (120 characters max).';
  }
  if (!lecture.startsAt) {
    fields.startsAt = 'Please pick a date and time.';
  }
  if (!lecture.meetLink) {
    fields.meetLink = 'Please paste the Google Meet link.';
  } else if (lecture.meetLink.length > 200 || !MEET_LINK_PATTERN.test(lecture.meetLink)) {
    fields.meetLink = 'The link must start with https://meet.google.com/ and include the meeting code.';
  }
  if (!lecture.batchId) {
    fields.batchId = 'Please choose a batch.';
  } else if (!(await findBatchById(lecture.batchId))) {
    fields.batchId = 'That batch no longer exists. Please choose another.';
  }

  return { lecture, fields };
}

function sendFieldErrors(res, fields) {
  res.status(400).json({ error: 'Please check the highlighted fields.', fields });
}

// GET /api/admin/lectures - all lectures, earliest first
router.get('/', async (req, res) => {
  const now = Date.now();
  const lectures = await listLectures();
  res.json({ lectures: lectures.map((lecture) => lectureView(lecture, now)) });
});

// GET /api/admin/lectures/check-time?startsAt=2026-10-30T19:30 - is this India time already in the past?
// The form asks here, because only the server's clock counts.
router.get('/check-time', (req, res) => {
  const startsAt = istToUtc(text(req.query.startsAt));
  res.json({ past: Boolean(startsAt) && isPast(startsAt) });
});

// POST /api/admin/lectures  body: { title, startsAt, meetLink, batchId }
router.post('/', async (req, res) => {
  const { lecture, fields } = await readLecture(req.body);
  if (Object.keys(fields).length) {
    return sendFieldErrors(res, fields);
  }

  const id = await createLecture({ ...lecture, durationMinutes: LECTURE_MINUTES });
  res.status(201).json({
    lecture: lectureView(await findLectureById(id), Date.now()),
    warning: isPast(lecture.startsAt) ? PAST_WARNING : undefined,
  });
});

// PUT /api/admin/lectures/:id  body: { title, startsAt, meetLink, batchId }
router.put('/:id', async (req, res) => {
  const existing = await findLectureById(toId(req.params.id));
  if (!existing) {
    return res.status(404).json({ error: 'That lecture no longer exists.' });
  }

  const { lecture, fields } = await readLecture(req.body);
  if (Object.keys(fields).length) {
    return sendFieldErrors(res, fields);
  }

  await updateLecture(existing.id, lecture);
  res.json({
    lecture: lectureView(await findLectureById(existing.id), Date.now()),
    warning: isPast(lecture.startsAt) ? PAST_WARNING : undefined,
  });
});

// DELETE /api/admin/lectures/:id
router.delete('/:id', async (req, res) => {
  const lecture = await findLectureById(toId(req.params.id));
  if (!lecture) {
    return res.status(404).json({ error: 'That lecture no longer exists.' });
  }

  await deleteLecture(lecture.id);
  res.json({ deleted: lecture.id });
});

module.exports = router;
