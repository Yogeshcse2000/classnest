// The sidebar on every inner page. It is built here, in one place, so all pages get exactly the same one.
// The script tag sits at the top of <body>, so the sidebar appears before the page content does.
// On tablets and phones it becomes a slide-out menu, opened from a small bar at the top.

(function () {
  const isAdmin = window.location.pathname.startsWith('/admin');
  const home = isAdmin ? '/admin/dashboard' : '/student/dashboard';
  const links = isAdmin
    ? [
        { title: 'Dashboard', url: '/admin/dashboard' },
        { title: 'Batches', url: '/admin/batches' },
        { title: 'Students', url: '/admin/students' },
        { title: 'Lectures', url: '/admin/lectures' },
        { title: 'Assignments', url: '/admin/assignments' },
      ]
    : [
        { title: 'Dashboard', url: '/student/dashboard' },
        { title: 'Assignments', url: '/student/assignments' },
      ];

  const LOGO = `<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="currentColor"/><path d="M7 15h18a9 8 0 0 1-18 0Z" fill="#fff"/><circle cx="13" cy="12" r="3" fill="#fff"/><circle cx="19.5" cy="11.5" r="3" fill="#fff" opacity=".7"/></svg>`;
  const SEARCH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`;
  const MOON_ICON = `<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`;
  const SUN_ICON = `<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;
  const MENU_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`;
  const CLOSE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>`;

  // /admin on its own opens the dashboard too, and a trailing slash or .html changes nothing
  const page = window.location.pathname.replace(/(\.html|\/)$/, '');
  const current = links.find((link) => link.url === page)?.url ?? home;

  const linksHtml = links
    .map((link) => {
      const mark = link.url === current ? ' aria-current="page"' : '';
      return `<a class="side-link" href="${link.url}"${mark}>${link.title}</a>`;
    })
    .join('');

  document.currentScript.insertAdjacentHTML(
    'beforebegin',
    `
    <header class="mobile-bar">
      <button class="icon-btn" type="button" id="menu-open" aria-label="Open menu" aria-expanded="false" aria-controls="sidebar">${MENU_ICON}</button>
      <a class="brand" href="${home}">${LOGO}<span>ClassNest</span></a>
    </header>
    <div class="sidebar-scrim" id="menu-scrim" hidden></div>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-top">
        <a class="brand" href="${home}">${LOGO}<span>ClassNest</span></a>
        <span class="role-badge">${isAdmin ? 'Admin' : 'Student'}</span>
        <button class="icon-btn sidebar-close" type="button" id="menu-close" aria-label="Close menu">${CLOSE_ICON}</button>
      </div>
      <nav class="side-nav" aria-label="${isAdmin ? 'Admin' : 'Student'} pages">${linksHtml}</nav>
      <div class="sidebar-foot">
        <div class="sidebar-tools">
          <button class="palette-btn" type="button" data-palette-open data-menu-close aria-label="Search" title="Search (Ctrl+K)">
            <span>${SEARCH_ICON}Search</span>
            <kbd>Ctrl K</kbd>
          </button>
          <button class="icon-btn" type="button" data-theme-toggle aria-label="Switch colour theme">${MOON_ICON}${SUN_ICON}</button>
        </div>
        <div class="user-card">
          <strong data-user-name></strong>
          <span data-user-batch>${isAdmin ? 'Administrator' : ''}</span>
        </div>
        <button class="side-link" type="button" data-logout>Log out</button>
      </div>
    </aside>`
  );

  // ---------- The slide-out menu ----------

  const sidebar = document.getElementById('sidebar');
  const openButton = document.getElementById('menu-open');
  const closeButton = document.getElementById('menu-close');
  const scrim = document.getElementById('menu-scrim');

  function openMenu() {
    sidebar.classList.add('is-open');
    scrim.hidden = false;
    openButton.setAttribute('aria-expanded', 'true');
    closeButton.focus();
  }

  function closeMenu() {
    if (!sidebar.classList.contains('is-open')) return;
    sidebar.classList.remove('is-open');
    scrim.hidden = true;
    openButton.setAttribute('aria-expanded', 'false');
    openButton.focus();
  }

  openButton.addEventListener('click', openMenu);
  closeButton.addEventListener('click', closeMenu);
  scrim.addEventListener('click', closeMenu);
  sidebar.querySelector('[data-menu-close]').addEventListener('click', closeMenu);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', closeMenu);
})();
