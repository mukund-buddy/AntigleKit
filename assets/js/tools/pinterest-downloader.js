/* pinterest-downloader.js — preview a Pinterest pin (image or video) in the
   official Pinterest embed, then fetch its real media file. Sizes and URLs
   come from the public pidgets info endpoint, which answers with
   Access-Control-Allow-Origin: *, so the CDN file can be streamed as a blob
   and saved without a server. If the browser blocks the blob download, the
   full image opens in a new tab instead. CSP-safe: DOM APIs + textContent. */
import { showToast } from '../components/tg-toast.js';

const $ = (id) => document.getElementById(id);

const SAMPLE_ID = '617415430169271912';
const EMBED_BASE = 'https://assets.pinterest.com/ext/embed.html';
const PIN_BASE = 'https://www.pinterest.com/pin/';
const INFO_BASE = 'https://widgets.pinterest.com/v3/pidgets/pins/info/?pin_ids=';
const LOAD_TIMEOUT_MS = 12000;

let currentId = null;
let imageSizes = [];   /* [{ key, url, width, height }] sorted best-first */
let videoFiles = [];   /* [{ key, url, width, height }] sorted best-first */
let activeImageIndex = 0;

function detectPlatform() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return 'ios';
  return 'desktop';
}

const PLATFORM_HINTS = {
  ios: 'Long-press the pin, then tap Save Image — or tap the Save button inside the pin to keep it in your Pinterest account.',
  android: 'Press and hold the pin, then choose Save image — or tap Save inside the pin to keep it in your Pinterest account.',
  desktop: 'Right-click the pin and choose Save image as… — or tap the Save button inside the pin to keep it in your Pinterest account.'
};

function parsePin(raw) {
  const value = (raw || '').trim();
  if (!value) return { ok: false, reason: 'empty' };
  if (/^https?:\/\/pin\.it\//i.test(value)) {
    return { ok: false, reason: 'shortlink' };
  }
  const urlMatch = value.match(/^(?:https?:\/\/|\/\/)?(?:[a-z0-9-]+\.)*pinterest\.[a-z.]{2,10}\/pin\/([0-9]{10,25})/i);
  if (urlMatch) return { ok: true, id: urlMatch[1] };
  const digits = value.replace(/[^0-9]/g, '');
  if (/^[0-9]{10,25}$/.test(digits)) return { ok: true, id: digits };
  return { ok: false, reason: 'nopin' };
}

function renderError(msg) {
  const err = $('urlError');
  err.hidden = false;
  err.textContent = msg;
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

function copyText(text, btn, idleLabel) {
  const done = function (ok) {
    btn.textContent = ok ? 'Copied!' : 'Copy failed';
    showToast(ok ? 'URL copied to clipboard' : 'Could not access clipboard');
    setTimeout(function () { btn.textContent = idleLabel; }, 1600);
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(function () { done(true); }, function () { legacyCopy(text, done); });
  } else {
    legacyCopy(text, done);
  }
}

function legacyCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
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

function extOf(url, fallback) {
  const m = /\.([a-z0-9]{2,5})(?:[?#]|$)/i.exec(url);
  return m ? m[1].toLowerCase() : fallback;
}

/* Pull every distinct image candidate out of the pidgets response. */
function collectImages(info) {
  const images = (info && info.images) || {};
  const byUrl = new Map();
  Object.keys(images).forEach(function (key) {
    const entry = images[key];
    if (!entry || !entry.url) return;
    const url = entry.url.replace(/^http:/, 'https:');
    if (!/^https:\/\/i\.pinimg\.com\//.test(url)) return;
    const width = Number(entry.width) || 0;
    const height = Number(entry.height) || 0;
    if (byUrl.has(url)) {
      const kept = byUrl.get(url);
      if (width > kept.width) { kept.width = width; kept.height = height; }
    } else {
      byUrl.set(url, { key, url, width, height });
    }
  });
  return Array.from(byUrl.values()).sort(function (a, b) {
    return (b.width || 0) - (a.width || 0) || (b.height || 0) - (a.height || 0);
  });
}

function collectVideos(info) {
  const list = (info && info.videos && info.videos.video_list) || {};
  const files = [];
  Object.keys(list).forEach(function (key) {
    const entry = list[key];
    if (!entry || !entry.url) return;
    const url = String(entry.url);
    if (!/^https?:\/\/.*\.(mp4|m3u8)/i.test(url) && !/thumb/i.test(url)) return;
    files.push({ key, url, width: Number(entry.width) || 0, height: Number(entry.height) || 0 });
  });
  return files.sort(function (a, b) { return (b.width || 0) - (a.width || 0); });
}

function saveBlob(url, filename, btn, openFallbackLabel) {
  setBusy(btn, true);
  fetch(url, { mode: 'cors', credentials: 'omit' })
    .then(function (resp) {
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return resp.blob();
    })
    .then(function (blob) {
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 4000);
      showToast('Download started');
    })
    .catch(function () {
      showToast('Direct download blocked — opening the file in a new tab');
      window.open(url, '_blank', 'noopener');
    })
    .then(function () { setBusy(btn, false); });
}

function downloadImage() {
  const size = imageSizes[activeImageIndex];
  if (!size) return;
  saveBlob(size.url, 'pinterest-pin-' + currentId + '-' + size.key + '.' + extOf(size.url, 'jpg'), $('pinDownload'), false);
}

function downloadVideo() {
  const video = videoFiles.filter(function (f) { return /\.(mp4)(\?|$)/i.test(f.url); })[0];
  if (!video) return;
  saveBlob(video.url, 'pinterest-pin-' + currentId + '-video.' + extOf(video.url, 'mp4'), $('pinVideoBtn'), false);
}

/* ── Media panel rendering ─────────────────────────────────────── */

function buildMediaPanel(info) {
  const panel = $('pinMedia');
  panel.textContent = '';
  panel.hidden = true;
  activeImageIndex = 0;

  const isVideo = videoFiles.some(function (f) { return /\.(mp4)(\?|$)/i.test(f.url); });

  if (imageSizes.length) {
    const head = document.createElement('div');
    head.className = 'pin-media-head';

    const meta = document.createElement('p');
    meta.className = 'pin-hint';
    meta.id = 'pinMeta';
    head.appendChild(meta);

    const sizeField = document.createElement('label');
    sizeField.className = 'pin-size-field';
    sizeField.htmlFor = 'pinSizes';
    const sizeLabel = document.createElement('span');
    sizeLabel.textContent = 'Size';
    const select = document.createElement('select');
    select.className = 'input';
    select.id = 'pinSizes';
    select.setAttribute('aria-label', 'Image size to preview and download');
    imageSizes.forEach(function (size, i) {
      const opt = document.createElement('option');
      opt.value = String(i);
      const dims = size.width ? size.width + '×' + (size.height || '?') : size.key;
      opt.textContent = size.key + ' — ' + dims + (i === 0 ? ' (best)' : '');
      select.appendChild(opt);
    });
    select.addEventListener('change', function () {
      activeImageIndex = Number(select.value) || 0;
      updateImage();
    });
    sizeField.appendChild(sizeLabel);
    sizeField.appendChild(select);
    head.appendChild(sizeField);

    const img = document.createElement('img');
    img.className = 'pin-image';
    img.id = 'pinImage';
    img.loading = 'lazy';
    img.alt = 'Pin image preview';

    const actions = document.createElement('div');
    actions.className = 'pin-media-actions';

    const download = document.createElement('button');
    download.className = 'btn btn-gold';
    download.type = 'button';
    download.id = 'pinDownload';
    download.textContent = 'Download image';
    const spinner = document.createElement('span');
    spinner.className = 'btn-spinner';
    spinner.setAttribute('aria-hidden', 'true');
    download.insertBefore(spinner, download.firstChild);
    download.addEventListener('click', downloadImage);

    const open = document.createElement('button');
    open.className = 'btn btn-outline';
    open.type = 'button';
    open.id = 'pinOpenImage';
    open.textContent = 'Open image';
    open.addEventListener('click', function () {
      const size = imageSizes[activeImageIndex];
      if (size) window.open(size.url, '_blank', 'noopener');
    });

    const copy = document.createElement('button');
    copy.className = 'btn btn-outline';
    copy.type = 'button';
    copy.id = 'pinCopyImage';
    copy.textContent = 'Copy image URL';
    copy.addEventListener('click', function () {
      const size = imageSizes[activeImageIndex];
      if (size) copyText(size.url, copy, 'Copy image URL');
    });

    actions.appendChild(download);
    actions.appendChild(open);
    actions.appendChild(copy);

    panel.appendChild(head);
    panel.appendChild(img);
    panel.appendChild(actions);
    updateImage();
  }

  if (isVideo) {
    const video = videoFiles.filter(function (f) { return /\.(mp4)(\?|$)/i.test(f.url); })[0];
    const videoActions = document.createElement('div');
    videoActions.className = 'pin-media-actions';

    const videoBtn = document.createElement('button');
    videoBtn.className = 'btn btn-outline';
    videoBtn.type = 'button';
    videoBtn.id = 'pinVideoBtn';
    videoBtn.textContent = 'Download video';
    const spinner = document.createElement('span');
    spinner.className = 'btn-spinner';
    spinner.setAttribute('aria-hidden', 'true');
    videoBtn.insertBefore(spinner, videoBtn.firstChild);
    videoBtn.addEventListener('click', downloadVideo);

    const openVideo = document.createElement('button');
    openVideo.className = 'btn btn-outline';
    openVideo.type = 'button';
    openVideo.textContent = 'Open video';
    openVideo.addEventListener('click', function () { window.open(video.url, '_blank', 'noopener'); });

    videoActions.appendChild(videoBtn);
    videoActions.appendChild(openVideo);
    panel.appendChild(videoActions);
  }

  panel.hidden = !panel.childElementCount;
}

function updateImage() {
  const img = $('pinImage');
  const size = imageSizes[activeImageIndex];
  if (!img || !size) return;
  img.removeAttribute('src');
  img.src = size.url;
  const dims = size.width ? size.width + '×' + (size.height || '?') + ' px' : 'original file';
  const meta = $('pinMeta');
  if (meta) meta.textContent = 'Full-resolution file straight from Pinterest\u2019s CDN \u2014 this ' + dims + ' image is what gets saved.';
}

/* ── Info loading ──────────────────────────────────────────────── */

function loadPinInfo(id) {
  imageSizes = [];
  videoFiles = [];
  fetch(INFO_BASE + id, { mode: 'cors', credentials: 'omit' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (payload) {
      if (currentId !== id || !payload) return;
      const info = (Array.isArray(payload.data) && typeof payload.data[0] === 'object') ? payload.data[0] : null;
      if (!info) return;
      imageSizes = collectImages(info);
      videoFiles = collectVideos(info);
      buildMediaPanel(info);
      applyMeta(info);
    })
    .catch(function () {
      showToast('Could not read the pin file list — use the embed preview to save');
    });
}

function applyMeta(info) {
  const name = info && info.pinner && info.pinner.full_name;
  if (!name) return;
  const head = $('pinMedia').querySelector('.pin-hint');
  if (head) head.textContent = head.textContent + ' · by ' + name;
}

/* ── Embed preview (unchanged behaviour) ───────────────────────── */

function render() {
  const parsed = parsePin($('pinUrl').value);
  if (!parsed.ok) {
    if (parsed.reason === 'empty') {
      renderError('');
    } else if (parsed.reason === 'shortlink') {
      renderError('pin.it short links can\'t be read in the browser. Open the pin once on Pinterest, copy the full pin link, and paste that here.');
    } else {
      renderError('Could not find a pin in that link. Paste a full Pinterest pin link, or just the pin number.');
    }
    currentId = null;
    return;
  }
  clearError();
  currentId = parsed.id;
  loadPinInfo(currentId);

  const stage = $('pinStage');
  const badge = $('pinBadge');
  const ds = document.getElementById('pinSave');
  stage.hidden = false;
  ds.hidden = true;

  $('openPin').href = PIN_BASE + currentId + '/';
  $('saveHint').textContent = PLATFORM_HINTS[detectPlatform()];
  badge.textContent = 'Pin ' + currentId;
  badge.hidden = false;

  const loader = $('pinLoader');
  loader.style.display = '';
  loader.classList.add('is-loading');

  const old = $('pinFrame');
  old.remove();

  const frame = document.createElement('iframe');
  frame.className = 'pin-frame';
  frame.id = 'pinFrame';
  frame.title = 'Pinterest pin preview';
  frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
  frame.setAttribute('allow', 'autoplay; fullscreen');
  frame.loading = 'eager';

  let settled = false;
  frame.addEventListener('load', function () {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    loader.classList.remove('is-loading');
    loader.style.display = 'none';
    ds.hidden = false;
    showToast('Pin loaded');
  });

  const timeout = setTimeout(function () {
    if (settled) return;
    settled = true;
    loader.classList.remove('is-loading');
    loader.style.display = 'none';
    ds.hidden = false;
    $('saveHint').textContent = 'Pinterest is taking a while — open the pin on Pinterest to view and save it there.';
    showToast('Pinterest did not respond — opened hint');
  }, LOAD_TIMEOUT_MS);

  frame.src = EMBED_BASE + '?id=' + currentId + '&src=oembed&width=600';
  stage.appendChild(frame);
}

function wire() {
  $('fFetch').addEventListener('click', render);
  $('fSample').addEventListener('click', function () {
    $('pinUrl').value = PIN_BASE + SAMPLE_ID + '/';
    render();
    showToast('Sample pin loaded');
  });
  $('pinUrl').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      render();
    }
  });
  $('pinUrl').addEventListener('input', clearError);
  $('copyPin').addEventListener('click', function () {
    if (!currentId) return;
    copyText(PIN_BASE + currentId + '/', $('copyPin'), 'Copy link');
  });
}

function init() {
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
