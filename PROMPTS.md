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
