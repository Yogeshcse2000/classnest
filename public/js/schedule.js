// Shared by the Lectures and Assignments pages, which work the same way: a form and a filtered list. The Lectures form
// sits beside its list. The Assignments form is in a pop-up. Each page passes in only what is different about it. The server sends every status and time left, because
// its clock is the one that counts. This file only shows them.

const REFRESH_MS = 30000; // statuses change as time passes, so ask the server again every 30 seconds

const PENCIL_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`;
const BIN_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>`;
const STACK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 8l9 5 9-5z"/><path d="m3 13 9 5 9-5"/></svg>`;

// The Edit and Delete buttons at the end of a row
function rowButtonsHtml(item) {
  const title = escapeHtml(item.title);
  return `
    <button class="icon-btn" type="button" data-edit="${item.id}" aria-label="Edit ${title}" title="Edit">${PENCIL_ICON}</button>
    <button class="icon-btn icon-btn-danger" type="button" data-delete="${item.id}" aria-label="Delete ${title}" title="Delete">${BIN_ICON}</button>`;
}

// name: 'lecture' or 'assignment'. The page's elements are found from it, like #lecture-form and #lecture-list.
// fields: form field -> input id, like { title: 'lecture-title' }
// formValues(item): what each form field holds while editing an item
// rowHtml(item): one row of the list, with an empty [data-status] element
// statusHtml(item): what goes in that element
// newTitle, saveText, savedText(item, edited), emptyTitle, emptyText, emptyIcon: the words and icon for this page
// onFormChange(): runs after the form is filled or emptied
// onRender(rows): runs after the list changes or is refreshed
// onSaved(item): runs after an item is saved
function setupSchedulePage({
  name,
  fields,
  formValues,
  rowHtml,
  statusHtml,
  saveText,
  savedText,
  emptyTitle,
  emptyText,
  emptyIcon,
  newTitle,
  onFormChange = () => {},
  onRender = () => {},
  onSaved = () => {},
}) {
  const apiPath = `/api/admin/${name}s`;
  const element = (suffix) => document.getElementById(`${name}-${suffix}`);
  // The dashboard's "+ Release lecture" and "+ Post assignment" buttons land here with #new in the address
  const openedForNew = window.location.hash === '#new';
  if (openedForNew) window.history.replaceState(null, '', window.location.pathname);

  const dialog = element('dialog'); // only when the form is in a pop-up
  const formCard = element('form-card');
  const form = element('form');
  const formTitle = element('form-title');
  const formError = element('error');
  const saveButton = element('save');
  const cancelButton = element('cancel');
  const list = element('list');
  const countLabel = element('count');
  const filter = element('filter');
  const batchInput = document.getElementById(fields.batchId);
  const inputs = Object.entries(fields).map(([field, id]) => ({ field, input: document.getElementById(id) }));

  let items = [];
  let editingId = null;
  let shownRows = null;
  let latestLoad = 0;

  // ---------- Showing the list ----------

  function visibleItems() {
    const batchId = Number(filter.value);
    return batchId ? items.filter((item) => item.batch_id === batchId) : items;
  }

  // Fills in the status of each row. A row is only touched when its status really changed.
  function showStatuses() {
    visibleItems().forEach((item) => {
      const spot = document.querySelector(`#${name}-${item.id} [data-status]`);
      const html = statusHtml(item);
      if (!spot || spot.dataset.shown === html) return;
      stopLiveDots(spot);
      spot.dataset.shown = html;
      spot.innerHTML = html;
      pulseLiveDots(spot);
    });
  }

  function emptyHtml() {
    const title = items.length ? `No ${name}s for this batch` : emptyTitle;
    const text = items.length ? 'Pick another batch, or add one with the form.' : emptyText;
    return `
      <li class="empty-state">
        <div class="empty-icon" aria-hidden="true">${emptyIcon}</div>
        <h2>${title}</h2>
        <p>${text}</p>
      </li>`;
  }

  function render() {
    const rows = visibleItems();
    countLabel.textContent = `(${rows.length})`;
    stopLiveDots(list);
    list.innerHTML = rows.length ? rows.map(rowHtml).join('') : emptyHtml();
    list.removeAttribute('aria-busy');
    shownRows = rows.map(rowHtml).join('');
    showStatuses();
    addHoverLift(list);
    onRender(rows);
  }

  // Asks the server for the list. Rows only rebuild if something other than a status changed,
  // so a button the admin is about to press doesn't disappear under the mouse.
  async function load() {
    const thisLoad = ++latestLoad;
    const data = await loadPageData(apiPath);
    if (thisLoad !== latestLoad) return; // a newer change has happened, so this answer is out of date
    items = data[`${name}s`];
    if (visibleItems().map(rowHtml).join('') === shownRows) {
      showStatuses();
      onRender(visibleItems());
    } else {
      render();
    }
  }

  function highlightRow(id) {
    const row = document.getElementById(`${name}-${id}`);
    if (row && motionOK) gsap.from(row, { opacity: 0, y: -8, duration: 0.3, ease: 'power2.out', clearProps: 'opacity,transform' });
  }

  // ---------- Form errors ----------

  function clearError({ input }) {
    input.removeAttribute('aria-invalid');
    document.getElementById(`${input.id}-error`).hidden = true;
  }

  function clearErrors() {
    formError.hidden = true;
    inputs.forEach(clearError);
  }

  // Shows each message right under its field, then moves the cursor to the first wrong one
  function showFieldErrors(messages) {
    const wrong = inputs.filter(({ field }) => messages[field]);
    wrong.forEach(({ field, input }) => {
      const message = document.getElementById(`${input.id}-error`);
      message.textContent = messages[field];
      message.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      if (motionOK) gsap.fromTo(message, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.25 });
    });
    wrong[0]?.input.focus();
  }

  function showFormError(message) {
    formError.textContent = message;
    formError.hidden = false;
    if (motionOK) gsap.fromTo(formError, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.25 });
  }

  inputs.forEach((entry) => {
    entry.input.addEventListener('input', () => clearError(entry));
  });

  // ---------- The form ----------

  function showForm() {
    if (!dialog || dialog.open) return;
    dialog.showModal();
    popIn(dialog);
  }

  function hideForm() {
    if (dialog?.open) dialog.close();
  }

  // The "+ New" buttons on the page. The Lectures form is already showing, so the cursor just moves into it.
  function startNew() {
    if (editingId) stopEditing();
    showForm();
    if (!dialog) formCard.scrollIntoView({ block: 'nearest', behavior: motionOK ? 'smooth' : 'auto' });
    inputs[0].input.focus({ preventScroll: true });
  }

  // Back to adding a new item. The batch stays chosen, so adding several to one batch is quick.
  function stopEditing({ keepBatch = false } = {}) {
    const batchId = batchInput.value;
    editingId = null;
    form.reset();
    if (keepBatch) batchInput.value = batchId;
    formTitle.textContent = newTitle;
    saveButton.textContent = saveText;
    cancelButton.hidden = !dialog; // a pop-up always needs a way out
    clearErrors();
    onFormChange();
  }

  function startEditing(item) {
    editingId = item.id;
    clearErrors();
    const values = formValues(item);
    inputs.forEach(({ field, input }) => (input.value = values[field]));
    refreshPickers(form);
    formTitle.textContent = `Edit ${name}`;
    saveButton.textContent = 'Save changes';
    cancelButton.hidden = false;
    onFormChange();
    showForm();
    if (!dialog) formCard.scrollIntoView({ block: 'nearest', behavior: motionOK ? 'smooth' : 'auto' });
    inputs[0].input.focus({ preventScroll: true });
  }

  cancelButton.addEventListener('click', () => {
    stopEditing();
    hideForm();
  });

  // ---------- Saving ----------

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();

    const body = Object.fromEntries(inputs.map(({ field, input }) => [field, input.value]));
    const wasEditing = editingId;

    saveButton.disabled = true;
    saveButton.textContent = 'Saving…';
    try {
      const data = await api(wasEditing ? `${apiPath}/${wasEditing}` : apiPath, {
        method: wasEditing ? 'PUT' : 'POST',
        body,
      });
      const saved = data[name];

      if (filter.value && Number(filter.value) !== saved.batch_id) filter.value = ''; // so the saved item is on show
      stopEditing({ keepBatch: !wasEditing });
      hideForm();
      await load().catch(() => {}); // it is saved either way: the next refresh will show it
      onSaved(saved);
      highlightRow(saved.id);
      showToast(data.warning || savedText(saved, wasEditing));
    } catch (error) {
      if (error.fields) {
        showFieldErrors(error.fields);
      } else if (error.status === 404) {
        stopEditing();
        hideForm();
        showToast(error.message, 'error');
        load().catch(() => {});
      } else {
        showFormError(error.message);
      }
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = editingId ? 'Save changes' : saveText;
    }
  });

  // ---------- Edit and delete buttons ----------

  async function deleteItem(item) {
    const confirmed = await confirmDialog({
      title: `Delete "${item.title}"?`,
      message: "This can't be undone.",
      confirmText: `Delete ${name}`,
    });
    if (!confirmed) return;

    try {
      await api(`${apiPath}/${item.id}`, { method: 'DELETE' });
      latestLoad++; // a list already on its way from the server still has this item in it
      if (editingId === item.id) stopEditing();
      const removeFromList = () => {
        items = items.filter((other) => other.id !== item.id);
        render();
      };
      const row = document.getElementById(`${name}-${item.id}`);
      if (motionOK && row) {
        gsap.to(row, { opacity: 0, x: 12, duration: 0.25, ease: 'power2.in', onComplete: removeFromList });
      } else {
        removeFromList();
      }
      showToast(`Deleted "${item.title}".`);
    } catch (error) {
      showToast(error.message, 'error');
      load().catch(() => {});
    }
  }

  // These buttons can be in the list or beside it
  document.querySelector('main').addEventListener('click', (event) => {
    const button = event.target.closest('[data-edit], [data-delete]');
    if (!button) return;
    const item = items.find((other) => other.id === Number(button.dataset.edit || button.dataset.delete));
    if (!item) return;
    if (button.dataset.edit) startEditing(item);
    else deleteItem(item);
  });

  element('new')?.addEventListener('click', startNew);

  if (dialog) {
    element('close').addEventListener('click', hideForm);
    // A click on the dimmed area outside the form lands on the dialog itself
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) hideForm();
    });
    // Closing with Esc while editing also ends the edit, so the next "+ New" starts with an empty form
    dialog.addEventListener('close', () => {
      if (editingId) stopEditing();
    });
  }

  // ---------- Batches ----------

  filter.addEventListener('change', render);

  function fillBatchSelects(batches) {
    const options = batches.map((batch) => `<option value="${batch.id}">${escapeHtml(batch.name)}</option>`).join('');
    filter.innerHTML = `<option value="">All batches</option>${options}`;

    if (batches.length) {
      batchInput.innerHTML = `<option value="">Choose a batch</option>${options}`;
      return;
    }
    // No batches yet: replace the form with a friendly pointer to the Batches page
    formCard.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true">${STACK_ICON}</div>
        <h2>Create a batch first</h2>
        <p>Every ${name} belongs to a batch. Make one, then come back here.</p>
        <a class="btn btn-primary" href="/admin/batches">Go to Batches</a>
      </div>`;
    addHoverLift(formCard);
  }

  // ---------- Start ----------

  setupLogout();
  showCurrentUser();
  enterAnimation('.page-head, .split > *');

  // A search result can point at a row the batch filter is hiding, so show everything again
  window.addEventListener('hashchange', () => {
    const id = window.location.hash.slice(1);
    const wanted = items.find((item) => `${name}-${item.id}` === id);
    if (!wanted || document.getElementById(id)) return;
    filter.value = '';
    render();
    showLinkedItem();
  });

  Promise.all([loadPageData('/api/admin/batches'), load()])
    .then(([batchData]) => {
      fillBatchSelects(batchData.batches);
      enterAnimation(`#${name}-list`); // the list as one piece: row by row takes seconds on a long list
      showLinkedItem();

      if (openedForNew) startNew();

      setInterval(() => {
        if (!document.hidden) load().catch(() => {});
      }, REFRESH_MS);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) load().catch(() => {});
      });
    })
    .catch((error) => {
      list.removeAttribute('aria-busy');
      list.innerHTML = `<li class="alert alert-error">${escapeHtml(error.message)}</li>`;
    });
}
