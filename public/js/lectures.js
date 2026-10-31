// Lectures page (admin): release, edit, delete and filter lectures. The shared parts are in schedule.js.

const timeInput = document.getElementById('lecture-time');
const pastNote = document.getElementById('lecture-past');

const LINK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/></svg>`;
const CAMERA_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3"/></svg>`;

function statusHtml(lecture) {
  if (lecture.status === 'Live now') return liveTagHtml('Live now');
  return lecture.status === 'Upcoming' ? tagHtml('Upcoming', 'green') : tagHtml('Done', 'quiet');
}

function lectureRowHtml(lecture) {
  const title = escapeHtml(lecture.title);
  const batch = escapeHtml(lecture.batch_name);
  const today = istDay(Date.now());
  return `
    <li class="row-card${istDay(lecture.starts_at) === today ? ' is-today' : ''}" id="lecture-${lecture.id}">
      ${dateBlockHtml(lecture.starts_at, today)}
      <div class="row-main">
        <strong>${title}</strong>
        <span>${batch} · ${formatTime(lecture.starts_at)} IST</span>
      </div>
      <div class="row-side">
        <span data-status></span>
      </div>
      <div class="row-buttons">
        <a class="icon-btn" href="${escapeHtml(lecture.meet_link)}" target="_blank" rel="noopener noreferrer"
           aria-label="Open the Meet link for ${title}" title="Open Meet link">${LINK_ICON}</a>
        ${rowButtonsHtml(lecture)}
      </div>
    </li>`;
}

// The warning under the date. Only the server's clock counts, so ask it instead of looking at the computer's time.
// A warning never stops the save. latestCheck ignores an old answer if the admin changed the date again.
let latestCheck = 0;
async function checkTime() {
  const thisCheck = ++latestCheck;
  pastNote.hidden = true;
  if (!timeInput.value) return;
  try {
    const { past } = await api(`/api/admin/lectures/check-time?startsAt=${encodeURIComponent(timeInput.value)}`);
    if (thisCheck === latestCheck) pastNote.hidden = !past;
  } catch (error) {
    // Nothing to show: the server checks the time again when saving
  }
}
timeInput.addEventListener('change', checkTime);

setupSchedulePage({
  name: 'lecture',
  fields: { title: 'lecture-title', startsAt: 'lecture-time', meetLink: 'lecture-link', batchId: 'lecture-batch' },
  formValues: (lecture) => ({
    title: lecture.title,
    startsAt: lecture.starts_at_local,
    meetLink: lecture.meet_link,
    batchId: lecture.batch_id,
  }),
  rowHtml: lectureRowHtml,
  statusHtml,
  newTitle: 'Release a lecture',
  saveText: 'Release lecture',
  savedText: (lecture, edited) => `Lecture "${lecture.title}" ${edited ? 'updated' : 'released'}.`,
  emptyTitle: 'No lectures yet',
  emptyText: 'Release your first lecture with the form. It will appear right here.',
  emptyIcon: CAMERA_ICON,
  onFormChange: checkTime,
});
