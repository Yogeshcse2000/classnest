// Students page (admin): enroll a student, show their login details once, and list everyone.

setupLogout();
showCurrentUser();

const formCard = document.getElementById('student-form-card');
const form = document.getElementById('student-form');
const nameInput = document.getElementById('student-name');
const emailInput = document.getElementById('student-email');
const batchSelect = document.getElementById('student-batch');
const formError = document.getElementById('student-error');
const saveButton = document.getElementById('student-save');
const list = document.getElementById('student-list');
const countLabel = document.getElementById('student-count');

const credCard = document.getElementById('cred-card');
const credIntro = document.getElementById('cred-intro');
const credUsername = document.getElementById('cred-username');
const credPassword = document.getElementById('cred-password');
const copyButtons = document.querySelectorAll('[data-copy]');
const doneButton = document.getElementById('cred-done');

let students = [];

// ---------- Student list ----------

function studentRowHtml(student) {
  return `
    <li class="list-row">
      <span class="avatar" aria-hidden="true">${escapeHtml(student.name.charAt(0).toUpperCase())}</span>
      <div class="list-main">
        <strong>${escapeHtml(student.name)}</strong>
        <span>${escapeHtml(student.email || '')}</span>
      </div>
      <div class="list-meta">
        <span class="chip mono">${escapeHtml(student.username)}</span>
        <span class="chip chip-green">${escapeHtml(student.batch_name)}</span>
      </div>
    </li>`;
}

const BATCH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 8l9 5 9-5z"/><path d="m3 13 9 5 9-5"/></svg>`;
const STUDENT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c2 2 10 2 12 0v-5"/></svg>`;

const EMPTY_HTML = `
  <li class="empty-state">
    <div class="empty-icon" aria-hidden="true">${STUDENT_ICON}</div>
    <h2>No students yet</h2>
    <p>Enroll your first student with the form. Their login details will appear right here.</p>
  </li>`;

function render() {
  countLabel.textContent = students.length ? plural(students.length, 'student') : '';
  list.innerHTML = students.length ? students.map(studentRowHtml).join('') : EMPTY_HTML;
  list.removeAttribute('aria-busy');
}

// ---------- Batch dropdown ----------

function fillBatchSelect(batches) {
  if (batches.length === 0) {
    // No batches yet: replace the form with a friendly pointer to the Batches page
    formCard.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true">${BATCH_ICON}</div>
        <h2>Create a batch first</h2>
        <p>Every student belongs to a batch. Make one, then come back to enroll students.</p>
        <a class="btn btn-primary" href="/admin/batches">Go to Batches</a>
      </div>`;
    addHoverLift(formCard);
    return;
  }
  batchSelect.innerHTML =
    '<option value="">Choose a batch</option>' +
    batches.map((b) => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join('');
}

// ---------- Login details card (shown once) ----------

function showCredentials(student, credentials) {
  credIntro.textContent = `${student.name} is enrolled in ${student.batch_name}.`;
  credUsername.textContent = credentials.username;
  credPassword.textContent = credentials.password;
  credCard.hidden = false;

  if (!motionOK) return;
  // Success animation: the card pops in, the tick pops up, then the details slide in
  gsap
    .timeline()
    .fromTo(credCard, { opacity: 0, y: 16, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.5)' })
    .fromTo('#cred-card .success-check', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2)' }, '-=0.15')
    .from('#cred-card .cred-row, #cred-card .cred-note, #cred-card .cred-actions', { opacity: 0, y: 8, duration: 0.2, stagger: 0.04, clearProps: 'opacity,transform' }, '-=0.2');
}

// "Done" hides the card and wipes the password from the page for good
function hideCredentials() {
  const wipe = () => {
    credCard.hidden = true;
    credUsername.textContent = '';
    credPassword.textContent = '';
  };
  if (motionOK) {
    gsap.to(credCard, { opacity: 0, y: -8, duration: 0.25, ease: 'power2.in', onComplete: wipe });
  } else {
    wipe();
  }
}

// The plain text each copy button puts on the clipboard
function textToCopy(kind) {
  const username = credUsername.textContent;
  const password = credPassword.textContent;
  if (kind === 'username') return username;
  if (kind === 'password') return password;
  return `Username: ${username}\nPassword: ${password}`;
}

// A small "Copied!" label that pops up above the button, then fades away
function showCopied(button) {
  button.querySelector('.copied-pop')?.remove();

  const pop = document.createElement('span');
  pop.className = 'copied-pop';
  pop.textContent = 'Copied!';
  button.appendChild(pop);

  if (motionOK) {
    gsap.fromTo(button, { scale: 0.96 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
    gsap
      .timeline({ onComplete: () => pop.remove() })
      .fromTo(pop, { opacity: 0, y: 6, scale: 0.85 }, { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'back.out(2)' })
      .to(pop, { opacity: 0, y: -6, duration: 0.25, ease: 'power2.in' }, '+=0.9');
  } else {
    setTimeout(() => pop.remove(), 1200);
  }
}

copyButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(textToCopy(button.dataset.copy));
      showCopied(button);
    } catch (error) {
      showToast("Couldn't copy automatically. Please select the details and copy them by hand.", 'error');
    }
  });
});

doneButton.addEventListener('click', hideCredentials);

// ---------- Enrolling a student ----------

function showFormError(message) {
  formError.textContent = message;
  formError.hidden = false;
  if (motionOK) gsap.fromTo(formError, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.25 });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formError.hidden = true;

  if (!nameInput.value.trim()) return showFormError("Please enter the student's name.");
  if (!emailInput.value.trim()) return showFormError("Please enter the student's email.");
  if (!batchSelect.value) return showFormError('Please choose a batch.');

  saveButton.disabled = true;
  saveButton.textContent = 'Enrolling…';
  try {
    const { student, credentials } = await api('/api/admin/students', {
      method: 'POST',
      body: { name: nameInput.value, email: emailInput.value, batchId: Number(batchSelect.value) },
    });

    students.unshift(student);
    render();
    if (motionOK) gsap.from(list.firstElementChild, { opacity: 0, y: -8, duration: 0.3, ease: 'power2.out' });

    showCredentials(student, credentials);

    // Keep the chosen batch, so enrolling several students into one batch is quick
    nameInput.value = '';
    emailInput.value = '';
  } catch (error) {
    showFormError(error.message);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Enroll student';
  }
});

// ---------- Start ----------

enterAnimation('.welcome, .split > *');

Promise.all([loadPageData('/api/admin/batches'), loadPageData('/api/admin/students')])
  .then(([batchData, studentData]) => {
    fillBatchSelect(batchData.batches);
    students = studentData.students;
    render();
    enterAnimation('#student-list > *');
  })
  .catch((error) => {
    list.removeAttribute('aria-busy');
    list.innerHTML = `<li class="alert alert-error">${escapeHtml(error.message)}</li>`;
  });
