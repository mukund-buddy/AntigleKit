# Feature doc — Pack Structure Checker

Page: `tools/pack-structure-checker/index.html`
Logic: `assets/js/tools/pack-structure-checker.js`
Rules: `assets/js/validate/zip-parse.js` (ZIP) + `assets/js/validate/pack-layout.js` (layout)
+ `assets/js/validate/manifest-rules.js` (embedded manifest)
Data: none · Catalog id: `pack-structure-checker` · Status: **live**

---

## 1. Why it exists

Most "it won't import" problems in Bedrock add-ons are layout problems that
the game reports silently: `manifest.json` nested one folder too deep, a
script entry that points at a file that does not exist, or a pack zipped
together with `__MACOSX` cruft. Inspecting a ZIP client-side gives a concrete
answer in seconds. This tool also reuses the Manifest Validator rules on the
embedded manifest, so one drop checks both the file and its contents.

## 2. How it works

All processing is client-side in the browser:

1. The user drops a `.zip`/`.mcpack`/`.mcworld`/`.mcaddon` onto the zone
   (click-to-browse fallback; drag events on the label).
2. `zip-parse.js` parses the ZIP **central directory** directly:
   - EOCD located by scanning backwards (signature + comment-length
     boundary check); ZIP64 flagged as unsupported with a re-zip hint;
   - per-entry: name (UTF-8), method, sizes, local header offset; bounds
     checked against the file size;
   - entry data extraction via the local header: method 0 (stored) is
     sliced; method 8 (deflate) is inflated with
     `DecompressionStream('deflate-raw')`, falling back to `('deflate')`
     for zlib-wrapped streams.
3. `pack-layout.js` then checks:
   - `manifest.json` present at the pack root (case-insensitive lookup;
     different-case name → warning);
   - no entry escapes the root (`../` → error);
   - junk entries (`__MACOSX/`, `.DS_Store`, `Thumbs.db`, AppleDouble `._*`)
     → warning;
   - the embedded manifest is parsed and run through `validateManifest`
     (rules module shared with the Manifest Validator);
   - each `script` module's `entry` must exist in the archive (case
     mismatch → warning, missing → error);
   - expected subfolders per module type (`textures/`, `texts/`, ... for
     resources; `functions/`, `scripts/`, ... for data) → info note when
     none are present;
   - a root-level breakdown (folders + files with counts, capped at 30).
4. `.mcaddon` containers (no root manifest, nested pack archives) are
   detected and reported as an info note.

## 3. Limitations

- Central-directory parsing only; no ZIP64; entries encrypted or with
  non-0/8 methods are reported as unsupported (rare for Bedrock packs).
- Character-set: names are decoded as UTF-8 (spec flag bit 11 respected in
  practice; old CP437 archives decode lossy).
- Layout expectations are conservative: missing `textures/` etc. are
  notes, never errors — minimal valid packs exist without them.
- The zip-slip check covers `../` path segments, not symlinks (ZIPs from
  tools rarely carry them; Bedrock ignores symlinks).

## 4. Browser compatibility

- `DecompressionStream` for deflated entries: Chrome 103+, Firefox 113+,
  Safari 16.4+. Stored entries work everywhere. No fallback library — the
  error message tells the user to re-zip with stored entries or upgrade.
- `File.arrayBuffer()`, `Blob.stream()`, `Response.arrayBuffer()`,
  `TextDecoder` — all baseline in supported browsers.
- `zip-parse.js` / `pack-layout.js` are importable from Node (zlib-based
  inflate) — used for regression tests.

## 5. Maintenance requirements

- Keep `MODULE_FOLDERS` in `pack-layout.js` in sync with any structural
  changes to Bedrock pack conventions (e.g. new top-level folders).
- Junk-file list is conservative; extend when new zip-tool artifacts
  appear in the wild.
- If ZIP64 or new compression methods become relevant for Bedrock packs,
  extend `zip-parse.js` (still no library).

## 6. Trade-offs

- **No ZIP library** (chosen): the format subset needed is small and a
  dependency-free parser keeps the CSP strict and the bundle tiny. Cost:
  ~200 lines of parser code + the ZIP64/CP437 edge cases above.
- **Conservative layout rules** (chosen): avoid false errors for minimal
  packs; the manifest rules carry the hard checks.
- **.mcaddon handled as a note, not expanded** (chosen): unpacking nested
  archives in-browser is possible but adds little; telling the user to
  check each pack separately is clearer.

## 7. Future improvements

- Recursively parse `.mcaddon` inner archives.
- Render a visual folder tree (currently a capped root list).
- Add drag-drop support for the Manifest Validator (shares the parser).

## 8. Verified references

- ZIP APPNOTE (PKWARE) structures: EOCD / central directory / local header
  offsets — 2026-08-06.
- `DecompressionStream('deflate-raw')` support: Chrome 103+, Firefox 113+,
  Safari 16.4+ (caniuse) — 2026-08-06.
- Bedrock pack structure conventions (learn.microsoft.com) — 2026-08-06.