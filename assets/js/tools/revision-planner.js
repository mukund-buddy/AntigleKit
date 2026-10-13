/* revision-planner.js — spaced-revision sessions before an exam date.
   CSP-safe. */
import { revisionTopics, revisionSchedule } from '../validate/student-planning-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE_TOPICS = 'Algebra\nTrigonometry\nCalculus\nStatistics';
const SAMPLE_INTERVAL = '1,3,7,14,30';

function clearChildren(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function dateFromISO(str) {
  var m = String(str).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function fmtDate(iso) {
  var d = dateFromISO(iso);
  if (!d) return iso;
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function daysFromToday(iso) {
  var d = dateFromISO(iso);
  if (!d) return null;
  var now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

function buildTable(rows) {
  var wrap = $('rpTableWrap');
  clearChildren(wrap);
  var table = document.createElement('table');
  table.className = 'table-out';
  var thead = document.createElement('thead');
  var htr = document.createElement('tr');
  ['When', 'Date', 'Revise'].forEach(function (h) {
    var th = document.createElement('th');
    th.scope = 'col';
    th.textContent = h;
    htr.appendChild(th);
  });
  thead.appendChild(htr);
  table.appendChild(thead);
  var tbody = document.createElement('tbody');
  rows.forEach(function (row) {
    var tr = document.createElement('tr');
    var tdWhen = document.createElement('td');
    tdWhen.textContent = row.label;
    tr.appendChild(tdWhen);
    var tdDate = document.createElement('td');
    tdDate.textContent = fmtDate(row.date);
    tr.appendChild(tdDate);
    var tdTopics = document.createElement('td');
    tdTopics.textContent = row.topics.length ? row.topics.join(' · ') : '—';
    tr.appendChild(tdTopics);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
}

function render() {
  var dateVal = $('rpDate').value;
  var topicsText = $('rpTopics').value;
  var count = Number($('rpCount').value || 4);
  var interval = $('rpInterval').value;
  var out = $('rpOut');
  var det = $('rpDetected');
  var errEl = $('rpError');

  if (!dateVal && !topicsText.trim()) {
    clearChildren($('rpTableWrap'));
    out.textContent = '';
    det.textContent = '';
    errEl.hidden = true;
    return;
  }

  if (!dateVal) {
    clearChildren($('rpTableWrap'));
    errEl.textContent = 'Pick an exam date first — the whole plan runs backwards from it.';
    errEl.hidden = false;
    out.textContent = '';
    det.textContent = '';
    return;
  }

  var topics = topicsText.trim() ? revisionTopics(topicsText) : revisionTopics(count);
  if (!topics.length) {
    clearChildren($('rpTableWrap'));
    errEl.textContent = 'Add at least one topic name, or let the plan create Topic 1..N from the count.';
    errEl.hidden = false;
    out.textContent = '';
    det.textContent = '';
    return;
  }

  errEl.hidden = true;
  var schedule = revisionSchedule(dateVal, topics, interval);
  if (!schedule.length) {
    clearChildren($('rpTableWrap'));
    errEl.textContent = 'Could not build a schedule from those settings. Enter a valid interval list like "1,3,7".';
    errEl.hidden = false;
    out.textContent = '';
    det.textContent = '';
    return;
  }
  buildTable(schedule);

  var start = schedule[0];
  var startDelta = daysFromToday(start.date);
  var lines = [];
  lines.push('Exam: ' + fmtDate(dateVal) + ' — revise these ' + topics.length + ' topics');
  lines.push('');
  schedule.forEach(function (row) {
    lines.push(row.label + ' (' + row.date + '): ' + row.topics.join(', '));
  });

  out.textContent = lines.join('\n');

  det.className = 'chk-detected';
  if (startDelta !== null && startDelta < 0) {
    det.className = 'chk-detected is-error';
    det.textContent = 'The exam is already in the past — pick a future date.';
  } else if (startDelta !== null && startDelta <= 2) {
    det.className = 'chk-detected is-warn';
    det.textContent = 'First session is ' + Math.max(0, startDelta) + ' day(s) from now — tight, but start anyway.';
  } else {
    det.textContent = 'Starts ' + start.label + ' (' + (startDelta === null ? '—' : startDelta + ' day(s) from now') + ') · ' + schedule.length + ' session day(s) before the exam.';
  }
}

function wire() {
  ['rpDate', 'rpTopics', 'rpCount', 'rpInterval'].forEach(function (id) {
    $(id).addEventListener(id === 'rpTopics' ? 'input' : 'change', render);
  });
  $('fSample').addEventListener('click', function () {
    var today = new Date();
    var target = new Date(today.getTime() + 21 * 86400000);
    var iso = target.getFullYear() + '-' + String(target.getMonth() + 1).padStart(2, '0') + '-' + String(target.getDate()).padStart(2, '0');
    $('rpDate').value = iso;
    $('rpTopics').value = SAMPLE_TOPICS;
    $('rpInterval').value = SAMPLE_INTERVAL;
    render();
  });
  $('fClear').addEventListener('click', function () {
    $('rpDate').value = '';
    $('rpTopics').value = '';
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