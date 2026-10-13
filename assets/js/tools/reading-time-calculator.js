/* reading-time-calculator.js — word-count based reading time at three
   speeds. CSP-safe. */
import { countWords, readingTimeMinutes, SPEEDS } from '../validate/student-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = 'Paste Basics here and the word count comes from your text itself. ' +
  'Reading time is words divided by words-per-minute, so longer texts take ' +
  'longer, and you can switch between a slow careful pace, an average one, ' +
  'and a fast skimming pace to bracket the real time.';

function fmt(n) {
  if (n === null) return '—';
  if (n < 1) return Math.round(n * 60) + ' sec';
  if (n < 60) return Math.round(n) + ' min';
  return Math.floor(n / 60) + ' h ' + Math.round(n % 60) + ' min';
}

function render() {
  var raw = $('rtInput').value;
  var out = $('rtOut');
  var det = $('rtDetected');

  if (!raw.trim()) {
    out.textContent = '';
    det.textContent = '';
    return;
  }

  var words = countWords(raw);
  var lines = [];
  lines.push(words.toLocaleString('en-US') + ' words');
  lines.push('');
  lines.push('Slow    (' + SPEEDS.slow + ' wpm):  ' + fmt(readingTimeMinutes(words, SPEEDS.slow)));
  lines.push('Average (' + SPEEDS.reading + ' wpm): ' + fmt(readingTimeMinutes(words, SPEEDS.reading)));
  lines.push('Fast    (' + SPEEDS.fast + ' wpm):  ' + fmt(readingTimeMinutes(words, SPEEDS.fast)));

  out.textContent = lines.join('\n');
  det.className = 'chk-detected';
  det.textContent = 'Direct word count from your text — pick the speed that matches how you actually read.';
}

function wire() {
  $('rtInput').addEventListener('input', render);
  $('fSample').addEventListener('click', function () {
    $('rtInput').value = SAMPLE;
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