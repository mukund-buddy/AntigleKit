/* svg-optimizer.js — paste SVG, get a tightened version + size delta.
   CSP-safe every input is data (textContent). */
import { svgMinify } from '../validate/design-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = '<!-- my icon -->\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">\n  <path d="M12 2 L2 22 h20 Z"/>\n</svg>';

function render() {
  const raw = $('svgInput').value;
  const out = $('svgOut');
  const det = $('svgDetected');
  const err = $('inputError');
  err.hidden = true;
  err.textContent = '';

  if (!raw.trim()) {
    out.textContent = '';
    det.textContent = '';
    return;
  }

  const res = svgMinify(raw);
  if (!res.ok) {
    out.textContent = '';
    err.hidden = false;
    err.textContent = res.error;
    return;
  }

  out.textContent = res.out;
  det.className = 'chk-detected';
  const inKb = (new Blob([raw]).size / 1024).toFixed(1);
  const outKb = (new Blob([res.out]).size / 1024).toFixed(1);
  det.textContent = res.savedBytes > 0
    ? 'Shrunk by ' + res.savedBytes.toLocaleString('en-US') + ' bytes (' + inKb + ' KB → ' + outKb + ' KB).'
    : 'No size change — that icon is already clean.';
}

function wire() {
  $('svgInput').addEventListener('input', render);
  $('fSample').addEventListener('click', function () {
    $('svgInput').value = SAMPLE;
    render();
  });
  $('fClear').addEventListener('click', function () {
    $('svgInput').value = '';
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