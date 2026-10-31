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

function startLabel(startDate) {
  const today = new Date().toISOString().slice(0, 10);
  return `${startDate > today ? 'Starts' : 'Started'} ${formatDate(startDate)}`;
}

function batchCardHtml(batch) {
  const description = batch.description
    ? `<p class="batch-desc">${escapeHtml(batch.description)}</p>`
    : `<p class="batch-desc">No description yet.</p>`;

  return `
    <article class="card lift batch-card" data-id="${batch.id}">
      <div class="batch-card-top">
        <h3>${escapeHtml(batch.name)}</h3>
        <button class="icon-btn icon-btn-danger" type="button" data-delete="${batch.id}"
                aria-label="Delete ${escapeHtml(batch.name)}" title="Delete batch">${TRASH_ICON}</button>
      </div>
      <span class="chip chip-green">${startLabel(batch.start_date)}</span>
      ${description}
      <div class="batch-card-foot">${plural(batch.student_count, 'student')}</div>
    </article>`;
}

const EMPTY_HTML = `
  <div class="card empty-state">
    <div class="empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 8l9 5 9-5z"/><path d="m3 13 9 5 9-5"/></svg></div>
    <h2>No batches yet</h2>
    <p>Create your first batch with the form. Then you can start enrolling students into it.</p>
  </div>`;

function render() {
  countLabel.textContent = batches.length ? plural(batches.length, 'batch', 'batches') : '';
  list.innerHTML = batches.length ? batches.map(batchCardHtml).join('') : EMPTY_HTML;
  list.removeAttribute('aria-busy');
  addHoverLift(list);
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
    if (motionOK) gsap.from(list.firstElementChild, { opacity: 0, scale: 0.94, y: 10, duration: 0.3, ease: 'back.out(1.6)' });
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

  if (batch.student_count > 0) {
    showToast(`"${batch.name}" still has ${plural(batch.student_count, 'student')}. Only empty batches can be deleted.`, 'error');
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
    const card = button.closest('.batch-card');
    if (motionOK) {
      gsap.to(card, { opacity: 0, scale: 0.94, duration: 0.25, ease: 'power2.in', onComplete: removeFromList });
    } else {
      removeFromList();
    }
    showToast(`Deleted "${batch.name}".`);
  } catch (error) {
    showToast(error.message, 'error');
  }
});

// ---------- Start ----------

enterAnimation('.welcome, .split > *');

loadPageData('/api/admin/batches')
  .then((data) => {
    batches = data.batches;
    render();
    enterAnimation('#batch-list > *');
  })
  .catch((error) => {
    list.removeAttribute('aria-busy');
    list.innerHTML = `<p class="alert alert-error">${escapeHtml(error.message)}</p>`;
  });
