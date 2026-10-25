/* ============================================================
   GITHUB LAUNCHPAD — description / topics / preview / tagline
   template-driven, local, no API. Honesty rules baked in:
   constraints are only added when the user ticks them.
   ============================================================ */

(function () {
  "use strict";

  var STORE_KEY = "github-launchpad:v1";
  var $ = function (id) { return document.getElementById(id); };

  var els = {
    name: $("fName"), what: $("fWhat"), who: $("fWho"), type: $("fType"),
    stack: $("fStack"), stackChips: $("stackChips"),
    topic: $("fTopic"), topicChips: $("topicChips"), topicWarn: $("topicWarn"),
    cWhat: $("cWhat"), descCount: $("descCount"), topicCount: $("topicCount"),
    alert: $("alert"), readyNote: $("readyNote"),
    outDesc: $("outDesc"), outTopics: $("outTopics"),
    outSocial: $("outSocial"), outReadme: $("outReadme")
  };

  var checks = Array.prototype.slice.call(document.querySelectorAll('.checks input[type="checkbox"]'));

  /* ============================================================
     RECIPE TABLES
     ============================================================ */

  var TYPE_POOL = {
    tool: ["developer-tools", "utility", "productivity", "open-source"],
    library: ["library", "javascript", "api", "open-source"],
    website: ["website", "web", "frontend", "landing-page"],
    docs: ["documentation", "reference", "learning-resources"],
    game: ["game", "browser-game", "entertainment"],
    automation: ["automation", "scripting", "workflow", "tools"]
  };

  var KEYWORDS = [
    { re: /\bjson\b/i, t: "json" },
    { re: /\bminecraft|bedrock|mcpe\b/i, t: "minecraft" },
    { re: /\bbedrock\b/i, t: "minecraft-bedrock" },
    { re: /\ba11y|wcag|accessib|contrast\b/i, t: "accessibility" },
    { re: /\bcolor|colour\b/i, t: "color" },
    { re: /\bseo\b/i, t: "seo" },
    { re: /\bpwa\b/i, t: "pwa" },
    { re: /\bapi\b/i, t: "api" },
    { re: /\bcli\b/i, t: "cli" },
    { re: /\bmarkdown\b/i, t: "markdown" },
    { re: /\bgithub\b/i, t: "github" },
    { re: /\bgit\b/i, t: "git" },
    { re: /\btypescript\b/i, t: "typescript" },
    { re: /\bpython\b/i, t: "python" },
    { re: /\brust\b/i, t: "rust" },
    { re: /\bdocker\b/i, t: "docker" },
    { re: /\btheme|dark mode\b/i, t: "dark-mode" },
    { re: /\boffline\b/i, t: "offline" },
    { re: /\bprivacy\b/i, t: "privacy" },
    { re: /\bterminal|console\b/i, t: "terminal" },
    { re: /\bexport|png\b/i, t: "image-export" },
    { re: /\bopen graph|og image|social preview\b/i, t: "open-graph" }
  ];

  var STOP = { the: 1, a: 1, an: 1, and: 1, of: 1, for: 1, to: 1, in: 1, app: 1, my: 1, get: 1 };

  /* ============================================================
     HELPERS
     ============================================================ */

  function slug(s) {
    return String(s).toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function validTopic(t) {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(t) && t.length <= 50;
  }

  function capFirst(s) {
    s = String(s).trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function truncate(s, n) {
    if (s.length <= n) return s;
    var cut = s.slice(0, n - 1);
    var sp = cut.lastIndexOf(" ");
    if (sp > n * 0.6) cut = cut.slice(0, sp);
    return cut.replace(/[.,;:\s]+$/, "") + "…";
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ============================================================
     GENERATION
     ============================================================ */

  function buildDescription(name, what, who, constraints) {
    var core = name + " — " + what;
    if (!/[.!?]$/.test(core)) core += ".";
    if (who) core += " Built for " + who + ".";
    var full = constraints.length ? core + " " + constraints.join(" ") : core;
    if (full.length <= 350) return full;
    if (core.length <= 350) return core;         // drop constraints before cutting words
    return truncate(core, 350);
  }

  function buildTopics(name, type, stack, what, custom, dropped) {
    var out = [];
    var seen = {};
    function add(t) {
      t = slug(t);
      if (!t || seen[t] || dropped[t]) return;
      seen[t] = true;
      out.push(t);
    }

    custom.forEach(add);                                  // user's own first
    stack.forEach(add);                                   // stack tags
    KEYWORDS.forEach(function (k) { if (k.re.test(what)) add(k.t); });
    slug(name).split("-").forEach(function (w) {
      if (w.length > 2 && !STOP[w]) add(w);
    });
    (TYPE_POOL[type] || []).forEach(add);
    return out.slice(0, 20);
  }

  function buildSocial(name, what, who) {
    var line2 = truncate(what.replace(/\s+/g, " "), 140);
    var out = name + "\n" + line2;
    if (who) out += "\nBuilt for " + who + ".";
    return out;
  }

  function buildReadme(name, what, who) {
    // first sentence, without lookbehind regex (older Safari chokes on it)
    var m = what.match(/^[^.!?]*[.!?]?/);
    var tagline = truncate((m ? m[0] : what).trim() || what, 120);
    var out = "# " + name + "\n\n> " + tagline;
    if (who) out += "\n\nFor " + who + ".";
    out += "\n\n---\n\nPart of **[The Antigle](https://github.com/mukund-buddy)** —\nbrowser tools and web products, built with AI and finished by hand.";
    return out;
  }

  /* ============================================================
     STATE + RENDER
     ============================================================ */

  var state = {
    stack: ["javascript", "css"],
    custom: [],
    dropped: {}
  };

  function checkedConstraints() {
    return checks.filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
  }

  function renderStack() {
    els.stackChips.innerHTML = state.stack.length
      ? state.stack.map(function (t, i) {
          return '<span class="chip">' + esc(t) +
            '<button type="button" data-stack="' + i + '" aria-label="Remove ' + esc(t) + '">×</button></span>';
        }).join("")
      : "";
  }

  function renderTopics(topics) {
    if (!topics.length) {
      els.topicChips.innerHTML = '<span class="chip empty-note">no topics yet</span>';
      return;
    }
    els.topicChips.innerHTML = topics.map(function (t) {
      var bad = !validTopic(t);
      return '<span class="chip' + (bad ? " invalid" : "") + '">' + esc(t) +
        '<button type="button" data-topic="' + esc(t) + '" aria-label="Remove ' + esc(t) + '">×</button></span>';
    }).join("");

    var invalid = topics.filter(function (t) { return !validTopic(t); });
    if (invalid.length) {
      els.topicWarn.hidden = false;
      els.topicWarn.textContent = "[!] GitHub topics allow a-z, 0-9 and hyphens only — fix: " + invalid.join(", ");
    } else if (topics.length > 20) {
      els.topicWarn.hidden = false;
      els.topicWarn.textContent = "[!] GitHub caps topics at 20.";
    } else {
      els.topicWarn.hidden = true;
    }
  }

  function setIdle(panel, msg) {
    panel.textContent = msg || "—";
    panel.classList.add("idle");
  }

  function setLive(panel, text) {
    panel.textContent = text;
    panel.classList.remove("idle");
  }

  function generate() {
    var name = (els.name.value.trim() || "your-repo");
    var what = els.what.value.trim();
    var who = els.who.value.trim();
    var type = els.type.value;
    var ready = what.length >= 15;

    els.cWhat.textContent = what.length + " chars";
    els.readyNote.hidden = !ready;

    if (!ready) {
      if (what.length > 0) {
        els.alert.hidden = false;
        els.alert.textContent = "[!] tell me a bit more — at least 15 characters so the templates have something to work with.";
      } else {
        els.alert.hidden = true;
      }
      setIdle(els.outDesc, "waiting for “what it does”…");
      setIdle(els.outSocial, "—");
      setIdle(els.outReadme, "—");
      els.topicChips.innerHTML = '<span class="chip empty-note">waiting for input…</span>';
      els.descCount.textContent = "0 / 350";
      els.descCount.className = "limit";
      els.topicCount.textContent = "0";
      els.topicCount.className = "limit";
      els.topicWarn.hidden = true;
      document.querySelectorAll("[data-copy]").forEach(function (b) { b.disabled = true; });
      $("btnCopyAll").disabled = true;
      save();
      return;
    }

    els.alert.hidden = true;
    document.querySelectorAll("[data-copy]").forEach(function (b) { b.disabled = false; });
    $("btnCopyAll").disabled = false;

    var constraints = checkedConstraints();

    var desc = buildDescription(name, what, who, constraints);
    var topics = buildTopics(name, type, state.stack, what, state.custom, state.dropped);
    var social = buildSocial(name, what, who);
    var readme = buildReadme(name, what, who);

    setLive(els.outDesc, desc);
    els.descCount.textContent = desc.length + " / 350";
    els.descCount.className = "limit" + (desc.length > 350 ? " bad" : desc.length > 300 ? " warn" : "");

    renderTopics(topics);
    els.topicCount.textContent = topics.length;
    els.topicCount.className = "limit" + (topics.length > 20 ? " bad" : "");
    $("outTopics").textContent = topics.join(" ");   // machine-friendly copy target

    setLive(els.outSocial, social);
    setLive(els.outReadme, readme);

    lastTopics = topics;
    save();
  }

  var lastTopics = [];

  /* ============================================================
     STORAGE
     ============================================================ */

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        n: els.name.value, w: els.who.value, y: els.what.value, t: els.type.value,
        s: state.stack, c: state.custom, d: state.dropped,
        k: checks.map(function (c) { return c.checked; })
      }));
    } catch (e) { /* ignore */ }
  }

  function restore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      if (typeof s.n === "string") els.name.value = s.n;
      if (typeof s.w === "string") els.who.value = s.w;
      if (typeof s.y === "string") els.what.value = s.y;
      if (typeof s.t === "string") els.type.value = s.t;
      if (Array.isArray(s.s)) state.stack = s.s;
      if (Array.isArray(s.c)) state.custom = s.c;
      if (s.d && typeof s.d === "object") state.dropped = s.d;
      if (Array.isArray(s.k)) s.k.forEach(function (v, i) { if (checks[i]) checks[i].checked = !!v; });
    } catch (e) { /* ignore */ }
  }

  /* ============================================================
     COPY
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

  /* ============================================================
     WIRING
     ============================================================ */

  var timer = null;
  function scheduleGenerate() {
    clearTimeout(timer);
    timer = setTimeout(generate, 200);
  }

  [els.name, els.what, els.who].forEach(function (el) {
    el.addEventListener("input", scheduleGenerate);
  });
  els.type.addEventListener("change", generate);
  checks.forEach(function (c) { c.addEventListener("change", generate); });

  /* stack chips */
  els.stack.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    els.stack.value.split(",").forEach(function (part) {
      var t = slug(part);
      if (t && state.stack.indexOf(t) === -1 && state.stack.length < 20) state.stack.push(t);
    });
    els.stack.value = "";
    renderStack();
    generate();
  });

  els.stackChips.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("[data-stack]") : null;
    if (!btn) return;
    state.stack.splice(parseInt(btn.getAttribute("data-stack"), 10), 1);
    renderStack();
    generate();
  });

  /* custom topics */
  els.topic.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    var t = slug(els.topic.value);
    if (!t) return;
    if (state.custom.indexOf(t) === -1 && state.custom.length < 10) {
      delete state.dropped[t];
      state.custom.push(t);
    }
    els.topic.value = "";
    generate();
  });

  els.topicChips.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("[data-topic]") : null;
    if (!btn) return;
    var t = btn.getAttribute("data-topic");
    state.custom = state.custom.filter(function (x) { return x !== t; });
    state.dropped[t] = true;
    generate();
  });

  /* copy buttons */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("[data-copy]") : null;
    if (!btn || btn.disabled) return;
    var target = document.getElementById(btn.getAttribute("data-copy"));
    if (target) copyText(target.textContent, btn);
  });

  $("btnCopyAll").addEventListener("click", function () {
    var block = [
      "== DESCRIPTION ==",
      els.outDesc.textContent,
      "",
      "== TOPICS ==",
      lastTopics.join(" "),
      "",
      "== SOCIAL PREVIEW ==",
      els.outSocial.textContent,
      "",
      "== README OPENING ==",
      els.outReadme.textContent
    ].join("\n");
    copyText(block, this);
  });

  $("btnReset").addEventListener("click", function () {
    els.name.value = "";
    els.what.value = "";
    els.who.value = "";
    els.type.value = "tool";
    state.stack = [];
    state.custom = [];
    state.dropped = {};
    checks.forEach(function (c) { c.checked = false; });
    renderStack();
    generate();
    els.name.focus();
  });

  /* boot */
  restore();
  renderStack();
  generate();
})();
