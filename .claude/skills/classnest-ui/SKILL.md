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
- Only two things can't read CSS variables and keep their own colour: the three favicon files and the `theme-color` tag in `index.html`. The canvas birds read theirs from the `--bird*` tokens, and the logo reads the `--mark*` tokens.
- One height for every control: `--control` (44px) for inputs, `--btn-height` for every button (40px, and 44px on phones so they are easy to tap), and `--control-sm` (36px) for filters, search boxes and icon buttons. One padding for every card: `--card-pad`.

### Colours
- **There is no green anywhere in ClassNest:** not in pages, tags, buttons, charts, focus rings or glows. Use the colours below.
- **Base:** pure black background, slightly lighter black surfaces, very thin subtle borders, soft white text, muted grey secondary text.
- **Admin accent:** electric blue on every admin page. **Student accent:** electric orange on every student page. `theme.js` sets `data-role` on `<html>`, and `tokens.css` picks the colour from it.
- The accent is for the active nav item, main buttons, focus rings, glows, highlights, and the tags for Submitted, On time and a far-off deadline. Solid orange takes black text, because white on it is too hard to read.
- **Status colours keep their meaning on every page, for both roles** (see the Tags table).
- **Grey text is never below 14px** (`--font-small`), in both themes. The one exception is the login tagline, which is part of the logo. `--text-muted` is bright enough for good contrast on black and on cream.

### Dark (the default)
- Black, rich and ambient, with very faint accent glows that breathe, and a faint dot grid.
- Thin, soft borders and soft shadows. Rounded rectangle buttons (12px), the same corners as inputs.

### Light (the mockups' style, chosen with the toggle)
- Flat cream background (`#fff6e9`), with no glows or dot grid.
- Thick black borders (2px) and hard offset shadows with no blur (`4px 4px 0`).
- The same blue and orange accents. **Text in an accent colour uses the deeper shade** (`--blue-deep`, `--orange-deep`), so contrast stays good.

### Theme rules
- A theme is a set of colour tokens in `tokens.css`. Components only use tokens, so a new component works in both themes. Don't add per-theme layout rules.
- The login page is always dark.

### Logo
A nest with a swallow flying out of it: flat, sharp and minimal, like a luxury brand mark. It is drawn in code as inline SVG, with no images or external assets, and no 3D, metal or egg.
- **The nest:** a shallow, wide bowl of clean, slightly curved parallel lines, all the same stroke weight, with rounded ends. The lines keep an even gap and get shorter towards the bottom, but stay wide, so the shape reads as a bowl and never as a Wi-Fi symbol.
- **The bird:** one swallow silhouette, the same shape as the login birds, rising out of the nest at an upward angle, with its tail still inside the bowl.
- **Colours:** the nest is white on dark and near-black on light (`--mark`). The bird (`--mark-bird`) is soft white on the login page, electric blue on admin pages and electric orange on student pages.
- **Glow:** a very subtle soft glow on the bird only (`.mark-bird`, using `--mark-glow`), never on the nest.
- **Full logo (login only):** the large mark with four nest lines, then "CLASSNEST", then a thin line, then "LEARN · GROW · FLY" in small, wide-spaced uppercase. It is written out in `index.html`.
- **Wordmark:** "CLASSNEST" in uppercase, Clash Display semibold, with slightly wide letter spacing.
- **Small logo (sidebar and top bar):** the same mark, simplified to three nest lines and a slightly thicker bird, plus the wordmark, drawn on a 24-unit grid so it stays sharp at 24 pixels. It is `BRAND_MARK` in `sidebar.js`. The sidebar and top bar stay dark, so `--mark` is white there in both themes.
- **Browser tab:** the same small logo on a rounded square. `favicon.svg` has the white bird on black (login). `favicon-admin.svg` has the blue bird and `favicon-student.svg` the orange one, and these two follow the computer's light or dark setting, because a favicon can't see the app's toggle. A change to the small logo must be made in `sidebar.js` and in all three files.

## Apple-level discipline
- **Fonts:** Clash Display (free, from Fontshare, with a system sans-serif fallback) for the wordmark, the tagline, all headings and all big numbers, in both themes. Inter for body text. JetBrains Mono for eyebrows, tags, usernames and countdowns. No other fonts. All are loaded at the top of `tokens.css`.
- **Headings:** Clash Display semibold. It is a wide font with narrow spaces, so headings get a little extra `word-spacing`. Page headings are 1.75rem to 2.25rem.
- **Spacing:** 20px between sections and cards (`--space-5`). Page side padding is `--page-gutter`, 20px on phones and growing with the screen to 48px on desktop, so nothing touches or overflows the edges at any width.
- **Cards:** a consistent 18px radius (`--radius`), thin borders and `--card-pad` padding. The login page's cards, inputs and buttons are these same parts, on the same black.
- **Buttons:** three kinds, and every one has the same height, radius, spacing and medium-weight text. There is no small or big size, with one exception: "Join live class" (`.btn-join`). All the values are the `--btn-*` tokens. Every button has press and focus states.
  - **Join live (`.btn-join`, using the `--join-*` tokens):** the one bigger, brighter button, 52px high with semibold text, because joining a live class is the most urgent thing a student can do. In light mode it is white on the accent card.
  - **Primary (`.btn-primary`):** a subtle vertical gradient from a deeper shade at the bottom to the bright accent at the top, with a thin light line along the top edge, a soft accent glow on hover, and a slight press-down on click. Blue on admin pages, orange on student pages.
  - **Secondary (`.btn-ghost`):** dark glass with a thin border and a soft highlight on hover. Used for Cancel, Back, Download and other second choices.
  - **Danger (`.btn-danger`, and `.icon-btn-danger` for icons):** dark with a thin red border. It turns red only on hover.
  - **A "+":** never typed as text. It is an icon in a small rounded square (`.btn-plus`) at the start of the button, on primary and secondary buttons.
  - **Press:** GSAP's hover lift owns `transform`, so the press uses the `scale` and `translate` properties.
  - **Light mode:** the same three kinds with the black border, and a hard offset shadow in place of the glow. A press sinks the button into its shadow.

## One app: shared parts
Every page, now and later, is built from these parts. Reuse them instead of making a new version.

- **Sidebar:** built in one place, `sidebar.js`, and added to a page with one script tag at the top of `<body class="app">`. It looks the same on every inner page, for both roles and in both themes, and stays dark in both. A new page goes in its `links` list, with an icon.
  - **Top row:** the small logo and name on the left. On the right, a search icon and the theme icon, both plain 32px icon buttons with 18px icons. They have no text, no border and no "Ctrl K" label. Search and the theme toggle live here only, never at the bottom.
  - **Nav links:** compact rows (32px high, 14px text), each with a 16px line icon on its left. Icons are free Lucide-style inline SVGs in muted grey (75% opacity) until hovered or active.
  - **Which icon:** Dashboard is a layout grid for admins and a home for students. Batches is layers, Students is users, Lectures is a video camera, Assignments is a notebook, Log out is a log-out arrow.
  - **Hover:** a soft highlight (`--sidebar-hover`) that fades in over 150ms, on rows and on the top icons. It is a `::before` layer behind the item, so only its opacity animates.
  - **Active page:** `aria-current="page"` gives a subtle tinted fill (`--sidebar-active`), brighter text and an icon in `--sidebar-accent`: blue for admins and orange for students, in both themes, kept bright so it stays clear on the dark sidebar. Never a solid colour block.
  - **Bottom:** a thin line, then the user card (name, then "Administrator" or the student's batch; long text ends in "…") and Log out with its icon.
- **Mobile:** at 960px and below, the sidebar becomes a slide-out menu opened from a small bar at the top. It is the same sidebar, with its X button added to the top row, rows 40px high and icon buttons 36px, so they are easy to tap. It closes with its X button, the dimmed area, Esc, a link or the search icon.
- **Breadcrumb:** every inner page starts with `<nav class="crumbs" id="crumbs">`, filled in by `sidebar.js` (Home › Dashboard). A page with one item open calls `setBreadcrumbItem(title)` to add it (Home › Assignments › Build a page). A long last step ends in "…".
- **Page head:** `.page-head` with an optional `.eyebrow`, an `h1`, and `.page-actions` on the right. Pages with only a form and a list (Batches, Students, Lectures) skip it and keep a visually hidden `h1`.
- **Form and list pages:** `.split`, with a `.form-card` on the left and a `.panel` on the right.
- **List and detail pages:** `.split.fill`, with `.pick-row` items on the left and a `.panel.detail` on the right. The picked row has `aria-current="true"`.
- **Dashboards:** `.stat-grid` of four `.stat-card`s, then `.panels` of two `.panel`s.
- **Stat cards:** an icon inside a small rounded square (`.stat-icon`), the big number in Clash Display, the label below it in semibold 16px, then a short note in regular grey 14px, so each card is easy to scan. On hover, `.stat-glow` lets a soft accent glow and a faint dot pattern rise from the bottom, using only transform and opacity.
- **Panels:** `.panel-head` holds the title, then a `.count` like `(6)`, and on the right a search box, filter or `.text-link`.
- **Rows:** `.row-card` for lectures and assignments, with a `.date-block` for anything on a date. The row for today gets `.is-today`.
- **Tables:** `.table` inside a `.panel`, with uppercase column names. Give every cell except the first a `data-label`. When the panel gets narrow, on a phone or beside a list on a small laptop, each row turns into labelled lines.
- **Tags:** every status is a `.tag` from `tagHtml()`, the same on every page for both roles. Tags are always filled, with readable text: a strong tint on dark, and solid colour with a black border on light.

| Style | Used for |
|---|---|
| accent (blue for admins, orange for students) | On time, Submitted, more than 24 hours left |
| amber | Pending, Live now, less than 24 hours left |
| red | Late, with how late it was on the admin's table, like "Late · 2h" |
| red with `.tag-urgent` (a very soft pulse) | less than 6 hours left |
| missing (grey with a red outline) | Missing |
| quiet (grey) | Closed, Done, Not started |
| calm (a soft blue-white) | Upcoming, Started |

- **Deadlines:** time left is always a tag, never plain text. `deadlineTagClass()` in `ui.js` picks the colour, and after the deadline the tag is a grey "Closed". On student pages, `deadlineTagHtml()` makes the tag and `showDeadlineTags()` fills it in by the server's clock, so it changes by itself. The big "Time left" box follows the same colours (`.is-soon`, `.is-urgent`, `.is-closed`). The pulse changes only opacity, stops with reduced motion, and must never restart on a countdown tick.
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
1. **The reveal:** the screen is pure black, with only "CLASSNEST", very large (about two thirds of the screen's width), in the centre of the whole screen. There is no nest, no birds and no login panel. Each letter springs in one by one.
2. **The emphasis:** one soft light sweep passes across the whole word. A thin line then draws under it from left to right, and "LEARN · GROW · FLY" fades in below.
3. **The move:** the word, line and tagline smoothly shrink and move into the left panel.
4. **The arrival:** only after they arrive, the logo fades in softly above the word. Its bird draws in from the tail up and lifts off from the nest, moved only by a transform and a mask, and then the flock flies out of the nest. At the same time, the login panel slides in from the right and fades in.

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
- Premium dark dashboard style: calm, with only short micro-interactions (150-300ms).
- When a page opens, its content fades in over 0.3 seconds while the sidebar stays still.
- Use spotlight hover, toasts, skeleton loaders and empty states.
- Empty states are friendly: a short helpful message, not a blank area.
- Cards and buttons lift smoothly on hover.
- Numbers on dashboards count up when they appear.
- "Live now" has a pulsing red dot next to it.
- **The student's "Live now" card** stands out from every other card: a brighter accent border and a soft glow (a hard shadow on the accent background in light mode), the pulsing red dot, and the "Join live class" button.
- **Upcoming lectures:** the time is the part to notice, so it is bold (`.time-bold`), like "Starts in **2 hours**".

### Ctrl+K search
- Every inner page has search, opened with Ctrl+K or the search icon at the top of the sidebar.
- It only finds real data and pages. It never contains actions such as "Log out" or "Switch to light mode".
- **Admin:** students (by name, username or email), batches, lectures, assignments, and pages.
- **Student:** only the lectures and assignments of their own batch.
- Results are grouped under small labels (Student, Batch, Lecture, Assignment, Page).
- Clicking a result opens that item. An assignment opens selected on its Assignments page. Anything else opens highlighted in its list.
- When nothing matches, show a friendly "No results" message.

## Rules
- Use GSAP for animations. The login birds are the exception: they are a plain canvas loop, and the page fade-in is plain CSS.
- No external images or paid assets. Everything is made in code.
- Keep it at 60fps by animating only transform and opacity.
- Respect `prefers-reduced-motion`.
- Works on mobile, from 320px to 1920px wide. Nothing may overflow or be cut off at any width.
- Never break app logic, APIs or the database.
