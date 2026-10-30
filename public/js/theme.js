// Light/dark mode toggle.
// This file loads in <head> so the saved theme is set before the page appears (no flash of the wrong colours).

(function () {
  const KEY = 'classnest-theme';

  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.dataset.theme = saved;
    }
  } catch (e) {
    // localStorage can be blocked (e.g. private mode). Then we just follow the computer's setting.
  }

  // The theme in use right now: the one picked, or else the computer's setting
  function currentTheme() {
    return (
      document.documentElement.dataset.theme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    );
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      function updateLabel() {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        button.setAttribute('aria-label', 'Switch to ' + next + ' mode');
        button.title = 'Switch to ' + next + ' mode';
      }
      updateLabel();

      button.addEventListener('click', function () {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem(KEY, next);
        } catch (e) {}
        updateLabel();
      });
    });
  });
})();
