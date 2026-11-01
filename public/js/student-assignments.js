// Assignments page (student): the list on the left, and on the right one assignment in full, a live countdown and the
// .zip upload. The checks here only save a student from waiting for a big upload to be refused. The server checks every
// file again, and it alone decides what is late, because its clock is the one that counts.

const REFRESH_MS = 30000; // deadlines can change, so ask the server again every 30 seconds
const COUNTDOWN_MS = 250; // checked often, so a timer running slightly early or late can't make a second stall or skip
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const CLIPBOARD_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 2h6v4H9zM9 12h6M9 16h4"/></svg>`;

const element = (id) => document.getElementById(id);
const list = element('assignment-list');
const detail = element('detail');
const content = element('detail-content');
const unavailable = element('unavailable');
const timeBox = element('time-box');
const countdown = element('countdown');
const dropzone = element('dropzone');
const fileInput = element('file-input');
const chooseButton = element('choose-file');
const pngButton = element('try-png');
const removeButton = element('remove-file');
const uploadButton = element('upload-button');
const uploadError = element('upload-error');
const currentWork = element('current-work');

let selectedId = Number(new URLSearchParams(window.location.search).get('assignment')) || null;
let shownList = null;
let clockGap = 0; // how far the server's clock is ahead of this computer's
let dueAt = null;
let chosenFile = null;
let uploading = false;
let latestLoad = 0;

const apiPath = () => `/api/student/assignments/${selectedId}`;

// ---------- The list ----------

function assignmentRowHtml(assignment) {
  return `
    <li id="assignment-${assignment.id}">
      <button class="pick-row" type="button" data-select="${assignment.id}">
        <strong>${escapeHtml(assignment.title)}</strong>
        <span>Due ${formatDateTime(assignment.due_at)}</span>
        <span class="pick-foot">${assignmentTagHtml(assignment)}${deadlineTagHtml(assignment)}</span>
      </button>
    </li>`;
}

function markSelected() {
  list.querySelectorAll('[data-select]').forEach((row) => {
    if (Number(row.dataset.select) === selectedId) row.setAttribute('aria-current', 'true');
    else row.removeAttribute('aria-current');
  });
}

function showList(assignments) {
  const html = assignments.length
    ? assignments.map(assignmentRowHtml).join('')
    : `<li class="empty-state">
         <div class="empty-icon" aria-hidden="true">${CLIPBOARD_ICON}</div>
         <h2>No assignments yet</h2>
         <p>You're all caught up.</p>
       </li>`;
  if (html !== shownList) {
    shownList = html;
    list.innerHTML = html;
    list.removeAttribute('aria-busy');
    showDeadlineTags(clockGap);
  }
  markSelected();
}

// ---------- Countdown ----------

// 278702000 -> "3d 05:25:02"
function countdownText(milliseconds) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const parts = [Math.floor(totalSeconds / 3600) % 24, Math.floor(totalSeconds / 60) % 60, totalSeconds % 60];
  const clock = parts.map((part) => String(part).padStart(2, '0')).join(':');
  return days ? `${days}d ${clock}` : clock;
}

// A wrong clock on this computer changes nothing, because clockGap cancels it out.
// Once work is handed in, the deadline is no longer urgent, so the box keeps its calm colour.
function showCountdown() {
  showDeadlineTags(clockGap);
  if (!dueAt) return;
  const left = new Date(dueAt).getTime() - (Date.now() + clockGap);
  const closed = left <= 0;
  const handedIn = !currentWork.hidden;
  const urgent = !closed && !handedIn && left < DEADLINE_URGENT_MINUTES * 60000;
  countdown.textContent = closed ? 'Closed' : countdownText(left);
  timeBox.classList.toggle('is-closed', closed);
  timeBox.classList.toggle('is-urgent', urgent);
  timeBox.classList.toggle('is-soon', !closed && !handedIn && !urgent && left < DEADLINE_SOON_MINUTES * 60000);
  element('late-note').hidden = !closed;
}

// ---------- Showing the assignment ----------

function showAssignment(assignment) {
  dueAt = assignment.due_at;
  document.title = `${assignment.title} · ClassNest`;
  setBreadcrumbItem(assignment.title);
  content.hidden = false;
  unavailable.hidden = true;
  element('assignment-batch').textContent = `Assignment · ${assignment.batch_name}`;
  element('assignment-title').textContent = assignment.title;
  element('assignment-description').textContent = assignment.description;
  element('assignment-due').textContent = `Due ${formatDateTime(assignment.due_at)}`;
}

function showSubmission(submission) {
  currentWork.hidden = !submission;
  if (!submission) return;

  element('current-name').textContent = submission.original_name;
  element('current-time').textContent = `Submitted on ${formatDateTime(submission.submitted_at)}`;
  element('current-late').hidden = !submission.is_late;
}

function showUnavailable(title, message) {
  document.title = 'Assignment not available · ClassNest';
  setBreadcrumbItem(null);
  element('unavailable-title').textContent = title;
  element('unavailable-text').textContent = message;
  unavailable.hidden = false;
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
  element('chosen-size').textContent = sizeText(file.size);
  element('chosen-file').hidden = false;
  uploadButton.hidden = false;
}

chooseButton.addEventListener('click', () => fileInput.click());
removeButton.addEventListener('click', clearChosenFile);

// Shows what happens with the wrong kind of file. The made-up file goes through the same check as a real one and is refused.
pngButton.addEventListener('click', () => chooseFile(new File(['not a zip'], 'example.png', { type: 'image/png' })));

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
  pngButton.disabled = value;
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
    const data = await uploadFile(`${apiPath()}/submission`, chosenFile, showProgress);
    latestLoad++; // a refresh already on its way from the server doesn't know about this upload
    clockGap = new Date(data.now).getTime() - Date.now();
    clearChosenFile();
    showSubmission(data.submission);
    celebrate();
    loadList().catch(() => {}); // the tag in the list changes too
  } catch (error) {
    if (error.status === 401 || error.status === 403) window.location.href = '/';
    else if (error.status === 404) showUnavailable("This assignment isn't available", 'It may have been removed. Your file was not saved.');
    else showError(error.message);
  } finally {
    setUploading(false);
  }
});

// ---------- Getting the data ----------

async function loadList() {
  const data = await loadPageData('/api/student/assignments');
  clockGap = new Date(data.now).getTime() - Date.now();
  if (!selectedId) selectedId = data.assignments[0]?.id ?? null;
  showList(data.assignments);
  return data.assignments;
}

async function loadSelected() {
  if (uploading || !selectedId) return;
  const thisLoad = ++latestLoad;
  const data = await loadPageData(apiPath());
  if (thisLoad !== latestLoad || uploading) return; // this answer is out of date

  clockGap = new Date(data.now).getTime() - Date.now();
  showAssignment(data.assignment);
  showSubmission(data.submission);
  showCountdown();
}

// A failed refresh keeps what is showing and tries again next time. The exception is an assignment that has really gone.
function loadSelectedQuietly() {
  loadSelected().catch((error) => {
    if (error.status === 404) showUnavailable("This assignment isn't available", 'It may have been removed. Pick another one from the list.');
  });
}

function refreshQuietly() {
  loadList().catch(() => {});
  loadSelectedQuietly();
}

function select(id) {
  if (uploading) return showToast('Please wait for the upload to finish.', 'error');
  if (id === selectedId && !unavailable.hidden) return;

  selectedId = id;
  window.history.replaceState(null, '', `?assignment=${id}`);
  clearChosenFile();
  uploadError.hidden = true;
  markSelected();
  loadSelectedQuietly();

  // On small screens the assignment is below the list, so bring it into view
  if (window.matchMedia('(max-width: 960px)').matches) {
    detail.scrollIntoView({ block: 'start', behavior: motionOK ? 'smooth' : 'auto' });
  }
}

list.addEventListener('click', (event) => {
  const row = event.target.closest('[data-select]');
  if (row) select(Number(row.dataset.select));
});

// ---------- Start ----------

setupLogout();
showCurrentUser();
enterAnimation('.split > *');

loadList()
  .then(() => {
    if (!selectedId) return showUnavailable('Nothing to hand in yet', 'When your admin posts an assignment, it will appear here.');
    return loadSelected();
  })
  .catch((error) => {
    showUnavailable("This assignment isn't available", error.status === 404 ? 'It may have been removed. Pick another one from the list.' : error.message);
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
