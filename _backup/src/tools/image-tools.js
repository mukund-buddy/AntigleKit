// ============================================================
// Image Tools — Convert, Compress, Resize, Crop
// All client-side using Canvas API.
// ============================================================

function $(id) { return document.getElementById(id); }

function setupDropZone(id, cb) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('dragover'); });
  el.addEventListener('dragleave', () => el.classList.remove('dragover'));
  el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('dragover'); cb(e.dataTransfer.files); });
}

function formatBytes(b) { return b < 1024 ? b+' B' : (b/1024).toFixed(1)+' KB'; }

function downloadCanvas(canvas, name, type, quality) {
  canvas.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }, type, quality);
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function drawToCanvas(img, maxW = 800) {
  const canvas = document.createElement('canvas');
  let w = img.naturalWidth, h = img.naturalHeight;
  if (w > maxW) { h = h * maxW / w; w = maxW; }
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(img, 0, 0, w, h);
  return canvas;
}

function previewCanvas(canvas, containerId, info) {
  const el = $(containerId);
  el.innerHTML = '';
  const c2 = document.createElement('canvas');
  c2.width = canvas.width; c2.height = canvas.height;
  c2.getContext('2d').drawImage(canvas, 0, 0);
  c2.style.cssText = 'max-width:100%;border-radius:8px;border:1px solid var(--border);';
  el.appendChild(c2);
  if (info) {
    const d = document.createElement('div');
    d.style.cssText = 'font-size:.85rem;color:var(--text-2);margin-top:8px;';
    d.textContent = info;
    el.appendChild(d);
  }
  return c2;
}

// ─── Image Converter ───
let convCanvas = null;

const imgConverter = {
  name: 'Image Converter', icon: '🔄',
  render: () => `
    <div class="panel">
      <h2>Image Format Converter</h2>
      <p class="desc">Convert images between JPEG, PNG, and WebP. Supports drag & drop.</p>
      <div class="dropzone" id="c-drop">
        <div class="dropzone-icon">🖼️</div>
        <div>Click or drag an image here</div>
        <div style="font-size:.8rem;margin-top:4px">JPEG, PNG, WebP, GIF, BMP</div>
      </div>
      <input type="file" id="c-input" accept="image/*" style="display:none" />
      <div id="c-preview"></div>
      <div id="c-controls" style="margin-top:16px;display:none">
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
          <div><label>Output Format</label><select id="c-fmt"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></div>
          <div><label>Quality (JPEG/WebP)</label><input type="number" id="c-qual" value="92" min="1" max="100" style="width:80px" /></div>
          <button class="btn btn-primary" onclick="cConvert()">Convert & Download</button>
        </div>
      </div>
      <div id="c-status" style="margin-top:12px;font-size:.9rem;color:var(--text-2)"></div>
    </div>`,
  init: () => {
    convCanvas = null;
    $('c-input').addEventListener('change', e => { cLoad(e.target.files[0]); e.target.value=''; });
    $('c-drop').addEventListener('click', () => $('c-input').click());
    setupDropZone('c-drop', files => { if (files[0]) cLoad(files[0]); });
  }
};

async function cLoad(file) {
  if (!file) return;
  const img = await loadImage(file);
  convCanvas = drawToCanvas(img);
  previewCanvas(convCanvas, 'c-preview', `${img.naturalWidth}×${img.naturalHeight}px — ${formatBytes(file.size)}`);
  $('c-controls').style.display = 'block';
}

window.cConvert = () => {
  if (!convCanvas) return;
  const fmt = $('c-fmt').value;
  const qual = parseInt($('c-qual').value)/100;
  const ext = fmt.includes('jpeg') ? 'jpg' : fmt.split('/')[1];
  downloadCanvas(convCanvas, `converted.${ext}`, fmt, qual);
  $('c-status').textContent = '✅ Image converted and downloaded!';
};

// ─── Image Compressor ───
let compCanvas = null;

const imgCompressor = {
  name: 'Image Compressor', icon: '📦',
  render: () => `
    <div class="panel">
      <h2>Image Compressor</h2>
      <p class="desc">Reduce image file size by adjusting quality. Great for web optimization.</p>
      <div class="dropzone" id="cp-drop">
        <div class="dropzone-icon">🖼️</div>
        <div>Click or drag an image here</div>
      </div>
      <input type="file" id="cp-input" accept="image/*" style="display:none" />
      <div id="cp-preview"></div>
      <div id="cp-controls" style="margin-top:16px;display:none">
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
          <div style="flex:1;min-width:200px"><label>Quality: <span id="cp-qv">75%</span></label><input type="range" id="cp-q" min="1" max="100" value="75" oninput="$('cp-qv').textContent=this.value+'%'" /></div>
          <button class="btn btn-primary" onclick="cpCompress()">Compress & Download</button>
        </div>
      </div>
      <div id="cp-status" style="margin-top:12px;font-size:.9rem;color:var(--text-2)"></div>
    </div>`,
  init: () => {
    compCanvas = null;
    $('cp-input').addEventListener('change', e => { cpLoad(e.target.files[0]); e.target.value=''; });
    $('cp-drop').addEventListener('click', () => $('cp-input').click());
    setupDropZone('cp-drop', files => { if (files[0]) cpLoad(files[0]); });
  }
};

async function cpLoad(file) {
  if (!file) return;
  const img = await loadImage(file);
  compCanvas = drawToCanvas(img, 1200);
  previewCanvas(compCanvas, 'cp-preview', `${img.naturalWidth}×${img.naturalHeight}px — ${formatBytes(file.size)}`);
  $('cp-controls').style.display = 'block';
  $('cp-status').textContent = `Original: ${formatBytes(file.size)}`;
}

window.cpCompress = () => {
  if (!compCanvas) return;
  const q = parseInt($('cp-q').value)/100;
  downloadCanvas(compCanvas, 'compressed.jpg', 'image/jpeg', q);
  $('cp-status').textContent = '✅ Compressed and downloaded!';
};

// ─── Image Resizer ───
let resCanvas = null, resOrigW = 0, resOrigH = 0;

const imgResizer = {
  name: 'Image Resizer', icon: '📐',
  render: () => `
    <div class="panel">
      <h2>Image Resizer</h2>
      <p class="desc">Resize images by exact pixels, percentage, or social media presets.</p>
      <div class="dropzone" id="r-drop">
        <div class="dropzone-icon">🖼️</div>
        <div>Click or drag an image here</div>
      </div>
      <input type="file" id="r-input" accept="image/*" style="display:none" />
      <div id="r-preview"></div>
      <div id="r-controls" style="margin-top:16px;display:none">
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
          <div><label>Width</label><input type="number" id="r-w" min="1" max="10000" oninput="rAutoH()" style="width:100px" /></div>
          <div><label>Height</label><input type="number" id="r-h" min="1" max="10000" oninput="rAutoW()" style="width:100px" /></div>
          <label style="margin:0;display:flex;align-items:center;gap:4px"><input type="checkbox" id="r-lock" checked> Lock ratio</label>
          <div><label>Preset</label><select id="r-preset" onchange="rPreset()"><option value="">Custom</option><option value="1920,1080">Full HD</option><option value="1280,720">HD</option><option value="1080,1080">Instagram</option><option value="1200,630">OG Image</option><option value="800,600">Thumbnail</option></select></div>
          <button class="btn btn-primary" onclick="rResize()">Resize & Download</button>
        </div>
      </div>
      <div id="r-status" style="margin-top:12px;font-size:.9rem;color:var(--text-2)"></div>
    </div>`,
  init: () => {
    resCanvas = null; resOrigW = 0; resOrigH = 0;
    $('r-input').addEventListener('change', e => { rLoad(e.target.files[0]); e.target.value=''; });
    $('r-drop').addEventListener('click', () => $('r-input').click());
    setupDropZone('r-drop', files => { if (files[0]) rLoad(files[0]); });
  }
};

async function rLoad(file) {
  if (!file) return;
  const img = await loadImage(file);
  resCanvas = drawToCanvas(img);
  resOrigW = img.naturalWidth; resOrigH = img.naturalHeight;
  previewCanvas(resCanvas, 'r-preview', `${resOrigW}×${resOrigH}px — ${formatBytes(file.size)}`);
  $('r-w').value = resOrigW;
  $('r-h').value = resOrigH;
  $('r-controls').style.display = 'block';
}

window.rAutoH = () => { if ($('r-lock').checked && resOrigW) $('r-h').value = Math.round(parseInt($('r-w').value||0)*resOrigH/resOrigW); };
window.rAutoW = () => { if ($('r-lock').checked && resOrigH) $('r-w').value = Math.round(parseInt($('r-h').value||0)*resOrigW/resOrigH); };
window.rPreset = () => { const v=$('r-preset').value; if(v){const [w,h]=v.split(',').map(Number); $('r-w').value=w; $('r-h').value=h;} };

window.rResize = () => {
  if (!resCanvas) return;
  const w = parseInt($('r-w').value), h = parseInt($('r-h').value);
  if (!w||!h) return;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(resCanvas, 0, 0, w, h);
  downloadCanvas(c, 'resized.png', 'image/png');
  $('r-status').textContent = `✅ Resized to ${w}×${h}px`;
};

// ─── Image Cropper ───
let cropCanvas = null, cropOrigW = 0, cropOrigH = 0;

const imgCropper = {
  name: 'Image Cropper', icon: '✂️',
  render: () => `
    <div class="panel">
      <h2>Image Cropper</h2>
      <p class="desc">Crop images with aspect ratio presets and precise pixel control.</p>
      <div class="dropzone" id="cr-drop">
        <div class="dropzone-icon">🖼️</div>
        <div>Click or drag an image here</div>
      </div>
      <input type="file" id="cr-input" accept="image/*" style="display:none" />
      <div id="cr-preview"></div>
      <div id="cr-controls" style="margin-top:16px;display:none">
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
          <div><label>X</label><input type="number" id="cr-x" value="0" min="0" style="width:80px" /></div>
          <div><label>Y</label><input type="number" id="cr-y" value="0" min="0" style="width:80px" /></div>
          <div><label>Width</label><input type="number" id="cr-w" min="1" style="width:80px" /></div>
          <div><label>Height</label><input type="number" id="cr-h" min="1" style="width:80px" /></div>
          <div><label>Ratio</label><select id="cr-ratio" onchange="crRatio()"><option value="">Free</option><option value="1">1:1</option><option value="1.777">16:9</option><option value="1.333">4:3</option><option value="1.5">3:2</option></select></div>
          <button class="btn btn-primary" onclick="crCrop()">Crop & Download</button>
        </div>
      </div>
      <div id="cr-status" style="margin-top:12px;font-size:.9rem;color:var(--text-2)"></div>
    </div>`,
  init: () => {
    cropCanvas = null; cropOrigW = 0; cropOrigH = 0;
    $('cr-input').addEventListener('change', e => { crLoad(e.target.files[0]); e.target.value=''; });
    $('cr-drop').addEventListener('click', () => $('cr-input').click());
    setupDropZone('cr-drop', files => { if (files[0]) crLoad(files[0]); });
  }
};

async function crLoad(file) {
  if (!file) return;
  const img = await loadImage(file);
  cropCanvas = drawToCanvas(img);
  cropOrigW = img.naturalWidth; cropOrigH = img.naturalHeight;
  previewCanvas(cropCanvas, 'cr-preview', `${cropOrigW}×${cropOrigH}px — ${formatBytes(file.size)}`);
  $('cr-w').value = cropCanvas.width;
  $('cr-h').value = cropCanvas.height;
  $('cr-controls').style.display = 'block';
}

window.crRatio = () => {
  const r = parseFloat($('cr-ratio').value);
  if (r) $('cr-h').value = Math.round(parseInt($('cr-w').value) / r);
};

window.crCrop = () => {
  if (!cropCanvas) return;
  const x = parseInt($('cr-x').value)||0;
  const y = parseInt($('cr-y').value)||0;
  const w = parseInt($('cr-w').value);
  const h = parseInt($('cr-h').value);
  if (!w||!h) return;
  const scaleX = cropOrigW / cropCanvas.width;
  const scaleY = cropOrigH / cropCanvas.height;
  const c = document.createElement('canvas');
  c.width = Math.round(w * scaleX);
  c.height = Math.round(h * scaleY);
  c.getContext('2d').drawImage(cropCanvas, x, y, w, h, 0, 0, c.width, c.height);
  downloadCanvas(c, 'cropped.png', 'image/png');
  $('cr-status').textContent = `✅ Cropped to ${c.width}×${c.height}px`;
};

export const ImageTools = {
  tools: {
    'converter': imgConverter,
    'compressor': imgCompressor,
    'resizer': imgResizer,
    'cropper': imgCropper,
  }
};
