/* mc-title-studio.js — turn a photo into a Minecraft Bedrock full-screen
   title-screen resource pack (.mcpack). Everything runs in the browser:
   the image is cropped on a canvas, PNGs are encoded locally, and the
   .mcpack is assembled as a stored (uncompressed) ZIP in memory. */
import { showToast } from '../components/tg-toast.js';

const $ = (id) => document.getElementById(id);

const PRESETS = [
  { k: 'Auto', auto: true, w: 1920, h: 1080, n: 'Matched to your screen' },
  { k: '16:9', w: 1920, h: 1080, n: 'PC, laptop, TV, most tablets' },
  { k: '16:10', w: 1920, h: 1200, n: 'Some laptops and tablets' },
  { k: '2:1 (18:9)', w: 2160, h: 1080, n: 'Tall phones' },
  { k: '19.5:9', w: 2340, h: 1080, n: 'Newer iPhone and Android phones' },
  { k: '4:3', w: 1440, h: 1080, n: 'Older iPads' }
];
const OK_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 40 * 1024 * 1024;
const MAX_DIM = 16384;
const MIN_W = 320;
const MIN_H = 180;

let P = PRESETS[0];
let img = null;
let nw = 0;
let nh = 0;
let zoom = 1;
let objUrl = null;
let drag = null;
const box = { cx: 0, cy: 0, w: 0 };

let cv, ctx;

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { const t = b; b = a % b; a = t; }
  return a || 1;
}

function detectAuto() {
  const sw = Math.max(1, Math.round((window.screen && window.screen.width) || 1920));
  const sh = Math.max(1, Math.round((window.screen && window.screen.height) || 1080));
  const rw = Math.max(sw, sh);
  const rh = Math.min(sw, sh);
  const ratio = rw / rh;
  const g = gcd(rw, rh);
  const aw = Math.round(rw / g);
  const ah = Math.round(rh / g);
  const MAX = 4096;
  let h = 1080;
  let w = Math.round((h * ratio) / 2) * 2;
  if (w > MAX) { w = MAX; h = Math.max(2, Math.round((w / ratio) / 2) * 2); }
  return { w, h, ratio, label: aw + ':' + ah, res: sw + ' x ' + sh };
}

const boxH = () => (box.w * P.h) / P.w;
const maxW = () => (nw / nh >= P.w / P.h ? (nh * P.w) / P.h : nw);

function clamp() {
  const hw = box.w / 2;
  const hh = boxH() / 2;
  box.cx = Math.min(Math.max(box.cx, hw), nw - hw);
  box.cy = Math.min(Math.max(box.cy, hh), nh - hh);
}

function setZoom(z) {
  zoom = Math.min(Math.max(z, 0.15), 1);
  box.w = maxW() * zoom;
  clamp();
  if ($('mctsZoom')) $('mctsZoom').value = Math.round(zoom * 100);
  if ($('mctsZoomVal')) $('mctsZoomVal').textContent = Math.round(zoom * 100) + '%';
}

function resetBox() {
  box.cx = nw / 2;
  box.cy = nh / 2;
  setZoom(1);
}

/* ── Ratio select ───────────────────────────────────────────────── */
function buildPresets() {
  const sel = $('mctsRatio');
  if (!sel) return;
  sel.innerHTML = '';
  PRESETS.forEach((p, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = p.k + '  (' + p.w + ' x ' + p.h + ' px)';
    sel.appendChild(o);
  });
  sel.value = '0';
}

function refreshAuto() {
  const a = detectAuto();
  PRESETS[0].w = a.w;
  PRESETS[0].h = a.h;
  PRESETS[0].k = 'Auto (' + a.label + ')';
  PRESETS[0].n = 'Detected from your screen: ' + a.res + ' px';
  const sel = $('mctsRatio');
  if (sel && sel.options[0]) {
    sel.options[0].textContent = PRESETS[0].k + '  (' + a.w + ' x ' + a.h + ' px)';
  }
  const hint = $('mctsAutoHint');
  if (hint) hint.textContent = 'Detected screen: ' + a.label + ' (' + a.res + ')';
  if (P.auto && img) { P = Object.assign({}, PRESETS[0]); resetBox(); draw(); status(); }
}

/* ── Canvas draw ────────────────────────────────────────────────── */
function draw() {
  if (!img || !cv) return;
  const stage = $('mctsStage');
  const avail = Math.min((stage && stage.clientWidth ? stage.clientWidth : 800) - 40, 900);
  const sc = Math.min(avail / nw, 480 / nh);
  cv.width = Math.max(1, Math.round(nw * sc));
  cv.height = Math.max(1, Math.round(nh * sc));
  ctx.drawImage(img, 0, 0, cv.width, cv.height);
  ctx.fillStyle = 'rgba(8,10,16,.65)';
  ctx.fillRect(0, 0, cv.width, cv.height);
  const bw = box.w * sc;
  const bh = boxH() * sc;
  const bx = (box.cx - box.w / 2) * sc;
  const by = (box.cy - boxH() / 2) * sc;
  ctx.drawImage(img, box.cx - box.w / 2, box.cy - boxH() / 2, box.w, boxH(), bx, by, bw, bh);
  ctx.strokeStyle = 'rgba(255,255,255,.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < 3; i++) {
    ctx.moveTo(bx + (bw * i) / 3, by);
    ctx.lineTo(bx + (bw * i) / 3, by + bh);
    ctx.moveTo(bx, by + (bh * i) / 3);
    ctx.lineTo(bx + bw, by + (bh * i) / 3);
  }
  ctx.stroke();
  ctx.strokeStyle = '#FF3F10';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);
}

function status() {
  const el = $('mctsStat');
  if (!el) return;
  const ir = nw / nh;
  const r = P.w / P.h;
  const off = Math.abs(ir - r) / r;
  const L = [];
  let cls = 'callout callout--ok';
  if (off > 0.01) {
    cls = 'callout callout--warn';
    L.push('Your photo is ' + ir.toFixed(2) + ':1 but ' + P.k + ' needs ' + r.toFixed(2) + ':1. The crop box starts centred — drag it to pick the right area.');
  } else {
    L.push('Aspect ratio matches, so no cropping is needed. You can still shrink the box to tighten the framing.');
  }
  if (nw < P.w || nh < P.h) {
    cls = 'callout callout--warn';
    L.push('The photo is only ' + nw + ' x ' + nh + ' px but the target is ' + P.w + ' x ' + P.h + ' px. Use a larger image or it will look soft when upscaled.');
  } else if (box.w < P.w - 1) {
    cls = 'callout callout--warn';
    L.push('Crop area is ' + Math.round(box.w) + ' x ' + Math.round(boxH()) + ' px and the export is ' + P.w + ' x ' + P.h + ' px — a slight upscale. Enlarge the box for a sharper result.');
  }
  L.push('Export size: ' + P.w + ' x ' + P.h + ' px (PNG).');
  el.className = cls;
  el.textContent = L.join(' ');
}

function showErr(text) {
  const e = $('mctsErr');
  if (!e) return;
  e.textContent = text;
  e.hidden = false;
}

function hideErr() {
  const e = $('mctsErr');
  if (e) e.hidden = true;
}

/* ── Load a photo ───────────────────────────────────────────────── */
function load(file) {
  hideErr();
  const done = $('mctsDone');
  if (done) done.hidden = true;
  if (!file) return;
  if (OK_TYPES.indexOf(file.type) === -1) { showErr('Unsupported format. Choose a PNG, JPG, or WEBP image.'); return; }
  if (file.size > MAX_BYTES) { showErr('That image is too large (40 MB max). Pick a smaller file.'); return; }
  const u = URL.createObjectURL(file);
  const im = new Image();
  im.onload = () => {
    if (im.naturalWidth < MIN_W || im.naturalHeight < MIN_H) {
      URL.revokeObjectURL(u);
      showErr('That image is too small. It needs to be at least ' + MIN_W + ' x ' + MIN_H + ' px.');
      return;
    }
    if (im.naturalWidth > MAX_DIM || im.naturalHeight > MAX_DIM) {
      URL.revokeObjectURL(u);
      showErr('That image is too high-resolution (max ' + MAX_DIM + ' px per side). Resize it first.');
      return;
    }
    if (objUrl) URL.revokeObjectURL(objUrl);
    objUrl = u;
    img = im;
    nw = im.naturalWidth;
    nh = im.naturalHeight;
    const info = $('mctsFileInfo');
    if (info) info.textContent = file.name.slice(0, 60) + ' (' + nw + ' x ' + nh + ' px)';
    if (cv) cv.hidden = false;
    const empty = $('mctsEmpty');
    if (empty) empty.hidden = true;
    resetBox();
    draw();
    status();
  };
  im.onerror = () => { URL.revokeObjectURL(u); showErr('That image could not be opened. Try a different file.'); };
  im.src = u;
}

/* ── ZIP (stored, no compression) ───────────────────────────────── */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(b) {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(files) {
  const enc = new TextEncoder();
  const parts = [];
  const cen = [];
  let off = 0;
  const d = new Date();
  const tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  for (const f of files) {
    const n = enc.encode(f.name);
    const c = crc32(f.data);
    const s = f.data.length;
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true);
    h.setUint16(4, 20, true);
    h.setUint16(6, 0x0800, true);
    h.setUint16(8, 0, true);
    h.setUint16(10, tm, true);
    h.setUint16(12, dt, true);
    h.setUint32(14, c, true);
    h.setUint32(18, s, true);
    h.setUint32(22, s, true);
    h.setUint16(26, n.length, true);
    h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), n, f.data);
    const e = new DataView(new ArrayBuffer(46));
    e.setUint32(0, 0x02014b50, true);
    e.setUint16(4, 20, true);
    e.setUint16(6, 20, true);
    e.setUint16(8, 0x0800, true);
    e.setUint16(10, 0, true);
    e.setUint16(12, tm, true);
    e.setUint16(14, dt, true);
    e.setUint32(16, c, true);
    e.setUint32(20, s, true);
    e.setUint32(24, s, true);
    e.setUint16(28, n.length, true);
    e.setUint32(42, off, true);
    cen.push(new Uint8Array(e.buffer), n);
    off += 30 + n.length + s;
  }
  let cs = 0;
  for (const p of cen) cs += p.length;
  const z = new DataView(new ArrayBuffer(22));
  z.setUint32(0, 0x06054b50, true);
  z.setUint16(8, files.length, true);
  z.setUint16(10, files.length, true);
  z.setUint32(12, cs, true);
  z.setUint32(16, off, true);
  return new Blob([...parts, ...cen, new Uint8Array(z.buffer)], { type: 'application/octet-stream' });
}

function uuid() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 15) | 64;
  b[8] = (b[8] & 63) | 128;
  const h = Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');
  return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
}

const toBlob = (c) =>
  new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('PNG encoding failed'))), 'image/png'));
const bytesOf = async (b) => new Uint8Array(await b.arrayBuffer());

function triggerDownload(blob, name) {
  const u = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = u;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 15000);
}

/* ── Build the pack ─────────────────────────────────────────────── */
async function build() {
  const btn = $('mctsGo');
  const done = $('mctsDone');
  if (!img) { showErr('Add a photo first.'); return; }
  btn.disabled = true;
  if (done) done.hidden = true;
  try {
    const sx = box.cx - box.w / 2;
    const sy = box.cy - boxH() / 2;

    const c = document.createElement('canvas');
    c.width = P.w;
    c.height = P.h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = true;
    x.imageSmoothingQuality = 'high';
    x.drawImage(img, sx, sy, box.w, boxH(), 0, 0, P.w, P.h);

    const ic = document.createElement('canvas');
    ic.width = 256;
    ic.height = 256;
    const side = Math.min(box.w, boxH());
    const ix = box.cx - side / 2;
    const iy = box.cy - side / 2;
    const y = ic.getContext('2d');
    y.imageSmoothingEnabled = true;
    y.imageSmoothingQuality = 'high';
    y.drawImage(img, ix, iy, side, side, 0, 0, 256, 256);

    const raw = ($('mctsName').value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 40);
    const name = raw || 'Antigle Title Screen';
    const fn = name.replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'title_screen';

    const manifest = {
      format_version: 2,
      header: {
        name: name,
        description: 'Custom title screen background',
        uuid: uuid(),
        version: [1, 0, 0],
        min_engine_version: [1, 21, 0]
      },
      modules: [
        { type: 'resources', uuid: uuid(), version: [1, 0, 0], description: 'Custom title screen background' }
      ]
    };

    /* Full-screen title background: sit behind everything (layer -10) and
       overscan the root start_screen by 120px so notches and safe-area
       padding cannot leave bars on any display. */
    const ui = {
      namespace: 'start',
      mcts_fullscreen_image: {
        type: 'image',
        texture: 'textures/ui/mcts_background',
        layer: -10,
        anchor_from: 'center',
        anchor_to: 'center',
        size: ['100%c + 120px', '100%c + 120px']
      },
      start_screen: {
        modifications: [
          { array_name: 'controls', operation: 'insert_front', value: [{ 'full_bg_panel@start.mcts_fullscreen_image': {} }] }
        ]
      }
    };

    const enc = new TextEncoder();
    const blob = zip([
      { name: 'manifest.json', data: enc.encode(JSON.stringify(manifest, null, 2)) },
      { name: 'pack_icon.png', data: await bytesOf(await toBlob(ic)) },
      { name: 'ui/start_screen.json', data: enc.encode(JSON.stringify(ui, null, 2)) },
      { name: 'textures/ui/mcts_background.png', data: await bytesOf(await toBlob(c)) }
    ]);

    const mb = (blob.size / 1048576).toFixed(1);
    triggerDownload(blob, fn + '.mcpack');
    showToast('Downloading ' + fn + '.mcpack');
    if (done) {
      done.className = 'callout callout--ok';
      done.innerHTML = '<span>Done! <strong>' + fn + '.mcpack</strong> is downloading (' + mb +
        ' MB). Follow the install steps to activate it in Minecraft.</span>';
      done.hidden = false;
    }
  } catch (err) {
    showToast('Could not build the pack');
    if (done) {
      done.className = 'callout callout--danger';
      done.textContent = 'The pack could not be built: ' + (err && err.message ? err.message : 'unknown error') + '. Try again or use a smaller photo.';
      done.hidden = false;
    }
  } finally {
    btn.disabled = false;
  }
}

/* ── Wiring ─────────────────────────────────────────────────────── */
function wire() {
  cv = $('mctsCanvas');
  if (cv) ctx = cv.getContext('2d');

  buildPresets();
  const sel = $('mctsRatio');
  if (sel) {
    sel.addEventListener('change', () => {
      P = PRESETS[Number(sel.value)] || PRESETS[0];
      const hint = $('mctsAutoHint');
      if (hint && !P.auto) hint.textContent = P.n;
      if (img) { resetBox(); draw(); status(); }
    });
  }

  const file = $('mctsFile');
  if (file) file.addEventListener('change', (e) => load(e.target.files[0]));

  const drop = $('mctsDrop');
  if (drop) {
    ['dragenter', 'dragover'].forEach((t) =>
      drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('dropzone--over'); }));
    ['dragleave', 'drop'].forEach((t) =>
      drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('dropzone--over'); }));
    drop.addEventListener('drop', (e) => { if (e.dataTransfer && e.dataTransfer.files[0]) load(e.dataTransfer.files[0]); });
  }

  if (cv) {
    cv.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, y: e.clientY };
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
    });
    cv.addEventListener('pointermove', (e) => {
      if (!drag || !img) return;
      const k = nw / cv.getBoundingClientRect().width;
      box.cx += (e.clientX - drag.x) * k;
      box.cy += (e.clientY - drag.y) * k;
      drag = { x: e.clientX, y: e.clientY };
      clamp();
      draw();
      status();
    });
    const end = () => { drag = null; };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); setZoom(zoom * (e.deltaY > 0 ? 1.06 : 0.94)); draw(); status(); }, { passive: false });
    cv.addEventListener('keydown', (e) => {
      const s = nw * 0.01;
      let h = true;
      if (e.key === 'ArrowLeft') box.cx -= s;
      else if (e.key === 'ArrowRight') box.cx += s;
      else if (e.key === 'ArrowUp') box.cy -= s;
      else if (e.key === 'ArrowDown') box.cy += s;
      else if (e.key === '+' || e.key === '=') setZoom(zoom * 1.06);
      else if (e.key === '-') setZoom(zoom * 0.94);
      else h = false;
      if (h) { e.preventDefault(); clamp(); draw(); status(); }
    });
  }

  const z = $('mctsZoom');
  if (z) z.addEventListener('input', (e) => { setZoom(e.target.value / 100); draw(); status(); });

  const rst = $('mctsReset');
  if (rst) rst.addEventListener('click', () => { resetBox(); draw(); status(); });

  const go = $('mctsGo');
  if (go) go.addEventListener('click', build);

  window.addEventListener('resize', () => { if (img) draw(); });
  window.addEventListener('orientationchange', refreshAuto);

  refreshAuto();
}

function init() {
  if (!$('mctsCanvas')) return;
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
