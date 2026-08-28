// Design & Colour tools — AntigleKit
import { $, download, setStatus } from '../util.js';

function set(id, msg, kind) { setStatus($(id), msg, kind); }

/* ═══════════════════════════════════════════
   COLOUR HELPERS
   ═══════════════════════════════════════════ */

function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r, g, b) { return '#' + [r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join(''); }
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}
function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; } else {
    const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1/6) return p + (q - p) * 6 * t; if (t < 1/2) return q; if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p; };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function rgbToOklch(r, g, b) {
  // Simplified OKLCH via OKLab
  let [lr, lg, lb] = [r, g, b].map(c => { c /= 255; return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92; });
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const lc = Math.cbrt(l), mc = Math.cbrt(m), sc = Math.cbrt(s);
  const L = 0.2104542553 * lc + 0.7936177850 * mc - 0.0040720468 * sc;
  const a = 1.9779984951 * lc - 2.4285922050 * mc + 0.4505937099 * sc;
  const b2 = 0.0259040371 * lc + 0.7827717662 * mc - 0.8086757660 * sc;
  const C = Math.sqrt(a * a + b2 * b2);
  let H = Math.atan2(b2, a) * 180 / Math.PI;
  if (H < 0) H += 360;
  return [Math.round(L * 1000) / 1000, Math.round(C * 1000) / 1000, Math.round(H)];
}

/* ═══════════════════════════════════════════
   TOOL REGISTRATION
   ═══════════════════════════════════════════ */

export const tools = {
  /* ── Colour Converter ── */
  colour: {
    desc: 'Convert between HEX, RGB, HSL, and OKLCH colour formats instantly.',
    render: () => `
      <label for="cc-hex">HEX</label>
      <div style="display:flex;gap:8px;align-items:center">
        <input type="color" id="cc-pick" value="#7a1cac" style="width:48px;height:44px;border:none;cursor:pointer" />
        <input type="text" id="cc-hex" value="#7a1cac" placeholder="#rrggbb" style="flex:1" />
      </div>
      <div class="row">
        <div><label for="cc-r">RGB R</label><input type="number" id="cc-r" value="122" min="0" max="255" /></div>
        <div><label for="cc-g">G</label><input type="number" id="cc-g" value="28" min="0" max="255" /></div>
        <div><label for="cc-b">B</label><input type="number" id="cc-b" value="172" min="0" max="255" /></div>
      </div>
      <div class="row">
        <div><label for="cc-h">HSL H</label><input type="number" id="cc-h" value="280" min="0" max="360" /></div>
        <div><label for="cc-s">S%</label><input type="number" id="cc-s" value="72" min="0" max="100" /></div>
        <div><label for="cc-l">L%</label><input type="number" id="cc-l" value="39" min="0" max="100" /></div>
      </div>
      <div class="row">
        <div><label for="cc-okl">OKLCH L</label><input type="number" id="cc-okl" step="0.001" /></div>
        <div><label for="cc-okc">C</label><input type="number" id="cc-okc" step="0.001" /></div>
        <div><label for="cc-okh">H</label><input type="number" id="cc-okh" step="0.1" /></div>
      </div>
      <div style="margin-top:12px;padding:16px;border-radius:var(--r-md);border:1px solid var(--border)" id="cc-preview">Preview</div>
      <div class="btn-group">
        <button class="btn btn-ghost" id="cc-copy-hex">Copy HEX</button>
        <button class="btn btn-ghost" id="cc-copy-rgb">Copy RGB</button>
        <button class="btn btn-ghost" id="cc-copy-hsl">Copy HSL</button>
        <button class="btn btn-ghost" id="cc-copy-oklch">Copy OKLCH</button>
      </div>`,
    init: () => {
      const fromHex = () => {
        try {
          const [r, g, b] = hexToRgb($('#cc-hex').value);
          $('#cc-r').value = r; $('#cc-g').value = g; $('#cc-b').value = b;
          const [h, s, l] = rgbToHsl(r, g, b);
          $('#cc-h').value = h; $('#cc-s').value = s; $('#cc-l').value = l;
          const [okl, okc, okh] = rgbToOklch(r, g, b);
          $('#cc-okl').value = okl; $('#cc-okc').value = okc; $('#cc-okh').value = okh;
          $('#cc-pick').value = $('#cc-hex').value;
          $('#cc-preview').style.background = $('#cc-hex').value;
          $('#cc-preview').style.color = l > 50 ? '#000' : '#fff';
          $('#cc-preview').textContent = `Sample — ${$('#cc-hex').value}`;
        } catch {}
      };
      const fromRgb = () => {
        const r = +$('#cc-r').value, g = +$('#cc-g').value, b = +$('#cc-b').value;
        $('#cc-hex').value = rgbToHex(r, g, b);
        const [h, s, l] = rgbToHsl(r, g, b);
        $('#cc-h').value = h; $('#cc-s').value = s; $('#cc-l').value = l;
        const [okl, okc, okh] = rgbToOklch(r, g, b);
        $('#cc-okl').value = okl; $('#cc-okc').value = okc; $('#cc-okh').value = okh;
        $('#cc-pick').value = rgbToHex(r, g, b);
        $('#cc-preview').style.background = rgbToHex(r, g, b);
        $('#cc-preview').style.color = l > 50 ? '#000' : '#fff';
        $('#cc-preview').textContent = `Sample — ${rgbToHex(r, g, b)}`;
      };
      const fromHsl = () => {
        const [r, g, b] = hslToRgb(+$('cc-h').value, +$('#cc-s').value, +$('#cc-l').value);
        $('#cc-hex').value = rgbToHex(r, g, b);
        $('#cc-r').value = r; $('#cc-g').value = g; $('#cc-b').value = b;
        const [okl, okc, okh] = rgbToOklch(r, g, b);
        $('#cc-okl').value = okl; $('#cc-okc').value = okc; $('#cc-okh').value = okh;
        $('#cc-pick').value = rgbToHex(r, g, b);
        $('#cc-preview').style.background = rgbToHex(r, g, b);
        $('#cc-preview').style.color = +$('#cc-l').value > 50 ? '#000' : '#fff';
        $('#cc-preview').textContent = `Sample — ${rgbToHex(r, g, b)}`;
      };
      $('#cc-hex').addEventListener('input', fromHex);
      $('#cc-pick').addEventListener('input', () => { $('#cc-hex').value = $('#cc-pick').value; fromHex(); });
      ['cc-r', 'cc-g', 'cc-b'].forEach(id => document.getElementById(id).addEventListener('input', fromRgb));
      ['cc-h', 'cc-s', 'cc-l'].forEach(id => document.getElementById(id).addEventListener('input', fromHsl));
      $('#cc-copy-hex').onclick = () => { navigator.clipboard.writeText($('#cc-hex').value); };
      $('#cc-copy-rgb').onclick = () => { navigator.clipboard.writeText(`rgb(${$('#cc-r').value}, ${$('#cc-g').value}, ${$('#cc-b').value})`); };
      $('#cc-copy-hsl').onclick = () => { navigator.clipboard.writeText(`hsl(${$('#cc-h').value}, ${$('#cc-s').value}%, ${$('#cc-l').value}%)`); };
      $('#cc-copy-oklch').onclick = () => { navigator.clipboard.writeText(`oklch(${$('#cc-okl').value} ${$('#cc-okc').value} ${$('#cc-okh').value})`); };
      fromHex();
    },
  },

  /* ── Palette Generator ── */
  palette: {
    desc: 'Generate harmonious colour palettes from a base colour.',
    render: () => `
      <label for="pg-base">Base colour</label>
      <div style="display:flex;gap:8px;align-items:center">
        <input type="color" id="pg-base" value="#7a1cac" style="width:48px;height:44px;border:none;cursor:pointer" />
        <input type="text" id="pg-hex" value="#7a1cac" style="flex:1" />
      </div>
      <label for="pg-mode">Harmony</label>
      <select id="pg-mode">
        <option value="analogous">Analogous</option>
        <option value="complementary">Complementary</option>
        <option value="triadic">Triadic</option>
        <option value="split">Split-Complementary</option>
        <option value="monochromatic">Monochromatic</option>
      </select>
      <div class="btn-group"><button class="btn btn-primary" id="pg-gen">Generate</button></div>
      <div id="pg-out" style="display:flex;gap:0;border-radius:var(--r-md);overflow:hidden;margin-top:12px;min-height:80px"></div>
      <div class="output" id="pg-css" style="margin-top:8px"></div>`,
    init: () => {
      const gen = () => {
        const hex = $('#pg-hex').value;
        const [r, g, b] = hexToRgb(hex);
        const [h, s, l] = rgbToHsl(r, g, b);
        const mode = $('#pg-mode').value;
        let hues = [];
        if (mode === 'analogous') hues = [h - 30, h - 15, h, h + 15, h + 30];
        else if (mode === 'complementary') hues = [h, h + 30, h + 180, h + 210, h];
        else if (mode === 'triadic') hues = [h, h + 120, h + 240];
        else if (mode === 'split') hues = [h, h + 150, h + 210];
        else if (mode === 'monochromatic') hues = [h, h, h, h, h];
        const palette = hues.map((hu, i) => {
          const li = mode === 'monochromatic' ? Math.max(10, Math.min(90, l - 30 + i * 15)) : l;
          const [pr, pg, pb] = hslToRgb(((hu % 360) + 360) % 360, s, li);
          return rgbToHex(pr, pg, pb);
        });
        const unique = [...new Set(palette)];
        $('#pg-out').innerHTML = unique.map(c => `<div style="flex:1;height:80px;background:${c};display:flex;align-items:flex-end;justify-content:center;padding:4px"><span style="font-size:11px;color:${+rgbToHsl(...hexToRgb(c))[2] > 50 ? '#000' : '#fff'};background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px">${c}</span></div>`).join('');
        $('#pg-css').textContent = `palette: ${unique.join(', ')};`;
      };
      $('#pg-base').addEventListener('input', () => { $('#pg-hex').value = $('#pg-base').value; });
      $('#pg-hex').addEventListener('input', () => { $('#pg-base').value = $('#pg-hex').value; });
      $('#pg-gen').addEventListener('click', gen);
      gen();
    },
  },

  /* ── Gradient Generator ── */
  gradient: {
    desc: 'Create CSS linear, radial, and conic gradients visually.',
    render: () => `
      <div class="row">
        <div><label for="gr-type">Type</label>
          <select id="gr-type"><option value="linear">Linear</option><option value="radial">Radial</option><option value="conic">Conic</option></select></div>
        <div><label for="gr-angle">Angle (linear)</label><input type="number" id="gr-angle" value="135" min="0" max="360" /></div>
      </div>
      <div class="row">
        <div><label>Colour 1</label><input type="color" id="gr-c1" value="#7a1cac" /></div>
        <div><label>Colour 2</label><input type="color" id="gr-c2" value="#ad49e1" /></div>
        <div><label>Colour 3</label><input type="color" id="gr-c3" value="#ebd3f8" /></div>
      </div>
      <div id="gr-preview" style="height:120px;border-radius:var(--r-md);border:1px solid var(--border);margin:12px 0"></div>
      <div class="btn-group">
        <button class="btn btn-primary" id="gr-copy">Copy CSS</button>
        <button class="btn btn-secondary" id="gr-gen">Regenerate</button>
      </div>
      <div class="output" id="gr-css"></div>`,
    init: () => {
      const gen = () => {
        const type = $('#gr-type').value;
        const c1 = $('#gr-c1').value, c2 = $('#gr-c2').value, c3 = $('#gr-c3').value;
        let css;
        if (type === 'linear') css = `linear-gradient(${$('#gr-angle').value}deg, ${c1}, ${c2}, ${c3})`;
        else if (type === 'radial') css = `radial-gradient(circle, ${c1}, ${c2}, ${c3})`;
        else css = `conic-gradient(from ${$('#gr-angle').value}deg, ${c1}, ${c2}, ${c3}, ${c1})`;
        $('#gr-preview').style.background = css;
        $('#gr-css').textContent = `background: ${css};`;
      };
      ['gr-c1', 'gr-c2', 'gr-c3', 'gr-angle', 'gr-type'].forEach(id => document.getElementById(id).addEventListener('input', gen));
      $('#gr-gen').addEventListener('click', gen);
      $('#gr-copy').addEventListener('click', () => { navigator.clipboard.writeText($('#gr-css').textContent); });
      gen();
    },
  },

  /* ── Favicon Generator ── */
  favicon: {
    desc: 'Generate favicon.ico and PNG favicons from any image.',
    render: () => `
      <label for="fav-file">Upload image</label>
      <input type="file" id="fav-file" accept="image/*" />
      <div id="fav-preview" style="display:flex;gap:16px;flex-wrap:wrap;margin-top:12px"></div>
      <div class="btn-group" id="fav-dl" style="display:none">
        <button class="btn btn-primary" id="fav-dl16">Download 16×16</button>
        <button class="btn btn-secondary" id="fav-dl32">Download 32×32</button>
        <button class="btn btn-secondary" id="fav-dl180">Download 180×180</button>
      </div>
      <div class="output" id="fav-out"></div>`,
    init: () => {
      let img;
      const sizes = [16, 32, 48, 180];
      $('#fav-file').addEventListener('change', e => {
        const f = e.target.files[0]; if (!f) return;
        img = new Image();
        img.onload = () => {
          const prev = $('#fav-preview');
          prev.innerHTML = '';
          sizes.forEach(s => {
            const c = document.createElement('canvas'); c.width = s; c.height = s;
            c.getContext('2d').drawImage(img, 0, 0, s, s);
            const wrap = document.createElement('div'); wrap.style.textAlign = 'center';
            wrap.innerHTML = `<div style="display:inline-block;border:1px solid var(--border);border-radius:4px;overflow:hidden"><canvas width="${s}" height="${s}" style="display:block;max-width:64px"></canvas></div><div style="font-size:11px;margin-top:4px">${s}×${s}</div>`;
            wrap.querySelector('canvas').getContext('2d').drawImage(img, 0, 0, s, s);
            prev.appendChild(wrap);
          });
          $('#fav-dl').style.display = '';
        };
        img.src = URL.createObjectURL(f);
      });
      const dl = (size, name) => {
        if (!img) return;
        const c = document.createElement('canvas'); c.width = size; c.height = size;
        c.getContext('2d').drawImage(img, 0, 0, size, size);
        c.toBlob(b => { download(name, b); }, 'image/png');
      };
      $('#fav-dl16').onclick = () => dl(16, 'favicon-16.png');
      $('#fav-dl32').onclick = () => dl(32, 'favicon-32.png');
      $('#fav-dl180').onclick = () => dl(180, 'apple-touch-icon.png');
    },
  },

  /* ── SVG Optimiser ── */
  svgOpt: {
    desc: 'Optimise SVG files by removing unnecessary attributes and metadata.',
    render: () => `
      <label for="so-in">Paste SVG code</label>
      <textarea id="so-in" placeholder="<svg>...</svg>" style="min-height:200px"></textarea>
      <div class="btn-group">
        <button class="btn btn-primary" id="so-run">Optimise</button>
        <button class="btn btn-ghost" id="so-copy">Copy</button>
      </div>
      <label>Result</label><div class="output" id="so-out"></div>
      <div id="so-stats" class="note"></div>`,
    init: () => {
      $('#so-run').addEventListener('click', () => {
        let svg = $('#so-in').value.trim();
        if (!svg) { set('so-out', 'Paste SVG code first', 'err'); return; }
        const orig = svg.length;
        // Remove comments
        svg = svg.replace(/<!--[\s\S]*?-->/g, '');
        // Remove metadata
        svg = svg.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
        svg = svg.replace(/<title[\s\S]*?<\/title>/gi, '');
        svg = svg.replace(/<desc[\s\S]*?<\/desc>/gi, '');
        // Remove editor metadata
        svg = svg.replace(/sodipodi:[\w-]+="[^"]*"/gi, '');
        svg = svg.replace(/inkscape:[\w-]+="[^"]*"/gi, '');
        // Remove empty groups
        svg = svg.replace(/<g[^>]*>\s*<\/g>/gi, '');
        // Remove empty attributes
        svg = svg.replace(/ [a-z-]+=""/gi, '');
        // Collapse whitespace
        svg = svg.replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><').trim();
        const saved = ((1 - svg.length / orig) * 100).toFixed(1);
        $('#so-out').textContent = svg;
        $('#so-stats').textContent = `${orig} → ${svg.length} bytes (${saved}% smaller)`;
      });
      $('#so-copy').addEventListener('click', () => { navigator.clipboard.writeText($('#so-out').textContent); });
    },
  },
};
