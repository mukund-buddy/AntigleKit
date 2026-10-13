/* json-formatter.js — live pretty-print, validate, and minify with
   exact line:column error positions. CSP-safe (textContent only). */
import { formatJson, validateJson, parseErrorPosition } from '../validate/json-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = '{"name":"AntigleKit","tools":47,"free":true,"creator":null,"tags":["dev","creator","minecraft"],"links":{"github":"github.com/mukund-buddy/AntigleKit"}}';

const STATE = { mode: 'pretty' };

function fmt(n) {
  return n.toLocaleString('en-US') + ' B';
}

function render() {
  const input = $('jsonInput');
  const out = $('jsonOutput');
  const detected = $('jsonDetected');
  const sizeNote = $('sizeNote');
  const errEl = $('inputError');
  const raw = input.value;

  if (!raw.trim()) {
    out.textContent = '';
    detected.textContent = '';
    sizeNote.textContent = '';
    errEl.hidden = true;
    errEl.textContent = '';
    return;
  }

  const check = validateJson(raw);
  if (!check.ok) {
    out.textContent = raw;
    const detail = (check.position >= 0)
      ? 'Error at line ' + check.line + ', column ' + check.col + ' — ' + check.message
      : check.message;
    detected.className = 'chk-detected is-error';
    detected.textContent = 'Invalid JSON · ' + detail;
    detected.hidden = false;
    errEl.hidden = true;
    errEl.textContent = '';
    sizeNote.textContent = '';
    return;
  }

  const pretty = formatJson(raw, Number($('indentSel').value || 2));
  out.textContent = pretty === null ? formatJson(raw, 2) : pretty;
  if (STATE.mode === 'minify') {
    out.textContent = JSON.stringify(JSON.parse(raw));
  }

  const root = JSON.parse(raw);
  const type = Array.isArray(root) ? 'array' : (root === null ? 'null' : typeof root);
  const keys = (!Array.isArray(root) && root !== null && typeof root === 'object') ? Object.keys(root).length : 0;
  const minVersion = JSON.stringify(JSON.parse(raw));
  detected.className = 'chk-summary chk-summary--ok';
  detected.textContent = 'Valid JSON · a ' + type +
    (type === 'object' ? ' with ' + keys + ' top-level key' + (keys === 1 ? '' : 's') : '') +
    ' · formatted ' + fmt(out.textContent.length) + ' · minified ' + fmt(minVersion.length);
  detected.classList.remove('is-error');
  errEl.hidden = true;
  errEl.textContent = '';
  sizeNote.textContent = 'Everything ran locally — your JSON was never uploaded.';
}

function loadSample() {
  $('jsonInput').value = SAMPLE;
  STATE.mode = 'pretty';
  render();
}

function wire() {
  $('jsonInput').addEventListener('input', function () {
    STATE.mode = 'pretty';
    render();
  });
  $('indentSel').addEventListener('change', function () {
    if (STATE.mode === 'pretty') render();
  });
  $('fFormat').addEventListener('click', function () {
    STATE.mode = 'pretty';
    render();
  });
  $('fMinify').addEventListener('click', function () {
    STATE.mode = 'minify';
    render();
  });
  $('fSample').addEventListener('click', loadSample);
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