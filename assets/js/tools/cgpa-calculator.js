/* cgpa-calculator.js — credit-weighted CGPA from "grade credits" lines.
   CSP-safe. */
import { cgpaFromRows, cgpaFromText } from '../validate/student-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = '9 4\n8 3\n7 4\n10 2';

function fmt(n) {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function render() {
  var raw = $('cgpaInput').value;
  var rows = cgpaFromText(raw);
  var out = $('cgpaOut');
  var det = $('cgpaDetected');
  var errEl = $('cgpaError');

  if (!raw.trim()) {
    out.textContent = '';
    det.textContent = '';
    errEl.hidden = true;
    return;
  }

  var cgpa = cgpaFromRows(rows);
  var totalCredits = rows.reduce(function (s, r) { return s + r.credits; }, 0);

  if (cgpa === null || rows.length === 0) {
    errEl.textContent = 'Enter at least one valid "grade credits" pair (numbers only).';
    errEl.hidden = false;
    out.textContent = '';
    det.textContent = '';
    return;
  }

  errEl.hidden = true;
  var lines = [];
  lines.push('CGPA = ' + fmt(cgpa));
  lines.push(rows.length + ' subject' + (rows.length === 1 ? '' : 's') + ' · ' + fmt(totalCredits) + ' credits');
  out.textContent = lines.join('\n');
  det.className = 'chk-detected';
  det.textContent = 'Credit-weighted average — grade × credits, divided by total credits.';
}

function wire() {
  $('cgpaInput').addEventListener('input', render);
  $('fSample').addEventListener('click', function () {
    $('cgpaInput').value = SAMPLE;
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