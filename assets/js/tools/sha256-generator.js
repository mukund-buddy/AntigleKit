/* sha256-generator.js — SHA-256 hashing for text & files.
   CSP-safe. Uses validate/security-tools.js for text, Web Crypto API for files. */
import { sha256 } from '../validate/security-tools.js';

const $ = (id) => document.getElementById(id);

async function hashFile(file) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function formatBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
  return (n / 1073741824).toFixed(2) + ' GB';
}

function setOutput(text, isError) {
  const out = shOutput;
  out.textContent = text;
  out.classList.toggle('is-error', !!isError);
}

function computeText() {
  const t0 = performance.now();
  const text = shInput.value;
  const res = sha256(text);
  const dt = (performance.now() - t0).toFixed(1);

  if (!res.ok) {
    setOutput('Error: ' + (res.error || 'invalid input'), true);
    shLen.textContent = '';
    shTime.textContent = '';
    return;
  }

  const hex = shUppercase.checked ? res.hex.toUpperCase() : res.hex;
  setOutput(hex, false);
  shLen.textContent = text.length + ' chars · ' + res.bytes.length + ' bytes';
  shTime.textContent = 'Computed in ' + dt + ' ms';
}

async function computeFile(file) {
  const t0 = performance.now();
  try {
    const hex = await hashFile(file);
    const dt = (performance.now() - t0).toFixed(1);
    setOutput(shUppercase.checked ? hex.toUpperCase() : hex, false);
    shLen.textContent = formatBytes(file.size);
    shTime.textContent = 'Hashed in ' + dt + ' ms';
  } catch (err) {
    setOutput('Error hashing file: ' + err.message, true);
    shLen.textContent = '';
    shTime.textContent = '';
  }
}

function switchMode(mode) {
  const isText = mode === 'text';
  shTextMode.hidden = !isText;
  shFileMode.hidden = isText;
  shModeText.classList.toggle('active', isText);
  shModeFile.classList.toggle('active', !isText);
}

function wire() {
  shModeText.addEventListener('click', function () { switchMode('text'); });
  shModeFile.addEventListener('click', function () { switchMode('file'); });
  shUppercase.addEventListener('change', function () {
    const out = shOutput;
    if (out.textContent && out.textContent !== '…' && !out.classList.contains('is-error')) {
      out.textContent = this.checked ? out.textContent.toUpperCase() : out.textContent.toLowerCase();
    }
  });
  shCompute.addEventListener('click', function () {
    if (!shFileMode.hidden && shFile.files[0]) {
      computeFile(shFile.files[0]);
    } else {
      computeText();
    }
  });
  shFile.addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
      shFileInfo.textContent = file.name + ' — ' + formatBytes(file.size);
      computeFile(file);
    } else {
      shFileInfo.textContent = '';
    }
  });
  shClear.addEventListener('click', function () {
    shOutput.textContent = '…';
    shOutput.classList.remove('is-error');
    shLen.textContent = '';
    shTime.textContent = '';
    shInput.value = '';
    shFileInfo.textContent = '';
    shFile.value = '';
  });
}

function init() {
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}