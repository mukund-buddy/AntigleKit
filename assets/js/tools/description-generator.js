/* description-generator.js — assemble body + chapters + links into a
   consistent video description, counted against YT_LIMITS.description.
   CSP-safe: DOM APIs + textContent. */
import { showToast } from '../components/tg-toast.js';
import { YT_LIMITS } from '../validate/youtube.js';
import { buildChapters, analyzeChapters, formatTimestamp } from '../validate/chapters.js';

const $ = (id) => document.getElementById(id);

const LIMIT = YT_LIMITS.description;

const SAMPLE = {
  body: 'In this video I show how to build a professional website with AI in 15 minutes — no coding needed, and it is completely free.',
  chapters: [
    '0:00 Intro',
    '0:30 Getting the website files',
    '1:20 Customising s.js and v.js',
    '2:10 Using the E & V Editor',
    '2:50 Publishing it live'
  ].join('\n'),
  links: [
    'Subscribe — https://github.com/mukund-buddy/AntigleKit',
    'Watch the tutorial — https://www.youtube.com/watch?v=kpdVvvglzSo',
    'Download the files — https://drive.google.com/drive/folders/1PsxJiNmqibuKksv4iaMirGG49xusv8oZ'
  ].join('\n')
};

function formatLinks(raw) {
  const out = [];
  raw.split(/\r?\n/).forEach(function (line) {
    const t = line.trim();
    if (!t) return;
    const eq = t.indexOf('=');
    const sep = t.indexOf('—');
    const splitAt = eq > -1 ? eq : sep;
    if (splitAt > 0 && /https?:\/\//i.test(t.slice(splitAt + 1))) {
      const label = t.slice(0, splitAt).trim();
      const url = t.slice(splitAt + 1).trim();
      if (label && url) {
        out.push(label + ' — ' + url);
        return;
      }
    }
    out.push(t);
  });
  return out;
}

function render() {
  const body = $('descBody').value.replace(/\n{3,}/g, '\n\n').trim();
  const chapterRaw = $('descChapters').value.trim();
  const linkRaw = $('descLinks').value.trim();

  const parts = [];
  const notes = [];

  if (body) parts.push(body);

  if (chapterRaw) {
    const chapters = buildChapters(chapterRaw.split(/\r?\n/));
    if (chapters.length) {
      const issues = analyzeChapters(chapters);
      const errs = issues.filter(function (i) { return i.severity === 'error'; }).length;
      notes.push(chapters.length + ' chapter' + (chapters.length === 1 ? '' : 's') +
        (errs ? ' · ' + errs + ' chapter rule issue' + (errs === 1 ? '' : 's') + ' (see page summary)' : ''));
      const block = ['Timestamps:', ''].concat(
        chapters.map(function (c) { return formatTimestamp(c.seconds, 'long') + ' ' + c.title; })
      );
      parts.push(block.join('\n'));
    } else {
      notes.push('Chapters were not recognised — each line needs a timestamp like 0:00.');
    }
  }

  if (linkRaw) {
    const links = formatLinks(linkRaw);
    if (links.length) {
      const block = ['Links & resources:', ''].concat(links);
      parts.push(block.join('\n'));
      notes.push(links.length + ' link' + (links.length === 1 ? '' : 's') + ' formatted');
    }
  }

  const text = parts.join('\n\n');
  const out = $('descOutput');
  out.textContent = text;
  out.hidden = false;

  const n = text.length;
  const counter = $('charCount');
  counter.textContent = n + ' / ' + LIMIT;
  counter.classList.toggle('is-over', n > LIMIT);
  const bar = $('charBar');
  bar.style.width = Math.min(100, (n / LIMIT) * 100) + '%';
  bar.classList.toggle('is-over', n > LIMIT);

  $('detected').textContent = notes.length ? notes.join(' · ') : '';

  if (n > LIMIT) {
    $('detected').textContent += (notes.length ? ' · ' : '') + 'Over the 5,000 limit by ' + (n - LIMIT) + ' characters';
  }
}

function wire() {
  const trigger = function () { render(); };
  ['descBody', 'descChapters', 'descLinks'].forEach(function (id) {
    $(id).addEventListener('input', trigger);
  });
  $('fBuild').addEventListener('click', trigger);
  $('fSample').addEventListener('click', function () {
    $('descBody').value = SAMPLE.body;
    $('descChapters').value = SAMPLE.chapters;
    $('descLinks').value = SAMPLE.links;
    render();
    showToast('Sample description loaded');
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
