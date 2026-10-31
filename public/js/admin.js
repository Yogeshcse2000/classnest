// Admin dashboard: the greeting, the four counts, upcoming lectures and the latest submissions.
// The server works out every number and status, because its clock is the one that counts. This file only shows them.

const REFRESH_MS = 60000; // the numbers change as time passes, so ask the server again every minute

const CALENDAR_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`;

const greeting = document.getElementById('greeting');
const upcomingList = document.getElementById('upcoming-list');
const latestRows = document.getElementById('latest-submissions');
const numbers = {
  activeBatches: document.getElementById('stat-batches'),
  students: document.getElementById('stat-students'),
  lectures: document.getElementById('stat-lectures'),
  submissions: document.getElementById('stat-submissions'),
};

let statsShown = false;
let shownUpcoming = null;
let shownLatest = null;

// The numbers count up the first time, and simply change after that
function showStats(stats) {
  Object.entries(numbers).forEach(([key, number]) => {
    if (statsShown) number.textContent = stats[key];
    else countUp(number, stats[key]);
  });
  statsShown = true;

  document.getElementById('note-batches').textContent = stats.startingLater
    ? `${stats.startingLater} starting later`
    : 'All batches have started';
  document.getElementById('note-students').textContent = `+${stats.newStudents} this month`;
  document.getElementById('note-lectures').textContent = `${stats.lecturesToday} scheduled today`;
  document.getElementById('note-submissions').textContent = `${stats.lateSubmissions} submitted late`;
}

function lectureRowHtml(lecture, today) {
  const isToday = istDay(lecture.starts_at) === today;
  const live = lecture.status === 'Live now' ? `<span class="row-side">${liveTagHtml('Live now')}</span>` : '';
  return `
    <li>
      <a class="row-card row-link${isToday ? ' is-today' : ''}" href="/admin/lectures#lecture-${lecture.id}">
        ${dateBlockHtml(lecture.starts_at, today)}
        <span class="row-main">
          <strong>${escapeHtml(lecture.title)}</strong>
          <span>${escapeHtml(lecture.batch_name)} · ${formatTime(lecture.starts_at)} IST</span>
        </span>
        ${live}
      </a>
    </li>`;
}

function latestRowHtml(submission, now) {
  return `
    <tr>
      <td class="table-name">${escapeHtml(submission.student_name)}</td>
      <td data-label="Assignment"><a class="table-link" href="/admin/assignments?assignment=${submission.assignment_id}">${escapeHtml(submission.assignment_title)}</a></td>
      <td class="table-muted" data-label="When">${timeAgo(submission.submitted_at, now)}</td>
      <td data-label="Status">${submissionTagHtml(submission.status)}</td>
    </tr>`;
}

// Only touches the list when something changed, so a live dot doesn't restart its pulse
function showUpcoming(lectures, today) {
  const html = lectures.length
    ? lectures.map((lecture) => lectureRowHtml(lecture, today)).join('')
    : `<li class="empty-state">
         <div class="empty-icon" aria-hidden="true">${CALENDAR_ICON}</div>
         <h2>Nothing scheduled</h2>
         <p>Release a lecture and it will show up here.</p>
       </li>`;
  if (html === shownUpcoming) return;
  shownUpcoming = html;
  stopLiveDots(upcomingList);
  upcomingList.innerHTML = html;
  upcomingList.removeAttribute('aria-busy');
  pulseLiveDots(upcomingList);
}

function showLatest(submissions, now) {
  const html = submissions.length
    ? submissions.map((submission) => latestRowHtml(submission, now)).join('')
    : `<tr class="table-message"><td colspan="4"><div class="empty-state">
         <div class="empty-icon" aria-hidden="true">${CALENDAR_ICON}</div>
         <h2>No submissions yet</h2>
         <p>They'll show up here as students hand in their work.</p>
       </div></td></tr>`;
  if (html === shownLatest) return;
  shownLatest = html;
  latestRows.innerHTML = html;
  latestRows.removeAttribute('aria-busy');
}

async function refresh() {
  const data = await loadPageData('/api/admin/dashboard');
  greeting.textContent = `${data.greeting}, ${data.name}`;
  showStats(data.stats);
  showUpcoming(data.upcomingLectures, data.today);
  showLatest(data.latestSubmissions, data.now);
}

setupLogout();
showCurrentUser();
enterAnimation('.page-head, .stat-grid > *, .panels > *');

refresh().catch((error) => {
  Object.values(numbers).forEach((number) => (number.textContent = '–'));
  const message = escapeHtml(error.message);
  upcomingList.removeAttribute('aria-busy');
  upcomingList.innerHTML = `<li class="alert alert-error">${message}</li>`;
  latestRows.removeAttribute('aria-busy');
  latestRows.innerHTML = `<tr class="table-message"><td colspan="4"><p class="alert alert-error">${message}</p></td></tr>`;
});

// Refreshing rests while the tab is hidden. If a refresh fails, the page keeps showing what it has.
setInterval(() => {
  if (!document.hidden) refresh().catch(() => {});
}, REFRESH_MS);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refresh().catch(() => {});
});
