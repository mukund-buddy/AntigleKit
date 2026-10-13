/* contrast-checker.js — WCAG 2.1 contrast ratio + AA/AAA verdicts.
   CSP-safe. */
import { contrastRatio, wcagLevel } from '../validate/design-tools.js';

const $ = (id) => document.getElementById(id);

function render() {
  const fg = $('fgColor').value;
  const bg = $('bgColor').value;
  const large = $('largeText').checked;

  const ratio = contrastRatio(bg, fg);

  const chip = $('ccChip');
  chip.style.backgroundColor = fg;
  chip.style.color = bg;
  chip.style.border = '1px solid rgba(128,128,128,0.4)';

  const out = $('ccOut');
  const det = $('ccDetected');

  if (ratio === null) {
    out.textContent = '';
    det.textContent = 'Enter two valid hex colors to compare.';
    return;
  }

  const r = Number(ratio.toFixed(2));
  const level = wcagLevel(ratio, large);
  const label = level === 'AAA' ? 'AAA (passes all sizes)' : level === 'AA' ? 'AA ' + (large ? '(large text)' : '(normal text)') : 'Fail — below ' + (large ? 'AA 3:1' : 'AA 4.5:1');

  out.textContent = r.toFixed(2) + ':1';
  det.className = 'chk-detected' + (level === 'FAIL' ? ' is-error' : level === 'AA' ? ' is-warn' : '');
  det.textContent = 'WCAG ' + label + ' — ' + fg.toUpperCase() + ' on ' + bg.toUpperCase();
}

function wire() {
  $('fgColor').addEventListener('input', render);
  $('bgColor').addEventListener('input', render);
  $('largeText').addEventListener('change', render);
  $('fSwap').addEventListener('click', function () {
    const f = $('fgColor').value;
    $('fgColor').value = $('bgColor').value;
    $('bgColor').value = f;
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