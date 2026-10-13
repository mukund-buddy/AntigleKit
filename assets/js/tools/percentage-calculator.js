/* percentage-calculator.js — four percentage modes with live results.
   CSP-safe, no inline styles. */
import {
  percentageOf, valueOfPercent, percentChange, percentDifference
} from '../validate/student-tools.js';

const $ = (id) => document.getElementById(id);

const MODES = {
  of: { a: 'Percent', b: 'Number', result: 'Value', example: ['15', '800'] },
  what: { a: 'Part (A)', b: 'Total (B)', result: 'Percent', example: ['45', '200'] },
  change: { a: 'Old value', b: 'New value', result: 'Change', example: ['100', '125'] },
  diff: { a: 'Value A', b: 'Value B', result: 'Difference', example: ['10', '20'] }
};

let mode = 'of';

function fmt(n) {
  var s = n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return s;
}

function render() {
  var a = $('pctA').value.trim();
  var b = $('pctB').value.trim();
  var out = $('pctOut');
  var det = $('pctDetected');
  var errEl = $('pctError');

  if (!a && !b) {
    out.textContent = '';
    det.textContent = '';
    errEl.hidden = true;
    return;
  }

  errEl.hidden = true;
  var lines = [];
  var val = null;

  if (mode === 'of') {
    val = valueOfPercent(a, b);
    if (val === null) {
      errEl.textContent = 'Enter a percentage and a number to take the percent of.';
      errEl.hidden = false;
      return;
    }
    lines.push(a + '% of ' + b + ' = ' + fmt(val));
    det.textContent = 'Percent of a number';
  } else if (mode === 'what') {
    val = percentageOf(a, b);
    if (val === null) {
      errEl.textContent = 'Enter a part and a total (total must not be zero).';
      errEl.hidden = false;
      return;
    }
    lines.push(a + ' is ' + fmt(val.percent) + '% of ' + b);
    det.textContent = 'Part ÷ total × 100';
  } else if (mode === 'change') {
    val = percentChange(a, b);
    if (val === null) {
      errEl.textContent = 'Enter an old value (nonzero) and a new value.';
      errEl.hidden = false;
      return;
    }
    lines.push(a + ' → ' + b + ' = ' + fmt(val) + '%');
    det.textContent = (val >= 0 ? 'Increase' : 'Decrease') + ' from the old value';
  } else {
    val = percentDifference(a, b);
    if (val === null) {
      errEl.textContent = 'Enter two values that are not both zero.';
      errEl.hidden = false;
      return;
    }
    lines.push('Difference between ' + a + ' and ' + b + ' = ' + fmt(val) + '%');
    det.textContent = 'Relative to the average of both values';
  }

  out.textContent = lines.join('\n');
}

function setMode(m) {
  mode = m;
  $('pctALabel').textContent = MODES[m].a;
  $('pctBLabel').textContent = MODES[m].b;
  var btns = document.querySelectorAll('[data-mode]');
  btns.forEach(function (btn) {
    if (btn.dataset.mode === m) {
      btn.classList.add('btn-gold');
      btn.classList.remove('btn-ghost');
    } else {
      btn.classList.remove('btn-gold');
      btn.classList.add('btn-ghost');
    }
  });
  render();
}

function wire() {
  document.querySelectorAll('[data-mode]').forEach(function (btn) {
    btn.addEventListener('click', function () { setMode(btn.dataset.mode); });
  });
  $('pctA').addEventListener('input', render);
  $('pctB').addEventListener('input', render);
  $('fCalculate').addEventListener('click', render);
  $('fSample').addEventListener('click', function () {
    $('pctA').value = MODES[mode].example[0];
    $('pctB').value = MODES[mode].example[1];
    render();
  });
}

function init() {
  setMode('of');
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}