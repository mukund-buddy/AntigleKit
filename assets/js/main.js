/* main.js — site chrome behavior (progressive enhancement).
   CSP-compatible: no eval, no inline handlers, no user data in DOM. */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Relative base: derived from the resolved stylesheet URL, so it works in
     any deployment layout (domain root, subpath hosting, npx serve, file://). */
  function siteRoot() {
    var css = Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"]'))
      .filter(function (l) { return l.href && l.href.indexOf('/assets/') !== -1; })[0];
    if (css && css.href) {
      return css.href.slice(0, css.href.indexOf('/assets/') + 1);
    }
    return './';
  }
  function siteHref(h) {
    if (typeof h !== 'string' || h.charAt(0) !== '/') return h;
    return siteRoot() + h.slice(1);
  }
  function siteAsset(p) {
    return siteRoot() + p;
  }

  /* ── Sticky header shadow on scroll ────────────────────────────── */
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Scroll-to-top button (floating, standalone — not in footer) ─ */
  var toTopBtn = document.createElement('button');
  toTopBtn.type = 'button';
  toTopBtn.className = 'to-top';
  toTopBtn.setAttribute('aria-label', 'Back to top');
  var toTopSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  toTopSvg.setAttribute('width', '20');
  toTopSvg.setAttribute('height', '20');
  toTopSvg.setAttribute('viewBox', '0 0 24 24');
  toTopSvg.setAttribute('fill', 'none');
  toTopSvg.setAttribute('stroke', 'currentColor');
  toTopSvg.setAttribute('stroke-width', '2');
  toTopSvg.setAttribute('stroke-linecap', 'round');
  toTopSvg.setAttribute('stroke-linejoin', 'round');
  toTopSvg.setAttribute('aria-hidden', 'true');
  var toTopPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  toTopPath.setAttribute('d', 'M12 19V5M5 12l7-7 7 7');
  toTopSvg.appendChild(toTopPath);
  toTopBtn.appendChild(toTopSvg);
  document.body.appendChild(toTopBtn);
  var onToTopScroll = function () {
    toTopBtn.classList.toggle('is-visible', window.scrollY > 480);
  };
  toTopBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  });
  window.addEventListener('scroll', onToTopScroll, { passive: true });
  onToTopScroll();

  /* ── Mobile nav ────────────────────────────────────────────────── */
  var hamburger = document.getElementById('hamburgerBtn');
  var mobileNav = document.getElementById('mobileNav');
  if (hamburger && mobileNav) {
    var closeNav = function () {
      mobileNav.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    };
    hamburger.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(open));
    });
    mobileNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* ── Reveal-on-scroll (skip under reduced motion) ──────────────── */
  var reveals = document.querySelectorAll('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ── Site search overlay ───────────────────────────────────────── */
  var searchOverlay = document.getElementById('searchOverlay');
  var searchToggle = document.getElementById('searchToggle');
  var mobileSearchBtn = document.getElementById('mobileSearchBtn');
  var searchInput = document.getElementById('searchInput');
  var searchResults = document.getElementById('searchResults');

  var FALLBACK_TOOLS = [
    { name: "Manifest Generator", href: "/tools/manifest-generator/", tagline: "Generate a valid manifest.json for Bedrock resource, behavior, world-template, and script packs.", categoryLabel: "Minecraft", status: "live", keywords: ["manifest.json","bedrock","addon","resource pack","behavior pack","world template","minecraft","pack"], sortOrder: 10 },
    { name: "Manifest Validator", href: "/tools/manifest-validator/", tagline: "Validate an existing manifest.json against Bedrock rules — required fields, UUID format, integer versions.", categoryLabel: "Minecraft", status: "live", keywords: ["validate manifest","manifest check","bedrock","format_version"], sortOrder: 20 },
    { name: "Identifier Validator", href: "/tools/identifier-validator/", tagline: "Check namespaces and resource identifiers against Bedrock's allowed character rules.", categoryLabel: "Minecraft", status: "live", keywords: ["identifier","namespace","minecraft","id","validation"], sortOrder: 30 },
    { name: "Pack Structure Checker", href: "/tools/pack-structure-checker/", tagline: "Verify an add-on's folder layout against what Bedrock expects inside an .mcpack.", categoryLabel: "Minecraft", status: "live", keywords: ["pack structure","addon folder","mcpack","bedrock","layout"], sortOrder: 40 },
    { name: "Pack Version Generator", href: "/tools/pack-version-generator/", tagline: "Pick the correct next version for your pack, with bumping and consistency checks.", categoryLabel: "Minecraft", status: "live", keywords: ["version","pack","semver","bedrock","manifest"], sortOrder: 50 },
    { name: "MC Title Studio", href: "/tools/mc-title-studio/", tagline: "Turn a photo into a Bedrock resource pack that fills the full title screen — cropped, packed, and downloaded in your browser.", categoryLabel: "Minecraft", status: "live", keywords: ["minecraft","bedrock","title screen","background","mcpack","resource pack","wallpaper","json ui"], sortOrder: 55 },
    { name: "Thumbnail Fetcher", href: "/tools/thumbnail-fetcher/", tagline: "Get a video's thumbnail URL from its link — no login, no account.", categoryLabel: "YouTube", status: "live", keywords: ["youtube","thumbnail","video","image","url"], sortOrder: 60 },
    { name: "Thumbnail Downloader", href: "/tools/thumbnail-downloader/", tagline: "Download a video thumbnail in several sizes — default, hq, maxres.", categoryLabel: "YouTube", status: "live", keywords: ["youtube","thumbnail","download","maxres","image"], sortOrder: 70 },
    { name: "Timestamp Generator", href: "/tools/timestamp-generator/", tagline: "Convert a list of minute/second markers into clean, copy-ready timestamps.", categoryLabel: "YouTube", status: "live", keywords: ["youtube","timestamp","chapters","minutes","seconds"], sortOrder: 80 },
    { name: "Chapter Formatter", href: "/tools/chapter-formatter/", tagline: "Format raw notes into YouTube's accepted chapter lines with headings and times.", categoryLabel: "YouTube", status: "live", keywords: ["youtube","chapters","format","timestamps"], sortOrder: 90 },
    { name: "Description Formatter", href: "/tools/description-generator/", tagline: "Format video descriptions — credits, links, and timestamps — consistently.", categoryLabel: "YouTube", status: "live", keywords: ["youtube","description","format","credits","links"], sortOrder: 100 },
    { name: "Title Length Checker", href: "/tools/title-length-checker/", tagline: "Check titles against length limits and see how they may be truncated.", categoryLabel: "YouTube", status: "live", keywords: ["youtube","title","length","truncate","characters"], sortOrder: 110 },
    { name: "Hashtag Formatter", href: "/tools/hashtag-formatter/", tagline: "Clean, deduplicate, and count hashtags; check against tag limits.", categoryLabel: "YouTube", status: "live", keywords: ["youtube","hashtag","format","tags","count"], sortOrder: 120 },
    { name: "Meta Tag Generator", href: "/tools/meta-tag-generator/", tagline: "Generate title, description, canonical, Open Graph, and Twitter tags.", categoryLabel: "Web Development", status: "live", keywords: ["meta tags","seo","og","twitter cards","html"], sortOrder: 130 },
    { name: "robots.txt Generator", href: "/tools/robots-generator/", tagline: "Build a robots.txt with allowed and disallowed paths and a sitemap line.", categoryLabel: "Web Development", status: "live", keywords: ["robots.txt","seo","crawl","allow","disallow"], sortOrder: 140 },
    { name: "sitemap.xml Generator", href: "/tools/sitemap-generator/", tagline: "Generate sitemap.xml entries from a pasted list of URLs.", categoryLabel: "Web Development", status: "live", keywords: ["sitemap","xml","seo","url","google"], sortOrder: 150 },
    { name: "Open Graph Generator", href: "/tools/open-graph-generator/", tagline: "Build and preview Open Graph tags for social sharing cards.", categoryLabel: "Web Development", status: "live", keywords: ["open graph","og tags","social share","preview"], sortOrder: 160 },
    { name: "JSON Formatter", href: "/tools/json-formatter/", tagline: "Format and indent JSON for readability.", categoryLabel: "Web Development", status: "live", keywords: ["json","format","indent","pretty","minify"], sortOrder: 170 },
    { name: "JSON Validator", href: "/tools/json-validator/", tagline: "Validate JSON syntax and get clear, line-level errors.", categoryLabel: "Web Development", status: "live", keywords: ["json","validate","syntax","parse","error"], sortOrder: 180 },
    { name: "Base64 Encode / Decode", href: "/tools/base64-encode-decode/", tagline: "Encode and decode Base64 for text and files.", categoryLabel: "Web Development", status: "live", keywords: ["base64","encode","decode","binary"], sortOrder: 190 },
    { name: "URL Encoder", href: "/tools/url-encoder/", tagline: "Percent-encode a string for safe use in URLs and query strings.", categoryLabel: "Web Development", status: "live", keywords: ["url","encode","percent","query string"], sortOrder: 200 },
    { name: "URL Decoder", href: "/tools/url-decoder/", tagline: "Decode percent-encoded URLs and read decoded query strings.", categoryLabel: "Web Development", status: "live", keywords: ["url","decode","percent","query string"], sortOrder: 210 },
    { name: "Slug Generator", href: "/tools/slug-generator/", tagline: "Convert titles and captions into clean, URL-safe slugs.", categoryLabel: "Web Development", status: "live", keywords: ["slug","seo","url","title","text"], sortOrder: 220 },
    { name: "Regex Tester", href: "/tools/regex-tester/", tagline: "Test regular expressions live against sample text.", categoryLabel: "Web Development", status: "live", keywords: ["regex","regular expression","pattern","test"], sortOrder: 230 },
    { name: "UUID Generator", href: "/tools/uuid-generator/", tagline: "Generate v4 UUIDs, one or many, ready to copy.", categoryLabel: "Web Development", status: "live", keywords: ["uuid","guid","generate","value"], sortOrder: 240 },
    { name: "CSS Gradient Generator", href: "/tools/css-gradient-generator/", tagline: "Design linear and radial gradients visually and copy CSS.", categoryLabel: "Web Development", status: "live", keywords: ["css","gradient","color","linear","radial"], sortOrder: 250 },
    { name: "CSS Shadow Generator", href: "/tools/css-shadow-generator/", tagline: "Fine-tune box-shadows visually and copy the CSS.", categoryLabel: "Web Development", status: "live", keywords: ["css","box-shadow","shadow","design"], sortOrder: 260 },
    { name: "Flexbox Generator", href: "/tools/flexbox-generator/", tagline: "Configure flex containers and items and copy the CSS.", categoryLabel: "Web Development", status: "live", keywords: ["css","flexbox","flex","layout"], sortOrder: 270 },
    { name: "Grid Generator", href: "/tools/grid-generator/", tagline: "Configure CSS grid templates and copy the CSS.", categoryLabel: "Web Development", status: "live", keywords: ["css","grid","layout","template"], sortOrder: 280 },
    { name: "Attendance Calculator", href: "/tools/attendance-calculator/", tagline: "Calculate attendance percentages and what is needed to stay above a threshold.", categoryLabel: "Student", status: "live", keywords: ["attendance","percentage","college","classes"], sortOrder: 320 },
    { name: "Percentage Calculator", href: "/tools/percentage-calculator/", tagline: "Find percentages, changes, and percentage differences instantly.", categoryLabel: "Student", status: "live", keywords: ["percentage","calculator","marks","grade"], sortOrder: 330 },
    { name: "CGPA Calculator", href: "/tools/cgpa-calculator/", tagline: "Compute CGPA from semester credits and grades.", categoryLabel: "Student", status: "live", keywords: ["cgpa","gpa","grade","credits","semester"], sortOrder: 340 },
    { name: "Reading Time Calculator", href: "/tools/reading-time-calculator/", tagline: "Estimate how long text takes to read at various speeds.", categoryLabel: "Student", status: "live", keywords: ["reading time","words","estimate","wpm"], sortOrder: 350 },
    { name: "Word Counter", href: "/tools/word-counter/", tagline: "Count words, sentences, and paragraphs in any text.", categoryLabel: "Student", status: "live", keywords: ["words","counter","count","essay"], sortOrder: 360 },
    { name: "Character Counter", href: "/tools/character-counter/", tagline: "Count characters with focus on limits (titles, bios, SMS).", categoryLabel: "Student", status: "live", keywords: ["characters","counter","limit","sms"], sortOrder: 370 },
    { name: "Color Palette Generator", href: "/tools/color-palette-generator/", tagline: "Generate harmonious color palettes and copy HEX/RGB/HSL.", categoryLabel: "Design", status: "live", keywords: ["color","palette","hex","rgb","hsl"], sortOrder: 450 },
    { name: "Glassmorphism Generator", href: "/tools/glassmorphism-generator/", tagline: "Design frosted-glass panels and copy the CSS.", categoryLabel: "Design", status: "live", keywords: ["glassmorphism","glass","blur","css","ui"], sortOrder: 460 },
    { name: "Contrast Checker", href: "/tools/contrast-checker/", tagline: "Check WCAG contrast ratios between two colors.", categoryLabel: "Design", status: "live", keywords: ["contrast","wcag","accessibility","color","ratio"], sortOrder: 470 },
    { name: "Border Radius Generator", href: "/tools/border-radius-generator/", tagline: "Shape corner radii visually and copy the CSS.", categoryLabel: "Design", status: "live", keywords: ["border radius","rounded","css","corner"], sortOrder: 480 },
    { name: "SVG Optimizer", href: "/tools/svg-optimizer/", tagline: "Clean up and minify inline SVG markup.", categoryLabel: "Design", status: "live", keywords: ["svg","optimize","minify","icon"], sortOrder: 490 },
    { name: "Favicon Generator", href: "/tools/favicon-generator/", tagline: "Create favicon sizes from an image or emoji and download them.", categoryLabel: "Design", status: "live", keywords: ["favicon","icon","png","svg","browser"], sortOrder: 500 },
    { name: "Password Generator", href: "/tools/password-generator/", tagline: "Generate strong, random passwords locally in your browser.", categoryLabel: "Security", status: "live", keywords: ["password","generate","random","secure"], sortOrder: 510 },
    { name: "Password Strength Checker", href: "/tools/password-strength-checker/", tagline: "Score password strength and entropy without sending it anywhere.", categoryLabel: "Security", status: "live", keywords: ["password","strength","entropy","check","secure"], sortOrder: 520 },
    { name: "SHA-256 Generator", href: "/tools/sha256-generator/", tagline: "Hash text or files with SHA-256 using the browser's Web Crypto API.", categoryLabel: "Security", status: "live", keywords: ["sha256","hash","crypto","checksum"], sortOrder: 530 },
    { name: "QR Code Generator", href: "/tools/qrcode-generator/", tagline: "Create QR codes from any text or URL and download them.", categoryLabel: "Security", status: "live", keywords: ["qr","qrcode","code","download"], sortOrder: 540 },
    { name: "QR Scanner", href: "/tools/qr-code-scanner/", tagline: "Scan and decode QR codes from an image or camera.", categoryLabel: "Security", status: "live", keywords: ["qr","scan","decode","camera"], sortOrder: 550 },
    { name: "Barcode Generator", href: "/tools/barcode-generator/", tagline: "Create Code 128, Code 39, EAN-13, or UPC-A barcodes and download them as PNG.", categoryLabel: "Business", status: "live", keywords: ["barcode","code 128","code 39","ean-13","upc-a","label","product","scan"], sortOrder: 560 },
    { name: "Unit Converter", href: "/tools/unit-converter/", tagline: "Convert length, mass, temperature, volume, area, time, data, and speed instantly.", categoryLabel: "Business", status: "live", keywords: ["unit","convert","length","mass","temperature","volume","area","time","data","speed","metric","imperial"], sortOrder: 570 },
    { name: "Pinterest Pin Saver", href: "/tools/pinterest-downloader/", tagline: "Preview any Pinterest pin — photos and video pins — and save the image with your browser's save menu.", categoryLabel: "Web Development", status: "live", keywords: ["pinterest","pin","save","download","image","video"], sortOrder: 580 }
  ];

  var toolsCache = null;
  var activeIndex = -1;
  var lastFocused = null;

  function isTypingTarget(node) {
    return node && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.isContentEditable);
  }

  function loadTools() {
    if (toolsCache) return Promise.resolve(toolsCache);
    return fetch(siteAsset('assets/data/tools.json'))
      .then(function (r) { if (!r.ok) throw new Error('load failed'); return r.json(); })
      .then(function (data) {
        toolsCache = (data && Array.isArray(data.tools)) ? data.tools : FALLBACK_TOOLS;
        return toolsCache;
      })
      .catch(function () { toolsCache = FALLBACK_TOOLS; return toolsCache; });
  }

  function buildRow(tool) {
    var row = document.createElement('div');
    row.className = 'search-result';
    row.setAttribute('role', 'option');
    if (tool.status !== 'live') row.setAttribute('aria-disabled', 'true');
    row.dataset.href = tool.href || '';

    var main = document.createElement('div');
    main.className = 'search-result-main';
    var name = document.createElement('span');
    name.className = 'search-result-name';
    name.textContent = tool.name;
    var tag = document.createElement('span');
    tag.className = 'search-result-tag';
    tag.textContent = tool.tagline || '';
    main.appendChild(name);
    main.appendChild(tag);

    var badge = document.createElement('span');
    badge.className = 'search-result-badge status-badge ' + (tool.status === 'live' ? 'status-badge--live' : 'status-badge--planned');
    badge.textContent = tool.status === 'live' ? 'Live' : 'Soon';

    row.appendChild(main);
    row.appendChild(badge);
    return row;
  }

  function renderRows(list) {
    searchResults.textContent = '';
    activeIndex = -1;
    if (!list.length) {
      var empty = document.createElement('p');
      empty.className = 'search-empty';
      empty.textContent = 'No tools found for "' + searchInput.value.trim() + '".';
      searchResults.appendChild(empty);
      return;
    }
    list.forEach(function (tool) { searchResults.appendChild(buildRow(tool)); });
    if (reducedMotion === false) setActive(0);
  }

  function setActive(index) {
    var rows = searchResults.querySelectorAll('.search-result');
    if (!rows.length) return;
    if (index < 0) index = rows.length - 1;
    if (index >= rows.length) index = 0;
    rows.forEach(function (r, i) { r.classList.toggle('is-active', i === index); });
    activeIndex = index;
  }

  function runSearch() {
    loadTools().then(function (tools) {
      var q = searchInput.value.trim().toLowerCase();
      var list;
      if (!q) {
        list = tools.filter(function (t) { return t.status === 'live'; })
          .slice().sort(function (a, b) { return (a.sortOrder || 99) - (b.sortOrder || 99); });
      } else {
        list = tools.filter(function (t) {
          if (t.status === 'backlog') return false;
          var hay = [t.name, t.tagline, t.categoryLabel, (t.keywords || []).join(' ')].join(' ').toLowerCase();
          return hay.indexOf(q) !== -1;
        });
        list.sort(function (a, b) {
          var an = a.name.toLowerCase().indexOf(q);
          var bn = b.name.toLowerCase().indexOf(q);
          if (an === 0 && bn !== 0) return -1;
          if (bn === 0 && an !== 0) return 1;
          return (a.sortOrder || 99) - (b.sortOrder || 99);
        });
        list = list.slice(0, 8);
      }
      renderRows(list);
    });
  }

  function openSearch() {
    if (!searchOverlay) return;
    lastFocused = document.activeElement;
    searchOverlay.hidden = false;
    searchResults.textContent = '';
    requestAnimationFrame(function () {
      searchOverlay.classList.add('open');
      document.body.classList.add('no-scroll');
      if (searchToggle) searchToggle.setAttribute('aria-expanded', 'true');
      if (searchInput) {
        searchInput.focus();
        runSearch();
      }
    });
  }

  function closeSearch(restoreFocus) {
    if (!searchOverlay || searchOverlay.hidden) return;
    searchOverlay.classList.remove('open');
    document.body.classList.remove('no-scroll');
    if (searchToggle) searchToggle.setAttribute('aria-expanded', 'false');
    setTimeout(function () {
      searchOverlay.hidden = true;
      searchResults.textContent = '';
      if (restoreFocus !== false && lastFocused && lastFocused.focus) lastFocused.focus();
    }, 280);
  }

  if (searchOverlay && searchInput && searchResults) {
    if (searchToggle) searchToggle.addEventListener('click', function () {
      if (searchOverlay.hidden) openSearch(); else closeSearch();
    });
    if (mobileSearchBtn) mobileSearchBtn.addEventListener('click', function () {
      closeNav();
      openSearch();
    });
    searchOverlay.addEventListener('click', function (e) {
      var row = e.target.closest('.search-result');
      if (row && row.dataset.href && !row.hasAttribute('aria-disabled')) {
        window.location.href = siteHref(row.dataset.href);
        return;
      }
      if (e.target.closest('[data-search-close]') || e.target.classList.contains('search-backdrop')) closeSearch();
    });
    searchInput.addEventListener('input', runSearch);
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIndex + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIndex - 1); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        var rows = searchResults.querySelectorAll('.search-result');
        var row = rows[activeIndex > -1 ? activeIndex : 0];
        if (row && row.dataset.href && !row.hasAttribute('aria-disabled')) {
          window.location.href = siteHref(row.dataset.href);
        }
      }
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (searchOverlay.hidden) openSearch(); else closeSearch();
      } else if (e.key === 'Escape' && !searchOverlay.hidden) {
        closeSearch();
      } else if (e.key === '/' && searchOverlay.hidden && !isTypingTarget(document.activeElement)) {
        e.preventDefault();
        openSearch();
      }
    });
  }
/* ── Hero demo (home) ──────────────────────────────────────────── */
  var heroDemo = document.getElementById('heroDemo');
  if (heroDemo) {
    var demoInput = document.getElementById('heroDemoInput');
    var demoPreview = document.getElementById('heroDemoPreview');
    var demoSpark = document.getElementById('heroDemoSpark');
    var demoCache = {};

    function renderDemoEmpty() {
      demoPreview.textContent = '';
      var empty = document.createElement('span');
      empty.className = 'hero-demo-empty';
      empty.textContent = 'Thumbnail preview appears here';
      demoPreview.appendChild(empty);
    }

    function renderDemoImage(id) {
      var url = 'https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg';
      var img = demoCache[id];
      if (!img) {
        img = new Image();
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        img.addEventListener('load', function () { if (demoCache[id] === img) attach(); }, { once: true });
        img.addEventListener('error', renderDemoEmpty, { once: true });
        img.src = url;
        demoCache[id] = img;
      } else {
        attach();
      }
      function attach() {
        demoPreview.textContent = '';
        demoPreview.appendChild(img);
      }
    }

    if (demoInput && demoPreview) {
      import(siteAsset('assets/js/validate/youtube.js'))
        .then(function (yt) {
          demoInput.addEventListener('input', function () {
            var parsed = yt.parseVideoId(demoInput.value);
            demoPreview.textContent = '';
            if (parsed && parsed.ok && parsed.id) renderDemoImage(parsed.id);
            else renderDemoEmpty();
          });
          if (!demoInput.value.trim()) {
            demoInput.value = 'https://www.youtube.com/watch?v=kpdVvvglzSo';
            demoInput.dispatchEvent(new Event('input'));
          }
        })
        .catch(function () {
          var quick = /\b([A-Za-z0-9_-]{11})\b/;
          demoInput.addEventListener('input', function () {
            var m = quick.exec(demoInput.value);
            demoPreview.textContent = '';
            if (m) renderDemoImage(m[1]);
            else renderDemoEmpty();
          });
          if (!demoInput.value.trim()) {
            demoInput.value = 'https://www.youtube.com/watch?v=kpdVvvglzSo';
            demoInput.dispatchEvent(new Event('input'));
          }
        });
    }

    if (demoSpark) {
      (function drawSpark() {
        var w = 88, h = 22, seed = 7;
        function rand() { seed = (seed * 13077 + 6925) % 65536; return seed / 65536; }
        var pts = [];
        var y = h * 0.7;
        for (var i = 0; i <= 8; i++) {
          y += (rand() - 0.5) * h * 0.55;
          y = Math.max(2, Math.min(h - 3, y));
          pts.push([(i / 8) * w, y]);
        }
        var line = pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
        var area = line + ' ' + w + ',' + h + ' 0,' + h;
        var poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute('points', area);
        poly.setAttribute('fill', 'rgba(124,107,255,0.14)');
        var pline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        pline.setAttribute('points', line);
        pline.setAttribute('fill', 'none');
        pline.setAttribute('stroke', '#FF3F10');
        pline.setAttribute('stroke-width', '1.6');
        pline.setAttribute('stroke-linecap', 'round');
        pline.setAttribute('stroke-linejoin', 'round');
        demoSpark.appendChild(poly);
        demoSpark.appendChild(pline);
      })();
    }
  }
})();

/* ── Generic email links (data-mailto) ──────────────────────────── */
(function () {
  'use strict';
  var REPORT_EMAIL = (function () {
    var c = [106,104,97,109,117,107,117,110,100,50,49,53,64,103,109,97,105,108,46,99,111,109];
    var s = '';
    for (var i = 0; i < c.length; i++) s += String.fromCharCode(c[i]);
    return s;
  })();

  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-mailto]');
    if (!link) return;
    e.preventDefault();
    var subject = link.getAttribute('data-mail-subject') || 'AntigleKit — message';
    var body = link.getAttribute('data-mail-body') || '';
    location.href = 'mailto:' + REPORT_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  });
})();
