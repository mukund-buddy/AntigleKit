/* pinterest-downloader.js — preview a Pinterest pin (image or video) in the
   official Pinterest embed, then guide the user to save it with the
   browser's own save menu. Pinterest's CDN does not send CORS headers and
   has no working JSONP, so a direct fetch+blob download is impossible from
   a static site; the embed is the lawful, server-free render. CSP-safe:
   DOM APIs + textContent; iframe from assets.pinterest.com (frame-src). */
import { showToast } from '../components/tg-toast.js';

const $ = (id) => document.getElementById(id);

const SAMPLE_ID = '617415430169271912';
const EMBED_BASE = 'https://assets.pinterest.com/ext/embed.html';
const PIN_BASE = 'https://www.pinterest.com/pin/';
const LOAD_TIMEOUT_MS = 12000;

let currentId = null;

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

function copyText(text, btn) {
  const done = function (ok) {
    btn.textContent = ok ? 'Copied!' : 'Copy failed';
    showToast(ok ? 'Link copied to clipboard' : 'Could not access clipboard');
    setTimeout(function () { btn.textContent = 'Copy link'; }, 1600);
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
    copyText(PIN_BASE + currentId + '/', $('copyPin'));
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