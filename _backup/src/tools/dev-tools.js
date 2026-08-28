// ============================================================
// Developer Tools — 14 tools
// JSON, UUID, Base64, Hash, Regex, Password, CIDR, Timestamp,
// JWT Decoder, Cron Generator, URL Encoder, HTML Entities,
// Base Converter, Color Converter
// ============================================================

function $(id) { return document.getElementById(id); }

// ─── JSON Formatter ───
const jsonFmt = {
  name: 'JSON Formatter', icon: '📝',
  render: () => `
    <div class="panel"><h2>JSON Formatter & Validator</h2>
    <p class="desc">Paste JSON to format, validate, minify, or convert to CSV.</p>
    <label>Input JSON</label>
    <textarea id="jf-in" placeholder='{"name":"WebTools","version":1,"items":["a","b"]}'></textarea>
    <div class="btn-group">
      <button class="btn btn-primary" onclick="jfFmt()">Format</button>
      <button class="btn btn-secondary" onclick="jfMin()">Minify</button>
      <button class="btn btn-secondary" onclick="jfCsv()">To CSV</button>
      <button class="btn btn-secondary" onclick="jfTree()">Tree View</button>
      <button class="btn btn-secondary" onclick="$('jf-in').value='';$('jf-out').textContent='Output appears here…'">Clear</button>
    </div>
    <label style="margin-top:var(--sp-4)">Output</label>
    <div class="output" id="jf-out">Output appears here…</div></div>`,
  init: () => {}
};
window.jfFmt = () => { try { $('jf-out').textContent = JSON.stringify(JSON.parse($('jf-in').value), null, 2); } catch(e) { $('jf-out').textContent = '❌ ' + e.message; } };
window.jfMin = () => { try { $('jf-out').textContent = JSON.stringify(JSON.parse($('jf-in').value)); } catch(e) { $('jf-out').textContent = '❌ ' + e.message; } };
window.jfCsv = () => {
  try {
    const data = JSON.parse($('jf-in').value);
    const arr = Array.isArray(data) ? data : [data];
    if (!arr.length) { $('jf-out').textContent = 'Empty'; return; }
    const h = Object.keys(arr[0]);
    const rows = arr.map(r => h.map(k => JSON.stringify(r[k] ?? '')).join(','));
    $('jf-out').textContent = h.join(',') + '\n' + rows.join('\n');
  } catch(e) { $('jf-out').textContent = '❌ ' + e.message; }
};
window.jfTree = () => {
  try {
    const data = JSON.parse($('jf-in').value);
    function tree(obj, prefix = '', isLast = true) {
      if (obj === null) return 'null';
      if (typeof obj !== 'object') return String(obj);
      const isArray = Array.isArray(obj);
      const entries = isArray ? obj.map((v,i)=>[i,v]) : Object.entries(obj);
      let out = isArray ? '[\n' : '{\n';
      entries.forEach(([k,v], i) => {
        const last = i === entries.length - 1;
        const connector = last ? '└── ' : '├── ';
        const child = typeof v === 'object' && v !== null ? tree(v, prefix + (last ? '    ' : '│   '), last) : String(v);
        out += prefix + connector + (isArray ? '' : k + ': ') + child + '\n';
      });
      out += prefix + (isArray ? ']' : '}');
      return out;
    }
    $('jf-out').textContent = tree(data);
  } catch(e) { $('jf-out').textContent = '❌ ' + e.message; }
};

// ─── UUID Generator ───
const uuidGen = {
  name: 'UUID Generator', icon: '🔑',
  render: () => `
    <div class="panel"><h2>UUID Generator</h2>
    <p class="desc">Generate UUID v4 (random) identifiers. Click any line to copy it.</p>
    <div style="display:flex;gap:var(--sp-3);align-items:end;flex-wrap:wrap;margin-bottom:var(--sp-4)">
      <div><label>Count</label><input type="number" id="uuid-n" value="5" min="1" max="500" style="width:90px" /></div>
      <button class="btn btn-primary" onclick="uuidGo()">Generate</button>
      <button class="btn btn-secondary" onclick="uuidCopyAll()">Copy All</button>
    </div>
    <div class="output" id="uuid-out" style="cursor:pointer">Click Generate…</div></div>`,
  init: () => {}
};
window.uuidGo = () => {
  const n = Math.min(parseInt($('uuid-n').value)||5, 500);
  const lines = Array.from({length:n}, ()=>crypto.randomUUID());
  $('uuid-out').innerHTML = lines.map(l=>`<div style="padding:3px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s" onclick="navigator.clipboard.writeText('${l}');this.style.background='var(--green-soft)';setTimeout(()=>this.style.background='',400)">${l}</div>`).join('');
};
window.uuidCopyAll = () => navigator.clipboard.writeText($('uuid-out').textContent);

// ─── Base64 ───
const base64 = {
  name: 'Base64 Encoder/Decoder', icon: '🔄',
  render: () => `
    <div class="panel"><h2>Base64 Encoder / Decoder</h2>
    <p class="desc">Encode text to Base64 or decode Base64. Supports Unicode.</p>
    <label>Input</label>
    <textarea id="b64-in" placeholder="Enter text or Base64 string…"></textarea>
    <div class="btn-group">
      <button class="btn btn-primary" onclick="b64Enc()">Encode →</button>
      <button class="btn btn-primary" onclick="b64Dec()">← Decode</button>
      <button class="btn btn-secondary" onclick="$('b64-in').value='';$('b64-out').textContent='Output appears here…'">Clear</button>
    </div>
    <label style="margin-top:var(--sp-4)">Output</label>
    <div class="output" id="b64-out">Output appears here…</div></div>`,
  init: () => {}
};
window.b64Enc = () => { try { $('b64-out').textContent = btoa(unescape(encodeURIComponent($('b64-in').value))); } catch(e) { $('b64-out').textContent = '❌ ' + e.message; } };
window.b64Dec = () => { try { $('b64-out').textContent = decodeURIComponent(escape(atob($('b64-in').value.trim()))); } catch(e) { $('b64-out').textContent = '❌ Invalid Base64'; } };

// ─── Hash Generator ───
const hashGen = {
  name: 'Hash Generator', icon: '#️⃣',
  render: () => `
    <div class="panel"><h2>Hash Generator</h2>
    <p class="desc">Generate SHA-256 and SHA-1 hashes (Web Crypto API, client-side).</p>
    <label>Input Text</label>
    <textarea id="hash-in" placeholder="Enter text to hash…"></textarea>
    <div class="btn-group"><button class="btn btn-primary" onclick="hashGo()">Generate Hashes</button></div>
    <label style="margin-top:var(--sp-4)">Output</label>
    <div class="output" id="hash-out">Click Generate…</div></div>`,
  init: () => {}
};
window.hashGo = async () => {
  const text = $('hash-in').value; if (!text) return;
  const data = new TextEncoder().encode(text);
  let out = '';
  for (const algo of ['SHA-256', 'SHA-1']) {
    const buf = await crypto.subtle.digest(algo, data);
    out += `${algo}:\n${Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('')}\n\n`;
  }
  $('hash-out').textContent = out;
};

// ─── Regex Tester ───
const regexTool = {
  name: 'Regex Tester', icon: '🔍',
  render: () => `
    <div class="panel"><h2>Regex Tester</h2>
    <p class="desc">Test regular expressions with real-time matching.</p>
    <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap;margin-bottom:var(--sp-3)">
      <div style="flex:1;min-width:200px"><label>Pattern</label><input type="text" id="rx-pat" placeholder="[a-z]+@[a-z]+\\.[a-z]+" oninput="rxTest()" /></div>
      <div style="width:100px"><label>Flags</label><input type="text" id="rx-flags" value="gi" oninput="rxTest()" /></div>
    </div>
    <label>Test String</label>
    <textarea id="rx-in" placeholder="Enter test text…" oninput="rxTest()"></textarea>
    <label style="margin-top:var(--sp-4)">Matches</label>
    <div class="output" id="rx-out">Type a pattern and test string…</div></div>`,
  init: () => {}
};
window.rxTest = () => {
  const pat=$('rx-pat').value, flags=$('rx-flags').value, input=$('rx-in').value;
  if(!pat||!input){$('rx-out').textContent='Type a pattern and test string…';return;}
  try {
    const re=new RegExp(pat,flags), matches=[];
    let m;
    if(flags.includes('g')){while((m=re.exec(input))!==null){matches.push(m);if(m.index===re.lastIndex)re.lastIndex++;}}
    else{m=re.exec(input);if(m)matches.push(m);}
    if(!matches.length){$('rx-out').textContent='No matches found.';return;}
    $('rx-out').textContent=`Found ${matches.length} match(es):\n\n`+matches.map((m,i)=>
      `Match ${i+1}: "${m[0]}" at index ${m.index}${m.length>1?'\n  Groups: '+m.slice(1).map((g,j)=>`$${j+1}="${g}"`).join(', '):''}`
    ).join('\n\n');
  } catch(e){$('rx-out').textContent='❌ '+e.message;}
};

// ─── Password Generator ───
const pwGen = {
  name: 'Password Generator', icon: '🔐',
  render: () => `
    <div class="panel"><h2>Password Generator</h2>
    <p class="desc">Generate cryptographically secure random passwords.</p>
    <div style="display:flex;gap:var(--sp-4);flex-wrap:wrap;align-items:end;margin-bottom:var(--sp-4)">
      <div><label>Length</label><input type="number" id="pw-len" value="20" min="4" max="200" style="width:80px" /></div>
      <label style="margin:0;display:flex;align-items:center;gap:4px"><input type="checkbox" id="pw-up" checked> ABC</label>
      <label style="margin:0;display:flex;align-items:center;gap:4px"><input type="checkbox" id="pw-lo" checked> abc</label>
      <label style="margin:0;display:flex;align-items:center;gap:4px"><input type="checkbox" id="pw-num" checked> 123</label>
      <label style="margin:0;display:flex;align-items:center;gap:4px"><input type="checkbox" id="pw-sym" checked> !@#</label>
    </div>
    <div class="btn-group">
      <button class="btn btn-primary" onclick="pwGo()">Generate</button>
      <button class="btn btn-secondary" onclick="navigator.clipboard.writeText($('pw-out').textContent)">Copy</button>
    </div>
    <label style="margin-top:var(--sp-4)">Password</label>
    <div class="output" id="pw-out" style="font-size:1.05rem;letter-spacing:1px">Click Generate…</div></div>`,
  init: () => {}
};
window.pwGo = () => {
  const len=parseInt($('pw-len').value)||20;let chars='';
  if($('pw-up').checked)chars+='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if($('pw-lo').checked)chars+='abcdefghijklmnopqrstuvwxyz';
  if($('pw-num').checked)chars+='0123456789';
  if($('pw-sym').checked)chars+='!@#$%^&*()_+-=[]{}|;:,.<>?';
  if(!chars)chars='abcdefghijklmnopqrstuvwxyz';
  const arr=new Uint32Array(len);crypto.getRandomValues(arr);
  $('pw-out').textContent=Array.from(arr,x=>chars[x%chars.length]).join('');
};

// ─── CIDR Calculator ───
const cidrCalc = {
  name: 'CIDR Calculator', icon: '🌐',
  render: () => `
    <div class="panel"><h2>CIDR / Subnet Calculator</h2>
    <p class="desc">Calculate network range, broadcast, and hosts for a CIDR notation.</p>
    <label>CIDR Notation</label>
    <input type="text" id="cidr-in" placeholder="192.168.1.0/24" />
    <div class="btn-group"><button class="btn btn-primary" onclick="cidrGo()">Calculate</button></div>
    <label style="margin-top:var(--sp-4)">Result</label>
    <div class="output" id="cidr-out">Enter a CIDR and click Calculate…</div></div>`,
  init: () => {}
};
window.cidrGo = () => {
  const input=$('cidr-in').value.trim(), match=input.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
  if(!match){$('cidr-out').textContent='❌ Use format: x.x.x.x/n';return;}
  const ip=match[1].split('.').map(Number), cidr=parseInt(match[2]);
  if(ip.some(o=>o<0||o>255)||cidr<0||cidr>32){$('cidr-out').textContent='❌ Invalid';return;}
  const mask=cidr===0?0:(~0<<(32-cidr))>>>0;
  const ipNum=(ip[0]<<24|ip[1]<<16|ip[2]<<8|ip[3])>>>0;
  const net=(ipNum&mask)>>>0, bcast=(net|~mask)>>>0;
  const hosts=cidr>=31?(cidr===32?1:2):bcast-net-1;
  const td=n=>[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.');
  $('cidr-out').textContent=`Network:    ${td(net)}/${cidr}\nMask:       ${td(mask)}\nBroadcast:  ${td(bcast)}\nHost Range: ${td(net+1)} — ${td(bcast-1)}\nHosts:      ${hosts.toLocaleString()}`;
};

// ─── Timestamp Converter ───
const tsConv = {
  name: 'Timestamp Converter', icon: '⏰',
  render: () => `
    <div class="panel"><h2>Unix Timestamp Converter</h2>
    <p class="desc">Convert between Unix timestamps and human-readable dates.</p>
    <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap;margin-bottom:var(--sp-4)">
      <div style="flex:1;min-width:200px"><label>Unix Timestamp</label><input type="text" id="ts-in" placeholder="${Math.floor(Date.now()/1000)}" oninput="tsToDate()" /></div>
      <div style="flex:1;min-width:200px"><label>Date/Time</label><input type="datetime-local" id="ts-date" step="1" oninput="dateToTs()" /></div>
    </div>
    <div class="output" id="ts-out">Enter a timestamp or date…</div></div>`,
  init: () => { $('ts-date').value=new Date().toISOString().slice(0,19); $('ts-in').value=Math.floor(Date.now()/1000); }
};
window.tsToDate = () => {
  const ts=parseInt($('ts-in').value.trim());if(isNaN(ts)){$('ts-out').textContent='Invalid';return;}
  const d=new Date(ts>1e11?ts:ts*1000);
  $('ts-out').textContent=`Human:  ${d.toLocaleString()}\nISO:    ${d.toISOString()}\nUTC:    ${d.toUTCString()}\nMS:     ${d.getTime()}`;
};
window.dateToTs = () => { const d=new Date($('ts-date').value);if(isNaN(d))return;$('ts-in').value=Math.floor(d.getTime()/1000);tsToDate(); };

// ─── JWT Decoder ───
const jwtDec = {
  name: 'JWT Decoder', icon: '🎫',
  render: () => `
    <div class="panel"><h2>JWT Decoder</h2>
    <p class="desc">Decode JSON Web Tokens (JWT) to view header, payload, and signature.</p>
    <label>JWT Token</label>
    <textarea id="jwt-in" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U" style="min-height:80px"></textarea>
    <div class="btn-group"><button class="btn btn-primary" onclick="jwtDecode()">Decode</button></div>
    <label style="margin-top:var(--sp-4)">Output</label>
    <div class="output" id="jwt-out">Paste a JWT token…</div></div>`,
  init: () => {}
};
window.jwtDecode = () => {
  try {
    const parts=$('jwt-in').value.trim().split('.');
    if(parts.length<2){$('jwt-out').textContent='❌ Invalid JWT';return;}
    const header=JSON.parse(atob(parts[0].replace(/-/g,'+').replace(/_/g,'/')));
    const payload=JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
    let out=`HEADER:\n${JSON.stringify(header,null,2)}\n\nPAYLOAD:\n${JSON.stringify(payload,null,2)}`;
    if(payload.exp) out+=`\n\nExpires: ${new Date(payload.exp*1000).toLocaleString()}`;
    if(payload.iat) out+=`\nIssued:  ${new Date(payload.iat*1000).toLocaleString()}`;
    $('jwt-out').textContent=out;
  } catch(e) { $('jwt-out').textContent='❌ Failed to decode: '+e.message; }
};

// ─── Cron Generator ───
const cronGen = {
  name: 'Cron Expression Generator', icon: '⏱️',
  render: () => `
    <div class="panel"><h2>Cron Expression Generator</h2>
    <p class="desc">Build cron expressions visually and see human-readable descriptions.</p>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:var(--sp-3);margin-bottom:var(--sp-4)">
      <div><label>Minute (0-59)</label><input type="text" id="cr-min" value="*" oninput="cronBuild()" /></div>
      <div><label>Hour (0-23)</label><input type="text" id="cr-hour" value="*" oninput="cronBuild()" /></div>
      <div><label>Day (1-31)</label><input type="text" id="cr-day" value="*" oninput="cronBuild()" /></div>
      <div><label>Month (1-12)</label><input type="text" id="cr-mon" value="*" oninput="cronBuild()" /></div>
      <div><label>Weekday (0-6)</label><input type="text" id="cr-wk" value="*" oninput="cronBuild()" /></div>
    </div>
    <div style="display:flex;gap:var(--sp-2);flex-wrap:wrap;margin-bottom:var(--sp-4)">
      <button class="btn btn-sm btn-secondary" onclick="cronPreset('0 * * * *')">Every hour</button>
      <button class="btn btn-sm btn-secondary" onclick="cronPreset('0 0 * * *')">Daily midnight</button>
      <button class="btn btn-sm btn-secondary" onclick="cronPreset('0 0 * * 0')">Weekly Sunday</button>
      <button class="btn btn-sm btn-secondary" onclick="cronPreset('0 0 1 * *')">Monthly 1st</button>
      <button class="btn btn-sm btn-secondary" onclick="cronPreset('*/5 * * * *')">Every 5 min</button>
      <button class="btn btn-sm btn-secondary" onclick="cronPreset('0 9-17 * * *')">Business hours</button>
    </div>
    <div class="output" id="cron-out">Adjust fields above…</div></div>`,
  init: () => { cronBuild(); }
};
window.cronPreset = (expr) => { const p=expr.split(' ');$('cr-min').value=p[0];$('cr-hour').value=p[1];$('cr-day').value=p[2];$('cr-mon').value=p[3];$('cr-wk').value=p[4];cronBuild(); };
window.cronBuild = () => {
  const m=$('cr-min').value,h=$('cr-hour').value,d=$('cr-day').value,mo=$('cr-mon').value,w=$('cr-wk').value;
  const expr=`${m} ${h} ${d} ${mo} ${w}`;
  let desc=`Expression: ${expr}\n\n`;
  desc += m==='*'?'Every minute':m.startsWith('*/')?`Every ${m.slice(2)} minutes`:`At minute ${m}`;
  desc += h==='*'?' of every hour':h.startsWith('*/')?` of every ${h.slice(2)} hours`:` at hour ${h}`;
  desc += d==='*'?'':' on day '+d;
  desc += mo==='*'?'':' of month '+mo;
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  desc += w==='*'?'':` on ${days[parseInt(w)]||w}`;
  $('cron-out').textContent=desc;
};

// ─── URL Encoder/Decoder ───
const urlEnc = {
  name: 'URL Encoder/Decoder', icon: '🔗',
  render: () => `
    <div class="panel"><h2>URL Encoder / Decoder</h2>
    <p class="desc">Encode or decode URL strings (percent encoding).</p>
    <label>Input</label>
    <textarea id="url-in" placeholder="https://example.com/path?q=hello world&lang=en" style="min-height:60px"></textarea>
    <div class="btn-group">
      <button class="btn btn-primary" onclick="urlEncode()">Encode →</button>
      <button class="btn btn-primary" onclick="urlDecode()">← Decode</button>
      <button class="btn btn-secondary" onclick="urlEncComp()">Encode Component →</button>
    </div>
    <label style="margin-top:var(--sp-4)">Output</label>
    <div class="output" id="url-out">Output appears here…</div></div>`,
  init: () => {}
};
window.urlEncode = () => { $('url-out').textContent=encodeURIComponent($('url-in').value); };
window.urlDecode = () => { try{$('url-out').textContent=decodeURIComponent($('url-in').value);}catch(e){$('url-out').textContent='❌ '+e.message;} };
window.urlEncComp = () => { $('url-out').textContent=encodeURI($('url-in').value); };

// ─── HTML Entity Encoder/Decoder ───
const htmlEnt = {
  name: 'HTML Entities', icon: '🏷️',
  render: () => `
    <div class="panel"><h2>HTML Entity Encoder / Decoder</h2>
    <p class="desc">Encode special characters to HTML entities or decode them back.</p>
    <label>Input</label>
    <textarea id="html-in" placeholder="<div class='test'>Hello & World</div>" style="min-height:60px"></textarea>
    <div class="btn-group">
      <button class="btn btn-primary" onclick="htmlEncode()">Encode →</button>
      <button class="btn btn-primary" onclick="htmlDecode()">← Decode</button>
    </div>
    <label style="margin-top:var(--sp-4)">Output</label>
    <div class="output" id="html-out">Output appears here…</div></div>`,
  init: () => {}
};
window.htmlEncode = () => { const s=$('html-in').value;$('html-out').textContent=s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); };
window.htmlDecode = () => { const d=document.createElement('div');d.innerHTML=$('html-in').value;$('html-out').textContent=d.textContent; };

// ─── Number Base Converter ───
const baseConv = {
  name: 'Base Converter', icon: '🔢',
  render: () => `
    <div class="panel"><h2>Number Base Converter</h2>
    <p class="desc">Convert numbers between Binary, Octal, Decimal, and Hexadecimal.</p>
    <label>Decimal Input</label>
    <input type="text" id="base-in" placeholder="42" oninput="baseConvGo()" />
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:var(--sp-3);margin-top:var(--sp-4)">
      <div><label>Binary (Base 2)</label><div class="output" id="base-bin" style="min-height:auto;padding:var(--sp-3)">—</div></div>
      <div><label>Octal (Base 8)</label><div class="output" id="base-oct" style="min-height:auto;padding:var(--sp-3)">—</div></div>
      <div><label>Hex (Base 16)</label><div class="output" id="base-hex" style="min-height:auto;padding:var(--sp-3)">—</div></div>
    </div></div>`,
  init: () => {}
};
window.baseConvGo = () => {
  const v=parseInt($('base-in').value);
  if(isNaN(v)){$('base-bin').textContent=$('base-oct').textContent=$('base-hex').textContent='—';return;}
  $('base-bin').textContent=v.toString(2);
  $('base-oct').textContent=v.toString(8);
  $('base-hex').textContent=v.toString(16).toUpperCase();
};

// ─── Color Converter ───
const colorConv = {
  name: 'Color Converter', icon: '🎨',
  render: () => `
    <div class="panel"><h2>Color Converter</h2>
    <p class="desc">Convert between HEX, RGB, and HSL color formats.</p>
    <div style="display:flex;gap:var(--sp-3);align-items:end;flex-wrap:wrap;margin-bottom:var(--sp-4)">
      <div style="flex:1;min-width:120px"><label>HEX</label><input type="text" id="col-hex" placeholder="#6366f1" oninput="colFromHex()" /></div>
      <div><label>RGB</label><input type="text" id="col-rgb" placeholder="99, 102, 241" oninput="colFromRgb()" style="width:160px" /></div>
      <div style="width:60px;height:42px;border-radius:var(--r-sm);border:1px solid var(--border);overflow:hidden"><input type="color" id="col-pick" value="#6366f1" style="width:100%;height:100%;border:none;cursor:pointer" oninput="colFromPicker()" /></div>
    </div>
    <div class="output" id="col-out" style="min-height:auto">Enter a color value above…</div></div>`,
  init: () => {}
};
function hexToRgb(h){h=h.replace('#','');if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];return{r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)};}
function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2;let h,s;if(max===min){h=s=0;}else{const d=max-min;s=l>.5?d/(2-max-min):d/(max+min);switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;case b:h=((r-g)/d+4)/6;break;}}return{h:Math.round(h*360),s:Math.round(s*100),l:Math.round(l*100)};}
function rgbToHex(r,g,b){return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');}
window.colFromHex=()=>{const h=$('col-hex').value;if(!h.match(/^#?[0-9a-f]{3,6}$/i))return;const rgb=hexToRgb(h);const hsl=rgbToHsl(rgb.r,rgb.g,rgb.b);$('col-rgb').textContent=$('col-rgb').value=`${rgb.r}, ${rgb.g}, ${rgb.b}`;$('col-pick').value=rgbToHex(rgb.r,rgb.g,rgb.b);$('col-out').textContent=`HEX: ${rgbToHex(rgb.r,rgb.g,rgb.b)}\nRGB: rgb(${rgb.r}, ${rgb.g}, ${rgb.b})\nHSL: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;};
window.colFromRgb=()=>{const m=$('col-rgb').value.match(/(\d+),\s*(\d+),\s*(\d+)/);if(!m)return;const[r,g,b]=m.slice(1).map(Number);const hex=rgbToHex(r,g,b);const hsl=rgbToHsl(r,g,b);$('col-hex').value=hex;$('col-pick').value=hex;$('col-out').textContent=`HEX: ${hex}\nRGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;};
window.colFromPicker=()=>{const h=$('col-pick').value;$('col-hex').value=h;colFromHex();};

export const DevTools = {
  tools: {
    'json-formatter': jsonFmt, 'uuid-generator': uuidGen, 'base64': base64,
    'hash-generator': hashGen, 'regex-tester': regexTool, 'password-generator': pwGen,
    'cidr-calculator': cidrCalc, 'timestamp-converter': tsConv, 'jwt-decoder': jwtDec,
    'cron-generator': cronGen, 'url-encoder': urlEnc, 'html-entities': htmlEnt,
    'base-converter': baseConv, 'color-converter': colorConv,
  }
};
