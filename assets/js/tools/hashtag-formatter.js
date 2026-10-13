/* hashtag-formatter.js — normalize, dedupe, count, and report YouTube
   hashtags using the validated hashtags module. CSP-safe:
   DOM APIs + textContent. */
import { normalizeHashtags } from '../validate/hashtags.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = [
  'minecraft, Minecraft builds, #Bedrock, minecraft builds,',
  '#minecraft, bedrock addons, minecraft bedrock,',
  '!!!'
].join('\n');

function makeRowRow(issue) {
  const li = document.createElement('li');
  li.className = 'chk-item';
  const chip = document.createElement('span');
  chip.className = 'chk-badge ' + (issue.code === 'unreadable' ? 'chk-badge--error' : 'chk-badge--warning');
  chip.textContent = issue.code === 'unreadable' ? 'Skipped' : 'Dup';
  const text = document.createElement('span');
  text.textContent = issue.message;
  li.appendChild(chip);
  li.appendChild(text);
  return li;
}

function render() {
  const raw = $('tagInput').value;
  const summary = $('tagSummary');
  const chips = $('tagChips');
  const list = $('issueList');
  const detected = $('detected');
  const output = $('tagOutput');
  const tagCount = $('tagCount');
  const tagChars = $('tagChars');
  chips.textContent = '';
  list.textContent = '';

  if (!raw.trim()) {
    summary.className = 'chk-summary chk-summary--idle';
    summary.firstChild.nodeValue = 'Add tags on the left to format them.';
    detected.textContent = '';
    output.hidden = true;
    tagCount.textContent = '0';
    tagChars.textContent = '0';
    chips.hidden = true;
    return;
  }

  const r = normalizeHashtags(raw);

  tagCount.textContent = String(r.count);
  tagChars.textContent = String(r.charsWithHash);

  output.textContent = r.inline;
  output.hidden = false;

  r.tags.forEach(function (tag) {
    const span = document.createElement('span');
    span.className = 'tag-chip';
    span.textContent = '#' + tag;
    chips.appendChild(span);
  });
  chips.hidden = r.count === 0;

  r.issues.forEach(function (i) { list.appendChild(makeRowRow(i)); });

  if (r.count === 0) {
    summary.className = 'chk-summary chk-summary--error';
    summary.firstChild.nodeValue = 'No usable tags found — check that at least one value contains letters or numbers.';
    detected.textContent = '';
    return;
  }

  const shown = Math.min(r.count, 3);
  if (r.count > 60) {
    summary.className = 'chk-summary chk-summary--error';
    summary.firstChild.nodeValue = 'More than 60 tags — YouTube may ignore your hashtags entirely.';
    detected.textContent = 'Trim the list to 60 tags or fewer.';
  } else if (r.count > 3) {
    summary.className = 'chk-summary chk-summary--ok';
    summary.firstChild.nodeValue = 'Formatted — ' + r.count + ' tags. The first ' + shown + ' can appear above your title; the rest still help in search.';
    detected.textContent = 'Tags above title: ' + shown;
  } else {
    summary.className = 'chk-summary chk-summary--ok';
    summary.firstChild.nodeValue = 'Formatted — ' + r.count + ' tag' + (r.count === 1 ? '' : 's') + '. All visible above your title.';
    detected.textContent = 'Tags above title: ' + shown;
  }
}

function wire() {
  $('tagInput').addEventListener('input', render);
  $('fFormat').addEventListener('click', render);
  $('fSample').addEventListener('click', function () {
    $('tagInput').value = SAMPLE;
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