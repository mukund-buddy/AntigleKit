/* ============================================================
   AskMint widget — drop-in ask box for static sites
   Mount point: <div id="askmint"></div>
   Config: window.ASKMINT_CONFIG (config.js) — or optional
   data-config="config.json" attribute (fetch).
   Modes: "email" (mailto) | "link" (config.link template) | "copy"
   ============================================================ */

(function () {
  const mount = document.getElementById("askmint");
  if (!mount) return;

  const $ = (id) => document.getElementById(id);
  const DRAFT_KEY = "askmint-draft";

  /* localStorage is best-effort: hardened browsers / file:// can block it
     and a bare call here would kill the whole widget. */
  function draftGet() {
    try {
      return localStorage.getItem(DRAFT_KEY) || "";
    } catch (e) {
      return "";
    }
  }
  function draftSet(value) {
    try {
      localStorage.setItem(DRAFT_KEY, value);
    } catch (e) {
      /* storage unavailable — draft simply won't persist */
    }
  }
  function draftClear() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Load config ---------- */
  async function boot() {
    let config = {
      recipient: "you@yourmail.com",
      greeting: "Ask me anything!",
      subtext: "",
      categories: ["Other"],
      mode: "email",
      link: "",
      maxChars: 500,
    };

    if (window.ASKMINT_CONFIG && typeof window.ASKMINT_CONFIG === "object") {
      config = Object.assign(config, window.ASKMINT_CONFIG);
    }

    const configFile = mount.getAttribute("data-config");
    if (configFile) {
      try {
        const res = await fetch(configFile);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const loaded = await res.json();
        config = Object.assign(config, loaded);
      } catch (e) {
        /* config load failed → defaults keep the widget working */
      }
    }

    if (!Array.isArray(config.categories) || !config.categories.length) {
      config.categories = ["Other"];
    }
    config.maxChars = Math.max(1, parseInt(config.maxChars, 10) || 500);

    render(config);
  }

  /* ---------- Render the widget ---------- */
  function render(config) {
    const restored = draftGet();

    mount.innerHTML =
      '<div class="askmint-card">' +
      '<div class="askmint-stripe" aria-hidden="true"></div>' +
      '<div class="askmint-head">' +
      "<h2>" + esc(config.greeting) + "</h2>" +
      (config.subtext ? '<p class="askmint-sub">' + esc(config.subtext) + "</p>" : "") +
      "</div>" +

      '<fieldset class="askmint-cats">' +
      '<legend class="askmint-legend">Category</legend>' +
      config.categories
        .map(
          (c, i) =>
            '<button type="button" class="askmint-cat' +
            (i === 0 ? " active" : "") +
            '" aria-pressed="' +
            (i === 0 ? "true" : "false") +
            '">' +
            esc(c) +
            "</button>"
        )
        .join("") +
      "</fieldset>" +

      '<label class="askmint-label" for="askmintText">Your question</label>' +
      '<textarea id="askmintText" maxlength="' +
      config.maxChars +
      '" placeholder="Type your question… your draft saves as you type." aria-describedby="askmintCount"></textarea>' +
      '<div class="askmint-foot">' +
      '<span id="askmintCount" aria-live="polite">0 / ' +
      config.maxChars +
      "</span>" +
      '<button id="askmintSend" type="button" class="askmint-send">Send question</button>' +
      "</div>" +
      '<p class="askmint-status" id="askmintStatus" role="status" aria-live="polite"></p>' +
      '<p class="askmint-privacy">Nothing is sent to a server — submitting opens your own mail app with the question pre-filled.</p>' +
      "</div>";

    const textarea = $("askmintText");
    const count = $("askmintCount");
    const status = $("askmintStatus");
    let category = config.categories[0];

    function setStatus(message) {
      status.textContent = message;
    }

    // category buttons
    mount.querySelectorAll(".askmint-cat").forEach((btn) => {
      btn.addEventListener("click", () => {
        mount.querySelectorAll(".askmint-cat").forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
        category = btn.textContent;
      });
    });

    // draft restore (check length BEFORE clamping so the counter is honest)
    textarea.value = restored.slice(0, config.maxChars);
    updateCount();
    if (restored) {
      setStatus("Draft restored from your last visit.");
    }

    function updateCount() {
      const len = textarea.value.length;
      count.textContent = len + " / " + config.maxChars;
      count.classList.toggle("over", len >= config.maxChars);
    }

    textarea.addEventListener("input", () => {
      if (textarea.value.length > config.maxChars) {
        textarea.value = textarea.value.slice(0, config.maxChars);
      }
      textarea.removeAttribute("aria-invalid");
      draftSet(textarea.value);
      updateCount();
    });

    // send
    $("askmintSend").addEventListener("click", () => {
      const text = textarea.value.trim();
      if (!text) {
        textarea.setAttribute("aria-invalid", "true");
        textarea.classList.add("invalid");
        textarea.placeholder = "Write your question first.";
        textarea.focus();
        setStatus("Your question is empty — nothing was sent.");
        return;
      }

      const subject = "[AskMint] " + category;
      const body =
        "Category: " +
        category +
        "\n\n" +
        text +
        "\n\n— sent from your site's AskMint widget";

      if (config.mode === "link") {
        if (!config.link) {
          setStatus("This widget is set to link mode but config.link is empty — nothing was sent.");
          return;
        }
        const url = config.link
          .replace("{text}", encodeURIComponent(text))
          .replace("{category}", encodeURIComponent(category));
        window.open(url, "_blank", "noopener");
        clearDraft("Opened your question in a new tab — draft cleared.");
        return;
      }

      if (config.mode === "copy") {
        const payload = subject + "\n\n" + text;
        const done = () => clearDraft("Question copied to clipboard — paste it anywhere.");
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(payload).then(done, () => {
            setStatus("Clipboard blocked by the browser — your draft is kept.");
          });
        } else {
          setStatus("Clipboard unsupported here — your draft is kept.");
        }
        return;
      }

      // default: email
      window.location.href =
        "mailto:" +
        config.recipient +
        "?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body);
      clearDraft("Your mail app should open now — draft cleared.");
    });

    /* Clear the draft ONLY after a successful hand-off. An unsupported
       mode used to wipe the visitor's text without sending anything. */
    function clearDraft(message) {
      draftClear();
      textarea.value = "";
      textarea.removeAttribute("aria-invalid");
      textarea.classList.remove("invalid");
      updateCount();
      setStatus(message);
    }
  }

  boot();
})();
