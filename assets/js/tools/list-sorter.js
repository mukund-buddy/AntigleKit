/* list-sorter.js — sort/dedupe/reverse/shuffle lines. CSP-safe. */
import { sortList } from '../validate/file-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = ['banana', 'Apple', 'cherry', 'banana', '10', '2', '1', 'apple'].join('\n');

const state = {
  order: 'alpha',
  direction: 'asc',
  dedupe: false,
  dedupeMode: 'exact',
  reverse: false,
  shuffle: false
};

function render() {
  var input = $('lsInput').value;
  var out = $('lsOut');
  var status = $('lsStatus');

  if (!input.trim()) {
    out.textContent = '';
    status.textContent = '';
    return;
  }

  var res = sortList(input, state);
  if (res.ok) {
    out.textContent = res.lines.join('\n');
    status.className = 'chk-detected';
    var bits = ['out: ' + res.stats.output];
    if (res.stats.removed > 0) bits.push('removed: ' + res.stats.removed);
    status.textContent = bits.join(' · ');
  } else {
    out.textContent = '';
    status.className = 'chk-detected chk-error';
    status.textContent = res.error || 'Could not sort list.';
  }
}

function wire() {
  $('lsInput').addEventListener('input', render);

  $('lsOrder').addEventListener('change', function (e) {
    state.order = e.target.value;
    state.shuffle = false;
    $('lsShuffle').checked = false;
    render();
  });
  $('lsDirection').addEventListener('change', function (e) {
    state.direction = e.target.value;
    state.shuffle = false;
    $('lsShuffle').checked = false;
    render();
  });
  $('lsDedupe').addEventListener('change', function (e) {
    state.dedupe = e.target.checked;
    $('lsDedupeModeWrap').hidden = !e.target.checked;
    render();
  });
  $('lsDedupeMode').addEventListener('change', function (e) {
    state.dedupeMode = e.target.value;
    render();
  });
  $('lsReverse').addEventListener('change', function (e) {
    state.reverse = e.target.checked;
    state.shuffle = false;
    $('lsShuffle').checked = false;
    render();
  });
  $('lsShuffle').addEventListener('change', function (e) {
    state.shuffle = e.target.checked;
    render();
  });

  $('fSample').addEventListener('click', function () {
    $('lsInput').value = SAMPLE;
    render();
  });
  $('fClear').addEventListener('click', function () {
    $('lsInput').value = '';
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