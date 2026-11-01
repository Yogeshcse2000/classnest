// The sidebar on every inner page. It is built here, in one place, so all pages get exactly the same one.
// The script tag sits at the top of <body>, so the sidebar appears before the page content does.
// On tablets and phones it becomes a slide-out menu, opened from a small bar at the top.

(function () {
  const isAdmin = window.location.pathname.startsWith('/admin');
  const home = isAdmin ? '/admin/dashboard' : '/student/dashboard';

  // Line icons from Lucide, which are free to use. They are written here so the page needs no icon library.
  const icon = (shapes) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes}</svg>`;

  const GRID_ICON = icon('<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>');
  const HOME_ICON = icon('<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>');
  const LAYERS_ICON = icon('<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>');
  const USERS_ICON = icon('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>');
  const VIDEO_ICON = icon('<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>');
  const NOTEBOOK_ICON = icon('<path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M16 2v20"/>');
  const LOGOUT_ICON = icon('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>');
  const SEARCH_ICON = icon('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>');
  const MENU_ICON = icon('<path d="M4 7h16M4 12h16M4 17h16"/>');
  const CLOSE_ICON = icon('<path d="M6 6l12 12M18 6 6 18"/>');

  const links = isAdmin
    ? [
        { title: 'Dashboard', url: '/admin/dashboard', icon: GRID_ICON },
        { title: 'Batches', url: '/admin/batches', icon: LAYERS_ICON },
        { title: 'Students', url: '/admin/students', icon: USERS_ICON },
        { title: 'Lectures', url: '/admin/lectures', icon: VIDEO_ICON },
        { title: 'Assignments', url: '/admin/assignments', icon: NOTEBOOK_ICON },
      ]
    : [
        { title: 'Dashboard', url: '/student/dashboard', icon: HOME_ICON },
        { title: 'Assignments', url: '/student/assignments', icon: NOTEBOOK_ICON },
      ];

  const LOGO = `<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="currentColor"/><path d="M7 15h18a9 8 0 0 1-18 0Z" fill="#fff"/><circle cx="13" cy="12" r="3" fill="#fff"/><circle cx="19.5" cy="11.5" r="3" fill="#fff" opacity=".7"/></svg>`;
  const MOON_ICON = `<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`;
  const SUN_ICON = `<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;

  // /admin on its own opens the dashboard too, and a trailing slash or .html changes nothing
  const page = window.location.pathname.replace(/(\.html|\/)$/, '');
  const current = links.find((link) => link.url === page)?.url ?? home;

  const linksHtml = links
    .map((link) => {
      const mark = link.url === current ? ' aria-current="page"' : '';
      return `<a class="side-link" href="${link.url}"${mark}>${link.icon}<span>${link.title}</span></a>`;
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
        <div class="sidebar-tools">
          <button class="icon-btn" type="button" data-palette-open data-menu-close aria-label="Search" title="Search (Ctrl+K)">${SEARCH_ICON}</button>
          <button class="icon-btn" type="button" data-theme-toggle aria-label="Switch colour theme">${MOON_ICON}${SUN_ICON}</button>
          <button class="icon-btn sidebar-close" type="button" id="menu-close" aria-label="Close menu">${CLOSE_ICON}</button>
        </div>
      </div>
      <nav class="side-nav" aria-label="${isAdmin ? 'Admin' : 'Student'} pages">${linksHtml}</nav>
      <div class="sidebar-foot">
        <div class="user-card">
          <strong data-user-name></strong>
          <span data-user-batch>${isAdmin ? 'Administrator' : ''}</span>
        </div>
        <button class="side-link" type="button" data-logout>${LOGOUT_ICON}<span>Log out</span></button>
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
