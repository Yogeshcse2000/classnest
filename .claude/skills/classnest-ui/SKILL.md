---
name: classnest-ui
description: Design system for ClassNest. Use it whenever creating or changing any page, component or style.
---

# ClassNest UI

This skill is the single source of design and animation rules for ClassNest. Follow these rules for every page, component and style.

## Identity
The trainer's mockups in `mockups/` set the layout and the elements of every inner page. Their name is replaced by ClassNest, with its own logo. Two themes share that one layout, so a page only ever changes colours and fonts between them, never its structure.

### Dark (the default)
- Dark, rich, ambient theme.
- Near-black green background.
- Deep green primary colour.
- Warm amber accent, used **only** for "Live now" and deadlines.
- Soft breathing glows, a faint dot grid and glass cards.
- Thin, soft borders and soft shadows. Pill-shaped buttons.

### Light (the mockups' style, chosen with the toggle)
- Flat cream background (`#fff6e9`), with no glows or dot grid.
- Thick black borders (2px) and hard offset shadows with no blur (`4px 4px 0`).
- **Admin accent is blue, student accent is orange.** `theme.js` sets `data-role` on `<html>`, and `style.css` picks the colour from it.
- Rounded rectangle buttons (12px) instead of pills.
- Space Grotesk for headings instead of Outfit.

### Theme rules
- A theme is a set of colour tokens at the top of `style.css`. Components only use tokens, so a new component works in both themes. Never write a colour inside a component, and don't add per-theme layout rules.
- The login page is always dark.

## Apple-level discipline
- **Fonts (from Google Fonts):** Outfit for headings in dark mode, Space Grotesk in light mode, Inter for body text, JetBrains Mono for eyebrows, tags, usernames, date blocks and countdowns.
- **Headings:** with slight negative letter spacing. Page headings are 1.75rem to 2.25rem.
- **Spacing:** 20px between sections and cards. Page padding is 32px on desktop and 16px on phones.
- **Cards:** a consistent 18px radius.
- **Buttons:** with press and focus states.

## One app: shared parts
Every page, now and later, is built from these parts. Reuse them instead of making a new version.

- **Sidebar:** built in one place, `sidebar.js`, and added to a page with one script tag at the top of `<body class="app">`. Logo and role badge at the top, nav links in the middle, then search and the theme toggle, the user card and Log out at the bottom. It stays dark in both themes. A new page goes in its `links` list.
- **Mobile:** at 960px and below, the sidebar becomes a slide-out menu opened from a small bar at the top. It closes with its X button, the dimmed area, Esc or a link.
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
| green | On time, Submitted, Upcoming, Started, time left |
| amber | Pending, Live now, the last 24 hours before a deadline |
| peach | Late, with how late it was on the admin's table, like "Late · 2h" |
| red | Missing |
| quiet | Closed, Done, Not started |

- **Filters:** `.pill` buttons with a count, and `aria-pressed` on the active one.
- **Dates:** every date on a form uses the picker (`data-picker="date"` or `"datetime"`), never the browser's own. Dates in the page use `formatDateTime()`, like "Nov 4, 4:38 AM IST", always in India time and always labelled IST.
- **Time ago:** `timeAgo()`, like "10 min ago", "1 h ago", "Yesterday".
- **Forms in a pop-up:** `.form-dialog`. The whole pop-up scrolls, never the card.
- **No inner scrollbars:** form cards never get `overflow: auto` or a fixed height, and they aren't sticky. Only the sidebar and the search results may scroll by themselves.
- **Nothing fake:** every button does something real. Lists show real data, never sample names.

## Login page
- Starts with the cinematic intro.
- Then shows the Admin and Student role cards.
- The chosen card morphs into the login form.
- Under the form: "Students can't sign up. Your admin creates your login." and a "Preview error state" link, which shows the sign-in error without sending anything.
- This stays as it is. It doesn't take the mockup's split screen or Admin/Student toggle.

### Login intro
- The full intro lasts 4 seconds and always plays to the end.
- There is no Skip button, and clicks and keys never skip it.
- The full intro plays once per browser session.
- After that (for example after logging out, or in a new tab) only the quick 0.5-second version plays.
- A safety limit may end it on a stalled computer, so nobody is locked out of signing in.
- With `prefers-reduced-motion`, or if GSAP can't load, no intro plays and the login shows straight away.

### Login exceptions
The login page is the one place with these exceptions, recorded in [PLAN.md](../../../PLAN.md):
- It is always dark, with no light/dark toggle.
- Its intro may use an amber glow and animations longer than 300ms.

## Inner pages
- Calm, with only short micro-interactions (150-300ms).
- Use spotlight hover, toasts, skeleton loaders and empty states.
- Empty states are friendly: a short helpful message, not a blank area.
- Cards and buttons lift smoothly on hover.
- Numbers on dashboards count up when they appear.
- "Live now" has a pulsing dot next to it.

### Ctrl+K search
- Every inner page has search, opened with Ctrl+K or the Search button in the sidebar.
- It only finds real data and pages. It never contains actions such as "Log out" or "Switch to light mode".
- **Admin:** students (by name, username or email), batches, lectures, assignments, and pages.
- **Student:** only the lectures and assignments of their own batch.
- Results are grouped under small labels (Student, Batch, Lecture, Assignment, Page).
- Clicking a result opens that item. An assignment opens selected on its Assignments page. Anything else opens highlighted in its list.
- When nothing matches, show a friendly "No results" message.

## Rules
- Use GSAP for animations.
- No external images or paid assets. Everything is made in code.
- Keep it at 60fps by animating only transform and opacity.
- Respect `prefers-reduced-motion`.
- Works on mobile, from 375px to 1920px wide.
- Never break app logic, APIs or the database.
