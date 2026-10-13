# Feature doc — UUID Generator

Page: `tools/uuid-generator/index.html`
Logic: `assets/js/tools/uuid-generator.js`
Data: none · Catalog id: `uuid-generator` (category `web`) · Status: **live**

---

## 1. Why it exists

UUIDs are needed everywhere in add-on development — a pack's `header.uuid`
and every `modules[].uuid`, plus entity/block identifiers in code. The
Manifest Generator already mints its own, but creators often need one-off or
batch IDs for existing projects. A dedicated generator with format options
(upper/lowercase, compact, braces) covers Bedrock manifests, C#/Java GUID
conventions, and database/file-name use. It ships in Phase 2 alongside the
Minecraft batch because pack UUIDs are its most common use (ROADMAP).

## 2. How it works

All processing is client-side in the browser:

1. The user picks a count (1–50, clamped), a format (hyphenated vs 32-hex
   compact), case (lower/upper), and braces (none or `{…}`).
2. `uuid-generator.js` mints version 4 UUIDs from `crypto.randomUUID()`
   (fallback: `crypto.getRandomValues` + manual version/variant bits) and
   re-renders the batch on every option change and on "Generate".
3. Output is one UUID per line in a `<pre>` (monospace, selectable); the
   existing `<tg-copy-button>` copies the whole batch (reads `textContent` —
   which is why output is a `<pre>`, not a textarea).
4. No network calls; regeneration is instant and local.

## 3. Limitations

- Version 4 (random) only — no v1/v3/v5, no namespaced generation. A v5
  tool would need a hash + a chosen namespace; not required by any Bedrock
  use case.
- Count capped at 50 per batch to keep the page snappy; no CSV/TSV export
  (copy-paste covers it).
- Case conversion and braces are pure string transforms — UUID semantics
  are case-insensitive, so uppercase is safe for manifests.

## 4. Browser compatibility

- Requires `crypto.randomUUID()` (Chrome 92+, Edge 92+, Firefox 95+,
  Safari 15.4+) or `crypto.getRandomValues` (all modern browsers) for the
  fallback path; ES modules. No other APIs.
- `tg-copy-button` clipboard API with `execCommand` fallback.
- Works fully offline once page assets are cached.

## 5. Maintenance requirements

- None time-bound. If a future format option is added (e.g. GUID variant
  "urn:uuid:" prefix), keep it a pure string transform.
- The catalog row (`tools.json`) holds SEO metadata; keep the page's
  title/description/FAQ in sync (schema-drift rule, SEO.md).

## 6. Trade-offs

- **Inline generation in the tool file** (chosen) over a shared `uuid`
  module: the Manifest Generator already carries its own copy, and the
  function is 15 lines. A shared module would be the first consolidation
  step if a third consumer appears.
- **`<pre>` output + copy-all** (chosen) over per-UUID copy buttons:
  batch workflows copy everything at once. Cost: no per-line copy.

## 7. Future improvements

- Persist the last-used options (deferred until storage on tool pages is
  reviewed for consistency).
- Export batch as a `.txt` file (Blob download, matching the generator's
  pattern).

## 8. Verified references

- `crypto.randomUUID()` support table (MDN) — 2026-08-06.
- RFC 4122 version 4 bit layout (variant/version bits) — 2026-08-06.