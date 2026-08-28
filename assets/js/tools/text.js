// Text & Data tools
import { $, download, copyText, setStatus, escapeHtml } from '../util.js';

function out(id, msg, kind) { setStatus($(id), msg, kind); }

export const tools = {
  /* ── Word Counter ── */
  wordcount: {
    desc: 'Count words, characters, lines and sentences.',
    render: () => `
      <label for="wc-in">Your text</label>
      <textarea id="wc-in" placeholder="Paste or type text here…"></textarea>
      <div class="btn-group">
        <button class="btn btn-secondary" id="wc-clr">Clear</button>
        <button class="btn btn-ghost" id="wc-copy">Copy counts</button>
      </div>
      <div class="stat-row" id="wc-out"></div>`,
    init: () => {
      const inp = $('#wc-in'); const outBox = $('#wc-out');
      const calc = () => {
        const t = inp.value;
        const words = (t.trim().match(/\S+/g) || []).length;
        const chars = t.length, charsNo = (t.replace(/\s/g, '').length);
        const lines = t ? t.split(/\n/).length : 0;
        const sents = (t.match(/[.!?](\s|$)/g) || []).length;
        outBox.innerHTML = [
          ['Words', words], ['Characters', chars], ['No spaces', charsNo],
          ['Lines', lines], ['Sentences', sents],
        ].map(([l, n]) => `<div class="stat"><div class="num">${n}</div><div class="lbl">${l}</div></div>`).join('');
      };
      inp.addEventListener('input', calc);
      $('#wc-clr').onclick = () => { inp.value = ''; calc(); };
      $('#wc-copy').onclick = () => copyText(outBox.textContent.replace(/\s+/g, ' '));
      calc();
    },
  },

  /* ── Case Converter ── */
  case: {
    desc: 'Convert text between cases.',
    render: () => `
      <label for="cc-in">Text</label>
      <textarea id="cc-in" placeholder="type or paste…"></textarea>
      <div class="btn-group">
        <button class="btn btn-secondary" data-c="upper">UPPER</button>
        <button class="btn btn-secondary" data-c="lower">lower</button>
        <button class="btn btn-secondary" data-c="title">Title Case</button>
        <button class="btn btn-secondary" data-c="sentence">Sentence case</button>
        <button class="btn btn-secondary" data-c="camel">camelCase</button>
        <button class="btn btn-secondary" data-c="snake">snake_case</button>
      </div>
      <label>Result</label><div class="output" id="cc-out"></div>`,
    init: () => {
      const inp = $('#cc-in'), res = $('#cc-out');
      const conv = c => {
        const t = inp.value; if (!t) return;
        let r;
        if (c === 'upper') r = t.toUpperCase();
        else if (c === 'lower') r = t.toLowerCase();
        else if (c === 'title') r = t.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
        else if (c === 'sentence') r = t.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, p, l) => p + l.toUpperCase());
        else if (c === 'camel') r = t.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, l) => l.toUpperCase());
        else if (c === 'snake') r = t.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
        res.textContent = r; res.className = 'output ok';
      };
      document.querySelectorAll('[data-c]').forEach(b => b.onclick = () => conv(b.dataset.c));
    },
  },

  /* ── Text Diff ── */
  diff: {
    desc: 'Compare two texts and see what changed.',
    render: () => `
      <div class="row">
        <div><label for="df-a">Original</label><textarea id="df-a" placeholder="original text…"></textarea></div>
        <div><label for="df-b">Changed</label><textarea id="df-b" placeholder="changed text…"></textarea></div>
      </div>
      <div class="btn-group"><button class="btn btn-primary" id="df-go">Compare</button></div>
      <label>Difference</label><div class="output" id="df-out" style="white-space:pre-wrap"></div>`,
    init: () => {
      $('#df-go').onclick = () => {
        const a = $('#df-a').value.split('\n'), b = $('#df-b').value.split('\n');
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--)
          dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
        let i = 0, j = 0, html = '';
        while (i < m && j < n) {
          if (a[i] === b[j]) { html += `  ${escapeHtml(a[i])}\n`; i++; j++; }
          else if (dp[i + 1][j] >= dp[i][j + 1]) { html += `<span style="color:var(--bad)">- ${escapeHtml(a[i])}</span>\n`; i++; }
          else { html += `<span style="color:var(--good)">+ ${escapeHtml(b[j])}</span>\n`; j++; }
        }
        for (; i < m; i++) html += `<span style="color:var(--bad)">- ${escapeHtml(a[i])}</span>\n`;
        for (; j < n; j++) html += `<span style="color:var(--good)">+ ${escapeHtml(b[j])}</span>\n`;
        const o = $('#df-out'); o.innerHTML = html || 'Identical'; o.className = 'output ok';
      };
    },
  },

  /* ── Slug Generator ── */
  slug: {
    desc: 'Turn a title into a URL-friendly slug.',
    render: () => `
      <label for="sl-in">Title</label>
      <input type="text" id="sl-in" placeholder="My First Blog Post!" />
      <div class="btn-group">
        <button class="btn btn-primary" id="sl-go">Generate</button>
        <button class="btn btn-ghost" id="sl-copy">Copy</button>
      </div>
      <label>Slug</label><div class="output" id="sl-out"></div>`,
    init: () => {
      const gen = () => {
        const s = $('#sl-in').value.toLowerCase().trim()
          .replace(/[^a-z0-9\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
        $('#sl-out').textContent = s; $('#sl-out').className = 'output ok';
      };
      $('#sl-go').onclick = gen; $('#sl-in').addEventListener('input', gen);
      $('#sl-copy').onclick = () => copyText($('#sl-out').textContent);
    },
  },

  /* ── Lorem Ipsum ── */
  lorem: {
    desc: 'Generate placeholder text.',
    render: () => `
      <div class="row">
        <div><label for="lo-n">Paragraphs</label><input type="number" id="lo-n" value="3" min="1" max="50" /></div>
        <div><label for="lo-w">Words / paragraph</label><input type="number" id="lo-w" value="50" min="5" max="300" /></div>
      </div>
      <div class="btn-group"><button class="btn btn-primary" id="lo-go">Generate</button>
        <button class="btn btn-ghost" id="lo-copy">Copy</button></div>
      <label>Result</label><div class="output" id="lo-out"></div>`,
    init: () => {
      const words = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo'.split(' ');
      $('#lo-go').onclick = () => {
        const p = +$('#lo-n').value, wpp = +$('#lo-w').value; let txt = '';
        for (let i = 0; i < p; i++) {
          let s = []; for (let k = 0; k < wpp; k++) s.push(words[Math.floor(Math.random() * words.length)]);
          s[0] = s[0][0].toUpperCase() + s[0].slice(1); txt += s.join(' ') + '.\n\n';
        }
        $('#lo-out').textContent = txt.trim(); $('#lo-out').className = 'output ok';
      };
      $('#lo-copy').onclick = () => copyText($('#lo-out').textContent);
    },
  },

  /* ── Text Statistics ── */
  textstats: {
    desc: 'Readability & stats for your text.',
    render: () => `
      <label for="ts-in">Text</label><textarea id="ts-in" placeholder="paste an article…"></textarea>
      <div class="stat-row" id="ts-out"></div>`,
    init: () => {
      const calc = () => {
        const t = $('#ts-in').value; const words = (t.trim().match(/\S+/g) || []);
        const chars = t.replace(/\s/g, '').length;
        const syll = words.reduce((a, w) => a + Math.max(1, (w.toLowerCase().match(/[aeiouy]+/g) || []).length), 0);
        const mins = (words.length / 200).toFixed(1);
        const flesch = words.length ? (206.835 - 1.015 * (words.length / Math.max(1, (t.match(/[.!?]/g) || []).length || 1)) - 84.6 * (syll / Math.max(1, words.length))).toFixed(0) : 0;
        $('#ts-out').innerHTML = [
          ['Words', words.length], ['Characters', chars], ['Syllables', syll],
          ['Read time', mins + ' min'], ['Flesch', flesch],
        ].map(([l, n]) => `<div class="stat"><div class="num">${n}</div><div class="lbl">${l}</div></div>`).join('');
      };
      $('#ts-in').addEventListener('input', calc); calc();
    },
  },

  /* ── Text Utilities ── */
  textutils: {
    desc: 'Trim, dedupe, sort, shuffle and reverse lines.',
    render: () => `
      <label for="tu-in">Lines</label><textarea id="tu-in" placeholder="one item per line…"></textarea>
      <div class="btn-group">
        <button class="btn btn-secondary" data-u="trim">Trim</button>
        <button class="btn btn-secondary" data-u="empty">Drop blanks</button>
        <button class="btn btn-secondary" data-u="dedupe">Dedupe</button>
        <button class="btn btn-secondary" data-u="sort">Sort A→Z</button>
        <button class="btn btn-secondary" data-u="shuffle">Shuffle</button>
        <button class="btn btn-secondary" data-u="reverse">Reverse</button>
        <button class="btn btn-ghost" data-u="copy">Copy</button>
      </div>
      <label>Result</label><div class="output" id="tu-out"></div>`,
    init: () => {
      const out = $('#tu-out');
      const act = u => {
        let lines = $('#tu-in').value.split('\n');
        if (u === 'trim') lines = lines.map(l => l.trim());
        else if (u === 'empty') lines = lines.filter(l => l.trim());
        else if (u === 'dedupe') lines = [...new Set(lines)];
        else if (u === 'sort') lines = lines.slice().sort((a, b) => a.localeCompare(b));
        else if (u === 'shuffle') lines = lines.sort(() => Math.random() - 0.5);
        else if (u === 'reverse') lines = lines.reverse();
        else if (u === 'copy') return copyText(out.textContent);
        out.textContent = lines.join('\n'); out.className = 'output ok';
      };
      document.querySelectorAll('[data-u]').forEach(b => b.onclick = () => act(b.dataset.u));
    },
  },

  /* ── Find & Replace ── */
  findreplace: {
    desc: 'Search and replace with optional regex.',
    render: () => `
      <label for="fr-in">Text</label><textarea id="fr-in"></textarea>
      <div class="row">
        <div><label for="fr-f">Find</label><input type="text" id="fr-f" /></div>
        <div><label for="fr-r">Replace</label><input type="text" id="fr-r" /></div>
      </div>
      <label class="check"><input type="checkbox" id="fr-rx" /> Use regular expression</label>
      <label class="check"><input type="checkbox" id="fr-ci" /> Ignore case</label>
      <div class="btn-group"><button class="btn btn-primary" id="fr-go">Replace</button>
        <button class="btn btn-ghost" id="fr-copy">Copy</button></div>
      <label>Result</label><div class="output" id="fr-out"></div>`,
    init: () => {
      const go = () => {
        const t = $('#fr-in').value, f = $('#fr-f').value, r = $('#fr-r').value;
        if (!f) { $('#fr-out').textContent = t; return; }
        try {
          const flags = $('#fr-ci').checked ? 'gi' : 'g';
          const re = $('#fr-rx').checked ? new RegExp(f, flags) : new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
          $('#fr-out').textContent = t.replace(re, r); $('#fr-out').className = 'output ok';
        } catch (e) { setStatus($('#fr-out'), '❌ ' + e.message, 'err'); }
      };
      $('#fr-go').onclick = go; $('#fr-in').addEventListener('input', go);
      $('#fr-copy').onclick = () => copyText($('#fr-out').textContent);
    },
  },

  /* ── CSV Tools ── */
  csv: {
    desc: 'Convert CSV to JSON, Markdown or Excel (xlsx).',
    render: () => `
      <label for="cv-in">CSV</label><textarea id="cv-in" placeholder="name,age&#10;Ada,36&#10;Linus,53"></textarea>
      <div class="btn-group">
        <button class="btn btn-secondary" data-cv="json">To JSON</button>
        <button class="btn btn-secondary" data-cv="md">To Markdown</button>
        <button class="btn btn-primary" data-cv="xlsx">Download .xlsx</button>
        <button class="btn btn-ghost" data-cv="copy">Copy JSON</button>
      </div>
      <label>Output</label><div class="output" id="cv-out"></div>`,
    init: () => {
      const parse = () => Papa.parse($('#cv-in').value.trim(), { header: true, skipEmptyLines: true }).data;
      document.querySelectorAll('[data-cv]').forEach(b => b.onclick = async () => {
        const k = b.dataset.cv; const o = $('#cv-out');
        if (k === 'xlsx') {
          const XLSX = await import('xlsx');
          const ws = XLSX.utils.json_to_sheet(parse());
          const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
          const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          download('export.xlsx', new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
          return;
        }
        const rows = parse();
        if (k === 'json') { o.textContent = JSON.stringify(rows, null, 2); o.className = 'output ok'; }
        else if (k === 'md') {
          const cols = Object.keys(rows[0] || {});
          o.textContent = '| ' + cols.join(' | ') + ' |\n| ' + cols.map(() => '---').join(' | ') + ' |\n' +
            rows.map(r => '| ' + cols.map(c => (r[c] ?? '').toString().replace(/\|/g, '\\|')).join(' | ') + ' |').join('\n');
          o.className = 'output ok';
        } else if (k === 'copy') copyText(JSON.stringify(rows, null, 2));
      });
    },
  },

  /* ── Markdown Preview ── */
  markdown: {
    desc: 'Write Markdown and preview the rendered HTML.',
    render: () => `
      <div class="row">
        <div><label for="md-in">Markdown</label><textarea id="md-in"># Hello\n\nWrite **Markdown** here and see it rendered live.</textarea></div>
        <div><label>Preview</label><div class="output" id="md-out" style="min-height:200px"></div></div>
      </div>`,
    init: async () => {
      const marked = (await import('marked')).default || (await import('marked'));
      const DOMPurify = (await import('dompurify')).default;
      const render = () => {
        const html = DOMPurify.sanitize(marked.parse($('#md-in').value));
        $('#md-out').innerHTML = html;
      };
      $('#md-in').addEventListener('input', render); render();
    },
  },

  /* ── Data Formatter ── */
  format: {
    desc: 'Pretty-print or validate JSON, YAML or XML.',
    render: () => `
      <div class="row">
        <div><label for="fm-type">Format</label>
          <select id="fm-type"><option>JSON</option><option>YAML</option><option>XML</option></select></div>
      </div>
      <label for="fm-in">Input</label><textarea id="fm-in" placeholder='{"a":1,"b":[2,3]}'></textarea>
      <div class="btn-group">
        <button class="btn btn-primary" id="fm-go">Format</button>
        <button class="btn btn-secondary" id="fm-min">Minify</button>
        <button class="btn btn-ghost" id="fm-copy">Copy</button>
      </div>
      <label>Output</label><div class="output" id="fm-out"></div>`,
    init: async () => {
      const YAML = (await import('js-yaml')).default;
      const XML = await import('fast-xml-parser');
      const go = async (min) => {
        const type = $('#fm-type').value, v = $('#fm-in').value; const o = $('#fm-out');
        try {
          let obj;
          if (type === 'JSON') obj = JSON.parse(v);
          else if (type === 'YAML') obj = YAML.load(v);
          else obj = XML.XMLParser ? new XML.XMLParser().parse(v) : XML.parse(v);
          const pretty = type === 'YAML' ? YAML.dump(obj) : JSON.stringify(obj, null, min ? 0 : 2);
          o.textContent = pretty; o.className = 'output ok';
        } catch (e) { setStatus(o, '❌ ' + e.message, 'err'); }
      };
      $('#fm-go').onclick = () => go(false);
      $('#fm-min').onclick = () => go(true);
      $('#fm-copy').onclick = () => copyText($('#fm-out').textContent);
    },
  },
};
