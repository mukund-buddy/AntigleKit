// ============================================================
// WebTools Hub — Main Application
// Anti-slop design: asymmetric bento, editorial hero, strong hierarchy
// ============================================================

import { DevTools } from './tools/dev-tools.js';
import { TextTools } from './tools/text-tools.js';
import { PdfTools } from './tools/pdf-tools.js';
import { ImageTools } from './tools/image-tools.js';

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
  dev:   { title: 'Developer Tools', icon: '⚡', tools: DevTools.tools },
  text:  { title: 'Text Tools',      icon: '✍️', tools: TextTools.tools },
  pdf:   { title: 'PDF Tools',       icon: '📄', tools: PdfTools.tools },
  image: { title: 'Image Tools',     icon: '🖼️', tools: ImageTools.tools },
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
      <div>© 2026 WebTools — Free, private, client-side tools.</div>
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
        <p class="hero-desc">PDF tools, image converters, text utilities, and developer tools. Everything runs in your browser — nothing ever leaves your device.</p>
        <div class="hero-actions">
          <button class="btn btn-primary" onclick="location.hash='dev'" style="padding:12px 24px;font-size:var(--text-base)">
            Start using tools →
          </button>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><div class="num">21</div><div class="lbl">Tools</div></div>
          <div class="hero-stat"><div class="num">4</div><div class="lbl">Categories</div></div>
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
          <h3>Developer Tools</h3>
          <p>JSON formatter, UUID generator, Base64 encoder, hash generator, regex tester, password generator, CIDR calculator, and timestamp converter.</p>
          <div class="tags">
            <span class="tag">JSON</span><span class="tag">UUID</span><span class="tag">Base64</span>
            <span class="tag">Hash</span><span class="tag">Regex</span><span class="tag">Password</span>
            <span class="tag">CIDR</span><span class="tag">Timestamp</span>
          </div>
        </div>
        <div class="bento-card bento-text" onclick="location.hash='text'">
          <div class="card-icon">✍️</div>
          <h3>Text Tools</h3>
          <p>Word counter, case converter, text diff, lorem ipsum, slug generator, and text statistics.</p>
          <div class="tags">
            <span class="tag">Words</span><span class="tag">Case</span><span class="tag">Diff</span>
            <span class="tag">Lorem</span><span class="tag">Slug</span><span class="tag">Stats</span>
          </div>
        </div>
        <div class="bento-card bento-pdf" onclick="location.hash='pdf'">
          <div class="card-icon">📄</div>
          <h3>PDF Tools</h3>
          <p>Merge multiple PDFs, split by page range, view metadata and optimize file size.</p>
          <div class="tags">
            <span class="tag">Merge</span><span class="tag">Split</span><span class="tag">Optimize</span>
          </div>
        </div>
        <div class="bento-card bento-image" onclick="location.hash='image'">
          <div class="card-icon">🖼️</div>
          <h3>Image Tools</h3>
          <p>Convert between formats, compress for web, resize with presets, and crop with aspect ratios.</p>
          <div class="tags">
            <span class="tag">Convert</span><span class="tag">Compress</span>
            <span class="tag">Resize</span><span class="tag">Crop</span>
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

  const content = tool ? tool.render() : '<p>Tool not found.</p>';

  return `
  <div class="tool-page">
    <div class="container">
      <h1>${catData.icon} ${catData.title}</h1>
      <p class="subtitle">All processing happens in your browser. Nothing uploaded.</p>
      <div class="tool-layout">
        <div class="sidebar">${sidebar}</div>
        <div class="tool-content">${content}</div>
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
    { name:'QR Code Generator', by:'Project Nayuki', url:'https://github.com/nayuki/QR-Code-generator', desc:'QR code library.' },
    { name:'pdf-lib', by:'Hopding', url:'https://github.com/Hopding/pdf-lib', desc:'PDF manipulation library.' },
    { name:'ui-craft', by:'educlopez', url:'https://github.com/educlopez/ui-craft', desc:'Design engineering system for anti-slop UI.' },
    { name:'tasteful-ui', by:'DonkeyKing01', url:'https://github.com/DonkeyKing01/tasteful-ui-skill', desc:'Taste-driven UI design skill.' },
  ];

  return `
  <div class="tool-page">
    <div class="container">
      <h1>Credits & Attribution</h1>
      <p class="subtitle">This website uses ideas and technology from these open-source projects.</p>
      <div class="credits-grid">
        ${items.map(c => `
          <div class="credit-card">
            <h3>${c.name}</h3>
            <p>${c.desc}</p>
            <p>By: <strong>${c.by}</strong></p>
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

  document.querySelectorAll('.nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.cat === cat);
  });

  const main = document.getElementById('app-content');

  if (!cat) {
    main.innerHTML = renderHome();
  } else if (cat === 'credits') {
    main.innerHTML = renderCredits();
  } else if (ALL[cat]) {
    main.innerHTML = renderCategory(cat, tool);
    if (tool && ALL[cat].tools[tool]?.init) ALL[cat].tools[tool].init();
  } else {
    main.innerHTML = renderHome();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- Boot ----
renderHeader();
renderFooter();
route();
window.addEventListener('hashchange', route);
