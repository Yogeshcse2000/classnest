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

  // The small nest, with fewer bands than the big one in index.html, so it stays clean at 24px. The favicons match it.
  // Each copy needs its own id, because its colours are looked up by id.
  const nestLogo = (id) =>
    `<svg viewBox="0 0 320 262" class="brand-mark" aria-hidden="true"><defs><linearGradient id="${id}-m" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="230"><stop offset="0" stop-color="var(--nest-silver)"/><stop offset=".55" stop-color="var(--nest-steel)"/><stop offset="1" stop-color="var(--nest-graphite)"/></linearGradient><radialGradient id="${id}-g" cx=".36" cy=".26" r=".85"><stop offset="0" stop-color="var(--egg-light)"/><stop offset=".45" stop-color="var(--egg)"/><stop offset="1" stop-color="var(--egg-deep)"/></radialGradient></defs><ellipse cx="160" cy="130" rx="112" ry="85" fill="var(--nest-hollow)"/><ellipse cx="160" cy="126" rx="33" ry="41" fill="url(#${id}-g)"/><g fill="none" stroke="url(#${id}-m)" stroke-width="48"><path d="M255 191C248 196 227 216 211 220C195 224 174 222 160 217C146 212 135 201 125 193C114 184 101 172 96 168"/><path d="M100 210C93 207 67 202 60 194C52 185 52 171 53 159C55 147 63 135 68 123C72 112 77 95 79 89"/><path d="M27 105C30 100 36 84 47 77C58 71 78 68 93 65C109 62 124 63 138 61C151 59 168 55 174 53"/><path d="M138 20C146 22 175 25 190 32C204 39 217 54 225 64C233 75 234 85 238 92C242 100 247 106 248 109"/><path d="M279 74C281 81 293 106 291 120C289 134 276 150 266 158C256 167 241 170 230 173C219 177 205 179 200 180"/></g><g fill="none"><path d="M247 108C249 110 254 115 257 120C260 126 265 132 266 140C268 148 269 158 266 167C264 176 254 190 252 195" stroke="var(--nest-edge)" stroke-width="64" stroke-linecap="round"/><path d="M247 108C249 110 254 115 257 120C260 126 265 132 266 140C268 148 269 158 266 167C264 176 254 190 252 195" stroke="url(#${id}-m)" stroke-width="48" stroke-linecap="round"/><path d="M248 103C250 106 256 113 258 119C261 126 264 134 264 143C264 151 258 166 257 171" stroke="var(--nest-shine)" stroke-width="10" stroke-linecap="round" opacity=".9"/><path d="M203 179C200 181 192 184 185 187C177 190 169 195 160 199C151 202 139 206 128 208C117 210 100 209 94 210" stroke="var(--nest-edge)" stroke-width="64" stroke-linecap="round"/><path d="M203 179C200 181 192 184 185 187C177 190 169 195 160 199C151 202 139 206 128 208C117 210 100 209 94 210" stroke="url(#${id}-m)" stroke-width="48" stroke-linecap="round"/><path d="M190 173C187 174 177 179 169 183C161 186 151 191 141 194C131 197 113 199 107 200" stroke="var(--nest-shine)" stroke-width="10" stroke-linecap="round" opacity=".9"/><path d="M99 170C96 168 85 161 77 156C70 151 60 146 53 141C46 135 38 129 34 122C29 116 28 105 27 102" stroke="var(--nest-edge)" stroke-width="64" stroke-linecap="round"/><path d="M99 170C96 168 85 161 77 156C70 151 60 146 53 141C46 135 38 129 34 122C29 116 28 105 27 102" stroke="url(#${id}-m)" stroke-width="48" stroke-linecap="round"/><path d="M85 153C81 151 69 144 61 139C53 133 44 128 38 122C32 116 27 105 24 102" stroke="var(--nest-shine)" stroke-width="10" stroke-linecap="round" opacity=".9"/><path d="M79 93C79 89 81 77 84 70C86 62 88 53 93 46C98 39 105 32 113 28C121 24 138 21 143 20" stroke="var(--nest-edge)" stroke-width="64" stroke-linecap="round"/><path d="M79 93C79 89 81 77 84 70C86 62 88 53 93 46C98 39 105 32 113 28C121 24 138 21 143 20" stroke="url(#${id}-m)" stroke-width="48" stroke-linecap="round"/><path d="M77 71C78 67 80 55 84 48C87 40 91 32 98 26C104 20 119 15 123 12" stroke="var(--nest-shine)" stroke-width="10" stroke-linecap="round" opacity=".9"/><path d="M170 54C174 53 186 49 195 48C204 46 215 45 225 46C235 47 247 50 257 56C266 61 278 74 282 78" stroke="var(--nest-edge)" stroke-width="64" stroke-linecap="round"/><path d="M170 54C174 53 186 49 195 48C204 46 215 45 225 46C235 47 247 50 257 56C266 61 278 74 282 78" stroke="url(#${id}-m)" stroke-width="48" stroke-linecap="round"/><path d="M178 41C182 40 196 36 205 36C215 35 227 36 237 39C247 42 262 52 267 55" stroke="var(--nest-shine)" stroke-width="10" stroke-linecap="round" opacity=".9"/></g></svg>`;
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
      <a class="brand" href="${home}">${nestLogo('nest-bar')}<span>ClassNest</span></a>
    </header>
    <div class="sidebar-scrim" id="menu-scrim" hidden></div>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-top">
        <a class="brand" href="${home}">${nestLogo('nest-side')}<span>ClassNest</span></a>
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

  // ---------- The breadcrumb ----------

  // Home > Dashboard, or Home > Assignments > Build a page while one item is open.
  // Each page has an empty <nav id="crumbs">. Names go in with textContent, so a title can't become HTML.
  const pageTitle = links.find((link) => link.url === current).title;
  let openItem = null;

  function showBreadcrumb() {
    const steps = [{ title: 'Home', url: home }, { title: pageTitle, url: openItem ? current : null }];
    if (openItem) steps.push({ title: openItem });

    const list = document.createElement('ol');
    steps.forEach((step) => {
      const part = document.createElement(step.url ? 'a' : 'span');
      part.textContent = step.title;
      if (step.url) part.href = step.url;
      else part.setAttribute('aria-current', 'page');
      const item = document.createElement('li');
      item.append(part);
      list.append(item);
    });
    document.getElementById('crumbs').replaceChildren(list);
  }

  window.setBreadcrumbItem = (title) => {
    openItem = title || null;
    showBreadcrumb();
  };
  document.addEventListener('DOMContentLoaded', showBreadcrumb);
})();
