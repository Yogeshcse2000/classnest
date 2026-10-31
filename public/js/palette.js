// Search: press Ctrl+K on any inner page to find real data, then press Enter or click a result to open it.
// The server does the searching, so each role only ever receives what it is allowed to see.

(function () {
  const isAdmin = window.location.pathname.startsWith('/admin');
  const SEARCH_URL = isAdmin ? '/api/admin/search' : '/api/student/search';
  const WAIT_MS = 150; // wait for a short pause in typing, so every letter doesn't ask the server
  const PLACEHOLDER = isAdmin ? 'Search students, batches, lectures and assignments' : 'Search your lectures and assignments';
  const START_HINT = 'Type to search your lectures and assignments.';
  const TRY_HINT = isAdmin ? 'Try a name, a username or a batch.' : 'Try a lecture or assignment title.';

  const dialog = document.createElement('dialog');
  dialog.className = 'dialog palette';
  dialog.setAttribute('aria-label', 'Search');
  dialog.innerHTML = `
    <div class="palette-search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input type="text" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list"
             aria-label="Search" autocomplete="off" spellcheck="false">
      <kbd>Esc</kbd>
    </div>
    <ul class="palette-list" id="palette-list" role="listbox" aria-label="Results"></ul>`;
  document.body.appendChild(dialog);

  const input = dialog.querySelector('input');
  const list = dialog.querySelector('ul');
  input.placeholder = PLACEHOLDER;

  let results = [];
  let active = 0;
  let waitTimer = null;
  let latestSearch = 0;
  let searching = Promise.resolve();

  // ---------- Showing results ----------

  function detailText(result) {
    if (!result.date) return result.detail;
    const day = new Date(result.date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' });
    const when = result.type === 'Assignment' ? `Due ${day}` : day;
    return [result.detail, when].filter(Boolean).join(' · ');
  }

  function textSpan(className, text) {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text; // textContent keeps any name safe: it can never become HTML
    return span;
  }

  function itemFor(result, index) {
    const item = document.createElement('li');
    item.className = 'palette-item';
    item.id = `palette-item-${index}`;
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', String(index === active));
    item.dataset.index = index;

    item.append(textSpan('palette-title', result.title));
    const detail = detailText(result);
    if (detail) item.append(textSpan('palette-detail', detail));
    return item;
  }

  function groupLabel(type) {
    const row = document.createElement('li');
    row.className = 'palette-group';
    row.setAttribute('role', 'presentation');
    row.textContent = type;
    return row;
  }

  function showMessage(message) {
    const row = document.createElement('li');
    row.className = 'palette-empty';
    row.textContent = message;
    list.replaceChildren(row);
    input.removeAttribute('aria-activedescendant');
  }

  function render() {
    const query = input.value.trim();
    if (!results.length) {
      showMessage(query ? `No results for "${query}". ${TRY_HINT}` : START_HINT);
      return;
    }

    const rows = [];
    results.forEach((result, index) => {
      if (index === 0 || results[index - 1].type !== result.type) rows.push(groupLabel(result.type));
      rows.push(itemFor(result, index));
    });
    list.replaceChildren(...rows);
    input.setAttribute('aria-activedescendant', `palette-item-${active}`);
  }

  function select(index) {
    active = index;
    list.querySelectorAll('.palette-item').forEach((item) => {
      item.setAttribute('aria-selected', String(Number(item.dataset.index) === active));
    });
    input.setAttribute('aria-activedescendant', `palette-item-${active}`);
    list.querySelector(`#palette-item-${active}`).scrollIntoView({ block: 'nearest' });
  }

  // ---------- Searching ----------

  async function search() {
    waitTimer = null;
    const thisSearch = ++latestSearch;
    try {
      const data = await loadPageData(`${SEARCH_URL}?q=${encodeURIComponent(input.value.trim())}`);
      if (thisSearch !== latestSearch) return; // a newer search has started, so this answer is out of date
      results = data.results;
      active = 0;
      render();
    } catch (error) {
      if (thisSearch !== latestSearch) return;
      results = [];
      showMessage("Search isn't available right now. Please try again.");
    }
  }

  function searchNow() {
    clearTimeout(waitTimer);
    searching = search();
  }

  // Open the chosen result. If it is on this page already, the browser won't reload, so show the item here.
  function openActive() {
    const result = results[active];
    if (!result) return;
    dialog.close();
    const alreadyHere = result.url === window.location.pathname + window.location.hash;
    window.location.href = result.url;
    if (alreadyHere) window.dispatchEvent(new HashChangeEvent('hashchange'));
  }

  function open() {
    if (document.querySelector('dialog[open]')) return; // a confirm dialog is already showing
    input.value = '';
    results = [];
    active = 0;
    list.replaceChildren();
    dialog.showModal();
    popIn(dialog);
    searchNow();
  }

  // ---------- Keyboard and mouse ----------

  input.addEventListener('input', () => {
    clearTimeout(waitTimer);
    waitTimer = setTimeout(searchNow, WAIT_MS);
  });

  input.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (waitTimer) searchNow(); // pressed Enter straight after typing: finish this search first
      await searching;
      openActive();
    } else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && results.length) {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      select((active + step + results.length) % results.length);
    }
  });

  list.addEventListener('pointermove', (event) => {
    const item = event.target.closest('.palette-item');
    if (item && Number(item.dataset.index) !== active) select(Number(item.dataset.index));
  });

  // Use the clicked row itself: a tap on a phone never moves the pointer, so it wouldn't have been selected yet
  list.addEventListener('click', (event) => {
    const item = event.target.closest('.palette-item');
    if (!item) return;
    active = Number(item.dataset.index);
    openActive();
  });

  // A click on the dimmed area outside the box lands on the dialog itself
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault(); // otherwise the browser jumps to its address bar
      if (dialog.open) dialog.close();
      else open();
    }
  });

  document.querySelectorAll('[data-palette-open]').forEach((button) => button.addEventListener('click', open));
})();
