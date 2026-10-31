// Login page: choosing Admin or Student, sending the form, and showing errors.

const ROLE_KEY = 'classnest-login-role';

// What the first field looks like for each role
const roleSettings = {
  admin: {
    name: 'Admin',
    label: 'Email',
    type: 'email',
    autocomplete: 'email',
    placeholder: 'you@example.com',
    hint: 'Admins sign in with their email address.',
  },
  student: {
    name: 'Student',
    label: 'Username',
    type: 'text',
    autocomplete: 'username',
    placeholder: 'e.g. priya.sharma',
    hint: 'Your username and password come from your admin.',
  },
};

const card = document.getElementById('login-card');
const form = document.getElementById('login-form');
const roleButtons = document.querySelectorAll('[data-role]');
const roleChip = document.getElementById('login-role');
const identifierLabel = document.getElementById('identifier-label');
const identifierInput = document.getElementById('identifier');
const passwordInput = document.getElementById('password');
const errorBox = document.getElementById('login-error');
const loginButton = document.getElementById('login-button');
const hint = document.getElementById('login-hint');

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
  identifierLabel.textContent = settings.label;
  identifierInput.type = settings.type;
  identifierInput.autocomplete = settings.autocomplete;
  identifierInput.placeholder = settings.placeholder;
  hint.textContent = settings.hint;
}

function setRole(newRole) {
  if (newRole === role) return;
  role = newRole;
  try {
    localStorage.setItem(ROLE_KEY, role);
  } catch (e) {}

  hideError();
  identifierInput.value = '';
  passwordInput.value = ''; // a password the browser filled in for the other role must not stay behind
  updateRoleButtons();
  applyRoleSettings();
}

roleButtons.forEach((button) => button.addEventListener('click', () => setRole(button.dataset.role)));

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

// ---------- Pasting login details ----------

// If someone pastes "Username: ... Password: ..." into either box, fill in both boxes for them
const LOGIN_DETAILS = /username:\s*(\S+)\s+(?:temporary\s+)?password:\s*(\S+)/i;

[identifierInput, passwordInput].forEach((input) => {
  input.addEventListener('paste', (event) => {
    const match = event.clipboardData.getData('text').match(LOGIN_DETAILS);
    if (!match) return;
    event.preventDefault();
    setRole('student');
    identifierInput.value = match[1];
    passwordInput.value = match[2];
    hideError();
  });
});

// ---------- Sending the form ----------

form.addEventListener('submit', async (event) => {
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
});

// ---------- Start ----------

updateRoleButtons();
applyRoleSettings();
