// Math & Science tools
import { $, download, copyText, setStatus } from '../util.js';

export const tools = {
  /* ── Calculator ── */
  calculator: {
    desc: 'A safe calculator (no code execution).',
    render: () => `
      <input type="text" id="cal-disp" placeholder="0" inputmode="decimal" style="font-size:1.4rem;text-align:right;margin-bottom:10px" />
      <div id="cal-keys" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:320px"></div>
      <div class="note">Operators: + − × ÷ ^ sqrt() and parentheses. Evaluated locally via Math.js.</div>`,
    init: async () => {
      const { evaluate } = await import('mathjs');
      const disp = $('#cal-disp'); const keys = $('#cal-keys');
      const K = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', '.', 'C', '+', '√', '(', ')', '=', '^'];
      keys.innerHTML = K.map(k => `<button class="btn btn-secondary" data-k="${k}" style="min-height:48px">${k}</button>`).join('');
      const calc = () => {
        try { const expr = disp.value.replace(/÷/g, '/').replace(/×/g, '*').replace(/−/g, '-').replace(/√/g, 'sqrt');
          disp.value = String(evaluate(expr)); } catch { /* ignore partial */ }
      };
      keys.addEventListener('click', e => {
        const k = e.target.dataset.k; if (!k) return;
        if (k === 'C') disp.value = '';
        else if (k === '=') calc();
        else disp.value += k; disp.focus();
      });
      disp.addEventListener('keydown', e => { if (e.key === 'Enter') calc(); });
    },
  },

  /* ── Math & Formula ── */
  math: {
    desc: 'Evaluate expressions or render LaTeX with KaTeX.',
    render: () => `
      <label for="mt-mode">Mode</label>
      <select id="mt-mode"><option value="eval">Evaluate expression</option><option value="latex">Render LaTeX</option></select>
      <label for="mt-in">Expression / LaTeX</label><input type="text" id="mt-in" placeholder="2^10 * sqrt(16)" />
      <div class="btn-group"><button class="btn btn-primary" id="mt-go">Compute</button>
        <button class="btn btn-ghost" id="mt-copy">Copy</button></div>
      <label>Result</label><div class="output" id="mt-out"></div>
      <div id="mt-kx" style="margin-top:12px;font-size:1.3rem"></div>`,
    init: async () => {
      const out = $('#mt-out'); const kx = $('#mt-kx');
      const go = async () => {
        const v = $('#mt-in').value; kx.innerHTML = '';
        if ($('#mt-mode').value === 'latex') {
          const katex = (await import('katex')).default || (await import('katex'));
          try { katex.render(v, kx, { throwOnError: false }); out.textContent = ''; }
          catch (e) { setStatus(out, '❌ ' + e.message, 'err'); }
        } else {
          const { evaluate } = await import('mathjs');
          try { out.textContent = String(evaluate(v)); out.className = 'output ok'; }
          catch (e) { setStatus(out, '❌ ' + e.message, 'err'); }
        }
      };
      $('#mt-go').onclick = go; $('#mt-in').addEventListener('input', go);
      $('#mt-copy').onclick = () => copyText(out.textContent);
    },
  },

  /* ── Unit Converter ── */
  unit: {
    desc: 'Convert between common units.',
    render: () => `
      <div class="row">
        <div><label for="un-cat">Category</label>
          <select id="un-cat"><option>length</option><option>mass</option><option>temperature</option><option>time</option><option>data</option></select></div>
        <div><label for="un-from">From</label><input type="number" id="un-from" value="1" /></div>
        <div><label for="un-fu">Unit</label><select id="un-fu"></select></div>
        <div><label for="un-tu">To</label><select id="un-tu"></select></div>
      </div>
      <div class="output" id="un-out"></div>`,
    init: () => {
      const units = {
        length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, yd: 0.9144, ft: 0.3048, in: 0.0254 },
        mass: { kg: 1, g: 0.001, mg: 1e-6, t: 1000, lb: 0.453592, oz: 0.0283495 },
        time: { s: 1, min: 60, h: 3600, day: 86400, week: 604800 },
        data: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 },
      };
      const out = $('#un-out');
      const fill = () => {
        const cat = $('#un-cat').value;
        const opts = Object.keys(units[cat] || { C: 1, F: 1, K: 1 }).map(u => `<option>${u}</option>`).join('');
        $('#un-fu').innerHTML = opts; $('#un-tu').innerHTML = opts;
      };
      const convTemperature = (v, f, t) => { let c = f === 'C' ? v : f === 'F' ? (v - 32) * 5 / 9 : v - 273.15; return t === 'C' ? c : t === 'F' ? c * 9 / 5 + 32 : c + 273.15; };
      const go = () => {
        const cat = $('#un-cat').value, v = parseFloat($('#un-from').value); const fu = $('#un-fu').value, tu = $('#un-tu').value;
        if (cat === 'temperature') { out.textContent = `${v} ${fu} = ${convTemperature(v, fu, tu).toFixed(4)} ${tu}`; out.className = 'output ok'; return; }
        const tbl = units[cat]; const r = v * tbl[fu] / tbl[tu];
        out.textContent = `${v} ${fu} = ${r} ${tu}`; out.className = 'output ok';
      };
      $('#un-cat').addEventListener('change', fill); fill();
      ['un-from', 'un-fu', 'un-tu'].forEach(id => $(id).addEventListener('input', go)); go();
    },
  },

  /* ── Percentage Calculator ── */
  percent: {
    desc: 'Percentage of, what percent, and change.',
    render: () => `
      <div class="row">
        <div><label for="pc-a">Value A</label><input type="number" id="pc-a" value="25" /></div>
        <div><label for="pc-b">Value B</label><input type="number" id="pc-b" value="200" /></div>
        <div><label for="pc-m">Mode</label>
          <select id="pc-m"><option value="of">A is what % of B</option><option value="pct">A% of B</option><option value="chg">% change A→B</option></select></div>
      </div>
      <div class="output" id="pc-out"></div>`,
    init: () => {
      const out = $('#pc-out');
      const go = () => {
        const a = parseFloat($('#pc-a').value), b = parseFloat($('#pc-b').value), m = $('#pc-m').value;
        if (m === 'of') out.textContent = b ? `${a} is ${(a / b * 100).toFixed(2)}% of ${b}` : '—';
        else if (m === 'pct') out.textContent = `${a}% of ${b} = ${(a / 100 * b)}`;
        else out.textContent = a ? `${((b - a) / a * 100).toFixed(2)}% change` : '—';
        out.className = 'output ok';
      };
      ['pc-a', 'pc-b', 'pc-m'].forEach(id => $(id).addEventListener('input', go)); go();
    },
  },
};
