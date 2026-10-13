/* open-graph-generator.js — build Open Graph tags with a live card
   preview. CSP-safe. */
import { buildOpenGraph } from '../validate/web-tags.js';

const $ = (id) => document.getElementById(id);

function hostOf(url) {
  try { return new URL(url).host; } catch (_) { return 'yourdomain.example'; }
}

function render() {
  const t = {
    title: $('gTitle').value,
    description: $('gDesc').value,
    url: $('gUrl').value,
    image: $('gImage').value,
    type: $('gType').value,
    siteName: $('gSite').value
  };
  $('ogOut').textContent = buildOpenGraph(t);

  $('ogSite').textContent = t.siteName || hostOf(t.url);
  $('ogTitle').textContent = t.title || '—';
  const desc = t.description;
  $('ogDesc').textContent = desc ? (desc.length > 120 ? desc.slice(0, 120) + '…' : desc) : 'The card description appears here.';

  const imgBox = $('ogImg');
  imgBox.textContent = '';
  imgBox.classList.remove('og-card-img--has');
  if (t.image) {
    const img = document.createElement('img');
    img.src = t.image;
    img.alt = '';
    img.addEventListener('error', function () {
      if (img.parentNode) img.parentNode.removeChild(img);
      imgBox.textContent = 'Image could not be loaded here — it will still work in platform debuggers.';
      imgBox.classList.remove('og-card-img--has');
    });
    imgBox.appendChild(img);
    imgBox.classList.add('og-card-img--has');
  }

  const detected = $('ogDetected');
  const notes = [];
  if (!t.title) notes.push('Missing og:title.');
  if (!t.image) notes.push('No og:image — most platforms show a bare link card.');
  if (t.title && t.title.length > 90) notes.push('Card titles truncate around 90 characters.');
  if (desc && desc.length > 200) notes.push('Descriptions truncate around 200 characters.');
  detected.className = 'chk-detected' + (notes.length ? ' is-error' : '');
  detected.textContent = notes.length ? notes.join(' ') : 'Card looks complete — copy the tags into your page head.';
}

function wire() {
  $('fGenerate').addEventListener('click', render);
  ['gTitle', 'gDesc', 'gUrl', 'gType', 'gImage', 'gSite'].forEach(function (id) {
    $(id).addEventListener('input', render);
  });
  $('fSample').addEventListener('click', function () {
    $('gTitle').value = 'JSON Formatter — Free Online Tool | The Antigle';
    $('gDesc').value = 'Pretty-print, validate, and minify JSON right in your browser — no upload, no sign-up.';
    $('gUrl').value = 'https://example.com/tools/json-formatter/';
    $('gImage').value = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'%3E%3Crect width='100%25' height='100%25' fill='%235b8cff'/%3E%3Ctext x='48' y='340' font-family='sans-serif' font-size='44' fill='%23fff'%3Esocial.png preview 1200%C3%97630%3C/text%3E%3C/svg%3E";
    $('gType').value = 'website';
    $('gSite').value = 'The Antigle';
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