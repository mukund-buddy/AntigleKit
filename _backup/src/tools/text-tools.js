// ============================================================
// Text Tools — Word Counter, Case Converter, Diff, Lorem, Slug, Statistics
// ============================================================

function $(id) { return document.getElementById(id); }

// ─── Word Counter ───
const wordCounter = {
  name: 'Word Counter', icon: '📊',
  render: () => `
    <div class="panel">
      <h2>Word & Character Counter</h2>
      <p class="desc">Real-time word count, character count, sentences, paragraphs, and reading time.</p>
      <label>Input Text</label>
      <textarea id="wc-in" placeholder="Type or paste your text here…" style="min-height:180px" oninput="wcCount()"></textarea>
      <div class="stats" id="wc-stats"></div>
    </div>`,
  init: () => {}
};

window.wcCount = () => {
  const t = $('wc-in').value;
  const words = t.trim() ? t.trim().split(/\s+/).length : 0;
  const chars = t.length;
  const noSpace = t.replace(/\s/g,'').length;
  const sentences = t.split(/[.!?]+/).filter(s=>s.trim()).length;
  const paras = t.split(/\n\s*\n/).filter(p=>p.trim()).length || (t.trim()?1:0);
  const readMin = Math.ceil(words/200);
  const speakMin = Math.ceil(words/130);
  $('wc-stats').innerHTML = [
    ['Words',words],['Characters',chars],['No Spaces',noSpace],
    ['Sentences',sentences],['Paragraphs',paras],
    ['Read Time',readMin+' min'],['Speak Time',speakMin+' min']
  ].map(([l,v])=>`<div class="stat"><div class="val">${v}</div><div class="label">${l}</div></div>`).join('');
};

// ─── Case Converter ───
const caseConv = {
  name: 'Case Converter', icon: '🔄',
  render: () => `
    <div class="panel">
      <h2>Case Converter</h2>
      <p class="desc">Convert text between different cases — uppercase, lowercase, title, camel, snake, kebab, and more.</p>
      <label>Input Text</label>
      <textarea id="cc-in" placeholder="Enter text to convert…"></textarea>
      <div class="btn-group">
        <button class="btn btn-primary btn-sm" onclick="ccGo('upper')">UPPER</button>
        <button class="btn btn-primary btn-sm" onclick="ccGo('lower')">lower</button>
        <button class="btn btn-primary btn-sm" onclick="ccGo('title')">Title Case</button>
        <button class="btn btn-primary btn-sm" onclick="ccGo('sentence')">Sentence case</button>
        <button class="btn btn-primary btn-sm" onclick="ccGo('camel')">camelCase</button>
        <button class="btn btn-primary btn-sm" onclick="ccGo('pascal')">PascalCase</button>
        <button class="btn btn-primary btn-sm" onclick="ccGo('snake')">snake_case</button>
        <button class="btn btn-primary btn-sm" onclick="ccGo('kebab')">kebab-case</button>
        <button class="btn btn-primary btn-sm" onclick="ccGo('const')">CONSTANT_CASE</button>
        <button class="btn btn-primary btn-sm" onclick="ccGo('reverse')">reversed</button>
      </div>
      <label style="margin-top:16px">Output</label>
      <div class="output" id="cc-out">Output appears here…</div>
    </div>`,
  init: () => {}
};

window.ccGo = (type) => {
  const t = $('cc-in').value;
  if (!t) return;
  let o = '';
  const words = t.match(/[a-zA-Z0-9]+/g) || [];
  switch(type) {
    case 'upper': o = t.toUpperCase(); break;
    case 'lower': o = t.toLowerCase(); break;
    case 'title': o = t.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase()); break;
    case 'sentence': o = t.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, c => c.toUpperCase()); break;
    case 'camel': o = words.map((w,i) => i ? w[0].toUpperCase()+w.slice(1).toLowerCase() : w.toLowerCase()).join(''); break;
    case 'pascal': o = words.map(w => w[0].toUpperCase()+w.slice(1).toLowerCase()).join(''); break;
    case 'snake': o = words.map(w=>w.toLowerCase()).join('_'); break;
    case 'kebab': o = words.map(w=>w.toLowerCase()).join('-'); break;
    case 'const': o = words.map(w=>w.toUpperCase()).join('_'); break;
    case 'reverse': o = t.split('').reverse().join(''); break;
  }
  $('cc-out').textContent = o;
};

// ─── Text Diff ───
const textDiff = {
  name: 'Text Diff', icon: '📝',
  render: () => `
    <div class="panel">
      <h2>Text Diff Checker</h2>
      <p class="desc">Compare two texts side-by-side and see line-by-line differences.</p>
      <div class="diff-grid">
        <div><label>Original</label><textarea id="diff-a" placeholder="Paste original text…"></textarea></div>
        <div><label>Modified</label><textarea id="diff-b" placeholder="Paste modified text…"></textarea></div>
      </div>
      <div class="btn-group"><button class="btn btn-primary" onclick="diffGo()">Compare</button></div>
      <label style="margin-top:16px">Differences</label>
      <div class="output" id="diff-out" style="min-height:140px">Click Compare to see differences…</div>
    </div>`,
  init: () => {}
};

window.diffGo = () => {
  const a = $('diff-a').value.split('\n'), b = $('diff-b').value.split('\n');
  if (!a[0] && !b[0]) { $('diff-out').textContent = 'Enter text in both fields.'; return; }
  // LCS dynamic programming
  const m = a.length, n = b.length;
  const dp = Array.from({length:m+1},()=>Array(n+1).fill(0));
  for (let i=1;i<=m;i++) for (let j=1;j<=n;j++)
    dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j],dp[i][j-1]);
  const res = []; let i=m, j=n;
  while (i>0||j>0) {
    if (i>0&&j>0&&a[i-1]===b[j-1]) { res.unshift({t:'=',v:a[i-1]}); i--;j--; }
    else if (j>0&&(i===0||dp[i][j-1]>=dp[i-1][j])) { res.unshift({t:'+',v:b[j-1]}); j--; }
    else { res.unshift({t:'-',v:a[i-1]}); i--; }
  }
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  $('diff-out').innerHTML = res.map(r => {
    if (r.t==='+') return `<div class="diff-add">+ ${esc(r.v)}</div>`;
    if (r.t==='-') return `<div class="diff-remove">- ${esc(r.v)}</div>`;
    return `<div>  ${esc(r.v)}</div>`;
  }).join('');
};

// ─── Lorem Ipsum ───
const LOREM = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');
function lSentence() { const w=8+Math.floor(Math.random()*12); const s=Array.from({length:w},()=>LOREM[Math.floor(Math.random()*LOREM.length)]); s[0]=s[0][0].toUpperCase()+s[0].slice(1); return s.join(' ')+'.'; }
function lParagraph() { return Array.from({length:3+Math.floor(Math.random()*4)},lSentence).join(' '); }

const loremIpsum = {
  name: 'Lorem Ipsum', icon: '📄',
  render: () => `
    <div class="panel">
      <h2>Lorem Ipsum Generator</h2>
      <p class="desc">Generate placeholder text for your designs and mockups.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:end;margin-bottom:14px">
        <div><label>Count</label><input type="number" id="lorem-n" value="3" min="1" max="50" style="width:80px" /></div>
        <div><label>Type</label><select id="lorem-type"><option value="paragraphs">Paragraphs</option><option value="sentences">Sentences</option><option value="words">Words</option></select></div>
        <button class="btn btn-primary" onclick="loremGo()">Generate</button>
        <button class="btn btn-secondary" onclick="navigator.clipboard.writeText($('lorem-out').textContent)">Copy</button>
      </div>
      <div class="output" id="lorem-out" style="min-height:160px">Click Generate…</div>
    </div>`,
  init: () => {}
};

window.loremGo = () => {
  const n = parseInt($('lorem-n').value)||3;
  const type = $('lorem-type').value;
  let r = '';
  if (type==='words') r = Array.from({length:n},()=>LOREM[Math.floor(Math.random()*LOREM.length)]).join(' ');
  else if (type==='sentences') r = Array.from({length:n},lSentence).join(' ');
  else r = Array.from({length:n},lParagraph).join('\n\n');
  $('lorem-out').textContent = r;
};

// ─── Slug Generator ───
const slugGen = {
  name: 'Slug Generator', icon: '🔗',
  render: () => `
    <div class="panel">
      <h2>Slug / URL Generator</h2>
      <p class="desc">Convert any text to an SEO-friendly URL slug. Click the output to copy.</p>
      <label>Input Text</label>
      <input type="text" id="slug-in" placeholder="My Awesome Blog Post Title!" oninput="slugGo()" />
      <label style="margin-top:16px">Slug</label>
      <div class="output" id="slug-out" style="min-height:auto;cursor:pointer" onclick="navigator.clipboard.writeText(this.textContent);this.style.background='var(--green-bg)';setTimeout(()=>this.style.background='',500)">—</div>
    </div>`,
  init: () => {}
};

window.slugGo = () => {
  const s = $('slug-in').value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,'').replace(/[\s_]+/g,'-').replace(/-+/g,'-');
  $('slug-out').textContent = s || '—';
};

// ─── Text Statistics ───
const textStats = {
  name: 'Text Statistics', icon: '📈',
  render: () => `
    <div class="panel">
      <h2>Advanced Text Statistics</h2>
      <p class="desc">Detailed analysis including character frequency, word frequency, and text metrics.</p>
      <label>Input Text</label>
      <textarea id="tsa-in" placeholder="Paste text to analyze…" oninput="tsaGo()"></textarea>
      <div class="output" id="tsa-out" style="min-height:160px">Paste text to see statistics…</div>
    </div>`,
  init: () => {}
};

window.tsaGo = () => {
  const t = $('tsa-in').value;
  if (!t.trim()) { $('tsa-out').textContent = 'Paste text to see statistics…'; return; }
  const words = t.trim().split(/\s+/);
  const chars = t.length;
  const uniqueWords = [...new Set(words.map(w=>w.toLowerCase()))];
  // Character frequency
  const freq = {};
  for (const c of t.toLowerCase().replace(/\s/g,'')) freq[c] = (freq[c]||0)+1;
  const topChars = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10);
  // Word frequency
  const wfreq = {};
  for (const w of words) { const lw=w.toLowerCase().replace(/[^a-z0-9]/g,''); if(lw) wfreq[lw]=(wfreq[lw]||0)+1; }
  const topWords = Object.entries(wfreq).sort((a,b)=>b[1]-a[1]).slice(0,10);

  $('tsa-out').textContent =
    `Total Characters: ${chars}\n` +
    `Characters (no spaces): ${t.replace(/\s/g,'').length}\n` +
    `Words: ${words.length}\n` +
    `Unique Words: ${uniqueWords.length}\n` +
    `Sentences: ${t.split(/[.!?]+/).filter(s=>s.trim()).length}\n` +
    `Paragraphs: ${t.split(/\n\s*\n/).filter(p=>p.trim()).length}\n` +
    `Avg Word Length: ${(words.reduce((s,w)=>s+w.length,0)/words.length).toFixed(1)}\n` +
    `Avg Words/Sentence: ${(words.length / Math.max(1,t.split(/[.!?]+/).filter(s=>s.trim()).length)).toFixed(1)}\n\n` +
    `Top Characters:\n${topChars.map(([c,n])=>`  '${c}': ${n}`).join('\n')}\n\n` +
    `Top Words:\n${topWords.map(([w,n])=>`  "${w}": ${n}`).join('\n')}`;
};

export const TextTools = {
  tools: {
    'word-counter': wordCounter,
    'case-converter': caseConv,
    'text-diff': textDiff,
    'lorem-ipsum': loremIpsum,
    'slug-generator': slugGen,
    'text-statistics': textStats,
  }
};
