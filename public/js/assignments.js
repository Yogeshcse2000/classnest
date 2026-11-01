// Assignments page (admin): the list on the left, and on the right the chosen assignment's students and their work.
// Posting, editing, deleting and the batch filter are in schedule.js. The server works out every status and count.

const ROSTER_REFRESH_MS = 30000; // students hand in work at any time, so ask the server again every 30 seconds

const CLIPBOARD_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 2h6v4H9zM9 12h6M9 16h4"/></svg>`;

const list = document.getElementById('assignment-list');
const detail = document.getElementById('detail');
const detailContent = document.getElementById('detail-content');
const detailEmpty = document.getElementById('detail-empty');
const rosterRows = document.getElementById('roster-rows');
const pills = document.querySelectorAll('[data-filter]');

let selectedId = Number(new URLSearchParams(window.location.search).get('assignment')) || null;
let askedFor = selectedId; // the assignment named in the address, until the list has been checked for it
let shownAssignments = [];
let roster = null; // the chosen assignment's students
let statusFilter = 'all';
let latestRosterLoad = 0;
let shownRows = null;

// ---------- The list ----------

// The time left in its deadline colour, "Closed" once the deadline has passed
function statusHtml(assignment) {
  if (assignment.deadline_status === 'closed') return tagHtml('Closed', 'quiet');
  return `<span class="${deadlineTagClass(assignment.minutes_left)}">${timeLeftText(assignment.minutes_left)}</span>`;
}

function assignmentRowHtml(assignment) {
  return `
    <li id="assignment-${assignment.id}">
      <button class="pick-row" type="button" data-select="${assignment.id}">
        <strong>${escapeHtml(assignment.title)}</strong>
        <span>${escapeHtml(assignment.batch_name)}</span>
        <span>Due ${formatDateTime(assignment.due_at)}</span>
        <span class="pick-foot">
          <span data-status></span>
          <span class="pick-count">${assignment.submitted_count}/${assignment.student_count} in</span>
        </span>
      </button>
    </li>`;
}

function markSelected() {
  list.querySelectorAll('[data-select]').forEach((row) => {
    if (Number(row.dataset.select) === selectedId) row.setAttribute('aria-current', 'true');
    else row.removeAttribute('aria-current');
  });
}

// ---------- The chosen assignment ----------

function fileHtml(student) {
  if (!student.submission_id) return '<span class="table-muted">–</span>';
  return `
    <span class="cell-stack">
      <span class="mono">${escapeHtml(student.original_name)}</span>
      <span class="table-sub">Submitted ${formatDateTime(student.submitted_at)}</span>
    </span>`;
}

function actionHtml(student) {
  if (!student.submission_id) return '<span class="table-muted">Not submitted</span>';
  return `<a class="btn btn-ghost" href="/api/admin/submissions/${student.submission_id}/download" download
             aria-label="Download ${escapeHtml(student.name)}'s work">Download .zip</a>`;
}

function studentRowHtml(student) {
  return `
    <tr>
      <td class="table-name">${escapeHtml(student.name)}<span class="table-sub mono">${escapeHtml(student.username)}</span></td>
      <td data-label="File">${fileHtml(student)}</td>
      <td data-label="Status">${submissionTagHtml(student.status, student.minutes_late)}</td>
      <td class="table-action">${actionHtml(student)}</td>
    </tr>`;
}

function messageRowHtml(title, text) {
  return `
    <tr class="table-message">
      <td colspan="4">
        <div class="empty-state">
          <div class="empty-icon" aria-hidden="true">${CLIPBOARD_ICON}</div>
          <h2>${title}</h2>
          <p>${text}</p>
        </div>
      </td>
    </tr>`;
}

function showRoster() {
  const { students, counts } = roster;
  document.getElementById('pill-all').textContent = students.length;
  document.getElementById('pill-ontime').textContent = counts.submitted;
  document.getElementById('pill-late').textContent = counts.late;
  document.getElementById('pill-missing').textContent = counts.notSubmitted;
  pills.forEach((pill) => pill.setAttribute('aria-pressed', String(pill.dataset.filter === statusFilter)));

  const visible = statusFilter === 'all' ? students : students.filter((student) => student.status === statusFilter);
  let html = visible.map(studentRowHtml).join('');
  if (!students.length) html = messageRowHtml('No students in this batch yet', 'Once students are enrolled in this batch, they will appear here.');
  else if (!visible.length) html = messageRowHtml('Nobody here', 'No student has this status right now. Try another filter.');

  // Only touches the table when something changed, so a button under the mouse doesn't disappear
  if (html === shownRows) return;
  shownRows = html;
  rosterRows.innerHTML = html;
  rosterRows.removeAttribute('aria-busy');
  addHoverLift(rosterRows);
}

async function loadRoster() {
  if (!selectedId) return;
  const thisLoad = ++latestRosterLoad;
  const data = await loadPageData(`/api/admin/assignments/${selectedId}/submissions`);
  if (thisLoad !== latestRosterLoad) return; // a newer choice has been made, so this answer is out of date
  roster = data;
  showRoster();
}

function showDetail(assignment) {
  detailContent.hidden = !assignment;
  detailEmpty.hidden = Boolean(assignment);
  setBreadcrumbItem(assignment?.title);
  if (!assignment) return;

  document.getElementById('detail-batch').textContent = assignment.batch_name;
  document.getElementById('detail-title').textContent = assignment.title;
  document.getElementById('detail-due').textContent = `Due ${formatDateTime(assignment.due_at)}`;
  document.getElementById('detail-description').textContent = assignment.description;
  document.getElementById('detail-buttons').innerHTML = rowButtonsHtml(assignment);
}

function choose(id, { scroll = false } = {}) {
  const changed = id !== selectedId;
  selectedId = id;
  markSelected();
  showDetail(shownAssignments.find((assignment) => assignment.id === id));
  if (!changed) return;

  statusFilter = 'all';
  shownRows = null;
  rosterRows.setAttribute('aria-busy', 'true');
  window.history.replaceState(null, '', id ? `?assignment=${id}` : window.location.pathname);
  loadRoster().catch((error) => showToast(error.message, 'error'));
  if (scroll && window.matchMedia('(max-width: 960px)').matches) {
    detail.scrollIntoView({ block: 'start', behavior: motionOK ? 'smooth' : 'auto' });
  }
}

// Runs each time the list changes. A chosen assignment that is gone or filtered away gives way to the first one on show.
function onRender(rows) {
  shownAssignments = rows;
  if (askedFor && !rows.some((assignment) => assignment.id === askedFor)) {
    showToast("That assignment isn't available any more.", 'error');
  }
  askedFor = null;

  const stillThere = rows.some((assignment) => assignment.id === selectedId);
  const id = stillThere ? selectedId : rows[0]?.id ?? null;
  if (stillThere && !roster) loadRoster().catch((error) => showToast(error.message, 'error'));
  choose(id);
}

list.addEventListener('click', (event) => {
  const row = event.target.closest('[data-select]');
  if (row) choose(Number(row.dataset.select), { scroll: true });
});

pills.forEach((pill) => {
  pill.addEventListener('click', () => {
    statusFilter = pill.dataset.filter;
    if (roster) showRoster();
  });
});

setupSchedulePage({
  name: 'assignment',
  fields: {
    title: 'assignment-title',
    description: 'assignment-description',
    dueAt: 'assignment-deadline',
    batchId: 'assignment-batch',
  },
  formValues: (assignment) => ({
    title: assignment.title,
    description: assignment.description,
    dueAt: assignment.due_at_local,
    batchId: assignment.batch_id,
  }),
  rowHtml: assignmentRowHtml,
  statusHtml,
  newTitle: 'Post an assignment',
  saveText: 'Post assignment',
  savedText: (assignment, edited) => `Assignment "${assignment.title}" ${edited ? 'updated' : 'posted'}.`,
  emptyTitle: 'No assignments yet',
  emptyText: 'Press "+ New assignment" to post your first one.',
  emptyIcon: CLIPBOARD_ICON,
  onRender,
  onSaved: (assignment) => choose(assignment.id),
});

setInterval(() => {
  if (!document.hidden) loadRoster().catch(() => {});
}, ROSTER_REFRESH_MS);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) loadRoster().catch(() => {});
});
