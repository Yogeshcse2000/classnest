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
