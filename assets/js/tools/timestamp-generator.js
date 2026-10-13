/* timestamp-generator.js — durations in, absolute timestamps out.
   Reuses the validated chapters module (buildChaptersFromDurations +
   analyzeChapters). CSP-safe: DOM APIs + textContent. */
import { buildChaptersFromDurations, parseDurationLine, formatTimestamp, analyzeChapters } from '../validate/chapters.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = [
  'Intro 0:30',
  'What this pack adds 1:45',
  'Installing it 3:00',
  'Configuring scripts 5:10',
  'Troubleshooting 2:15',
  'Outro 0:45'
].join('\n');

function currentStyle() {
  const sel = document.querySelector('input[name="style"]:checked');
  return sel && sel.value === 'long' ? 'long' : 'short';
}

function makeIssueRow(issue) {
  const li = document.createElement('li');
  li.className = 'chk-item';
  const chip = document.createElement('span');
  chip.className = 'chk-badge chk-badge--' + issue.severity;
  chip.textContent = issue.severity === 'error' ? 'Error' : 'Warning';
  const text = document.createElement('span');
  text.className = 'chk-text';
  text.textContent = issue.message;
  li.appendChild(chip);
  li.appendChild(text);
  return li;
}

function setSummary(summary, state, msg) {
  summary.className = 'chk-summary chk-summary--' + state;
  summary.textContent = '';
  summary.appendChild(document.createTextNode(msg));
}

/* Patterns like "0:30 Intro" or "12:40 Outro" — existing timestamps,
   not the durations this tool adds up. */
const ABSOLUTE_TIME_RE = /^\d{1,2}(?::\d{2}){1,2}\s+\S/;

function looksLikeTimestamps(lines) {
  return lines.some(function (l) {
    var t = (l || '').trim();
    return t && ABSOLUTE_TIME_RE.test(t.replace(/^[\-\s\u2022\u2023\u25aa#*]+/, ''));
  });
}

function addSkipList(list, skipped, kind) {
  const li = document.createElement('li');
  li.className = 'chk-item';
  const chip = document.createElement('span');
  chip.className = 'chk-badge chk-badge--' + kind;
  chip.textContent = 'Skipped';
  const text = document.createElement('span');
  text.textContent = skipped.join(' · ');
  li.appendChild(chip);
  li.appendChild(text);
  list.appendChild(li);
}

function render() {
  const raw = $('segments').value;
  const issueList = $('issueList');
  const summary = $('tsSummary');
  const output = $('tsOutput');
  const detected = $('detected');
  const err = $('segError');
  issueList.textContent = '';
  err.hidden = true;

  if (!raw.trim()) {
    setSummary(summary, 'idle', 'Add segments on the left to generate timestamps.');
    detected.textContent = '';
    output.hidden = true;
    return;
  }

  const lines = raw.split(/\r?\n/);
  const segments = [];
  const skipped = [];
  lines.forEach(function (line) {
    const p = parseDurationLine(line);
    if (p) segments.push(p);
    else if (line.trim()) skipped.push(line.trim());
  });

  if (!segments.length) {
    output.hidden = true;
    detected.textContent = '';
    if (looksLikeTimestamps(lines)) {
      setSummary(summary, 'error',
        'Those look like existing timestamps (e.g. "0:30 Intro"), not durations. This tool adds up durations —');
      const note = document.createElement('span');
      const sep = document.createTextNode(' ');
      const link = document.createElement('a');
      link.href = '/tools/chapter-formatter/';
      link.textContent = 'use the Chapter Formatter instead';
      note.appendChild(sep);
      note.appendChild(link);
      summary.appendChild(note);
    } else {
      setSummary(summary, 'error',
        'No parseable segments found. Expected lines like "Intro 0:30" (label, then duration in seconds).');
    }
    if (skipped.length) addSkipList(issueList, skipped, 'error');
    return;
  }

  const built = buildChaptersFromDurations(segments);
  const style = currentStyle();
  const text = built.chapters.map(function (c) {
    return formatTimestamp(c.seconds, style) + ' ' + c.title;
  }).join('\n');

  output.textContent = text;
  output.hidden = false;

  const last = segments.reduce(function (sum, s) { return sum + s.seconds; }, 0);
  detected.textContent = segments.length + ' segment' + (segments.length === 1 ? '' : 's') +
    ' · total ' + formatTimestamp(last, style);

  const issues = analyzeChapters(built.chapters).concat(built.issues);
  issues.forEach(function (i) { issueList.appendChild(makeIssueRow(i)); });
  if (skipped.length) addSkipList(issueList, skipped, 'info');

  const errors = issues.filter(function (i) { return i.severity === 'error'; }).length;
  const warnings = issues.filter(function (i) { return i.severity === 'warning'; }).length;
  const counts = [];
  if (errors) counts.push(errors + ' error' + (errors === 1 ? '' : 's'));
  if (warnings) counts.push(warnings + ' warning' + (warnings === 1 ? '' : 's'));
  if (counts.length) {
    setSummary(summary, errors ? 'error' : 'warn',
      counts.join(' and ') + ' to review — timestamps still generated below.');
  } else {
    setSummary(summary, 'ok', 'Clean — all segments parsed and chapter rules pass.');
  }
}

function wire() {
  const trigger = function () { render(); };
  $('segments').addEventListener('input', trigger);
  document.querySelectorAll('input[name="style"]').forEach(function (r) {
    r.addEventListener('change', trigger);
  });
  $('fGenerate').addEventListener('click', trigger);
  $('fSample').addEventListener('click', function () {
    $('segments').value = SAMPLE;
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
