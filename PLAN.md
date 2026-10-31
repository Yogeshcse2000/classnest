# ClassNest - Build Plan

ClassNest is an LMS. An **admin** creates batches, adds students, shares Google Meet lectures and posts assignments. **Students** log in, join classes and upload their work as a `.zip` file.

Project rules are in [CLAUDE.md](CLAUDE.md). Design and animation rules are in the [classnest-ui skill](.claude/skills/classnest-ui/SKILL.md).

## Decisions

| Question | Decision |
|---|---|
| Admins vs students | **Two separate tables:** `admins` and `students`. |
| Logging in | One login page with Admin and Student role cards. The chosen card becomes the login form. **Admins use email, students use username.** |
| Saved logins | Only the chosen role's form is in the page. Browsers save logins per website, so `login.js` also hides anything the browser fills until it has checked it fits the role (an email for admins, no `@` for students), and wipes it if not. |
| Sessions | Stored in the `sessions` table, so logins survive restarts. Cookie lasts 7 days. |
| Wrong role / not logged in | Pages redirect (to login, or to your own dashboard). API routes answer 401 / 403 with an error. |
| Batches per student | **One.** Stored as `students.batch_id` (required). No enrollments table. |
| Emails and usernames | Stored trimmed and lowercase, so capital letters don't matter at login. |
| Deleting | Nothing is deleted automatically. Only **empty** batches (no students, lectures or assignments) can be deleted, so no lecture or assignment can lose its batch. The Batches page warns the admin what is still inside before anything happens, and the server refuses as well. An assignment with student submissions can't be deleted, and students can't be deleted at all yet, so today no uploaded file can be left behind. **Any delete added later must also delete that student's or assignment's files** with `deleteFile()` from `storage.js`. |
| Dates and times | Saved as ISO text in UTC. Admins type India time (IST), and `server/utils/dates.js` converts it (IST is always UTC + 5:30). Pages always show IST with the label "IST", whatever the computer is set to. |
| Time checks | The server's clock only. It sends each lecture's status, each assignment's time left and whether a batch has started. The past-date warning comes from `/api/admin/lectures/check-time`, and the lecture and assignment pages ask again every 30 seconds so statuses stay correct. The student dashboard also receives the server's time, so its countdowns stay right even if the student's computer clock is wrong. |
| Student dashboard | The login session says who the student is, and the database says which batch they are in. A batch in the URL or body is ignored. Meet links are only sent while a lecture is live, and finished lectures aren't sent at all. The page refreshes every 30 seconds, updates countdowns every minute, pauses both while the tab is hidden, and refreshes as soon as the tab is shown again. |
| Lecture length | Always 60 minutes, saved in `duration_minutes`. **Live now** runs from the start time up to, but not including, 1 hour after. |
| Past dates | Lectures: a plain warning (amber is only for "Live now" and deadlines), and saving is still allowed. Assignments: a new deadline must be in the future. Editing may keep or set a past deadline, so a closed assignment can still be corrected. |
| Form errors | The server checks everything and sends one message per wrong field in `fields`. Lecture and assignment forms show each one under its field. |
| Batch names | Must be unique (capital letters don't matter). Start date required, description optional. |
| New students | Admin enters name + email + batch. Username comes from the name (`priya.sharma`, then `priya.sharma2`...). Temporary password is random (`k7mq-x4tz-p9wd`). |
| Showing credentials | Only once, right after enrolling, with **Copy username**, **Copy password** and **Copy both** buttons. Only the hash is saved. |
| Pasting at login | Spaces around the username or password are ignored. Pasting `Username: ... Password: ...` into either box fills in both. |
| Login page | Always dark, with no light/dark toggle (dashboards keep theirs). The first visit in a browser session plays the full 4-second intro, which can't be skipped. Later visits, in any tab, play a 0.5-second version (remembered with a cookie that ends when the browser closes). A stalled computer still reaches the login after 6 seconds of visible time. |
| Search (Ctrl+K) | Read-only. Admins find students, batches, lectures, assignments and pages through `/api/admin/search`. Students find only their own batch's lectures and assignments through `/api/student/search`. Their batch comes from the database, never from the browser. Admin lecture and assignment results open `/admin/lectures` and `/admin/assignments`. Student results scroll to the item on the dashboard and highlight it (`/student/dashboard#lecture-3`). Finished lectures are hidden there, so search leaves them out too. |
| Design exceptions | The login page may use an amber glow and animations longer than 300ms. Everywhere else, the `classnest-ui` skill applies. |
| Theme | Dark by default. The toggle on inner pages switches to light, and the choice is remembered. |
| Duplicate emails | Rejected with a clear error (capital letters don't matter). |
| Re-uploading | Allowed. The newest file **replaces** the old one (old file is deleted). `submitted_at` and `is_late` change with it. The new file is saved first and the old one deleted last, so a failure leaves the old submission whole. |
| After the deadline | Uploads still allowed, but shown as **"Late"**. Never blocked. |
| Late | Saved in `submissions.is_late` when the upload arrives, using the server's clock. Moving a deadline later doesn't change work already handed in. Only a new upload does. |
| Upload rules | One file, `.zip` only, 10 MB at most, checked on the server by name and by its first 4 bytes (`PK` plus what kind of zip it is). The file is held in memory until every check passes, so a refused or half-finished upload never reaches the disk. Files are saved under a random name, and the student's file name is only kept in the database for display. Nothing is ever unzipped or run. |
| Downloads | Only a logged-in admin, through `/api/admin/submissions/:id/download`. The `uploads/` folder is outside `public/`, and students have no download route, not even for their own work. Files download as `username_assignment-title.zip`. |
| Moving an assignment | Once students have submitted work, an assignment can't move to another batch, because the submissions view lists the assignment's batch and their work would disappear from it. |
| Grading | **None** for now. |
| Running | Fully on a laptop with `npm start`. May be deployed for free later. |
| Google Meet | Admin pastes a Meet link. No Google API. |
| First admin | Created by `npm run seed` using details from `.env`. |
| Adding students | Admin creates the account with a temporary password. |

## Keeping it easy to move later (Postgres + online file storage)

1. **All SQL lives in `server/models/`.** Routes call functions like `getBatches()` and never write SQL themselves.
2. **Model functions are `async`**, even though SQLite does not need it, so Postgres can drop in without changing routes.
3. **Plain, standard SQL.** Dates are stored as ISO text, e.g. `2026-10-30T14:00:00Z`.
4. **All file handling goes through `server/storage.js`** (save, delete, get). Today it uses the `uploads/` folder.
5. **Settings come from `.env`** (port, database path, uploads path, secrets).

## Folder structure

```
classnest/
├── server/
│   ├── server.js            ← starts the server, connects everything
│   ├── db.js                ← opens SQLite, creates tables
│   ├── seed.js              ← creates the first admin
│   ├── session.js           ← login sessions, saved in the sessions table
│   ├── storage.js           ← save / delete / get uploaded files
│   ├── utils/
│   │   ├── credentials.js   ← makes usernames and temporary passwords
│   │   ├── dates.js         ← India time ↔ UTC, lecture status, time left
│   │   └── ids.js           ← reads IDs strictly (lectures, assignments)
│   ├── middleware/
│   │   ├── auth.js          ← requireRoleApi, requireRolePage
│   │   └── upload.js        ← receives one .zip and checks it
│   ├── models/              ← ALL SQL lives here
│   │   ├── admins.js
│   │   ├── students.js
│   │   ├── batches.js
│   │   ├── lectures.js
│   │   ├── assignments.js
│   │   ├── submissions.js
│   │   └── search.js        ← Ctrl+K search (read-only)
│   └── routes/              ← API routes (no SQL here)
│       ├── auth.js          ← /api/auth  (login, logout, me)
│       ├── admin.js         ← /api/admin    (admins only)
│       ├── admin/
│       │   ├── batches.js   ← /api/admin/batches
│       │   ├── students.js  ← /api/admin/students
│       │   ├── lectures.js  ← /api/admin/lectures
│       │   ├── assignments.js ← /api/admin/assignments
│       │   ├── submissions.js ← /api/admin/submissions  (downloads)
│       │   └── search.js    ← /api/admin/search
│       └── student.js       ← /api/student  (students only)
├── pages/                   ← protected pages, only reachable through the login checks
│   ├── admin/               ← dashboard, batches, students, lectures, assignments, submissions
│   └── student/             ← dashboard, submit
├── public/                  ← open to everyone
│   ├── index.html           ← login page
│   ├── favicon.svg
│   ├── css/style.css        ← colours, fonts, cards, light/dark
│   └── js/                  ← api.js, ui.js, theme.js, animations.js, palette.js, login.js,
│                               login-roles.js, login-intro.js, login-particles.js,
│                               admin.js, batches.js, students.js, schedule.js, lectures.js,
│                               assignments.js, submissions.js, student.js, submit.js
├── data/                    ← classnest.db (git-ignored)
├── uploads/                 ← student .zip files (git-ignored)
├── .env                     ← secrets (git-ignored)
├── .env.example             ← list of settings, no real secrets (committed)
└── package.json
```

## Database tables

All tables are created in `server/db.js`. Every table also has `created_at` (or `submitted_at`), filled in by the model code.

```
admins
  id, name, email (unique), password_hash, created_at

batches
  id, name, description, start_date, created_at

students
  id, name, username (unique), email (optional, unique), password_hash,
  batch_id → batches.id      (required: one batch per student)
  created_at

lectures
  id, batch_id → batches.id, title, meet_link,
  starts_at, duration_minutes, created_at

assignments
  id, batch_id → batches.id, title, description,
  due_at, created_at

submissions
  id, assignment_id → assignments.id, student_id → students.id,
  file_path, original_name, submitted_at, is_late (0 or 1)
  UNIQUE (assignment_id, student_id)   ← one row per student per assignment

sessions
  sid, data, expires_at                ← who is logged in (used by session.js)
```

Worked out by the server, not stored:
- **Live now:** current time is between `starts_at` and `starts_at + duration_minutes`.

## Packages (all free)

| Package | Job |
|---|---|
| `express` | the web server |
| `better-sqlite3` | talks to the SQLite database |
| `bcryptjs` | password hashing |
| `express-session` | login sessions (cookies) |
| `multer` | receives uploaded files (.zip only, size limit) |
| `dotenv` | reads the `.env` file |
| GSAP, Google Fonts | loaded from a free CDN in the HTML |

## Commands

| Command | What it does |
|---|---|
| `npm start` | runs the server |
| `npm run dev` | runs the server and restarts it when you save a file |
| `npm run seed` | creates the first admin account (from step 4) |

## Build order

When a stage is finished, run the [tester subagent](.claude/agents/tester.md), and fix what it reports before ticking the step.

- [x] **1. Setup:** Node.js, `package.json`, packages installed.
- [x] **2. Hello server:** `server.js` serves `public/`. Test page at `localhost:3000`.
- [x] **3. Database + seed:** `db.js` creates all tables. `npm run seed` creates the first admin (hashed password, from `.env`).
- [x] **4. Login:** login page with Admin/Student toggle, bcrypt compare, sessions, logout, placeholder dashboards.
- [x] **5. Protection:** `requireRolePage` / `requireRoleApi` guard pages and API routes.
- [x] **6. Design foundation:** `style.css` colours, fonts, cards, light/dark toggle, GSAP helpers, styled login page.
- [x] **7. Admin: batches:** create, list and delete (empty) batches.
- [x] **8. Admin: students:** enroll with name + email + batch, auto username + temporary password shown once with copy button.
- [x] **9. Admin: lectures:** schedule lectures with a Meet link. "Live now" badge.
- [x] **10. Admin: assignments:** post assignments with due dates.
- [x] **11. Student side:** dashboard, batch lectures with a "Join" button, assignments.
- [x] **12. Uploads:** `.zip` submit and re-upload (replaces old file), "Late" badge, admin can see and download.
- [ ] **13. Dashboards + polish:** bento grid, GSAP count-up, hover lift, pulsing live dot, friendly empty states.
- [ ] **14. Final check:** test as admin and student, security review, README.
