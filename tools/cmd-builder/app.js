/* ============================================================
   CMD BUILDER — Minecraft Bedrock command assembler
   config-driven fields → live string → validation → copy
   ============================================================ */

(function () {
  "use strict";

  var STORE_KEY = "cmd-builder:v1";
  var $ = function (id) { return document.getElementById(id); };

  var SELECTORS = ["@s", "@p", "@a", "@e", "@r"];
  var RE_SELECTOR = /^@(s|p|a|e|r)(\[[^\]]*\])?$/;
  var RE_ITEM = /^[a-z0-9_.-]+:[a-z0-9_./-]+$/i;
  var RE_COORD = /^[~^][-+]?\d*(\.\d+)?$|^[-+]?(\d+(\.\d*)?|\.\d+)$/;
  var RE_TAG = /^[A-Za-z0-9_.+-]+$/;

  var els = {
    fields: $("fields"),
    cmds: Array.prototype.slice.call(document.querySelectorAll(".cmd")),
    output: $("output"),
    validity: $("validity"),
    cmdLabel: $("cmdLabel"),
    hint: $("hint"),
    alert: $("alert"),
    copy: $("btnCopy"),
    copy2: $("btnCopy2")
  };

  /* ============================================================
     COMMAND CONFIG
     ============================================================ */

  var COMMANDS = {
    give: {
      label: "/give",
      fields: [
        { id: "target", type: "select", label: "Target", options: SELECTORS },
        { id: "item", type: "text", label: "Item ID", list: "dlItems", value: "minecraft:diamond" },
        { id: "amount", type: "number", label: "Amount", value: "1", min: 1, step: 1 },
        { id: "data", type: "number", label: "Data value (optional)", value: "", min: 0, step: 1 }
      ],
      build: function (v) {
        var s = "/give " + v.target + " " + (v.item || "minecraft:air");
        if (v.amount !== "") s += " " + v.amount;
        if (v.data !== "") s += " " + v.data;
        return s;
      },
      validate: function (v) {
        return [
          check(RE_SELECTOR.test(v.target), "target", "Use a selector: @s @p @a @e @r"),
          check(RE_ITEM.test(v.item), "item", "Item must look like minecraft:diamond"),
          check(isInt(v.amount) && +v.amount >= 1, "amount", "Amount must be a whole number ≥ 1"),
          check(v.data === "" || (isInt(v.data) && +v.data >= 0), "data", "Data value must be ≥ 0")
        ];
      }
    },

    tp: {
      label: "/tp",
      fields: [
        { id: "target", type: "select", label: "Who teleports", options: SELECTORS },
        {
          id: "mode", type: "radios", label: "Destination type", name: "tpmode",
          options: [{ v: "player", t: "Player" }, { v: "coords", t: "Coordinates" }],
          value: "player"
        },
        { id: "dest", type: "select", label: "Teleport to", options: SELECTORS, value: "@p", showWhen: { mode: "player" } },
        { id: "x", type: "text", label: "X", value: "~", showWhen: { mode: "coords" } },
        { id: "y", type: "text", label: "Y", value: "64", showWhen: { mode: "coords" } },
        { id: "z", type: "text", label: "Z", value: "~", showWhen: { mode: "coords" } }
      ],
      build: function (v) {
        var dest = v.mode === "coords" ? [v.x, v.y, v.z].join(" ") : v.dest;
        return "/tp " + v.target + " " + dest;
      },
      validate: function (v) {
        var errs = [
          check(RE_SELECTOR.test(v.target), "target", "Use a selector: @s @p @a @e @r")
        ];
        if (v.mode === "coords") {
          ["x", "y", "z"].forEach(function (k) {
            errs.push(check(RE_COORD.test(v[k]), k, "Numbers, ~ or ^ only"));
          });
        } else {
          errs.push(check(RE_SELECTOR.test(v.dest), "dest", "Use a selector: @s @p @a @e @r"));
        }
        return errs;
      }
    },

    effect: {
      label: "/effect",
      fields: [
        { id: "target", type: "select", label: "Target", options: SELECTORS },
        { id: "effect", type: "text", label: "Effect ID", list: "dlEffects", value: "minecraft:speed" },
        { id: "duration", type: "number", label: "Duration (seconds)", value: "30", min: 0, step: 1 },
        { id: "amp", type: "number", label: "Amplifier (0 = level I)", value: "1", min: 0, max: 255, step: 1 },
        { id: "hide", type: "check", label: "Hide particles", value: false }
      ],
      build: function (v) {
        var s = "/effect " + v.target + " " + (v.effect || "minecraft:speed") + " " + (v.duration || 0);
        var amp = v.amp === "" ? "0" : v.amp;
        if (v.hide) s += " " + amp + " true";       // particles flag needs amplifier first
        else if (v.amp !== "") s += " " + v.amp;
        return s;
      },
      validate: function (v) {
        return [
          check(RE_SELECTOR.test(v.target), "target", "Use a selector: @s @p @a @e @r"),
          check(RE_ITEM.test(v.effect), "effect", "Effect must look like minecraft:speed"),
          check(isInt(v.duration) && +v.duration >= 0, "duration", "Seconds must be ≥ 0"),
          check(v.amp === "" || (isInt(v.amp) && +v.amp >= 0 && +v.amp <= 255), "amp", "Amplifier: whole number 0–255")
        ];
      }
    },

    tag: {
      label: "/tag",
      fields: [
        { id: "target", type: "select", label: "Target", options: SELECTORS },
        {
          id: "op", type: "radios", label: "Operation", name: "tagop",
          options: [{ v: "add", t: "Add" }, { v: "remove", t: "Remove" }, { v: "list", t: "List" }],
          value: "add"
        },
        { id: "name", type: "text", label: "Tag name", value: "vip", disableWhen: { op: "list" } }
      ],
      build: function (v) {
        if (v.op === "list") return "/tag " + v.target + " list";
        return "/tag " + v.target + " " + v.op + " " + (v.name || "tag");
      },
      validate: function (v) {
        var errs = [check(RE_SELECTOR.test(v.target), "target", "Use a selector: @s @p @a @e @r")];
        if (v.op !== "list") {
          errs.push(check(RE_TAG.test(v.name) && v.name.length <= 64, "name",
            "Letters, digits, _ . + - only (max 64)"));
        }
        return errs;
      }
    },

    clear: {
      label: "/clear",
      fields: [
        { id: "target", type: "select", label: "Target", options: SELECTORS },
        { id: "item", type: "text", label: "Item ID (blank = everything)", list: "dlItems", value: "minecraft:diamond" },
        { id: "amount", type: "number", label: "Max amount (optional)", value: "", min: 1, step: 1 }
      ],
      build: function (v) {
        var s = "/clear " + v.target;
        if (v.item) s += " " + v.item;
        if (v.amount !== "") s += " " + v.amount;
        return s;
      },
      validate: function (v) {
        return [
          check(RE_SELECTOR.test(v.target), "target", "Use a selector: @s @p @a @e @r"),
          check(v.item === "" || RE_ITEM.test(v.item), "item", "Item must look like minecraft:diamond"),
          check(v.amount === "" || (isInt(v.amount) && +v.amount >= 1), "amount", "Amount must be a whole number ≥ 1")
        ];
      }
    }
  };

  function check(ok, id, msg) { return ok ? null : { id: id, msg: msg }; }
  function isInt(s) { return /^-?\d+$/.test(String(s)); }

  /* ============================================================
     STATE
     ============================================================ */

  var state = { active: "give", values: {} };

  Object.keys(COMMANDS).forEach(function (key) {
    state.values[key] = {};
    COMMANDS[key].fields.forEach(function (f) {
      if (f.type === "radios") state.values[key][f.id] = f.value;
      else if (f.type === "check") state.values[key][f.id] = !!f.value;
      else state.values[key][f.id] = f.value !== undefined ? f.value : (f.type === "select" ? f.options[0] : "");
    });
  });

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function restore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      if (s && COMMANDS[s.active]) state.active = s.active;
      if (s && s.values) {
        Object.keys(state.values).forEach(function (k) {
          if (s.values[k] && typeof s.values[k] === "object") {
            Object.keys(state.values[k]).forEach(function (f) {
              if (s.values[k][f] !== undefined) state.values[k][f] = s.values[k][f];
            });
          }
        });
      }
    } catch (e) { /* ignore */ }
  }

  /* ============================================================
     FIELD RENDERING
     ============================================================ */

  function visible(f, v) {
    if (!f.showWhen) return true;
    return Object.keys(f.showWhen).every(function (k) { return v[k] === f.showWhen[k]; });
  }

  function renderFields() {
    var cmd = COMMANDS[state.active];
    var v = state.values[state.active];
    els.fields.innerHTML = "";

    cmd.fields.forEach(function (f) {
      if (!visible(f, v)) return;
      var wrap = document.createElement("div");
      wrap.className = "field";

      if (f.type === "radios") {
        var fs = document.createElement("fieldset");
        var lg = document.createElement("legend");
        lg.textContent = f.label;
        fs.appendChild(lg);
        var row = document.createElement("div");
        row.className = "radios";
        f.options.forEach(function (o) {
          var lab = document.createElement("label");
          var inp = document.createElement("input");
          inp.type = "radio";
          inp.name = f.name;
          inp.value = o.v;
          inp.checked = v[f.id] === o.v;
          inp.addEventListener("change", function () {
            state.values[state.active][f.id] = o.v;
            renderFields();
            update();
          });
          lab.appendChild(inp);
          lab.appendChild(document.createTextNode(o.t));
          row.appendChild(lab);
        });
        fs.appendChild(row);
        wrap.appendChild(fs);
        els.fields.appendChild(wrap);
        return;
      }

      var lab2 = document.createElement("label");
      lab2.setAttribute("for", "f-" + f.id);
      lab2.textContent = f.label;
      wrap.appendChild(lab2);

      var input;
      if (f.type === "select") {
        input = document.createElement("select");
        f.options.forEach(function (o) {
          var opt = document.createElement("option");
          opt.value = o;
          opt.textContent = o;
          input.appendChild(opt);
        });
        input.value = v[f.id];
      } else if (f.type === "check") {
        wrap.className = "field check";
        input = document.createElement("input");
        input.type = "checkbox";
        input.checked = !!v[f.id];
        var lab3 = document.createElement("label");
        lab3.setAttribute("for", "f-" + f.id);
        lab3.textContent = f.label;
        wrap.innerHTML = "";
        wrap.appendChild(input);
        wrap.appendChild(lab3);
        input.addEventListener("change", function () {
          state.values[state.active][f.id] = input.checked;
          update();
        });
        els.fields.appendChild(wrap);
        return;
      } else {
        input = document.createElement("input");
        input.type = f.type === "number" ? "number" : "text";
        if (f.min !== undefined) input.min = f.min;
        if (f.max !== undefined) input.max = f.max;
        if (f.step !== undefined) input.step = f.step;
        if (f.list) input.setAttribute("list", f.list);
        input.value = v[f.id];
        input.setAttribute("autocomplete", "off");
        input.setAttribute("spellcheck", "false");
      }

      input.id = "f-" + f.id;
      if (f.disableWhen) {
        var off = Object.keys(f.disableWhen).every(function (k) { return v[k] === f.disableWhen[k]; });
        input.disabled = off;
      }
      input.addEventListener("input", function () {
        state.values[state.active][f.id] = input.value;
        update();
      });
      input.addEventListener("change", function () {
        state.values[state.active][f.id] = input.value;
        update();
      });
      wrap.appendChild(input);
      els.fields.appendChild(wrap);
    });
  }

  /* ============================================================
     UPDATE / VALIDATE
     ============================================================ */

  function update() {
    var cmd = COMMANDS[state.active];
    var v = state.values[state.active];
    var text = cmd.build(v);
    var errors = cmd.validate(v).filter(Boolean);

    els.output.textContent = text;
    els.cmdLabel.textContent = cmd.label;
    els.alert.hidden = true;

    // clear previous field errors
    Array.prototype.forEach.call(els.fields.querySelectorAll(".why"), function (n) {
      n.parentNode.removeChild(n);
    });
    Array.prototype.forEach.call(els.fields.querySelectorAll("input.bad"), function (n) {
      n.classList.remove("bad");
      n.removeAttribute("aria-invalid");
    });

    if (errors.length) {
      els.validity.textContent = errors.length + " issue" + (errors.length > 1 ? "s" : "");
      els.validity.className = "badge bad";
      els.hint.textContent = errors[0].msg;
      els.hint.className = "hint bad";
      errors.forEach(function (e) {
        var input = document.getElementById("f-" + e.id);
        if (input) {
          input.classList.add("bad");
          input.setAttribute("aria-invalid", "true");
          var why = document.createElement("span");
          why.className = "why";
          why.textContent = e.msg;
          input.parentNode.appendChild(why);
        }
      });
      els.copy.disabled = true;
      els.copy2.disabled = true;
      els.copy.title = errors[0].msg;
      els.copy2.title = errors[0].msg;
    } else {
      els.validity.textContent = "ready";
      els.validity.className = "badge ok";
      els.hint.textContent = "✓ valid Bedrock syntax — paste it in chat";
      els.hint.className = "hint";
      els.copy.disabled = false;
      els.copy2.disabled = false;
      els.copy.title = "";
      els.copy2.title = "";
    }

    save();
  }

  function selectCommand(key) {
    if (!COMMANDS[key]) return;
    state.active = key;
    els.cmds.forEach(function (b) {
      var on = b.getAttribute("data-cmd") === key;
      b.classList.toggle("active", on);
      b.setAttribute("aria-checked", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
    renderFields();
    update();
  }

  /* ============================================================
     PRESETS / COPY / BOOT
     ============================================================ */

  var PRESETS = [
    { cmd: "give", values: { target: "@s", item: "minecraft:diamond_sword", amount: "1", data: "" } },
    { cmd: "give", values: { target: "@a", item: "minecraft:cooked_beef", amount: "16", data: "" } },
    { cmd: "tp", values: { target: "@s", mode: "coords", x: "~", y: "100", z: "~", dest: "@p" } },
    { cmd: "tp", values: { target: "@p", mode: "player", dest: "@s", x: "~", y: "64", z: "~" } },
    { cmd: "effect", values: { target: "@s", effect: "minecraft:speed", duration: "30", amp: "1", hide: true } },
    { cmd: "effect", values: { target: "@e[type=zombie]", effect: "minecraft:strength", duration: "60", amp: "2", hide: false } },
    { cmd: "tag", values: { target: "@s", op: "add", name: "vip" } },
    { cmd: "clear", values: { target: "@p", item: "minecraft:arrow", amount: "64" } }
  ];

  function randomPreset() {
    var p = PRESETS[Math.floor(Math.random() * PRESETS.length)];
    Object.keys(p.values).forEach(function (k) {
      state.values[p.cmd][k] = p.values[k];
    });
    selectCommand(p.cmd);
    els.hint.textContent = "preset loaded";
    els.hint.className = "hint warn";
  }

  function copyCmd(btn) {
    var text = els.output.textContent;
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

  /* ---------- wiring ---------- */
  els.cmds.forEach(function (b, i) {
    b.addEventListener("click", function () { selectCommand(b.getAttribute("data-cmd")); });
    b.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = els.cmds[(i + 1) % els.cmds.length];
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = els.cmds[(i - 1 + els.cmds.length) % els.cmds.length];
      if (next) { e.preventDefault(); next.click(); next.focus(); }
    });
  });

  els.copy.addEventListener("click", function () { copyCmd(this); });
  els.copy2.addEventListener("click", function () { copyCmd(this); });
  $("btnPreset").addEventListener("click", randomPreset);
  $("btnClear").addEventListener("click", function () {
    Object.keys(COMMANDS).forEach(function (key) {
      COMMANDS[key].fields.forEach(function (f) {
        if (f.type === "radios") state.values[key][f.id] = f.value;
        else if (f.type === "check") state.values[key][f.id] = !!f.value;
        else state.values[key][f.id] = f.value !== undefined ? f.value : (f.type === "select" ? f.options[0] : "");
      });
    });
    selectCommand("give");
    els.hint.textContent = "reset to defaults";
    els.hint.className = "hint warn";
  });

  /* boot */
  restore();
  selectCommand(state.active);
})();
