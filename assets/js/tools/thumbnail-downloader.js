/* thumbnail-downloader.js — preview each thumbnail size, verify real
   dimensions, and save the original file. Direct download via fetch+blob
   (i.ytimg.com sends Access-Control-Allow-Origin: *), plus open-in-tab and
   press-and-hold fallbacks. CSP-safe: DOM APIs + textContent; images from
   i.ytimg.com. */
import { showToast } from '../components/tg-toast.js';
import { parseVideoId, THUMB_SIZES, thumbnailUrl } from '../validate/youtube.js';

const $ = (id) => document.getElementById(id);

const SAMPLE_URL = 'https://www.youtube.com/watch?v=kpdVvvglzSo';
const PLACEHOLDER_W = 120;

let currentId = null;
let activeSize = null;
let missingSizes = {};

function detectPlatform() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return 'ios';
  return 'desktop';
}

const PLATFORM_HINTS = {
  ios: 'On iPhone / iPad: press and hold the image, then tap Save Image — or tap Download to open the save sheet. "Open in new tab" also works.',
  android: 'Tap Download to save the original file straight to your device — or press and hold the image and choose Save image.',
  desktop: 'Download saves the original file untouched — or open it in a new tab and use Save image as.'
};

function renderError(msg) {
  const err = $('urlError');
  err.hidden = false;
  err.textContent = msg;
  $('detected').textContent = '';
  ['tabs', 'preview', 'actions', 'thumbGrid'].forEach(function (id) { $(id).hidden = true; });
  $('previewNote').hidden = true;
  $('dlHint').hidden = true;
  $('gridNote').textContent = '';
}

function clearError() {
  $('urlError').hidden = true;
  $('urlError').textContent = '';
}

function setBusy(btn, busy) {
  if (!btn) return;
  btn.classList.toggle('btn-busy', busy);
  btn.disabled = busy;
}

function downloadSize(key) {
  const card = document.querySelector('.thumb-card[data-size="' + key + '"]');
  const btn = (card && card.querySelector('.btn-download')) || $('downloadBtn');
  if (!btn || btn.disabled) return;
  setBusy(btn, true);
  const url = thumbnailUrl(currentId, key);
  fetch(url)
    .then(function (resp) {
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return resp.blob();
    })
    .then(function (blob) {
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = 'notgamingplayz-thumbnail-downloader-' + key + '.jpg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 4000);
      showToast('Download started');
    })
    .catch(function () {
      showToast('Download blocked by your browser — use Open in new tab');
    })
    .then(function () { setBusy(btn, false); });
}

function setSizeAvailability(key, missing) {
  const card = document.querySelector('.thumb-card[data-size="' + key + '"]');
  if (card) {
    card.classList.toggle('is-missing', missing);
    const btn = card.querySelector('.btn-download');
    if (btn) {
      btn.disabled = missing;
      btn.title = missing ? 'This size does not exist for this video' : '';
      btn.classList.toggle('is-disabled', missing);
    }
  }
  if (key === activeSize) {
    const main = $('downloadBtn');
    if (main) {
      main.disabled = missing;
      main.classList.toggle('is-disabled', missing);
    }
  }
  updateBestBadge();
}

function updateBestBadge() {
  let firstAvailable = null;
  THUMB_SIZES.forEach(function (size) {
    if (missingSizes[size.key] !== true && firstAvailable === null) firstAvailable = size.key;
  });
  document.querySelectorAll('.thumb-card-best').forEach(function (b) {
    const card = b.closest('.thumb-card');
    b.hidden = !card || card.dataset.size !== firstAvailable;
  });
}

function markCardMissing(key) {
  if (missingSizes[key] === true) return;
  missingSizes[key] = true;
  setSizeAvailability(key, true);
}

function copyUrl(url, btn) {
  const done = function (ok) {
    btn.textContent = ok ? 'Copied!' : 'Copy failed';
    showToast(ok ? 'Copied to clipboard' : 'Could not access clipboard');
    setTimeout(function () { btn.textContent = 'Copy URL'; }, 1600);
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(url).then(function () { done(true); }, function () { legacyCopy(url, done); });
  } else {
    legacyCopy(url, done);
  }
}

function legacyCopy(url, done) {
  const ta = document.createElement('textarea');
  ta.value = url;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
  document.body.removeChild(ta);
  done(ok);
}

function buildTabs() {
  const tabs = $('tabs');
  tabs.textContent = '';
  tabs.hidden = false;
  THUMB_SIZES.forEach(function (size) {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (size.key === activeSize ? ' is-active' : '');
    btn.type = 'button';
    btn.setAttribute('role', 'tab');
    btn.dataset.size = size.key;
    btn.title = size.label;
    btn.textContent = size.tab;
    btn.addEventListener('click', function () { selectSize(size.key); });
    tabs.appendChild(btn);
  });
}

function selectSize(key) {
  if (!currentId) return;
  activeSize = key;
  const tabs = $('tabs');
  Array.prototype.forEach.call(tabs.children, function (btn) {
    const on = btn.dataset.size === key;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-selected', String(on));
  });

  const img = $('previewImg');
  img.removeAttribute('src');
  $('preview').hidden = false;
  $('actions').hidden = false;
  $('openTab').href = thumbnailUrl(currentId, key);
  $('dlHint').hidden = false;
  $('dlHint').textContent = PLATFORM_HINTS[detectPlatform()];
  $('previewNote').hidden = true;
  $('previewNote').textContent = '';

  const missing = missingSizes[key] === true;
  const mainBtn = $('downloadBtn');
  if (mainBtn) {
    mainBtn.disabled = missing;
    mainBtn.classList.toggle('is-disabled', missing);
  }

  const probe = new Image();
  probe.onload = function () {
    if (activeSize !== key) return;
    const realW = probe.naturalWidth;
    const realH = probe.naturalHeight;
    const note = $('previewNote');
    note.hidden = false;
    if (key !== 'default' && realW <= PLACEHOLDER_W) {
      note.innerHTML = '';
      note.appendChild(document.createTextNode('This size does not exist for this video — YouTube serves a grey placeholder instead. Try the hqdefault size.'));
      note.classList.add('thumb-miss');
      if (missingSizes[key] !== true) { missingSizes[key] = true; setSizeAvailability(key, true); }
    } else {
      note.classList.remove('thumb-miss');
      note.textContent = 'Actual file size: ' + realW + '×' + realH + ' px — this is what gets saved.';
      if (missingSizes[key] === true) { missingSizes[key] = false; setSizeAvailability(key, false); }
    }
    img.src = thumbnailUrl(currentId, key);
    img.width = Math.min(realW || 480, 640);
    img.alt = 'Preview of the ' + key + ' thumbnail size';
  };
  probe.onerror = function () {
    if (activeSize !== key) return;
    const note = $('previewNote');
    note.hidden = false;
    note.classList.remove('thumb-miss');
    note.textContent = 'Preview could not be loaded from YouTube right now — the buttons below still work.';
  };
  probe.src = thumbnailUrl(currentId, key);
}

function buildGrid() {
  const grid = $('thumbGrid');
  grid.textContent = '';
  grid.hidden = false;
  $('gridNote').textContent = 'Every size this video supports — pick the biggest one that shows in colour.';
  $('gridNote').hidden = false;

  THUMB_SIZES.forEach(function (size) {
    const card = document.createElement('article');
    card.className = 'thumb-card';
    card.dataset.size = size.key;

    const media = document.createElement('div');
    media.className = 'thumb-card-media';

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.width = 320;
    img.height = 180;
    img.alt = '';
    img.addEventListener('load', function () {
      if (size.key !== 'default' && img.naturalWidth <= PLACEHOLDER_W) {
        markCardMissing(size.key);
      }
    });
    img.addEventListener('error', function () {
      img.style.visibility = 'hidden';
    });

    const badge = document.createElement('span');
    badge.className = 'thumb-card-badge';
    badge.textContent = size.width + '×' + size.height;

    const miss = document.createElement('span');
    miss.className = 'thumb-card-miss';
    miss.textContent = 'Not available for this video';

    const best = document.createElement('span');
    best.className = 'thumb-card-best';
    best.textContent = 'Best quality';
    best.hidden = size.key !== 'maxresdefault';

    media.appendChild(img);
    media.appendChild(badge);
    media.appendChild(miss);
    media.appendChild(best);

    const body = document.createElement('div');
    body.className = 'thumb-card-body';

    const lbl = document.createElement('p');
    lbl.className = 'thumb-card-title';
    lbl.textContent = size.label;

    const actions = document.createElement('div');
    actions.className = 'thumb-card-actions';

    const download = document.createElement('button');
    download.className = 'btn btn-gold btn-download';
    download.type = 'button';
    download.textContent = 'Download';
    download.setAttribute('aria-label', 'Download the ' + size.label + ' thumbnail');
    const spinner = document.createElement('span');
    spinner.className = 'btn-spinner';
    spinner.setAttribute('aria-hidden', 'true');
    download.insertBefore(spinner, download.firstChild);
    download.addEventListener('click', function () { downloadSize(size.key); });

    const open = document.createElement('a');
    open.className = 'btn btn-outline';
    open.href = thumbnailUrl(currentId, size.key);
    open.target = '_blank';
    open.rel = 'noopener';
    open.textContent = 'Open';
    open.setAttribute('aria-label', 'Open the ' + size.label + ' thumbnail in a new tab');

    const copy = document.createElement('button');
    copy.className = 'btn btn-outline btn-copy';
    copy.type = 'button';
    copy.textContent = 'Copy URL';
    copy.setAttribute('aria-label', 'Copy the ' + size.label + ' thumbnail URL');
    copy.addEventListener('click', function () { copyUrl(thumbnailUrl(currentId, size.key), copy); });

    actions.appendChild(download);
    actions.appendChild(open);
    actions.appendChild(copy);
    body.appendChild(lbl);
    body.appendChild(actions);
    card.appendChild(media);
    card.appendChild(body);
    grid.appendChild(card);

    img.src = thumbnailUrl(currentId, size.key);
  });
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
  missingSizes = {};
  activeSize = 'maxresdefault';
  $('detected').textContent = 'Video ID — ' + currentId;
  fetchTitle(currentId);
  buildTabs();
  buildGrid();
  selectSize(activeSize);
}

function fetchTitle(id) {
  const oembed = 'https://www.youtube.com/oembed?url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id) + '&format=json';
  fetch(oembed)
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !data.title) return;
      const det = $('detected');
      if (det && currentId === id) det.textContent = data.title + ' · Video ID — ' + id;
    })
    .catch(function () {});
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
  const mainBtn = $('downloadBtn');
  if (mainBtn) mainBtn.addEventListener('click', function () { downloadSize(activeSize); });
}

function init() {
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
