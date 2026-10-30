// Login page: the Admin/Student toggle, sending the form, and showing errors.

const ROLE_KEY = 'classnest-login-role';

// What the first field looks like for each role
const roleSettings = {
  admin: {
    label: 'Email',
    type: 'email',
    autocomplete: 'email',
    placeholder: 'you@example.com',
    hint: 'Admins sign in with their email address.',
  },
  student: {
    label: 'Username',
    type: 'text',
    autocomplete: 'username',
    placeholder: 'e.g. priya.sharma',
    hint: 'Your username and password come from your admin.',
  },
};

const card = document.getElementById('login-card');
const form = document.getElementById('login-form');
const pill = document.getElementById('role-pill');
const roleButtons = document.querySelectorAll('[data-role]');
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

// ---------- Toggle ----------

function updateToggleButtons() {
  roleButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.role === role)));
}

// Slide the pill behind the active option: Admin is position 0, Student is position 1
function movePill(animate) {
  const position = role === 'admin' ? 0 : 1;
  if (animate && motionOK) {
    gsap.to(pill, { xPercent: position * 100, duration: 0.3, ease: 'power3.out' });
  } else if (window.gsap) {
    gsap.set(pill, { xPercent: position * 100 });
  } else {
    pill.style.transform = `translateX(${position * 100}%)`;
  }
}

function applyRoleSettings() {
  const settings = roleSettings[role];
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
  updateToggleButtons();
  movePill(true);

  // Fade the email/username field out, swap its text, and fade it back in (about 300ms)
  const changing = [identifierLabel, identifierInput, hint];
  if (motionOK) {
    gsap.killTweensOf(changing);
    gsap
      .timeline()
      .to(changing, { opacity: 0, y: -4, duration: 0.12, ease: 'power1.in' })
      .add(applyRoleSettings)
      .to(changing, { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' });
  } else {
    applyRoleSettings();
  }
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

updateToggleButtons();
applyRoleSettings();
movePill(false);

// Entry animation: the card rises in, then its parts follow one by one
if (motionOK) {
  gsap
    .timeline()
    .from(card, { opacity: 0, y: 24, scale: 0.98, duration: 0.45, ease: 'power3.out', clearProps: 'opacity,transform' })
    .from(
      card.querySelectorAll('.auth-head, .segmented, .field, #login-button, .auth-hint'),
      { opacity: 0, y: 10, duration: 0.3, stagger: 0.04, ease: 'power2.out', clearProps: 'opacity,transform' },
      '-=0.25'
    );
}
