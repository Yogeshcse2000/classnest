// Login page: choosing Admin or Student, sending the form, and showing errors.

const ROLE_KEY = 'classnest-login-role';

// What the form looks like for each role
const roleSettings = {
  admin: {
    name: 'Admin',
    identifierId: 'admin-email',
    passwordId: 'admin-password',
    label: 'Email',
    type: 'email',
    autocomplete: 'email',
    placeholder: 'you@example.com',
    hint: 'Admins sign in with their email address.',
  },
  student: {
    name: 'Student',
    identifierId: 'student-username',
    passwordId: 'student-password',
    label: 'Username',
    type: 'text',
    autocomplete: 'username',
    placeholder: 'e.g. priya.sharma',
    hint: 'Your username and password come from your admin.',
  },
};

const card = document.getElementById('login-card');
const formSlot = document.getElementById('login-form-slot');
const roleButtons = document.querySelectorAll('[data-role]');
const roleChip = document.getElementById('login-role');
const hint = document.getElementById('login-hint');

// Only the active role's form is in the page. Until a role is chosen there is no form at all,
// so the browser has nothing to fill in.
let identifierInput = null;
let passwordInput = null;
let errorBox = null;
let loginButton = null;

// Start with the role picked last time (Student if none)
let role = 'student';
try {
  const saved = localStorage.getItem(ROLE_KEY);
  if (roleSettings[saved]) role = saved;
} catch (e) {}

// ---------- Choosing a role ----------

function updateRoleButtons() {
  roleButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.role === role)));
}

function applyRoleSettings() {
  const settings = roleSettings[role];
  roleChip.textContent = settings.name;
  hint.textContent = settings.hint;
}

// Build a fresh, empty form for the current role. It replaces any form that was there.
function showForm() {
  const settings = roleSettings[role];
  formSlot.innerHTML = `
    <form id="${role}-form" novalidate>
      <div class="field">
        <label for="${settings.identifierId}">${settings.label}</label>
        <input id="${settings.identifierId}" name="${settings.identifierId}" type="${settings.type}"
               autocomplete="${settings.autocomplete}" placeholder="${settings.placeholder}" required>
      </div>
      <div class="field">
        <label for="${settings.passwordId}">Password</label>
        <input id="${settings.passwordId}" name="${settings.passwordId}" type="password"
               autocomplete="current-password" placeholder="Your password" required>
      </div>

      <p class="alert alert-error" id="login-error" role="alert" hidden></p>

      <button class="btn btn-primary btn-block" type="submit" id="login-button">Sign in</button>
    </form>`;

  identifierInput = document.getElementById(settings.identifierId);
  passwordInput = document.getElementById(settings.passwordId);
  errorBox = document.getElementById('login-error');
  loginButton = document.getElementById('login-button');

  formSlot.querySelector('form').addEventListener('submit', sendForm);
  [identifierInput, passwordInput].forEach((input) => input.addEventListener('paste', pasteLoginDetails));
  addHoverLift(formSlot);
}

function clearForm() {
  hideError();
  identifierInput.value = '';
  passwordInput.value = '';
}

// Take the form out of the page completely
function removeForm() {
  formSlot.replaceChildren();
}

function setRole(newRole) {
  role = newRole;
  try {
    localStorage.setItem(ROLE_KEY, role);
  } catch (e) {}

  updateRoleButtons();
  applyRoleSettings();
  showForm();
}

// ---------- Browser autofill ----------

// Browsers save logins per website, not per form, so separate names and ids don't stop Chrome filling the
// admin's details into the student form. So style.css keeps anything the browser fills invisible, and starts a
// tiny animation that tells us it happened. Details for this role are then shown, and any others are wiped.
// Admins sign in with an email, and student usernames never contain an @.
formSlot.addEventListener('animationstart', (event) => {
  if (event.animationName !== 'browser-filled') return;
  const identifier = identifierInput.value.trim();
  if (identifier && identifier.includes('@') === (role === 'admin')) {
    event.target.form.classList.add('fill-checked');
  } else {
    clearForm();
  }
});

// ---------- Errors ----------

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  if (motionOK) {
    gsap.fromTo(errorBox, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
    gsap.fromTo(card, { x: 0 }, { keyframes: { x: [0, -6, 6, -3, 3, 0] }, duration: 0.35, ease: 'power1.out' });
  }
}

function hideError() {
  errorBox.hidden = true;
  errorBox.textContent = '';
}

// Shows what a failed sign-in looks like. Nothing is sent to the server.
document.getElementById('preview-error').addEventListener('click', () => {
  showError(`Wrong ${roleSettings[role].label.toLowerCase()} or password. Please try again.`);
});

// ---------- Pasting login details ----------

// If someone pastes "Username: ... Password: ..." into either box, fill in both boxes for them
const LOGIN_DETAILS = /username:\s*(\S+)\s+(?:temporary\s+)?password:\s*(\S+)/i;

function pasteLoginDetails(event) {
  const match = event.clipboardData.getData('text').match(LOGIN_DETAILS);
  if (!match) return;
  event.preventDefault();
  if (role !== 'student') setRole('student');
  identifierInput.value = match[1];
  passwordInput.value = match[2];
  hideError();
  loginButton.focus(); // the form may be a new one, so keep the keyboard somewhere useful
}

// ---------- Sending the form ----------

async function sendForm(event) {
  event.preventDefault(); // stop the browser from reloading the page
  hideError();

  const identifier = identifierInput.value.trim();
  const password = passwordInput.value;
  if (!identifier || !password) {
    showError(`Please enter your ${roleSettings[role].label.toLowerCase()} and password.`);
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = 'Signing in…';

  try {
    const data = await api('/api/auth/login', { method: 'POST', body: { role, identifier, password } });
    // Success: fade the card away, then open the right dashboard
    if (motionOK) {
      gsap.to(card, { opacity: 0, y: -12, duration: 0.25, ease: 'power2.in', onComplete: () => (window.location.href = data.redirect) });
    } else {
      window.location.href = data.redirect;
    }
  } catch (error) {
    showError(error.message);
    passwordInput.value = '';
    passwordInput.focus();
    loginButton.disabled = false;
    loginButton.textContent = 'Sign in';
  }
}

// ---------- Start ----------

updateRoleButtons();
applyRoleSettings();
