/* mcq-generator.js — rule-based multiple-choice practice sheets from pasted
   notes or "Question? Answer" pairs. No AI. CSP-safe. */
import { mcqBuildSheet, mcqDetectedMode, mcqSheetLines, mcqAnswerKeyLines } from '../validate/student-planning-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = 'Water is pumped out of the cell by the vacuole.\n' +
  'The nucleus carries the genetic instructions of a plant cell.\n' +
  'Mitochondria release energy stored inside the food molecules.\n' +
  'Osmosis moves water through the membrane of the root hairs.\n' +
  'Enzymes speed up the rate of chemical reactions in the stomach.';

function render() {
  var raw = $('mcqInput').value;
  var limit = Number($('mcqCount').value || 8);
  var out = $('mcqOut');
  var det = $('mcqDetected');
  var errEl = $('mcqError');

  if (!raw.trim()) {
    out.textContent = '';
    det.textContent = '';
    errEl.hidden = true;
    return;
  }

  var questions = mcqBuildSheet(raw, limit);
  if (!questions.length) {
    errEl.textContent = 'No fillable questions found — write notes with real sentences (5+ words) or pairs ending in a "Question? Answer" style.';
    errEl.hidden = false;
    out.textContent = '';
    det.textContent = '';
    return;
  }

  errEl.hidden = true;
  var mode = mcqDetectedMode(raw);
  var lines = [];
  lines.push('MCQ practice sheet — ' + questions.length + ' questions');
  lines.push(mode === 'pairs' ? 'Made from your "Question? Answer" pairs.' : 'Made from your notes — rules only, no AI.');
  lines.push('');
  lines = lines.concat(mcqSheetLines(questions));
  lines.push('');
  lines.push('Answer key');
  lines = lines.concat(mcqAnswerKeyLines(questions));

  out.textContent = lines.join('\n');
  det.className = 'chk-detected';
  det.textContent = questions.length + ' questions · ' +
    (questions[0].options.length + ' options each') +
    ' · answer key included';
}

function wire() {
  $('mcqInput').addEventListener('input', render);
  $('mcqCount').addEventListener('change', render);
  $('fSample').addEventListener('click', function () {
    $('mcqInput').value = SAMPLE;
    render();
  });
  $('fClear').addEventListener('click', function () {
    $('mcqInput').value = '';
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