// ============================================================
// WebTools Hub — 36 Tools, 5 Categories
// Anti-slop design: asymmetric bento, editorial hero, strong hierarchy
// ============================================================

import { DevTools } from './tools/dev-tools.js';
import { TextTools } from './tools/text-tools.js';
import { PdfTools } from './tools/pdf-tools.js';
import { ImageTools } from './tools/image-tools.js';
import { DesignTools } from './tools/design-tools.js';

// ---- Theme ----
const saved = localStorage.getItem('wt-theme') ||
  (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('wt-theme', t);
  const b = document.getElementById('theme-btn');
  if (b) b.textContent = t === 'dark' ? '☀️' : '🌙';
}
applyTheme(saved);
window.toggleTheme = () => applyTheme(
  document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
);

// ---- Tool registry ----
const ALL = {
  dev:    { title: 'Developer Tools', icon: '⚡', tools: DevTools.tools },
  text:   { title: 'Text Tools',      icon: '✍️', tools: TextTools.tools },
  pdf:    { title: 'PDF Tools',       icon: '📄', tools: PdfTools.tools },
  image:  { title: 'Image Tools',     icon: '🖼️', tools: ImageTools.tools },
  design: { title: 'Design Tools',    icon: '🎨', tools: DesignTools.tools },
};

// ---- Parse hash ----
function parseHash() {
  const h = location.hash.slice(1);
  const [cat, tool] = h.split('/');
  return { cat: cat || '', tool: tool || '' };
}

// ---- Header ----
function renderHeader() {
  document.getElementById('site-header').innerHTML = `
  <div class="header">
    <div class="container header-inner">
      <div class="logo" onclick="location.hash=''">
        <div class="logo-mark">W</div>
        <span>WebTools</span>
      </div>
      <div class="nav">
        <a data-cat="dev" onclick="location.hash='dev'">Dev</a>
        <a data-cat="text" onclick="location.hash='text'">Text</a>
        <a data-cat="pdf" onclick="location.hash='pdf'">PDF</a>
        <a data-cat="image" onclick="location.hash='image'">Image</a>
        <a data-cat="design" onclick="location.hash='design'">Design</a>
        <a data-cat="credits" onclick="location.hash='credits'">Credits</a>
        <button class="theme-btn" id="theme-btn" onclick="toggleTheme()">🌙</button>
      </div>
    </div>
  </div>`;
}

// ---- Footer ----
function renderFooter() {
  document.getElementById('site-footer').innerHTML = `
  <div class="footer">
    <div class="container footer-inner">
      <div>© 2026 WebTools Hub — Free, private, client-side tools. All processing in your browser.</div>
      <div class="footer-links">
        <a onclick="location.hash='credits'">Credits</a>
        <a href="https://github.com" target="_blank">GitHub</a>
      </div>
    </div>
  </div>`;
}

// ---- Home ----
function renderHome() {
  return `
  <div class="hero">
    <div class="container hero-inner">
      <div class="hero-text">
        <div class="hero-eyebrow">Free & Private</div>
        <h1>Tools that respect<br/>your <em>privacy</em></h1>
        <p class="hero-desc">40 tools across 5 categories — PDF, image, text, developer, and design utilities. Everything runs in your browser. Nothing uploaded.</p>
        <div class="hero-actions">
          <button class="btn btn-primary" onclick="location.hash='dev'" style="padding:12px 24px;font-size:var(--text-base)">
            Start using tools →
          </button>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><div class="num">40</div><div class="lbl">Tools</div></div>
          <div class="hero-stat"><div class="num">5</div><div class="lbl">Categories</div></div>
          <div class="hero-stat"><div class="num">0</div><div class="lbl">Uploads</div></div>
        </div>
      </div>
      <div class="hero-card">
        <img src="/me.png" alt="Developer" class="hero-card-avatar"
             onerror="this.style.display='none'" />
        <div class="hero-card-name">Built with care</div>
        <div class="hero-card-role">Open-source tools, your data stays yours</div>
        <div class="hero-card-badges">
          <span class="hero-badge privacy">🔒 No uploads</span>
          <span class="hero-badge">⚡ Client-side</span>
          <span class="hero-badge">🆓 Free forever</span>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="container">
      <div class="section-label">Categories</div>
      <h2 class="section-title">Everything you need</h2>
      <p class="section-desc">Each tool runs entirely in your browser. Pick a category to explore.</p>
      <div class="bento">
        <div class="bento-card bento-dev" onclick="location.hash='dev'">
          <div class="card-icon">⚡</div>
          <h3>Developer Tools <span style="font-size:var(--text-xs);color:var(--ink-4);font-weight:400">· 14 tools</span></h3>
          <p>JSON, UUID, Base64, Hash, Regex, Password, CIDR, Timestamp, JWT, Cron, URL Encode, HTML Entities, Base Converter, Color Converter.</p>
          <div class="tags">
            <span class="tag">JSON</span><span class="tag">UUID</span><span class="tag">Base64</span>
            <span class="tag">Hash</span><span class="tag">Regex</span><span class="tag">JWT</span>
            <span class="tag">Cron</span><span class="tag">Color</span>
          </div>
        </div>
        <div class="bento-card bento-text" onclick="location.hash='text'">
          <div class="card-icon">✍️</div>
          <h3>Text Tools <span style="font-size:var(--text-xs);color:var(--ink-4);font-weight:400">· 10 tools</span></h3>
          <p>Word counter, case converter, text diff, lorem ipsum, slug, statistics, find & replace, sort, dedup, reverse.</p>
          <div class="tags">
            <span class="tag">Words</span><span class="tag">Case</span><span class="tag">Diff</span>
            <span class="tag">Sort</span><span class="tag">Dedup</span><span class="tag">Reverse</span>
          </div>
        </div>
        <div class="bento-card bento-pdf" onclick="location.hash='pdf'">
          <div class="card-icon">📄</div>
          <h3>PDF Tools <span style="font-size:var(--text-xs);color:var(--ink-4);font-weight:400">· 3 tools</span></h3>
          <p>Merge multiple PDFs, split by page range, view metadata and optimize file size.</p>
          <div class="tags">
            <span class="tag">Merge</span><span class="tag">Split</span><span class="tag">Optimize</span>
          </div>
        </div>
        <div class="bento-card bento-image" onclick="location.hash='image'">
          <div class="card-icon">🖼️</div>
          <h3>Image Tools <span style="font-size:var(--text-xs);color:var(--ink-4);font-weight:400">· 4 tools</span></h3>
          <p>Convert formats, compress for web, resize with presets, crop with aspect ratios.</p>
          <div class="tags">
            <span class="tag">Convert</span><span class="tag">Compress</span>
            <span class="tag">Resize</span><span class="tag">Crop</span>
          </div>
        </div>
        <div class="bento-card bento-design" onclick="location.hash='design'">
          <div class="card-icon">🎨</div>
          <h3>Design Tools <span style="font-size:var(--text-xs);color:var(--ink-4);font-weight:400">· 9 tools</span></h3>
          <p>Color picker, contrast checker, box shadow, gradient, border radius, text shadow, circle generator, QR code, CSS button.</p>
          <div class="tags">
            <span class="tag">Color</span><span class="tag">Shadow</span>
            <span class="tag">Gradient</span><span class="tag">Circle</span>
            <span class="tag">QR Code</span><span class="tag">Button</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

// ---- Tool Category Page ----
function renderCategory(cat, toolSlug) {
  const catData = ALL[cat];
  if (!catData) return renderHome();

  const keys = Object.keys(catData.tools);
  const active = toolSlug && catData.tools[toolSlug] ? toolSlug : keys[0];
  const tool = catData.tools[active];

  const sidebar = keys.map(k => {
    const t = catData.tools[k];
    return `<a class="sidebar-link ${k===active?'active':''}"
               onclick="location.hash='${cat}/${k}'">${t.icon} ${t.name}</a>`;
  }).join('');

  return `
  <div class="tool-page">
    <div class="container">
      <h1>${catData.icon} ${catData.title}</h1>
      <p class="subtitle">All processing happens in your browser. Nothing uploaded.</p>
      <div class="tool-layout">
        <div class="sidebar">${sidebar}</div>
        <div class="tool-content">${tool ? tool.render() : '<p>Tool not found.</p>'}</div>
      </div>
    </div>
  </div>`;
}

// ---- Credits ----
function renderCredits() {
  const items = [
    { name:'PDF Worker', by:'fullo', url:'https://github.com/fullo/pdf-worker', desc:'Client-side PDF toolkit.' },
    { name:'PicBrew', by:'dannycranmer', url:'https://github.com/dannycranmer/imagetoolkit', desc:'Free private image tools.' },
    { name:'DevToolKit', by:'mingrammer', url:'https://github.com/mingrammer/devtoolkit', desc:'Developer utilities.' },
    { name:'Diff Checker Pro', by:'Sukarth', url:'https://github.com/Sukarth/diffchecker-pro', desc:'File comparison tool.' },
    { name:'pdf-lib', by:'Hopding', url:'https://github.com/Hopding/pdf-lib', desc:'PDF manipulation library.' },
    { name:'ui-craft', by:'educlopez', url:'https://github.com/educlopez/ui-craft', desc:'Design engineering system for anti-slop UI.' },
    { name:'tasteful-ui', by:'DonkeyKing01', url:'https://github.com/DonkeyKing01/tasteful-ui-skill', desc:'Taste-driven UI design skill.' },
    { name:'Circle-Generator', by:'donatj', url:'https://github.com/donatj/Circle-Generator', desc:'Pixel circle generator for block games.' },
    { name:'QR Code Generator', by:'nayuki', url:'https://github.com/nayuki/QR-Code-generator', desc:'High-quality QR code library.' },
  ];
  return `
  <div class="tool-page">
    <div class="container">
      <h1>Credits & Attribution</h1>
      <p class="subtitle">This website uses ideas and technology from these open-source projects.</p>
      <div class="credits-grid">
        ${items.map(c => `
          <div class="credit-card">
            <h3>${c.name}</h3><p>${c.desc}</p><p>By: <strong>${c.by}</strong></p>
            <p><a href="${c.url}" target="_blank">GitHub →</a></p>
            <span class="license-badge">MIT License</span>
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}

// ---- Router ----
function route() {
  const { cat, tool } = parseHash();
  document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('active', a.dataset.cat === cat));
  const main = document.getElementById('app-content');
  if (!cat) main.innerHTML = renderHome();
  else if (cat === 'credits') main.innerHTML = renderCredits();
  else if (ALL[cat]) {
    main.innerHTML = renderCategory(cat, tool);
    if (tool && ALL[cat].tools[tool]?.init) ALL[cat].tools[tool].init();
  } else main.innerHTML = renderHome();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- Boot ----
renderHeader();
renderFooter();
route();
window.addEventListener('hashchange', route);
