/* ============================================================
   JSON → TYPES
   infer() builds one shared type tree from parsed JSON,
   then four renderers (TS / Python / Zod / Go) read it.
   Runs entirely in the browser — no network, no storage.
   ============================================================ */

(function () {
  "use strict";

  var STORE_KEY = "json-to-types:v1";
  var $ = function (id) { return document.getElementById(id); };

  var els = {
    json: $("fJson"), name: $("fName"), count: $("cJson"),
    status: $("status"), alert: $("alert"), empty: $("empty"),
    tabs: Array.prototype.slice.call(document.querySelectorAll('[role="tab"]')),
    panes: { ts: $("p-ts"), py: $("p-py"), zod: $("p-zod"), go: $("p-go") },
    copy: $("btnCopy")
  };

  var lastOutput = { ts: "", py: "", zod: "", go: "" };
  var activeLang = "ts";

  /* ============================================================
     1. INFERENCE
     ============================================================ */

  var MAX_DEPTH = 12;

  function infer(v, name, depth) {
    depth = depth || 0;
    if (depth > MAX_DEPTH) return { k: "any" };

    if (v === null) return { k: "null" };

    if (Array.isArray(v)) {
      if (v.length === 0) return { k: "arr", of: { k: "any" } };
      var parts = v.slice(0, 60).map(function (x) { return infer(x, name, depth + 1); });
      return { k: "arr", of: mergeAll(parts, name, depth) };
    }

    if (typeof v === "object") {
      var fields = [];
      Object.keys(v).forEach(function (key) {
        var raw = v[key];
        var isArr = Array.isArray(raw);
        fields.push({
          key: key,
          type: infer(raw, childName(name, key, isArr), depth + 1),
          optional: false
        });
      });
      if (fields.length === 0) return { k: "rec" }; // {} → Record<string, never>
      return { k: "obj", name: name, fields: fields };
    }

    if (typeof v === "number") return { k: Number.isInteger(v) ? "int" : "float" };
    if (typeof v === "boolean") return { k: "bool" };
    if (typeof v === "string") return { k: "str" };
    return { k: "any" };
  }

  function childName(base, key, isArray) {
    var p = pascal(key);
    if (isArray) p = singular(p);
    if (!p) p = "Field";
    if (/^[0-9]/.test(p)) p = "T" + p;
    return base + p;
  }

  function pascal(s) {
    return String(s)
      .replace(/[^A-Za-z0-9]+(.)?/g, function (_, c) { return c ? c.toUpperCase() : ""; })
      .replace(/^[a-z]/, function (c) { return c.toUpperCase(); });
  }

  function singular(w) {
    if (w.length <= 3) return w;
    if (/ies$/i.test(w)) return w.slice(0, -3) + (w.slice(-3) === "IES" ? "Y" : "y");
    if (/(us|is|ss)$/i.test(w)) return w;
    if (/s$/i.test(w)) return w.slice(0, -1);
    return w;
  }

  /* merge the element types of one array into a single type */
  function mergeAll(nodes, name, depth) {
    var uniq = dedupe(nodes);
    if (uniq.length === 1) return uniq[0];

    if (uniq.every(function (n) { return n.k === "obj"; })) {
      return mergeObjs(uniq, name, depth);
    }
    // null + one real type → keep as union (renderers handle Optional)
    return { k: "union", of: uniq.slice(0, 6) };
  }

  function mergeObjs(nodes, name, depth) {
    var seen = new Map(); // key → { types:[], count }
    nodes.forEach(function (n) {
      n.fields.forEach(function (f) {
        if (!seen.has(f.key)) seen.set(f.key, { types: [], count: 0 });
        var e = seen.get(f.key);
        e.types.push(f.type);
        e.count += 1;
      });
    });
    var fields = [];
    seen.forEach(function (e, key) {
      fields.push({
        key: key,
        type: dedupe(e.types).length === 1 ? e.types[0] : { k: "union", of: dedupe(e.types).slice(0, 6) },
        optional: e.count < nodes.length
      });
    });
    if (fields.length === 0) return { k: "rec" };
    return { k: "obj", name: name, fields: fields };
  }

  function sig(t) {
    if (t.k === "obj") return "obj:" + t.fields.map(function (f) { return f.key + "=" + sig(f.type); }).join(",");
    if (t.k === "arr") return "arr:" + sig(t.of);
    if (t.k === "union") return "u:[" + t.of.map(sig).join("|") + "]";
    return t.k;
  }

  function dedupe(nodes) {
    var out = [];
    var seen = {};
    nodes.forEach(function (n) {
      var s = sig(n);
      if (!seen[s]) { seen[s] = true; out.push(n); }
    });
    return out;
  }

  /* collect every named object, renaming collisions */
  function collect(root) {
    var byName = new Map();
    var list = [];
    (function walk(t) {
      if (!t) return;
      if (t.k === "arr") return walk(t.of);
      if (t.k === "union") return t.of.forEach(walk);
      if (t.k !== "obj") return;
      var taken = byName.get(t.name);
      if (taken && taken !== t) {
        var i = 2;
        while (byName.has(t.name + i)) i++;
        t.name = t.name + i;
      }
      byName.set(t.name, t);
      list.push(t);
      t.fields.forEach(function (f) { walk(f.type); });
    })(root);
    return list;
  }

  /* ============================================================
     2. RENDERERS
     ============================================================ */

  function isIdent(s) { return /^[A-Za-z_][A-Za-z0-9_]*$/.test(s); }

  /* ---------- TypeScript ---------- */
  function tsType(t) {
    switch (t.k) {
      case "str": return "string";
      case "int":
      case "float": return "number";
      case "bool": return "boolean";
      case "null": return "null";
      case "any": return "unknown";
      case "rec": return "Record<string, never>";
      case "arr": {
        var inner = tsType(t.of);
        return /\||\s/.test(inner) ? "(" + inner + ")[]" : inner + "[]";
      }
      case "union": {
        var parts = [];
        t.of.forEach(function (n) {
          var p = tsType(n);
          if (parts.indexOf(p) === -1) parts.push(p);   // int+float both render as number
        });
        return parts.indexOf("null") > -1 && parts.length === 2
          ? parts.filter(function (p) { return p !== "null"; })[0] + " | null"
          : parts.join(" | ");
      }
      case "obj": return t.name;
      default: return "unknown";
    }
  }

  function renderTS(root, rootName) {
    var head = "// Generated by json-to-types — edit carefully.\n";
    var blocks = [];
    var seen = new Set();

    function walk(t) {
      if (!t) return;
      if (t.k === "arr") return walk(t.of);
      if (t.k === "union") return t.of.forEach(walk);
      if (t.k !== "obj" || seen.has(t)) return;
      seen.add(t);
      blocks.push(objBlock(t, t.name, tsFieldLines));
      t.fields.forEach(function (f) { walk(f.type); });
    }

    if (root.k === "obj") {
      blocks.push(objBlock(root, root.name, tsFieldLines));
      seen.add(root);
      root.fields.forEach(function (f) { walk(f.type); });
      return head + blocks.join("\n\n");
    }

    // array / primitive root: named types first, alias after
    walk(root);
    return head + "export type " + rootName + " = " + tsType(root) + ";" +
      (blocks.length ? "\n\n" + blocks.join("\n\n") : "");
  }

  function tsFieldLines(obj, ind) {
    return obj.fields.map(function (f) {
      var key = isIdent(f.key) ? f.key : JSON.stringify(f.key);
      return ind + key + (f.optional ? "?" : "") + ": " + tsType(f.type) + ";";
    }).join("\n");
  }

  function objBlock(obj, name, lines) {
    return "export interface " + name + " {\n" + lines(obj, "  ") + "\n}";
  }

  /* ---------- Python ---------- */
  function pyType(t) {
    switch (t.k) {
      case "str": return "str";
      case "int": return "int";
      case "float": return "float";
      case "bool": return "bool";
      case "null": return "None";
      case "any": return "Any";
      case "rec": return "Dict[str, Any]";
      case "arr": return "List[" + pyType(t.of) + "]";
      case "obj": return t.name;
      case "union": {
        var parts = t.of.map(pyType);
        var nonNull = parts.filter(function (p) { return p !== "None"; });
        if (parts.length === 2 && nonNull.length === 1) return "Optional[" + nonNull[0] + "]";
        return "Union[" + parts.join(", ") + "]";
      }
      default: return "Any";
    }
  }

  function renderPy(root, rootName) {
    var blocks = [];
    var seen = new Set();

    function emitDeps(t) {
      if (!t) return;
      if (t.k === "arr") return emitDeps(t.of);
      if (t.k === "union") return t.of.forEach(emitDeps);
      if (t.k === "obj") emit(t);
    }

    function emit(t) {
      if (!t) return;
      if (t.k === "arr") return emit(t.of);
      if (t.k === "union") return t.of.forEach(emit);
      if (t.k !== "obj" || seen.has(t)) return;
      t.fields.forEach(function (f) { emitDeps(f.type); });
      seen.add(t);
      blocks.push(pyClass(t));           // children land before parents
    }

    if (root.k === "obj") {
      emit(root);
      return pyHeader(blocks);
    }

    // array / primitive root: emit any named classes, then the alias
    emitDeps(root);
    blocks.push(rootName + " = " + pyType(root));
    return pyHeader(blocks);
  }

  /* Only the typing names the output actually uses get imported. */
  function pyHeader(body) {
    var text = body.join("\n");
    var im = [];
    if (/\bAny\b/.test(text)) im.push("Any");
    if (/\bDict\[/.test(text)) im.push("Dict");
    if (/\bList\[/.test(text)) im.push("List");
    if (/\bNotRequired\[/.test(text)) im.push("NotRequired");
    if (/\bOptional\[/.test(text)) im.push("Optional");
    if (/\bTypedDict\b/.test(text)) im.push("TypedDict");
    if (/\bUnion\[/.test(text)) im.push("Union");
    var head = im.length
      ? ["from typing import " + im.join(", "), ""]
      : [];
    var out = head.slice();
    out.push("# Generated by json-to-types — pasted as-is into your project.");
    body.forEach(function (b) { out.push("", b); });   // blank line between blocks
    return out.join("\n");
  }

  function pyClass(obj) {
    var optCount = obj.fields.filter(function (f) { return f.optional; }).length;
    var allOpt = obj.fields.length > 0 && optCount === obj.fields.length;
    var useNR = !allOpt;

    if (obj.fields.some(function (f) { return !isIdent(f.key); })) {
      // functional syntax keeps exotic keys intact
      var entries = obj.fields.map(function (f) {
        return "    " + JSON.stringify(f.key) + ": " + pyAnn(f, useNR);
      }).join(",\n");
      var total = allOpt ? ", total=False" : "";
      return obj.name + " = TypedDict(" + JSON.stringify(obj.name) + ", {\n" + entries + "\n}" + total + ")";
    }

    var totalKw = allOpt ? ", total=False" : "";
    var lines = obj.fields.map(function (f) {
      return "    " + f.key + ": " + pyAnn(f, useNR);
    });
    return "class " + obj.name + "(TypedDict" + totalKw + "):\n" + lines.join("\n");
  }

  function pyAnn(f, useNR) {
    var t = pyType(f.type);
    return (f.optional && useNR) ? "NotRequired[" + t + "]" : t;
  }

  /* ---------- Zod ---------- */
  function zodType(t) {
    switch (t.k) {
      case "str": return "z.string()";
      case "int": return "z.number().int()";
      case "float": return "z.number()";
      case "bool": return "z.boolean()";
      case "null": return "z.null()";
      case "any": return "z.any()";
      case "rec": return "z.record(z.string(), z.never())";
      case "arr": return "z.array(" + zodType(t.of) + ")";
      case "obj": return t.name;
      case "union": {
        var nonNull = t.of.filter(function (n) { return n.k !== "null"; });
        if (t.of.length === 2 && nonNull.length === 1) {
          return zodType(nonNull[0]) + ".nullable()";
        }
        return "z.union([" + t.of.map(zodType).join(", ") + "])";
      }
      default: return "z.any()";
    }
  }

  function renderZod(root, rootName) {
    var out = ['import { z } from "zod";', ""];
    var seen = new Set();

    function deps(t) {
      if (!t) return;
      if (t.k === "arr") return deps(t.of);
      if (t.k === "union") return t.of.forEach(deps);
      if (t.k === "obj") emit(t);
    }

    function emit(t) {
      if (seen.has(t)) return;
      t.fields.forEach(function (f) { deps(f.type); });
      seen.add(t);
      var body;
      if (t.k === "obj") {
        body = t.fields.map(function (f) {
          var key = isIdent(f.key) ? f.key : JSON.stringify(f.key);
          var val = zodType(f.type);
          if (f.optional && f.type.k !== "null") val += ".optional()";
          return "  " + key + ": " + val;
        }).join(",\n");
        out.push("export const " + t.name + " = z.object({\n" + body + "\n});");
        out.push("export type " + t.name + " = z.infer<typeof " + t.name + ">;");
      }
      out.push("");
    }

    if (root.k === "obj") {
      emit(root);
    } else {
      // array / primitive root: nested consts first, alias last (use-before-define)
      deps(root);
      out.push("export const " + rootName + " = " + zodType(root) + ";");
      out.push("export type " + rootName + " = z.infer<typeof " + rootName + ">;");
    }

    return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  }

  /* ---------- Go ---------- */
  var BT = String.fromCharCode(96);

  function goType(t) {
    switch (t.k) {
      case "str": return "string";
      case "int": return "int";
      case "float": return "float64";
      case "bool": return "bool";
      case "null": return "interface{}";
      case "any":
      case "rec": return "interface{}";
      case "arr": return "[]" + goType(t.of);
      case "obj": return t.name;
      case "union": {
        var nonNull = t.of.filter(function (n) { return n.k !== "null"; });
        if (t.of.length === 2 && nonNull.length === 1) {
          var one = goType(nonNull[0]);
          return one === "interface{}" ? one : "*" + one;
        }
        return "interface{}";
      }
      default: return "interface{}";
    }
  }

  function renderGo(root, rootName) {
    var pkg = (rootName.toLowerCase().replace(/[^a-z0-9]/g, "") || "types");
    var out = [
      "// Code generated by json-to-types. DO NOT EDIT.",
      "",
      "package " + pkg,
      ""
    ];

    var seen = new Set();
    var structs = [];

    function deps(t) {
      if (!t) return;
      if (t.k === "arr") return deps(t.of);
      if (t.k === "union") return t.of.forEach(deps);
      if (t.k === "obj") emit(t);
    }

    function emit(t) {
      if (seen.has(t)) return;
      seen.add(t);
      t.fields.forEach(function (f) { deps(f.type); });
      structs.push(goStruct(t));
    }

    if (root.k === "obj") {
      emit(root);
      return out.concat([structs.join("\n")]).join("\n");
    }

    deps(root);
    out.push("// " + rootName + " is the parsed JSON value.");
    out.push("type " + rootName + " = " + goType(root));
    if (structs.length) out.push("", structs.join("\n"));
    return out.join("\n");
  }

  var GO_WORDS = {
    Id: "ID", Url: "URL", Api: "API", Uri: "URI", Html: "HTML",
    Json: "JSON", Uuid: "UUID", Ip: "IP", Xml: "XML", Http: "HTTP"
  };

  function goFieldName(key, i) {
    var base = pascal(key);
    if (GO_WORDS[base]) base = GO_WORDS[base];
    if (!base) base = "Field" + i;
    if (/^[0-9]/.test(base)) base = "F" + base;
    return base;
  }

  function goStruct(obj) {
    var used = {};
    var lines = obj.fields.map(function (f, i) {
      var base = goFieldName(f.key, i);
      if (used[base]) base = base + (i + 1);
      used[base] = true;
      var tag = 'json:"' + f.key + (f.optional ? ",omitempty" : "") + '"';
      var comment = isIdent(f.key) ? "" : " // originally: " + f.key;
      return "\t" + pad(base, 20) + pad(goType(f.type), 14) + BT + tag + BT + comment;
    });
    return "type " + obj.name + " struct {\n" + lines.join("\n") + "\n}";
  }

  function pad(s, n) {
    return s.length >= n ? s + " " : s + new Array(n - s.length + 1).join(" ");
  }

  /* ============================================================
     3. UI
     ============================================================ */

  function parsePosition(msg) {
    var m = /position\s+(\d+)/.exec(msg);
    if (!m) return "";
    var pos = parseInt(m[1], 10);
    var upTo = els.json.value.slice(0, pos);
    var line = upTo.split("\n").length;
    var col = pos - upTo.lastIndexOf("\n");
    return " (line " + line + ", col " + col + ")";
  }

  function convert() {
    var text = els.json.value;
    els.count.textContent = text.length + " chars";
    els.alert.hidden = true;

    if (!text.trim()) {
      els.empty.classList.remove("hidden");
      Object.keys(els.panes).forEach(function (k) {
        els.panes[k].classList.add("hidden");
        els.panes[k].hidden = true;
      });
      els.status.textContent = "";
      els.copy.disabled = true;
      save();
      return;
    }

    var data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      els.empty.classList.remove("hidden");
      Object.keys(els.panes).forEach(function (k) {
        els.panes[k].classList.add("hidden");
        els.panes[k].hidden = true;
      });
      els.alert.hidden = false;
      els.alert.textContent = "Invalid JSON: " + e.message + parsePosition(e.message);
      els.status.textContent = "";
      els.status.className = "status bad";
      els.copy.disabled = true;
      save();
      return;
    }

    var rootName = cleanName(els.name.value) || "Root";
    // an array root gets its element type a separate name so
    // `type Rows = Rows[]` (self-reference) can never happen
    var elemName = Array.isArray(data) ? rootName + "Item" : rootName;
    var root = infer(data, elemName, 0);
    var nodes = collect(root);

    els.empty.classList.add("hidden");
    lastOutput.ts = renderTS(root, rootName);
    lastOutput.py = renderPy(root, rootName);
    lastOutput.zod = renderZod(root, rootName);
    lastOutput.go = renderGo(root, rootName);

    Object.keys(els.panes).forEach(function (k) {
      els.panes[k].querySelector("code").textContent = lastOutput[k];
    });

    var nested = nodes.length - (root.k === "obj" ? 1 : 0);
    els.status.className = "status";
    els.status.textContent = "✓ " + (root.k === "obj" ? root.fields.length : 0) +
      " root field" + (root.fields && root.fields.length === 1 ? "" : "s") +
      " · " + nodes.length + " type" + (nodes.length === 1 ? "" : "s") +
      (nested > 0 ? " · " + nested + " nested" : "");
    els.copy.disabled = false;
    save();
  }

  function cleanName(s) {
    s = pascal(String(s || "").trim());
    return /^[0-9]/.test(s) ? "" : s;
  }

  function showTab(id) {
    activeLang = id;
    els.tabs.forEach(function (t) {
      var on = t.getAttribute("aria-controls") === "p-" + id;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      var pane = els.panes[t.getAttribute("aria-controls").slice(2)];
      pane.classList.toggle("hidden", !on);
      pane.hidden = !on;
    });
  }

  function copyOutput(btn) {
    var text = lastOutput[activeLang];
    if (!text) return;
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

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ j: els.json.value, n: els.name.value }));
    } catch (e) { /* ignore */ }
  }

  function restore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      if (typeof s.j === "string") els.json.value = s.j;
      if (typeof s.n === "string") els.name.value = s.n;
    } catch (e) { /* ignore */ }
  }

  /* ---------- wiring ---------- */
  var timer = null;
  els.json.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(convert, 220);
  });
  els.name.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(convert, 220);
  });

  els.tabs.forEach(function (t, i) {
    t.addEventListener("click", function () {
      showTab(t.getAttribute("aria-controls").slice(2));
    });
    t.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = els.tabs[(i + 1) % els.tabs.length];
      else if (e.key === "ArrowLeft") next = els.tabs[(i - 1 + els.tabs.length) % els.tabs.length];
      else if (e.key === "Home") next = els.tabs[0];
      else if (e.key === "End") next = els.tabs[els.tabs.length - 1];
      if (next) {
        e.preventDefault();
        next.click();
        next.focus();
      }
    });
  });

  els.copy.addEventListener("click", function () { copyOutput(this); });

  var SAMPLE = JSON.stringify({
    id: 42,
    name: "Mukund",
    active: true,
    score: 87.5,
    bio: null,
    tags: ["builder", "automation"],
    owner: {
      email: "you@example.com",
      verified: true
    },
    posts: [
      { id: 1, title: "Hello", likes: 3 },
      { id: 2, title: "Again", likes: null, edited: true }
    ],
    "user-name": "mukund-buddy"
  }, null, 2);

  function loadSample() {
    els.json.value = SAMPLE;
    els.name.value = "Root";
    convert();
    els.json.focus();
  }

  function clearAll() {
    els.json.value = "";
    convert();
    els.json.focus();
  }

  $("btnSample").addEventListener("click", loadSample);
  $("btnSample2").addEventListener("click", loadSample);
  $("btnClear").addEventListener("click", clearAll);

  /* boot */
  restore();
  convert();
})();
