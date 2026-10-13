/* thumbnail-fetcher.js — build direct thumbnail URLs for any YouTube
   video and verify which sizes truly exist by reading image dimensions.
   CSP-safe: DOM APIs + textContent; images loaded lazily from i.ytimg.com. */
import { showToast } from '../components/tg-toast.js';
import { parseVideoId, THUMB_SIZES, thumbnailUrl } from '../validate/youtube.js';

const $ = (id) => document.getElementById(id);

const SAMPLE_URL = 'https://www.youtube.com/watch?v=kpdVvvglzSo';
const PLACEHOLDER_W = 120; /* i.ytimg.com missing-size placeholder */

let currentId = null;

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(
      function () { showToast('URL copied'); },
      function () { showToast('Copy failed — select the URL manually'); }
    );
  }
  showToast('Copy not supported here');
  return Promise.resolve();
}

function renderError(msg) {
  const err = $('urlError');
  err.hidden = false;
  err.textContent = msg;
  $('detected').textContent = '';
  $('preview').hidden = true;
  $('thumbGrid').hidden = true;
  $('thumbNote').textContent = '';
}

function clearError() {
  $('urlError').hidden = true;
  $('urlError').textContent = '';
}

function render() {
  const parsed = parseVideoId($('videoUrl').value);
  if (!parsed.ok) {
    renderError(parsed.reason === 'empty' ? '' : 'Could not find a video ID in that link.');
    currentId = null;
    return;
  }
  clearError();
  currentId = parsed.id;

  $('detected').textContent = 'Video ID — ' + currentId;

  const grid = $('thumbGrid');
  grid.textContent = '';
  grid.hidden = false;

  const preview = $('preview');
  const previewImg = $('previewImg');
  preview.hidden = false;
  previewImg.removeAttribute('src');

  THUMB_SIZES.forEach(function (size, index) {
    const row = document.createElement('div');
    row.className = 'thumb-row' + (index === 0 ? ' is-active' : '');
    row.dataset.size = size.key;

    const lbl = document.createElement('span');
    lbl.className = 'thumb-row-lbl';
    const strong = document.createElement('span');
    strong.textContent = size.label;
    const dims = document.createElement('small');
    dims.textContent = size.width + '×' + size.height;
    lbl.appendChild(strong);
    lbl.appendChild(dims);

    const url = document.createElement('span');
    url.className = 'thumb-row-url';
    url.textContent = thumbnailUrl(currentId, size.key);

    const open = document.createElement('button');
    open.className = 'btn btn-ghost';
    open.type = 'button';
    open.textContent = 'Open';
    open.title = 'Open in a new tab';
    open.addEventListener('click', function () {
      window.open(url.textContent, '_blank', 'noopener');
    });

    const copy = document.createElement('button');
    copy.className = 'btn btn-outline';
    copy.type = 'button';
    copy.textContent = 'Copy';
    copy.addEventListener('click', function () { copyText(url.textContent); });

    row.appendChild(lbl);
    row.appendChild(url);
    row.appendChild(open);
    row.appendChild(copy);
    grid.appendChild(row);
  });

  /* Detect true dimensions on the hqdefault preview (always exists). */
  const probe = new Image();
  probe.onload = function () {
    if (currentId !== parsed.id) return;
    const ok = probe.naturalWidth > 0 ? probe.naturalWidth : 480;
    previewImg.src = thumbnailUrl(currentId, 'hqdefault');
    previewImg.width = Math.min(ok, 640);
  };
  probe.onerror = function () {
    if (currentId !== parsed.id) return;
    previewImg.src = thumbnailUrl(currentId, 'hqdefault');
  };
  probe.src = thumbnailUrl(currentId, 'hqdefault');

  checkMissing(currentId);
}

function checkMissing(id) {
  THUMB_SIZES.forEach(function (size) {
    const row = document.querySelector('.thumb-row[data-size="' + size.key + '"]');
    if (!row) return;
    const img = new Image();
    img.onload = function () {
      if (currentId !== id) return;
      if (size.key !== 'default' && img.naturalWidth <= PLACEHOLDER_W) {
        const lbl = row.querySelector('small');
        lbl.textContent += ' · missing (placeholder)';
        lbl.classList.add('thumb-miss');
      }
    };
    img.src = thumbnailUrl(id, size.key);
  });
}

function wire() {
  $('fFetch').addEventListener('click', render);
  $('fSample').addEventListener('click', function () {
    $('videoUrl').value = SAMPLE_URL;
    render();
    showToast('Sample link loaded');
  });
  $('videoUrl').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      render();
    }
  });
  $('videoUrl').addEventListener('input', clearError);
}

function init() {
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}