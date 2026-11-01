# ClassNest - Project Rules

## About the project
- ClassNest is an LMS (Learning Management System) website.
- It has two roles: **Admin** and **Student**.
- This is my intern capstone project.

## Plan
- The build plan, decisions, tables and step checklist are in [PLAN.md](PLAN.md).
- Tick off each step in PLAN.md when it is finished.

## Tech stack
- **Frontend:** vanilla HTML, CSS and JavaScript (no frameworks).
- **Backend:** Node.js + Express.
- **Database:** SQLite.
- Everything must be **100% free**: no paid services, APIs, libraries or hosting.

## Design
- The design follows the **classnest-ui** skill ([SKILL.md](.claude/skills/classnest-ui/SKILL.md)): a pure black theme, electric blue for admins and electric orange for students, Clash Display for the wordmark, headings and big numbers with Inter for body text, a premium 3D woven nest logo with an egg in the role's colour (drawn as SVG in code), a split-screen login with a flock of birds, and premium dark inner pages with a breadcrumb on every page.
- There is no green anywhere. Light mode stays available, with the same accents in a deeper shade for text.
- The skill is the single source of design and animation rules. Use it whenever creating or changing any page, component or style.
- Every colour, font, radius and spacing value lives in one file, [tokens.css](public/css/tokens.css). Never write one directly in `style.css`.

## Testing
- When a stage is finished, use the **tester** subagent ([tester.md](.claude/agents/tester.md)). It tests the app as admin and as student, then reports bugs without fixing them.

## Git
- Never commit `.env` or `node_modules`.

## How to help me
- I am a beginner. When something new comes up, explain it in simple words.
