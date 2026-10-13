/* pack-version-generator.js — bump a Bedrock pack version and check a whole
   manifest's versions for consistency. All local: no network.
   CSP-safe: DOM APIs + textContent. Logic: assets/js/validate/version-rules.js */
import { bumpVersion, analyzeVersions, formatVersion } from '../validate/version-rules.js';

const $ = (id) => document.getElementById(id);

const BUMP_KINDS = [
  ['patch', 'Patch — bug fixes and tweaks. Existing imports update cleanly.'],
  ['minor', 'Minor — new features and content.'],
  ['major', 'Major — breaking changes, new identities, or large rewrites.']
];

const SAMPLE_LINES = [
  'header = 1.0.0',
  'modules[0] (resources) = 1.0.0',
  'modules[1] (script) = 1.0.0',
  'min_engine: [1, 21, 0]'
].join('\n');

let debounceTimer = null;

/* ── Mode A: bump ───────────────────────────────────────────────── */
function readCurrentVersion() {
  const parts = ['major', 'minor', 'patch'].map(function (k) {
    const input = document.querySelector('#bumpVersion [data-part="' + k + '"]');
    const n = parseInt(input ? input.value : '', 10);
    return Number.isFinite(n) ? n : null;
  });
  return parts.some(function (p) { return p === null; }) ? null : parts;
}

function renderBump() {
  const kindSel = $('bumpKind');
  const kind = kindSel ? kindSel.value : 'patch';
  const out = $('bumpOut');
  const note = $('bumpNote');
  const hint = $('bumpHint');

  const current = readCurrentVersion();
  if (!current) {
    out.textContent = '—';
    hint.textContent = 'Enter the current [major, minor, patch] to get the next version.';
    note.hidden = true;
    return;
  }

  const guidance = BUMP_KINDS.find(function (k) { return k[0] === kind; });
  hint.textContent = guidance ? guidance[1] : '';

  const result = bumpVersion(current, kind);
  if (!result.ok) {
    out.textContent = '—';
    note.hidden = false;
    note.textContent = result.error;
    return;
  }

  note.hidden = true;
  out.textContent = formatVersion(result.version, false);
  const nextStr = formatVersion(result.version, true);

  const sanity = [];
  if (current[0] === 0 && current[1] === 0 && current[2] === 0) {
    sanity.push('All-zero versions are unusual — start new packs at 1.0.0.');
  }
  if (current[0] === 0) {
    sanity.push('Pre-1.0 versions are fine but many devices treat 0.x as unstable.');
  }
  if (current.every(function (n) { return n > 0; })) {
    sanity.push('Higher versions replace older imports — use this new version in header and every module.');
  }
  const sanityEl = $('bumpSanity');
  sanityEl.textContent = sanity.join(' ');
}

/* ── Mode B: consistency ────────────────────────────────────────── */
function makeRow(entry) {
  const li = document.createElement('li');
  li.className = 'chk-item';

  const chip = document.createElement('span');
  const sev = entry.error ? 'error' : 'info';
  chip.className = 'chk-badge chk-badge--' + sev;
  chip.textContent = entry.error ? 'Error' : 'Parsed';

  const text = document.createElement('span');
  text.className = 'chk-text';
  const code = document.createElement('code');
  code.textContent = entry.raw.trim();
  const msg = entry.error || ('parsed as ' + formatVersion(entry.version, true));
  const txt = document.createTextNode(' — ' + msg);
  text.appendChild(code);
  text.appendChild(txt);

  li.appendChild(chip);
  li.appendChild(text);
  return li;
}

function renderCheck() {
  const raw = $('checkInput').value;

  const list = $('checkList');
  const summary = $('checkSummary');
  const status = $('checkStatus');
  list.textContent = '';
  summary.textContent = '';
  status.hidden = true;

  if (!raw.trim()) {
    summary.textContent = 'Paste labeled versions, one per line (e.g. header = 1.0.0), to check consistency.';
    return;
  }

  const out = analyzeVersions(raw.split(/\r?\n/));

  out.results.forEach(function (r) { list.appendChild(makeRow(r)); });

  const errs = out.errors.length;
  const warns = out.warnings.length;
  const valid = errs === 0;

  const lines = [];
  if (valid && out.max) lines.push('Highest pack version: ' + formatVersion(out.max, true));
  if (warns) lines.push(warns + ' warning' + (warns === 1 ? '' : 's'));
  if (errs) lines.push(errs + ' error' + (errs === 1 ? '' : 's'));
  summary.textContent = lines.join(' · ') || 'All versions match.';

  if (errs === 0 && warns === 0) {
    status.hidden = false;
    status.textContent = 'Consistent';
    status.className = 'status-badge status-badge--live';
    summary.className = 'chk-summary chk-summary--ok';
  } else if (errs === 0) {
    status.hidden = false;
    status.textContent = 'Check warnings';
    status.className = 'status-badge status-badge--planned';
    summary.className = 'chk-summary chk-summary--idle';
  } else {
    status.hidden = false;
    status.textContent = 'Errors found';
    status.className = 'status-badge status-badge--planned';
    summary.className = 'chk-summary chk-summary--error';
  }

  const warnHost = $('checkWarnings');
  warnHost.textContent = '';
  out.warnings.forEach(function (w) {
    const li = document.createElement('li');
    li.className = 'chk-item';
    const chip = document.createElement('span');
    chip.className = 'chk-badge chk-badge--warning';
    chip.textContent = 'Warning';
    const text = document.createElement('span');
    text.className = 'chk-text';
    text.appendChild(document.createTextNode(w));
    li.appendChild(chip);
    li.appendChild(text);
    warnHost.appendChild(li);
  });
}

function wire() {
  const kind = $('bumpKind');
  if (kind) kind.addEventListener('change', renderBump);
  document.querySelectorAll('#bumpVersion [data-part]').forEach(function (inp) {
    inp.addEventListener('input', renderBump);
  });

  const check = $('checkInput');
  const trigger = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderCheck, 250);
  };
  check.addEventListener('input', trigger);
  check.addEventListener('paste', trigger);

  const sample = $('fSample');
  if (sample) {
    sample.addEventListener('click', () => {
      check.value = SAMPLE_LINES;
      renderCheck();
    });
  }
}

function init() {
  wire();
  const majors = document.querySelectorAll('#bumpVersion [data-part]');
  if (majors[0] && !majors[0].value) majors[0].value = '1';
  renderBump();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}