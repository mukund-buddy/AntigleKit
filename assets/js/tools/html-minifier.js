/* html-minifier.js — comment/whitespace minification via tokenizer.
   CSP-safe: no inline handlers, output via textContent. */
import { minifyHtml } from '../validate/text-web-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = '<!DOCTYPE html>\n<!-- site header -->\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>  My Page  </title>\n  <style>  body { margin: 0; }  </style>\n</head>\n<body>\n  <h1>  Hello   world  </h1>\n  <pre>\n    keep    this   exact spacing\n  </pre>\n</body>\n</html>';

function byteSize(str) {
  try {
    return new Blob([str]).size;
  } catch (e) {
    return str.length;
  }
}

function render() {
  const raw = $('hmInput').value;
  const out = $('hmOut');
  const det = $('hmDetected');

  if (!raw.trim()) {
    out.textContent = '';
    det.textContent = '';
    return;
  }

  const minified = minifyHtml(raw, { removeComments: $('hmComments').checked });
  out.textContent = minified;

  const before = byteSize(raw);
  const after = byteSize(minified);
  const saved = before > 0 ? Math.round((1 - after / before) * 100) : 0;
  det.className = 'chk-detected';
  det.textContent = before.toLocaleString('en-US') + ' B → ' + after.toLocaleString('en-US') + ' B · saved ' + saved + '%';
}

function wire() {
  $('hmInput').addEventListener('input', render);
  $('hmComments').addEventListener('change', render);
  $('fSample').addEventListener('click', function () {
    $('hmInput').value = SAMPLE;
    render();
  });
  $('fClear').addEventListener('click', function () {
    $('hmInput').value = '';
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