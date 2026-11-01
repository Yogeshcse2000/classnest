// Batches page (admin): create, list and delete batches.

setupLogout();
showCurrentUser();

const form = document.getElementById('batch-form');
const nameInput = document.getElementById('batch-name');
const startInput = document.getElementById('batch-start');
const descriptionInput = document.getElementById('batch-description');
const formError = document.getElementById('batch-error');
const saveButton = document.getElementById('batch-save');
const list = document.getElementById('batch-list');
const countLabel = document.getElementById('batch-count');

const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>`;

let batches = [];

// ---------- Showing the list ----------

function batchRowHtml(batch) {
  const description = batch.description ? `<span class="table-sub">${escapeHtml(batch.description)}</span>` : '';
  return `
    <tr id="batch-${batch.id}">
      <td class="table-name">${escapeHtml(batch.name)}${description}</td>
      <td data-label="Start"><span class="cell-stack">${batch.started ? tagHtml('Started', 'calm') : tagHtml('Not started', 'quiet')}<span class="table-sub">${formatDate(batch.start_date)}</span></span></td>
      <td data-label="Students">${batch.student_count}</td>
      <td data-label="Lectures">${batch.lecture_count}</td>
      <td data-label="Assignments">${batch.assignment_count}</td>
      <td class="table-action">
        <div class="row-buttons">
          <button class="icon-btn icon-btn-danger" type="button" data-delete="${batch.id}"
                  aria-label="Delete ${escapeHtml(batch.name)}" title="Delete batch">${TRASH_ICON}</button>
        </div>
      </td>
    </tr>`;
}

const EMPTY_HTML = `
  <tr class="table-message">
    <td colspan="6">
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 8l9 5 9-5z"/><path d="m3 13 9 5 9-5"/></svg></div>
        <h2>No batches yet</h2>
        <p>Create your first batch with the form. Then you can start enrolling students into it.</p>
      </div>
    </td>
  </tr>`;

function render() {
  countLabel.textContent = `(${batches.length})`;
  list.innerHTML = batches.length ? batches.map(batchRowHtml).join('') : EMPTY_HTML;
  list.removeAttribute('aria-busy');
}

// ---------- Creating a batch ----------

function showFormError(message) {
  formError.textContent = message;
  formError.hidden = false;
  if (motionOK) gsap.fromTo(formError, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.25 });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formError.hidden = true;

  if (!nameInput.value.trim()) return showFormError('Please give the batch a name.');
  if (!startInput.value) return showFormError('Please pick a start date.');

  saveButton.disabled = true;
  saveButton.textContent = 'Creating…';
  try {
    const { batch } = await api('/api/admin/batches', {
      method: 'POST',
      body: { name: nameInput.value, startDate: startInput.value, description: descriptionInput.value },
    });
    batches.unshift(batch);
    render();
    if (motionOK) gsap.from(list.firstElementChild, { opacity: 0, y: -8, duration: 0.3, ease: 'power2.out', clearProps: 'opacity,transform' });
    form.reset();
    showToast(`Batch "${batch.name}" created.`);
  } catch (error) {
    showFormError(error.message);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Create batch';
  }
});

// ---------- Deleting a batch ----------

list.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-delete]');
  if (!button) return;
  const batch = batches.find((b) => b.id === Number(button.dataset.delete));

  // A batch with anything in it stays, so no student, lecture or assignment is left without a batch
  const stillInside = [];
  if (batch.student_count) stillInside.push(plural(batch.student_count, 'student'));
  if (batch.lecture_count) stillInside.push(plural(batch.lecture_count, 'lecture'));
  if (batch.assignment_count) stillInside.push(plural(batch.assignment_count, 'assignment'));

  if (stillInside.length) {
    showToast(`"${batch.name}" still has ${stillInside.join(', ')}. Only empty batches can be deleted.`, 'error');
    return;
  }

  const confirmed = await confirmDialog({
    title: `Delete "${batch.name}"?`,
    message: "This can't be undone.",
    confirmText: 'Delete batch',
  });
  if (!confirmed) return;

  try {
    await api(`/api/admin/batches/${batch.id}`, { method: 'DELETE' });
    const removeFromList = () => {
      batches = batches.filter((b) => b.id !== batch.id);
      render();
    };
    const row = button.closest('tr');
    if (motionOK) {
      gsap.to(row, { opacity: 0, x: 12, duration: 0.25, ease: 'power2.in', onComplete: removeFromList });
    } else {
      removeFromList();
    }
    showToast(`Deleted "${batch.name}".`);
  } catch (error) {
    showToast(error.message, 'error');
  }
});

// ---------- Start ----------

enterAnimation('.split > *');

loadPageData('/api/admin/batches')
  .then((data) => {
    batches = data.batches;
    render();
    enterAnimation('#batch-list'); // the list as one piece: row by row takes seconds on a long list
    showLinkedItem();
  })
  .catch((error) => {
    list.removeAttribute('aria-busy');
    list.innerHTML = `<tr class="table-message"><td colspan="6"><p class="alert alert-error">${escapeHtml(error.message)}</p></td></tr>`;
  });
