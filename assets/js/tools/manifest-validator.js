/* manifest-validator.js — paste/upload a manifest.json, validate against
   Bedrock rules (assets/js/validate/manifest-rules.js). All local: no network.
   CSP-safe: results rendered via DOM APIs + textContent. */
import { showToast } from '../components/tg-toast.js';
import { validateManifest } from '../validate/manifest-rules.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = {
  format_version: 2,
  header: {
    name: 'Sample Resource Pack',
    description: 'A valid resource pack manifest',
    uuid: '00000000-0000-4000-8000-000000000001',
    version: [1, 0, 0],
    min_engine_version: [1, 21, 0],
    pack_scope: 'any'
  },
  modules: [
    {
      description: 'Sample Resource Pack module',
      type: 'resources',
      uuid: '00000000-0000-4000-8000-000000000002',
      version: [1, 0, 0]
    }
  ],
  metadata: { authors: ['You'], license: 'MIT' }
};

const DEBOUNCE_MS = 250;

let debounceTimer = null;

function makeRow(issue) {
  const li = document.createElement('li');
  li.className = 'chk-item';

  const chip = document.createElement('span');
  chip.className = 'chk-badge chk-badge--' + issue.severity;
  chip.textContent = issue.severity === 'error' ? 'Error' : 'Warning';

  const text = document.createElement('span');
  text.className = 'chk-text';
  const pathEl = document.createElement('code');
  pathEl.textContent = issue.path;
  text.appendChild(pathEl);
  text.appendChild(document.createTextNode(' — ' + issue.message));

  li.appendChild(chip);
  li.appendChild(text);
  return li;
}

function setSummary(cls, msg) {
  const sum = $('chkSummary');
  sum.className = 'chk-summary ' + cls;
  sum.firstChild.nodeValue = msg;
}

function setStatus(badge, label) {
  const status = $('chkStatus');
  status.hidden = badge === null;
  status.textContent = label;
  status.className = 'status-badge ' + (badge === 'live' ? 'status-badge--live' : 'status-badge--planned');
}

function empty() {
  $('issueList').textContent = '';
  $('detected').textContent = '';
  setSummary('chk-summary--idle', 'Paste a manifest.json (or upload one) to see validation results.');
  setStatus(null, '');
}

function render() {
  const input = $('manifestInput');
  const raw = input.value.replace(/^\uFEFF/, '').trim();

  if (!raw) {
    empty();
    return;
  }

  let parsed;
  let parseError = null;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    parseError = e;
  }

  const list = $('issueList');
  list.textContent = '';

  if (parseError) {
    setSummary('chk-summary--error', 'That is not valid JSON.');
    setStatus(null, '');
    $('detected').textContent = '';
    return;
  }

  const result = validateManifest(parsed);
  const s = result.summary;

  const bits = [];
  if (s.formatVersion != null) bits.push('format_version ' + s.formatVersion);
  if (s.moduleTypes.length) bits.push('modules: ' + s.moduleTypes.join(', '));
  $('detected').textContent = bits.length ? 'Detected — ' + bits.join(' · ') : '';

  setSummary(
    result.valid ? 'chk-summary--ok' : 'chk-summary--error',
    result.valid
      ? 'Valid manifest — required fields, UUIDs, versions, and module rules all pass.'
      : result.errors + ' error' + (result.errors === 1 ? '' : 's') +
        (result.warnings ? ' and ' + result.warnings + ' warning' + (result.warnings === 1 ? '' : 's') : '') +
        ' found.'
  );
  setStatus(result.valid ? 'live' : 'planned', result.valid ? 'Valid' : 'Issues found');

  result.issues.forEach((issue) => list.appendChild(makeRow(issue)));
}

function wire() {
  const ta = $('manifestInput');
  const trigger = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(render, DEBOUNCE_MS);
  };
  ta.addEventListener('input', trigger);
  ta.addEventListener('paste', trigger);

  const file = $('fFile');
  if (file) {
    file.addEventListener('change', () => {
      const f = file.files && file.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        ta.value = String(reader.result || '');
        render();
        showToast('Loaded ' + f.name);
      };
      reader.onerror = () => showToast('Could not read that file');
      reader.readAsText(f);
      file.value = '';
    });
  }

  const sample = $('fSample');
  if (sample) {
    sample.addEventListener('click', () => {
      ta.value = JSON.stringify(SAMPLE, null, 2);
      render();
      showToast('Sample manifest loaded');
    });
  }
}

function init() {
  empty();
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
