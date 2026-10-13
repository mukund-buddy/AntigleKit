/* css-minifier.js — comment/whitespace minification with a safe lexer.
   CSP-safe: no inline handlers, output via textContent. */
import { minifyCss } from '../validate/text-web-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = '/* ===== buttons ===== */\n.btn {\n  color: #fff; /* text */\n  padding: 8px 12px;\n  border-radius: 4px;\n  background: url("data:image/png;base64,iVBORw0KGgo=");\n}\n\n@media (min-width: 700px) {\n  .btn { font-size: 14px; }\n}';

function byteSize(str) {
  try {
    return new Blob([str]).size;
  } catch (e) {
    return str.length;
  }
}

function render() {
  const raw = $('csInput').value;
  const out = $('csOut');
  const det = $('csDetected');

  if (!raw.trim()) {
    out.textContent = '';
    det.textContent = '';
    return;
  }

  const minified = minifyCss(raw, { removeLastSemicolon: $('csRemoveSemi').checked });
  out.textContent = minified;

  const before = byteSize(raw);
  const after = byteSize(minified);
  const saved = before > 0 ? Math.round((1 - after / before) * 100) : 0;
  det.className = 'chk-detected';
  det.textContent = before.toLocaleString('en-US') + ' B → ' + after.toLocaleString('en-US') + ' B · saved ' + saved + '%';
}

function wire() {
  $('csInput').addEventListener('input', render);
  $('csRemoveSemi').addEventListener('change', render);
  $('fSample').addEventListener('click', function () {
    $('csInput').value = SAMPLE;
    render();
  });
  $('fClear').addEventListener('click', function () {
    $('csInput').value = '';
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