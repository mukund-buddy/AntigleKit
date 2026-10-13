/* character-counter.js — live character counts + limit checks.
   CSP-safe. */
import { countChars, countWords, CHAR_LIMITS } from '../validate/student-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = 'A short bio that fits the 60-character limit—just barely!';

const LIMITS = [
  { label: 'SMS (160)', key: 'sms' },
  { label: 'Tweet (280)', key: 'tweet' },
  { label: 'Bio (60)', key: 'bio' },
  { label: 'Meta description (160)', key: 'meta' },
  { label: 'Title (100)', key: 'title' }
];

function render() {
  var raw = $('ccInput').value;
  var out = $('ccOut');
  var det = $('ccDetected');

  if (!raw.trim()) {
    out.textContent = '';
    det.textContent = '';
    return;
  }

  var withSpaces = countChars(raw, true);
  var withoutSpaces = countChars(raw, false);
  var lines = [];
  lines.push('Characters (with spaces):   ' + withSpaces.toLocaleString('en-US'));
  lines.push('Characters (no spaces):     ' + withoutSpaces.toLocaleString('en-US'));
  lines.push('Words (approx):             ' + countWords(raw).toLocaleString('en-US'));
  lines.push('');

  var ok = 0;
  var checkLines = [];
  LIMITS.forEach(function (l) {
    var limit = CHAR_LIMITS[l.key];
    var fits = withSpaces <= limit;
    if (fits) ok++;
    checkLines.push((fits ? '✓' : '✗') + ' ' + l.label + ': ' + withSpaces + '/' + limit);
  });
  lines = lines.concat(checkLines);

  out.textContent = lines.join('\n');
  det.className = 'chk-detected';
  det.textContent = ok === LIMITS.length
    ? 'Fits every checked limit.'
    : 'Fits ' + ok + ' of ' + LIMITS.length + ' limits — the ✗ ones are over.';
}

function wire() {
  $('ccInput').addEventListener('input', render);
  $('fSample').addEventListener('click', function () {
    $('ccInput').value = SAMPLE;
    render();
  });
  $('fClear').addEventListener('click', function () {
    $('ccInput').value = '';
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