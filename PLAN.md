# ClassNest - Build Plan

ClassNest is an LMS. An **admin** creates batches, adds students, shares Google Meet lectures and posts assignments. **Students** log in, join classes and upload their work as a `.zip` file.

Project rules (stack, design, animations) are in [CLAUDE.md](CLAUDE.md).

## Decisions

| Question | Decision |
|---|---|
| Batches per student | **One.** Stored as `users.batch_id`. No enrollments table. |
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
│   ├── storage.js           ← save / delete / get uploaded files
│   ├── middleware/
│   │   └── auth.js          ← requireLogin, requireAdmin, requireStudent
│   ├── models/              ← ALL SQL lives here
│   │   ├── users.js
│   │   ├── batches.js
│   │   ├── lectures.js
│   │   ├── assignments.js
│   │   └── submissions.js
│   └── routes/              ← API routes (no SQL here)
│       ├── auth.js
│       ├── batches.js
│       ├── students.js
│       ├── lectures.js
│       └── assignments.js
├── public/                  ← frontend (HTML, CSS, JS)
│   ├── index.html           ← login page
│   ├── admin/               ← dashboard, batches, students, lectures, assignments
│   ├── student/             ← dashboard, classes, assignments
│   ├── css/style.css
│   └── js/                  ← api.js, theme.js, animations.js, admin.js, student.js
├── data/                    ← classnest.db (git-ignored)
├── uploads/                 ← student .zip files (git-ignored)
├── .env                     ← secrets (git-ignored)
├── .env.example             ← list of settings, no real secrets (committed)
└── package.json
```

## Database tables

```
users
  id, name, email (unique), password_hash,
  role ('admin' | 'student'),
  batch_id → batches.id      (students only; empty for admins)
  created_at

batches
  id, name, description, start_date, created_at

lectures
  id, batch_id → batches.id, title, meet_link,
  starts_at, duration_minutes, created_at

assignments
  id, batch_id → batches.id, title, description,
  due_at, created_at

submissions
  id, assignment_id → assignments.id, student_id → users.id,
  file_path, original_name, submitted_at
  UNIQUE (assignment_id, student_id)   ← one row per student per assignment
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
- [ ] **3. Database:** `db.js` creates all tables.
- [ ] **4. First admin + login:** `seed.js`, login/logout routes, bcrypt, sessions.
- [ ] **5. Protection:** `requireAdmin` / `requireStudent` middleware.
- [ ] **6. Design foundation:** `style.css` colours, fonts, cards, light/dark toggle, styled login page.
- [ ] **7. Admin: batches:** create and list batches.
- [ ] **8. Admin: students:** add students with a temporary password and pick their batch.
- [ ] **9. Admin: lectures:** schedule lectures with a Meet link. "Live now" badge.
- [ ] **10. Admin: assignments:** post assignments with due dates.
- [ ] **11. Student side:** dashboard, batch lectures with a "Join" button, assignments.
- [ ] **12. Uploads:** `.zip` submit and re-upload (replaces old file), "Late" badge, admin can see and download.
- [ ] **13. Dashboards + polish:** bento grid, GSAP count-up, hover lift, pulsing live dot, friendly empty states.
- [ ] **14. Final check:** test as admin and student, security review, README.
