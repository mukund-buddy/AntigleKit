/* url-decoder.js — live percent-decoding with invalid-escape detection.
   CSP-safe. */
import { urlDecode } from '../validate/urls.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = 'caf%C3%A9%20%26%20friends%3F%20yes';
const BAD_ESCAPE_RE = /%(?![0-9A-Fa-f]{2})/;

function countEscapes(text) {
  return (text.match(/%[0-9A-Fa-f]{2}/g) || []).length;
}

function render() {
  const raw = $('urlInput').value;
  const out = $('decOutput');
  const detected = $('decDetected');
  const errEl = $('inputError');
  const trimmed = raw.trim();

  if (!trimmed) {
    out.textContent = '';
    detected.textContent = '';
    errEl.hidden = true;
    errEl.textContent = '';
    return;
  }

  const decoded = urlDecode(raw);
  out.textContent = decoded;

  if (BAD_ESCAPE_RE.test(raw)) {
    detected.className = 'chk-detected is-error';
    detected.textContent = 'Invalid percent-escape found — a % must be followed by two hex digits. The broken spot was left as-is.';
    errEl.hidden = true;
    errEl.textContent = '';
    return;
  }

  errEl.hidden = true;
  errEl.textContent = '';
  if (countEscapes(raw) === 0) {
    detected.className = 'chk-detected is-error';
    detected.textContent = 'No %-escapes found — this looks like plain text. Did you mean to encode it instead?';
  } else {
    detected.className = 'chk-detected';
    detected.textContent = 'Decoded ' + countEscapes(raw) + ' escape' + (countEscapes(raw) === 1 ? '' : 's') + ' — result is ' + decoded.length + ' characters of text.';
  }
}

function wire() {
  $('urlInput').addEventListener('input', render);
  $('fDecode').addEventListener('click', render);
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