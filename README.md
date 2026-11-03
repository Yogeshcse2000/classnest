# ClassNest

**LEARN · GROW · FLY**

**Live demo:** https://classnest-cepb.onrender.com (free tier, first load can take about 50 seconds)

ClassNest is a Learning Management System (LMS) for BrightPath Academy. An admin runs the academy: creates batches, enrolls students, schedules live lectures with a Google Meet link and posts assignments. Students log in to see only their own batch, join live classes with one click and upload their assignment work as a `.zip` file.

## Features

### Admin
- Log in with email and see a dashboard with live counts.
- Create batches, and delete empty ones.
- Enroll students (name, email, batch). A username and a temporary password are made automatically and shown once, with copy buttons.
- Reset a student's password (the student is logged out everywhere).
- Schedule lectures with a Meet link. A "Live now" badge shows while a lecture is running.
- Post assignments with deadlines.
- See who submitted, who was late and who is missing, and download each `.zip`.
- Search everything with Ctrl+K.

### Student
- Log in with username and see only their own batch.
- Dashboard with the live or next lecture and a "Join live class" button (opens Meet in a new tab).
- Assignments with deadline colours and time left.
- Upload a `.zip`, and upload again to replace it.
- Search their own lectures and assignments with Ctrl+K.

Both roles get dark and light mode, and the layout works on phones.

## Tech stack

- Node.js and Express
- Supabase Postgres with the `pg` package
- Vanilla HTML, CSS and JavaScript (no frameworks)
- GSAP for animations
- `bcryptjs` for password hashing (the pure-JavaScript version of bcrypt)
- `express-session` for logins
- `multer` for file uploads, and Supabase Storage (a private bucket) to keep them

Everything used is free.

## Install and run (Windows)

You need [Node.js](https://nodejs.org) installed and a free [Supabase](https://supabase.com) project. Open a terminal in the project folder, then:

1. Install the packages:
   ```
   npm install
   ```
2. Copy the settings file:
   ```
   copy .env.example .env
   ```
   Then open `.env` and put your Supabase project's **Session pooler** connection string in `DATABASE_URL`. Also add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (Supabase: Project Settings > API), which ClassNest uses to keep uploaded files in Supabase Storage. The private `submissions` bucket is created for you. Never share or commit these.
3. Create the first admin account:
   ```
   npm run seed
   ```
4. (Optional) Add demo data: 2 batches, 6 students, lectures, assignments and submissions. Safe to run again.
   ```
   npm run seed:demo
   ```
5. Start the server:
   ```
   npm start
   ```
6. Open <http://localhost:3000> in your browser.

## Demo logins

| Role | Login | Password |
|---|---|---|
| Admin | `admin@classnest.local` | `ClassNest@Demo1` |
| Demo admin (after `seed:demo`) | `demo.admin@classnest.local` | `Demo@1234` |
| Demo students (after `seed:demo`) | usernames are printed by `npm run seed:demo` | `Demo@1234` |

Pick **Admin** or **Student** on the login page. Admins use email, students use username. The demo password is for a laptop only. Never use it on a real site.

## How I used Claude Code

- **CLAUDE.md** holds the project rules: tech stack, design rules, testing and Git rules.
- **PLAN.md** is the stage plan: decisions, database tables, folder structure and a checklist I ticked off step by step.
- **The `classnest-ui` skill** (`.claude/skills/classnest-ui/SKILL.md`) is the design system, so every page follows the same colours, fonts, buttons and animations.
- **The `tester` agent** (`.claude/agents/tester.md`) tested the app as admin and as student after each stage and before submission, and reported bugs without fixing them.
- **PROMPTS.md** lists every prompt I gave, in order.

## Design note

The design is my own, as allowed by my trainer. All mockup screens and buttons are included.

## Folder structure

```
classnest/
├── server/       ← Express server, database, seed scripts
│   ├── models/   ← all SQL lives here
│   ├── routes/   ← API routes
│   └── middleware/ ← login checks, upload checks
├── pages/        ← admin and student pages (login required)
├── public/       ← login page, CSS, JavaScript
├── mockups/      ← the trainer's mockup screens
├── .env.example  ← settings template
├── CLAUDE.md, PLAN.md, PROMPTS.md, IDEAS.md
└── package.json
```

## Upload rules

- Only `.zip` files, one file per assignment.
- 10 MB at most. The server checks the file name and the file's first bytes, not just the extension.
- Uploading after the deadline is allowed but flagged **Late**.
- Uploading again replaces the old file.
- Files are stored in a private Supabase Storage bucket (`submissions`) under random names, never in `public/`. Only admins can download them, and the server fetches each file for them, so no public or long-lived link exists. Nothing is ever unzipped or run.

## Future ideas

- WhatsApp access and alerts through OpenClaw: ask "who submitted today's assignment?" and get an answer from ClassNest's data, and get a message when a student submits late or a new lecture is released.
- The next lecture currently shows in both the "Next lecture" card and the "Upcoming lectures" list. This is a design choice, not a bug, but it could be cleaned up.
- Grading, and free online hosting (All SQL lives in server/models/.)
