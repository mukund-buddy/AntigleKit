/* study-planner.js — balanced weekly timetable from a subject list.
   CSP-safe. */
import { studyParseLines, studyWeek, studyWeekSummary } from '../validate/student-planning-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = 'Mathematics: 3\nPhysics: 3\nChemistry: 2\nBiology: 2\nEnglish: 1';

function fmtMin(m) {
  return m % 60 === 0 ? (m / 60) + ' h' : m + ' min';
}

function clearChildren(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function buildTable(week) {
  var wrap = $('spTableWrap');
  clearChildren(wrap);
  var table = document.createElement('table');
  table.className = 'table-out';
  var thead = document.createElement('thead');
  var htr = document.createElement('tr');
  var heads = ['Day', 'Sessions', 'Total'];
  heads.forEach(function (h) {
    var th = document.createElement('th');
    th.scope = 'col';
    th.textContent = h;
    htr.appendChild(th);
  });
  thead.appendChild(htr);
  table.appendChild(thead);
  var tbody = document.createElement('tbody');
  week.forEach(function (day) {
    var tr = document.createElement('tr');
    var tdDay = document.createElement('td');
    tdDay.textContent = day.dayLabel;
    tr.appendChild(tdDay);
    var tdS = document.createElement('td');
    tdS.textContent = day.sessions.map(function (s) { return s.subject; }).join(' · ');
    tr.appendChild(tdS);
    var tdT = document.createElement('td');
    tdT.textContent = fmtMin(day.sessions.reduce(function (acc, s) { return acc + s.minutes; }, 0));
    tr.appendChild(tdT);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
}

function render() {
  var raw = $('spInput').value;
  var days = Number($('spDays').value || 7);
  var slots = Number($('spSlots').value || 4);
  var minutes = Number($('spMinutes').value || 45);
  var rows = studyParseLines(raw);
  var out = $('spOut');
  var det = $('spDetected');
  var errEl = $('spError');

  if (!raw.trim()) {
    clearChildren($('spTableWrap'));
    out.textContent = '';
    det.textContent = '';
    errEl.hidden = true;
    return;
  }

  if (!rows.length) {
    clearChildren($('spTableWrap'));
    errEl.textContent = 'Type at least one subject per line. Optional weight: "Mathematics: 3" repeats it more often.';
    errEl.hidden = false;
    out.textContent = '';
    det.textContent = '';
    return;
  }

  errEl.hidden = true;
  var week = studyWeek(rows, { days: days, slotsPerDay: slots, sessionMinutes: minutes });
  var summary = studyWeekSummary(week);
  buildTable(week);

  var lines = [];
  lines.push('Study plan — ' + days + ' day' + (days === 1 ? '' : 's') + ' × ' + slots + ' session' + (slots === 1 ? '' : 's') + ' of ' + minutes + ' min');
  lines.push('');
  week.forEach(function (day) {
    lines.push(day.dayLabel + ': ' + day.sessions.map(function (s) { return s.subject; }).join(' · '));
  });
  lines.push('');
  lines.push('Totals per subject');
  summary.subjects.forEach(function (subj) {
    lines.push('  ' + subj.name + ': ' + fmtMin(subj.minutes));
  });
  lines.push('');
  lines.push('Total: ' + summary.slots + ' sessions · ' + fmtMin(summary.totalMinutes));

  out.textContent = lines.join('\n');
  det.className = 'chk-detected';
  det.textContent = summary.slots + ' sessions · ' + fmtMin(summary.totalMinutes) +
    ' · every subject appears at most once per day';
}

function wire() {
  $('spInput').addEventListener('input', render);
  ['spDays', 'spSlots', 'spMinutes'].forEach(function (id) {
    $(id).addEventListener('change', render);
  });
  $('fSample').addEventListener('click', function () {
    $('spInput').value = SAMPLE;
    render();
  });
  $('fClear').addEventListener('click', function () {
    $('spInput').value = '';
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