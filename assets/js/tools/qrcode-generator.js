/* qrcode-generator.js — encode text/URL to a QR matrix and paint it on canvas.
   CSP-safe. */
import { qrEncode } from '../validate/security-tools.js';

const $ = (id) => document.getElementById(id);
const SCALE = 10;

function drawQR(matrix) {
  const size = matrix.length;
  const margin = parseInt($('qrMargin').value, 10) || 0;
  const dim = (size + margin * 2) * SCALE;
  const canvas = $('qrCanvas');
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, dim, dim);
  ctx.fillStyle = '#000';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) ctx.fillRect((c + margin) * SCALE, (r + margin) * SCALE, SCALE, SCALE);
    }
  }
  canvas.style.display = '';
  $('qrPlaceholder').style.display = 'none';
  $('qrDownload').disabled = false;
}

function clearQR(message) {
  const canvas = $('qrCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = 0;
  canvas.height = 0;
  canvas.style.display = 'none';
  const ph = $('qrPlaceholder');
  ph.style.display = '';
  ph.textContent = message;
  $('qrDownload').disabled = true;
}

function generate() {
  const text = $('qrInput').value;
  const level = $('qrLevel').value;
  const res = qrEncode(text, { eccLevel: level });
  const meta = $('qrMeta');

  if (!res || !res.ok) {
    const msg = (res && res.error) || 'Could not build a QR code from that input.';
    meta.className = 'qr-meta is-error';
    meta.textContent = msg;
    clearQR(msg);
    return;
  }

  drawQR(res.matrix);
  meta.className = 'qr-meta';
  meta.textContent = res.size + ' × ' + res.size + ' modules · Level ' + res.level;
}

function download() {
  const canvas = $('qrCanvas');
  if (!canvas.width || !canvas.height) return;

  const save = (href, revoke) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = 'qrcode.png';
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
  $('qrGenerate').addEventListener('click', generate);
  $('qrDownload').addEventListener('click', download);
  $('qrLevel').addEventListener('change', function () {
    if (!$('qrDownload').disabled) generate();
  });
  $('qrMargin').addEventListener('input', function () {
    $('qrMarginVal').textContent = $('qrMargin').value;
    if (!$('qrDownload').disabled) generate();
  });
  $('qrInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      generate();
    }
  });
}

function init() {
  $('qrMarginVal').textContent = $('qrMargin').value;
  clearQR('QR code preview appears here');
  $('qrMeta').textContent = '';
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
