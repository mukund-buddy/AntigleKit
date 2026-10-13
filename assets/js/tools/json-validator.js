/* json-validator.js — live JSON validation with line:column errors and
   a snippet of the offending line. CSP-safe. */
import { validateJson } from '../validate/json-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = '{\n  "name": "The Antigle",\n  "free": true,\n  "tools": [\n    "json-formatter",\n    "json-validator"\n  ]\n}';

function makeRow(severity, label, message) {
  const li = document.createElement('li');
  li.className = 'chk-item';
  const chip = document.createElement('span');
  chip.className = 'chk-badge chk-badge--' + severity;
  chip.textContent = label;
  const text = document.createElement('span');
  text.className = 'chk-text';
  text.textContent = message;
  li.appendChild(chip);
  li.appendChild(text);
  return li;
}

function lineSnippet(raw, lineNo) {
  const lines = raw.split('\n');
  const idx = Math.min(Math.max(lineNo - 1, 0), lines.length - 1);
  return (lines[idx] || '').trim() ? lines[idx] : lines[idx - 1] || lines[idx];
}

function render() {
  const input = $('jsonInput');
  const raw = input.value;
  const status = $('jsonStatus');
  const list = $('issueList');
  const errLine = $('errLine');
  const errLineLabel = $('errLineLabel');
  const errEl = $('inputError');
  list.textContent = '';
  errLine.hidden = true;
  errLineLabel.hidden = true;

  if (!raw.trim()) {
    status.className = 'chk-summary chk-summary--info';
    status.textContent = 'Paste JSON to start.';
    return;
  }

  const check = validateJson(raw);
  errEl.hidden = true;
  errEl.textContent = '';

  if (!check.ok) {
    status.className = 'chk-summary chk-summary--error';
    status.textContent = 'Invalid JSON — the document does not parse.';
    list.appendChild(makeRow('error', 'Parsing failed', (check.position >= 0)
      ? 'First problem at line ' + check.line + ', column ' + check.col + '.'
      : check.message));
    list.appendChild(makeRow('warning', 'Hint', 'Fix the spot above first — most unexpected-character errors are caused by the character before them, usually a missing comma or unescaped quote.'));
    if (check.position >= 0) {
      const snippet = lineSnippet(raw, check.line);
      if (snippet) {
        errLine.textContent = '  ' + snippet;
        errLine.hidden = false;
        errLineLabel.hidden = false;
      }
    }
    return;
  }

  status.className = 'chk-summary chk-summary--ok';
  status.textContent = 'Valid JSON — it parses cleanly.';

  let root;
  try { root = JSON.parse(raw); } catch (_) { root = null; }
  const isArr = Array.isArray(root);
  const kind = root === null ? 'null' : (isArr ? 'array' : typeof root);
  const detail = isArr
    ? 'array with ' + root.length + ' item' + (root.length === 1 ? '' : 's')
    : (kind === 'object' ? 'object with ' + Object.keys(root).length + ' top-level key' + (Object.keys(root).length === 1 ? '' : 's') : kind + ' value');
  list.appendChild(makeRow('ok', 'Parses', 'Top level is a ' + detail + '.'));
  list.appendChild(makeRow('info', 'Size', String(raw.length).toLocaleString('en-US') + ' characters, ' + String(new Blob([raw]).size).toLocaleString('en-US') + ' bytes, ' + raw.split('\n').length + ' lines.'));
}

function loadSample() {
  $('jsonInput').value = SAMPLE;
  render();
}

function wire() {
  $('jsonInput').addEventListener('input', render);
  $('fValidate').addEventListener('click', render);
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