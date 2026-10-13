/* title-length-checker.js — live count vs the 100-char title limit,
   emoji-aware, with an approximate truncation preview. CSP-safe. */
import { YT_LIMITS } from '../validate/youtube.js';

const $ = (id) => document.getElementById(id);

const LIMIT = YT_LIMITS.title;
const TRUNCATE_AT = 70;
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;

const SAMPLE = 'I Built an Auto-Farming Addon in Minecraft Bedrock — Full Tutorial 🚀';

function makeRow(severity, label, message) {
  const li = document.createElement('li');
  li.className = 'chk-item';
  const chip = document.createElement('span');
  chip.className = 'chk-badge chk-badge--' + severity;
  chip.textContent = label;
  const text = document.createElement('span');
  text.className = 'chk-text';
  text.textContent = message;
  li.appendChild(chip);
  li.appendChild(text);
  return li;
}

function render() {
  const title = $('titleInput').value;
  const list = $('issueList');
  const detected = $('detected');
  const preview = $('truncPreview');
  const label = $('truncLabel');
  list.textContent = '';

  const n = title.length;
  const counter = $('charCount');
  counter.textContent = n + ' / ' + LIMIT;
  counter.classList.toggle('is-over', n > LIMIT);
  const bar = $('charBar');
  bar.style.width = Math.min(100, (n / LIMIT) * 100) + '%';
  bar.classList.toggle('is-over', n > LIMIT);

  if (!title.trim()) {
    detected.textContent = '';
    preview.hidden = true;
    label.hidden = true;
    return;
  }

  const emojiCount = (title.match(EMOJI_RE) || []).length;

  if (n > LIMIT) {
    list.appendChild(makeRow('error', 'Over limit', 'YouTube titles allow 100 characters — trim ' + (n - LIMIT) + ' character' + (n - LIMIT === 1 ? '' : 's') + '.'));
  } else if (n >= 90) {
    list.appendChild(makeRow('warning', 'Close', 'Under the limit but very long — most titles work best around 60–70 characters.'));
  } else if (n >= 60) {
    list.appendChild(makeRow('ok', 'Good', 'Comfortably under the limit — keep the important words in the first 60 characters.'));
  } else {
    list.appendChild(makeRow('ok', 'Great', 'Short and safe — consider whether it is descriptive enough on its own.'));
  }

  if (emojiCount) {
    list.appendChild(makeRow('warning', 'Emoji', emojiCount + ' emoji found. They render wider than letters and can wrap or truncate titles that ' + (n <= LIMIT ? 'fit by character count' : 'already exceed the limit') + '.'));
  }

  if (n > TRUNCATE_AT) {
    const cut = title.slice(0, TRUNCATE_AT).trimEnd();
    preview.textContent = cut + '…';
    preview.hidden = false;
    label.hidden = false;
    detected.textContent = 'Titles are often cut around ' + TRUNCATE_AT + ' characters on common surfaces.';
  } else {
    preview.hidden = true;
    label.hidden = true;
    detected.textContent = '';
  }
}

function wire() {
  $('titleInput').addEventListener('input', render);
  $('fSample').addEventListener('click', function () {
    $('titleInput').value = SAMPLE;
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
