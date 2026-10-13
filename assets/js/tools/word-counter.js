/* word-counter.js — live words/sentences/paragraphs + reading time.
   CSP-safe. */
import { countWords, countSentences, countParagraphs, readingTimeMinutes, SPEEDS } from '../validate/student-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = 'The quick brown fox jumps over the lazy dog.\n\n' +
  'Every word is counted as it appears, whether you type it or paste it. ' +
  'Sentences are separated by punctuation, paragraphs by blank lines, ' +
  'and the reading time estimate follows from the word count at an ' +
  'average pace of 200 words per minute.';

function fmtTime(n) {
  if (n === null) return '—';
  if (n < 1) return Math.round(n * 60) + ' sec';
  if (n < 60) return Math.round(n) + ' min';
  return Math.floor(n / 60) + ' h ' + Math.round(n % 60) + ' min';
}

function render() {
  var raw = $('wcInput').value;
  var out = $('wcOut');
  var det = $('wcDetected');

  if (!raw.trim()) {
    out.textContent = '';
    det.textContent = '';
    return;
  }

  var words = countWords(raw);
  var lines = [];
  lines.push('Words:        ' + words.toLocaleString('en-US'));
  lines.push('Characters:   ' + raw.length.toLocaleString('en-US'));
  lines.push('Sentences:    ' + countSentences(raw).toLocaleString('en-US'));
  lines.push('Paragraphs:   ' + countParagraphs(raw).toLocaleString('en-US'));
  lines.push('Read time:    ~' + fmtTime(readingTimeMinutes(words, SPEEDS.reading)));

  out.textContent = lines.join('\n');
  det.className = 'chk-detected';
  det.textContent = 'Everything counts as you type — no buttons, no uploads.';
}

function wire() {
  $('wcInput').addEventListener('input', render);
  $('fSample').addEventListener('click', function () {
    $('wcInput').value = SAMPLE;
    render();
  });
  $('fClear').addEventListener('click', function () {
    $('wcInput').value = '';
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