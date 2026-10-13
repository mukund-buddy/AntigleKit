# Feature doc — JSON Formatter

Page: `tools/json-formatter/index.html`
Logic: `assets/js/tools/json-formatter.js` over `assets/js/validate/json-tools.js`
Data: none · Catalog id: `json-formatter` (category `web`) · Status: **live**

---

## 1. Why it exists

Minified or hand-mangled JSON is hard to read and edit. A formatter that
pretty-prints or minifies instantly is a daily developer tool, generates
search traffic, and is fully self-contained. It ships in the core web & JSON
batch (ROADMAP Phase 3).

## 2. How it works

1. Paste text into the input. Buttons offer **Format** (pretty-print with
   2-space indent), **Minify**, and **Sample**.
2. `json-tools.js` first parses with `JSON.parse` (via `parseJson`), then
   regenerates with `JSON.stringify`. Parse failure produces a structured
   `line`, `column`, and a one-line snippet for the report.
3. Because modern V8 sparse parse messages ("Unexpected token 'x'…") no longer
   include "position N", `parseErrorPosition` re-derives the offset by
   `lastIndexOf(token)` and falls back to `raw.length` for "end of JSON input".
   The error summary shows "line L, column C" over top of the offending line.
4. Output renders in a `<pre>` (`text-out`) so `<tg-copy-button>` reads clean
   `textContent`. Empty/invalid input never mutates app state — the error
   report is shown instead.

## 3. Limitations

- Pretty-printing follows `JSON.stringify` conventions (2-space indent, no
   trailing commas, `\uXXXX` for lone surrogates). Non-standard JSON dialects
   (comments, trailing commas) are not formatted — they fail validation first.
- No syntax highlighting; HTML `<pre>` keeps copy plain and CSP-safe.

## 4. Browser compatibility

- ES modules; `JSON.parse`/`stringify` universal. No experimental APIs.
- Works offline once assets are cached.

## 5. Maintenance requirements

- Watch V8/Node `JSON.parse` error-message wording changes (already handled
  once); the 24-case module test suite guards the error-position path
  (`temp` test runner, run via Node against the `validate/` modules).

## 6. Trade-offs

- **Shared `json-tools.js` logic** (chosen) so Formatter and Validator stay in
  lockstep on parse/error/detection. Cost: a tool calls a module it doesn't
  own; node-testable.
- **`<pre>` output** (chosen) for clean copy + monospace rendering over a
  styled `<code>` block.

## 7. Future improvements

- Indent-width option (2/4/tab) and `-0`/`Infinity` handling if a future tool
  needs it.
- Line/column click-to-select in the report.

## 8. Verified references

- V8 JSON.parse error message format change (observed in modern Chrome/Node,
  2026) — handled by `parseErrorPosition`.
- `JSON.stringify` indentation behavior (MDN) — 2026-08-06.