// Adds demo data, so ClassNest can be shown with every status on screen.
// It only ever adds. Nothing is changed or deleted, and anything that already exists is skipped, so it is safe to run again.
// Run with: npm run seed:demo

require('dotenv').config({ quiet: true });

const zlib = require('zlib');
const bcrypt = require('bcryptjs');
const { findAdminByEmail, createAdmin } = require('./models/admins');
const { findBatchByName, createBatch } = require('./models/batches');
const { findStudentByUsername, findStudentByEmail, createStudent } = require('./models/students');
const { listBatchLectures, createLecture } = require('./models/lectures');
const { listBatchAssignments, createAssignment } = require('./models/assignments');
const { findSubmission, saveSubmission } = require('./models/submissions');
const { saveFile } = require('./storage');
const { usernameBase } = require('./utils/credentials');
const { istToUtc, isLate } = require('./utils/dates');

const PASSWORD = 'Demo@1234';
const LECTURE_MINUTES = 60; // every lecture is this long

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const AI = 'AI Builders · Nov 2026';
const WEB = 'Web Dev · Jan 2027';

const ADMIN = { name: 'Demo Admin', email: 'demo.admin@classnest.local' };

const BATCHES = [
  { name: AI, startDate: '2026-11-01', description: 'Build small AI projects, from prompts to working apps.' },
  { name: WEB, startDate: '2027-01-11', description: 'HTML, CSS and JavaScript, from the first page to a full site.' },
];

const STUDENTS = [
  { name: 'Aarav Mehta', batch: AI },
  { name: 'Diya Kapoor', batch: AI },
  { name: 'Rohan Iyer', batch: AI },
  { name: 'Sneha Reddy', batch: AI },
  { name: 'Kabir Singh', batch: WEB },
  { name: 'Ananya Das', batch: WEB },
];

// startsIn is how long from now, and a negative time is in the past. startsAt is one fixed time, in India time.
const LECTURES = [
  { batch: AI, title: 'Neural networks in plain English', startsIn: -10 * MINUTE, meetCode: 'nnx-demo-liv' }, // live now
  { batch: AI, title: 'Building your first chatbot', startsIn: DAY, meetCode: 'bot-demo-nxt' },
  { batch: WEB, title: 'HTML and CSS foundations', startsAt: '2027-01-11T10:00', meetCode: 'web-demo-one' },
  { batch: AI, title: 'Python basics for AI', startsIn: -2 * DAY, meetCode: 'pyb-demo-old' }, // finished
];

const OPEN = 'Train a tiny text classifier';
const DUE_SOON = 'Prompt writing worksheet';
const CLOSED = 'Python warm-up exercises';
const OPEN_DUE_IN = 5 * DAY;

const ASSIGNMENTS = [
  { batch: AI, title: OPEN, dueIn: OPEN_DUE_IN, description: 'Train a small model on the sample data, then zip your notebook and a short note on what you found.' },
  { batch: AI, title: DUE_SOON, dueIn: 20 * HOUR, description: 'Rewrite the five prompts on the worksheet, then zip your answers.' },
  { batch: AI, title: CLOSED, dueIn: -3 * DAY, description: 'Solve the ten warm-up exercises, then zip your .py files.' },
];

// The time is measured from the deadline. The same rule as a real upload then decides which ones are late.
// OPEN's deadline is still ahead, so its work counts back from there to 2 hours ago and 1 day ago, never the future.
// Diya and Sneha are missing from the open assignment, and Sneha from the closed one. Nobody has done DUE_SOON yet.
const SUBMISSIONS = [
  { assignment: OPEN, student: 'Aarav Mehta', afterDeadline: -OPEN_DUE_IN - 2 * HOUR },
  { assignment: OPEN, student: 'Rohan Iyer', afterDeadline: -OPEN_DUE_IN - DAY },
  { assignment: CLOSED, student: 'Aarav Mehta', afterDeadline: -6 * HOUR },
  { assignment: CLOSED, student: 'Diya Kapoor', afterDeadline: 2 * HOUR },
  { assignment: CLOSED, student: 'Rohan Iyer', afterDeadline: DAY + 3 * HOUR },
];

// How many of each thing were added or skipped, for the summary at the end
const counts = {};

function count(kind, added) {
  counts[kind] = counts[kind] || { added: 0, skipped: 0 };
  counts[kind][added ? 'added' : 'skipped']++;
}

// A small real .zip with one text file inside. Its parts are laid out as the zip format describes:
// the file, then a list of what is in the zip, then an ending that says where that list starts.
// Method 0 means "stored": the text is kept as it is, which every zip program can read.
function makeZip(fileName, text) {
  const name = Buffer.from(fileName);
  const data = Buffer.from(text);

  const details = Buffer.alloc(26); // the details the file and the list both repeat
  details.writeUInt16LE(20, 0); // needs zip version 2.0 to open
  details.writeUInt16LE(0x5c21, 8); // the file's date: 1 January 2026
  details.writeUInt32LE(zlib.crc32(data), 10); // a checksum, so zip programs can tell the file is whole
  details.writeUInt32LE(data.length, 14); // size when stored
  details.writeUInt32LE(data.length, 18); // size when unpacked
  details.writeUInt16LE(name.length, 22);

  const start = Buffer.alloc(4);
  start.writeUInt32LE(0x04034b50); // "PK", then what comes next: a file
  const file = Buffer.concat([start, details, name, data]);

  const listStart = Buffer.alloc(6);
  listStart.writeUInt32LE(0x02014b50); // "PK", then what comes next: an entry in the list
  listStart.writeUInt16LE(20, 4); // made with zip version 2.0
  const list = Buffer.concat([listStart, details, Buffer.alloc(14), name]); // the 14 empty bytes end with the file's position, 0

  const ending = Buffer.alloc(22);
  ending.writeUInt32LE(0x06054b50); // "PK", then what comes next: the end of the zip
  ending.writeUInt16LE(1, 8); // one file on this disk
  ending.writeUInt16LE(1, 10); // one file in all
  ending.writeUInt32LE(list.length, 12);
  ending.writeUInt32LE(file.length, 16);

  return Buffer.concat([file, list, ending]);
}

// "Python warm-up exercises" -> "python-warm-up-exercises"
function slug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

async function addAdmin() {
  const exists = Boolean(await findAdminByEmail(ADMIN.email));
  if (!exists) await createAdmin({ ...ADMIN, passwordHash: await bcrypt.hash(PASSWORD, 10) });
  count('admin', !exists);
}

// Gives back each batch's id by its name, for the steps below
async function addBatches() {
  const ids = {};
  for (const batch of BATCHES) {
    const existing = await findBatchByName(batch.name);
    ids[batch.name] = existing ? existing.id : await createBatch(batch);
    count('batches', !existing);
  }
  return ids;
}

// Gives back each student's id by their name, for the submissions
async function addStudents(batchIds) {
  const ids = {};
  for (const student of STUDENTS) {
    const username = usernameBase(student.name);
    const email = `${username}@demo.classnest.local`;
    const existing = (await findStudentByUsername(username)) || (await findStudentByEmail(email));
    ids[student.name] = existing
      ? existing.id
      : await createStudent({
          name: student.name,
          username,
          email,
          passwordHash: await bcrypt.hash(PASSWORD, 10),
          batchId: batchIds[student.batch],
        });
    count('students', !existing);
  }
  return ids;
}

async function addLectures(batchIds, now) {
  for (const lecture of LECTURES) {
    const batchId = batchIds[lecture.batch];
    const exists = (await listBatchLectures(batchId)).some(({ title }) => title === lecture.title);
    if (!exists) {
      await createLecture({
        batchId,
        title: lecture.title,
        meetLink: `https://meet.google.com/${lecture.meetCode}`,
        startsAt: lecture.startsAt ? istToUtc(lecture.startsAt) : new Date(now + lecture.startsIn).toISOString(),
        durationMinutes: LECTURE_MINUTES,
      });
    }
    count('lectures', !exists);
  }
}

async function addAssignments(batchIds, now) {
  for (const assignment of ASSIGNMENTS) {
    const batchId = batchIds[assignment.batch];
    const exists = (await listBatchAssignments(batchId)).some(({ title }) => title === assignment.title);
    if (!exists) {
      await createAssignment({
        batchId,
        title: assignment.title,
        description: assignment.description,
        dueAt: new Date(now + assignment.dueIn).toISOString(),
      });
    }
    count('assignments', !exists);
  }
}

// The file is only saved once we know the submission is new, so running this again leaves no spare files behind
async function addSubmissions(batchIds, studentIds) {
  const assignments = await listBatchAssignments(batchIds[AI]);

  for (const submission of SUBMISSIONS) {
    const assignment = assignments.find(({ title }) => title === submission.assignment);
    const studentId = studentIds[submission.student];
    const exists = Boolean(await findSubmission(assignment.id, studentId));
    if (!exists) {
      const submittedAt = new Date(assignment.due_at).getTime() + submission.afterDeadline;
      const zip = makeZip('notes.txt', `Demo work by ${submission.student} for "${assignment.title}".\n`);
      await saveSubmission({
        assignmentId: assignment.id,
        studentId,
        filePath: await saveFile(zip),
        originalName: `${usernameBase(submission.student)}-${slug(assignment.title)}.zip`,
        submittedAt: new Date(submittedAt).toISOString(),
        isLate: isLate(assignment.due_at, submittedAt),
      });
    }
    count('submissions', !exists);
  }
}

function printSummary() {
  console.log('\nDemo data is ready.\n');
  for (const [kind, { added, skipped }] of Object.entries(counts)) {
    console.log(`  ${kind.padEnd(12)} ${added} added, ${skipped} already there`);
  }

  console.log(`\nDemo logins (the password for all of them is ${PASSWORD})\n`);
  console.log(`  Admin    ${ADMIN.email}`);
  for (const { name, batch } of STUDENTS) {
    console.log(`  Student  ${usernameBase(name).padEnd(14)} ${batch}`);
  }
  console.log('\nDates are only set the first time. A lecture is live for 60 minutes, and running this again does not move it.\n');
}

async function main() {
  const now = Date.now();
  await addAdmin();
  const batchIds = await addBatches();
  const studentIds = await addStudents(batchIds);
  await addLectures(batchIds, now);
  await addAssignments(batchIds, now);
  await addSubmissions(batchIds, studentIds);
  printSummary();
}

main().catch((err) => {
  console.error('Adding the demo data failed:', err.message);
  process.exit(1);
});
