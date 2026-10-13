# Feature doc — Manifest Generator

Page: `tools/manifest-generator/index.html`
Logic: `assets/js/tools/manifest-generator.js`
Data: `assets/data/manifest-presets.json` · Catalog id: `manifest-generator` · Status: **live**

---

## 1. Why it exists

Making a Bedrock add-on requires a correct `manifest.json`, and the schema is
easy to get slightly wrong (UUIDs, integer version arrays, `min_engine_version`,
module `uuid` uniqueness). This generator produces a valid manifest in seconds
so creators spend their time on the pack, not the boilerplate. It was chosen as
the first tool because the existing audience is Minecraft Bedrock players and
because "manifest generator" is a high-intent, long-tail SEO query.

## 2. How it works

All processing is client-side in the browser:

1. The user picks pack types (resource / behavior / world template), fills in
   name, description, version + `min_engine_version`, optionally adds a script
   module and capabilities.
2. `manifest-generator.js` builds output strictly per the verified schema rules
   (see ARCHITECTURE.md §2.1): `format_version: 2`, integer version arrays,
   distinct module UUIDs, required `min_engine_version` for resource/behavior
   packs, `pack_scope` for resource packs, `language: "javascript"` + `entry`
   for script modules.
3. UUIDs come from `crypto.randomUUID()` (or a fallback for browsers without
   it); the "New UUIDs" button regenerates them.
4. Output is shown in a read-only `<tg-json-view>` (syntax-coloured), with
   copy and download via `<tg-copy-button>` / a Blob download.
5. Client-side validation reports field errors inline (`aria-invalid`); there
   is no server call at any point.

## 3. Limitations

- Emits `format_version: 2` only. Version-3 (semver string) manifests are not
  produced — they are preview-only upstream (see ARCHITECTURE.md §2.1).
- Skin-pack (format 1) manifests are not generated.
- `capabilities` are exposed as free-form checkboxes with documented defaults,
  not an exhaustive schema table (token list not fully re-verified — see
  ARCHITECTURE unknowns).
- Validation checks structure, not every Minecraft-mandated semantic rule (an
  unknown module type will not be produced, but some version-specific rules
  could drift as the game updates).

## 4. Browser compatibility

- Requires `crypto.randomUUID()` (Chrome 92+, Edge 92+, Firefox 95+, Safari 15.4+),
  `navigator.clipboard` for the direct copy button (falls back to
  `execCommand('copy')`), and `URL.createObjectURL` for download.
- Works fully offline when the page assets are cached (no external requests for
  the tool logic itself; fonts are fetched from Google Fonts).
- Tested in Chromium (Playwright) on desktop and mobile viewports.

## 5. Maintenance requirements

- `manifest-presets.json` values are **time-bound**: `min_engine_version` and
  `@minecraft/server` versions must be re-verified on each Minecraft release.
- The `capabilities` checkbox list is documentation-driven; verify against
  learn.microsoft.com before editing.
- The catalog row (`tools.json`) holds the tool's SEO metadata; keep the page's
  title/description/FAQ in sync with it (schema-drift rule, SEO.md).

## 6. Trade-offs

- **Static MPA + client JS** (chosen): every page ships full HTML for crawling;
  the interactive generator is progressive enhancement. Cost: the generator
  logic cannot work without JS — acceptable for a tool page.
- **No version-3 output** (chosen): we prefer emitting something verifiably
  valid today over preview syntax that could change. Cost: forward-looking users
  must convert manually.
- **BYOK AI generation was rejected** for this tool: the brief requires tools to
  work with no AI, no keys, no external calls.

## 7. Future improvements

- Verify the full `capabilities` token table and make them a curated select.
- Add combined resource+behavior packs (two modules in one manifest).
- Add a "load existing manifest" validator view (feeds the Manifest Validator
  tool in Phase 2).
- Generate `format_version: 3` (string versions) once it leaves preview and is
  verified against official docs.

## 8. Verified references

- Minecraft pack manifest reference (Microsoft Learn) — see ARCHITECTURE.md §2.1.
- CORS / schema verification recorded in ARCHITECTURE.md §2 (2026-08-06).