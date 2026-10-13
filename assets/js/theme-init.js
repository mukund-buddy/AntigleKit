/* theme-init.js — applies the saved theme before first paint (anti-flash).
   CSP-safe external script loaded synchronously in <head>. */
(function () {
  'use strict';
  var theme = 'dark';
  try {
    var saved = localStorage.getItem('af-theme');
    if (saved === 'light' || saved === 'dark') {
      theme = saved;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      theme = 'light';
    }
  } catch (e) { /* storage unavailable — stay dark */ }
  document.documentElement.setAttribute('data-theme', theme);
})();
