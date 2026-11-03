# ClassNest - Build Plan

ClassNest is an LMS. An **admin** creates batches, adds students, shares Google Meet lectures and posts assignments. **Students** log in, join classes and upload their work as a `.zip` file.

Project rules are in [CLAUDE.md](CLAUDE.md). Design and animation rules are in the [classnest-ui skill](.claude/skills/classnest-ui/SKILL.md).

## Decisions

| Question | Decision |
|---|---|
| Admins vs students | **Two separate tables:** `admins` and `students`. |
| Logging in | One login page with Admin and Student tiles. The chosen tile becomes the login form. **Admins use email, students use username.** |
| Saved logins | Only the chosen role's form is in the page. Browsers save logins per website, so `login.js` also hides anything the browser fills until it has checked it fits the role (an email for admins, no `@` for students), and wipes it if not. |
| Sessions | Stored in the `sessions` table, so logins survive restarts. Cookie lasts 7 days. |
| Wrong role / not logged in | Pages redirect (to login, or to your own dashboard). API routes answer 401 / 403 with an error. |
| Batches per student | **One.** Stored as `students.batch_id` (required). No enrollments table. |
| Emails and usernames | Stored trimmed and lowercase, so capital letters don't matter at login. |
| Deleting | Nothing is deleted automatically. Only **empty** batches (no students, lectures or assignments) can be deleted, so no lecture or assignment can lose its batch. The Batches page warns the admin what is still inside before anything happens, and the server refuses as well. An assignment with student submissions can't be deleted, and students can't be deleted at all yet, so today no uploaded file can be left behind. **Any delete added later must also delete that student's or assignment's files** with `deleteFile()` from `storage.js`. |
| Dates and times | Saved as ISO text in UTC. Admins type India time (IST), and `server/utils/dates.js` converts it (IST is always UTC + 5:30). Pages always show IST with the label "IST", whatever the computer is set to. |
| Time checks | The server's clock only. It sends each lecture's status, each assignment's time left, whether a batch has started and the dashboard greeting. The past-date warning comes from `/api/admin/lectures/check-time`, and the lecture and assignment pages ask again every 30 seconds so statuses stay correct. Student pages also receive the server's time, so their countdowns stay right even if the student's computer clock is wrong. |
| Student dashboard | The login session says who the student is, and the database says which batch they are in. A batch in the URL or body is ignored. Meet links are only sent while a lecture is live, and finished lectures aren't sent at all. The big card shows what is live. If nothing is, it shows the next lecture, which then isn't repeated in the Upcoming list. The page refreshes every 30 seconds, updates countdowns every minute, pauses both while the tab is hidden, and refreshes as soon as the tab is shown again. |
| Lecture length | Always 60 minutes, saved in `duration_minutes`. **Live now** runs from the start time up to, but not including, 1 hour after. |
| Past dates | Lectures: a plain warning, and saving is still allowed. Assignments: a new deadline must be in the future. Editing may keep or set a past deadline, so a closed assignment can still be corrected. |
| Form errors | The server checks everything and sends one message per wrong field in `fields`. Lecture and assignment forms show each one under its field. |
| Batch names | Must be unique (capital letters don't matter). Start date required, description optional. |
| New students | Admin enters name + email + batch. Username comes from the name (`priya.sharma`, then `priya.sharma2`...). Temporary password is random (`k7mq-x4tz-p9wd`). |
| Showing credentials | Only once, right after enrolling or resetting a password, with **Copy username**, **Copy password** and **Copy both** buttons. Only the hash is saved. |
| Resetting a password | Each row on the Students page has a **Reset password** button, which asks first. The server makes a new temporary password, saves only its hash, and sends it back once. The old password stops working at once, and the student is logged out on every device, so nobody who got in with the old password can stay in. Admins only: the route is behind `requireRoleApi('admin')`. |
| Pasting at login | Spaces around the username or password are ignored. Pasting `Username: ... Password: ...` into either box fills in both. |
| Login page | A split screen, always dark, with no light/dark toggle (dashboards keep theirs). The left panel has the full logo and a flock of birds. The right panel has the two tiles, the "Students can't sign up" note and a "Preview error state" link, which shows the login error without sending anything. It stays black and white until a role is hovered or chosen. The first visit in a browser session plays a full-screen opening of about 3.6 seconds (about 2 on phones), which can't be skipped: "CLASSNEST" is revealed in the centre of the whole screen, moves into the left panel, and the nest, birds and login then appear. Later visits, in any tab, fade straight into the finished layout in 0.5 seconds (remembered with a cookie that ends when the browser closes). A stalled computer still reaches the login after 6 seconds of visible time. |
| Search (Ctrl+K) | Read-only. Admins find students, batches, lectures, assignments and pages through `/api/admin/search`. Students find only their own batch's lectures and assignments through `/api/student/search`. Their batch comes from the database, never from the browser. Assignment results open that assignment selected on its Assignments page (`/admin/assignments?assignment=3`, `/student/assignments?assignment=3`). Other results scroll to the item and highlight it (`/admin/lectures#lecture-3`, `/student/dashboard#lecture-3`). Finished lectures are hidden from students, so their search leaves them out too. |
| Design exceptions | The login page's opening and birds may run longer than 300ms. Everywhere else, the `classnest-ui` skill applies. |
| Design tokens | Every colour, font, radius and spacing value is a CSS variable in `public/css/tokens.css`, and `style.css` only uses those names. Only the three favicon files and the `theme-color` tag keep their own colour, because they can't read CSS. |
| Colours | Pure black base, electric blue for admins, electric orange for students. **No green anywhere.** Status colours keep their meaning: Submitted and On time use the role's accent, Pending and Live now are amber, Late is red, Missing is grey with a red outline, Closed is grey. Deadlines use the accent, then amber under 24 hours, then red with a soft pulse under 6 hours. |
| Theme | Dark by default. The toggle in the sidebar switches to light, and the choice is remembered. Light mode is the mockups' style: cream page, thick black borders, hard shadows, and the same blue and orange, in a deeper shade for text. Both themes use the same layout. |
| Rebrand | Done: the colours, the font, the logo, the buttons, the login page and the inner pages. |
| Fonts | Clash Display (free, from Fontshare) for the wordmark, headings and big numbers. Inter for body text, JetBrains Mono for small labels. They are loaded in `tokens.css`. |
| Logo | A flat line-art nest with a swallow flying out of it, drawn as SVG in code, with no images. The bird is soft white on the login page, blue for admins and orange for students. The sidebar and browser tab use a simpler version with fewer nest lines. |
| Breadcrumb | On every inner page, built in `sidebar.js`, so a change there reaches all pages. The Assignments pages add the chosen assignment's name. |
| Mockups | The trainer's mockups in `mockups/` set the layout and elements of every inner page. The name stays ClassNest, with its logo. Batches and Lectures have no mockup, so they follow the Students page: a form card and a list. |
| Layout | Every inner page has one fixed sidebar, built in `sidebar.js`, so a change there reaches all pages. At 960px and below it becomes a slide-out menu. |
| Admin dashboard | The fourth stat card is **Submissions**, not the mockup's "Pending reviews", because there is no grading. "Active batches" means batches that have reached their start date. |
| Assignments pages | One page per role, with the list on the left and the selected assignment on the right. The admin's page replaces the old submissions page. The student's page replaces the old submit page, with the same upload rules. The chosen assignment is in the address (`?assignment=3`), so links and refreshing keep it. |
| Status words | The server still sends Submitted, Late and Not submitted. Admin pages show them as On time, Late (with how late, like "Late · 2h") and Missing. Student pages show Pending, Submitted, Late or Closed. |
| Date picker | `picker.js` replaces the browser's date boxes. It always uses India time. The input stays in the page with the same value as before (`2026-10-30T19:30`), so forms and the server don't change. |
| Demo buttons | "Preview error state" on the login and "Try a .png instead" on the student's Assignments page come from the mockups. Both only show the real error message: nothing is sent to the server. |
| Duplicate emails | Rejected with a clear error (capital letters don't matter). |
| Re-uploading | Allowed. The newest file **replaces** the old one (old file is deleted). `submitted_at` and `is_late` change with it. The new file is saved first and the old one deleted last, so a failure leaves the old submission whole. |
| After the deadline | Uploads still allowed, but shown as **"Late"**. Never blocked. |
| Late | Saved in `submissions.is_late` when the upload arrives, using the server's clock. Moving a deadline later doesn't change work already handed in. Only a new upload does. |
| Upload rules | One file, `.zip` only, 10 MB at most, checked on the server by name and by its first 4 bytes (`PK` plus what kind of zip it is). The file is held in memory until every check passes, so a refused or half-finished upload never reaches the disk. Files are saved under a random name, and the student's file name is only kept in the database for display. Nothing is ever unzipped or run. |
| Downloads | Only a logged-in admin, through `/api/admin/submissions/:id/download`. The `uploads/` folder is outside `public/`, and students have no download route, not even for their own work. Files download as `username_assignment-title.zip`. |
| Moving an assignment | Once students have submitted work, an assignment can't move to another batch, because the submissions view lists the assignment's batch and their work would disappear from it. |
| Grading | **None** for now. |
| Running | Deployed on Render's free tier (https://classnest-cepb.onrender.com), with the database on Supabase Postgres. Locally, `npm start`. |
| Google Meet | Admin pastes a Meet link. No Google API. |
| First admin | Created by `npm run seed` using details from `.env`. |
| Demo data | `npm run seed:demo` adds a demo admin, 2 batches, 6 students, lectures, assignments and submissions. It only adds, and skips whatever already exists, by batch name, username, title, or assignment and student. Everyone in it has the password `Demo@1234`, so it is for a laptop only, never a deployed site. Dates are set the first time only, so running it again does not make the demo lecture live again. |
| Adding students | Admin creates the account with a temporary password. |

## Keeping it easy to move later (online file storage)

1. **All SQL lives in `server/models/`.** Routes call functions like `getBatches()` and never write SQL themselves.
2. **Model functions are `async`**, because the `pg` package talks to Supabase Postgres over the network.
3. **Plain, standard SQL.** Dates are stored as ISO text, e.g. `2026-10-30T14:00:00Z`.
4. **All file handling goes through `server/storage.js`** (save, delete, get). Today it uses the `uploads/` folder.
5. **Settings come from `.env`** (port, `DATABASE_URL`, uploads path, secrets).

## Folder structure

```
classnest/
├── server/
│   ├── server.js            ← starts the server, connects everything
│   ├── db.js                ← connects to Supabase Postgres, creates tables
│   ├── seed.js              ← creates the first admin
│   ├── seed-demo.js         ← adds demo data (safe to run again)
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
│   ├── admin/               ← dashboard, batches, students, lectures, assignments
│   └── student/             ← dashboard, assignments
├── public/                  ← open to everyone
│   ├── index.html           ← login page
│   ├── favicon.svg          ← also favicon-admin.svg and favicon-student.svg
│   ├── css/tokens.css       ← every colour, font, radius and spacing value
│   ├── css/style.css        ← layout and components
│   └── js/                  ← api.js, ui.js, theme.js, animations.js, palette.js, sidebar.js, picker.js,
│                               login.js, login-roles.js, login-intro.js, login-flock.js,
│                               admin.js, batches.js, students.js, schedule.js, lectures.js,
│                               assignments.js, student.js, student-assignments.js
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
| `pg` | talks to the Supabase Postgres database |
| `bcryptjs` | password hashing |
| `express-session` | login sessions (cookies) |
| `multer` | receives uploaded files (.zip only, size limit) |
| `dotenv` | reads the `.env` file |
| GSAP, Clash Display (Fontshare), Google Fonts (Inter, JetBrains Mono) | loaded from a free CDN (GSAP in the HTML, the fonts in `tokens.css`) |

## Commands

| Command | What it does |
|---|---|
| `npm start` | runs the server |
| `npm run dev` | runs the server and restarts it when you save a file |
| `npm run seed` | creates the first admin account (from step 4) |
| `npm run seed:demo` | adds demo data and prints the demo logins, and is safe to run again |

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
- [x] **13. Dashboards + polish:** match the mockups (sidebar layout, stat cards, date blocks, tags, filter pills, custom date picker, light mode), GSAP count-up, hover lift, pulsing live dot, friendly empty states.
- [x] **14. Final check:** test as admin and student, security review, README.
