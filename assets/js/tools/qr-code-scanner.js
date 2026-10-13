/* qr-code-scanner.js — decode a QR code from an uploaded image, locally.
   Image → canvas → grayscale → median threshold → grid sampling → qrDecode.
   CSP-safe. */
import { qrDecode } from '../validate/security-tools.js';
import { showToast } from '../components/tg-toast.js';

const $ = (id) => document.getElementById(id);

const MAX_WORK = 600;
const MAX_PREVIEW = 500;

function fitSize(w, h, max) {
  if (w <= max && h <= max) return { w: w, h: h };
  const scale = Math.min(max / w, max / h);
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
}

function grayscale(data, count) {
  const gray = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    const o = i * 4;
    const a = data[o + 3] / 255;
    const r = data[o] * a + 255 * (1 - a);
    const g = data[o + 1] * a + 255 * (1 - a);
    const b = data[o + 2] * a + 255 * (1 - a);
    gray[i] = (r * 0.299 + g * 0.587 + b * 0.114) | 0;
  }
  return gray;
}

/* Otsu: picks the split that maximises between-class variance. Falls back to
   the midpoint when the image is nearly flat. */
function otsuThreshold(gray) {
  const hist = new Uint32Array(256);
  let lo = 255, hi = 0;
  for (let i = 0; i < gray.length; i++) {
    const v = gray[i];
    hist[v]++;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (hi - lo < 16) return Math.max(1, ((lo + hi) >> 1) || 1);

  const total = gray.length;
  let sum = 0;
  for (let v = 0; v < 256; v++) sum += v * hist[v];

  let sumB = 0, wB = 0, best = 0, bestVar = -1;
  for (let v = 0; v < 256; v++) {
    wB += hist[v];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += v * hist[v];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > bestVar) { bestVar = between; best = v; }
  }
  return Math.max(1, best + 1);
}

function darkBounds(gray, width, height, thresh) {
  let minX = width, minY = height, maxX = -1, maxY = -1, dark = 0;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      if (gray[row + x] < thresh) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        dark++;
      }
    }
  }
  return { minX: minX, minY: minY, maxX: maxX, maxY: maxY, dark: dark };
}

/* Majority vote over a small window so single noisy pixels don't flip a module. */
function sampleModule(gray, width, height, cx, cy, radius, thresh) {
  let darkVotes = 0;
  let total = 0;
  for (let dy = -radius; dy <= radius; dy++) {
    const y = cy + dy;
    if (y < 0 || y >= height) continue;
    for (let dx = -radius; dx <= radius; dx++) {
      const x = cx + dx;
      if (x < 0 || x >= width) continue;
      total++;
      if (gray[y * width + x] < thresh) darkVotes++;
    }
  }
  if (!total) return false;
  return darkVotes * 2 > total;
}

/* Brute-force every QR version against the detected dark bounding box. */
function extractResult(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const gray = grayscale(imgData.data, width * height);
  const thresh = otsuThreshold(gray);
  const box = darkBounds(gray, width, height, thresh);

  if (box.maxX < 0 || box.maxY < 0 || box.dark < 40) {
    return { ok: false, error: 'No QR code found — the image looks blank or has too little contrast.' };
  }

  const boxW = box.maxX - box.minX + 1;
  const boxH = box.maxY - box.minY + 1;

  for (let v = 1; v <= 40; v++) {
    const modules = v * 4 + 17;
    const mw = boxW / modules;
    const mh = boxH / modules;
    if (mw < 1.5 || mh < 1.5) continue;

    const radius = Math.max(0, Math.min(2, Math.floor(Math.min(mw, mh) / 4)));
    const matrix = [];
    for (let r = 0; r < modules; r++) {
      const rowArr = new Array(modules);
      const sy = Math.floor(box.minY + (r + 0.5) * mh);
      for (let c = 0; c < modules; c++) {
        const sx = Math.floor(box.minX + (c + 0.5) * mw);
        rowArr[c] = sampleModule(gray, width, height, sx, sy, radius, thresh);
      }
      matrix.push(rowArr);
    }

    const res = qrDecode(matrix);
    if (res && res.ok) return res;
  }

  return { ok: false, error: 'Could not decode — try a clearer, straighter image of the QR code.' };
}

function showError(message) {
  const box = $('qsResultBox');
  $('qsOutput').textContent = message;
  $('qsMeta').textContent = '';
  box.hidden = false;
}

function showSuccess(res) {
  const box = $('qsResultBox');
  $('qsOutput').textContent = res.text;
  let meta = 'Version ' + res.version + ' · Level ' + res.level + ' · Mask ' + res.mask;
  if (res.corrected) meta += ' · corrected ' + res.corrected + ' errors';
  $('qsMeta').textContent = meta;
  box.hidden = false;
}

function drawPreview(img) {
  const canvas = $('qrPreview');
  const size = fitSize(img.naturalWidth || img.width, img.naturalHeight || img.height, MAX_PREVIEW);
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size.w, size.h);
  ctx.drawImage(img, 0, 0, size.w, size.h);
  canvas.hidden = false;
  $('qsPlaceholder').hidden = true;
}

function decodeImage(img) {
  const src = fitSize(img.naturalWidth || img.width, img.naturalHeight || img.height, MAX_WORK);
  const work = document.createElement('canvas');
  work.width = src.w;
  work.height = src.h;
  const wctx = work.getContext('2d', { willReadFrequently: true });
  wctx.fillStyle = '#ffffff';
  wctx.fillRect(0, 0, src.w, src.h);
  wctx.drawImage(img, 0, 0, src.w, src.h);
  return extractResult(wctx, src.w, src.h);
}

function scan() {
  const input = $('qsFile');
  const file = input.files && input.files[0];
  if (!file) {
    showToast('Choose an image first');
    return;
  }

  const reader = new FileReader();
  reader.onerror = function () {
    showError('That file could not be read. Try a different image.');
  };
  reader.onload = function () {
    const img = new Image();
    img.onerror = function () {
      showError('That file is not an image the browser can open.');
    };
    img.onload = function () {
      try {
        drawPreview(img);
        const res = decodeImage(img);
        if (res && res.ok) showSuccess(res);
        else showError((res && res.error) || 'Could not decode — try a clearer, straighter image of the QR code.');
      } catch (err) {
        showError('Could not read this image — try a clearer, straighter shot of the QR code.');
      }
    };
    img.src = String(reader.result);
  };

  try {
    reader.readAsDataURL(file);
  } catch (err) {
    showError('That file could not be read. Try a different image.');
  }
}

function reset() {
  const input = $('qsFile');
  input.value = '';
  $('qsFileInfo').textContent = '';
  $('qsResultBox').hidden = true;
  $('qsOutput').textContent = '';
  $('qsMeta').textContent = '';
  const canvas = $('qrPreview');
  canvas.hidden = true;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  $('qsPlaceholder').hidden = false;
}

function formatBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

function onFileChange() {
  const file = $('qsFile').files && $('qsFile').files[0];
  $('qsResultBox').hidden = true;
  if (!file) {
    $('qsFileInfo').textContent = '';
    return;
  }
  $('qsFileInfo').textContent = file.name + ' · ' + formatBytes(file.size);
  scan();
}

function wire() {
  $('qsFile').addEventListener('change', onFileChange);
  $('qsScan').addEventListener('click', scan);
  $('qsReset').addEventListener('click', reset);
}

function init() {
  try {
    wire();
  } catch (err) {
    /* page chrome stays usable even if the tool fails to wire */
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
