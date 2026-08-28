// ============================================================
// Text Tools — 10 tools
// Word Counter, Case Converter, Text Diff, Lorem Ipsum, Slug Generator,
// Text Statistics, Find & Replace, Sort Lines, Remove Duplicates, Reverse Text
// ============================================================

function $(id) { return document.getElementById(id); }

// ─── Word Counter ───
const wordCounter = {
  name: 'Word Counter', icon: '📊',
  render: () => `
    <div class="panel"><h2>Word & Character Counter</h2>
    <p class="desc">Real-time word count, character count, sentences, paragraphs, and reading time.</p>
    <label>Input Text</label>
    <textarea id="wc-in" placeholder="Type or paste your text here…" style="min-height:180px" oninput="wcCount()"></textarea>
    <div class="stats" id="wc-stats"></div></div>`,
  init: () => {}
};
window.wcCount = () => {
  const t=$('wc-in').value;
  const words=t.trim()?t.trim().split(/\s+/).length:0;
  const stats=[
    ['Words',words],['Characters',t.length],['No Spaces',t.replace(/\s/g,'').length],
    ['Sentences',t.split(/[.!?]+/).filter(s=>s.trim()).length],
    ['Paragraphs',t.split(/\n\s*\n/).filter(p=>p.trim()).length||(t.trim()?1:0)],
    ['Read Time',Math.ceil(words/200)+' min'],['Speak Time',Math.ceil(words/130)+' min']
  ];
  $('wc-stats').innerHTML=stats.map(([l,v])=>`<div class="stat"><div class="val">${v}</div><div class="label">${l}</div></div>`).join('');
};

// ─── Case Converter ───
const caseConv = {
  name: 'Case Converter', icon: '🔄',
  render: () => `
    <div class="panel"><h2>Case Converter</h2>
    <p class="desc">Convert between uppercase, lowercase, title, camel, snake, kebab, and more.</p>
    <label>Input Text</label>
    <textarea id="cc-in" placeholder="Enter text to convert…"></textarea>
    <div class="btn-group">
      <button class="btn btn-sm btn-primary" onclick="ccGo('upper')">UPPER</button>
      <button class="btn btn-sm btn-primary" onclick="ccGo('lower')">lower</button>
      <button class="btn btn-sm btn-primary" onclick="ccGo('title')">Title Case</button>
      <button class="btn btn-sm btn-primary" onclick="ccGo('sentence')">Sentence</button>
      <button class="btn btn-sm btn-primary" onclick="ccGo('camel')">camelCase</button>
      <button class="btn btn-sm btn-primary" onclick="ccGo('pascal')">PascalCase</button>
      <button class="btn btn-sm btn-primary" onclick="ccGo('snake')">snake_case</button>
      <button class="btn btn-sm btn-primary" onclick="ccGo('kebab')">kebab-case</button>
      <button class="btn btn-sm btn-primary" onclick="ccGo('const')">CONSTANT</button>
      <button class="btn btn-sm btn-primary" onclick="ccGo('reverse')">reversed</button>
    </div>
    <label style="margin-top:var(--sp-4)">Output</label>
    <div class="output" id="cc-out">Output appears here…</div></div>`,
  init: () => {}
};
window.ccGo = (type) => {
  const t=$('cc-in').value;if(!t)return;
  const words=t.match(/[a-zA-Z0-9]+/g)||[];
  const map={upper:()=>t.toUpperCase(),lower:()=>t.toLowerCase(),
    title:()=>t.replace(/\w\S*/g,w=>w[0].toUpperCase()+w.slice(1).toLowerCase()),
    sentence:()=>t.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g,c=>c.toUpperCase()),
    camel:()=>words.map((w,i)=>i?w[0].toUpperCase()+w.slice(1).toLowerCase():w.toLowerCase()).join(''),
    pascal:()=>words.map(w=>w[0].toUpperCase()+w.slice(1).toLowerCase()).join(''),
    snake:()=>words.map(w=>w.toLowerCase()).join('_'),
    kebab:()=>words.map(w=>w.toLowerCase()).join('-'),
    const:()=>words.map(w=>w.toUpperCase()).join('_'),
    reverse:()=>t.split('').reverse().join('')};
  $('cc-out').textContent=(map[type]||map.upper)();
};

// ─── Text Diff ───
const textDiff = {
  name: 'Text Diff', icon: '📝',
  render: () => `
    <div class="panel"><h2>Text Diff Checker</h2>
    <p class="desc">Compare two texts side-by-side and see line-by-line differences.</p>
    <div class="diff-grid">
      <div><label>Original</label><textarea id="diff-a" placeholder="Paste original text…"></textarea></div>
      <div><label>Modified</label><textarea id="diff-b" placeholder="Paste modified text…"></textarea></div>
    </div>
    <div class="btn-group"><button class="btn btn-primary" onclick="diffGo()">Compare</button></div>
    <label style="margin-top:var(--sp-4)">Differences</label>
    <div class="output" id="diff-out" style="min-height:140px">Click Compare to see differences…</div></div>`,
  init: () => {}
};
window.diffGo = () => {
  const a=$('diff-a').value.split('\n'),b=$('diff-b').value.split('\n');
  if(!a[0]&&!b[0]){$('diff-out').textContent='Enter text in both fields.';return;}
  const m=a.length,n=b.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);
  const res=[];let i=m,j=n;
  while(i>0||j>0){
    if(i>0&&j>0&&a[i-1]===b[j-1]){res.unshift({t:'=',v:a[i-1]});i--;j--;}
    else if(j>0&&(i===0||dp[i][j-1]>=dp[i-1][j])){res.unshift({t:'+',v:b[j-1]});j--;}
    else{res.unshift({t:'-',v:a[i-1]});i--;}
  }
  const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  $('diff-out').innerHTML=res.map(r=>{
    if(r.t==='+')return`<div class="diff-add">+ ${esc(r.v)}</div>`;
    if(r.t==='-')return`<div class="diff-remove">- ${esc(r.v)}</div>`;
    return`<div>  ${esc(r.v)}</div>`;
  }).join('');
};

// ─── Lorem Ipsum ───
const LOREM='lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');
function lSentence(){const w=8+Math.floor(Math.random()*12);const s=Array.from({length:w},()=>LOREM[Math.floor(Math.random()*LOREM.length)]);s[0]=s[0][0].toUpperCase()+s[0].slice(1);return s.join(' ')+'.';}
const loremIpsum={
  name:'Lorem Ipsum',icon:'📄',
  render:()=>`
    <div class="panel"><h2>Lorem Ipsum Generator</h2>
    <p class="desc">Generate placeholder text for designs and mockups.</p>
    <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap;align-items:end;margin-bottom:var(--sp-4)">
      <div><label>Count</label><input type="number" id="lorem-n" value="3" min="1" max="50" style="width:80px" /></div>
      <div><label>Type</label><select id="lorem-type"><option value="paragraphs">Paragraphs</option><option value="sentences">Sentences</option><option value="words">Words</option></select></div>
      <button class="btn btn-primary" onclick="loremGo()">Generate</button>
      <button class="btn btn-secondary" onclick="navigator.clipboard.writeText($('lorem-out').textContent)">Copy</button>
    </div>
    <div class="output" id="lorem-out" style="min-height:160px">Click Generate…</div></div>`,
  init:()=>{}
};
window.loremGo=()=>{const n=parseInt($('lorem-n').value)||3,type=$('lorem-type').value;let r='';
  if(type==='words')r=Array.from({length:n},()=>LOREM[Math.floor(Math.random()*LOREM.length)]).join(' ');
  else if(type==='sentences')r=Array.from({length:n},lSentence).join(' ');
  else r=Array.from({length:n},()=>Array.from({length:3+Math.floor(Math.random()*4)},lSentence).join(' ')).join('\n\n');
  $('lorem-out').textContent=r;};

// ─── Slug Generator ───
const slugGen={
  name:'Slug Generator',icon:'🔗',
  render:()=>`
    <div class="panel"><h2>Slug / URL Generator</h2>
    <p class="desc">Convert text to SEO-friendly URL slugs. Click output to copy.</p>
    <label>Input Text</label>
    <input type="text" id="slug-in" placeholder="My Awesome Blog Post Title!" oninput="slugGo()" />
    <label style="margin-top:var(--sp-4)">Slug</label>
    <div class="output" id="slug-out" style="min-height:auto;cursor:pointer" onclick="navigator.clipboard.writeText(this.textContent);this.style.background='var(--green-soft)';setTimeout(()=>this.style.background='',400)">—</div></div>`,
  init:()=>{}
};
window.slugGo=()=>{const s=$('slug-in').value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,'').replace(/[\s_]+/g,'-').replace(/-+/g,'-');$('slug-out').textContent=s||'—';};

// ─── Text Statistics ───
const textStats={
  name:'Text Statistics',icon:'📈',
  render:()=>`
    <div class="panel"><h2>Advanced Text Statistics</h2>
    <p class="desc">Character frequency, word frequency, and detailed text analysis.</p>
    <label>Input Text</label>
    <textarea id="tsa-in" placeholder="Paste text to analyze…" oninput="tsaGo()"></textarea>
    <div class="output" id="tsa-out" style="min-height:160px">Paste text to see statistics…</div></div>`,
  init:()=>{}
};
window.tsaGo=()=>{const t=$('tsa-in').value;if(!t.trim()){$('tsa-out').textContent='Paste text to see statistics…';return;}
  const words=t.trim().split(/\s+/),freq={},wfreq={};
  for(const c of t.toLowerCase().replace(/\s/g,''))freq[c]=(freq[c]||0)+1;
  for(const w of words){const lw=w.toLowerCase().replace(/[^a-z0-9]/g,'');if(lw)wfreq[lw]=(wfreq[lw]||0)+1;}
  const topChars=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const topWords=Object.entries(wfreq).sort((a,b)=>b[1]-a[1]).slice(0,10);
  $('tsa-out').textContent=`Characters: ${t.length}\nWords: ${words.length}\nUnique: ${[...new Set(words.map(w=>w.toLowerCase()))].length}\nSentences: ${t.split(/[.!?]+/).filter(s=>s.trim()).length}\nAvg Word Length: ${(words.reduce((s,w)=>s+w.length,0)/words.length).toFixed(1)}\n\nTop Characters:\n${topChars.map(([c,n])=>`  '${c}': ${n}`).join('\n')}\n\nTop Words:\n${topWords.map(([w,n])=>`  "${w}": ${n}`).join('\n')}`;};

// ─── Find & Replace ───
const findReplace={
  name:'Find & Replace',icon:'🔎',
  render:()=>`
    <div class="panel"><h2>Find & Replace</h2>
    <p class="desc">Find text and replace it with something else. Supports case-insensitive matching.</p>
    <label>Input Text</label>
    <textarea id="fr-in" placeholder="Paste your text here…" style="min-height:160px"></textarea>
    <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap;align-items:end;margin-top:var(--sp-4)">
      <div style="flex:1;min-width:150px"><label>Find</label><input type="text" id="fr-find" placeholder="text to find" /></div>
      <div style="flex:1;min-width:150px"><label>Replace</label><input type="text" id="fr-rep" placeholder="replacement" /></div>
      <label style="margin:0;display:flex;align-items:center;gap:4px"><input type="checkbox" id="fr-case"> Case sensitive</label>
      <button class="btn btn-primary" onclick="frGo()">Replace</button>
    </div>
    <label style="margin-top:var(--sp-4)">Output</label>
    <div class="output" id="fr-out" style="min-height:100px">Click Replace…</div></div>`,
  init:()=>{}
};
window.frGo=()=>{const text=$('fr-in').value,find=$('fr-find').value,rep=$('fr-rep').value,cs=$('fr-case').checked;
  if(!find){$('fr-out').textContent='Enter text to find';return;}
  const flags=cs?'g':'gi';let count=0;
  const result=text.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),flags),()=>{count++;return rep;});
  $('fr-out').textContent=result+`\n\n(${count} replacement${count!==1?'s':''})`;};

// ─── Sort Lines ───
const sortLines={
  name:'Sort Lines',icon:'📑',
  render:()=>`
    <div class="panel"><h2>Sort Lines</h2>
    <p class="desc">Sort text lines alphabetically, reverse, by length, or randomly.</p>
    <label>Input Text</label>
    <textarea id="sort-in" placeholder="Paste lines to sort…" style="min-height:140px"></textarea>
    <div class="btn-group">
      <button class="btn btn-sm btn-primary" onclick="sortGo('az')">A → Z</button>
      <button class="btn btn-sm btn-primary" onclick="sortGo('za')">Z → A</button>
      <button class="btn btn-sm btn-primary" onclick="sortGo('len')">By Length</button>
      <button class="btn btn-sm btn-primary" onclick="sortGo('rev')">Reverse</button>
      <button class="btn btn-sm btn-primary" onclick="sortGo('rand')">Random</button>
      <button class="btn btn-sm btn-primary" onclick="sortGo('num')">Numeric</button>
    </div>
    <label style="margin-top:var(--sp-4)">Output</label>
    <div class="output" id="sort-out" style="min-height:100px">Click a sort option…</div></div>`,
  init:()=>{}
};
window.sortGo=(type)=>{const lines=$('sort-in').value.split('\n');
  const map={az:()=>lines.sort(),za:()=>lines.sort().reverse(),len:()=>lines.sort((a,b)=>a.length-b.length),
    rev:()=>lines.reverse(),rand:()=>lines.sort(()=>Math.random()-0.5),num:()=>lines.sort((a,b)=>parseFloat(a)-parseFloat(b))};
  $('sort-out').textContent=(map[type]||map.az)().join('\n');};

// ─── Remove Duplicates ───
const removeDup={
  name:'Remove Duplicates',icon:'🧹',
  render:()=>`
    <div class="panel"><h2>Remove Duplicate Lines</h2>
    <p class="desc">Remove duplicate lines from text. Keep first occurrence or unique lines only.</p>
    <label>Input Text</label>
    <textarea id="dup-in" placeholder="Paste text with duplicate lines…" style="min-height:140px"></textarea>
    <div class="btn-group">
      <button class="btn btn-primary" onclick="dupGo('first')">Remove Duplicates (Keep First)</button>
      <button class="btn btn-secondary" onclick="dupGo('unique')">Unique Lines Only</button>
      <button class="btn btn-secondary" onclick="dupGo('count')">Count Duplicates</button>
    </div>
    <label style="margin-top:var(--sp-4)">Output</label>
    <div class="output" id="dup-out" style="min-height:100px">Click an option…</div></div>`,
  init:()=>{}
};
window.dupGo=(type)=>{const lines=$('dup-in').value.split('\n');
  if(type==='count'){const freq={};lines.forEach(l=>{freq[l]=(freq[l]||0)+1;});
    $('dup-out').textContent=Object.entries(freq).filter(([,n])=>n>1).map(([l,n])=>`(${n}×) ${l}`).join('\n')||'No duplicates found.';return;}
  if(type==='unique'){$('dup-out').textContent=[...new Set(lines)].join('\n');return;}
  const seen=new Set();$('dup-out').textContent=lines.filter(l=>{if(seen.has(l))return false;seen.add(l);return true;}).join('\n');};

// ─── Reverse Text ───
const reverseText={
  name:'Reverse Text',icon:'⏪',
  render:()=>`
    <div class="panel"><h2>Reverse Text</h2>
    <p class="desc">Reverse text by characters, words, or lines.</p>
    <label>Input Text</label>
    <textarea id="rev-in" placeholder="Enter text to reverse…" style="min-height:120px"></textarea>
    <div class="btn-group">
      <button class="btn btn-sm btn-primary" onclick="revGo('char')">Reverse Characters</button>
      <button class="btn btn-sm btn-primary" onclick="revGo('word')">Reverse Words</button>
      <button class="btn btn-sm btn-primary" onclick="revGo('line')">Reverse Lines</button>
    </div>
    <label style="margin-top:var(--sp-4)">Output</label>
    <div class="output" id="rev-out" style="min-height:100px">Click an option…</div></div>`,
  init:()=>{}
};
window.revGo=(type)=>{const t=$('rev-in').value;
  const map={char:()=>t.split('').reverse().join(''),word:()=>t.split(/\s+/).reverse().join(' '),line:()=>t.split('\n').reverse().join('\n')};
  $('rev-out').textContent=(map[type]||map.char)();};

export const TextTools={
  tools:{
    'word-counter':wordCounter,'case-converter':caseConv,'text-diff':textDiff,
    'lorem-ipsum':loremIpsum,'slug-generator':slugGen,'text-statistics':textStats,
    'find-replace':findReplace,'sort-lines':sortLines,'remove-duplicates':removeDup,
    'reverse-text':reverseText,
  }
};
