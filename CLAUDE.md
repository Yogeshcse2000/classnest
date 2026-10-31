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
- The design follows the **classnest-ui** skill ([SKILL.md](.claude/skills/classnest-ui/SKILL.md)): a dark, rich, ambient theme, a cinematic login intro and calm inner pages.
- The skill is the single source of design and animation rules. Use it whenever creating or changing any page, component or style.

## Testing
- When a stage is finished, use the **tester** subagent ([tester.md](.claude/agents/tester.md)). It tests the app as admin and as student, then reports bugs without fixing them.

## Git
- Never commit `.env` or `node_modules`.

## How to help me
- I am a beginner. When something new comes up, explain it in simple words.
