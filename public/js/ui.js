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

// "2026-11-03" -> "Nov 3, 2026"
function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Everything below shows India time, whatever the computer is set to.

// "2026-10-30T14:00:00.000Z" -> "2026-10-30", the day in India
function istDay(isoDate) {
  return new Date(isoDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

// "2026-10-30T14:00:00.000Z" -> "7:30 PM"
function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' });
}

// "2026-10-30T14:00:00.000Z" -> "Oct 30, 7:30 PM IST". The year is added when it isn't this year.
function formatDateTime(isoDate) {
  const options = { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' };
  if (istDay(isoDate).slice(0, 4) !== istDay(Date.now()).slice(0, 4)) options.year = 'numeric';
  return `${new Date(isoDate).toLocaleDateString('en-US', options)}, ${formatTime(isoDate)} IST`;
}

// How long ago something happened: "10 min ago", "1 h ago", "Yesterday", "2 days ago"
function timeAgo(isoDate, now) {
  const minutes = Math.max(0, Math.floor((new Date(now).getTime() - new Date(isoDate).getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const days = Math.round((new Date(istDay(now)).getTime() - new Date(istDay(isoDate)).getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return `${Math.floor(minutes / 60)} h ago`;
  if (days === 1) return 'Yesterday';
  return days < 30 ? `${days} days ago` : formatDateTime(isoDate);
}

// The small calendar block on a lecture row: OCT over 31, or TODAY over 29
function dateBlockHtml(isoDate, today) {
  const date = new Date(isoDate);
  const options = { timeZone: 'Asia/Kolkata' };
  const month = date.toLocaleDateString('en-US', { ...options, month: 'short' });
  const day = date.toLocaleDateString('en-US', { ...options, day: '2-digit' });
  return `<span class="date-block"><span>${istDay(isoDate) === today ? 'Today' : month}</span><strong>${day}</strong></span>`;
}

// 3000 -> "2 days 2 hours"
function durationText(minutes) {
  if (minutes < 1) return 'less than a minute';
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;

  const parts = [];
  if (days) parts.push(plural(days, 'day'));
  if (hours) parts.push(plural(hours, 'hour'));
  if (mins && !days) parts.push(`${mins} min`);
  return parts.join(' ');
}

// 3000 -> "2 days 2 hours left"
function timeLeftText(minutes) {
  return minutes < 1 ? 'Less than a minute left' : `${durationText(minutes)} left`;
}

// Every status in the app is a tag. style is calm, amber, peach, red or quiet.
function tagHtml(text, style) {
  return `<span class="tag tag-${style}">${text}</span>`;
}

// The tag with a pulsing dot
function liveTagHtml(text) {
  return `<span class="tag tag-amber"><span class="live-dot" aria-hidden="true"><i></i></span>${text}</span>`;
}

// 120 -> "2h", 45 -> "45m", 2880 -> "2d"
function shortDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  return minutes < 24 * 60 ? `${Math.floor(minutes / 60)}h` : `${Math.floor(minutes / (24 * 60))}d`;
}

// A student's work as the admin sees it. minutesLate adds how late it was, like "Late · 2h".
function submissionTagHtml(status, minutesLate = 0) {
  if (status === 'Submitted') return tagHtml('On time', 'calm');
  if (status === 'Late') return tagHtml(minutesLate ? `Late · ${shortDuration(minutesLate)}` : 'Late', 'peach');
  return tagHtml('Missing', 'red');
}

// An assignment as a student sees it: their work first, then the deadline
function assignmentTagHtml({ submission_status, deadline_status }) {
  if (submission_status === 'Submitted') return tagHtml('Submitted', 'calm');
  if (submission_status === 'Late') return tagHtml('Late', 'peach');
  return deadline_status === 'closed' ? tagHtml('Closed', 'quiet') : tagHtml('Pending', 'amber');
}

// Search results link to an item in a list, like /admin/batches#batch-3. The list is built after the page
// loads, so the browser can't jump there by itself. Bring the item into view and light it up for a moment.
function showLinkedItem() {
  const id = window.location.hash.slice(1);
  const item = /^(batch|student|lecture|assignment)-\d+$/.test(id) && document.getElementById(id);
  if (!item) return;

  item.scrollIntoView({ block: 'center', behavior: motionOK ? 'smooth' : 'auto' });

  const ring = document.createElement('span');
  ring.className = 'linked-ring';
  item.appendChild(ring);
  if (motionOK) {
    gsap
      .timeline({ onComplete: () => ring.remove() })
      .from(ring, { opacity: 0, duration: 0.3 })
      .to(ring, { opacity: 0, duration: 0.3 }, '+=1.2');
  } else {
    setTimeout(() => ring.remove(), 1800);
  }
}
window.addEventListener('hashchange', showLinkedItem);

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
    popIn(dialog);
  });
}
