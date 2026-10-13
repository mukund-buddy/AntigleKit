/* lorem-ipsum-generator.js — placeholder text with count/format options.
   CSP-safe: creation via DOM APIs only, output via textContent. */
import { loremParagraphs } from '../validate/text-web-tools.js';

const $ = (id) => document.getElementById(id);

function intVal(id, fallback) {
  var v = parseInt($(id).value, 10);
  return isFinite(v) ? v : fallback;
}

function currentFormat() {
  const checked = document.querySelector('input[name="liFormat"]:checked');
  return checked ? checked.value : 'text';
}

function generate() {
  const opts = {
    paragraphs: Math.max(1, Math.min(20, intVal('liParagraphs', 3))),
    sentencesPer: Math.max(1, Math.min(10, intVal('liSentences', 3))),
    startClassic: $('liClassic').checked
  };
  const paras = loremParagraphs(opts, Math.random);
  const html = currentFormat() === 'html';

  const out = $('liOut');
  if (html) {
    out.textContent = paras.map(function (p) { return '<p>' + p + '</p>'; }).join('\n');
  } else {
    out.textContent = paras.join('\n\n');
  }

  const det = $('liDetected');
  const words = paras.join(' ').trim().split(/\s+/).filter(Boolean).length;
  det.className = 'chk-detected';
  det.textContent = paras.length + ' paragraphs · ' + opts.sentencesPer + ' sentences each · ~' +
    words + ' words · ' + currentFormat().toUpperCase() + ' output';
}

function wire() {
  ['liParagraphs', 'liSentences'].forEach(function (id) {
    $(id).addEventListener('input', generate);
  });
  $('liClassic').addEventListener('change', generate);
  document.querySelectorAll('input[name="liFormat"]').forEach(function (el) {
    el.addEventListener('change', generate);
  });
  $('fGenerate').addEventListener('click', generate);
  $('fSample').addEventListener('click', function () {
    $('liParagraphs').value = '3';
    $('liSentences').value = '3';
    $('liClassic').checked = true;
    generate();
  });
  $('fClear').addEventListener('click', function () {
    $('liOut').textContent = '';
    $('liDetected').textContent = '';
  });
}

function init() {
  generate();
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}