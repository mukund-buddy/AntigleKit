/* theme.js — theme toggle wiring: persist choice, sync icons/aria, and
   animate the swap. Pairs with theme-init.js (head) and app.css tokens. */
(function () {
  'use strict';

  var KEY = 'af-theme';
  var root = document.documentElement;
  var meta = document.getElementById('themeColorMeta');

  function current() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function syncButtons(theme) {
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      var light = theme === 'light';
      btn.setAttribute('aria-pressed', String(light));
      btn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
    });
  }

  function apply(theme, persist) {
    root.classList.add('theme-anim');
    root.setAttribute('data-theme', theme);
    if (meta) meta.setAttribute('content', theme === 'light' ? '#FFFFFF' : '#0C0C0E');
    syncButtons(theme);
    if (persist) {
      try { localStorage.setItem(KEY, theme); } catch (e) { /* ignore */ }
    }
    window.setTimeout(function () { root.classList.remove('theme-anim'); }, 420);
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.theme-toggle');
    if (!btn) return;
    apply(current() === 'light' ? 'dark' : 'light', true);
  });

  apply(current(), false);
})();
