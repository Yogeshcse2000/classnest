// Submit page (student): one assignment in full, a live countdown and the .zip upload.
// The checks here only save a student from waiting for a big upload to be refused. The server checks every file
// again, and it alone decides what is late, because its clock is the one that counts.

const REFRESH_MS = 30000; // the deadline can change, so ask the server again every 30 seconds
const COUNTDOWN_MS = 250; // checked often, so a timer running slightly early or late can't make a second stall or skip
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const assignmentId = new URLSearchParams(window.location.search).get('assignment') ?? '';
const apiPath = `/api/student/assignments/${encodeURIComponent(assignmentId)}`;

const element = (id) => document.getElementById(id);
const content = element('submit-content');
const countdown = element('countdown');
const dropzone = element('dropzone');
const fileInput = element('file-input');
const chooseButton = element('choose-file');
const removeButton = element('remove-file');
const uploadButton = element('upload-button');
const uploadError = element('upload-error');
const currentWork = element('current-work');

let clockGap = 0; // how far the server's clock is ahead of this computer's
let dueAt = null;
let chosenFile = null;
let uploading = false;
let latestLoad = 0;

// ---------- Countdown ----------

// 93784000 -> "1d 02h 03m 04s"
function countdownText(milliseconds) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const parts = [Math.floor(totalSeconds / 3600) % 24, Math.floor(totalSeconds / 60) % 60, totalSeconds % 60];
  const [hours, minutes, seconds] = parts.map((part) => String(part).padStart(2, '0'));
  return `${days ? `${days}d ` : ''}${hours}h ${minutes}m ${seconds}s`;
}

// A wrong clock on this computer changes nothing, because clockGap cancels it out
function showCountdown() {
  if (!dueAt) return;
  const left = new Date(dueAt).getTime() - (Date.now() + clockGap);
  const closed = left <= 0;
  countdown.textContent = closed ? 'Closed' : `${countdownText(left)} left`;
  countdown.classList.toggle('countdown-closed', closed);
  countdown.classList.toggle('countdown-soon', !closed && left <= DAY_MS);
  element('late-note').hidden = !closed;
}

// ---------- Showing the assignment ----------

function showAssignment(assignment) {
  dueAt = assignment.due_at;
  document.title = `${assignment.title} · ClassNest`;
  element('assignment-title').textContent = assignment.title;
  element('assignment-description').textContent = assignment.description;
  element('assignment-due').textContent = formatDateTime(assignment.due_at);
}

function showSubmission(submission) {
  currentWork.hidden = !submission;
  element('upload-heading').textContent = submission ? 'Replace your file' : 'Upload your work';
  if (!submission) return;

  const name = element('current-name');
  name.textContent = submission.original_name;
  name.title = submission.original_name;
  element('current-time').textContent = `Submitted on ${formatDateTime(submission.submitted_at)}`;
  element('current-late').hidden = !submission.is_late;
}

function showUnavailable(message) {
  document.title = 'Assignment not available · ClassNest';
  element('assignment-title').textContent = 'Assignment not available';
  element('unavailable-text').textContent = message;
  element('unavailable').hidden = false;
  content.hidden = true;
  dueAt = null;
}

// The tick pops in after the box, in the same way as the login details on the Students page
function celebrate() {
  currentWork.scrollIntoView({ block: 'nearest', behavior: motionOK ? 'smooth' : 'auto' });
  if (!motionOK) return;
  gsap
    .timeline()
    .fromTo(currentWork, { opacity: 0, y: 12, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.5)', clearProps: 'transform' })
    .fromTo('#current-work .success-check', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2)', clearProps: 'transform' }, '-=0.15');
}

// ---------- Choosing a file ----------

// 2411724 -> "2.3 MB"
function sizeText(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function showError(message) {
  uploadError.textContent = message;
  uploadError.hidden = false;
  if (motionOK) gsap.fromTo(uploadError, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.25 });
}

function clearChosenFile() {
  chosenFile = null;
  element('chosen-file').hidden = true;
  uploadButton.hidden = true;
}

// Gives back what is wrong with a file, or nothing if it looks fine
async function fileProblem(file) {
  if (!file.name.toLowerCase().endsWith('.zip')) return 'Only .zip files can be uploaded. Please choose a .zip file.';
  if (file.size > MAX_SIZE) return `That file is ${sizeText(file.size)}. The limit is 10 MB.`;
  try {
    const [first, second] = new Uint8Array(await file.slice(0, 2).arrayBuffer());
    if (first !== 0x50 || second !== 0x4b) return "That file isn't a real .zip file. Please make a new .zip and try again.";
  } catch (error) {
    return "That file couldn't be read. Please choose it again.";
  }
  return '';
}

async function chooseFile(file) {
  if (uploading) return;
  uploadError.hidden = true;
  clearChosenFile();

  const problem = await fileProblem(file);
  if (problem) return showError(problem);

  chosenFile = file;
  element('chosen-name').textContent = file.name;
  element('chosen-name').title = file.name;
  element('chosen-size').textContent = sizeText(file.size);
  element('chosen-file').hidden = false;
  uploadButton.hidden = false;
}

chooseButton.addEventListener('click', () => fileInput.click());
removeButton.addEventListener('click', clearChosenFile);

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) chooseFile(fileInput.files[0]);
  fileInput.value = ''; // so choosing the same file again still counts as a change
});

// A file dropped anywhere else on the page would make the browser leave this page and open it
['dragover', 'drop'].forEach((type) => window.addEventListener(type, (event) => event.preventDefault()));

dropzone.addEventListener('dragover', () => {
  if (!uploading) dropzone.classList.add('is-over');
});
dropzone.addEventListener('dragleave', (event) => {
  if (!dropzone.contains(event.relatedTarget)) dropzone.classList.remove('is-over');
});
dropzone.addEventListener('drop', (event) => {
  dropzone.classList.remove('is-over');
  const { files } = event.dataTransfer;
  if (uploading || !files.length) return;
  if (files.length > 1) {
    clearChosenFile();
    return showError('Please drop one .zip file at a time.');
  }
  chooseFile(files[0]);
});

// ---------- Uploading ----------

function setUploading(value) {
  uploading = value;
  uploadButton.disabled = value;
  chooseButton.disabled = value;
  removeButton.disabled = value;
  uploadButton.textContent = value ? 'Uploading…' : 'Upload';
  element('upload-progress').hidden = !value;
  if (value) showProgress(0);
}

// The bar fills by stretching (transform), which stays smooth at 60fps
function showProgress(fraction) {
  const percent = Math.round(fraction * 100);
  element('progress-fill').style.transform = `scaleX(${fraction})`;
  element('progress-track').setAttribute('aria-valuenow', percent);
  element('progress-text').textContent = percent < 100 ? `Uploading… ${percent}%` : 'Saving your file…';
}

uploadButton.addEventListener('click', async () => {
  if (uploading || !chosenFile) return;
  uploadError.hidden = true;
  setUploading(true);
  try {
    const data = await uploadFile(`${apiPath}/submission`, chosenFile, showProgress);
    latestLoad++; // a refresh already on its way from the server doesn't know about this upload
    clockGap = new Date(data.now).getTime() - Date.now();
    clearChosenFile();
    showSubmission(data.submission);
    celebrate();
  } catch (error) {
    if (error.status === 401 || error.status === 403) window.location.href = '/';
    else if (error.status === 404) showUnavailable('It may have been removed. Your file was not saved.');
    else showError(error.message);
  } finally {
    setUploading(false);
  }
});

// ---------- Getting the data ----------

async function refresh() {
  if (uploading) return;
  const thisLoad = ++latestLoad;
  const data = await loadPageData(apiPath);
  if (thisLoad !== latestLoad || uploading) return; // this answer is out of date

  clockGap = new Date(data.now).getTime() - Date.now();
  showUserName(data.name);
  showAssignment(data.assignment);
  showSubmission(data.submission);
  showCountdown();
}

// If a refresh fails, the page keeps showing what it has and tries again next time.
// The exception is an assignment that has really gone.
function refreshQuietly() {
  refresh().catch((error) => {
    if (error.status === 404) showUnavailable('It may have been removed. Your dashboard shows your current assignments.');
  });
}

// ---------- Start ----------

setupLogout();
enterAnimation('.welcome, .bento > *');

refresh().catch((error) => {
  showUnavailable(error.status === 404 ? 'It may have been removed. Your dashboard shows your current assignments.' : error.message);
});

// The timers rest while the tab is hidden. Coming back refreshes straight away.
setInterval(() => {
  if (!document.hidden) showCountdown();
}, COUNTDOWN_MS);
setInterval(() => {
  if (!document.hidden) refreshQuietly();
}, REFRESH_MS);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refreshQuietly();
});
