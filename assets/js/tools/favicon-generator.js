/* favicon-generator.js — build a favicon SVG from a glyph, render PNGs
   at standard sizes, download. CSP-safe (Canvas + Blob, no third-party). */
import { faviconSvg, FAVICON_SIZES } from '../validate/design-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = '★';
const BGS = ['#7C6BFF', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
const EMOJI_CHOICES = ['★', '♥', '☀', '◆', '✿', '⚡', 'A', 'G', '✦', '♠', '●', '☾'];
const EMOJ_BG = ['#7C6BFF', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

function buildSvgText() {
  const glyph = $('favGlyph').value || EMPTY_GLYPH;
  const bg = $('favBg').value;
  return faviconSvg(glyph, bg, '#ffffff');
}

function render() {
  const glyph = $('favGlyph').value.trim();
  if (!glyph) {
    $('favPreview').textContent = '';
    $('favDetected').textContent = '';
    return;
  }
  $('favPreview').textContent = glyph;
  $('favPreview').style.backgroundColor = $('favBg').value;
  $('favPreview').style.color = '#ffffff';
  $('favDetected').textContent = glyph + ' → PNG favicons below.';
  updateSizes();
}

function updateSizes() {
  const list = $('favSizes');
  list.textContent = '';
  const glyph = $('favGlyph').value.trim() || EMPTY_GLYPH;
  const bg = $('favBg').value;
  const svg = faviconSvg(glyph, bg, '#ffffff');
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  FAVICON_SIZES.forEach(function (s) {
    const row = document.createElement('div');
    row.className = 'fav-size';
    const lbl = document.createElement('span');
    lbl.className = 'fav-size-label';
    lbl.textContent = s.size + 'px — ' + s.label;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-ghost';
    btn.textContent = 'Download PNG';
    btn.addEventListener('click', function () {
      exportPng(svg, s.size, s.label);
    });
    row.appendChild(lbl);
    row.appendChild(btn);
    list.appendChild(row);
  });
}

async function exportPng(svg, size, label) {
  const img = new Image();
  img.decoding = 'sync';
  await new Promise(function (resolve, reject) {
    img.onload = resolve;
    img.onerror = function () { reject(new Error('image failed')); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, size, size);
  const blob = await new Promise(function (resolve) { canvas.toBlob(function (b) { resolve(b); }, 'image/png'); });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = label.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + size + '.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
}

function wire() {
  $('favGlyph').addEventListener('input', render);
  $('favBg').addEventListener('input', render);
  $('fSample').addEventListener('click', function () {
    $('favGlyph').value = EMOJI_CHOICES[Math.floor(Math.random() * EMOJI_CHOICES.length)];
    $('favBg').value = EMOJ_BG[Math.floor(Math.random() * EMOJ_BG.length)];
    render();
  });
}

const EMPTY_GLYPH = '★';

function init() {
  render();
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}