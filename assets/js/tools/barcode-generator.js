/* barcode-generator.js — encode text into Code 128 / Code 39 / EAN-13 /
   UPC-A bars and paint them on a canvas. CSP-safe. */
import { barcodeEncode, barcodeRuns, barcodeCaption, barcodeStats } from '../validate/barcode-tools.js';

const $ = (id) => document.getElementById(id);
let current = null;

function clearBarcode(message) {
  const canvas = $('bcCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = 0;
  canvas.height = 0;
  canvas.style.display = 'none';
  const ph = $('bcPlaceholder');
  ph.style.display = '';
  ph.textContent = message;
  $('bcDownload').disabled = true;
  current = null;
}

function draw() {
  const res = current;
  const canvas = $('bcCanvas');
  const total = res.modules.length + res.quietWidth * 2;
  const scale = Math.max(1, Math.min(3, Math.floor(520 / total)));
  const height = Math.max(24, parseInt($('bcHeight').value, 10) || 80);
  const showText = $('bcShowText').checked;
  const barH = showText ? Math.round(height * 0.8) : height;
  const capH = showText ? 22 : 0;

  canvas.width = total * scale;
  canvas.height = barH + capH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';
  let x = res.quietWidth * scale;
  barcodeRuns(res.modules).forEach(function (r) {
    if (r.on) ctx.fillRect(x, 0, r.width * scale, barH);
    x += r.width * scale;
  });
  if (showText) {
    ctx.fillStyle = '#000';
    ctx.font = '13px ui-monospace, Consolas, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(barcodeCaption(res), canvas.width / 2, barH + 16);
  }
  canvas.style.display = '';
  $('bcPlaceholder').style.display = 'none';
  $('bcDownload').disabled = false;

  const st = barcodeStats(res.modules, res.quietWidth);
  let meta = res.format + ' · ' + st.totalModules + ' modules wide';
  if (res.symbols) meta += ' · ' + res.symbols + ' symbols';
  $('bcMeta').textContent = meta + ' · drawn on your device';
}

function generate() {
  const text = $('bcInput').value;
  const format = $('bcFormat').value;
  const res = barcodeEncode(text, { format: format, checkDigit: $('bcCheck39').checked });
  const meta = $('bcMeta');

  if (!res || !res.ok) {
    const msg = (res && res.error) || 'Could not build a barcode from that input.';
    meta.className = 'bar-meta is-error';
    meta.textContent = msg;
    clearBarcode(msg);
    return;
  }

  current = res;
  meta.className = 'bar-meta';
  draw();
}

function download() {
  const canvas = $('bcCanvas');
  if (!canvas.width || !canvas.height) return;

  const save = (href, revoke) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = 'barcode-' + ($('bcFormat').value || 'code128') + '.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (revoke) setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  if (typeof canvas.toBlob === 'function') {
    canvas.toBlob(function (blob) {
      if (!blob) { save(canvas.toDataURL('image/png'), false); return; }
      save(URL.createObjectURL(blob), true);
    }, 'image/png');
  } else {
    save(canvas.toDataURL('image/png'), false);
  }
}

function wire() {
  $('bcGenerate').addEventListener('click', generate);
  $('bcDownload').addEventListener('click', download);
  $('bcHeight').addEventListener('input', function () {
    $('bcHeightVal').textContent = $('bcHeight').value;
    if (current) draw();
  });
  $('bcFormat').addEventListener('change', function () {
    if (current) generate();
  });
  $('bcShowText').addEventListener('change', function () {
    if (current) draw();
  });
  $('bcCheck39').addEventListener('change', function () {
    if (current) generate();
  });
  $('bcInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      generate();
    }
  });
}

function init() {
  $('bcHeightVal').textContent = $('bcHeight').value;
  wire();
  $('bcInput').value = 'ANTIGLEKIT-2026';
  generate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
