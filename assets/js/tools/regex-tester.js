/* regex-tester.js — live regex testing with in-context highlighting and
   a match/groups table. CSP-safe (DOM building only). */
import { compileRegex, testRegex } from '../validate/regex-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE_PATTERN = '(\\w+)@(\\w+\\.\\w+)';
const SAMPLE_TEXT = 'Contact support@theantigle.com or hello@example.org\nEmail support@antiglekit.dev for questions.';

function flags() {
  let f = '';
  if ($('rxG').checked) f += 'g';
  if ($('rxI').checked) f += 'i';
  if ($('rxM').checked) f += 'm';
  return f;
}

function buildHighlight(text, pattern, fl) {
  const box = $('rgArea');
  box.textContent = '';
  const compiled = compileRegex(pattern, fl + (fl.indexOf('g') === -1 ? 'g' : ''));
  if (!compiled.ok || !text) {
    box.textContent = text;
    return;
  }
  const re = compiled.re;
  re.lastIndex = 0;
  let m;
  const frag = document.createDocumentFragment();
  let last = 0;
  let guard = 0;
  let first = true;
  while ((m = re.exec(text)) !== null) {
    if (guard++ > 2000) break;
    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
    const mark = document.createElement('mark');
    mark.className = 'mark-match' + (first ? ' mark-match--first' : '');
    mark.textContent = m[0];
    frag.appendChild(mark);
    first = false;
    last = m.index + m[0].length;
    if (m[0] === '') re.lastIndex++;
  }
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  box.appendChild(frag);
}

function render() {
  const pattern = $('rxPattern').value;
  const text = $('rxText').value;
  const errEl = $('patternError');
  const fl = flags();

  if (!pattern.trim()) {
    errEl.hidden = true;
    errEl.textContent = '';
    $('rgHits').textContent = 'Type a pattern to start.';
    buildHighlight(text, '', '');
    clearTable();
    return;
  }

  const result = testRegex(pattern, fl, text);
  if (!result.ok) {
    errEl.hidden = false;
    errEl.textContent = result.error;
    $('rgHits').textContent = 'Pattern error — fix it to see matches.';
    buildHighlight(text, '', '');
    clearTable();
    return;
  }

  errEl.hidden = true;
  errEl.textContent = '';
  const shown = result.matchCount;
  const capped = shown >= 1000;
  $('rgHits').textContent = (result.matchCount === 0
    ? 'No matches.'
    : result.matchCount + ' match' + (result.matchCount === 1 ? '' : 'es') + (fl.indexOf('g') === -1 && result.matchCount === 1 ? ' (no g flag — only the first is reported)' : '') + (capped ? ' (capped at 1000)' : '') + '.');
  buildHighlight(text, pattern, fl);
  fillTable(result.matches);
}

function clearTable() {
  $('rgTbody').textContent = '';
  $('rgTableWrap').hidden = true;
}

function fillTable(matches) {
  const tbody = $('rgTbody');
  tbody.textContent = '';
  if (!matches.length) {
    $('rgTableWrap').hidden = true;
    return;
  }
  matches.forEach(function (match, i) {
    const tr = document.createElement('tr');
    const cells = [String(i + 1), String(match.index), match.full, match.groups.length ? match.groups.map(function (g) { return g == null ? '(unmatched)' : g; }).join(' · ') : '—'];
    cells.forEach(function (val) {
      const td = document.createElement('td');
      td.textContent = val;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  $('rgTableWrap').hidden = false;
}

function wire() {
  $('rxPattern').addEventListener('input', render);
  $('rxText').addEventListener('input', render);
  ['rxG', 'rxI', 'rxM'].forEach(function (id) { $(id).addEventListener('change', render); });
  $('fTest').addEventListener('click', render);
  $('fSample').addEventListener('click', function () {
    $('rxPattern').value = SAMPLE_PATTERN;
    $('rxText').value = SAMPLE_TEXT;
    $('rxG').checked = true;
    $('rxI').checked = true;
    $('rxM').checked = false;
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