---
name: classnest-ui
description: Design system for ClassNest. Use it whenever creating or changing any page, component or style.
---

# ClassNest UI

Follow these rules for every page, component and style in ClassNest.

## Identity
- Dark, rich, ambient theme.
- Near-black green background.
- Deep green primary colour.
- Warm amber accent, used **only** for "Live now" and deadlines.
- Soft breathing glows, a faint dot grid and glass cards.
- Light mode stays available.

## Apple-level discipline
- **Fonts:** Outfit for headings, Inter for body text.
- **Headings:** big, with slight negative letter spacing.
- **Spacing:** generous.
- **Cards:** a consistent 18px radius.
- **Buttons:** pill-shaped, with press and focus states.

## Login page
- Starts with the cinematic intro.
- Then shows the Admin and Student role cards.
- The chosen card morphs into the login form.

The login page is the one place with these exceptions, recorded in [PLAN.md](../../../PLAN.md):
- It is always dark, with no light/dark toggle.
- Its intro may use an amber glow and animations longer than 300ms.

## Inner pages
- Calm, with only short micro-interactions (150-300ms).
- Use spotlight hover, toasts, skeleton loaders and empty states.
- Include a Ctrl+K command palette.

## Rules
- No external images or paid assets. Everything is made in code.
- Keep it at 60fps by animating only transform and opacity.
- Respect `prefers-reduced-motion`.
- Works on mobile, from 375px to 1920px wide.
- Never break app logic, APIs or the database.
