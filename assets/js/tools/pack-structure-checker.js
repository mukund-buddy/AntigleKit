/* pack-structure-checker.js — drop a .zip/.mcpack/.mcaddon and verify the
   folder layout Bedrock expects, plus the embedded manifest.json.
   All local: no network. CSP-safe: DOM APIs + textContent.
   ZIP parsing: assets/js/validate/zip-parse.js (central-directory based);
   layout rules: assets/js/validate/pack-layout.js.
   Deflate support: DecompressionStream('deflate-raw') — Chrome 103+,
   Firefox 113+, Safari 16.4+. Stored (method 0) entries need no support. */
import { showToast } from '../components/tg-toast.js';
import { parseZip, readEntryData, findEntryCI, decodeName, MAX_DECOMPRESSED } from '../validate/zip-parse.js';
import { checkPackLayout, normalizePath } from '../validate/pack-layout.js';

const $ = (id) => document.getElementById(id);

const MAX_BYTES = 50 * 1024 * 1024;
const CONTAINER_EXTS = ['.zip', '.mcpack', '.mcaddon', '.mcworld'];

function supportsDeflate() {
  return typeof DecompressionStream !== 'undefined';
}

async function inflateFormat(bytes, format) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format));
  const reader = stream.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_DECOMPRESSED) {
      await reader.cancel();
      throw new Error('Decompressed data exceeds the ' + Math.round(MAX_DECOMPRESSED / 1048576) + ' MB safety cap — this archive looks like a decompression bomb.');
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  chunks.forEach(function (chunk) { out.set(chunk, offset); offset += chunk.byteLength; });
  return out;
}

async function inflateSmart(bytes) {
  if (!supportsDeflate()) throw new Error('unsupported');
  let lastErr = null;
  const formats = ['deflate-raw', 'deflate'];
  for (let i = 0; i < formats.length; i++) {
    try {
      return await inflateFormat(bytes, formats[i]);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('inflate failed');
}

function makeRow(issue) {
  const li = document.createElement('li');
  li.className = 'chk-item';

  const chip = document.createElement('span');
  const sev = issue.severity === 'error' ? 'error' : issue.severity === 'warning' ? 'warning' : 'info';
  chip.className = 'chk-badge chk-badge--' + sev;
  chip.textContent = sev === 'error' ? 'Error' : sev === 'warning' ? 'Warning' : 'Note';

  const text = document.createElement('span');
  text.className = 'chk-text';
  text.appendChild(document.createTextNode(issue.message));

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
  status.className = 'status-badge ' + (badge === 'live' ? 'status-badge--live' : badge === 'warn' ? 'status-badge--planned' : 'status-badge--planned');
}

function renderRoot(root) {
  const host = $('rootList');
  host.textContent = '';
  const max = 30;
  root.slice(0, max).forEach(function (item) {
    const li = document.createElement('li');
    li.className = 'pack-root-item';
    const code = document.createElement('code');
    code.textContent = item.dir ? item.name + '/' : item.name;
    const count = document.createElement('span');
    count.className = 'pack-root-count';
    count.textContent = item.count + (item.count === 1 ? ' entry' : ' entries');
    li.appendChild(code);
    li.appendChild(count);
    host.appendChild(li);
  });
  if (root.length > max) {
    const li = document.createElement('li');
    li.className = 'pack-root-item';
    const code = document.createElement('code');
    code.textContent = '…';
    const count = document.createElement('span');
    count.className = 'pack-root-count';
    count.textContent = '+' + (root.length - max) + ' more';
    li.appendChild(code);
    li.appendChild(count);
    host.appendChild(li);
  }
  $('rootTitle').hidden = root.length === 0;
}

function renderPackInfo(pack, zipStats) {
  const el = $('packInfo');
  el.textContent = '';
  if (!pack) {
    el.textContent = zipStats.fileCount + ' entries read — no manifest found.';
    return;
  }
  const bits = [];
  if (pack.name) bits.push(pack.name);
  if (pack.formatVersion != null) bits.push('format_version ' + pack.formatVersion);
  if (pack.moduleTypes.length) bits.push('modules: ' + pack.moduleTypes.join(', '));
  el.textContent = bits.length ? 'Pack — ' + bits.join(' · ') : 'Pack found — no identifying fields.';
}

function renderZipMeta(count, stored, deflated, other) {
  const el = $('zipMeta');
  el.textContent = count + ' entries (' + stored + ' stored · ' + deflated + ' deflated' + (other ? ' · ' + other + ' other' : '') + ').';
}

function renderIssues(issues, fileCount) {
  const list = $('issueList');
  list.textContent = '';
  issues.forEach(function (i) { list.appendChild(makeRow(i)); });

  const errors = issues.filter(function (i) { return i.severity === 'error'; }).length;
  const warnings = issues.filter(function (i) { return i.severity === 'warning'; }).length;
  const info = issues.length - errors - warnings;

  if (errors === 0 && warnings === 0) {
    setSummary('chk-summary--ok', 'Structure looks good — ' + fileCount + ' files checked, no issues found.');
    setStatus('live', 'Passed');
  } else {
    setSummary('chk-summary--error', errors + ' error' + (errors === 1 ? '' : 's') +
      (warnings ? ' · ' + warnings + ' warning' + (warnings === 1 ? '' : 's') : '') +
      (info ? ' · ' + info + ' note' + (info === 1 ? '' : 's') : '') + ' found.');
    setStatus(errors === 0 ? 'warn' : 'planned', errors === 0 ? 'Warnings' : 'Issues found');
  }
}

function render(result) {
  $('issueList').textContent = '';
  $('rootList').textContent = '';
  $('rootTitle').hidden = true;

  renderZipMeta(result.entryCount, result.stored, result.deflated, result.other);
  renderIssues(result.issues, result.fileCount);
  renderPackInfo(result.pack, result);
  renderRoot(result.root);
}

function countMethods(entries) {
  let stored = 0;
  let deflated = 0;
  let other = 0;
  entries.forEach(function (e) {
    if (e.method === 0) stored += 1;
    else if (e.method === 8) deflated += 1;
    else other += 1;
  });
  return { stored: stored, deflated: deflated, other: other };
}

async function checkFile(file) {
  setSummary('chk-summary--idle', 'Reading ' + file.name + '…');
  setStatus(null, '');

  let buffer;
  try {
    buffer = await file.arrayBuffer();
  } catch (e) {
    setSummary('chk-summary--error', 'Could not read that file.');
    return;
  }

  if (buffer.byteLength > MAX_BYTES) {
    setSummary('chk-summary--idle', 'Large archive (' + Math.round(buffer.byteLength / 1048576) + ' MB) — parsing may take a moment.');
  }

  const parsed = parseZip(buffer);
  if (!parsed.ok) {
    setSummary('chk-summary--error', parsed.error);
    setStatus(null, '');
    $('zipMeta').textContent = '';
    $('packInfo').textContent = '';
    return;
  }

  const metas = countMethods(parsed.entries);
  $('zipMeta').textContent = parsed.entries.length + ' entries (' + metas.stored + ' stored · ' + metas.deflated + ' deflated' + (metas.other ? ' · ' + metas.other + ' other' : '') + ').';

  const files = parsed.entries.filter(function (e) { return !e.isDir; });

  /* .mcaddon-style container: no root manifest, nested archives instead */
  const hasManifest = parsed.entries.some(function (e) {
    return normalizePath(e.name).toLowerCase() === 'manifest.json';
  });
  const hasNestedArchive = !hasManifest && files.some(function (e) {
    const n = normalizePath(e.name).toLowerCase();
    return CONTAINER_EXTS.some(function (ext) { return n.indexOf(ext) === n.length - ext.length; });
  });

  let manifestObj = null;
  let manifestReadError = null;

  if (hasManifest) {
    const hit = findEntryCI(parsed.entries, 'manifest.json');
    if (hit) {
      try {
        const data = await readEntryData(buffer, hit.entry, inflateSmart);
        const text = decodeName(data);
        try {
          manifestObj = JSON.parse(text);
        } catch (e) {
          manifestReadError = 'manifest.json is not valid JSON: ' + e.message;
        }
      } catch (e) {
        manifestReadError = 'Could not read manifest.json: ' + e.message;
      }
    }
  }

  const layout = checkPackLayout(parsed.entries, manifestObj);
  const issues = layout.issues.slice();

  if (manifestReadError) {
    issues.unshift({ severity: 'error', message: manifestReadError });
  }
  if (hasNestedArchive) {
    issues.unshift({ severity: 'info', message: 'No root manifest.json — this looks like an .mcaddon container holding other pack archives. Unpack it and check each pack separately.' });
  }

  render({
    issues: issues,
    pack: layout.pack,
    root: layout.root,
    fileCount: layout.fileCount,
    entryCount: layout.entryCount,
    stored: metas.stored,
    deflated: metas.deflated,
    other: metas.other
  });
}

function wire() {
  const input = $('fFile');
  const zone = $('dropZone');

  if (input && zone) {
    input.addEventListener('change', function () {
      const f = input.files && input.files[0];
      if (!f) return;
      checkFile(f);
      showToast('Checking ' + f.name);
      input.value = '';
    });

    ['dragenter', 'dragover'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.add('dropzone--over');
      });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.remove('dropzone--over');
      });
    });
    zone.addEventListener('drop', function (e) {
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!f) return;
      checkFile(f);
      showToast('Checking ' + f.name);
    });
  }
}

function init() {
  wire();
  const sum = $('chkSummary');
  if (sum) sum.firstChild.nodeValue = 'Drop a pack to see structure results.';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
