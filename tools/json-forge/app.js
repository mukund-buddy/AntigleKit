/* ============================================================
   JSON Forge — the brain
   Format · Validate · Minify · Tree view · Open/Download — all local.
   Written to be READ. If you know HTML + JSON basics, start here.
   ============================================================ */

const $ = (id) => document.getElementById(id);
const input = $("input");
const output = $("output");
const errorBox = $("error");
const treeEl = $("tree");
const outputLabel = $("outputLabel");

const BUFFER_KEY = "jsonforge-buffer";

/* Safe storage: some browsers block localStorage on file:// and a bare
   call would throw inside our event handlers. */
function storeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}
function storeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    /* ignore */
  }
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ---------- Highlighting ----------
   One tokenizer pass instead of chained regexes. The old chain rewrote
   `: 42` INSIDE string values (e.g. {"t":": 42"}) — this walks the
   string once and only ever wraps real tokens. */
const TOKEN_RE =
  /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

function highlight(jsonString) {
  let out = "";
  let last = 0;
  let m;
  TOKEN_RE.lastIndex = 0;

  while ((m = TOKEN_RE.exec(jsonString)) !== null) {
    out += escapeHtml(jsonString.slice(last, m.index));
    const token = escapeHtml(m[0]);

    if (m[1] !== undefined && m[2] !== undefined) {
      out += '<span class="key">' + token + "</span>";
    } else if (m[1] !== undefined) {
      out += '<span class="str">' + token + "</span>";
    } else if (m[3] !== undefined) {
      out += '<span class="bool">' + token + "</span>";
    } else if (m[0] === "null") {
      out += '<span class="nul">' + token + "</span>";
    } else {
      out += '<span class="num">' + token + "</span>";
    }
    last = m.index + m[0].length;
  }
  out += escapeHtml(jsonString.slice(last));
  return out;
}

/* ---------- Error location ----------
   Turns "… at position 42" / "… line 3 column 5" into a real line:col
   so the README's promise is actually true. */
function locateError(raw, message) {
  let pos = null;
  let line = null;
  let col = null;

  let m = message.match(/position (\d+)/i);
  if (m) pos = parseInt(m[1], 10);

  m = message.match(/line (\d+)\s+column (\d+)/i);
  if (m) {
    line = parseInt(m[1], 10);
    col = parseInt(m[2], 10);
  }

  if (pos === null && line === null) return { message: message, line: null, col: null };

  if (pos !== null && line === null) {
    const upto = raw.slice(0, Math.min(pos, raw.length));
    const lines = upto.split("\n");
    line = lines.length;
    col = lines[lines.length - 1].length + 1;
  }

  return { message: message, line: line, col: col };
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
  input.setAttribute("aria-invalid", "true");
}

function clearError() {
  errorBox.classList.add("hidden");
  errorBox.textContent = "";
  input.removeAttribute("aria-invalid");
}

function setOutput(html, label) {
  output.innerHTML = "<code>" + html + "</code>";
  outputLabel.textContent = label;
}

/* Returns parsed data, or null on failure (error already shown). */
function getParsed() {
  const raw = input.value.trim();
  if (!raw) {
    showError("Nothing to work with — paste some JSON first.");
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    const loc = locateError(raw, e.message);
    showError(
      "Invalid JSON — " +
        loc.message +
        (loc.line ? "  ·  line " + loc.line + ", column " + loc.col : "")
    );
    return null;
  }
}

/* ---------- Actions ---------- */

function format() {
  const data = getParsed();
  if (data === null) return;
  clearError();
  setOutput(highlight(JSON.stringify(data, null, 2)), "Output · formatted");
}

function minify() {
  const data = getParsed();
  if (data === null) return;
  clearError();
  setOutput(highlight(JSON.stringify(data)), "Output · minified");
}

/* Build an expandable tree from parsed JSON */
function renderTree(data) {
  function build(value, key) {
    const li = document.createElement("li");

    if (value !== null && typeof value === "object") {
      const isArr = Array.isArray(value);
      const entries = isArr ? value.map((v, i) => [i, v]) : Object.entries(value);
      const label = key !== undefined ? (isArr ? key : '"' + key + '"') : "root";

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "toggle";
      toggle.textContent = "▾";
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Collapse " + label);

      const name = document.createElement("span");
      name.className = "tkey";
      name.textContent = label + (isArr ? " [] " : " {} ") + entries.length;

      const ul = document.createElement("ul");

      toggle.addEventListener("click", () => {
        const open = ul.style.display !== "none";
        ul.style.display = open ? "none" : "";
        toggle.textContent = open ? "▸" : "▾";
        toggle.setAttribute("aria-expanded", String(!open));
        toggle.setAttribute("aria-label", (open ? "Expand " : "Collapse ") + label);
      });

      li.append(toggle, name, ul);
      entries.forEach(([k, v]) => ul.appendChild(build(v, k)));
    } else {
      const val =
        typeof value === "string" ? '"' + value + '"' : String(value);
      li.innerHTML =
        (key !== undefined ? '<span class="tkey">' + escapeHtml(String(key)) + ":</span> " : "") +
        '<span class="tval">' + escapeHtml(val) + "</span>";
    }
    return li;
  }

  treeEl.innerHTML = "";
  treeEl.appendChild(build(data));
}

function treeView() {
  const data = getParsed();
  if (data === null) return;
  clearError();
  renderTree(data);
  setOutput(highlight(JSON.stringify(data, null, 2)), "Output · formatted");
}

function setTreeOpen(open) {
  treeEl.querySelectorAll(".toggle").forEach((btn) => {
    const ul = btn.nextElementSibling && btn.nextElementSibling.nextElementSibling;
    if (!ul || ul.tagName !== "UL") return;
    ul.style.display = open ? "" : "none";
    btn.textContent = open ? "▾" : "▸";
    btn.setAttribute("aria-expanded", String(open));
    const label = (btn.getAttribute("aria-label") || "").replace(/^(Expand|Collapse) /, "");
    btn.setAttribute("aria-label", (open ? "Collapse " : "Expand ") + label);
  });
}

async function copyOutput() {
  const text = output.textContent;
  if (!text || text.startsWith("Output appears")) return;
  try {
    await navigator.clipboard.writeText(text);
    const btn = $("btnCopy");
    btn.textContent = "Copied ✓";
    setTimeout(() => (btn.textContent = "Copy"), 1200);
  } catch (e) {
    showError("Clipboard blocked by the browser — select and copy manually.");
  }
}

function downloadOutput() {
  const text = output.textContent;
  if (!text || text.startsWith("Output appears")) {
    showError("Nothing to download yet — run Format or Minify first.");
    return;
  }
  const dataUrl = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = "formatted.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(dataUrl), 1000);
}

function loadSample() {
  input.value = JSON.stringify(
    {
      project: "JSON Forge",
      author: { name: "Mukund", alias: "mukund-buddy" },
      vibe: ["building", "testing", "refining"],
      metrics: { repos: 19, coffee: 9001, sleep: null },
      clientSide: true,
      uploads: null,
    },
    null,
    2
  );
  inputInfoUpdate();
  format();
}

function clearAll() {
  input.value = "";
  output.innerHTML = "<code>Output appears here…</code>";
  outputLabel.textContent = "Output";
  treeEl.innerHTML = '<p class="dim">Run "Tree View" to see the structure.</p>';
  clearError();
  inputInfoUpdate();
  storeSet(BUFFER_KEY, "");
}

/* Open a local .json file — no upload, FileReader stays in-memory. */
function openFile(file) {
  if (!file) return;
  if (!/\.(json|txt)$/i.test(file.name) && file.type && file.type.indexOf("json") === -1) {
    showError("That doesn't look like a JSON file.");
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => showError("Could not read that file.");
  reader.onload = () => {
    input.value = String(reader.result || "");
    inputInfoUpdate();
    format();
  };
  reader.readAsText(file);
}

function inputInfoUpdate() {
  const len = input.value.length;
  $("inputInfo").textContent = len.toLocaleString() + " chars";
  storeSet(BUFFER_KEY, input.value);
}

/* ---------- Wire up ---------- */
$("btnFormat").addEventListener("click", format);
$("btnMinify").addEventListener("click", minify);
$("btnTree").addEventListener("click", treeView);
$("btnSample").addEventListener("click", loadSample);
$("btnClear").addEventListener("click", clearAll);
$("btnCopy").addEventListener("click", copyOutput);
$("btnDownload").addEventListener("click", downloadOutput);
$("btnExpand").addEventListener("click", () => setTreeOpen(true));
$("btnCollapse").addEventListener("click", () => setTreeOpen(false));
$("fileInput").addEventListener("change", (e) => openFile(e.target.files[0]));
input.addEventListener("input", inputInfoUpdate);

/* drag & drop onto the input pane */
const dropPane = $("inputPane");
["dragenter", "dragover"].forEach((ev) =>
  dropPane.addEventListener(ev, (e) => {
    e.preventDefault();
    dropPane.classList.add("dropping");
  })
);
["dragleave", "drop"].forEach((ev) =>
  dropPane.addEventListener(ev, (e) => {
    e.preventDefault();
    dropPane.classList.remove("dropping");
  })
);
dropPane.addEventListener("drop", (e) => {
  if (e.dataTransfer && e.dataTransfer.files.length) openFile(e.dataTransfer.files[0]);
});

/* Ctrl/Cmd+Enter = format */
input.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    format();
  }
});

/* restore last buffer */
const saved = storeGet(BUFFER_KEY);
if (saved) {
  input.value = saved;
  inputInfoUpdate();
}
