/* url-encoder.js — live percent-encoding (encodeURIComponent semantics)
   with an already-encoded warning. CSP-safe. */
import { urlEncode, isEncoded } from '../validate/urls.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = 'café & friends? yes 🚀';

function render() {
  const raw = $('urlInput').value;
  const out = $('encOutput');
  const detected = $('encDetected');
  const errEl = $('inputError');
  const openBtn = $('fOpen');

  if (!raw.trim()) {
    out.textContent = '';
    detected.textContent = '';
    errEl.hidden = true;
    errEl.textContent = '';
    openBtn.hidden = true;
    return;
  }

  errEl.hidden = true;
  errEl.textContent = '';
  const encoded = urlEncode(raw);
  out.textContent = encoded;
  openBtn.href = 'https://example.com/search?q=' + encoded;
  openBtn.hidden = false;

  if (isEncoded(raw)) {
    detected.className = 'chk-detected is-error';
    detected.textContent = 'Heads up — your input already contains percent-escapes. Did you mean to decode it instead?';
  } else {
    detected.className = 'chk-detected';
    const escaped = (raw.match(/%[0-9A-Fa-f]{2}/g) || []).length;
    detected.textContent = (raw.length === encoded.length ? 'Nothing needed encoding.' : encoded.length - raw.length + ' characters of escapes added.') +
      (escaped ? ' (' + escaped + ' literal %-sequence' + (escaped === 1 ? '' : 's') + ' in the input.)' : '');
  }
}

function wire() {
  $('urlInput').addEventListener('input', render);
  $('fEncode').addEventListener('click', render);
  $('fSample').addEventListener('click', function () {
    $('urlInput').value = SAMPLE;
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