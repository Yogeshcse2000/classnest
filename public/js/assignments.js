// Assignments page (admin): post, edit, delete and filter assignments. The shared parts are in schedule.js.

const CLIPBOARD_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 2h6v4H9zM9 12h6M9 16h4"/></svg>`;

// Amber for the last 24 hours, "Closed" once the deadline has passed
function statusHtml(assignment) {
  if (assignment.deadline_status === 'closed') return '<span class="chip chip-quiet">Closed</span>';
  const style = assignment.deadline_status === 'soon' ? 'chip-amber' : 'chip-green';
  return `<span class="chip ${style}">${timeLeftText(assignment.minutes_left)}</span>`;
}

function assignmentRowHtml(assignment) {
  const title = escapeHtml(assignment.title);
  const batch = escapeHtml(assignment.batch_name);
  return `
    <li class="list-row schedule-row" id="assignment-${assignment.id}">
      <div class="list-main">
        <strong title="${title}">${title}</strong>
        <span>Due ${formatDateTime(assignment.due_at)}</span>
      </div>
      <div class="list-meta">
        <span class="status-spot" data-status></span>
        <span class="chip chip-batch" title="${batch}">${batch}</span>
      </div>
      <div class="row-buttons">${rowButtonsHtml(assignment)}</div>
    </li>`;
}

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
  emptyText: 'Post your first assignment with the form. It will appear right here.',
  emptyIcon: CLIPBOARD_ICON,
});
