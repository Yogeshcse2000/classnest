// The date picker on every form, used instead of the browser's own. It always works in India time (IST).
// Add data-picker="date" or data-picker="datetime" to an input. The input stays in the page holding the plain value
// (2026-10-30 or 2026-10-30T19:30), so forms read it as usual, and sends the usual input and change events.
// People use the button beside it. After changing the value from code, call refreshPickers().

(function () {
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const VALUE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/;

  const CALENDAR_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`;
  const LEFT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>`;
  const RIGHT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>`;

  const pad = (number) => String(number).padStart(2, '0');
  const dayKey = ({ year, month, day }) => `${year}-${pad(month + 1)}-${pad(day)}`;
  const daysInMonth = (year, month) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstWeekday = (year, month) => new Date(Date.UTC(year, month, 1)).getUTCDay();

  // Today in India, whatever the computer is set to
  function todayInIndia() {
    const [year, month, day] = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).split('-').map(Number);
    return { year, month: month - 1, day };
  }

  function timeText(hours, minutes) {
    return `${hours % 12 || 12}:${pad(minutes)} ${hours < 12 ? 'AM' : 'PM'}`;
  }

  // Only one picker is open at a time
  let closeOpenPicker = null;

  function setupPicker(input) {
    const withTime = input.dataset.picker === 'datetime';
    const [defaultHours, defaultMinutes] = (input.dataset.defaultTime || '18:00').split(':').map(Number);
    const label = document.querySelector(`label[for="${input.id}"]`).firstChild.textContent.trim();
    const emptyText = withTime ? 'Pick a date and time' : 'Pick a date';

    const wrapper = document.createElement('div');
    wrapper.className = 'picker-field';
    input.replaceWith(wrapper);
    input.classList.add('picker-value');
    input.tabIndex = -1;
    input.setAttribute('aria-hidden', 'true');
    wrapper.innerHTML = `
      <button class="picker-button" type="button" aria-haspopup="dialog" aria-expanded="false">
        <span class="picker-text"></span>${CALENDAR_ICON}
      </button>
      <div class="picker" role="dialog" aria-label="${label}" hidden>
        <div class="picker-head">
          <button class="icon-btn" type="button" data-move="-1" aria-label="Previous month">${LEFT_ICON}</button>
          <strong aria-live="polite"></strong>
          <button class="icon-btn" type="button" data-move="1" aria-label="Next month">${RIGHT_ICON}</button>
        </div>
        <div class="picker-days"></div>
        ${
          withTime
            ? `<div class="picker-time">
                 <span class="picker-time-label">Time</span>
                 <input type="text" inputmode="numeric" maxlength="2" autocomplete="off" aria-label="Hour" data-part="hour">
                 <span aria-hidden="true">:</span>
                 <input type="text" inputmode="numeric" maxlength="2" autocomplete="off" aria-label="Minutes" data-part="minute">
                 <div class="picker-ampm">
                   <button type="button" data-half="AM">AM</button>
                   <button type="button" data-half="PM">PM</button>
                 </div>
                 <span class="picker-zone">IST</span>
               </div>`
            : ''
        }
        <div class="picker-foot">
          <button class="text-link" type="button" data-today>Today</button>
          <button class="btn btn-primary" type="button" data-done>Done</button>
        </div>
      </div>`;
    wrapper.prepend(input);

    const button = wrapper.querySelector('.picker-button');
    const text = wrapper.querySelector('.picker-text');
    const panel = wrapper.querySelector('.picker');
    const heading = panel.querySelector('strong');
    const grid = panel.querySelector('.picker-days');
    const hourInput = panel.querySelector('[data-part="hour"]');
    const minuteInput = panel.querySelector('[data-part="minute"]');

    if (input.hasAttribute('aria-describedby')) button.setAttribute('aria-describedby', input.getAttribute('aria-describedby'));

    let chosen = null; // the picked day, or null
    let hours = defaultHours;
    let minutes = defaultMinutes;
    let view = todayInIndia(); // which month is on show, and the day the keyboard is on

    // ---------- Reading and writing the input ----------

    function buttonText() {
      if (!chosen) return emptyText;
      const date = `${MONTHS[chosen.month].slice(0, 3)} ${chosen.day}, ${chosen.year}`;
      return withTime ? `${date}, ${timeText(hours, minutes)} IST` : date;
    }

    function showValue() {
      const words = buttonText();
      text.textContent = words;
      text.classList.toggle('is-empty', !chosen);
      button.setAttribute('aria-label', `${label}: ${words}`);
    }

    // Reads the input again. Used when the form is emptied or filled in from code.
    function refresh() {
      const match = input.value.match(VALUE_PATTERN);
      chosen = match ? { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) } : null;
      hours = match?.[4] ? Number(match[4]) : defaultHours;
      minutes = match?.[5] ? Number(match[5]) : defaultMinutes;
      view = chosen ? { ...chosen } : todayInIndia();
      showValue();
    }

    function save() {
      input.value = !chosen ? '' : withTime ? `${dayKey(chosen)}T${pad(hours)}:${pad(minutes)}` : dayKey(chosen);
      showValue();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // ---------- Drawing the calendar ----------

    function drawDays() {
      heading.textContent = `${MONTHS[view.month]} ${view.year}`;
      const today = dayKey(todayInIndia());
      const picked = chosen ? dayKey(chosen) : '';

      const cells = WEEKDAYS.map((name) => `<span class="picker-weekday" aria-hidden="true">${name}</span>`);
      for (let blank = 0; blank < firstWeekday(view.year, view.month); blank++) cells.push('<span></span>');
      for (let day = 1; day <= daysInMonth(view.year, view.month); day++) {
        const key = dayKey({ ...view, day });
        const label = `${day} ${MONTHS[view.month]} ${view.year}`;
        cells.push(
          `<button class="picker-day${key === today ? ' is-today' : ''}" type="button" data-day="${day}" aria-label="${label}"
                   aria-pressed="${key === picked}" tabindex="${day === view.day ? 0 : -1}">${day}</button>`
        );
      }
      grid.innerHTML = cells.join('');
    }

    function drawTime() {
      if (!withTime) return;
      hourInput.value = pad(hours % 12 || 12);
      minuteInput.value = pad(minutes);
      panel.querySelectorAll('[data-half]').forEach((half) => {
        half.setAttribute('aria-pressed', String((half.dataset.half === 'PM') === hours >= 12));
      });
    }

    // Moves by whole months and keeps the day inside the new month
    function moveMonth(step) {
      const target = new Date(Date.UTC(view.year, view.month + step, 1));
      const year = target.getUTCFullYear();
      const month = target.getUTCMonth();
      view = { year, month, day: Math.min(view.day, daysInMonth(year, month)) };
      drawDays();
    }

    function focusDay() {
      grid.querySelector(`[data-day="${view.day}"]`).focus();
    }

    // ---------- Opening and closing ----------

    function closePanel({ focusButton = false } = {}) {
      panel.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      closeOpenPicker = null;
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      if (focusButton) button.focus();
    }

    function closeOnOutsideClick(event) {
      if (!wrapper.contains(event.target)) closePanel();
    }

    // Opens below the button, or above it when there's no room below
    function openPanel() {
      closeOpenPicker?.();
      view = chosen ? { ...chosen } : todayInIndia();
      drawDays();
      drawTime();
      panel.hidden = false;
      button.setAttribute('aria-expanded', 'true');

      panel.classList.remove('picker-up');
      const box = button.getBoundingClientRect();
      const height = panel.offsetHeight;
      if (box.bottom + height + 16 > window.innerHeight && box.top > height + 16) panel.classList.add('picker-up');

      closeOpenPicker = closePanel;
      document.addEventListener('pointerdown', closeOnOutsideClick);
      panel.scrollIntoView({ block: 'nearest' });
      focusDay();
      if (motionOK) gsap.from(panel, { opacity: 0, y: -4, duration: 0.15, ease: 'power2.out', clearProps: 'all' });
    }

    // ---------- Using it ----------

    button.addEventListener('click', () => {
      if (panel.hidden) openPanel();
      else closePanel();
    });
    input.addEventListener('focus', () => button.focus()); // a label or a form error moves the cursor here

    panel.addEventListener('click', (event) => {
      const target = event.target.closest('button');
      if (!target) return;

      if (target.dataset.move) {
        moveMonth(Number(target.dataset.move));
      } else if (target.dataset.day) {
        view.day = Number(target.dataset.day);
        chosen = { ...view };
        save();
        drawDays();
        if (withTime) focusDay();
        else closePanel({ focusButton: true });
      } else if (target.dataset.half) {
        const pm = target.dataset.half === 'PM';
        if (pm !== hours >= 12) hours = (hours + 12) % 24;
        drawTime();
        if (chosen) save();
      } else if ('today' in target.dataset) {
        view = todayInIndia();
        drawDays();
        focusDay();
      } else if ('done' in target.dataset) {
        closePanel({ focusButton: true });
      }
    });

    // Arrow keys walk through the days, across months too
    grid.addEventListener('keydown', (event) => {
      const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
      if (!steps || !event.target.dataset.day) return;
      event.preventDefault();
      const next = new Date(Date.UTC(view.year, view.month, Number(event.target.dataset.day) + steps));
      view = { year: next.getUTCFullYear(), month: next.getUTCMonth(), day: next.getUTCDate() };
      drawDays();
      focusDay();
    });

    function readHour() {
      const hour = Number(hourInput.value);
      if (Number.isInteger(hour) && hour >= 1 && hour <= 12) hours = (hour % 12) + (hours >= 12 ? 12 : 0);
    }
    function readMinute() {
      const minute = Number(minuteInput.value);
      if (minuteInput.value !== '' && Number.isInteger(minute) && minute >= 0 && minute <= 59) minutes = minute;
    }

    panel.querySelectorAll('[data-part]').forEach((box) => {
      box.addEventListener('focus', () => box.select());
      box.addEventListener('change', () => {
        if (box === hourInput) readHour();
        else readMinute();
        drawTime(); // puts anything that wasn't a real time back to what it was
        if (chosen) save();
      });
    });

    panel.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && event.target.matches('[data-part]')) {
        event.preventDefault(); // Enter here would send the whole form
        event.target.blur();
        closePanel({ focusButton: true });
      } else if (event.key === 'Escape') {
        event.preventDefault(); // inside a pop-up, Esc should only close the picker
        event.stopPropagation();
        closePanel({ focusButton: true });
      }
    });

    // Tabbing out of the picker closes it
    wrapper.addEventListener('focusout', (event) => {
      if (!panel.hidden && event.relatedTarget && !wrapper.contains(event.relatedTarget)) closePanel();
    });

    input.form?.addEventListener('reset', () => setTimeout(refresh)); // the form empties just after this event
    input.refreshPicker = refresh;
    refresh();
  }

  document.querySelectorAll('[data-picker]').forEach(setupPicker);

  window.refreshPickers = function (root = document) {
    root.querySelectorAll('[data-picker]').forEach((input) => input.refreshPicker());
  };
})();
