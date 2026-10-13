/* slug-generator.js — live URL slug from any text (diacritics stripped,
   dashes joined). CSP-safe. */
import { slugify } from '../validate/urls.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = 'Café Déjà Vu — Launching 2026! 🚀';

function render() {
  const raw = $('slugInput').value;
  const out = $('slugOutput');
  const detected = $('slugDetected');
  const note = $('slugNote');
  const errEl = $('inputError');
  errEl.hidden = true;
  errEl.textContent = '';

  if (!raw.trim()) {
    out.textContent = '';
    detected.textContent = '';
    note.textContent = '';
    return;
  }

  const slug = slugify(raw);
  out.textContent = slug;

  const originalWords = raw.trim().split(/\s+/).length;
  const slugWords = slug ? slug.split('-').length : 0;
  const changed = raw.trim() !== slug;

  if (!slug) {
    detected.className = 'chk-detected is-error';
    detected.textContent = 'Nothing usable — no letters or digits survived.';
    note.textContent = '';
    return;
  }

  detected.className = 'chk-detected';
  detected.textContent = changed
    ? slugWords + ' word' + (slugWords === 1 ? '' : 's') + ' from ' + originalWords + ' — non-ASCII and punctuation stripped.'
    : 'Already a clean slug — no changes needed.';
  note.textContent = 'Final URL example: https://yourdomain.example/' + slug + '/';
}

function wire() {
  $('slugInput').addEventListener('input', render);
  $('fSlug').addEventListener('click', render);
  $('fSample').addEventListener('click', function () {
    $('slugInput').value = SAMPLE;
    render();
  });
}

function init() {
  render();
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}