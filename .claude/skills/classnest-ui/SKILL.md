---
name: classnest-ui
description: Design system for ClassNest. Use it whenever creating or changing any page, component or style.
---

# ClassNest UI

This skill is the single source of design and animation rules for ClassNest. Follow these rules for every page, component and style.

## Identity
- Dark, rich, ambient theme.
- Near-black green background.
- Deep green primary colour.
- Warm amber accent, used **only** for "Live now" and deadlines.
- Soft breathing glows, a faint dot grid and glass cards.
- Light mode stays available through a light/dark toggle on inner pages.

## Apple-level discipline
- **Fonts (from Google Fonts):** Outfit for headings, Inter for body text.
- **Headings:** big, with slight negative letter spacing.
- **Spacing:** generous.
- **Cards:** a consistent 18px radius, with soft shadows.
- **Buttons:** pill-shaped, with press and focus states.
- **Dashboards:** a bento-grid layout.

## Login page
- Starts with the cinematic intro.
- Then shows the Admin and Student role cards.
- The chosen card morphs into the login form.

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
- Every inner page has a search bar, opened with Ctrl+K or the search button.
- It only finds real data and pages. It never contains actions such as "Log out" or "Switch to light mode".
- **Admin:** students (by name, username or email), batches, lectures, assignments, and pages.
- **Student:** only the lectures and assignments of their own batch.
- Results are grouped under small labels (Student, Batch, Lecture, Assignment, Page).
- Clicking a result opens that item's page.
- When nothing matches, show a friendly "No results" message.

## Rules
- Use GSAP for animations.
- No external images or paid assets. Everything is made in code.
- Keep it at 60fps by animating only transform and opacity.
- Respect `prefers-reduced-motion`.
- Works on mobile, from 375px to 1920px wide.
- Never break app logic, APIs or the database.
