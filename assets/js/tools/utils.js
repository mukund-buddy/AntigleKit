// Utility tools — AntigleKit
import { $, download, setStatus } from '../util.js';

function set(id, msg, kind) { setStatus($(id), msg, kind); }

export const tools = {
  /* ── Cipher Decoder ── */
  cipher: {
    desc: 'Decode ROT13, Caesar cipher, Atbash, and other common ciphers.',
    render: () => `
      <label for="ci-in">Encoded text</label>
      <textarea id="ci-in" placeholder="Paste encoded text here…"></textarea>
      <label for="ci-mode">Cipher</label>
      <select id="ci-mode">
        <option value="rot13">ROT13</option>
        <option value="caesar">Caesar (brute force all shifts)</option>
        <option value="atbash">Atbash</option>
        <option value="base64">Base64 Decode</option>
        <option value="reverse">Reverse</option>
      </select>
      <div class="btn-group"><button class="btn btn-primary" id="ci-run">Decode</button></div>
      <label>Result</label><div class="output" id="ci-out" style="white-space:pre-wrap"></div>`,
    init: () => {
      $('#ci-run').addEventListener('click', () => {
        const text = $('#ci-in').value;
        const mode = $('#ci-mode').value;
        if (!text) { set('ci-out', 'Enter text to decode', 'err'); return; }
        let result = '';
        if (mode === 'rot13') {
          result = text.replace(/[a-zA-Z]/g, c => {
            const base = c <= 'Z' ? 65 : 97;
            return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
          });
        } else if (mode === 'caesar') {
          const shifts = [];
          for (let s = 1; s <= 25; s++) {
            const decoded = text.replace(/[a-zA-Z]/g, c => {
              const base = c <= 'Z' ? 65 : 97;
              return String.fromCharCode(((c.charCodeAt(0) - base - s + 26) % 26) + base);
            });
            shifts.push(`Shift ${s}: ${decoded}`);
          }
          result = shifts.join('\n\n');
        } else if (mode === 'atbash') {
          result = text.replace(/[a-zA-Z]/g, c => {
            const base = c <= 'Z' ? 65 : 97;
            return String.fromCharCode(base + 25 - (c.charCodeAt(0) - base));
          });
        } else if (mode === 'base64') {
          try { result = decodeURIComponent(escape(atob(text.trim()))); }
          catch { result = 'Invalid Base64'; }
        } else if (mode === 'reverse') {
          result = text.split('').reverse().join('');
        }
        $('#ci-out').textContent = result;
      });
    },
  },

  /* ── Scientific Calculator ── */
  scicalc: {
    desc: 'Scientific calculator with trig, logarithms, and more.',
    render: () => `
      <input type="text" id="sc-disp" value="0" readonly style="font-size:1.6rem;text-align:right;margin-bottom:8px" />
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px" id="sc-keys"></div>
      <div class="note" style="margin-top:8px">sin, cos, tan use degrees. ln = natural log, log = log₁₀.</div>`,
    init: async () => {
      const { evaluate } = await import('mathjs');
      const disp = $('#sc-disp');
      const keys = [
        ['sin(', 'cos(', 'tan(', 'π', 'e'],
        ['asin(', 'acos(', 'atan(', '√(', '³√('],
        ['ln(', 'log(', 'x²', 'x³', 'x^'],
        ['7', '8', '9', '(', ')'],
        ['4', '5', '6', '×', '÷'],
        ['1', '2', '3', '+', '−'],
        ['0', '.', 'C', '⌫', '='],
      ];
      const container = $('#sc-keys');
      keys.forEach(row => {
        row.forEach(k => {
          const btn = document.createElement('button');
          btn.className = 'btn btn-secondary';
          btn.textContent = k;
          btn.style.minHeight = '44px';
          btn.addEventListener('click', () => {
            if (k === 'C') { disp.value = '0'; return; }
            if (k === '⌫') { disp.value = disp.value.slice(0, -1) || '0'; return; }
            if (k === '=') {
              try {
                let expr = disp.value.replace(/π/g, 'pi').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
                disp.value = String(evaluate(expr));
              } catch { disp.value = 'Error'; }
              return;
            }
            if (k === 'x²') { disp.value += '^2'; return; }
            if (k === 'x³') { disp.value += '^3'; return; }
            if (k === 'x^') { disp.value += '^'; return; }
            if (k === '√(') { disp.value += 'sqrt('; return; }
            if (k === '³√(') { disp.value += 'cbrt('; return; }
            if (disp.value === '0' && '0123456789.'.includes(k)) disp.value = '';
            disp.value += k;
          });
          container.appendChild(btn);
        });
      });
    },
  },

  /* ── Base Converter ── */
  baseconv: {
    desc: 'Convert numbers between binary, octal, decimal, hexadecimal, and custom bases.',
    render: () => `
      <label for="bc-in">Number</label>
      <input type="text" id="bc-in" value="42" />
      <div class="row">
        <div><label for="bc-from">From base</label>
          <select id="bc-from"><option value="10" selected>Decimal (10)</option><option value="2">Binary (2)</option><option value="8">Octal (8)</option><option value="16">Hex (16)</option><option value="36">Base 36</option></select></div>
      </div>
      <div class="btn-group"><button class="btn btn-primary" id="bc-run">Convert</button></div>
      <div class="output" id="bc-out" style="font-family:var(--font-mono)"></div>`,
    init: () => {
      const convert = () => {
        const val = $('#bc-in').value.trim();
        const fromBase = parseInt($('#bc-from').value);
        try {
          const num = parseInt(val, fromBase);
          if (isNaN(num)) throw new Error('Invalid number');
          const bases = [2, 8, 10, 16, 36];
          let out = '';
          bases.forEach(b => {
            const label = { 2: 'Binary', 8: 'Octal', 10: 'Decimal', 16: 'Hex', 36: 'Base 36' }[b];
            out += `${label} (${b}):\t${num.toString(b).toUpperCase()}\n`;
          });
          $('#bc-out').textContent = out;
        } catch (e) { set('bc-out', '❌ ' + e.message, 'err'); }
      };
      $('#bc-run').addEventListener('click', convert);
      $('#bc-in').addEventListener('input', convert);
      convert();
    },
  },

  /* ── Time Calculator ── */
  timecalc: {
    desc: 'Add, subtract, and convert time durations.',
    render: () => `
      <label for="tc-op">Operation</label>
      <select id="tc-op">
        <option value="add">Add durations</option>
        <option value="sub">Subtract</option>
        <option value="conv">Convert to other units</option>
      </select>
      <div id="tc-dyn"></div>
      <div class="btn-group"><button class="btn btn-primary" id="tc-run">Calculate</button></div>
      <div class="output" id="tc-out"></div>`,
    init: () => {
      const dyn = $('#tc-dyn');
      const renderInputs = () => {
        const op = $('#tc-op').value;
        if (op === 'conv') {
          dyn.innerHTML = `
            <div class="row">
              <div><label>Hours</label><input type="number" id="tc-h" value="0" min="0" /></div>
              <div><label>Minutes</label><input type="number" id="tc-m" value="30" min="0" max="59" /></div>
              <div><label>Seconds</label><input type="number" id="tc-s" value="0" min="0" max="59" /></div>
            </div>`;
        } else {
          dyn.innerHTML = `
            <div class="row">
              <div><label>Duration 1</label><input type="text" id="tc-d1" placeholder="1h 30m 15s" value="1h 30m" /></div>
              <div><label>Duration 2</label><input type="text" id="tc-d2" placeholder="2h 45m 10s" value="2h 45m" /></div>
            </div>`;
        }
      };
      const parseDur = (s) => {
        let total = 0;
        const m = s.match(/(\d+)\s*h/); if (m) total += parseInt(m[1]) * 3600;
        const m2 = s.match(/(\d+)\s*m/); if (m2) total += parseInt(m2[1]) * 60;
        const m3 = s.match(/(\d+)\s*s/); if (m3) total += parseInt(m3[1]);
        if (total === 0 && /^\d+$/.test(s.trim())) total = parseInt(s.trim());
        return total;
      };
      const fmtDur = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${h}h ${m}m ${s}s`;
      };
      $('#tc-op').addEventListener('change', renderInputs);
      $('#tc-run').addEventListener('click', () => {
        const op = $('#tc-op').value;
        try {
          if (op === 'conv') {
            const sec = (+$('#tc-h').value || 0) * 3600 + (+$('#tc-m').value || 0) * 60 + (+$('#tc-s').value || 0);
            $('#tc-out').textContent = [
              `Seconds: ${sec}`,
              `Minutes: ${(sec / 60).toFixed(2)}`,
              `Hours: ${(sec / 3600).toFixed(4)}`,
              `Days: ${(sec / 86400).toFixed(6)}`,
              `Human: ${fmtDur(sec)}`,
            ].join('\n');
          } else {
            const d1 = parseDur($('#tc-d1').value);
            const d2 = parseDur($('#tc-d2').value);
            const result = op === 'add' ? d1 + d2 : d1 - d2;
            if (result < 0) throw new Error('Result is negative');
            $('#tc-out').textContent = `Result: ${fmtDur(result)}\nSeconds: ${result}`;
          }
        } catch (e) { set('tc-out', '❌ ' + e.message, 'err'); }
      });
      renderInputs();
    },
  },

  /* ── Barcode Generator ── */
  barcode: {
    desc: 'Generate Code 128 barcodes from text.',
    render: () => `
      <label for="bc-text">Text / Numbers</label>
      <input type="text" id="bc-text" value="AntigleKit" placeholder="Enter text…" />
      <div class="btn-group"><button class="btn btn-primary" id="bc-gen">Generate</button></div>
      <div id="bc-prev" style="text-align:center;margin-top:12px;background:#fff;padding:16px;border-radius:var(--r-md)"></div>
      <div class="btn-group" style="margin-top:8px;justify-content:center">
        <button class="btn btn-secondary" id="bc-dl-png">Download PNG</button>
        <button class="btn btn-secondary" id="bc-dl-svg">Download SVG</button>
      </div>`,
    init: () => {
      const encode128 = (text) => {
        const chars = ' !"#£%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
        const patterns = ['11011001100','11001101100','11001100110','10010011000','10010001100','10001001100','10011001000','10011000100','10001100100','11001001000','11001000100','11000100100','10110011100','10011011100','10011001110','10111001100','10001101110','10001110110','11001110010','11001011100','11001001110','11011100100','11001110100','11101101110','11101001100','11100101100','11100100110','11101100100','11100110100','11100110010','11011011000','11011000110','11000110110','10100011000','10001011000','10001000110','10110001000','10001101000','11011000100','11000101100','11000100110','11011101110','11101011100','11101001100','11100101100','11100100110','11101101000','11101100100','11100110100','11100110010','11011011110','11011101110','11101101110','10100110000','10100001100','10010110000','10010000110','10000101100','10000100110','10110010000','10110000100','10011010000','10011000010','10000110100','10000110010','11000010010','11001010000','11110111010','11000010100','10001111010','10100111100','10010111100','10010011110','10111100100','10011110100','10011110010','11110100100','11110010100','11110010010','11011011110','11011101110','11101101110','10101111000','10100011110','10001011110','10111101000','10111100010','11110101000','11110100010','10111011110','10111101110','11101011110','11110101110','11010000100','11010010000','11010011100','1100011101011'];
        let bits = '104'; // Start Code C
        let sum = 104;
        for (let i = 0; i < text.length; i++) {
          const idx = chars.indexOf(text[i]);
          if (idx >= 0) { bits += patterns[idx]; sum += idx * (i + 1); }
        }
        const check = sum % 103;
        bits += patterns[check];
        bits += '1100011101011'; // Stop
        return bits;
      };
      const drawBarcode = (canvas, bits) => {
        const ctx = canvas.getContext('2d');
        const w = bits.length * 2;
        canvas.width = w; canvas.height = 100;
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, 100);
        ctx.fillStyle = '#000';
        for (let i = 0; i < bits.length; i++) {
          if (bits[i] === '1') ctx.fillRect(i * 2, 10, 2, 70);
        }
      };
      const gen = () => {
        const text = $('#bc-text').value || ' ';
        const bits = encode128(text);
        const canvas = document.createElement('canvas');
        drawBarcode(canvas, bits);
        const prev = $('#bc-prev');
        prev.innerHTML = '';
        canvas.style.maxWidth = '100%';
        prev.appendChild(canvas);
        $('#bc-dl-png').onclick = () => { canvas.toBlob(b => download('barcode.png', b)); };
        $('#bc-dl-svg').onclick = () => {
          let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${bits.length * 2} 100"><rect width="100%" height="100%" fill="white"/>`;
          for (let i = 0; i < bits.length; i++) {
            if (bits[i] === '1') svg += `<rect x="${i * 2}" y="10" width="2" height="70" fill="black"/>`;
          }
          svg += '</svg>';
          download('barcode.svg', new Blob([svg], { type: 'image/svg+xml' }));
        };
      };
      $('#bc-gen').addEventListener('click', gen);
      gen();
    },
  },
};
