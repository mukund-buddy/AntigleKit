// ============================================================
// PDF Tools — Merge, Split, Info/Optimize
// Uses pdf-lib loaded from CDN.
// ============================================================

function $(id) { return document.getElementById(id); }

// Load pdf-lib from CDN on demand
let pdfLibReady = false;
async function ensurePdfLib() {
  if (pdfLibReady) return window.PDFLib;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
    s.onload = () => { pdfLibReady = true; resolve(window.PDFLib); };
    s.onerror = () => reject(new Error('Failed to load pdf-lib'));
    document.head.appendChild(s);
  });
}

function setupDropZone(id, cb) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('dragover'); });
  el.addEventListener('dragleave', () => el.classList.remove('dragover'));
  el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('dragover'); cb(e.dataTransfer.files); });
}

function formatBytes(b) { return b < 1024 ? b+' B' : (b/1024).toFixed(1)+' KB'; }

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─── Merge PDFs ───
let mergeFiles = [];

const mergePdf = {
  name: 'Merge PDFs', icon: '📎',
  render: () => `
    <div class="panel">
      <h2>Merge PDF Files</h2>
      <p class="desc">Combine multiple PDF files into one. All processing in your browser.</p>
      <div class="dropzone" id="m-drop">
        <div class="dropzone-icon">📄</div>
        <div>Click or drag PDF files here</div>
        <div style="font-size:.8rem;margin-top:4px">Multiple files supported</div>
      </div>
      <input type="file" id="m-input" accept=".pdf" multiple style="display:none" />
      <div class="file-list" id="m-files"></div>
      <div class="btn-group">
        <button class="btn btn-primary" onclick="mMerge()">🔗 Merge PDFs</button>
        <button class="btn btn-secondary" onclick="mClear()">Clear All</button>
      </div>
      <div id="m-status" style="margin-top:12px;font-size:.9rem;color:var(--text-2)"></div>
    </div>`,
  init: () => {
    mergeFiles = [];
    $('m-input').addEventListener('change', e => { mAddFiles(e.target.files); e.target.value=''; });
    $('m-drop').addEventListener('click', () => $('m-input').click());
    setupDropZone('m-drop', files => mAddFiles(files));
  }
};

window.mAddFiles = (files) => {
  for (const f of files) if (f.type==='application/pdf') mergeFiles.push(f);
  mRenderList();
};

function mRenderList() {
  $('m-files').innerHTML = mergeFiles.map((f,i) => `
    <div class="file-item">
      <span class="name">${f.name}</span>
      <span class="size">${formatBytes(f.size)}</span>
      <span class="remove" onclick="mRemove(${i})">✕</span>
    </div>`).join('');
}

window.mRemove = (i) => { mergeFiles.splice(i,1); mRenderList(); };
window.mClear = () => { mergeFiles = []; mRenderList(); $('m-status').textContent=''; };

window.mMerge = async () => {
  if (mergeFiles.length < 2) { $('m-status').textContent='⚠️ Add at least 2 PDF files.'; return; }
  try {
    $('m-status').textContent = '⏳ Merging…';
    const { PDFDocument } = await ensurePdfLib();
    const merged = await PDFDocument.create();
    for (const f of mergeFiles) {
      const bytes = await f.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const pages = await merged.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(p => merged.addPage(p));
    }
    const out = await merged.save();
    downloadBlob(new Blob([out],{type:'application/pdf'}), 'merged.pdf');
    $('m-status').textContent = `✅ Merged ${mergeFiles.length} files → merged.pdf`;
  } catch(e) { $('m-status').textContent = '❌ ' + e.message; }
};

// ─── Split PDF ───
let splitData = null, splitPageCount = 0;

const splitPdf = {
  name: 'Split PDF', icon: '✂️',
  render: () => `
    <div class="panel">
      <h2>Split PDF</h2>
      <p class="desc">Extract specific pages from a PDF. Enter page ranges like: 1-3, 5, 7-10</p>
      <div class="dropzone" id="s-drop">
        <div class="dropzone-icon">📄</div>
        <div>Click or drag a PDF file here</div>
      </div>
      <input type="file" id="s-input" accept=".pdf" style="display:none" />
      <div id="s-info" style="margin-top:12px;font-size:.9rem"></div>
      <div style="margin-top:16px">
        <label>Page Range</label>
        <input type="text" id="s-range" placeholder="1-3, 5, 7-10" />
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" onclick="sSplit()">✂️ Extract Pages</button>
      </div>
      <div id="s-status" style="margin-top:12px;font-size:.9rem;color:var(--text-2)"></div>
    </div>`,
  init: () => {
    splitData = null; splitPageCount = 0;
    $('s-input').addEventListener('change', e => { sLoad(e.target.files[0]); e.target.value=''; });
    $('s-drop').addEventListener('click', () => $('s-input').click());
    setupDropZone('s-drop', files => { if (files[0]) sLoad(files[0]); });
  }
};

async function sLoad(file) {
  if (!file) return;
  splitData = await file.arrayBuffer();
  try {
    const { PDFDocument } = await ensurePdfLib();
    const pdf = await PDFDocument.load(splitData);
    splitPageCount = pdf.getPageCount();
    $('s-info').innerHTML = `<strong>${file.name}</strong> — ${splitPageCount} pages (${formatBytes(file.size)})`;
  } catch(e) { $('s-info').textContent = '❌ Could not read PDF'; }
}

function parseRange(str, max) {
  const s = new Set();
  str.split(',').forEach(p => {
    p = p.trim();
    if (p.includes('-')) {
      const [a,b] = p.split('-').map(Number);
      for (let i=a; i<=Math.min(b,max); i++) s.add(i-1);
    } else {
      const n = parseInt(p);
      if (n>=1 && n<=max) s.add(n-1);
    }
  });
  return [...s].sort((a,b)=>a-b);
}

window.sSplit = async () => {
  if (!splitData) { $('s-status').textContent='⚠️ Load a PDF first.'; return; }
  const range = $('s-range').value.trim();
  if (!range) { $('s-status').textContent='⚠️ Enter a page range.'; return; }
  try {
    $('s-status').textContent = '⏳ Extracting…';
    const { PDFDocument } = await ensurePdfLib();
    const pdf = await PDFDocument.load(splitData);
    const pages = parseRange(range, splitPageCount);
    if (!pages.length) { $('s-status').textContent='⚠️ No valid pages in range.'; return; }
    const newPdf = await PDFDocument.create();
    const copied = await newPdf.copyPages(pdf, pages);
    copied.forEach(p => newPdf.addPage(p));
    const out = await newPdf.save();
    downloadBlob(new Blob([out],{type:'application/pdf'}), 'split.pdf');
    $('s-status').textContent = `✅ Extracted ${pages.length} pages → split.pdf`;
  } catch(e) { $('s-status').textContent = '❌ ' + e.message; }
};

// ─── PDF Info & Optimize ───
let infoData = null;

const pdfInfo = {
  name: 'PDF Info & Optimize', icon: '📦',
  render: () => `
    <div class="panel">
      <h2>PDF Information & Basic Optimization</h2>
      <p class="desc">View PDF metadata and attempt basic size optimization.</p>
      <div class="dropzone" id="i-drop">
        <div class="dropzone-icon">📄</div>
        <div>Click or drag a PDF file here</div>
      </div>
      <input type="file" id="i-input" accept=".pdf" style="display:none" />
      <div class="output" id="i-out" style="min-height:120px">Load a PDF to see its information…</div>
      <div class="btn-group">
        <button class="btn btn-primary" onclick="iOptimize()">📦 Optimize & Download</button>
      </div>
      <div id="i-status" style="margin-top:12px;font-size:.9rem;color:var(--text-2)"></div>
    </div>`,
  init: () => {
    infoData = null;
    $('i-input').addEventListener('change', e => { iLoad(e.target.files[0]); e.target.value=''; });
    $('i-drop').addEventListener('click', () => $('i-input').click());
    setupDropZone('i-drop', files => { if (files[0]) iLoad(files[0]); });
  }
};

async function iLoad(file) {
  if (!file) return;
  infoData = await file.arrayBuffer();
  try {
    const { PDFDocument } = await ensurePdfLib();
    const pdf = await PDFDocument.load(infoData);
    $('i-out').textContent =
      `File:      ${file.name}\n` +
      `Size:      ${formatBytes(file.size)}\n` +
      `Pages:     ${pdf.getPageCount()}\n` +
      `Title:     ${pdf.getTitle() || 'N/A'}\n` +
      `Author:    ${pdf.getAuthor() || 'N/A'}\n` +
      `Subject:   ${pdf.getSubject() || 'N/A'}\n` +
      `Creator:   ${pdf.getCreator() || 'N/A'}\n` +
      `Producer:  ${pdf.getProducer() || 'N/A'}`;
  } catch(e) { $('i-out').textContent = '❌ Could not read PDF: ' + e.message; }
}

window.iOptimize = async () => {
  if (!infoData) { $('i-status').textContent='⚠️ Load a PDF first.'; return; }
  try {
    $('i-status').textContent = '⏳ Optimizing…';
    const { PDFDocument } = await ensurePdfLib();
    const pdf = await PDFDocument.load(infoData, { ignoreEncryption: true });
    const out = await pdf.save();
    const orig = infoData.byteLength;
    downloadBlob(new Blob([out],{type:'application/pdf'}), 'optimized.pdf');
    $('i-status').textContent = `✅ ${formatBytes(orig)} → ${formatBytes(out.byteLength)} (saved ${formatBytes(orig-out.byteLength)})`;
  } catch(e) { $('i-status').textContent = '❌ ' + e.message; }
};

export const PdfTools = {
  tools: {
    'merge': mergePdf,
    'split': splitPdf,
    'info-optimize': pdfInfo,
  }
};
