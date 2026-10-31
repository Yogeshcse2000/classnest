// Submissions page (admin): every student in an assignment's batch, what they have handed in, and a download for each file.
// The server works out every status and count. This file only shows them.

const REFRESH_MS = 30000; // students hand in work at any time, so ask the server again every 30 seconds

const assignmentId = new URLSearchParams(window.location.search).get('assignment') ?? '';
const apiPath = `/api/admin/assignments/${encodeURIComponent(assignmentId)}/submissions`;

const CLIPBOARD_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 2h6v4H9zM9 12h6M9 16h4"/></svg>`;
const DOWNLOAD_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>`;

const rows = document.getElementById('submission-rows');
const countNumbers = {
  submitted: document.getElementById('count-submitted'),
  late: document.getElementById('count-late'),
  notSubmitted: document.getElementById('count-missing'),
};

let shownRows = null;
let countsShown = false;
let latestLoad = 0;

function rowHtml(student) {
  const name = escapeHtml(student.name);
  const username = escapeHtml(student.username);
  const download = student.submission_id
    ? `<a class="btn btn-ghost btn-small" href="/api/admin/submissions/${student.submission_id}/download" download
          title="${escapeHtml(student.original_name)}" aria-label="Download ${name}'s work">${DOWNLOAD_ICON}Download</a>`
    : '';
  return `
    <tr>
      <td class="table-name">${name}</td>
      <td data-label="Username"><span class="mono">${username}</span></td>
      <td data-label="Status">${submissionChipHtml(student.status)}</td>
      <td data-label="Submitted">${student.submitted_at ? formatDateTime(student.submitted_at) : '<span class="muted">–</span>'}</td>
      <td class="table-action">${download}</td>
    </tr>`;
}

const EMPTY_ROW = `
  <tr>
    <td colspan="5">
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true">${CLIPBOARD_ICON}</div>
        <h2>No students in this batch yet</h2>
        <p>Once students are enrolled in this batch, they will appear here.</p>
      </div>
    </td>
  </tr>`;

// The numbers count up the first time, and simply change after that
function showCounts(counts) {
  Object.entries(countNumbers).forEach(([key, number]) => {
    if (countsShown) number.textContent = counts[key];
    else countUp(number, counts[key]);
  });
  countsShown = true;
}

// Only touches the table when something changed, so a button under the mouse doesn't disappear
function showRows(students) {
  const html = students.length ? students.map(rowHtml).join('') : EMPTY_ROW;
  if (html === shownRows) return;
  shownRows = html;
  rows.innerHTML = html;
  rows.removeAttribute('aria-busy');
  addHoverLift(rows);
}

function showUnavailable(message) {
  document.getElementById('assignment-title').textContent = 'Assignment not available';
  document.getElementById('unavailable-text').textContent = message;
  document.getElementById('unavailable').hidden = false;
  document.getElementById('submission-counts').hidden = true;
  document.getElementById('submission-card').hidden = true;
}

async function refresh() {
  const thisLoad = ++latestLoad;
  const data = await loadPageData(apiPath);
  if (thisLoad !== latestLoad) return; // a newer refresh has started, so this answer is out of date

  const { title, batch_name, due_at } = data.assignment;
  document.title = `${title} · Submissions · ClassNest`;
  document.getElementById('assignment-title').textContent = title;
  document.getElementById('assignment-batch').textContent = `Submissions · ${batch_name}`;
  document.getElementById('assignment-due').textContent = `Due ${formatDateTime(due_at)}`;
  showCounts(data.counts);
  showRows(data.students);
}

setupLogout();
showCurrentUser();
enterAnimation('.welcome, .count-grid > *, #submission-card');

// On a phone the page links scroll sideways, so bring this page's link into view
document.querySelector('.nav [aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' });

refresh().catch((error) => {
  showUnavailable(error.status === 404 ? 'It may have been deleted. The Assignments page shows all current ones.' : error.message);
});

// Refreshing rests while the tab is hidden. If a refresh fails, the page keeps showing what it has.
setInterval(() => {
  if (!document.hidden) refresh().catch(() => {});
}, REFRESH_MS);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refresh().catch(() => {});
});
