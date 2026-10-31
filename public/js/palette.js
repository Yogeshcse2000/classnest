// Command palette: press Ctrl+K on any inner page, type a few letters, and press Enter to jump to a page or run an action.

(function () {
  const dialog = document.createElement('dialog');
  dialog.className = 'dialog palette';
  dialog.setAttribute('aria-label', 'Command palette');
  dialog.innerHTML = `
    <div class="palette-search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input type="text" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list"
             aria-label="Search pages and actions" placeholder="Search pages and actions" autocomplete="off" spellcheck="false">
      <kbd>Esc</kbd>
    </div>
    <ul class="palette-list" id="palette-list" role="listbox" aria-label="Results"></ul>`;
  document.body.appendChild(dialog);

  const input = dialog.querySelector('input');
  const list = dialog.querySelector('ul');
  const themeButton = document.querySelector('[data-theme-toggle]');
  const logoutButton = document.querySelector('[data-logout]');

  let matches = [];
  let active = 0;

  // Everything the palette can do, read from the page so it always matches the top bar
  function allCommands() {
    const pages = [...document.querySelectorAll('.nav a')].map((link) => ({
      label: `Go to ${link.textContent}`,
      kind: 'Page',
      run: () => (window.location.href = link.href),
    }));
    return [
      ...pages,
      { label: themeButton.getAttribute('aria-label'), kind: 'Action', run: () => themeButton.click() },
      { label: 'Log out', kind: 'Action', run: () => logoutButton.click() },
    ];
  }

  function itemFor(command, index) {
    const item = document.createElement('li');
    item.className = 'palette-item';
    item.id = `palette-item-${index}`;
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', String(index === active));
    item.dataset.index = index;

    const label = document.createElement('span');
    label.textContent = command.label;
    const kind = document.createElement('span');
    kind.className = 'palette-kind';
    kind.textContent = command.kind;
    item.append(label, kind);
    return item;
  }

  function render() {
    const query = input.value.trim().toLowerCase();
    matches = allCommands().filter((command) => command.label.toLowerCase().includes(query));
    active = Math.min(active, Math.max(matches.length - 1, 0));

    if (matches.length) {
      list.replaceChildren(...matches.map(itemFor));
      input.setAttribute('aria-activedescendant', `palette-item-${active}`);
    } else {
      const empty = document.createElement('li');
      empty.className = 'palette-empty';
      empty.textContent = 'Nothing found. Try "batches" or "log out".';
      list.replaceChildren(empty);
      input.removeAttribute('aria-activedescendant');
    }
  }

  function select(index) {
    active = index;
    list.querySelectorAll('.palette-item').forEach((item) => {
      item.setAttribute('aria-selected', String(Number(item.dataset.index) === active));
    });
    input.setAttribute('aria-activedescendant', `palette-item-${active}`);
    list.querySelector(`#palette-item-${active}`).scrollIntoView({ block: 'nearest' });
  }

  function runActive() {
    const command = matches[active];
    if (!command) return;
    dialog.close();
    command.run();
  }

  function open() {
    if (document.querySelector('dialog[open]')) return; // a confirm dialog is already showing
    input.value = '';
    active = 0;
    render();
    dialog.showModal();
    popIn(dialog);
  }

  input.addEventListener('input', () => {
    active = 0;
    render();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      runActive();
    } else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && matches.length) {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      select((active + step + matches.length) % matches.length);
    }
  });

  list.addEventListener('pointermove', (event) => {
    const item = event.target.closest('.palette-item');
    if (item && Number(item.dataset.index) !== active) select(Number(item.dataset.index));
  });

  list.addEventListener('click', (event) => {
    if (event.target.closest('.palette-item')) runActive();
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
