// Student dashboard: lectures that are live now, upcoming lectures and assignments, kept fresh without reloading.
// The server decides what is live, upcoming or closed, and the order of the assignments, because its clock is the one
// that counts. This file only shows it.

const REFRESH_MS = 30000; // statuses change as time passes, so ask the server again every 30 seconds
const COUNTDOWN_MS = 60000; // the "Starts in" and "left" texts are in minutes, so they change every minute

const liveBody = document.getElementById('live-body');
const upcomingList = document.getElementById('upcoming-list');
const assignmentList = document.getElementById('assignment-list');

const CALENDAR_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`;
const CAMERA_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3"/></svg>`;
const CLIPBOARD_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 2h6v4H9zM9 12h6M9 16h4"/></svg>`;

let clockGap = 0; // how far the server's clock is ahead of this computer's
let latestLoad = 0;
const shownHtml = new Map();

// ---------- Countdowns ----------

// Whole minutes until a time, by the server's clock. A wrong clock on this computer changes nothing,
// because clockGap cancels it out.
function minutesUntil(isoDate) {
  const serverNow = Date.now() + clockGap;
  return Math.max(0, Math.floor((new Date(isoDate).getTime() - serverNow) / 60000));
}

function showCountdowns() {
  document.querySelectorAll('[data-starts]').forEach((chip) => {
    chip.textContent = `Starts in ${durationText(minutesUntil(chip.dataset.starts))}`;
  });
  document.querySelectorAll('[data-due]').forEach((chip) => {
    chip.textContent = timeLeftText(minutesUntil(chip.dataset.due));
  });
}

// ---------- Building the page ----------

function startsChipHtml(lecture) {
  return `<span class="chip chip-green" data-starts="${escapeHtml(lecture.starts_at)}"></span>`;
}

// aria-label names the lecture, so a screen reader can tell several Join buttons apart
function liveItemHtml(lecture) {
  const title = escapeHtml(lecture.title);
  return `
    <div class="live-item" id="lecture-${lecture.id}">
      <div class="next-body">
        ${liveChipHtml('Live now')}
        <strong class="next-title">${title}</strong>
        <span class="next-when">Started ${formatDateTime(lecture.starts_at)}</span>
      </div>
      <a class="btn btn-primary" href="${escapeHtml(lecture.meet_link)}" target="_blank" rel="noopener noreferrer"
         aria-label="Join live: ${title}">Join live</a>
    </div>`;
}

function nextLectureHtml(lecture) {
  return `
    <h2>Next lecture</h2>
    <div class="next-body">
      <strong class="next-title">${escapeHtml(lecture.title)}</strong>
      <span class="next-when">${formatDateTime(lecture.starts_at)}</span>
      ${startsChipHtml(lecture)}
    </div>`;
}

function liveCardHtml({ live, upcoming }) {
  if (live.length) return `<div class="live-list">${live.map(liveItemHtml).join('')}</div>`;
  if (upcoming.length) return nextLectureHtml(upcoming[0]);
  return emptyHtml('div', CAMERA_ICON, 'Nothing live right now', 'When your next lecture is scheduled, it will show up here.');
}

function upcomingRowHtml(lecture) {
  const title = escapeHtml(lecture.title);
  return `
    <li class="list-row schedule-row" id="lecture-${lecture.id}">
      <div class="list-main">
        <strong title="${title}">${title}</strong>
        <span>${formatDateTime(lecture.starts_at)}</span>
      </div>
      <div class="list-meta">${startsChipHtml(lecture)}</div>
    </li>`;
}

// Amber for the last 24 hours, "Closed" once the deadline has passed
function deadlineChipHtml(assignment) {
  if (assignment.deadline_status === 'closed') return '<span class="chip chip-quiet">Closed</span>';
  const style = assignment.deadline_status === 'soon' ? 'chip-amber' : 'chip-green';
  return `<span class="chip ${style}" data-due="${escapeHtml(assignment.due_at)}"></span>`;
}

function assignmentRowHtml(assignment) {
  const title = escapeHtml(assignment.title);
  const description = escapeHtml(assignment.description);
  return `
    <li class="list-row schedule-row assignment-row" id="assignment-${assignment.id}">
      <div class="list-main">
        <strong title="${title}">${title}</strong>
        <p class="row-desc" title="${description}">${description}</p>
        <span>Due ${formatDateTime(assignment.due_at)}</span>
      </div>
      <div class="list-meta">
        ${submissionChipHtml(assignment.submission_status)}
        ${deadlineChipHtml(assignment)}
        <a class="btn btn-ghost btn-small" href="/student/submit?assignment=${assignment.id}" aria-label="Submit: ${title}">Submit</a>
      </div>
    </li>`;
}

function emptyHtml(tag, icon, title, text) {
  return `
    <${tag} class="empty-state">
      <div class="empty-icon" aria-hidden="true">${icon}</div>
      <h2>${title}</h2>
      <p>${text}</p>
    </${tag}>`;
}

// Only touches the page when something really changed,
// so a button under the mouse doesn't disappear and a live dot doesn't restart its pulse
function update(element, html) {
  if (shownHtml.get(element) === html) return;
  const firstTime = element.hasAttribute('aria-busy');
  shownHtml.set(element, html);

  stopLiveDots(element);
  element.innerHTML = html;
  element.removeAttribute('aria-busy');
  pulseLiveDots(element);
  addHoverLift(element);
  if (motionOK && !firstTime) gsap.from(element, { opacity: 0, duration: 0.25, ease: 'none', clearProps: 'opacity' });
}

// ---------- Getting the data ----------

async function refresh() {
  const thisLoad = ++latestLoad;
  const data = await loadPageData('/api/student/dashboard');
  if (thisLoad !== latestLoad) return; // a newer refresh has started, so this answer is out of date

  clockGap = new Date(data.now).getTime() - Date.now();
  showUserName(data.name);

  update(liveBody, liveCardHtml(data));
  update(
    upcomingList,
    data.upcoming.length
      ? data.upcoming.map(upcomingRowHtml).join('')
      : emptyHtml('li', CALENDAR_ICON, 'No upcoming lectures', "You're all set. New lectures will appear here.")
  );
  update(
    assignmentList,
    data.assignments.length
      ? data.assignments.map(assignmentRowHtml).join('')
      : emptyHtml('li', CLIPBOARD_ICON, 'No assignments yet', "You're all caught up. New assignments will appear here.")
  );
  showCountdowns();
}

// If a refresh fails, the page keeps showing what it has and tries again next time
function refreshQuietly() {
  refresh().catch(() => {});
}

function showLoadError(error) {
  const message = escapeHtml(error.message);
  update(liveBody, `<p class="alert alert-error">${message}</p>`);
  update(upcomingList, `<li class="alert alert-error">${message}</li>`);
  update(assignmentList, `<li class="alert alert-error">${message}</li>`);
}

// ui.js shows an item opened from a search result. If it isn't on the page, it may be newer than the last
// refresh, so ask the server once before giving up.
async function findMissingItem() {
  const id = window.location.hash.slice(1);
  if (!/^(lecture|assignment)-\d+$/.test(id) || document.getElementById(id)) return;

  await refresh().catch(() => {});
  if (document.getElementById(id)) showLinkedItem();
  else showToast("That item isn't on your dashboard any more.", 'error');
}
window.addEventListener('hashchange', findMissingItem);

// ---------- Start ----------

setupLogout();
enterAnimation('.welcome, .bento > *');

refresh()
  .then(() => {
    showLinkedItem();
    return findMissingItem();
  })
  .catch(showLoadError);

// Both timers rest while the tab is hidden. Coming back refreshes straight away.
setInterval(() => {
  if (!document.hidden) refreshQuietly();
}, REFRESH_MS);
setInterval(() => {
  if (!document.hidden) showCountdowns();
}, COUNTDOWN_MS);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refreshQuietly();
});
