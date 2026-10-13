/* identifier-validator.js — validate a list of Bedrock identifiers against
   namespace/name character rules (assets/js/validate/identifier-rules.js).
   All local: no network. CSP-safe: DOM APIs + textContent. */
import { showToast } from '../components/tg-toast.js';
import { validateIdentifiers } from '../validate/identifier-rules.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = [
  'myaddon:hero_sword',
  'minecraft:diamond',
  '# quick reference sample',
  'myaddon:1bad_start',
  'BadNamespace:item',
  'myaddon:item.with.dots'
].join('\n');

const DEBOUNCE_MS = 250;

let debounceTimer = null;

function makeRow(entry) {
  const li = document.createElement('li');
  li.className = 'chk-item';

  const chip = document.createElement('span');
  chip.className = 'chk-badge chk-badge--' + (entry.severity === 'ok' ? 'ok' : entry.severity);
  chip.textContent = entry.severity === 'ok' ? 'Valid' : entry.severity === 'warning' ? 'Warning' : 'Error';

  const text = document.createElement('span');
  text.className = 'chk-text';
  const code = document.createElement('code');
  code.textContent = entry.raw;
  text.appendChild(code);
  text.appendChild(document.createTextNode(' — ' + entry.issues.map(function (i) { return i.message; }).join(' ')));

  li.appendChild(chip);
  li.appendChild(text);
  return li;
}

function render() {
  const raw = $('idInput').value;

  const list = $('issueList');
  const summary = $('idSummary');
  const status = $('chkStatus');
  list.textContent = '';
  summary.textContent = '';
  status.hidden = true;

  if (!raw.trim()) {
    summary.textContent = 'Paste one identifier per line to see validation results.';
    return;
  }

  const out = validateIdentifiers(raw);
  let ok = 0;
  let warn = 0;
  let err = 0;

  out.results.forEach(function (entry) {
    if (entry.severity === 'ok') ok += 1;
    else if (entry.severity === 'warning') warn += 1;
    else err += 1;
    list.appendChild(makeRow(entry));
  });

  summary.textContent = ok + ' valid' + (warn ? ' · ' + warn + ' warning' + (warn === 1 ? '' : 's') : '') +
    (err ? ' · ' + err + ' error' + (err === 1 ? '' : 's') : '') +
    (out.total === 0 ? 'No identifiers found.' : '');

  status.hidden = out.total === 0;
  status.textContent = out.valid ? 'All valid' : (err ? 'Errors found' : 'Check warnings');
  status.className = 'status-badge ' + (out.valid && err === 0 ? 'status-badge--live' : 'status-badge--planned');
}

function wire() {
  const ta = $('idInput');
  const trigger = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(render, DEBOUNCE_MS);
  };
  ta.addEventListener('input', trigger);
  ta.addEventListener('paste', trigger);

  const sample = $('fSample');
  if (sample) {
    sample.addEventListener('click', () => {
      ta.value = SAMPLE;
      showToast('Sample identifiers loaded');
      render();
    });
  }
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
