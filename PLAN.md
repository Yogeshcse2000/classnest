# ClassNest - Build Plan

ClassNest is an LMS. An **admin** creates batches, adds students, shares Google Meet lectures and posts assignments. **Students** log in, join classes and upload their work as a `.zip` file.

Project rules (stack, design, animations) are in [CLAUDE.md](CLAUDE.md).

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
| Deleting | Nothing is deleted automatically. Only **empty** batches (no students, lectures or assignments) can be deleted. |
| Batch names | Must be unique (capital letters don't matter). Start date required, description optional. |
| New students | Admin enters name + email + batch. Username comes from the name (`priya.sharma`, then `priya.sharma2`...). Temporary password is random (`k7mq-x4tz-p9wd`). |
| Showing credentials | Only once, right after enrolling, with **Copy username**, **Copy password** and **Copy both** buttons. Only the hash is saved. |
| Pasting at login | Spaces around the username or password are ignored. Pasting `Username: ... Password: ...` into either box fills in both. |
| Login page | Always dark, with no light/dark toggle (dashboards keep theirs). First visit in a browser tab plays a 4-second intro, later visits a 0.5-second version. Skip button, any click or any key skips it. The form always appears within 6 seconds. |
| Design exceptions | The login page may use an amber glow and animations longer than 300ms. Everywhere else, the `classnest-ui` skill applies. |
| Theme | Dark by default. The toggle on inner pages switches to light, and the choice is remembered. |
| Duplicate emails | Rejected with a clear error (capital letters don't matter). |
| Re-uploading | Allowed. The newest file **replaces** the old one (old file is deleted). |
| After the deadline | Uploads still allowed, but shown as **"Late"**. Never blocked. |
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
│   │   └── credentials.js   ← makes usernames and temporary passwords
│   ├── middleware/
│   │   └── auth.js          ← requireRoleApi, requireRolePage
│   ├── models/              ← ALL SQL lives here
│   │   ├── admins.js
│   │   ├── students.js
│   │   ├── batches.js
│   │   ├── lectures.js
│   │   ├── assignments.js
│   │   └── submissions.js
│   └── routes/              ← API routes (no SQL here)
│       ├── auth.js          ← /api/auth  (login, logout, me)
│       ├── admin.js         ← /api/admin    (admins only)
│       ├── admin/
│       │   ├── batches.js   ← /api/admin/batches
│       │   ├── students.js  ← /api/admin/students
│       │   └── ...          ← lectures, assignments added in later steps
│       └── student.js       ← /api/student  (students only)
├── pages/                   ← protected pages, only reachable through the login checks
│   ├── admin/               ← dashboard, batches, students, lectures, assignments
│   └── student/             ← dashboard, classes, assignments
├── public/                  ← open to everyone
│   ├── index.html           ← login page
│   ├── favicon.svg
│   ├── css/style.css        ← colours, fonts, cards, light/dark
│   └── js/                  ← api.js, ui.js, theme.js, animations.js, palette.js, login.js,
│                               login-roles.js, login-intro.js, login-particles.js,
│                               admin.js, batches.js, students.js, student.js
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
  file_path, original_name, submitted_at
  UNIQUE (assignment_id, student_id)   ← one row per student per assignment

sessions
  sid, data, expires_at                ← who is logged in (used by session.js)
```

Worked out by the server, not stored:
- **Live now:** current time is between `starts_at` and `starts_at + duration_minutes`.
- **Late:** `submitted_at` is after the assignment's `due_at`.

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

- [x] **1. Setup:** Node.js, `package.json`, packages installed.
- [x] **2. Hello server:** `server.js` serves `public/`. Test page at `localhost:3000`.
- [x] **3. Database + seed:** `db.js` creates all tables. `npm run seed` creates the first admin (hashed password, from `.env`).
- [x] **4. Login:** login page with Admin/Student toggle, bcrypt compare, sessions, logout, placeholder dashboards.
- [x] **5. Protection:** `requireRolePage` / `requireRoleApi` guard pages and API routes.
- [x] **6. Design foundation:** `style.css` colours, fonts, cards, light/dark toggle, GSAP helpers, styled login page.
- [x] **7. Admin: batches:** create, list and delete (empty) batches.
- [x] **8. Admin: students:** enroll with name + email + batch, auto username + temporary password shown once with copy button.
- [ ] **9. Admin: lectures:** schedule lectures with a Meet link. "Live now" badge.
- [ ] **10. Admin: assignments:** post assignments with due dates.
- [ ] **11. Student side:** dashboard, batch lectures with a "Join" button, assignments.
- [ ] **12. Uploads:** `.zip` submit and re-upload (replaces old file), "Late" badge, admin can see and download.
- [ ] **13. Dashboards + polish:** bento grid, GSAP count-up, hover lift, pulsing live dot, friendly empty states.
- [ ] **14. Final check:** test as admin and student, security review, README.
