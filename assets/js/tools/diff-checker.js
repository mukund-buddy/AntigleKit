/* diff-checker.js — side-by-side text diff (word + line views). CSP-safe. */
import { diffWords, diffLines } from '../validate/file-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE_A = 'The quick brown fox jumps over the lazy dog.\nThis line stays the same everywhere.\nOne old line here.';
const SAMPLE_B = 'The quick blue fox leaps over the lazy dog.\nThis line stays the same everywhere.\nA brand new line replaces it.';

const state = { mode: 'words' };

function makeEl(tag, cls) {
  var el = document.createElement(tag);
  if (cls) el.className = cls;
  return el;
}

/* word mode: ops carry merged text; split into word/space chunks so only
   words get coloured and whitespace stays neutral. */
function renderWordOp(op, parent) {
  if (op.type === 'same') {
    parent.appendChild(document.createTextNode(op.text));
    return;
  }
  var cls = op.type === 'add' ? 'df-add' : 'df-del';
  op.text.split(/(\s+)/).forEach(function (chunk) {
    if (chunk === '') return;
    if (/^\s+$/.test(chunk)) {
      parent.appendChild(document.createTextNode(chunk));
    } else {
      var s = makeEl('span', cls);
      s.textContent = chunk;
      parent.appendChild(s);
    }
  });
}

function renderLineOp(op, parent) {
  var cls = op.type === 'same' ? 'df-same' : op.type === 'add' ? 'df-add' : 'df-del';
  var row = makeEl('div', 'df-row ' + cls);
  var mark = makeEl('span', 'df-sign');
  mark.textContent = op.type === 'same' ? ' ' : op.type === 'add' ? '+' : '−';
  row.appendChild(mark);
  var txt = makeEl('span', 'df-text');
  txt.textContent = op.line;
  row.appendChild(txt);
  parent.appendChild(row);
}

function render() {
  var a = $('dfA').value;
  var b = $('dfB').value;
  var out = $('dfOut');
  var status = $('dfStatus');

  out.textContent = '';
  if (!(a || b)) {
    status.textContent = '';
    return;
  }

  var res = state.mode === 'words' ? diffWords(a, b) : diffLines(a, b);
  if (state.mode === 'words') {
    var line = makeEl('div', 'df-row df-row--inline');
    res.ops.forEach(function (op) { renderWordOp(op, line); });
    out.appendChild(line);
    status.className = 'chk-detected';
    status.textContent = '+' + res.counts.add + ' added · −' + res.counts.del + ' removed · ' + res.counts.same + ' unchanged';
  } else {
    res.ops.forEach(function (op) { renderLineOp(op, out); });
    status.className = 'chk-detected';
    status.textContent = '+ ' + res.counts.add + ' lines · − ' + res.counts.del + ' lines · ' + res.counts.same + ' same';
  }
}

function wire() {
  $('dfA').addEventListener('input', render);
  $('dfB').addEventListener('input', render);

  document.querySelectorAll('.mode-chip').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.mode = btn.getAttribute('data-mode');
      document.querySelectorAll('.mode-chip').forEach(function (b) {
        var on = b.getAttribute('data-mode') === state.mode;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      render();
    });
  });

  $('fSwap').addEventListener('click', function () {
    var aa = $('dfA').value;
    $('dfA').value = $('dfB').value;
    $('dfB').value = aa;
    render();
  });
  $('fSample').addEventListener('click', function () {
    $('dfA').value = SAMPLE_A;
    $('dfB').value = SAMPLE_B;
    render();
  });
  $('fClear').addEventListener('click', function () {
    $('dfA').value = '';
    $('dfB').value = '';
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