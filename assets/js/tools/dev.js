// Developer tools
import { $, download, copyText, setStatus, uuidv4, sha256, sha512, md5 } from '../util.js';

function set(id, msg, kind) { setStatus($(id), msg, kind); }

export const tools = {
  /* ── UUID & Hash ── */
  uuidhash: {
    desc: 'Generate UUIDs and hash text (SHA-256/512, MD5).',
    render: () => `
      <label for="uh-in">Input text</label>
      <textarea id="uh-in" placeholder="type something to hash…"></textarea>
      <div class="btn-group">
        <button class="btn btn-secondary" id="uh-uuid">New UUID v4</button>
        <button class="btn btn-secondary" id="uh-sha256">SHA-256</button>
        <button class="btn btn-secondary" id="uh-sha512">SHA-512</button>
        <button class="btn btn-secondary" id="uh-md5">MD5</button>
        <button class="btn btn-ghost" id="uh-copy">Copy</button>
      </div>
      <label>Output</label><div class="output" id="uh-out"></div>`,
    init: () => {
      const o = $('#uh-out');
      $('#uh-uuid').onclick = () => { o.textContent = uuidv4(); o.className = 'output ok'; };
      $('#uh-sha256').onclick = async () => { o.textContent = await sha256($('#uh-in').value); o.className = 'output ok'; };
      $('#uh-sha512').onclick = async () => { o.textContent = await sha512($('#uh-in').value); o.className = 'output ok'; };
      $('#uh-md5').onclick = async () => { o.textContent = await md5($('#uh-in').value); o.className = 'output ok'; };
      $('#uh-copy').onclick = () => copyText(o.textContent);
    },
  },

  /* ── Base64 ── */
  base64: {
    desc: 'Encode or decode Base64 (UTF-8 safe).',
    render: () => `
      <label for="b6-in">Text / Base64</label><textarea id="b6-in"></textarea>
      <div class="btn-group">
        <button class="btn btn-secondary" id="b6-en">Encode</button>
        <button class="btn btn-secondary" id="b6-de">Decode</button>
        <button class="btn btn-ghost" id="b6-copy">Copy</button>
      </div>
      <label>Output</label><div class="output" id="b6-out"></div>`,
    init: () => {
      const o = $('#b6-out');
      $('#b6-en').onclick = () => { try { o.textContent = btoa(unescape(encodeURIComponent($('#b6-in').value))); o.className = 'output ok'; } catch (e) { set('b6-out', '❌ ' + e.message, 'err'); } };
      $('#b6-de').onclick = () => { try { o.textContent = decodeURIComponent(escape(atob($('#b6-in').value.trim()))); o.className = 'output ok'; } catch (e) { set('b6-out', '❌ invalid Base64', 'err'); } };
      $('#b6-copy').onclick = () => copyText(o.textContent);
    },
  },

  /* ── Code Beautifier ── */
  code: {
    desc: 'Beautify or minify HTML, CSS or JavaScript.',
    render: () => `
      <div class="row">
        <div><label for="cb-type">Language</label>
          <select id="cb-type"><option>js</option><option>html</option><option>css</option></select></div>
      </div>
      <label for="cb-in">Code</label><textarea id="cb-in" spellcheck="false" placeholder="paste code…"></textarea>
      <div class="btn-group">
        <button class="btn btn-primary" id="cb-fmt">Beautify</button>
        <button class="btn btn-secondary" id="cb-min">Minify</button>
        <button class="btn btn-ghost" id="cb-copy">Copy</button>
      </div>
      <label>Output</label><div class="output" id="cb-out"></div>`,
    init: () => {
      const o = $('#cb-out');
      $('#cb-fmt').onclick = async () => {
        const type = $('#cb-type').value; const code = $('#cb-in').value;
        try {
          const mod = await import('js-beautify'); const B = mod.default || mod;
          const fn = type === 'js' ? B.js_beautify : type === 'css' ? B.css_beautify : B.html_beautify;
          o.textContent = fn(code, { indent_size: 2, wrap_line_length: 0 }); o.className = 'output ok';
        } catch (e) { set('cb-out', '❌ ' + e.message, 'err'); }
      };
      $('#cb-min').onclick = () => {
        const t = $('#cb-in').value
          .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
          .replace(/\n\s*\n/g, '\n').replace(/\s{2,}/g, ' ').replace(/\s*([{};,:])\s*/g, '$1').trim();
        o.textContent = t; o.className = 'output ok';
      };
      $('#cb-copy').onclick = () => copyText(o.textContent);
    },
  },

  /* ── JWT Decoder ── */
  jwt: {
    desc: 'Decode a JSON Web Token (read-only, no verification).',
    render: () => `
      <label for="jw-in">JWT</label><textarea id="jw-in" placeholder="header.payload.signature"></textarea>
      <div class="btn-group"><button class="btn btn-primary" id="jw-go">Decode</button></div>
      <label>Decoded</label><div class="output" id="jw-out"></div>`,
    init: () => {
      const dec = s => { const p = s.replace(/-/g, '+').replace(/_/g, '/'); return JSON.parse(decodeURIComponent(escape(atob(p)))); };
      $('#jw-go').onclick = () => {
        try {
          const parts = $('#jw-in').value.trim().split('.');
          if (parts.length < 2) throw new Error('not a JWT');
          const h = dec(parts[0]), p = dec(parts[1]);
          $('#jw-out').textContent = 'HEADER\n' + JSON.stringify(h, null, 2) + '\n\nPAYLOAD\n' + JSON.stringify(p, null, 2);
          $('#jw-out').className = 'output ok';
        } catch (e) { set('jw-out', '❌ ' + e.message, 'err'); }
      };
    },
  },

  /* ── Timestamp Converter ── */
  timestamp: {
    desc: 'Convert between Unix timestamps and dates.',
    render: () => `
      <div class="row">
        <div><label for="ts-unix">Unix (seconds)</label><input type="number" id="ts-unix" /></div>
        <div><label for="ts-date">Date</label><input type="text" id="ts-date" placeholder="2026-01-01 12:00:00" /></div>
      </div>
      <div class="btn-group"><button class="btn btn-secondary" id="ts-now">Now → Unix</button></div>
      <div class="output" id="ts-out"></div>`,
    init: () => {
      const o = $('#ts-out');
      const fromUnix = () => { const u = +$('#ts-unix').value; if (!u) return; o.textContent = new Date(u * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'; o.className = 'output ok'; };
      const fromDate = () => { const d = new Date($('#ts-date').value); if (isNaN(d)) return; o.textContent = 'Unix: ' + Math.floor(d.getTime() / 1000); o.className = 'output ok'; };
      $('#ts-unix').addEventListener('input', fromUnix);
      $('#ts-date').addEventListener('input', fromDate);
      $('#ts-now').onclick = () => { const n = Math.floor(Date.now() / 1000); $('#ts-unix').value = n; fromUnix(); };
    },
  },

  /* ── Password Generator ── */
  password: {
    desc: 'Generate a strong random password.',
    render: () => `
      <div class="row">
        <div><label for="pw-len">Length</label><input type="number" id="pw-len" value="16" min="4" max="64" /></div>
      </div>
      <label class="check"><input type="checkbox" id="pw-up" checked /> Uppercase</label>
      <label class="check"><input type="checkbox" id="pw-low" checked /> Lowercase</label>
      <label class="check"><input type="checkbox" id="pw-num" checked /> Numbers</label>
      <label class="check"><input type="checkbox" id="pw-sym" checked /> Symbols</label>
      <div class="btn-group"><button class="btn btn-primary" id="pw-go">Generate</button>
        <button class="btn btn-ghost" id="pw-copy">Copy</button></div>
      <div class="output" id="pw-out"></div>`,
    init: () => {
      const o = $('#pw-out');
      const gen = () => {
        const len = +$('#pw-len').value; let pool = '';
        if ($('#pw-up').checked) pool += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if ($('#pw-low').checked) pool += 'abcdefghijklmnopqrstuvwxyz';
        if ($('#pw-num').checked) pool += '0123456789';
        if ($('#pw-sym').checked) pool += '!@#$%^&*()-_=+[]{};:,.<>?';
        if (!pool) { set('pw-out', '❌ select at least one set', 'err'); return; }
        let s = ''; const a = new Uint8Array(len); crypto.getRandomValues(a);
        for (let i = 0; i < len; i++) s += pool[a[i] % pool.length];
        o.textContent = s; o.className = 'output ok';
      };
      $('#pw-go').onclick = gen; $('#pw-copy').onclick = () => copyText(o.textContent); gen();
    },
  },

  /* ── URL Parser ── */
  url: {
    desc: 'Parse a URL into its parts, or encode/decode.',
    render: () => `
      <label for="ur-in">URL</label><input type="text" id="ur-in" placeholder="https://example.com/path?q=1#frag" />
      <div class="btn-group">
        <button class="btn btn-secondary" id="ur-parse">Parse</button>
        <button class="btn btn-secondary" id="ur-en">Encode</button>
        <button class="btn btn-secondary" id="ur-de">Decode</button>
      </div>
      <div class="output" id="ur-out"></div>`,
    init: () => {
      const o = $('#ur-out');
      $('#ur-parse').onclick = () => {
        try { const u = new URL($('#ur-in').value.trim());
          o.textContent = JSON.stringify({ protocol: u.protocol, host: u.host, hostname: u.hostname, port: u.port, pathname: u.pathname, search: u.search, hash: u.hash, query: Object.fromEntries(u.searchParams) }, null, 2);
          o.className = 'output ok';
        } catch (e) { set('ur-out', '❌ invalid URL', 'err'); }
      };
      $('#ur-en').onclick = () => { o.textContent = encodeURIComponent($('#ur-in').value); o.className = 'output ok'; };
      $('#ur-de').onclick = () => { try { o.textContent = decodeURIComponent($('#ur-in').value); o.className = 'output ok'; } catch (e) { set('ur-out', '❌ ' + e.message, 'err'); } };
    },
  },

  /* ── CIDR Calculator ── */
  cidr: {
    desc: 'Calculate network, broadcast and host range for a CIDR.',
    render: () => `
      <label for="cd-in">CIDR (e.g. 192.168.1.0/24)</label><input type="text" id="cd-in" placeholder="10.0.0.0/8" />
      <div class="btn-group"><button class="btn btn-primary" id="cd-go">Calculate</button></div>
      <div class="output" id="cd-out"></div>`,
    init: () => {
      const ip2 = s => s.split('.').map(Number);
      const n2ip = n => [n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255].join('.');
      $('#cd-go').onclick = () => {
        const m = $('#cd-in').value.trim().match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
        if (!m) { set('cd-out', '❌ use format ip/mask', 'err'); return; }
        const mask = +m[2]; const base = ip2(m[1]).reduce((a, x, i) => a + x * 256 ** (3 - i), 0);
        const bits = 32 - mask; const net = (base >> bits) << bits; const bcast = net + (1 << bits) - 1;
        const hosts = (1 << bits) - 2;
        $('#cd-out').textContent = JSON.stringify({ network: n2ip(net), broadcast: n2ip(bcast), firstHost: n2ip(net + 1), lastHost: n2ip(bcast - 1), usableHosts: hosts < 0 ? 0 : hosts, mask: mask }, null, 2);
        $('#cd-out').className = 'output ok';
      };
    },
  },

  /* ── Cron Parser ── */
  cron: {
    desc: 'Explain a standard 5-field cron expression.',
    render: () => `
      <label for="cr-in">Cron (min hour day month weekday)</label><input type="text" id="cr-in" placeholder="*/15 9-17 * * 1-5" />
      <div class="btn-group"><button class="btn btn-primary" id="cr-go">Explain</button></div>
      <div class="output" id="cr-out"></div>`,
    init: () => {
      const field = (v, names) => {
        if (v === '*') return 'every ' + names.unit;
        const parts = v.split(',').map(p => {
          if (p.includes('/')) { const [r, step] = p.split('/'); return (r === '*' ? 'every' : r) + ' step ' + step; }
          if (p.includes('-')) return 'range ' + p.replace('-', ' to ');
          return names.map[p] || p;
        });
        return parts.join(', ');
      };
      const names = [
        { unit: 'minute', map: {} },
        { unit: 'hour', map: {} },
        { unit: 'day of month', map: {} },
        { unit: 'month', map: { 1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec' } },
        { unit: 'weekday', map: { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' } },
      ];
      $('#cr-go').onclick = () => {
        const p = $('#cr-in').value.trim().split(/\s+/);
        if (p.length !== 5) { set('cr-out', '❌ expected 5 fields', 'err'); return; }
        $('#cr-out').textContent = p.map((v, i) => `• ${field(v, names[i])}`).join('\n');
        $('#cr-out').className = 'output ok';
      };
    },
  },

  /* ── QR Code Generator ── */
  qrcode: {
    desc: 'Generate a QR code as PNG or SVG.',
    render: () => `
      <label for="qr-in">Text or URL</label><textarea id="qr-in" placeholder="https://nightkit.example"></textarea>
      <div class="row">
        <div><label for="qr-size">Size</label><input type="number" id="qr-size" value="240" min="120" max="1024" step="20" /></div>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" id="qr-go">Generate</button>
        <button class="btn btn-secondary" id="qr-png">Download PNG</button>
        <button class="btn btn-secondary" id="qr-svg">Download SVG</button>
      </div>
      <div id="qr-box" style="margin-top:16px;display:flex;justify-content:center"></div>`,
    init: async () => {
      const QR = (await import('qrcode')).default || (await import('qrcode'));
      const box = $('#qr-box');
      const draw = async () => {
        const text = $('#qr-in').value || ' '; const size = +$('#qr-size').value;
        box.innerHTML = ''; const c = document.createElement('canvas'); c.width = c.height = size;
        await QR.toCanvas(c, text, { width: size, margin: 2 }); box.appendChild(c);
        c.dataset.url = c.toDataURL('image/png');
      };
      $('#qr-go').onclick = draw;
      $('#qr-png').onclick = () => { draw().then(() => { const c = box.querySelector('canvas'); download('qrcode.png', c.toDataURL('image/png')); }); };
      $('#qr-svg').onclick = async () => { const svg = await QR.toString($('#qr-in').value || ' ', { type: 'svg' }); download('qrcode.svg', new Blob([svg], { type: 'image/svg+xml' })); };
      draw();
    },
  },

  /* ── Color Tools ── */
  color: {
    desc: 'Pick a color and convert between HEX, RGB and HSL.',
    render: () => `
      <div class="row">
        <div><label for="cl-pick">Picker</label><input type="color" id="cl-pick" value="#AD49E1" style="height:52px;padding:4px" /></div>
        <div><label for="cl-hex">HEX</label><input type="text" id="cl-hex" value="#AD49E1" /></div>
      </div>
      <div class="stat-row" id="cl-out"></div>
      <div class="btn-group"><button class="btn btn-secondary" id="cl-rand">Random palette</button></div>
      <div id="cl-pal" style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"></div>`,
    init: () => {
      const hex2rgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
      const rgb2hex = ([r, g, b]) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
      const rgb2hsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h, s, l = (mx + mn) / 2; if (mx === mn) s = h = 0; else { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]; };
      const show = hex => {
        const rgb = hex2rgb(hex); const [hh, ss, ll] = rgb2hsl(rgb);
        $('#cl-hex').value = hex; $('#cl-pick').value = hex;
        $('#cl-out').innerHTML = [
          ['HEX', hex], ['RGB', `rgb(${rgb.join(', ')})`], ['HSL', `hsl(${hh}, ${ss}%, ${ll}%)`],
        ].map(([l, v]) => `<div class="stat"><div class="num" style="font-family:var(--font-mono);font-size:var(--text-lg)">${v}</div><div class="lbl">${l}</div></div>`).join('');
      };
      $('#cl-pick').addEventListener('input', e => show(e.target.value));
      $('#cl-hex').addEventListener('input', e => { if (/^#?[0-9a-fA-F]{3,6}$/.test(e.target.value)) show(e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value); });
      $('#cl-rand').onclick = () => {
        const pal = document.getElementById('cl-pal'); pal.innerHTML = '';
        for (let i = 0; i < 6; i++) { const c = '#' + Array.from(crypto.getRandomValues(new Uint8Array(3))).map(x => x.toString(16).padStart(2, '0')).join(''); const d = document.createElement('div'); d.style.cssText = `width:48px;height:48px;border-radius:10px;background:${c};border:1px solid var(--border)`; d.title = c; pal.appendChild(d); }
      };
      show('#AD49E1');
    },
  },

  /* ── Regex Tester ── */
  regex: {
    desc: 'Test a regular expression against text.',
    render: () => `
      <div class="row">
        <div><label for="rx-pat">Pattern</label><input type="text" id="rx-pat" placeholder="(\\w+)@(\\w+)" /></div>
        <div><label for="rx-flags">Flags</label><input type="text" id="rx-flags" value="g" /></div>
      </div>
      <label for="rx-in">Test string</label><textarea id="rx-in" placeholder="contact ada@lovelace…"></textarea>
      <div class="btn-group"><button class="btn btn-primary" id="rx-go">Test</button></div>
      <div class="output" id="rx-out"></div>`,
    init: () => {
      const go = () => {
        const p = $('#rx-pat').value; if (!p) return;
        try {
          const re = new RegExp(p, $('#rx-flags').value); const t = $('#rx-in').value;
          const m = [...t.matchAll(re)];
          if (!m.length) { set('rx-out', 'No matches.', ''); return; }
          $('#rx-out').textContent = m.map((x, i) => `#${i + 1}: ${x[0]}${x.length > 1 ? '  →  ' + x.slice(1).join(', ') : ''}`).join('\n');
          $('#rx-out').className = 'output ok';
        } catch (e) { set('rx-out', '❌ ' + e.message, 'err'); }
      };
      $('#rx-go').onclick = go; $('#rx-in').addEventListener('input', go);
    },
  },

  /* ── Circle / Avatar Generator (inspired by donatj/Circle-Generator) ── */
  circle: {
    desc: 'Generate a colorful identicon-style circle from any text.',
    render: () => `
      <label for="ci-seed">Seed text</label><input type="text" id="ci-seed" value="mukund-buddy" />
      <div class="btn-group">
        <button class="btn btn-primary" id="ci-go">Generate</button>
        <button class="btn btn-secondary" id="ci-png">Download PNG</button>
      </div>
      <div id="ci-box" style="margin-top:16px;display:flex;justify-content:center"></div>`,
    init: () => {
      const box = $('#ci-box');
      const h = s => { let n = 2166136261; for (let i = 0; i < s.length; i++) { n ^= s.charCodeAt(i); n = Math.imul(n, 16777619); } return n >>> 0; };
      const draw = () => {
        const seed = $('#ci-seed').value || ' '; let r = h(seed);
        const rnd = () => (r = (r * 1664525 + 1013904223) >>> 0) / 4294967296;
        const S = 240, c = document.createElement('canvas'); c.width = c.height = S;
        const ctx = c.getContext('2d');
        const bg = `hsl(${Math.floor(rnd() * 360)},60%,${20 + Math.floor(rnd() * 20)}%)`;
        ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S);
        const palette = [0, 1, 2].map(() => `hsl(${Math.floor(rnd() * 360)},75%,${55 + Math.floor(rnd() * 20)}%)`);
        const n = 5 + Math.floor(rnd() * 6);
        for (let i = 0; i < n; i++) {
          ctx.beginPath();
          const x = rnd() * S, y = rnd() * S, rad = (0.12 + rnd() * 0.33) * S;
          ctx.arc(x, y, rad, 0, Math.PI * 2);
          ctx.fillStyle = palette[i % palette.length]; ctx.globalAlpha = 0.85; ctx.fill();
        }
        ctx.globalAlpha = 1;
        box.innerHTML = ''; box.appendChild(c);
      };
      $('#ci-go').onclick = draw;
      $('#ci-png').onclick = () => { draw(); const c = box.querySelector('canvas'); download('circle.png', c.toDataURL('image/png')); };
      draw();
    },
  },
};
