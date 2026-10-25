/* ============================================================
   CONTRAST LAB — WCAG 2.x color-pair auditor
   extract → luminance → ratio → rank → fix
   ============================================================ */

(function () {
  "use strict";

  var STORE_KEY = "contrast-lab:v1";
  var $ = function (id) { return document.getElementById(id); };

  var els = {
    css: $("fCss"), count: $("cCss"), hint: $("hint"), alert: $("alert"),
    results: $("results"), empty: $("empty"),
    sColors: $("sColors"), sPairs: $("sPairs"), sFails: $("sFails"),
    matrix: $("matrix").querySelector("tbody"),
    declaredWrap: $("declaredWrap"),
    declaredTable: $("declaredTable").querySelector("tbody"),
    hero: $("hero"), heroSample: $("heroSample"), heroText: $("heroText"),
    heroSub: $("heroSub"), heroKicker: $("heroKicker"), heroRatio: $("heroRatio"),
    heroDetail: $("heroDetail"),
    fg: $("fFg"), bg: $("fBg"), oFg: $("oFg"), oBg: $("oBg"),
    qRatio: $("qRatio"), qBadges: $("qBadges")
  };

  var lastAudit = null;   // { colors, pairs, declared }
  var heroPair = null;

  /* ============================================================
     1. COLOR PARSING
     ============================================================ */

  var NAMED = {
    white: "#ffffff", black: "#000000", red: "#ff0000", blue: "#0000ff",
    green: "#008000", gray: "#808080", grey: "#808080", orange: "#ffa500",
    yellow: "#ffff00", purple: "#800080", navy: "#000080", teal: "#008080",
    olive: "#808000", maroon: "#800000", silver: "#c0c0c0", lime: "#00ff00",
    aqua: "#00ffff", fuchsia: "#ff00ff"
  };

  var COLOR_TOKEN = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(?:white|black|red|blue|green|gray|grey|orange|yellow|purple|navy|teal|olive|maroon|silver|lime|aqua|fuchsia)\b/gi;

  function pad2(n) { var s = n.toString(16); return s.length === 1 ? "0" + s : s; }

  function parseColor(str) {
    if (!str) return null;
    str = String(str).trim().toLowerCase();

    // hex 3/4/6/8
    var m = str.match(/^#([0-9a-f]{3})$/);
    if (m) return "#" + m[1].split("").map(function (c) { return c + c; }).join("");
    m = str.match(/^#([0-9a-f]{6})$/);
    if (m) return "#" + m[1];
    m = str.match(/^#([0-9a-f]{4})$/);            // #rgba → drop alpha
    if (m) return "#" + m[1].slice(0, 3).split("").map(function (c) { return c + c; }).join("");
    m = str.match(/^#([0-9a-f]{8})$/);            // #rrggbbaa → drop alpha
    if (m) return "#" + m[1].slice(0, 6);

    // rgb / rgba
    m = str.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/][\s]*[\d.%]+)?\)$/);
    if (m) {
      var r = clamp255(m[1]), g = clamp255(m[2]), b = clamp255(m[3]);
      return "#" + pad2(r) + pad2(g) + pad2(b);
    }

    // hsl / hsla
    m = str.match(/^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%\s*(?:[,/][\s]*[\d.%]+)?\)$/);
    if (m) {
      var rgb = hsl2rgb(parseFloat(m[1]), parseFloat(m[2]) / 100, parseFloat(m[3]) / 100);
      return "#" + pad2(rgb[0]) + pad2(rgb[1]) + pad2(rgb[2]);
    }

    if (NAMED[str]) return NAMED[str];
    return null;
  }

  function clamp255(v) {
    v = Math.round(parseFloat(v));
    return v < 0 ? 0 : v > 255 ? 255 : v;
  }

  function hsl2rgb(h, s, l) {
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    var m = l - c / 2;
    var t = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h / 60) % 6];
    return [
      Math.round((t[0] + m) * 255),
      Math.round((t[1] + m) * 255),
      Math.round((t[2] + m) * 255)
    ];
  }

  function rgb2hsl(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255;
    var g = parseInt(hex.slice(3, 5), 16) / 255;
    var b = parseInt(hex.slice(5, 7), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  }

  /* ============================================================
     2. WCAG MATH
     ============================================================ */

  function channel(c) {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function luminance(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  }

  function ratio(a, b) {
    var la = luminance(a), lb = luminance(b);
    var hi = Math.max(la, lb), lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }

  function fmt(r) { return (Math.round(r * 100) / 100).toFixed(2); }

  function grade(r) {
    return {
      aa: r >= 4.5,
      aaLarge: r >= 3,
      aaa: r >= 7,
      aaaLarge: r >= 4.5
    };
  }

  /* ============================================================
     3. EXTRACTION
     ============================================================ */

  function extractColors(text) {
    var out = [];
    var seen = {};
    var m;
    COLOR_TOKEN.lastIndex = 0;
    while ((m = COLOR_TOKEN.exec(text)) !== null) {
      if (out.length >= 15) break;
      var hex = parseColor(m[0]);
      if (hex && !seen[hex]) {
        seen[hex] = true;
        out.push(hex);
      }
    }
    return out;
  }

  /* pairs straight out of `color:` / `background:` declarations */
  function declaredPairs(text) {
    var pairs = [];
    var re = /([^{}]+)\{([^{}]*)\}/g;
    var m;
    while ((m = re.exec(text)) !== null) {
      var body = m[2];
      var fg = findDecl(body, "color");
      var bg = findDecl(body, "background-color") || findDecl(body, "background");
      if (!fg || !bg) continue;
      if (fg.indexOf("var(") > -1 && bg.indexOf("var(") > -1) continue;
      var fgHex = parseColor(firstToken(fg));
      var bgHex = parseColor(firstToken(bg));
      if (!fgHex || !bgHex || fgHex === bgHex) continue;
      var selector = m[1].replace(/\/\*[\s\S]*?\*\//g, "").trim().split("\n").pop().trim();
      if (!selector || selector.indexOf("@") === 0) continue;
      pairs.push({ fg: fgHex, bg: bgHex, ratio: ratio(fgHex, bgHex), label: selector.slice(0, 60) });
    }
    // dedupe by fg+bg
    var seen = {};
    return pairs.filter(function (p) {
      var k = p.fg + p.bg;
      if (seen[k]) return false;
      seen[k] = true;
      return true;
    });
  }

  function firstToken(v) {
    // "#fff none repeat" → "#fff"; "red" → "red"
    var m = String(v).match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|[a-z]+/i);
    return m ? m[0] : v;
  }

  function findDecl(body, name) {
    var r = new RegExp("(?:^|[;\\s{])" + name + "\\s*:\\s*([^;]+)", "i");
    var m = body.match(r);
    return m ? m[1].trim() : null;
  }

  function allPairs(colors) {
    var out = [];
    colors.forEach(function (fg) {
      colors.forEach(function (bg) {
        if (fg === bg) return;
        out.push({ fg: fg, bg: bg, ratio: ratio(fg, bg) });
      });
    });
    out.sort(function (a, b) { return a.ratio - b.ratio; });
    return out;
  }

  /* ============================================================
     4. FIX (nearest shade that reaches AA)
     ============================================================ */

  function fixColor(fg, bg, dir) {
    var hsl = rgb2hsl(fg);
    var h = hsl[0], s = hsl[1], l = hsl[2];
    var step = dir === "dark" ? -0.01 : 0.01;
    var best = null;
    for (var i = 0; i <= 100; i++) {
      var nl = l + step * i;
      if (nl < 0) nl = 0;
      if (nl > 1) nl = 1;
      var rgb = hsl2rgb(h, s, nl);
      var hex = "#" + pad2(rgb[0]) + pad2(rgb[1]) + pad2(rgb[2]);
      if (ratio(hex, bg) >= 4.5) { best = hex; break; }
      if (nl === 0 || nl === 1) break;
    }
    if (!best) {
      // guaranteed fallback: pure black or white
      var black = "#000000", white = "#ffffff";
      best = ratio(black, bg) >= ratio(white, bg) ? black : white;
    }
    return best;
  }

  /* ============================================================
     5. RENDERING
     ============================================================ */

  function chip(ok, label) {
    return '<span class="chip ' + (ok ? "pass" : "fail") + '">' +
      (label + " " + (ok ? "PASS" : "FAIL")) + "</span>";
  }

  function swatchLine(hex) {
    return '<span class="swatch-line"><span class="sw" style="background:' + hex + '"></span>' +
      '<span class="hex">' + hex + "</span></span>";
  }

  function rowHtml(p, withSelector) {
    var g = grade(p.ratio);
    var cells = [];
    if (withSelector) cells.push('<td class="selector-cell" title="' + esc(p.label) + '">' + esc(p.label) + "</td>");
    cells.push("<td>" + swatchLine(p.fg) + "</td>");
    cells.push("<td>" + swatchLine(p.bg) + "</td>");
    cells.push('<td class="ratio">' + fmt(p.ratio) + ":1</td>");
    cells.push("<td>" + chip(g.aa, "AA") + "</td>");
    cells.push("<td>" + chip(g.aaa, "AAA") + "</td>");
    if (!withSelector) {
      cells.push('<td><button type="button" class="btn small inspect" data-fg="' + p.fg +
        '" data-bg="' + p.bg + '">Inspect</button></td>');
    }
    return '<tr class="' + (g.aa ? "" : "fail") + '">' + cells.join("") + "</tr>";
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderAudit(text) {
    var colors = extractColors(text);
    if (colors.length < 2) {
      showAlert("Need at least 2 different colors to test — paste more CSS.");
      els.results.hidden = true;
      els.empty.hidden = false;
      lastAudit = null;
      return;
    }

    showAlert("");
    var pairs = allPairs(colors);
    var declared = declaredPairs(text);
    var fails = pairs.filter(function (p) { return !grade(p.ratio).aa; });

    lastAudit = { colors: colors, pairs: pairs, declared: declared };

    els.sColors.textContent = colors.length;
    els.sPairs.textContent = pairs.length;
    els.sFails.textContent = fails.length;

    els.matrix.innerHTML = pairs.slice(0, 210).map(function (p) {
      return rowHtml(p, false);
    }).join("");

    if (declared.length) {
      els.declaredWrap.hidden = false;
      els.declaredTable.innerHTML = declared.map(function (p) {
        return rowHtml(p, true);
      }).join("");
    } else {
      els.declaredWrap.hidden = true;
    }

    // hero = worst declared pair if any, else overall worst
    var worst = (declared.length ? declared.slice().sort(function (a, b) {
      return a.ratio - b.ratio;
    })[0] : pairs[0]);
    setHero(worst.fg, worst.bg);

    els.results.hidden = false;
    els.empty.hidden = true;
    els.hint.textContent = colors.length + " colors · " + pairs.length + " pairs · " +
      fails.length + " fail AA";
    els.hint.className = "hint" + (fails.length ? " bad" : "");
  }

  function setHero(fg, bg) {
    heroPair = { fg: fg, bg: bg, ratio: ratio(fg, bg) };
    var g = grade(heroPair.ratio);

    // keep the quick-pair pickers in sync with whatever pair is on stage
    els.fg.value = fg;
    els.bg.value = bg;
    updateQuickLabels();

    els.heroSample.style.background = bg;
    els.heroSample.style.color = fg;
    els.heroKicker.textContent = g.aa ? "AA PASSES" : "AA FAILS";
    els.heroRatio.textContent = fmt(heroPair.ratio);
    els.heroDetail.textContent = fg + " on " + bg + " — AA body text needs 4.50:1, AAA needs 7.00:1." +
      (g.aaLarge && !g.aa ? " (Large text ≥24px passes AA at 3:1.)" : "");
    els.hero.hidden = false;
    $("btnDarken").disabled = g.aa;
    $("btnLighten").disabled = g.aa;
  }

  function showAlert(msg) {
    if (!msg) { els.alert.hidden = true; els.alert.textContent = ""; return; }
    els.alert.textContent = msg;
    els.alert.hidden = false;
  }

  /* ---------- quick pair ---------- */
  function updateQuickLabels() {
    var fg = els.fg.value.toLowerCase();
    var bg = els.bg.value.toLowerCase();
    els.oFg.textContent = fg;
    els.oBg.textContent = bg;
    var r = ratio(fg, bg);
    var g = grade(r);
    els.qRatio.textContent = fmt(r);
    els.qBadges.innerHTML = chip(g.aa, "AA") + chip(g.aaa, "AAA") +
      chip(g.aaLarge, "AA≥24px");
  }

  /* ============================================================
     6. COPY
     ============================================================ */

  function copyText(text, btn) {
    var done = function () {
      var old = btn.textContent;
      btn.textContent = "Copied ✓";
      setTimeout(function () { btn.textContent = old; }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text); done(); });
    } else {
      legacyCopy(text);
      done();
    }
  }

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  function fixCss() {
    if (!heroPair) return "";
    var dir = "dark";
    // pick the direction the button pressed last (stored by handler)
    var fixed = fixColor(heroPair.fg, heroPair.bg, lastDir);
    var r2 = ratio(fixed, heroPair.bg);
    return "color: " + fixed + "; /* " + heroPair.fg + " " + fmt(heroPair.ratio) +
      ":1 → " + fmt(r2) + ":1 (AA) */";
  }

  var lastDir = "dark";

  function buildReport() {
    if (!lastAudit) return "";
    var fails = lastAudit.pairs.filter(function (p) { return !grade(p.ratio).aa; });
    var lines = [
      "Contrast report — " + lastAudit.colors.length + " colors, " +
      lastAudit.pairs.length + " pairs, " + fails.length + " failing AA",
      "".padEnd ? "".padEnd(50, "-") : "--------------------------------------------------"
    ];
    fails.slice(0, 40).forEach(function (p) {
      lines.push(p.fg + " on " + p.bg + " — " + fmt(p.ratio) + ":1 (needs 4.50)");
    });
    if (fails.length > 40) lines.push("… and " + (fails.length - 40) + " more");
    return lines.join("\n");
  }

  /* ============================================================
     7. STORAGE + WIRING
     ============================================================ */

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        c: els.css.value, f: els.fg.value, b: els.bg.value
      }));
    } catch (e) { /* ignore */ }
  }

  function restore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      if (typeof s.c === "string") els.css.value = s.c;
      if (typeof s.f === "string") els.fg.value = s.f;
      if (typeof s.b === "string") els.bg.value = s.b;
    } catch (e) { /* ignore */ }
  }

  var SAMPLE = [
    ":root {",
    "  --ink: #16181d;",
    "  --paper: #f7f5ef;",
    "  --brand: #2f6fed;",
    "}",
    "body { background: var(--paper); color: var(--ink); }",
    ".muted { color: #8a8a8a; background: #ffffff; }",
    ".helper { color: #b5b5b5; background: #f7f5ef; }",
    ".cta { color: #ffffff; background: #2f6fed; }",
    ".tag { color: #16181d; background: #ffd166; }",
    ".err { color: #ff6b6b; background: #ffffff; }"
  ].join("\n");

  $("btnAudit").addEventListener("click", function () {
    renderAudit(els.css.value);
    save();
    if (window.matchMedia("(max-width: 860px)").matches) {
      els.results.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  $("btnSample").addEventListener("click", function () {
    els.css.value = SAMPLE;
    renderAudit(SAMPLE);
    save();
  });

  $("btnClear").addEventListener("click", function () {
    els.css.value = "";
    lastAudit = null;
    els.results.hidden = true;
    els.empty.hidden = false;
    els.hint.textContent = "";
    showAlert("");
    save();
    els.css.focus();
  });

  els.css.addEventListener("input", function () {
    els.count.textContent = els.css.value.length + " chars";
    save();
  });

  els.fg.addEventListener("input", function () { setHero(els.fg.value, els.bg.value); save(); });
  els.bg.addEventListener("input", function () { setHero(els.fg.value, els.bg.value); save(); });

  $("btnDarken").addEventListener("click", function () {
    if (!heroPair) return;
    lastDir = "dark";
    var fixed = fixColor(heroPair.fg, heroPair.bg, "dark");
    setHero(fixed, heroPair.bg);
    els.hint.textContent = "fixed → " + fixed + " (" + fmt(ratio(fixed, heroPair.bg)) + ":1)";
    els.hint.className = "hint";
    save();
  });

  $("btnLighten").addEventListener("click", function () {
    if (!heroPair) return;
    lastDir = "light";
    var fixed = fixColor(heroPair.fg, heroPair.bg, "light");
    setHero(fixed, heroPair.bg);
    els.hint.textContent = "fixed → " + fixed + " (" + fmt(ratio(fixed, heroPair.bg)) + ":1)";
    els.hint.className = "hint";
    save();
  });

  $("btnCopyFix").addEventListener("click", function () {
    var css = fixCss();
    if (css) copyText(css, this);
  });

  $("btnCopyReport").addEventListener("click", function () {
    var rep = buildReport();
    if (rep) copyText(rep, this);
  });

  els.matrix.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest(".inspect") : null;
    if (!btn) return;
    lastDir = "dark";
    setHero(btn.getAttribute("data-fg"), btn.getAttribute("data-bg"));
    els.hero.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  /* boot */
  restore();
  els.count.textContent = els.css.value.length + " chars";
  updateQuickLabels();
  if (els.css.value.trim()) renderAudit(els.css.value);
})();
