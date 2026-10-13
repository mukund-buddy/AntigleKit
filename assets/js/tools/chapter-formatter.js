/* chapter-formatter.js — normalize messy notes into YouTube chapter
   lines and verify the acceptance rules (chapters.js). CSP-safe. */
import { buildChapters, analyzeChapters, formatTimestamp } from '../validate/chapters.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = [
  '- 0:00 Intro',
  '- 1:23 What this pack adds',
  '2:45 Installing the add-on',
  '(4:10 Scripting explained)',
  'Build config 6:02',
  '5:30 Outro'
].join('\n');

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

function render() {
  const raw = $('chapterNotes').value;
  const issueList = $('issueList');
  const summary = $('chSummary');
  const output = $('chOutput');
  const detected = $('detected');
  issueList.textContent = '';

  if (!raw.trim()) {
    summary.className = 'chk-summary chk-summary--idle';
    summary.firstChild.nodeValue = 'Paste notes on the left to format chapters.';
    detected.textContent = '';
    output.hidden = true;
    return;
  }

  const lines = raw.split(/\r?\n/);
  const chapters = buildChapters(lines);
  const skipped = lines.filter(function (l) { return l.trim() && !chapters.some(function (c) { return c.raw === l.trim(); }); });

  if (!chapters.length) {
    summary.className = 'chk-summary chk-summary--error';
    summary.firstChild.nodeValue = 'No chapters found. Each line needs a timestamp like 0:00 or 1:23:45.';
    detected.textContent = '';
    output.hidden = true;
    return;
  }

  const text = chapters.map(function (c) {
    return formatTimestamp(c.seconds, 'long') + ' ' + c.title;
  }).join('\n');
  output.textContent = text;
  output.hidden = false;
  detected.textContent = chapters.length + ' chapter' + (chapters.length === 1 ? '' : 's') + ' formatted';

  const issues = analyzeChapters(chapters);
  issues.forEach(function (i) { issueList.appendChild(makeIssueRow(i)); });
  if (skipped.length) {
    skipped.forEach(function (s) {
      const li = document.createElement('li');
      li.className = 'chk-item';
      const chip = document.createElement('span');
      chip.className = 'chk-badge chk-badge--info';
      chip.textContent = 'Skipped';
      const text = document.createElement('span');
      text.textContent = s;
      li.appendChild(chip);
      li.appendChild(text);
      issueList.appendChild(li);
    });
  }

  const e = issues.some(function (i) { return i.severity === 'error'; });
  if (issues.length) {
    summary.className = 'chk-summary ' + (e ? 'chk-summary--error' : 'chk-summary--ok');
    const errCount = issues.filter(function (i) { return i.severity === 'error'; }).length;
    const warnCount = issues.length - errCount;
    summary.firstChild.nodeValue = (errCount ? errCount + ' issue' + (errCount === 1 ? '' : 's') : 'Warnings') +
      (warnCount ? (errCount ? ' and ' : '') + warnCount + ' warning' + (warnCount === 1 ? '' : 's') : '') +
      ' to review — chapters still formatted below.';
  } else {
    summary.className = 'chk-summary chk-summary--ok';
    summary.firstChild.nodeValue = 'Clean — chapter rules pass. This list will show on YouTube.';
  }
}

function wire() {
  $('chapterNotes').addEventListener('input', render);
  $('fFormat').addEventListener('click', render);
  $('fSample').addEventListener('click', function () {
    $('chapterNotes').value = SAMPLE;
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