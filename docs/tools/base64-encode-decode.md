# Feature doc — Base64 Encode / Decode

Page: `tools/base64-encode-decode/index.html`
Logic: `assets/js/tools/base64-encode-decode.js` over `assets/js/validate/base64-tools.js`
Data: none · Catalog id: `base64-encode-decode` (category `web`) · Status: **live**

---

## 1. Why it exists

Base64 is the everyday transport encoding for file names, small payloads in
configs, and one-liner mailing. A round-trip encoder/decoder that is
**Unicode-safe** and still flags genuinely invalid input is a common,
self-contained developer need (ROADMAP Phase 3).

## 2. How it works

1. The page has encode and decode outputs side by side. Text typed in the
   encode source is encoded live; Base64 pasted into the decode source is
   decoded live.
2. `base64-tools.js`: encode uses `TextEncoder` → `Uint8Array` → `btoa` from a
   binary string (chunked so very large inputs don't blow the call stack);
   decode reverses through `atob` → `TextDecoder('utf-8', { fatal: true })`.
3. The `fatal` flag means invalid UTF-8 (e.g. decoding binary data as text)
   throws a readable "not valid text" error instead of emitting `\uFFFD`s —
   the round-trip of `Hello`, `你好`, `🚀` decodes back **exactly**.
4. Bad Base64 (padding, invalid alphabet) is rejected with a message; the
   detected summary line flips to an error state and output is never garbage.

## 3. Limitations

- Text-oriented: binary → Base64 produces a string, but Base64 → text only
  makes sense for UTF-8; arbitrary binary (images) can't be entered as text.
- No URL-safe variant (-_ alphabet); not needed by the text use case.

## 4. Browser compatibility

- `btoa`/`atob`, `TextEncoder`, `TextDecoder(fatal)` — all modern browsers.
  ES modules. Offline-safe.

## 5. Maintenance requirements

- If `TextDecoder('utf-8', { fatal: true })` behavior differs anywhere, the
  guard stays in `validate/base64-tools.js`; no page-specific logic.

## 6. Trade-offs

- **`fatal:true` decoding** (chosen) so binary junk is rejected loudly rather
  than replaced with replacement chars. Cost: images won't paste as text —
  acceptable for a text tool.
- **Chunked `btoa`** (chosen) over naive joins for long inputs.

## 7. Future improvements

- File → Base64 (Blob reader) and Base64 → download for text payloads.
- URL-safe alphabet toggle.

## 8. Verified references

- `TextDecoder` fatal flag (MDN) — 2026-08-06.