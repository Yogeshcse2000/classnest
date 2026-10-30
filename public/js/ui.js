// Small building blocks shared by the pages: safe text, dates, toasts and the confirm dialog.

// Makes text safe to put inside HTML, so a name like "<b>Priya</b>" shows as text instead of becoming HTML
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// "3 students", "1 batch", "2 batches"
function plural(count, word, pluralWord = `${word}s`) {
  return `${count} ${count === 1 ? word : pluralWord}`;
}

// "2026-11-03" -> "3 Nov 2026"
function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// A short message that pops up at the bottom of the screen and disappears by itself
function showToast(message, type = 'success') {
  let holder = document.querySelector('.toasts');
  if (!holder) {
    holder = document.createElement('div');
    holder.className = 'toasts';
    holder.setAttribute('aria-live', 'polite');
    document.body.appendChild(holder);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  holder.appendChild(toast);

  if (motionOK) gsap.from(toast, { opacity: 0, y: 12, duration: 0.3, ease: 'power3.out' });

  setTimeout(() => {
    if (motionOK) {
      gsap.to(toast, { opacity: 0, y: 8, duration: 0.25, ease: 'power2.in', onComplete: () => toast.remove() });
    } else {
      toast.remove();
    }
  }, 4000);
}

// Asks "Are you sure?" in a pop-up. Gives back true if the person confirmed.
function confirmDialog({ title, message, confirmText = 'Delete' }) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'dialog';
    dialog.innerHTML = `
      <form method="dialog">
        <h2>${escapeHtml(title)}</h2>
        <p class="muted">${escapeHtml(message)}</p>
        <div class="dialog-actions">
          <button class="btn btn-ghost" value="cancel">Cancel</button>
          <button class="btn btn-danger" value="confirm">${escapeHtml(confirmText)}</button>
        </div>
      </form>`;
    document.body.appendChild(dialog);

    // Closing happens through a button or the Esc key
    dialog.addEventListener('close', () => {
      resolve(dialog.returnValue === 'confirm');
      dialog.remove();
    });

    dialog.showModal();
    addHoverLift(dialog);
    if (motionOK) gsap.from(dialog, { opacity: 0, scale: 0.96, duration: 0.25, ease: 'power2.out' });
  });
}
