// Students page (admin): enroll a student, reset a password, show login details once, and list everyone.

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
const searchInput = document.getElementById('student-search');

const credCard = document.getElementById('cred-card');
const credTitle = document.getElementById('cred-title');
const credIntro = document.getElementById('cred-intro');
const credUsername = document.getElementById('cred-username');
const credPassword = document.getElementById('cred-password');
const copyButtons = document.querySelectorAll('[data-copy]');
const doneButton = document.getElementById('cred-done');

let students = [];

// ---------- Student list ----------

// <wbr> marks a spot where the browser may wrap, so a long email breaks at a dot or @, not inside a word
function wrapAtDots(value) {
  return escapeHtml(value).replace(/[.@]/g, '$&<wbr>');
}

function studentRowHtml(student) {
  return `
    <tr id="student-${student.id}">
      <td class="table-name">${escapeHtml(student.name)}</td>
      <td class="table-muted" data-label="Email">${wrapAtDots(student.email || '')}</td>
      <td data-label="Batch">${escapeHtml(student.batch_name)}</td>
      <td data-label="Username"><span class="mono table-username" title="${escapeHtml(student.username)}">${escapeHtml(student.username)}</span></td>
      <td class="table-action">
        <button class="btn btn-ghost" type="button" data-reset="${student.id}"
                aria-label="Reset password for ${escapeHtml(student.name)}">Reset password</button>
      </td>
    </tr>`;
}

const BATCH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 8l9 5 9-5z"/><path d="m3 13 9 5 9-5"/></svg>`;
const STUDENT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c2 2 10 2 12 0v-5"/></svg>`;

function messageRowHtml(title, text) {
  return `
    <tr class="table-message">
      <td colspan="5">
        <div class="empty-state">
          <div class="empty-icon" aria-hidden="true">${STUDENT_ICON}</div>
          <h2>${title}</h2>
          <p>${text}</p>
        </div>
      </td>
    </tr>`;
}

// Everything the table shows can be searched
function matchesSearch(student) {
  const words = searchInput.value.trim().toLowerCase();
  return [student.name, student.email, student.batch_name, student.username].some((value) => value?.toLowerCase().includes(words));
}

function render() {
  const visible = students.filter(matchesSearch);
  countLabel.textContent = visible.length === students.length ? `(${students.length})` : `(${visible.length} of ${students.length})`;

  if (!students.length) {
    list.innerHTML = messageRowHtml('No students yet', 'Enroll your first student with the form. Their login details will appear right here.');
  } else if (!visible.length) {
    list.innerHTML = messageRowHtml('No matching students', 'Try a different name, email, batch or username.');
  } else {
    list.innerHTML = visible.map(studentRowHtml).join('');
    addHoverLift(list);
  }
  list.removeAttribute('aria-busy');
}

searchInput.addEventListener('input', render);

// A search result can point at a row the search box is hiding, so show everyone again
window.addEventListener('hashchange', () => {
  if (document.getElementById(window.location.hash.slice(1))) return;
  searchInput.value = '';
  render();
  showLinkedItem();
});

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

function showCredentials(title, intro, credentials) {
  credTitle.textContent = title;
  credIntro.textContent = intro;
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
    searchInput.value = ''; // so the new student is on show
    render();
    if (motionOK) gsap.from(list.firstElementChild, { opacity: 0, y: -8, duration: 0.3, ease: 'power2.out' });

    showCredentials('Student enrolled!', `${student.name} is enrolled in ${student.batch_name}.`, credentials);

    // Keep the chosen batch, so enrolling several students into one batch is quick
    nameInput.value = '';
    emailInput.value = '';
  } catch (error) {
    showFormError(error.message);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Enroll & generate login';
  }
});

// ---------- Resetting a password ----------

list.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-reset]');
  if (!button) return;
  const student = students.find((s) => s.id === Number(button.dataset.reset));

  const confirmed = await confirmDialog({
    title: `Reset ${student.name}'s password?`,
    message: "Their old password stops working straight away and they are logged out. You'll get a new temporary password to give them.",
    confirmText: 'Reset password',
  });
  if (!confirmed) return;

  button.disabled = true;
  button.textContent = 'Resetting…';
  try {
    const { credentials } = await api(`/api/admin/students/${student.id}/reset-password`, { method: 'POST' });
    showCredentials('Password reset!', `${student.name}'s old password no longer works.`, credentials);
    credCard.scrollIntoView({ block: 'nearest', behavior: motionOK ? 'smooth' : 'auto' }); // the row may be far down the list
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Reset password';
  }
});

// ---------- Start ----------

enterAnimation('.split > *');

Promise.all([loadPageData('/api/admin/batches'), loadPageData('/api/admin/students')])
  .then(([batchData, studentData]) => {
    fillBatchSelect(batchData.batches);
    students = studentData.students;
    render();
    enterAnimation('#student-list'); // the list as one piece: row by row takes seconds on a long list
    showLinkedItem();
  })
  .catch((error) => {
    list.removeAttribute('aria-busy');
    list.innerHTML = `<tr class="table-message"><td colspan="5"><p class="alert alert-error">${escapeHtml(error.message)}</p></td></tr>`;
  });
