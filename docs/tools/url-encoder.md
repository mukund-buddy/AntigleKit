# Feature doc — URL Encoder

Page: `tools/url-encoder/index.html`
Logic: `assets/js/tools/url-encoder.js` over `assets/js/validate/urls.js`
Data: none · Catalog id: `url-encoder` (category `web`) · Status: **live**

---

## 1. Why it exists

Query strings and paths must be percent-encoded, and hand-encoding is error
prone. An encoder that also *notices when you feed it already-encoded text*
is the difference between a toy and a tool (ROADMAP Phase 3).

## 2. How it works

1. Typing (or pasting) into the source field re-encodes live.
2. `urls.js` `encodeUrlComponent` wraps `encodeURIComponent` but, after
   encoding, checks whether the result still contains `%` sequences that look
   like a prior encoding (e.g. the literal `%20` in the input produced `%2520`).
   When double-encoding is detected the status line warns: "Input looks
   already-encoded".
3. Output is one `<pre>` block; `<tg-copy-button>` reads it directly. No
   network calls.

## 3. Limitations

- `encodeURIComponent` semantics: it does *not* encode `!'()*` — handled via a
  small correction map in `urls.js` so output matches `encodeURIComponent`
  RFC 3986 expectations for strict use.
- Query-string *ordering* and fragment handling are the caller's job; this
  tool encodes one string at a time.

## 4. Browser compatibility

- `encodeURIComponent` universal; ES modules; offline-safe.

## 5. Maintenance requirements

- Keep the RFC 3986 exclusions list in `urls.js` in sync if browsers ever
  change `encodeURIComponent` (they won't; defensive note only).

## 6. Trade-offs

- **Single correction map** (chosen) over a hand-rolled encoder: correctness
  from the platform, strictness where it matters.
- **Warn, don't block** on double-encoding (chosen): users may legitimately
  need `%2520`.

## 7. Future improvements

- Encode full URLs (scheme/host preserved) vs component mode toggle.

## 8. Verified references

- MDN `encodeURIComponent` exclusions — 2026-08-06.