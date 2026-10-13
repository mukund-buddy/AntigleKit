# Feature doc — Pack Version Generator

Page: `tools/pack-version-generator/index.html`
Logic: `assets/js/tools/pack-version-generator.js` + `assets/js/validate/version-rules.js`
Data: none (rules are code) · Catalog id: `pack-version-generator` · Status: **live**

---

## 1. Why it exists

Versioning mistakes are a silent killer for Bedrock packs: bump only
`header.version` and the module versions drift; forget to bump at all and
Minecraft treats the new file as an "identical pack" and keeps the old one;
hit 255 on a part and the manifest stops parsing. This tool gives a correct
next version in one click and a consistency check for the whole manifest, so
updates actually reach players.

## 2. How it works

All processing is client-side in the browser. Two views on one page:

1. **Bump view** — the user enters the current `[major, minor, patch]` and
   picks a bump type (patch/minor/major). `version-rules.js` increments the
   right part, caps at 255 (error + rollover advice when exceeded), and shows
   sanity notes (all-zero versions, pre-1.0 packs). The result renders as
   `[1, 0, 1]` with a `<tg-copy-button>`.
2. **Consistency view** — a textarea accepts labeled versions, one per line
   (`header = 1.0.0`, `modules[0] (resources): [1, 2, 0]`, or bare `1.0.0`).
   `analyzeVersions()` parses each line (dotted or bracket syntax), reports
   unparsable lines as errors, warns when versions differ across the pack
   (header vs modules should be equal), flags the same label carrying
   conflicting versions, and exempts lines whose label contains "engine"
   (`min_engine_version` style) from the equality rule. The summary shows the
   highest pack version, which is the recommended bump target.

## 3. Limitations

- Version *format* rules only (3 integers, 0–255). It does not know your
  actual release history or Mojang's schema evolution.
- The "keep header and modules equal" rule is convention, not an enforced
  Minecraft rule — it is a warning, never an error.
- Label parsing expects the label to precede `=` or `:`; exotic formats
  (e.g. `version: 1.0.0-beta`) error out by design (Bedrock has no
  prerelease syntax in format_version 2).

## 4. Browser compatibility

- Uses only `Number` parsing, `RegExp`, ES modules (Chrome 61+, Firefox 60+,
  Safari 11+). No special APIs.
- `tg-copy-button` reuses the existing component (clipboard API with
  `execCommand` fallback).
- `version-rules.js` is importable from Node for regression tests.

## 5. Maintenance requirements

- If format_version 3 (semver strings) leaves preview, add a string-mode
  toggle + semver validation — update ARCHITECTURE.md §2.1 first.
- Keep bump semantics aligned with the generator's version fields
  (`header.version` + `modules[].version` must stay equal).
- The catalog row (`tools.json`) holds SEO metadata; keep the page's
  title/description/FAQ in sync (schema-drift rule, SEO.md).

## 6. Trade-offs

- **Two views on one page** (chosen) over a separate "check" tool: version
  decisions and verification belong together for the creator workflow.
  Cost: a longer page — acceptable, it stays one crawlable unit.
- **Manual labeled lines** (chosen) over parsing a full manifest paste:
  the user often checks versions *before* the manifest exists. Cost: users
  must write labels; bare versions are still accepted.
- **No storage** (chosen): the check stays stateless like every other tool.

## 7. Future improvements

- "Bump everything" — feed the labeled list back into the bump view to
  produce an updated manifest snippet.
- Accept a full manifest.json paste and extract the version fields
  automatically (reusing manifest-rules.js).

## 8. Verified references

- Bedrock manifest version rules (integer arrays, 0–255) — ARCHITECTURE.md
  §2.1, verified 2026-08-06.