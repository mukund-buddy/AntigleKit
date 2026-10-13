# Feature doc — Manifest Validator

Page: `tools/manifest-validator/index.html`
Logic: `assets/js/tools/manifest-validator.js` + `assets/js/validate/manifest-rules.js`
Data: none (rules are code) · Catalog id: `manifest-validator` · Status: **live**

---

## 1. Why it exists

Most broken Bedrock packs fail at the manifest: a malformed UUID, a missing
`min_engine_version`, or a stray typo field that Minecraft silently ignores.
The generator (Phase 1) eliminates those errors for new packs, but thousands of
existing packs on MCPEDL and GitHub need a quick check. Validating a pasted or
uploaded `manifest.json` against the verified schema rules (ARCHITECTURE.md
§2.1) turns an opaque "game won't import it" into a concrete, field-level fix
list. It is also the natural second step for users of the Manifest Generator.

## 2. How it works

All processing is client-side in the browser:

1. The user pastes JSON into a textarea or uploads a `.json` file (FileReader,
   text only). A "Load sample" button inserts a known-valid resource-pack
   manifest so the results view is immediately demonstrable.
2. Input is `JSON.parse`d; syntax errors get a single clear message.
3. `manifest-rules.js` (pure module, no DOM/network) walks the object and emits
   `{ severity: 'error'|'warning', path, message }` issues:
   - Errors: missing/non-object `header`; missing `format_version`, `name`,
     `description`; malformed UUIDs (8-4-4-4-12 hex, case-insensitive);
     non-3-integer version arrays (0–255); missing/empty `modules`;
     unknown module types; duplicate module UUIDs (including the pack UUID);
     missing `min_engine_version` for resource/behavior packs; invalid
     `pack_scope`; script modules without `language: "javascript"` or a `.js`
     `entry`; malformed `dependencies` (module_name or uuid + version);
     `capabilities` not an array of strings; malformed `metadata`/`subpacks`.
   - Warnings: unknown top-level/header/module/metadata keys (typo catchers);
     `format_version` 3 (preview-only, semver strings expected); format 1
     without `skin_pack` (and vice versa); world-template-only fields on
     non-world-template manifests; name > 80 or description > 120 chars;
     subpacks missing `memory_tier`.
4. Results render via DOM APIs + `textContent` only (CSP-safe): a summary bar
   (valid / error+warning counts), a detected-format line, and a list of
   findings with severity chips and the exact field path.

## 3. Limitations

- Structural + verified-rule validation only. Minecraft also applies
  version-specific semantic rules (e.g. specific `min_engine_version`
  combinations, Script API version availability) that can drift with releases.
- The `capabilities` token list is deliberately NOT enforced — the exact token
  table is still unverified (ARCHITECTURE §7 unknowns) — only the array-of-
  strings shape is checked.
- No auto-fix: the tool reports, it does not rewrite the user's manifest.
- Format-3 manifests are warned about but not deeply validated (preview).

## 4. Browser compatibility

- Requires `JSON.parse`, `FileReader` (universal), and ES modules (Chrome 61+,
  Firefox 60+, Safari 11+). No other APIs.
- Works fully offline once page assets are cached.
- `manifest-rules.js` is also importable from Node for regression tests.

## 5. Maintenance requirements

- Any change to the verified schema table in ARCHITECTURE.md §2.1 must be
  mirrored here (and in the generator) — they share the same rules.
- `format_version` 3 validation should be upgraded once it leaves preview and
  the string-version semantics are verified.
- The catalog row (`tools.json`) holds SEO metadata; keep the page's
  title/description/FAQ in sync with it (schema-drift rule, SEO.md).

## 6. Trade-offs

- **Live-as-you-type validation** (chosen) over a submit button: fewer clicks,
  instant feedback. Cost: a debounce timer (~250 ms) and one extra state
  (empty input) to manage — acceptable.
- **Paste + upload + sample** (chosen): three entry paths cover desktop users
  and mobile users without file managers. Cost: slightly more UI.
- **No auto-fix** (chosen): rewriting user JSON risks corrupting intent.
  Fixing is the generator's job.

## 7. Future improvements

- Upgrade `format_version` 3 validation when it leaves preview.
- Add a shared "checklist" line listing which checks were run.
- Optional: show the normalized/pretty-printed manifest after a valid result.

## 8. Verified references

- Minecraft pack manifest reference (Microsoft Learn) — ARCHITECTURE.md §2.1.
- Bedrock identifier rules for the upcoming Identifier Validator (learn.
  microsoft.com + bedrock.dev), recorded 2026-08-06.
