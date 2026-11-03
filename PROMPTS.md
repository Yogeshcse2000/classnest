# ClassNest - Prompt Log

## Prompt 1 - Project setup (2026-10-30)

```
Set up the basic files for my project "ClassNest". Do not build the app yet.

1. Create CLAUDE.md with these project rules:
   - ClassNest is an LMS website with Admin and Student roles (my intern capstone).
   - Stack: vanilla HTML, CSS, JavaScript frontend; Node.js + Express backend; SQLite database. Everything must be 100% free.
- Design: clean, modern and friendly, not flashy. Off-white background, deep green primary colour, warm amber accent only for "Live now" and deadlines. Headings in "Outfit", body text in "Inter" (Google Fonts). Bento-grid dashboard with rounded cards, soft shadows, and friendly empty states. Include a light/dark mode toggle.
- Animations: GSAP, fast (around 300ms), smooth hover lift on cards and buttons, pulsing "Live now" dot, counting numbers on the dashboard.
   - Never commit .env or node_modules.
   - I am a beginner, so explain new things in simple words.

2. Create PROMPTS.md with a heading "ClassNest - Prompt Log" and add this prompt as the first entry.

3. Create a .gitignore that ignores node_modules, .env and the uploads folder.
```

## Prompt 2 - Planning the app (2026-10-30)

```
Read CLAUDE.md first. Don't write code yet.

I want to build ClassNest, an LMS where an admin creates batches, adds students, shares Google Meet lectures and posts assignments, and students log in, join classes and upload their work as a .zip file.

Plan this with me: suggest a folder structure, the database tables I'll need, and a step-by-step build order. Explain new concepts like server, API routes and password hashing in simple words. Add this prompt to PROMPTS.md.
```

## Prompt 3 - Plan answers + step 1 (2026-10-30)

```
1. One batch per student. Keep it simple: add batch_id directly to the students table, no enrollments table.
2. Yes, students can re-upload before the deadline (the latest file replaces the old one). After the deadline, uploads are allowed but marked "late", not blocked.
3. No grading for now. Keep submissions simple.
4. First it should run fully on my laptop with npm start. Later I may deploy it for free, so keep the code easy to move to Postgres and online file storage.

Update the plan with these answers, then start step 1.
```

## Prompt 4 - Save plan + step 2 (2026-10-30)

```
Yes, save the plan to PLAN.md. Then continue with step 2.
```

## Prompt 5 - Database + seed admin (2026-10-30)

```
Server works, I can see the test page. Next, set up the SQLite database.

Create the tables we planned (admins, batches, students, lectures, assignments, submissions), saved in the data folder so nothing is lost when the server restarts. Also make "npm run seed" create one admin account with a hashed password, and read the admin email and password from the .env file.

Explain what a table and password hashing are, using my own tables as examples. Add this prompt to PROMPTS.md.
```

## Prompt 6 - Login, sessions, dashboards, protection (2026-10-30)

```
Now build : login for admin and students.

1. Login page: one login screen with a toggle to choose Admin or Student. Admin logs in with email, student logs in with username. Show a clear error message if the credentials are wrong.

2. Passwords: check passwords against the hashed passwords in the database using bcrypt. Never store or compare plain passwords.

3. Sessions: use sessions (a login cookie) so the user stays logged in. Add a logout button that ends the session and sends the user back to the login page.

4. Dashboards: after login, the admin lands on the admin dashboard and the student lands on the student dashboard. Make simple placeholder dashboards for now that show the user's name and the logout button.

5. Protection: only a logged-in admin can open admin pages and call admin API routes. Only a logged-in student can open student pages and student API routes. An admin can't open student pages, and a student can't open admin pages. If someone isn't logged in, send them to the login page. Protected API routes should return an error instead of data.

6. Design: follow CLAUDE.md, with a smooth GSAP entry animation on the login card and a smooth toggle between Admin and Student.

Explain what a session, a cookie and an API route are in simple words. Add this prompt to PROMPTS.md.
```

## Prompt 7 - Batches and students (2026-10-30)

```
Stage 3 works, I tested login, wrong password and protected pages. Now build Stage 4: batches and students.

1. Batches page (admin): create a batch with name, start date and description. Show all batches in a list, and allow deleting a batch.

2. Enroll students page (admin): add a student with name and email, and pick a batch. The app auto-generates a username and a temporary password, and saves the password hashed.

3. Show the credentials only once, right after creating the student, with a copy button, so the admin can give them to the student.

4. Prevent duplicate usernames and emails, and show a clear error if one already exists.

5. Follow the design in CLAUDE.md, with smooth hover effects on cards and a nice success animation when credentials appear.

Explain how the app generates the username and password. Add this prompt to PROMPTS.md.
```

## Prompt 8 - Fix student login and copy buttons (2026-10-30)

```
I found two bugs in Stage 4.

Bug 1: Student login fails. I created a student and got a username and password, but I can't log in with them on the Student side of the login page.
Check the whole flow: how the username and password are generated, how the password is hashed and saved, and how the student login checks it. Explain in simple words what was wrong, then fix it.

Bug 2: The copy button copies the wrong text. When I click copy on the credentials, it copies a big block of extra text and formatting instead of only the username and password.
Fix it with three buttons:
- "Copy username" copies only the username.
- "Copy password" copies only the password.
- "Copy both" copies exactly this, as plain text with no extra spaces:
Username: <username>
Password: <password>
Show a small "Copied!" animation after clicking.

After fixing, tell me how to test both bugs. Add this prompt to PROMPTS.md.
```

## Prompt 9 - Cinematic login intro (2026-10-30)

```
Make the login page a fully cinematic, next-level intro experience, like a modern product launch video. Use GSAP timelines (and canvas for particles). ClassNest style from CLAUDE.md: deep green with amber glow, on a dark background.

Scene 1 (0-0.8s): black screen, a small green dot in the center pulses like a heartbeat, light slowly spreads out.
Scene 2 (0.8-2s): the dot bursts into glowing particles that fly and form the ClassNest nest logo, with a subtle camera zoom-in feel.
Scene 3 (2-3.2s): a big glowing green-to-amber horizon arc rises from the bottom. Behind it, a tilted 3D grid of blurred ClassNest UI cards (made in HTML/CSS) drifts in. The word "ClassNest" appears letter by letter with a light sweep shining across it.
Scene 4 (3.2-4s): the heading moves up and a glass login card (blur, soft border glow) reveals with a smooth scale and fade. Tagline: "Your batch. Your classes. One nest."

After the intro: background stays alive, with slow floating particles, the arc gently breathing, and the card tilting slightly with the mouse. Buttons glow on hover, and the Admin/Student toggle slides smoothly.

Rules:
- A visible "Skip" button, and click anywhere to skip.
- Full intro only on the first visit in a session, after that a quick 0.5s version.
- Must stay smooth at 60fps: use transform and opacity only, limit particles, pause the animation when the tab is hidden.
- Respect prefers-reduced-motion. Make it look good on mobile too.
- No external images or paid assets, everything in code.
- Don't change any login logic.
Add this prompt to PROMPTS.md.
```

## Prompt 10 - ClassNest UI skill (2026-10-31)

```
Create a Claude Code skill at .claude/skills/classnest-ui/SKILL.md.

Name: classnest-ui
Description: Design system for ClassNest. Use it whenever creating or changing any page, component or style.

Put these rules in the skill:
- Identity: dark, rich, ambient theme. Near-black green background, deep green primary, warm amber accent only for "Live now" and deadlines, soft breathing glows, faint dot grid, glass cards. Light mode stays available.
- Apple-level discipline: Outfit for headings, Inter for body, big headings with slight negative letter spacing, generous spacing, consistent 18px card radius, pill-shaped buttons with press and focus states.
- Login page: cinematic intro, then the Admin and Student role cards, and the chosen card morphs into the login form.
- Inner pages: calm, only short micro-interactions (150-300ms): spotlight hover, toasts, skeleton loaders, empty states, Ctrl+K command palette.
- Rules: no external images or paid assets, everything in code. 60fps, only transform and opacity. Respect prefers-reduced-motion. Works on mobile (375px to 1920px). Never break app logic, APIs or the database.

Then mention this skill in CLAUDE.md. Add this prompt to PROMPTS.md.
```

## Prompt 11 - Redesign all pages with the skill (2026-10-31)

```
/classnest-ui Read CLAUDE.md and PLAN.md first.

Redesign all existing pages (login, admin dashboard, batches, students, student dashboard) using this skill's rules. Don't change the backend, the database, the API routes or the login logic.

After that, test admin login, student login, wrong password, creating a batch and enrolling a student, on desktop and mobile size. Fix any errors you find, then give me a short report of what you changed and tested.

Add this prompt to PROMPTS.md.
```

## Prompt 12 - Stop admin autofill in the student form (2026-10-31)

```
Small fix on the login page: the browser autofills the saved admin email AND admin password into the student form.

- Give the admin and student forms separate input names and ids (for example admin-email, admin-password, student-username, student-password).
- Admin form: autocomplete="email" for the email, autocomplete="current-password" for the password.
- Student form: autocomplete="username" for the username, autocomplete="current-password" for the password.
- When switching between Admin and Student, or clicking Back, clear both fields.
- Keep only the active form in the page (not just hidden), so the browser can't fill the other one.

Don't change the login logic. Test that switching roles never shows the admin email or password in the student form. Add this prompt to PROMPTS.md.
```

## Prompt 13 - Real search, no Skip, docs cleanup (2026-10-31)

```
Make these changes:

1. Ctrl+K search: keep the search bar, but remove "Log out", "Switch to light mode" and other action items from it. The search should only find real data and pages:
- Admin: students (by name, username or email), batches, lectures, assignments, and pages (Dashboard, Batches, Students).
- Student: their own lectures and assignments only.
Clicking a result opens that item's page. Show grouped results with small labels (Student, Batch, Lecture, Assignment), and a friendly "No results" message.

2. Login intro: remove the "Skip" button and all skip behaviour (no click or Esc skip). Keep the intro length as it is and let it play fully, then show the login. In the same browser session, if the user comes back to the login page (for example after logging out), don't play the full intro again: show only a quick version. Keep prefers-reduced-motion support for users who turn off animations.

3. Update the classnest-ui skill with these rules. Also update CLAUDE.md: replace the old design and animation lines (off-white, "not flashy") with a short note that the design now follows the classnest-ui skill: dark, rich, ambient theme, cinematic login intro, calm inner pages. Keep the skill as the single source of design rules.

4. Fix PROMPTS.md: if Prompt 12 is missing its closing code block, add it.

Safety rules: don't change any database tables or existing data, search must only read data. Protect the search API routes: admin search only for logged-in admins, student search only returns that student's own batch data. Don't change login, batches or students logic. After the changes, test admin login, student login, creating a batch, enrolling a student, the intro and the search for both roles, and fix any errors.

Add this prompt to PROMPTS.md.
```

## Prompt 14 - Fix admin search error (2026-10-31)

```
Bug: the Ctrl+K search always shows "Search isn't available right now. Please try again." for admin.

Find the cause yourself: start the server, log in as admin, call the search API the same way the frontend does, and read the server logs and the response status. Check that the search API route exists and is registered in the server, that the frontend calls the correct URL, and that the login session cookie is sent with the request.

First explain in simple words what was wrong, then fix it. Don't change the database, login, batches or students logic. Search must only read data, admin search only for logged-in admins, student search only for that student's own batch.

Test it: as admin, search "kevin" and find the student. As student, search and see only your own batch data. Fix any errors, then confirm it works. Add this prompt to PROMPTS.md.
```

## Prompt 15 - Tester subagent (2026-10-31)

```
Create a Claude Code subagent at .claude/agents/tester.md.

Name: tester
Description: Tests ClassNest after every stage. Use it when a stage is finished.

Its job:
- Start the app and test every finished feature as admin AND as student.
- Check the must-have items built so far, and the security rules: protected pages and API routes, hashed passwords, no .env in Git.
- Check the browser console and the server terminal for errors.
- Don't fix anything itself. Give a short pass/fail report with clear steps to reproduce each bug.

Mention this agent in CLAUDE.md and PLAN.md. Add this prompt to PROMPTS.md.
```

## Prompt 16 - Fix the tester's 4 bugs (2026-10-31)

```
Fix the 4 bugs from the tester report. Don't change the design, the database tables or any working feature.

1. Error handler in server.js: respect each error's own status. Broken JSON returns 400, a body that's too big returns 413, with a short clear message. Never print request bodies or passwords in the terminal logs.

2. Enrolling at the same time: make enrolling safe when two requests come together. Let the database's unique rules be the final check, and if a duplicate slips through, return the clear "already exists" error instead of a 500. Same name should still get different usernames.

3. Logged-in users opening /index.html should be sent to their own dashboard, just like /.

4. Reduced motion: double-clicking Back must stay on the role cards and never open the Admin form. Ignore clicks while the screen is changing.

Also test the "Not tested" items you can: logins surviving a server restart, and npm start and npm run dev both starting correctly.

Then use the tester agent to check only these 4 fixes and the restart test. Give me a short report. Add this prompt to PROMPTS.md.
```

## Prompt 17 - Stage 5: lectures and assignments (2026-10-31)

```
/classnest-ui Act as a world-class senior full-stack developer and product designer. Read CLAUDE.md and PLAN.md first.

Build Stage 5: lectures and assignments (admin side only). Student pages come in Stage 6, don't build them yet.

1. Release lecture page (admin):
- Form: title, date and time, Google Meet link, and a batch dropdown.
- Validate: all fields required, the Meet link must start with https://meet.google.com/, the batch must exist. Show a clear error next to the wrong field.
- If the date and time is in the past, show a warning but still allow saving.
- List all lectures sorted by date, showing title, batch, date and time, and a status tag: Upcoming, Live now (from start time to 1 hour after), or Done.
- Edit and delete each lecture, with a confirm popup before deleting.
- Filter the list by batch.

2. Assignments page (admin):
- Form: title, description, deadline (date and time), and a batch dropdown.
- Validate: all fields required, the deadline must be in the future when creating.
- List all assignments sorted by deadline, showing title, batch, deadline and time left. Deadlines within 24 hours use the amber accent colour, past deadlines show "Closed".
- Edit and delete each assignment, with a confirm popup.
- Filter the list by batch.

3. Dates and times: save them in the database in one standard format (ISO, UTC), and always show them in the user's local time (India, IST). Use the server's clock for all time checks, never the browser's.

4. Connect to existing features:
- Add Lectures and Assignments to the admin navigation.
- Admin dashboard: show counts of lectures and assignments, and the next upcoming lecture.
- Ctrl+K search: lectures and assignments results should now open their correct page.
- If a batch is deleted, handle its lectures and assignments safely (don't leave broken data, and warn the admin before deleting).

5. Safety rules:
- Only logged-in admins can use these pages and API routes.
- Don't change the login, batches, students or existing data.
- Every lecture and assignment belongs to exactly one batch.
- Don't redesign or restyle existing pages. Only add the new pages, nav links and dashboard cards in the same style.
6. When done, use the tester agent to check Stage 5 and everything before it. Fix any bugs it finds.

Then give me a short report: what you built, what you tested, and how dates are saved, explained simply. Add this prompt to PROMPTS.md.
```

## Prompt 18 - Tester: current stage only by default (2026-10-31)

```
Update .claude/agents/tester.md: by default, test only the features from the current stage or fix, not the whole app. Run a full test only when I say "full test". Keep reports short. Add this prompt to PROMPTS.md.
```

## Prompt 19 - Stage 6: student dashboard (2026-10-31)

```
/classnest-ui Read CLAUDE.md and PLAN.md first. Build Stage 6: the student dashboard. Don't change admin features, the database tables, the login, or the design of existing pages.

1. Data and security:
- Student API routes read the batch only from the logged-in session, never from the URL or request body.
- Return only what the page needs (no password hashes, no other batches' data).
- All time checks use the server clock. The API also sends the server's current time so countdowns on the page stay correct even if the student's computer clock is wrong.

2. "Live now" card (top of the dashboard):
- A lecture is live from its start time until 1 hour after. Use the same rule as the admin "Live now" status, from one shared function.
- Show title, start time (IST), a pulsing amber dot and a "Join live" button that opens the Meet link in a new tab (target="_blank" rel="noopener noreferrer").
- If more than one is live, show all of them, earliest first.
- If nothing is live, show the next lecture with "Starts in ..." instead.

3. Upcoming lectures: the student's batch lectures that haven't started yet, sorted by time, with title, date and time (IST) and time until start. Hide finished lectures.

4. Assignments: the student's batch assignments sorted by deadline, with title, short description, deadline (IST) and time left. Amber when less than 24 hours are left, "Closed" after the deadline. Don't add a Submit button yet, Stage 7 adds it.

5. Live updates: refresh the data every 30 seconds and update countdowns every minute without reloading the page, so a lecture moves into "Live now" by itself. Pause when the tab is hidden.

6. Search: for students, clicking a lecture or assignment result scrolls to that item on the dashboard and highlights it briefly.

7. Empty states: friendly messages when there are no lectures or assignments. If the student's batch has nothing yet, the page must still load without errors.

8. Test it yourself (no tester agent), on a copy of the database so my real data stays clean:
- A student sees only their own batch's lectures and assignments. Create a second batch and student for this test.
- A lecture moves from upcoming to "Live now" without reloading.
- "Join live" opens the Meet link in a new tab.
- Countdowns and "Closed" are correct.
- No errors in the browser console or server terminal, on desktop and mobile size.

Then give me a short report of what you built and tested. Add this prompt to PROMPTS.md.
```

## Prompt 20 - Stage 7: zip uploads, deadlines and admin review (2026-10-31)

```
/classnest-ui Read CLAUDE.md and PLAN.md first. Build Stage 7: zip uploads, deadlines and admin review. Don't change the login, existing features, database data, or the design of existing pages.

1. Student: submit assignment page
- Each assignment on the student dashboard gets a "Submit" button that opens its own submit page.
- Show title, full description (the dashboard cuts it to 2 lines, and phones can't hover), deadline (IST) and a live countdown using the server time.
- A drag-and-drop zone plus a "Choose file" button. Before uploading, show the file name and size. While uploading, show a progress bar and disable the button so it can't be clicked twice.
- After upload: a success animation, and "Submitted on <time>", with a Late tag if it was late.
- If already submitted, show the current submission (file name, time, Late tag) and allow re-upload. The new file replaces the old one, and is_late and submitted_at are updated.
- On the dashboard: sort open assignments first by deadline, closed ones at the bottom, and show each assignment's status (Not submitted, Submitted, Late).

2. Upload rules (checked on the server, not only in the browser):
- Accept only .zip files. Check the extension AND the real content (a zip file starts with the bytes "PK"). Reject anything else with a clear message.
- Size limit 10 MB, with a clear error if it's too big.
- Never unzip or run uploaded files. Only store and download them.
- Save files in an uploads folder with a safe generated name, never the user's file name in the path. Keep the original name in the database only for display.
- If an upload fails halfway, delete the partial file and don't change the old submission.
- Mark is_late with the server clock: late if uploaded after the deadline. Late uploads are allowed but flagged.
- A student can only submit to assignments of their own batch (batch looked up from the session's student ID, like Stage 6).
- If an assignment or student is deleted, delete their uploaded files too, so nothing is left behind.
- The uploads folder must stay in .gitignore.

3. Admin: submissions review
- On the Assignments page, each assignment opens a submissions view.
- A table of every student in that batch: name, username, status (Submitted, Late, Not submitted), submitted time, and a Download button.
- Counts at the top: submitted, late, not submitted.
- Download sends the .zip with a clean name like username_assignment-title.zip.
- Only a logged-in admin can download. Students can never download anyone's files through the API, including their own.
- Admin dashboard: show the 5 latest submissions.

4. Test it yourself (no tester agent), on a copy of the database and a test uploads folder so my real data stays clean:
- A real .zip uploads fine. A .pdf, and a .txt renamed to .zip, are both rejected.
- A file over 10 MB is rejected.
- An upload after the deadline is marked Late.
- Re-upload replaces the old file, and the old file is deleted from disk.
- Admin sees the correct status for every student, and the download works.
- A student can't download files, or submit to another batch's assignment.
- No errors in the browser console or the server terminal, on desktop and mobile size.

Then give me a short report of what you built and tested. Add this prompt to PROMPTS.md.
```

## Prompt 21 - Match the trainer's mockups (2026-10-31)

```
/classnest-ui Read CLAUDE.md, PLAN.md and IDEAS.md first. Then study every image in the mockups folder. These are my trainer's official mockups, and "UI matches the mockups" is part of my score.

Goal: all inner pages must match the mockups' LAYOUT and ELEMENTS closely, and every page must look like part of one app. Keep the ClassNest name, logo and dark theme as the default. Add the mockup's style (cream background, thick black borders, hard offset shadows, blue accent for admin, orange for student) as the light mode.

1. Login: keep my current login EXACTLY as it is: the cinematic intro, then two separate cards for Admin and Student, and clicking a card opens its login form. Don't replace it with the mockup's split screen or toggle. Only add, inside my design: the note "Students can't sign up. Your admin creates your login." and a working "Preview error state" link.

2. Sidebar layout (all inner pages): replace the top navigation with a fixed left sidebar like the mockups. Logo and role badge at the top, nav links in the middle, then the user card (student: name and batch) and Log out at the bottom. Keep the search and theme toggle in the sidebar. On mobile the sidebar becomes a slide-out menu. This also fixes the bug where the top bar shows in the middle of pages over the content.

3. Admin dashboard: greeting ("Good morning, Admin" by IST time), "+ Release lecture" and "+ Post assignment" buttons, 4 stat cards (Active batches, Students, Lectures released with "X scheduled today", Submissions with "X submitted late"), Upcoming lectures with date blocks (TODAY highlighted), and a Latest submissions table (student, assignment, when as "10 min ago", status On time or Late) with a "View all" link.

4. Admin students: enroll form on the left, students table on the right (name, email, batch, username), with a working search box and a count. The credentials popup keeps working.

5. Admin assignments: assignment list on the left (title, batch, deadline, "submitted/total in"), selected one highlighted. On the right, the selected assignment's table: student, file name, status (On time, Late with how late like "Late · 2h", Missing), and "Download .zip" or "Not submitted". Add working filter pills: All, On time, Late, Missing. The "+ New assignment" button opens the post form.

6. Batches and Lectures pages: no mockup for these, so build them in the same layout: form card plus list or table, same borders, tags and buttons.

7. Student dashboard: a big "Live now" card with "started X min ago" and a "Join live class" button. If nothing is live, show the next lecture there instead, and don't repeat it in the upcoming list. Upcoming lectures with date blocks and "Join opens at start". Assignments with Pending, Submitted, Late or Closed tags, and an "Open all" link.

8. Student assignments page: add an "Assignments" sidebar link. List on the left (open first, closed at the bottom), the selected assignment on the right with its full description, a big "Time left" box counting down like "3d 05:05:02", and the zip drop zone. Merge the current Stage 7 submit page into this, keeping all its upload rules and behaviour.

9. Polish fixes:
- Replace the browser's default date-time picker with a custom picker that matches the design (IST).
- No inner scrollbars inside form cards.
- Fix any heading or content hidden under other elements.

Rules:
- All pages share the same sidebar, spacing, borders, buttons, tags and colours. Update the classnest-ui skill with these new rules, so every page now and later looks the same.
- Every button in the mockups must exist and work. No fake buttons.
- Use real data from the database, never the mockup's sample names.
- Add API data needed for the new counts and tables, but don't change the database tables, the login logic, sessions, or the upload rules.
- Test it yourself quickly (no tester agent): both roles, every page, button and filter, light and dark mode, desktop and mobile, no console errors. Then give me a short report, including anything you couldn't match.

Add this prompt to PROMPTS.md.
```

## Prompt 22 - Linear-style sidebar (2026-11-01)

```
/classnest-ui Redesign only the sidebar, inspired by Linear's sidebar (style inspiration only, no copying). Don't change any page content, data or logic.

1. Top row: ClassNest logo and name on the left. On the right, a medium-size search icon button (just the magnifying glass, no text, no "Ctrl K" label) that opens the search, and the theme toggle icon next to it. Both icons same size, with a soft hover highlight like Linear. Remove the big search bar and theme button from the bottom.
2. Every nav link gets a small, clean line icon on its left (free Lucide-style icons, inline SVG, no paid assets):
- Dashboard: layout grid
- Batches: layers
- Students: users
- Lectures: video camera
- Assignments: notebook
- Log out: log-out arrow
Student sidebar: Dashboard (home) and Assignments (notebook).

3. Style: compact rows, smaller text, icons slightly muted. On hover a soft highlight, and the active page gets a subtle filled background with a brighter icon (the accent colour), like Linear.

4. Bottom: the user card (name, role or batch) with the Log out link and its icon.

5. Same sidebar on every inner page, for both roles, in dark and light mode, and the mobile slide-out menu too. Update the classnest-ui skill with these sidebar rules.

Test it yourself quickly (no tester agent): every link, search icon, theme icon and log out, on desktop and mobile. Add this prompt to PROMPTS.md.
```

## Prompt 23 - Rebrand Part A: colours, logo and login (2026-11-01)

```
/classnest-ui Read CLAUDE.md and PLAN.md first. Part A of the ClassNest rebrand: colours, logo and the login page. Don't change any app logic, database, API routes, sessions, upload rules, or the layout of inner pages (that is Part B).

1. Design tokens: put all colours, fonts, radius and spacing as CSS variables in one file, and make every page use them, so future changes need only one place.

2. Colours (remove ALL green everywhere, including inner pages, tags, buttons, charts and focus rings):
- Base: pure black background, slightly lighter black surfaces, very thin subtle borders, soft white text, muted grey secondary text.
- Admin accent: electric blue on all admin pages. Student accent: electric orange on all student pages. Use the accent for active nav, main buttons, focus rings, glows and highlights. Status colours stay meaningful (for example Late in red or amber, On time in a calm blue or white, never green).
- The login page is neutral black and white until a role is hovered or chosen.
- Light mode stays available with the same blue and orange accents.
- Keep text readable: in light mode use a slightly deeper shade of the accents for text, so contrast stays good.
3. Logo (original, drawn in code as SVG, no images or external assets):
- A hand-drawn style white bird's nest made of thin twig-like strokes, with an open dark centre.
- Below it "CLASSNEST" in uppercase, Jost font, medium-bold weight, wide letter spacing.
- Tagline below: "LEARN · GROW · FLY" in small, wide-spaced uppercase.
- Login: full logo. Sidebar: small nest plus the name. Browser tab icon: the nest only.
- Remove the old logo everywhere.

4. Login page (split screen, black, minimal, classy):
- Remove the old intro completely (particles, arc, floating cards, glows).
- LEFT panel (animation): the nest draws its strokes in, then each letter of "CLASSNEST" springs in one by one, a soft light sweep passes over the word, a thin line draws under it, and "LEARN · GROW · FLY" fades in. Hovering the word shows a moving electric-blue-to-electric-orange gradient inside the letters. Then small glowing birds fly out of the nest and form a flock (simple boids on canvas) that gently follows the mouse inside the left panel. Birds are soft white by default, turn electric blue when the Admin tile is hovered or chosen, and premium orange for Student.
- Intro about 2 seconds, no skip button. Full intro on the first visit in a browser session, a quick version after that.
- RIGHT panel (login): "Log in to ClassNest" and two tiles, Admin (shield icon) and Student (graduation cap icon), with a soft blue or orange glow on hover. Clicking a tile morphs it into its login form, like now, with a Back button. Dark inputs with thin borders that glow in the role colour on focus. A wrong password gives a small shake and a clear error. A bordered note box: "Students can't sign up. Your admin creates your login." Keep the "Preview error state" link.
- After a successful login, the form fades out and the dashboard fades in smoothly.
- Performance: around 40 to 60 birds, only transform and opacity for DOM animations, pause the canvas when the tab is hidden, and support prefers-reduced-motion (show a still flock and no letter animation).
- Mobile: hide the bird animation, show the small logo on top and the login below.

5. Safety: keep all existing form field names, element ids and JavaScript hooks that features use (login forms, autofill fix, upload zone, filters, search). Change styling and add new elements, but don't break or rename what works. If you must change one, update every place that uses it.

6. Update the classnest-ui skill and CLAUDE.md with the new colours, logo and login rules, and remove every old green, old logo and old intro rule, so they never come back.

Test it yourself quickly (no tester agent): the full intro and the quick version, hover colours, admin login, student login (kevin), wrong password, Back button, every inner page still works with the new colours, light and dark mode, desktop and mobile, no console errors. Then give me a short report. Add this prompt to PROMPTS.md.
```

## Prompt 24 - Cinematic login opening and premium birds (2026-11-01)

```
Change the login intro into a full-screen cinematic text reveal. Don't change the login forms, the role tiles, the logic, or any other page.

1. Full-screen opening (about 3 to 4 seconds, smooth, no skip button):
- The page starts pure black. Only the word "CLASSNEST" in the centre of the WHOLE screen, very large. No nest, no birds, and the login panel is hidden.
- Text reveal like the 21st.dev "reveal-text" component: each letter springs in one by one with a spring effect, then a soft light sweep passes across the whole word once, for cinematic emphasis.
- Then a thin line draws under the word from left to right, and "LEARN · GROW · FLY" fades in below it.

2. Move to the login:
- The word, line and tagline smoothly shrink and move into the centre of the LEFT panel.
- Only after it arrives, the nest logo fades in softly above the word, and then the birds fly out of the nest and form the flock in the left panel.
- At the same time, the right login panel slides in from the right and fades in.
- One GSAP timeline, so everything flows together with no jumps or flicker.

3. Hover on the word: show a moving electric-blue-to-electric-orange gradient inside the letters (no purple or pink).
3b. Make the birds premium and aesthetic:
- Draw each bird as a soft, elegant silhouette with two curved wings (like a swallow), not arrows or triangles.
- Wings flap gently, each bird at its own slightly different speed, so the flock looks alive.
- Vary the sizes a little, with smaller birds fainter and further away, for depth.
- Each bird leaves a very faint, short light trail as it flies.
- Calm, graceful motion: slower speed, smooth turns, never jittery. They glide around the logo and softly follow the mouse.
- Fewer but nicer: around 25 to 35 birds.
- Colour: soft white with a light glow by default, electric blue when Admin is hovered or chosen, electric orange for Student, with a smooth colour fade between them.

4. Session rule stays: the full opening plays on the first visit in a browser session. After that, show the final split layout directly with a quick fade. Keep prefers-reduced-motion support (show the final layout with no movement). Mobile: a short version of the reveal, then the small logo on top and the login below.

Test it yourself quickly: the full opening in a fresh InPrivate window, the quick version on a second visit, both logins still work, desktop and mobile. Add this prompt to PROMPTS.md.
```

## Prompt 25 - Final design pass: new logo, new font and the inner pages (2026-11-01)

```
/classnest-ui Read CLAUDE.md and PLAN.md first. Final ClassNest design pass: new logo, new font, and the inner pages (Part B). Don't change any app logic, database, API routes, sessions, upload rules, or the working features of any page. Keep the login opening animation flow exactly as it is now; only swap in the new font and the new logo.

1. Font:
- Use Clash Display (free from Fontshare, load it from the Fontshare CSS link, with a system sans-serif fallback) for the "CLASSNEST" wordmark and all headings and big numbers. Inter stays for body text.
- Remove Jost and Outfit everywhere.
- Wordmark: "CLASSNEST" in uppercase, Clash Display semibold, slightly wide letter spacing. Tagline "LEARN · GROW · FLY" stays small and wide-spaced.

2. New premium 3D nest logo (replace the sketch-style nest everywhere):
- Drawn in code as SVG, no images. It must look like a luxury brand emblem, not a hand sketch.
- A round nest made of 6 to 8 smooth, thick woven bands that overlap over and under each other, like a woven ring seen at a slight 3/4 angle from above.
- Real depth: each band has a metallic gradient (bright silver at the top edge, dark graphite at the bottom), soft shadows where bands pass under each other, a darker hollow inside, and a soft shadow under the whole nest.
- In the centre, a small glossy egg with a soft highlight: pearl white on the login page, electric blue on admin pages, electric orange on student pages.
- Make a simplified version for small sizes (sidebar and browser tab) with fewer bands, so it stays clean at 24px.
- Use it on the login page (in the opening, appearing after the word moves to the left, as now), in the sidebar, and as the browser tab icon. Remove the old nest everywhere.

3. Inner pages (premium dark dashboard style, like Taskk):
- A breadcrumb at the top of every inner page (for example Home > Dashboard, Home > Assignments > build a page).
- Stat cards: icon inside a small rounded square box, big number in Clash Display, label below, and a soft accent glow with a faint dot pattern rising from the bottom on hover.
- Sidebar: muted grey icons, and the active page gets a soft filled background with an accent-coloured icon. Keep the search and theme icons at the top.
- Same thin borders, radius, spacing, buttons, inputs and tags on every card, table and form, for both roles.
- Admin pages use electric blue, student pages use electric orange, with no green anywhere.
- Subtle page transitions: content fades in smoothly when you open a page.

4. One consistent experience: the login and inner pages use the same black background, fonts, cards, inputs and buttons, so moving from login to the dashboard feels like one app.

5. Fixes:
- The "+ Post assignment" button is cut off at the right edge of the admin dashboard. Make sure nothing overflows at any screen width.
- In light mode, use slightly deeper shades of the accents for text so it stays readable.

6. Safety: keep all existing form field names, element ids and JavaScript hooks that features use (login forms, autofill fix, upload zone, filters, search). Change styling and add new elements, but don't break or rename what works. If you must change one, update every place that uses it.

7. Update the classnest-ui skill and CLAUDE.md with the new font, logo and inner page rules, and remove all old font, old nest and green rules, so they never come back.

Test it yourself quickly (no tester agent): the login opening in a fresh InPrivate window, admin and student login, every inner page for both roles, the logo at large and small sizes, light and dark mode, desktop and mobile, no console errors. Then give me a short report. Add this prompt to PROMPTS.md.
```

## Prompt 26 - New nest and bird logo, premium buttons (2026-11-01)

```
/classnest-ui Read CLAUDE.md first. Replace the logo and make all buttons premium. Don't change any app logic, layouts, features, or the login opening animation flow.
A previous session started this task and stopped at the usage limit, so some files may already be changed. First run git status and git diff to see what is already done, then finish only the remaining parts. Don't redo work that is already correct.

1. New logo: a nest with a bird flying out of it (original, drawn in code as SVG, no images, no 3D, no egg).
- The nest: a shallow, wide bowl shape made of 3 to 4 clean, smooth, slightly curved parallel lines, like a refined line-art emblem. Same stroke weight, rounded line ends, perfectly balanced.
- The bird: one elegant swallow silhouette (same style as the login page birds) rising out of the nest at an upward angle, as if just taking off.
- Style: flat, sharp and minimal, like a luxury brand mark. White on dark, near-black in light mode.
- The bird gets the accent colour: electric blue on admin pages, electric orange on student pages, soft white on the login page.
- A very subtle glow on the bird only, nothing heavy.
- Small size version (sidebar and browser tab): same mark, simplified, sharp at 24px.
- Replace the old metallic nest and egg everywhere (login, sidebar, browser tab).
- On the login page, keep the opening flow: the logo appears after the word moves to the left. Add one small touch: the bird draws in and lifts off from the nest.

2. Premium buttons (all pages, both roles):
- Primary buttons (like "+ Post assignment", "Create batch", "Release lecture", "Enroll student", "Upload"): a subtle vertical gradient from a deeper shade to the brighter accent, a thin light highlight line on the top edge, a soft accent glow on hover, a slight press-down effect on click. Medium height, medium-weight text, not big and heavy.
- The "+" sits in a small rounded square inside the button.
- Secondary buttons (like "+ Release lecture" on the dashboard, "Cancel", "Back"): dark glass style with a thin border and a soft highlight on hover.
- Danger buttons (delete): dark with a thin red border, red only on hover.
- Same height, radius and spacing for every button.
- Use the electric blue accent on admin pages and the electric orange accent on student pages.

3. Fix: the "+ Post assignment" button touches the right edge of the admin dashboard. Add proper right padding to the page, so nothing touches or overflows the edges at any screen width.

4. Update the classnest-ui skill and CLAUDE.md with the new logo and button rules, and remove the old metallic nest and egg rules.

Safety: keep all existing button ids, classes used by JavaScript, and form names. Change styling only.

Test it yourself quickly (no tester agent): the logo at large and small sizes, every primary, secondary and delete button on both roles, light and dark mode, desktop and mobile. Add this prompt to PROMPTS.md.
```

## Prompt 27 - Reset password and demo data (2026-11-01)

```
Read CLAUDE.md and PLAN.md first. Two small additions. Don't change the design, existing features, or existing data.

1. Reset password (admin): on the Students page, each student gets a "Reset password" button. It asks for confirmation first, then generates a new temporary password, saves it hashed, and shows it only once with copy buttons, exactly like when a student is created. The old password stops working immediately. Only a logged-in admin can do this.

2. Demo data script: add "npm run seed:demo". It ADDS demo data without deleting anything that already exists, and skips items that already exist, so it is safe to run again:
- 2 batches: "Web Dev · Jan 2027" and "AI Builders · Nov 2026".
- 6 students spread across both batches, all with the password Demo@1234 (hashed).
- Lectures: one that is live right now (started 10 minutes before the script runs), 2 upcoming, and 1 finished.
- Assignments: one open, one due within 24 hours, and one closed.
- Submissions on the open and closed assignments, with small real .zip files: some on time, some late, and some students missing, so every status shows.
- At the end, print the demo admin and student logins in the terminal.

Test it yourself quickly (no tester agent): reset a password and log in with the new one, run the seed twice to check nothing duplicates, and check both dashboards show the demo data. Add this prompt to PROMPTS.md.
```

## Prompt 28 - Small UI polish: deadlines, lectures, tags and readability (2026-11-01)

```
/classnest-ui Read CLAUDE.md first. Small UI polish only. Don't change layouts, features, logic, data, or the login flow.

1. Login opening:
- Make the big "CLASSNEST" word in the opening about 20% smaller. Keep the animation, timing and the move to the left exactly the same.

2. Deadlines easy to notice (student dashboard, student assignments page, admin assignments page):
- Show "time left" inside a small coloured tag, not as plain text.
- More than 24 hours left: neutral tag with the role accent colour.
- Less than 24 hours: amber tag.
- Less than 6 hours: red tag with a very soft pulse.
- After the deadline: grey "Closed" tag.
- On the student submit page, the big "Time left" box uses the same colour rule.

3. Lectures easy to notice:
- In upcoming lectures, make the time part bold (for example "Starts in **2 hours**").
- The "Live now" card stands out clearly from the other cards: a slightly brighter border in the accent colour, a soft glow, a pulsing red "LIVE" dot, and the "Join live" button as the biggest, brightest button on the page.

4. Status tags, the same everywhere for both roles (no green):
- Pending: amber.
- Submitted and On time: the role accent colour (blue for admin, orange for student).
- Late: red.
- Missing: grey with a red outline.
- Closed: grey.
- Use filled tags with readable text, not just outlined grey ones.

5. Readability:
- Make muted grey text a little brighter (good contrast on black) and slightly bigger (at least 14px).
- Card labels, numbers and sub-lines must look clearly different (size and weight), so each card is easy to scan.
- Check the same in light mode.

Safety: keep all ids and classes used by JavaScript. Change styling only.

Test it yourself quickly (no tester agent): use the demo data to see every deadline colour and every status tag, check both roles, light and dark mode, desktop and mobile. Add this prompt to PROMPTS.md.
```

## Prompt 29 - Logo hover, birds behind the brand, submitted work and usernames (2026-11-01)

```
/classnest-ui Small changes only. Don't change layouts, features, logic, or the login flow.

1. Logo hover on the login page: give the nest-and-bird logo the same hover effect as the "CLASSNEST" word. When the cursor is over the logo, a moving electric-blue-to-electric-orange gradient flows through the logo's lines and the bird, with the same speed, colours and soft glow as the word. When the cursor leaves, it smoothly returns to white. Hovering either the logo or the word lights up both together.

2. Birds behind the brand: the flock must fly behind the logo, the word and the tagline (lower layer), so they never cover the letters.

3. Submitted work: once a student has submitted an assignment, don't show the red or amber urgency tag or pulse for it. Show the "Submitted" tag instead (or "Late" if it was late).

4. Students table: usernames must never break across lines (for example "kabir." / "singh"). Keep each username on one line, and shorten with "…" if there's really no space.

Safety: keep all ids and classes used by JavaScript. Don't run browser tests. Just make sure there are no code errors. Add this prompt to PROMPTS.md.
```

## Prompt 30 - Full pre-submission test (2026-11-01)

```
Use the tester agent to run a FULL test of ClassNest before submission. Use a copy of the database and a test uploads folder, so my real data stays clean.

Check all 14 must-have items from PLAN.md, as admin AND as student:
- Admin: login and protected pages, create and delete batches, enroll students with credentials, reset password, release lectures, post assignments, see who submitted and who is late, download zips.
- Student: login, sees only their own batch, "Join live" opens Meet in a new tab, deadlines and time left, zip upload (only .zip, size limit, late flag, re-upload).
- Core: data survives a server restart, and npm start runs the whole app.
- Security: protected API routes, hashed passwords, no .env, node_modules or uploads in Git.
- Every button on every page works, in light and dark mode, on desktop and mobile, with no console errors.

Don't fix anything. Give me a short pass/fail report with clear steps for each bug. Add this prompt to PROMPTS.md.
```

## Prompt 31 - Final submission docs (2026-11-02)

```
Read CLAUDE.md, PLAN.md and IDEAS.md first. Write the final submission docs. Don't change any app code.

1. README.md, clear and well formatted:
- Title "ClassNest" with the tagline "LEARN · GROW · FLY" and a one-paragraph description (an LMS for BrightPath Academy: admin runs batches, lectures and assignments; students join live classes and upload .zip work).
- Features list for Admin and Student.
- Tech stack: Node.js, Express, SQLite (better-sqlite3), vanilla HTML/CSS/JS, GSAP, bcrypt, express-session, multer.
- Install and run, step by step for Windows: npm install, copy .env.example to .env, npm run seed, npm run seed:demo (optional demo data), npm start, open localhost:3000.
- Demo logins: the admin email and password from .env.example, and the demo students with password Demo@1234.
- "How I used Claude Code": CLAUDE.md (project rules), PLAN.md (stage plan), the classnest-ui skill (design system), the tester agent (pre-submission testing), and PROMPTS.md (every prompt in order).
- Design note: "The design is my own, as allowed by my trainer. All mockup screens and buttons are included."
- Folder structure (short), upload rules (only .zip, 10 MB, late flag), and Future ideas from IDEAS.md.

2. .env.example: make sure it has safe demo values only (for example ADMIN_EMAIL=admin@classnest.local and a demo ADMIN_PASSWORD like ClassNest@Demo1, plus every other variable the app needs). Never copy anything from my real .env.

3. PROMPTS.md: check every prompt is in order, numbered, has a short title and date, and every code block is closed. Don't change the prompt text itself. Remove any secret if one appears.

4. Tick step 14 in PLAN.md.

Add this prompt to PROMPTS.md.
```

## Prompt 32 - Bonus B1: move the database to Supabase Postgres (2026-11-03)

```
We are on the "bonus" branch. Bonus B1: move the database from SQLite to Supabase Postgres.
- Read DATABASE_URL from .env. Never print, log or commit it.
- Use the "pg" package. Change only the code in server/models/ and the database setup, so routes and pages keep working the same.
- Create the same 6 tables in Postgres, and make npm run seed and npm run seed:demo work with it.
- Keep zip uploads on local disk for now (Supabase Storage comes later).
- Add DATABASE_URL to .env.example with a fake placeholder value only.
- Do not change the design or any other feature.
- Test it yourself: start the server, log in as admin and as a demo student, and check that batches, lectures, assignments and submissions load. Then add this prompt to PROMPTS.md with the next number and today's date.
```
