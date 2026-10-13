# SECURITY.md — Static-site security plan

Attacker model: static pages, no accounts, no user data stored server-side.
Threats: XSS via tool input, injected payloads in future user-supplied
content, clickjacking, MIME sniffing, referrer leakage, ad-network injection.

## Headers (implemented in `_headers`)

```ini
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://i.ytimg.com; media-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains
```

Notes:
- Inline `<script type="application/ld+json">` is NOT executable JS and is
  permitted under this CSP. All real JS lives in external files.
- No `'unsafe-inline'` in `script-src` — do not add it. If a widget demands
  inline JS, redesign the widget.
- When AI tools ship: add `https://generativelanguage.googleapis.com` to
  `connect-src` for the tool path only (verify CORS per ARCHITECTURE §2.4).
- `https://i.ytimg.com` is in `connect-src` (2026-08-08) for the Thumbnail
  Downloader's fetch+blob direct download; `img-src https:` covers the image
  loads. It is an image-only host — no scripts, no credentials.
- `https://www.youtube.com` is in `connect-src` (2026-08-08) for the
  Thumbnail Downloader's `oEmbed` title lookup (`/oembed?url=…&format=json`).
  The endpoint returns title/author only, requires no credentials, and the
  call fails silently — it never gates the tool's core flow.
- When ads ship: add the network's script host to `script-src` AND its
  beacon host to `connect-src` (two entries, per Cloudflare's docs).
- `frame-ancestors 'none'` + `X-Frame-Options: DENY` both present (defense
  in depth).
- HSTS `preload` directive deferred until domain is confirmed permanent.

## Code rules (review checklist)

- No `eval`, `new Function`, `document.write`, inline handlers
  (`onclick=` etc.) — CSP and practice forbid them.
- DOM injection: string templates use an `esc()` helper for any data that
  originates outside the file (future: user-provided names, file contents).
  Component code uses `textContent` where possible.
- The manifest generator treats all input as **data**: JSON.stringify output
  is escaped by JSON semantics; the JSON preview renders through a
  tokenizer that never emits HTML from input values (see
  `assets/js/components/tg-json-view.js`).
- Clipboard: `navigator.clipboard` behind try/catch with `execCommand`
  fallback; no permissions requested beyond what the browser asks.
- File downloads: Blob + anchor `download`; no `data:` URL injection of
  untrusted HTML (downloads are `.json` only).

## Secrets policy

- **Nothing secret exists in this repository.** API keys are user-entered at
  runtime (future AI tools), stored only in the user's browser with
  explicit consent, never in code, never in URLs.
- Key input UI (future): `type="password"`, `autocomplete="off"`,
  `spellcheck="false"`, visible notice that the key is used only for direct
  calls to Google's Gemini API.

## Verification

- Security headers validated post-deploy (`curl -sI` on each path);
  procedure in SEO.md release checklist.
- CSP can be staged with `Content-Security-Policy-Report-Only` before
  enforcement on a new path.

---

## Bug bounty audit — 2026-08-07

Proactive attacker-model pass on the live site + source (`assets/js`,
`assets/data`, `_headers`, `_redirects`). This is the standing rule: every
few releases re-run the grep audit below and the live probes; all findings
get a severity and — if CODE-level and cheap — an immediate fix in the same
session.

### Audit procedure (repeatable)

1. `grep` for sinks: `innerHTML|outerHTML|insertAdjacentHTML`, `eval(`,
   `new Function`, `javascript:`, `srcdoc`, `document.write`, inline
   `onclick=|onerror=`, `target="_blank"` without `rel=`.
2. `grep` for data flow: `window.open`, `.src =`, `.href =`, `fetch(`,
   `navigator.clipboard`, `localStorage`, `postMessage`, `FileReader`.
3. Secret scan: AWS/Google/OpenAI-style key patterns across `*.js|json|md`.
4. Live probes in Playwright: XSS payload into every tool output; confirm
   the DOM shows it as **text** (or JSON-escaped), never as markup.
5. Malformed-input fuzz: truncated/corrupt archives, over-quota files,
   huge strings (zip bomb, 10 MB word paste).

### Verified-safe areas

- All tool/site output renders through `textContent`, `createElement`, or
  the pure tokenizer in `assets/js/components/tg-json-view.js` (every token
  HTML-escaped) — reflected-XSS probes came back as inert text on the
  live pages.
- No `eval`, `new Function`, `document.write`, or inline event handlers
  anywhere; `script-src 'self'` stays clean.
- `thumbnailUrl`/`parseVideoId` (`assets/js/validate/youtube.js`) allow only
  an 11-char `[0-9A-Za-z_-]` video ID + a whitelisted size key, so
  user-supplied links can never shape the `i.ytimg.com` URL or `window.open`.
- Bug-report `mailto:` is fully `encodeURIComponent`-wrapped — no
  subject/body header injection.
- ZIP parser bounds-checks every header read; JSON/manifest inputs render as
  data; no secrets present in the repo.

### Findings

1. **High — ZIP decompression bomb (fixed the same session).**
   `readEntryData` trusted the central directory `usize` but never capped
   the inflate output; a crafted `.mcpack` (tiny on disk) could decompress
   to ~1 GB+ per entry (measured 1014× ratio) and freeze the visitor's tab.
   Fix: `MAX_DECOMPRESSED = 100 MB` in `zip-parse.js`: entries claiming a
   larger `usize` are rejected before any inflate runs; the browser tool's
   `inflateSmart` also streams-decompresses through a size-savvy reader that
   aborts past the cap. Regression tests in the node suite.
2. **MED] Unescaped `href` sink in `tg-tool-card` (fixed).** The card's
   live-title link interpolated `tool.href` straight into an attribute.
   Harmless today (comes from the trusted `tools.json`), but a poisoned
   catalog value could become an `onclick=`/`javascript:` — now passed
   through `_escAttr`. All other card fields were already escaped.
3. **LOW] Header perimeter depends on `_headers` alone (fix planned).**
   There is no CSP `<meta>` fallback, so any host that ignores
   `/_headers` (or a local dev server) serves the site with zero CSP/XFO.
   Plan: mirror the CSP as a `<meta http-equiv="content-security-policy">`
   in the page head, staged `Content-Security-Policy-Report-Only` first;
   add to the canonical `templates/` chrome so new pages inherit it.
4. **Perf (non-security):** `countWords` is linear; a 10 MB paste is ~3 s.
   Acceptable for the current cap; revisit if users paste corpora (add a
   size gate then).
