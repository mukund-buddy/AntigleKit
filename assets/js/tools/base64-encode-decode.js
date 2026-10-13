/* base64-encode-decode.js — dual-mode Base64 encode/decode, Unicode-safe
   via TextEncoder/TextDecoder. CSP-safe. */
import { encodeTextBase64, decodeTextBase64, looksLikeBase64 } from '../validate/base64-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE_TEXT = 'Hello, The Antigle! 你好 🚀';

const STATE = { mode: 'encode' };

function setMode(mode) {
  STATE.mode = mode;
  const encodeBtn = $('tabEncode');
  const decodeBtn = $('tabDecode');
  encodeBtn.classList.toggle('is-active', mode === 'encode');
  decodeBtn.classList.toggle('is-active', mode === 'decode');
  encodeBtn.setAttribute('aria-selected', mode === 'encode' ? 'true' : 'false');
  decodeBtn.setAttribute('aria-selected', mode === 'decode' ? 'true' : 'false');
  $('inputLabel').textContent = mode === 'encode' ? 'Text to encode' : 'Base64 to decode';
  $('inputHint').textContent = mode === 'encode'
    ? 'Converts live as you type — Unicode-safe.'
    : 'Paste Base64 text (padding optional) — decodes live.';
  $('b64Input').value = '';
  $('b64Output').textContent = '';
  $('b64Detected').textContent = '';
}

function render() {
  const raw = $('b64Input').value;
  const out = $('b64Output');
  const detected = $('b64Detected');
  const errEl = $('inputError');

  if (!raw.trim()) {
    out.textContent = '';
    detected.textContent = '';
    errEl.hidden = true;
    errEl.textContent = '';
    return;
  }

  errEl.hidden = true;
  errEl.textContent = '';

  if (STATE.mode === 'encode') {
    const encoded = encodeTextBase64(raw);
    out.textContent = encoded;
    detected.className = 'chk-detected';
    detected.textContent = encoded.length + ' characters of Base64 — ' + new Blob([raw]).size + ' input byte' + (new Blob([raw]).size === 1 ? '' : 's') + '.';
  } else {
    const clean = raw.trim();
    if (!looksLikeBase64(clean)) {
      out.textContent = '';
      detected.className = 'chk-detected is-error';
      detected.textContent = 'Not valid Base64 — expected only A–Z, a–z, 0–9, +, / and a length divisible by 4.';
      return;
    }
    const decoded = decodeTextBase64(clean);
    if (decoded === null) {
      out.textContent = '';
      detected.className = 'chk-detected is-error';
      detected.textContent = 'Decoded successfully, but the bytes are not valid UTF-8 text — this looks like binary data, not a text payload.';
      return;
    }
    out.textContent = decoded;
    detected.className = 'chk-detected';
    detected.textContent = 'Decoded ' + clean.length + ' characters of Base64 into ' + decoded.length + ' characters of text.';
  }
}

function wire() {
  $('tabEncode').addEventListener('click', function () { setMode('encode'); });
  $('tabDecode').addEventListener('click', function () { setMode('decode'); });
  $('b64Input').addEventListener('input', render);
  $('fGo').addEventListener('click', render);
  $('fSample').addEventListener('click', function () {
    $('b64Input').value = STATE.mode === 'encode' ? SAMPLE_TEXT : encodeTextBase64(SAMPLE_TEXT);
    render();
  });
  $('fSwap').addEventListener('click', function () {
    const current = $('b64Output').textContent;
    if (!current) return;
    const nextMode = STATE.mode === 'encode' ? 'decode' : 'encode';
    setMode(nextMode);
    $('b64Input').value = current;
    render();
  });
}

function init() {
  setMode('encode');
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}