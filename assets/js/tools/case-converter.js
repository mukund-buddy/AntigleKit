/* case-converter.js — live text case converter with word/char counts.
   CSP-safe: no inline handlers, no innerHTML with user data. */
import { convertCase } from '../validate/text-web-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = 'learnOpenGL is a great free resource\nTIP: spaces, tabs and line breaks stay untouched';

const MODES = [
  { value: 'upper', label: 'UPPER' },
  { value: 'lower', label: 'lower' },
  { value: 'title', label: 'Title Case' },
  { value: 'sentence', label: 'Sentence case' },
  { value: 'camel', label: 'camelCase' },
  { value: 'pascal', label: 'PascalCase' },
  { value: 'snake', label: 'snake_case' },
  { value: 'kebab', label: 'kebab-case' },
  { value: 'toggle', label: 'tOGGLE cASE' }
];

const state = { mode: 'upper' };

function countWords(text) {
  var m = text.match(/\S+/g);
  return m ? m.length : 0;
}

function render() {
  var raw = $('ccInput').value;
  var out = $('ccOut');
  var det = $('ccDetected');

  if (!raw.trim()) {
    out.textContent = '';
    det.textContent = '';
    return;
  }

  var converted = convertCase(raw, state.mode);
  out.textContent = converted;

  var words = countWords(raw);
  var active = MODES.filter(function (m) { return m.value === state.mode; })[0].label;
  det.className = 'chk-detected';
  det.textContent = active + ' · ' + words + ' word' + (words === 1 ? '' : 's') +
    ' · ' + raw.length + ' characters · now ' + countWords(converted) + ' word' + (countWords(converted) === 1 ? '' : 's');
}

function wire() {
  $('ccInput').addEventListener('input', render);

  MODES.forEach(function (m) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-ghost btn-tight case-chip';
    btn.textContent = m.label;
    btn.setAttribute('data-case', m.value);
    if (m.value === state.mode) btn.classList.add('is-active');
    btn.setAttribute('aria-pressed', m.value === state.mode ? 'true' : 'false');
    btn.addEventListener('click', function () {
      state.mode = m.value;
      document.querySelectorAll('.case-chip').forEach(function (b) {
        var on = b.getAttribute('data-case') === state.mode;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (!$('ccInput').value.trim()) $('ccInput').value = SAMPLE;
      render();
    });
    $('ccModes').appendChild(btn);
  });

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