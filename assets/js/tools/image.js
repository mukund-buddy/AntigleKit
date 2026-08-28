// Image tools
import { $, download, setStatus } from '../util.js';

export const tools = {
  image: {
    desc: 'Convert, compress, resize and crop images — all in-browser.',
    render: () => `
      <label for="im-file">Image file</label><input type="file" id="im-file" accept="image/*" />
      <div class="row">
        <div><label for="im-fmt">Output format</label>
          <select id="im-fmt"><option>image/png</option><option>image/jpeg</option><option>image/webp</option></select></div>
        <div><label for="im-q">Quality (jpg/webp)</label><input type="number" id="im-q" value="85" min="10" max="100" /></div>
      </div>
      <div class="row">
        <div><label for="im-w">Width (px, blank = auto)</label><input type="number" id="im-w" placeholder="auto" min="1" /></div>
        <div><label for="im-h">Height (px, blank = auto)</label><input type="number" id="im-h" placeholder="auto" min="1" /></div>
        <div><label for="im-crop">Crop</label>
          <select id="im-crop"><option value="0">None</option><option value="1">Square</option><option value="1.3333">4:3</option><option value="1.7777">16:9</option></select></div>
      </div>
      <div class="btn-group"><button class="btn btn-primary" id="im-run">Process</button></div>
      <div class="output" id="im-out" style="margin-top:12px"></div>
      <div id="im-prev" style="margin-top:12px;display:flex;justify-content:center"></div>`,
    init: () => {
      const out = $('#im-out'), prev = $('#im-prev');
      $('#im-run').onclick = () => {
        const f = $('#im-file').files[0]; if (!f) { setStatus(out, '❌ select an image', 'err'); return; }
        set(out, '⏳ processing…');
        const url = URL.createObjectURL(f); const img = new Image();
        img.onerror = () => setStatus(out, '❌ could not read image', 'err');
        img.onload = () => {
          let sw = img.naturalWidth, sh = img.naturalHeight;
          const crop = parseFloat($('#im-crop').value);
          let cw = sw, ch = sh, ox = 0, oy = 0;
          if (crop > 0) {
            const ar = sw / sh;
            if (ar > crop) { cw = sh * crop; ch = sh; } else { cw = sw; ch = sw / crop; }
            ox = (sw - cw) / 2; oy = (sh - ch) / 2;
          }
          let dw = parseInt($('#im-w').value) || 0, dh = parseInt($('#im-h').value) || 0;
          if (!dw && !dh) { dw = Math.round(cw); dh = Math.round(ch); }
          else if (dw && !dh) dh = Math.round(dw * ch / cw);
          else if (!dw && dh) dw = Math.round(dh * cw / ch);
          const c = document.createElement('canvas'); c.width = dw; c.height = dh;
          c.getContext('2d').drawImage(img, ox, oy, cw, ch, 0, 0, dw, dh);
          const type = $('#im-fmt').value; const q = (type === 'image/png') ? undefined : (+$('#im-q').value) / 100;
          c.toBlob(b => {
            const a = document.createElement('a'); a.href = URL.createObjectURL(b);
            const ext = type.split('/')[1]; a.download = 'image.' + ext;
            prev.innerHTML = ''; const p = new Image(); p.src = a.href; p.style.maxWidth = '100%'; p.style.borderRadius = '12px'; prev.appendChild(p);
            download('image.' + ext, b);
            setStatus(out, `✅ ${dw}×${dh} ${ext.toUpperCase()} — ${(b.size / 1024).toFixed(1)} KB`, 'ok');
            URL.revokeObjectURL(url);
          }, type, q);
        };
        img.src = url;
      };
    },
  },
};
