/* manifest-generator.js — Minecraft Bedrock manifest.json builder.
   Emits format_version 2 (integer version arrays) only, per ARCHITECTURE.md §2.1.
   All input is treated as data; output renders through tg-json-view (escaped).
   Preset truth lives in /assets/data/manifest-presets.json (curated). */
import { showToast } from '../components/tg-toast.js';

function siteAsset(p) {
  const css = Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"]'))
    .filter((l) => l.href && l.href.indexOf('/assets/') !== -1)[0];
  if (css && css.href) {
    return css.href.slice(0, css.href.indexOf('/assets/') + 1) + p;
  }
  return p;
}

const PRESETS_URL = siteAsset('assets/data/manifest-presets.json');

const $ = (id) => document.getElementById(id);

const state = {
  presets: null,
  packUuid: '',
  moduleUuids: []
};

/* ── UUID generation (secure; CSP-safe) ─────────────────────────── */
function uuid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
}

/* ── Input reading ──────────────────────────────────────────────── */
function readVersion(groupId) {
  const g = $(groupId);
  if (!g) return null;
  const parts = ['major', 'minor', 'patch'].map((k) => {
    const input = g.querySelector('[data-part="' + k + '"]');
    const n = parseInt(input ? input.value : '', 10);
    return Number.isFinite(n) ? n : null;
  });
  return parts.some((p) => p === null) ? null : parts;
}

function fieldValue(id) {
  const el = $(id);
  return el ? el.value.trim() : '';
}

function isChecked(id) {
  const el = $(id);
  if (!el) return false;
  if ('checked' in el) return el.checked;
  const cb = el.querySelector('input[type="checkbox"]');
  return !!cb && cb.checked;
}

/* ── Validation (mirrors official manifest rules) ───────────────── */
function validate() {
  const errors = [];

  const name = fieldValue('fName');
  if (!name) errors.push({ id: 'fName', message: 'Pack name is required.' });
  else if (name.length > 80) errors.push({ id: 'fName', message: 'Keep the name under 80 characters.' });

  const description = fieldValue('fDesc');
  if (!description) errors.push({ id: 'fDesc', message: 'A short description is required.' });
  else if (description.length > 120) errors.push({ id: 'fDesc', message: 'Minecraft recommends 1–2 lines — keep it under 120 characters.' });

  const version = readVersion('fVersion');
  if (!version || version.some((n) => n < 0 || n > 255)) {
    errors.push({ id: 'fVersion', message: 'Version must be three integers from 0 to 255 (e.g. 1 · 0 · 0).' });
  }

  const packType = fieldValue('fType');
  if (packType !== 'resources' && packType !== 'data' && packType !== 'world_template') {
    errors.push({ id: 'fType', message: 'Choose a pack type.' });
  }

  if (packType === 'resources' || packType === 'data') {
    const min = readVersion('fMinEngine');
    if (!min || min.some((n) => n < 0 || n > 255)) {
      errors.push({ id: 'fMinEngine', message: 'min_engine_version is required for resource and behavior packs.' });
    }
  }

  if (isChecked('fScript')) {
    const entry = fieldValue('fScriptEntry');
    if (!entry) errors.push({ id: 'fScriptEntry', message: 'Script modules need an entry file path (e.g. scripts/main.js).' });
    else if (!/^[\w./-]+\.js$/.test(entry)) errors.push({ id: 'fScriptEntry', message: 'Entry must be a relative .js path (e.g. scripts/main.js).' });

    const depVer = fieldValue('fServerVersion');
    if (!depVer) errors.push({ id: 'fServerVersion', message: 'Pick the @minecraft/server dependency version.' });
  }

  return errors;
}

/* ── Manifest assembly ──────────────────────────────────────────── */
function buildManifest() {
  const packType = fieldValue('fType');
  const version = readVersion('fVersion');
  const useMinEngine = packType === 'resources' || packType === 'data';
  const scriptOn = isChecked('fScript');

  const header = {
    name: fieldValue('fName'),
    description: fieldValue('fDesc'),
    uuid: state.packUuid,
    version: version
  };
  if (useMinEngine) header.min_engine_version = readVersion('fMinEngine');
  if (packType === 'resources') header.pack_scope = fieldValue('fScope') || 'any';

  const modules = [];
  modules.push({
    description: fieldValue('fModuleDesc') || fieldValue('fName') + ' module',
    type: packType,
    uuid: state.moduleUuids[0] || uuid(),
    version: version
  });
  if (scriptOn) {
    modules.push({
      description: 'Scripting module',
      type: 'script',
      uuid: state.moduleUuids[1] || uuid(),
      version: version,
      language: 'javascript',
      entry: fieldValue('fScriptEntry')
    });
  }
  state.moduleUuids = modules.map((m) => m.uuid);

  const manifest = { format_version: 2, header: header, modules: modules };

  if (scriptOn) {
    const depVer = fieldValue('fServerVersion');
    if (depVer) manifest.dependencies = [{ module_name: '@minecraft/server', version: depVer }];
  }

  const capabilities = [];
  if (scriptOn) capabilities.push('script_eval');
  document.querySelectorAll('#fCapabilities input:checked').forEach((cb) => {
    if (!capabilities.includes(cb.value)) capabilities.push(cb.value);
  });
  if (capabilities.length) manifest.capabilities = capabilities;

  const author = fieldValue('fAuthor');
  const license = fieldValue('fLicense');
  if (author || license) {
    const meta = {};
    if (author) meta.authors = [author];
    if (license) meta.license = license;
    manifest.metadata = meta;
  }

  return manifest;
}

/* ── Rendering ──────────────────────────────────────────────────── */
function render() {
  const errors = validate();
  const errorBox = $('fErrors');
  const jsonView = $('manifestOutput');

  document.querySelectorAll('[data-error-for]').forEach((el) => {
    el.hidden = true;
    el.textContent = '';
  });
  document.querySelectorAll('.input[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));

  if (errors.length) {
    errorBox.hidden = false;
    errorBox.textContent = errors.map((e) => e.message).join(' ');
    errorBox.setAttribute('role', 'alert');
    errors.forEach((e) => {
      const span = document.querySelector('[data-error-for="' + e.id + '"]');
      const input = $(e.id);
      if (span) {
        span.hidden = false;
        span.textContent = e.message;
      }
      if (input) input.setAttribute('aria-invalid', 'true');
    });
    return;
  }
  errorBox.hidden = true;

  const manifest = buildManifest();
  if (jsonView && 'setData' in jsonView) jsonView.setData(manifest);
}

/* ── Download as manifest.json ──────────────────────────────────── */
function download() {
  const jsonView = $('manifestOutput');
  if (!jsonView || !jsonView.textContent.trim()) return;
  const blob = new Blob([JSON.stringify(JSON.parse(jsonView.textContent), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'manifest.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  showToast('manifest.json downloaded');
}

/* ── Field visibility rules ─────────────────────────────────────── */
function applyVisibility() {
  const packType = fieldValue('fType');
  $('fMinEngineField').hidden = !(packType === 'resources' || packType === 'data');
  $('fScopeField').hidden = packType !== 'resources';
  const allowScript = packType === 'resources' || packType === 'data';
  $('fScriptField').hidden = !allowScript;
  const scriptOn = isChecked('fScript');
  $('fScriptPanel').hidden = !scriptOn;
  $('fServerPanel').hidden = !scriptOn;
}

/* ── Presets loading ────────────────────────────────────────────── */
function populatePresets(presets) {
  const typeSel = $('fType');
  (presets.packTypes || []).forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.value;
    opt.textContent = p.label;
    typeSel.appendChild(opt);
  });

  const scopeSel = $('fScope');
  [['any', 'Any — global or world'], ['world', 'World'], ['global', 'Global']].forEach(([v, l]) => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = l;
    scopeSel.appendChild(opt);
  });

  const srvSel = $('fServerVersion');
  (presets.scriptModules.serverModuleVersions || []).forEach((v) => {
    if (v.value === 'custom') return;
    const opt = document.createElement('option');
    opt.value = v.value;
    opt.textContent = v.label;
    srvSel.appendChild(opt);
  });

  const capsBox = $('fCapabilities');
  (presets.capabilities.items || []).forEach((c) => {
    const label = document.createElement('label');
    label.className = 'pill';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = c.value;
    cb.autocomplete = 'off';
    label.appendChild(cb);
    label.appendChild(document.createTextNode(' ' + c.label));
    capsBox.appendChild(label);
  });
}

/* ── Wiring ─────────────────────────────────────────────────────── */
function wire() {
  ['fName', 'fDesc', 'fModuleDesc', 'fAuthor', 'fLicense', 'fScriptEntry'].forEach((id) => {
    const el = $(id);
    if (el) el.addEventListener('input', render);
  });
  ['fType', 'fScope', 'fServerVersion'].forEach((id) => {
    const el = $(id);
    if (el) el.addEventListener('change', () => { applyVisibility(); render(); });
  });
  ['fVersion', 'fMinEngine'].forEach((gid) => {
    const g = $(gid);
    if (!g) return;
    g.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', render));
  });
  ['fScript', 'fCapabilities'].forEach((gid) => {
    const g = $(gid);
    if (!g) return;
    g.addEventListener('change', () => { applyVisibility(); render(); });
  });

  const dl = $('dlManifest');
  if (dl) dl.addEventListener('click', download);

  const form = $('manifestForm');
  if (form) form.addEventListener('submit', (e) => e.preventDefault());

  const newUuids = $('newUuids');
  if (newUuids) {
    newUuids.addEventListener('click', () => {
      state.packUuid = uuid();
      state.moduleUuids = [];
      render();
      showToast('New UUIDs generated');
    });
  }
}

/* ── Init ───────────────────────────────────────────────────────── */
async function init() {
  wire();
  state.packUuid = uuid();
  state.moduleUuids = [];

  /* Sensible defaults so the first render is a valid, useful sample */
  const defaults = { fName: 'My Resource Pack', fDesc: 'A resource pack for Minecraft Bedrock', fAuthor: '', fLicense: '' };
  Object.keys(defaults).forEach((id) => {
    const el = $(id);
    if (el && !el.value) el.value = defaults[id];
  });
  $('fVersion').querySelectorAll('input').forEach((inp, i) => {
    if (!inp.value) inp.value = i === 0 ? '1' : '0';
  });

  try {
    const res = await fetch(PRESETS_URL);
    state.presets = await res.json();
    populatePresets(state.presets);

    const min = $('fMinEngine');
    const preset = (state.presets.minEngineVersions || [])[0];
    if (min && preset) {
      const parts = ['major', 'minor', 'patch'];
      preset.value.forEach((v, i) => {
        min.querySelector('[data-part="' + parts[i] + '"]').value = v;
      });
    }
    const srv = $('fServerVersion');
    if (srv && state.presets.scriptModules.serverModuleVersions.length) {
      srv.value = state.presets.scriptModules.serverModuleVersions[0].value;
    }
  } catch (err) {
    console.error('The Antigle: failed to load presets', err);
    const errorBox = $('fErrors');
    if (errorBox) {
      errorBox.hidden = false;
      errorBox.textContent = 'Tool presets failed to load. Refresh the page to try again.';
    }
  }

  applyVisibility();
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}