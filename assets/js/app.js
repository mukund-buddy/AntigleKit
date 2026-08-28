// AntigleKit — application shell, router, catalog, pages.
import { CREDITS, TOTAL_LIBS } from './credits-data.js';

/* ─── THEME ─── */
const THEME_KEY = 'nk-theme';
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const initial = saved || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', initial);
  syncToggle(initial);
}
function syncToggle(t) {
  const b = document.getElementById('theme-toggle');
  if (b) { b.setAttribute('aria-pressed', String(t === 'light')); b.textContent = t === 'dark' ? '☀️' : '🌙'; }
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  syncToggle(next);
}

/* ─── CATALOG ─── */
const CATEGORIES = {
  text: 'Text & Data', dev: 'Developer', pdf: 'PDF & Documents',
  image: 'Images', math: 'Math & Science', diagram: 'Diagrams',
  design: 'Design & Colour', utils: 'Utilities', minecraft: 'Minecraft',
};
const CATALOG = [
  // Text & Data
  { slug: 'wordcount', name: 'Word Counter', icon: '🔤', cat: 'text', file: 'text', keywords: 'count words characters letters' },
  { slug: 'case', name: 'Case Converter', icon: '🔠', cat: 'text', file: 'text', keywords: 'uppercase lowercase title case transform' },
  { slug: 'diff', name: 'Text Diff', icon: '🆚', cat: 'text', file: 'text', keywords: 'compare differences changes' },
  { slug: 'slug', name: 'Slug Generator', icon: '🔗', cat: 'text', file: 'text', keywords: 'url slug permalink seo' },
  { slug: 'lorem', name: 'Lorem Ipsum', icon: '📝', cat: 'text', file: 'text', keywords: 'placeholder text generator dummy' },
  { slug: 'textstats', name: 'Text Statistics', icon: '📊', cat: 'text', file: 'text', keywords: 'readability sentences avg syllables' },
  { slug: 'textutils', name: 'Text Utilities', icon: '🧹', cat: 'text', file: 'text', keywords: 'trim dedupe lines sort remove' },
  { slug: 'findreplace', name: 'Find & Replace', icon: '🔎', cat: 'text', file: 'text', keywords: 'search substitute regex' },
  { slug: 'csv', name: 'CSV Tools', icon: '📑', cat: 'text', file: 'text', keywords: 'csv json xlsx excel convert' },
  { slug: 'markdown', name: 'Markdown Preview', icon: '📄', cat: 'text', file: 'text', keywords: 'md render html' },
  { slug: 'format', name: 'Data Formatter', icon: '🧾', cat: 'text', file: 'text', keywords: 'json yaml xml pretty validate' },
  // Developer
  { slug: 'uuidhash', name: 'UUID & Hash', icon: '🆔', cat: 'dev', file: 'dev', keywords: 'uuid v4 sha256 sha512 md5 base64 random' },
  { slug: 'base64', name: 'Base64', icon: '📦', cat: 'dev', file: 'dev', keywords: 'encode decode base64' },
  { slug: 'code', name: 'Code Beautifier', icon: '💻', cat: 'dev', file: 'dev', keywords: 'beautify minify js html css format' },
  { slug: 'jwt', name: 'JWT Decoder', icon: '🎫', cat: 'dev', file: 'dev', keywords: 'jwt token decode header payload' },
  { slug: 'timestamp', name: 'Timestamp Converter', icon: '⏱️', cat: 'dev', file: 'dev', keywords: 'unix epoch date time convert' },
  { slug: 'password', name: 'Password Generator', icon: '🔐', cat: 'dev', file: 'dev', keywords: 'password random secure strength' },
  { slug: 'url', name: 'URL Parser', icon: '🌐', cat: 'dev', file: 'dev', keywords: 'url encode decode parse query' },
  { slug: 'cidr', name: 'CIDR Calculator', icon: '🌍', cat: 'dev', file: 'dev', keywords: 'subnet ip mask network range' },
  { slug: 'cron', name: 'Cron Parser', icon: '⏰', cat: 'dev', file: 'dev', keywords: 'cron schedule expression explain' },
  { slug: 'qrcode', name: 'QR Code Generator', icon: '⬛', cat: 'dev', file: 'dev', keywords: 'qr code svg png generate' },
  { slug: 'color', name: 'Color Tools', icon: '🎨', cat: 'dev', file: 'dev', keywords: 'color picker hex rgb hsl palette convert' },
  { slug: 'regex', name: 'Regex Tester', icon: '🔧', cat: 'dev', file: 'dev', keywords: 'regex regular expression test match' },
  { slug: 'circle', name: 'Circle / Avatar', icon: '🟣', cat: 'dev', file: 'dev', keywords: 'circle avatar identicon generator donatj' },
  // PDF & Documents
  { slug: 'pdf', name: 'PDF Tools', icon: '📕', cat: 'pdf', file: 'pdf', keywords: 'pdf merge split metadata compress' },
  { slug: 'docx', name: 'DOCX Tools', icon: '📘', cat: 'pdf', file: 'pdf', keywords: 'docx markdown word convert html' },
  // Images
  { slug: 'image', name: 'Image Tools', icon: '🖼️', cat: 'image', file: 'image', keywords: 'image convert compress resize crop png jpg webp' },
  // Math & Science
  { slug: 'calculator', name: 'Calculator', icon: '🧮', cat: 'math', file: 'math', keywords: 'calculator calc math' },
  { slug: 'math', name: 'Math & Formula', icon: '📐', cat: 'math', file: 'math', keywords: 'math evaluate formula katex' },
  { slug: 'unit', name: 'Unit Converter', icon: '📏', cat: 'math', file: 'math', keywords: 'unit convert length weight temperature' },
  { slug: 'percent', name: 'Percentage Calculator', icon: '💯', cat: 'math', file: 'math', keywords: 'percentage percent calc' },
  // Diagrams
  { slug: 'mermaid', name: 'Mermaid Diagram', icon: '🔀', cat: 'diagram', file: 'diagram', keywords: 'mermaid diagram flowchart sequence' },
  // Design & Colour
  { slug: 'colour', name: 'Colour Converter', icon: '🎨', cat: 'design', file: 'design', keywords: 'colour color hex rgb hsl oklch convert picker' },
  { slug: 'palette', name: 'Palette Generator', icon: '🎭', cat: 'design', file: 'design', keywords: 'colour palette harmony analogous complementary triadic' },
  { slug: 'gradient', name: 'Gradient Generator', icon: '🌈', cat: 'design', file: 'design', keywords: 'gradient css linear radial conic background' },
  { slug: 'favicon', name: 'Favicon Generator', icon: '⭐', cat: 'design', file: 'design', keywords: 'favicon icon ico apple-touch-icon generate' },
  { slug: 'svgOpt', name: 'SVG Optimiser', icon: '✂️', cat: 'design', file: 'design', keywords: 'svg optimise minify compress clean' },
  // Utilities
  { slug: 'cipher', name: 'Cipher Decoder', icon: '🔐', cat: 'utils', file: 'utils', keywords: 'cipher decode rot13 caesar atbash base64' },
  { slug: 'scicalc', name: 'Scientific Calculator', icon: '🔬', cat: 'utils', file: 'utils', keywords: 'scientific calculator sin cos tan log' },
  { slug: 'baseconv', name: 'Base Converter', icon: '🔢', cat: 'utils', file: 'utils', keywords: 'number base binary octal hex decimal convert' },
  { slug: 'timecalc', name: 'Time Calculator', icon: '⏱️', cat: 'utils', file: 'utils', keywords: 'time duration add subtract convert hours minutes' },
  { slug: 'barcode', name: 'Barcode Generator', icon: '📊', cat: 'utils', file: 'utils', keywords: 'barcode code128 generate image' },
  // Minecraft
  { slug: 'mcCircle', name: 'MC Circle Generator', icon: '⛏️', cat: 'minecraft', file: 'mc', keywords: 'minecraft circle oval sphere dome blueprint block grid litematic mcpack bedrock java structure' },
];
const bySlug = Object.fromEntries(CATALOG.map(t => [t.slug, t]));

/* ─── RENDER: HOME ─── */
function renderHome() {
  const cats = Object.entries(CATEGORIES).map(([key, title]) => {
    const cards = CATALOG.filter(t => t.cat === key).map(t => `
      <a class="card" href="#/t/${t.slug}" data-tool="${t.slug}"
         data-search="${(t.name + ' ' + t.keywords).toLowerCase()}">
        <div class="card-icon" aria-hidden="true">${t.icon}</div>
        <h3>${t.name}</h3>
        <div class="tags">${t.keywords.split(' ').slice(0, 3).map(k => `<span class="tag">${k}</span>`).join('')}</div>
      </a>`).join('');
    return `
      <section class="section" id="cat-${key}">
        <div class="section-head">
          <div class="cat-label">${title}</div>
          <h2>${title}</h2>
        </div>
        <div class="grid">${cards}</div>
      </section>`;
  }).join('');

  return `
  <section class="hero">
    <div class="hero-inner">
      <div>
        <span class="hero-eyebrow">🌙 Free tools · Online or offline</span>
        <h1>Your tools, <em>your device</em>.</h1>
        <p class="hero-desc">${CATALOG.length} free utilities for text, developers, PDFs, images, math, Minecraft and more.
          Use online or run locally — your files never leave your device.</p>
        <div class="search">
          <span class="search-ico" aria-hidden="true">🔍</span>
          <input id="home-search" type="search" placeholder="Search ${CATALOG.length} tools…"
                 aria-label="Search tools" autocomplete="off" />
        </div>
        <p class="search-hint">Press <kbd>/</kbd> to search · <kbd>Esc</kbd> to clear</p>
        <div class="hero-badges">
          <span class="badge">🔒 No uploads</span>
          <span class="badge">⚡ Client-side</span>
          <span class="badge">🆓 Free forever</span>
          <span class="badge">🌗 Light &amp; dark</span>
        </div>
      </div>
      <div class="profile-card" aria-hidden="true">
        <div class="hero-eyebrow" style="margin-bottom:12px">Open source</div>
        <div style="font-family:var(--font-display);font-size:var(--text-2xl);margin-bottom:8px">Built with care</div>
        <p class="muted" style="margin:0">Powered by ${TOTAL_LIBS}+ permissively licensed open-source projects, with attribution.</p>
      </div>
    </div>
  </section>
  <div id="catalog">${cats}</div>`;
}

/* ─── RENDER: TOOL ─── */
async function renderTool(slug) {
  const meta = bySlug[slug];
  if (!meta) return renderHome();
  const main = document.getElementById('main');
  main.innerHTML = `<div class="loading"><div class="spinner"></div><div>Loading ${meta.name}…</div></div>`;
  try {
    const mod = await import(`./tools/${meta.file}.js`);
    const tool = mod.tools[slug];
    if (!tool) throw new Error('Tool not found');
    const nav = Object.entries(CATEGORIES).map(([k, title]) => `
      <div style="margin-bottom:14px">
        <div class="cat-label" style="margin-bottom:6px">${title}</div>
        ${CATALOG.filter(t => t.cat === k).map(t => `
          <a class="sidebar-link ${t.slug === slug ? 'active' : ''}" href="#/t/${t.slug}"
             style="display:block;padding:8px 10px;border-radius:8px;color:var(--text-2);min-height:40px">${t.icon} ${t.name}</a>`).join('')}
      </div>`).join('');
    main.innerHTML = `
      <p class="breadcrumb"><a href="#/">Home</a> / <span>${CATEGORIES[meta.cat]}</span> / <strong>${meta.name}</strong></p>
      <div class="tool-layout">
        <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Toggle tools panel">☰ Tools</button>
        <aside class="tool-side" id="tool-sidebar">${nav}</aside>
        <div class="tool-main">
          <div class="tool-head">
            <div class="card-icon" aria-hidden="true">${meta.icon}</div>
            <div><h1 style="margin:0">${meta.name}</h1><p class="muted" style="margin:0">${tool.desc || ''}</p></div>
          </div>
          <div class="panel">${tool.render()}</div>
          <p class="note">🔒 This tool runs entirely in your browser. Nothing is uploaded.</p>
        </div>
      </div>`;
    // Sidebar toggle
    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('tool-sidebar');
    if (toggle && sidebar) {
      // Create backdrop
      let backdrop = document.getElementById('sidebar-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'sidebar-backdrop';
        backdrop.className = 'sidebar-backdrop';
        document.body.appendChild(backdrop);
      }
      function closeSidebar() {
        sidebar.classList.remove('open');
        toggle.classList.remove('active');
        backdrop.classList.remove('show');
      }
      function openSidebar() {
        sidebar.classList.add('open');
        toggle.classList.add('active');
        backdrop.classList.add('show');
      }
      toggle.addEventListener('click', () => {
        sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
      });
      backdrop.addEventListener('click', closeSidebar);
      // Close sidebar when clicking a link on mobile
      sidebar.addEventListener('click', e => {
        if (e.target.closest('.sidebar-link') && window.innerWidth < 720) {
          closeSidebar();
        }
      });
      // Close on Escape key
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
      });
    }
    if (tool.init) tool.init();
  } catch (e) {
    main.innerHTML = `<div class="panel"><h2>Could not load this tool</h2><p class="err">${e.message}</p>
      <p>Check your connection (some tools load small libraries from a CDN on first use).</p></div>`;
  }
}

/* ─── RENDER: ABOUT ─── */
function renderAbout() {
  return `
  <section class="section">
    <div class="section-head">
      <div class="cat-label">About</div>
      <h1>What is AntigleKit?</h1>
    </div>

    <div class="panel">
      <p>AntigleKit is a collection of practical, free utilities for everyday tasks — text processing, developer tools, PDF and document handling, image editing, mathematics, Minecraft blueprints, and more.</p>
      <p>Every tool runs entirely in your browser. No uploads, no accounts, no data leaving your device.</p>
    </div>

    <div class="panel" style="margin-top:16px">
      <h2>Why AntigleKit?</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;margin-top:16px">
        <div>
          <strong>Simple tools</strong>
          <p class="muted" style="font-size:var(--text-sm)">Each tool does one thing well. No bloat, no unnecessary features.</p>
        </div>
        <div>
          <strong>Easy navigation</strong>
          <p class="muted" style="font-size:var(--text-sm)">Browse by category or search. Find what you need in seconds.</p>
        </div>
        <div>
          <strong>Privacy-conscious</strong>
          <p class="muted" style="font-size:var(--text-sm)">All processing happens locally. Your files never leave your browser.</p>
        </div>
        <div>
          <strong>Online + Offline</strong>
          <p class="muted" style="font-size:var(--text-sm)">Use it online, or download from GitHub and run it locally. Your choice.</p>
        </div>
        <div>
          <strong>No unnecessary complexity</strong>
          <p class="muted" style="font-size:var(--text-sm)">Lightweight, fast, and built to work without friction.</p>
        </div>
        <div>
          <strong>Open Source</strong>
          <p class="muted" style="font-size:var(--text-sm)">Built with permissively licensed libraries. Full attribution and source code available.</p>
        </div>
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <h2>Online or Offline</h2>
      <p>AntigleKit works in two ways:</p>
      <ol style="padding-left:20px;color:var(--text-2)">
        <li><strong>Online</strong> — use it directly in your browser. No installation needed.</li>
        <li><strong>Offline</strong> — download the project from GitHub, open the folder in a terminal, run <code>npx serve .</code>, and open the local URL. Works without internet after first load.</li>
      </ol>
    </div>

    <div class="panel" style="margin-top:16px">
      <h2>Open Source</h2>
      <p>AntigleKit is built using ${TOTAL_LIBS}+ open-source projects with proper attribution. Every library used has a permissive license (MIT, Apache-2.0, BSD, or ISC).</p>
      <p>See the <a href="#/open-source">Open Source &amp; Credits</a> page for the full list.</p>
    </div>

    <div class="panel" style="margin-top:16px">
      <h2>Developer</h2>
      <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
        <img src="assets/img/me.png" alt="mukund-buddy" width="80" height="80" style="border-radius:16px;border:2px solid var(--accent)" />
        <div>
          <strong style="font-size:var(--text-lg)">mukund-buddy</strong>
          <p class="muted" style="font-size:var(--text-sm);margin:4px 0 8px">Developer & maintainer of AntigleKit</p>
          <a href="https://github.com/mukund-buddy" target="_blank" rel="noopener" class="btn btn-secondary" style="min-height:36px;padding:6px 14px;font-size:var(--text-sm)">GitHub →</a>
        </div>
      </div>
    </div>

    <div class="stat-row" style="margin-top:24px;justify-content:center">
      <div class="stat"><div class="num">${CATALOG.length}</div><div class="lbl">Tools</div></div>
      <div class="stat"><div class="num">${Object.keys(CATEGORIES).length}</div><div class="lbl">Categories</div></div>
      <div class="stat"><div class="num">${TOTAL_LIBS}+</div><div class="lbl">OSS libraries</div></div>
    </div>
  </section>`;
}

/* ─── RENDER: FAQ ─── */
function renderFaq() {
  const items = [
    ['Is my data really private?', 'Yes. All processing happens in your browser using JavaScript. Files are read locally and never sent to any server. You can also download AntigleKit and run it entirely offline.'],
    ['Do I need to create an account?', 'No account, no sign-up, no email. Just open a tool and use it.'],
    ['Why do some tools load a library from a CDN?', 'A few tools (PDF, DOCX, Math, Mermaid…) use small open-source libraries. They are fetched from a public CDN (esm.sh / cdn.sheetjs.com) on first use only, then cached by your browser.'],
    ['Which licenses are used?', 'Only permissive licenses: MIT, Apache-2.0, BSD and ISC. No copyleft (GPL/AGPL) code is in the main project. Full attribution is on the Open Source page.'],
    ['Can I run this locally?', 'Yes. Download the project, open the folder in a terminal, run npx serve . and open the local URL. No internet required after first load.'],
    ['How do I report a bug or request a tool?', 'Open an issue on the project repository linked from the Open Source page.'],
  ];
  return `
  <section class="section">
    <div class="section-head"><div class="cat-label">Help</div><h2>Frequently asked questions</h2></div>
    ${items.map(([q, a]) => `
      <details class="faq-item"><summary>${q}</summary><div class="faq-body">${a}</div></details>`).join('')}
  </section>`;
}

/* ─── RENDER: OPEN SOURCE ─── */
function renderCredits() {
  return `
  <section class="section">
    <div class="section-head">
      <div class="cat-label">Attribution</div>
      <h2>Open Source &amp; Credits</h2>
      <p>AntigleKit is built on these permissively licensed open-source projects. Thank you to all the authors.</p>
    </div>
    <div class="credits-grid">
      ${CREDITS.map(c => `
        <div class="credit-card">
          <h3>${c.name}</h3>
          <p class="muted" style="margin:0 0 6px">${c.desc}</p>
          <p style="margin:0">By <strong>${c.by}</strong></p>
          <p><a href="${c.url}" target="_blank" rel="noopener">Repository →</a></p>
          <span class="lic">${c.lic}</span>
        </div>`).join('')}
    </div>
  </section>`;
}

/* ─── ROUTER ─── */
function route() {
  const raw = location.hash.replace(/^#\/?/, '');
  const parts = raw.split('/').filter(Boolean);
  const main = document.getElementById('main');
  document.querySelectorAll('.primary-nav a').forEach(a => a.classList.remove('active'));

  if (parts[0] === 't' && parts[1]) {
    markNav('tools');
    renderTool(parts[1]);
  } else if (parts[0] === 'about') {
    markNav('about'); main.innerHTML = renderAbout();
  } else if (parts[0] === 'faq') {
    markNav('faq'); main.innerHTML = renderFaq();
  } else if (parts[0] === 'open-source') {
    main.innerHTML = renderCredits();
  } else {
    markNav('home'); main.innerHTML = renderHome(); wireSearch();
  }
  // Clean up mobile sidebar when leaving tool pages
  const oldBackdrop = document.getElementById('sidebar-backdrop');
  if (oldBackdrop) oldBackdrop.remove();
  main.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'auto' });
}
function markNav(n) {
  const a = document.querySelector(`.primary-nav a[data-nav="${n}"]`);
  if (a) a.classList.add('active');
}

/* ─── SEARCH ─── */
function wireSearch() {
  const input = document.getElementById('home-search');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll('#catalog .card').forEach(card => {
      const hit = !q || card.dataset.search.includes(q);
      card.style.display = hit ? '' : 'none';
      if (hit) visible++;
    });
    document.querySelectorAll('#catalog .section').forEach(sec => {
      const any = [...sec.querySelectorAll('.card')].some(c => c.style.display !== 'none');
      sec.style.display = any ? '' : 'none';
    });
    let empty = document.getElementById('empty-state');
    if (!visible) {
      if (!empty) { empty = document.createElement('p'); empty.id = 'empty-state'; empty.className = 'muted'; empty.style.padding = '24px 0'; document.getElementById('catalog').appendChild(empty); }
      empty.textContent = `No tools match “${input.value}”.`;
    } else if (empty) empty.remove();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const first = document.querySelector('#catalog .card:not([style*="display: none"])');
      if (first) location.hash = first.getAttribute('href').slice(1);
    }
  });
}

/* ─── KEYBOARD ─── */
function wireKeys() {
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      const s = document.getElementById('home-search'); if (s) { e.preventDefault(); s.focus(); }
    }
    if (e.key === 'Escape' && document.activeElement?.id === 'home-search') {
      document.activeElement.value = ''; document.activeElement.dispatchEvent(new Event('input')); document.activeElement.blur();
    }
  });
}

/* ─── BOOT ─── */
initTheme();
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
wireKeys();
route();
window.addEventListener('hashchange', route);
