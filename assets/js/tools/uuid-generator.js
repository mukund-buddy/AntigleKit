/* uuid-generator.js — batch v4 UUID generator with format options.
   Secure randomness: crypto.randomUUID() or getRandomValues fallback.
   All local: no network. CSP-safe: DOM APIs + textContent. */
import { showToast } from '../components/tg-toast.js';

const $ = (id) => document.getElementById(id);

function uuid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = Array.from(bytes, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
}

function clampCount(n) {
  const v = parseInt(n, 10);
  if (!Number.isFinite(v)) return 1;
  return Math.min(50, Math.max(1, v));
}

function currentOptions() {
  const countEl = $('uCount');
  const count = clampCount(countEl ? countEl.value : 1);

  let format = 'compact';
  document.querySelectorAll('input[name="uFormat"]').forEach(function (r) {
    if (r.checked) format = r.value;
  });

  let casing = 'lower';
  document.querySelectorAll('input[name="uCase"]').forEach(function (r) {
    if (r.checked) casing = r.value;
  });

  let braces = 'none';
  document.querySelectorAll('input[name="uBraces"]').forEach(function (r) {
    if (r.checked) braces = r.value;
  });

  return { count: count, format: format, casing: casing, braces: braces };
}

function renderUuid(raw) {
  let out = raw;
  if (currentOptions().format === 'compact') out = out.replace(/-/g, '');
  if (currentOptions().casing === 'upper') out = out.toUpperCase();
  if (currentOptions().braces === 'yes') out = '{' + out + '}';
  return out;
}

function render() {
  const opts = currentOptions();
  const out = $('uuidOut');
  const lines = [];
  for (let i = 0; i < opts.count; i++) lines.push(renderUuid(uuid()));
  out.textContent = lines.join('\n');
}

function wire() {
  const gen = $('uGenerate');
  if (gen) gen.addEventListener('click', function () { render(); showToast('UUIDs generated'); });

  const countEl = $('uCount');
  if (countEl) countEl.addEventListener('input', render);

  document.querySelectorAll('input[name="uFormat"], input[name="uCase"], input[name="uBraces"]').forEach(function (r) {
    r.addEventListener('change', render);
  });
}

function init() {
  wire();
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
