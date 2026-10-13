/* random-number-generator.js — crypto-seeded random list + stats.
   CSP-safe: no inline handlers, output via textContent.
   rng is injectable for tests; the page uses window.crypto. */
import { randomNumbers } from '../validate/text-web-tools.js';

const $ = (id) => document.getElementById(id);

function cryptoRng() {
  const arr = new Uint32Array(1);
  return function () {
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      window.crypto.getRandomValues(arr);
      return arr[0] / 4294967296;
    }
    return Math.random();
  };
}

function intVal(id, fallback) {
  const v = parseInt($(id).value, 10);
  return isFinite(v) ? v : fallback;
}

function numVal(id, fallback) {
  const v = parseFloat($(id).value);
  return isFinite(v) ? v : fallback;
}

function currentDupMode() {
  const checked = document.querySelector('input[name="rnMode"]:checked');
  return checked && checked.value === 'unique';
}

function render() {
  const opts = {
    min: numVal('rnMin', 1),
    max: numVal('rnMax', 100),
    count: intVal('rnCount', 10),
    decimals: intVal('rnDecimals', 0),
    unique: currentDupMode(),
    sorted: $('rnSort').checked
  };

  const out = $('rnOut');
  const det = $('rnDetected');

  const result = randomNumbers(opts, cryptoRng());

  if (!result.list.length) {
    out.textContent = '';
    det.className = 'chk-detected is-error';
    det.textContent = 'No numbers generated — narrow the range or lower the count.';
    return;
  }

  const fmt = function (n) {
    return opts.decimals > 0 ? n.toFixed(Math.min(6, opts.decimals)) : n.toLocaleString('en-US');
  };
  out.textContent = result.list.map(fmt).join('\n');

  det.className = 'chk-detected';
  det.textContent = result.list.length + ' numbers · ' +
    fmt(result.stats.min) + ' – ' + fmt(result.stats.max) + ' · ' +
    'sum ' + fmt(result.stats.sum) + ' · avg ' + fmt(result.stats.avg) +
    (opts.unique ? ' · every value used once' : ' · duplicates allowed');
}

function wire() {
  ['rnMin', 'rnMax', 'rnCount', 'rnDecimals', 'rnSort'].forEach(function (id) {
    $(id).addEventListener('input', render);
  });
  document.querySelectorAll('input[name="rnMode"]').forEach(function (el) {
    el.addEventListener('change', render);
  });
  $('fGenerate').addEventListener('click', function () {
    render();
  });
  $('fSample').addEventListener('click', function () {
    $('rnMin').value = '1';
    $('rnMax').value = '49';
    $('rnCount').value = '6';
    $('rnDecimals').value = '0';
    $('rnSort').checked = true;
    document.querySelector('input[name="rnMode"][value="unique"]').checked = true;
    render();
  });
  $('fClear').addEventListener('click', function () {
    $('rnOut').textContent = '';
    $('rnDetected').textContent = '';
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