/* video-downloader.js — a small launcher that hands your link to cobalt.tools.
   No backend, no API key, no proxy: cobalt.tools is the free, open-source
   downloader that does the actual work, and it accepts a link straight from
   the URL fragment (so the download starts the moment the tab opens). */
import { showToast } from '../components/tg-toast.js';

const $ = (id) => document.getElementById(id);

const COBALT_URL = 'https://cobalt.tools/';

const SERVICES = [
  [/(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/i, 'YouTube'],
  [/tiktok\.com/i, 'TikTok'],
  [/instagram\.com/i, 'Instagram'],
  [/(?:twitter\.com|x\.com)/i, 'X / Twitter'],
  [/reddit\.com|redd\.it/i, 'Reddit'],
  [/facebook\.com|fb\.watch/i, 'Facebook'],
  [/vimeo\.com/i, 'Vimeo'],
  [/soundcloud\.com/i, 'SoundCloud'],
  [/pinterest\./i, 'Pinterest'],
  [/twitch\.tv/i, 'Twitch'],
  [/(?:bilibili\.com|b23\.tv)/i, 'Bilibili'],
  [/dailymotion\.com|dai\.ly/i, 'Dailymotion'],
  [/snapchat\.com/i, 'Snapchat'],
  [/bsky\.app/i, 'Bluesky'],
  [/tumblr\.com/i, 'Tumblr'],
  [/loom\.com/i, 'Loom'],
  [/streamable\.com/i, 'Streamable'],
  [/rutube\.ru/i, 'Rutube'],
  [/(?:vk\.com|vkvideo\.ru)/i, 'VK'],
  [/ok\.ru/i, 'Odnoklassniki'],
  [/newgrounds\.com/i, 'Newgrounds']
];

let els = {};

function detectService(url) {
  for (let i = 0; i < SERVICES.length; i++) {
    if (SERVICES[i][0].test(url)) return SERVICES[i][1];
  }
  return '';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function setStatus(msg, kind) {
  els.status.textContent = msg || '';
  els.status.classList.toggle('is-error', kind === 'error');
  els.status.classList.toggle('is-ok', kind === 'ok');
}

function readLink() {
  const url = els.url.value.trim();
  if (!url) { setStatus('Paste a link first.', 'error'); els.url.focus(); return ''; }
  if (!/^https?:\/\//i.test(url)) { setStatus('Links should start with http:// or https://', 'error'); return ''; }
  return url;
}

function prefillUrl(url) {
  return COBALT_URL + '#' + encodeURIComponent(url);
}

function openInCobalt() {
  const url = readLink();
  if (!url) return;
  setStatus('Opening cobalt.tools with your link…', 'ok');
  window.open(prefillUrl(url), '_blank', 'noopener');
}

async function copyLink() {
  const url = readLink();
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    showToast('Link copied — paste it into cobalt.tools');
  } catch (e) {
    showToast('Could not copy — select the link and copy manually');
  }
}

function renderServices() {
  if (!els.services) return;
  els.services.innerHTML = SERVICES.map(function (s) {
    return '<span class="vdl-chip">' + escapeHtml(s[1]) + '</span>';
  }).join('');
}

function wire() {
  els.open.addEventListener('click', openInCobalt);
  els.copy.addEventListener('click', copyLink);
  els.url.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); openInCobalt(); }
  });
  els.url.addEventListener('input', function () {
    setStatus('');
    const label = detectService(els.url.value.trim());
    els.detected.textContent = label ? 'Detected: ' + label : '';
  });
}

function init() {
  els = {
    url: $('vdlUrl'),
    detected: $('vdlDetected'),
    open: $('vdlOpen'),
    copy: $('vdlCopy'),
    status: $('vdlStatus'),
    services: $('vdlServices')
  };
  if (!els.open) return;
  renderServices();
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
