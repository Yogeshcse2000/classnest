---
name: classnest-ui
description: Design system for ClassNest. Use it whenever creating or changing any page, component or style.
---

# ClassNest UI

This skill is the single source of design and animation rules for ClassNest. Follow these rules for every page, component and style.

## Identity
The trainer's mockups in `mockups/` set the layout and the elements of every inner page. Their name is replaced by ClassNest, with its own logo. Two themes share that one layout, so a page only ever changes colours and fonts between them, never its structure.

### Design tokens
- **Every colour, font, radius and spacing value is a CSS variable in one file: `public/css/tokens.css`.** The fonts are loaded there too. Every page links it before `style.css`, so a future change needs only that one place.
- `style.css` holds no raw colours at all, only `var(--...)`. Padding, margins and gaps use the `--space-*` steps, and corners use the `--radius-*` steps. Never write a colour or a spacing number inside a component.
- The accent comes from `--primary` and `--primary-text`. Everything derived from it (soft fills, glows, the spotlight, the sidebar's active fill) is worked out from those with `color-mix`, so a role changes only those lines.
- Only two things can't read CSS variables and keep their own colour: `favicon.svg` and the `theme-color` tag in `index.html`. The canvas birds read theirs from the `--bird*` tokens.

### Colours
- **There is no green anywhere in ClassNest:** not in pages, tags, buttons, charts, focus rings or glows. Use the colours below.
- **Base:** pure black background, slightly lighter black surfaces, very thin subtle borders, soft white text, muted grey secondary text.
- **Admin accent:** electric blue on every admin page. **Student accent:** electric orange on every student page. `theme.js` sets `data-role` on `<html>`, and `tokens.css` picks the colour from it.
- The accent is for the active nav item, main buttons, focus rings, glows and highlights. Solid orange takes black text, because white on it is too hard to read.
- **Status colours keep their meaning and never use the accent** (see the Tags table).

### Dark (the default)
- Black, rich and ambient, with very faint accent glows that breathe, and a faint dot grid.
- Thin, soft borders and soft shadows. Pill-shaped buttons.

### Light (the mockups' style, chosen with the toggle)
- Flat cream background (`#fff6e9`), with no glows or dot grid.
- Thick black borders (2px) and hard offset shadows with no blur (`4px 4px 0`).
- The same blue and orange accents. **Text in an accent colour uses the deeper shade** (`--blue-deep`, `--orange-deep`), so contrast stays good.
- Rounded rectangle buttons (12px) instead of pills.
- Space Grotesk for headings instead of Outfit.

### Theme rules
- A theme is a set of colour tokens in `tokens.css`. Components only use tokens, so a new component works in both themes. Don't add per-theme layout rules.
- The login page is always dark.

### Logo
- An original, hand-drawn style white bird's nest of thin twig-like strokes, with an open dark centre, drawn in code as SVG. No images or external assets.
- **Full logo (login only):** the nest, then "CLASSNEST" in uppercase Jost, medium-bold, with wide letter spacing, then a thin line, then "LEARN · GROW · FLY" in small, wide-spaced uppercase. It is written out in `index.html`.
- **Small logo (sidebar):** the small nest plus the name, also in uppercase Jost. It is in `sidebar.js`.
- **Browser tab (`favicon.svg`):** the nest only, in white on black.
- The small nest and the favicon use fewer, hand-placed, thicker twigs, because thin twigs turn to mush at 16 to 28 pixels.
- The nest is always white, in both themes. Jost is only for the logo.

## Apple-level discipline
- **Fonts (from Google Fonts):** Outfit for headings in dark mode, Space Grotesk in light mode, Inter for body text, JetBrains Mono for eyebrows, tags, usernames, date blocks and countdowns, Jost for the logo.
- **Headings:** with slight negative letter spacing. Page headings are 1.75rem to 2.25rem.
- **Spacing:** 20px between sections and cards (`--space-5`). Page padding is 32px on desktop and 16px on phones.
- **Cards:** a consistent 18px radius (`--radius`).
- **Buttons:** with press and focus states.

## One app: shared parts
Every page, now and later, is built from these parts. Reuse them instead of making a new version.

- **Sidebar:** built in one place, `sidebar.js`, and added to a page with one script tag at the top of `<body class="app">`. It looks the same on every inner page, for both roles and in both themes, and stays dark in both. A new page goes in its `links` list, with an icon.
  - **Top row:** the small nest and name on the left. On the right, a search icon and the theme icon, both plain 32px icon buttons with 18px icons. They have no text, no border and no "Ctrl K" label. Search and the theme toggle live here only, never at the bottom.
  - **Nav links:** compact rows (32px high, 13px text), each with a 16px line icon on its left. Icons are free Lucide-style inline SVGs, and are slightly muted (75% opacity) until hovered or active.
  - **Which icon:** Dashboard is a layout grid for admins and a home for students. Batches is layers, Students is users, Lectures is a video camera, Assignments is a notebook, Log out is a log-out arrow.
  - **Hover:** a soft highlight (`--sidebar-hover`) that fades in over 150ms, on rows and on the top icons. It is a `::before` layer behind the item, so only its opacity animates.
  - **Active page:** `aria-current="page"` gives a subtle tinted fill (`--sidebar-active`), brighter text and an icon in `--sidebar-accent`: blue for admins and orange for students, in both themes, kept bright so it stays clear on the dark sidebar. Never a solid colour block.
  - **Bottom:** a thin line, then the user card (name, then "Administrator" or the student's batch; long text ends in "…") and Log out with its icon.
- **Mobile:** at 960px and below, the sidebar becomes a slide-out menu opened from a small bar at the top. It is the same sidebar, with its X button added to the top row, rows 40px high and icon buttons 36px, so they are easy to tap. It closes with its X button, the dimmed area, Esc, a link or the search icon.
- **Page head:** `.page-head` with an optional `.eyebrow`, an `h1`, and `.page-actions` on the right. Pages with only a form and a list (Batches, Students, Lectures) skip it and keep a visually hidden `h1`.
- **Form and list pages:** `.split`, with a `.form-card` on the left and a `.panel` on the right.
- **List and detail pages:** `.split.fill`, with `.pick-row` items on the left and a `.panel.detail` on the right. The picked row has `aria-current="true"`.
- **Dashboards:** `.stat-grid` of four `.stat-card`s, then `.panels` of two `.panel`s.
- **Panels:** `.panel-head` holds the title, then a `.count` like `(6)`, and on the right a search box, filter or `.text-link`.
- **Rows:** `.row-card` for lectures and assignments, with a `.date-block` for anything on a date. The row for today gets `.is-today`.
- **Tables:** `.table` inside a `.panel`, with uppercase column names. Give every cell except the first a `data-label`. When the panel gets narrow, on a phone or beside a list on a small laptop, each row turns into labelled lines.
- **Tags:** every status is a `.tag` from `tagHtml()`, using one of five pairs of colours:

| Colour | Used for |
|---|---|
| calm (a soft blue-white) | On time, Submitted, Upcoming, Started, time left |
| amber | Pending, Live now, the last 24 hours before a deadline |
| peach (a soft coral) | Late, with how late it was on the admin's table, like "Late · 2h" |
| red | Missing |
| quiet | Closed, Done, Not started |

- **Filters:** `.pill` buttons with a count, and `aria-pressed` on the active one.
- **Dates:** every date on a form uses the picker (`data-picker="date"` or `"datetime"`), never the browser's own. Dates in the page use `formatDateTime()`, like "Nov 4, 4:38 AM IST", always in India time and always labelled IST.
- **Time ago:** `timeAgo()`, like "10 min ago", "1 h ago", "Yesterday".
- **Forms in a pop-up:** `.form-dialog`. The whole pop-up scrolls, never the card.
- **No inner scrollbars:** form cards never get `overflow: auto` or a fixed height, and they aren't sticky. Only the sidebar and the search results may scroll by themselves.
- **Nothing fake:** every button does something real. Lists show real data, never sample names.

## Login page
A split screen: black, minimal and classy. It is **neutral black and white until a role is hovered or chosen**. Then the accent, the focus rings and the birds take that role's colour. `login.js` sets `data-accent` on `<body>`, and `tokens.css` does the rest. Don't put `data-role` on the login page's `<html>`: `login.js` finds its tiles with `[data-role]`.

### Left panel
- The full logo on pure black, with a canvas of birds above it.
- Hovering the word shows a moving electric-blue-to-electric-orange gradient inside the letters, **never purple or pink**. Blue and orange meet in white, because mixed directly they turn grey or purple. A wide gradient slides behind a `multiply` layer, so only transform and opacity change.
- **Birds:** 25 to 35 premium birds in `login-flock.js`, flying as a simple boids flock that glides around the logo and softly follows the mouse inside the panel.
  - Each is a soft, elegant swallow silhouette with two curved crescent wings and a forked tail, never an arrow or a triangle.
  - Wings beat gently, each bird at its own speed. Sizes vary, and smaller birds are fainter and slower, for depth.
  - Each bird leaves a very faint, short light trail.
  - The motion is calm: slow speed, and a hard limit on how fast a bird can turn, so it only flies in smooth arcs. Never add random pushes, which look jittery.
  - Soft white with a light glow by default, electric blue when Admin is hovered or chosen, electric orange for Student, with a smooth fade between them.

### Right panel
- "Log in to ClassNest", two tiles (Admin with a shield icon, Student with a graduation cap), and a bordered note box: "Students can't sign up. Your admin creates your login."
- A tile always glows softly in its own colour on hover or keyboard focus.
- The chosen tile morphs into its login form, with a Back button. Back returns the page to black and white.
- Dark inputs with thin borders that glow in the role colour on focus.
- A wrong password gives a small shake and a clear error.
- The form keeps the note box and a "Preview error state" link, which shows the login error without sending anything.
- After a successful login the page fades out and the dashboard fades in (`login.js` leaves a note in `sessionStorage`, `theme.js` reads it, `style.css` does the fade). It only happens right after logging in.

### Login opening
A full-screen cinematic text reveal of about 3.6 seconds, made with one GSAP timeline in `login-intro.js`, in this order:
1. **The reveal:** the screen is pure black, with only "CLASSNEST", very large, in the centre of the whole screen. There is no nest, no birds and no login panel. Each letter springs in one by one.
2. **The emphasis:** one soft light sweep passes across the whole word. A thin line then draws under it from left to right, and "LEARN · GROW · FLY" fades in below.
3. **The move:** the word, line and tagline smoothly shrink and move into the left panel.
4. **The arrival:** only after they arrive, the nest fades in softly above the word, and then the birds fly out of the nest. At the same time, the login panel slides in from the right and fades in.

Rules for the opening:
- The word never leaves its place in the page. It starts with a transform that shrinks to nothing, so it lands exactly where the finished layout has it, with no jump.
- Nothing in the left panel may cut off overflow, or the large word gets clipped.
- There is no Skip button, and clicks and keys never skip it.
- The full opening plays once per browser session.
- After that (for example after logging out, or in a new tab) the finished split layout simply fades in over 0.5 seconds, with the flock already in the air.
- A safety limit may end it on a stalled computer, so nobody is locked out of logging in.
- With `prefers-reduced-motion`, or if GSAP can't load, no opening plays: the finished layout shows straight away with no movement and a still flock. The still flock still changes colour with the tiles.

### Login performance
- 25 to 35 birds. Their glow is one shared gradient, never a blur or `shadowBlur`.
- DOM animations use only transform and opacity, with no exceptions.
- The canvas stops while the tab is hidden, and never runs on tablets and phones.

### Login on phones
At 860px and below there are no birds. The same opening plays faster (about 2 seconds), with a word that fits the screen, then the small logo sits on top and the login below it. The width in `style.css`, `login-flock.js` and `login-intro.js` must match.

### Login exceptions
The login page is the one place with these exceptions, recorded in [PLAN.md](../../../PLAN.md):
- It is always dark, with no light/dark toggle.
- Its intro and birds may run longer than 300ms.

## Inner pages
- Calm, with only short micro-interactions (150-300ms).
- Use spotlight hover, toasts, skeleton loaders and empty states.
- Empty states are friendly: a short helpful message, not a blank area.
- Cards and buttons lift smoothly on hover.
- Numbers on dashboards count up when they appear.
- "Live now" has a pulsing dot next to it.

### Ctrl+K search
- Every inner page has search, opened with Ctrl+K or the search icon at the top of the sidebar.
- It only finds real data and pages. It never contains actions such as "Log out" or "Switch to light mode".
- **Admin:** students (by name, username or email), batches, lectures, assignments, and pages.
- **Student:** only the lectures and assignments of their own batch.
- Results are grouped under small labels (Student, Batch, Lecture, Assignment, Page).
- Clicking a result opens that item. An assignment opens selected on its Assignments page. Anything else opens highlighted in its list.
- When nothing matches, show a friendly "No results" message.

## Rules
- Use GSAP for animations. The login birds are the exception: they are a plain canvas loop.
- No external images or paid assets. Everything is made in code.
- Keep it at 60fps by animating only transform and opacity.
- Respect `prefers-reduced-motion`.
- Works on mobile, from 375px to 1920px wide.
- Never break app logic, APIs or the database.
