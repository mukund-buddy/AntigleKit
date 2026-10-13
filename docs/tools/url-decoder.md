# Feature doc — URL Decoder

Page: `tools/url-decoder/index.html`
Logic: `assets/js/tools/url-decoder.js` over `assets/js/validate/urls.js`
Data: none · Catalog id: `url-decoder` (category `web`) · Status: **live**

---

## 1. Why it exists

Encoded URLs are unreadable: `%20`, `%C3%A9`, `%3F`… A decoder that restores
the readable text *and* flags malformed escape sequences (stray `%`, bad hex)
saves the "why does my URL look broken" round trip (ROADMAP Phase 3).

## 2. How it works

1. Paste or type into the source; the decoded text renders live in a
   `<pre>` and the query string is split into key=value pairs shown readably.
2. `urls.js` `decodeUrlComponent`: `try { decodeURIComponent }` and, when it
   throws `URIError`, the input is scanned for the first `%` not followed by
   two hex digits. That position is reported as "bad escape at index N" —
   instead of a raw exception.
3. Decoding is lossless for text; `%20` → space etc. The status line flips to
   an error state on malformed input, and garbage is never rendered silently.

## 3. Limitations

- Strict decoding — a lone `%` is an error (correct: it is invalid
  percent-encoding), not silently kept.
- Binary sequences that decode to invalid UTF-8 will throw the same way as
  strict text decoders; acceptable for the text use case.

## 4. Browser compatibility

- `decodeURIComponent` universal; ES modules; offline-safe.

## 5. Maintenance requirements

- None time-bound; `decodeUrlComponent` owns the URIError→position mapping,
  so any engine wording change is isolated in `urls.js`.

## 6. Trade-offs

- **Strict `decodeURIComponent` + position report** (chosen) over a lenient
  regex decoder that would mask genuinely corrupt input.

## 7. Future improvements

- Decode *or* show raw bytes for invalid UTF-8 (hex dump view).

## 8. Verified references

- MDN `decodeURIComponent` (URIError on malformed) — 2026-08-06.