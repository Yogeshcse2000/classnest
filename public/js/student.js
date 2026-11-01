// Student dashboard: the live or next lecture, upcoming lectures and assignments, kept fresh without reloading.
// The server decides what is live, upcoming or closed, and the order of the assignments, because its clock is the one
// that counts. This file only shows it.

const REFRESH_MS = 30000; // statuses change as time passes, so ask the server again every 30 seconds
const COUNTDOWN_MS = 60000; // the "starts in" and "left" texts are in minutes, so they change every minute

const hello = document.getElementById('hello');
const liveCard = document.getElementById('live-card');
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

// Whole minutes between now and a time, by the server's clock. A wrong clock on this computer changes nothing,
// because clockGap cancels it out.
function minutesFromNow(isoDate) {
  const serverNow = Date.now() + clockGap;
  return Math.floor((new Date(isoDate).getTime() - serverNow) / 60000);
}

function startedText(minutes) {
  return minutes < 1 ? 'started just now' : `started ${minutes} min ago`;
}

function showCountdowns() {
  document.querySelectorAll('[data-since]').forEach((text) => {
    text.textContent = startedText(-minutesFromNow(text.dataset.since));
  });
  document.querySelectorAll('[data-starts]').forEach((text) => {
    text.textContent = durationText(Math.max(0, minutesFromNow(text.dataset.starts)));
  });
  showDeadlineTags(clockGap);
}

// ---------- Building the page ----------

// "Today · 6:00 PM – 7:00 PM IST · Google Meet"
function whenText(lecture, today) {
  const end = new Date(new Date(lecture.starts_at).getTime() + lecture.duration_minutes * 60000);
  const day = istDay(lecture.starts_at) === today ? 'Today' : formatDateTime(lecture.starts_at).split(',')[0];
  return `${day} · ${formatTime(lecture.starts_at)} – ${formatTime(end)} IST · Google Meet`;
}

// aria-label names the lecture, so a screen reader can tell several Join buttons apart
function liveItemHtml(lecture, today) {
  const title = escapeHtml(lecture.title);
  return `
    <div class="hero-item" id="lecture-${lecture.id}">
      <div class="hero-text">
        <span class="hero-status">
          <span class="live-dot" aria-hidden="true"><i></i></span>
          <span><b>Live now</b> · <span data-since="${escapeHtml(lecture.starts_at)}"></span></span>
        </span>
        <strong class="hero-title">${title}</strong>
        <span class="hero-when">${whenText(lecture, today)}</span>
      </div>
      <a class="btn btn-join" href="${escapeHtml(lecture.meet_link)}" target="_blank" rel="noopener noreferrer"
         aria-label="Join live class: ${title}">${CAMERA_ICON}Join live class</a>
    </div>`;
}

function nextLectureHtml(lecture, today) {
  return `
    <div class="hero-item" id="lecture-${lecture.id}">
      <div class="hero-text">
        <span class="hero-status"><span><b>Next lecture</b> · starts in <b class="time-bold" data-starts="${escapeHtml(lecture.starts_at)}"></b></span></span>
        <strong class="hero-title">${escapeHtml(lecture.title)}</strong>
        <span class="hero-when">${whenText(lecture, today)}</span>
      </div>
      <span class="hero-note">Join opens at start</span>
    </div>`;
}

function liveCardHtml({ live, upcoming }, today) {
  if (live.length) return `<div class="hero-list">${live.map((lecture) => liveItemHtml(lecture, today)).join('')}</div>`;
  if (upcoming.length) return nextLectureHtml(upcoming[0], today);
  return emptyHtml('div', CAMERA_ICON, 'Nothing live right now', 'When your next lecture is scheduled, it will show up here.');
}

function upcomingRowHtml(lecture, today) {
  return `
    <li class="row-card${istDay(lecture.starts_at) === today ? ' is-today' : ''}" id="lecture-${lecture.id}">
      ${dateBlockHtml(lecture.starts_at, today)}
      <div class="row-main">
        <strong>${escapeHtml(lecture.title)}</strong>
        <span>${formatTime(lecture.starts_at)} IST · Google Meet</span>
        <span>Starts in <b class="time-bold" data-starts="${escapeHtml(lecture.starts_at)}"></b></span>
      </div>
      <span class="row-note">Join opens at start</span>
    </li>`;
}

// While a lecture is live, the next one is still in this list. Otherwise it is in the big card, so it isn't repeated.
function upcomingHtml({ live, upcoming }, today) {
  const rest = live.length ? upcoming : upcoming.slice(1);
  if (rest.length) return rest.map((lecture) => upcomingRowHtml(lecture, today)).join('');
  return emptyHtml('li', CALENDAR_ICON, upcoming.length ? 'Nothing else scheduled' : 'No upcoming lectures', 'New lectures will appear here.');
}

function assignmentRowHtml(assignment) {
  return `
    <li>
      <a class="row-card row-link" href="/student/assignments?assignment=${assignment.id}">
        <span class="row-main">
          <strong>${escapeHtml(assignment.title)}</strong>
          <span class="row-due">Due ${formatDateTime(assignment.due_at)}${deadlineTagHtml(assignment)}</span>
        </span>
        <span class="row-side">${assignmentTagHtml(assignment)}</span>
      </a>
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
  const today = istDay(data.now);
  const firstName = data.name.split(' ')[0];
  hello.textContent = [`Hi ${firstName}`, data.batch_name].filter(Boolean).join(' · ');

  liveCard.classList.toggle('is-live', data.live.length > 0);
  update(liveBody, liveCardHtml(data, today));
  update(upcomingList, upcomingHtml(data, today));
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

// ui.js shows a lecture opened from a search result. If it isn't on the page, it may be newer than the last
// refresh, so ask the server once before giving up.
async function findMissingItem() {
  const id = window.location.hash.slice(1);
  if (!/^lecture-\d+$/.test(id) || document.getElementById(id)) return;

  await refresh().catch(() => {});
  if (document.getElementById(id)) showLinkedItem();
  else showToast("That lecture isn't on your dashboard any more.", 'error');
}
window.addEventListener('hashchange', findMissingItem);

// ---------- Start ----------

setupLogout();
showCurrentUser();
enterAnimation('.page-head, .hero-card, .panels > *');

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
