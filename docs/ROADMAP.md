# ROADMAP.md — Approved build plan

The platform is additive: each tool = `tools/<slug>/index.html` +
`assets/js/tools/<slug>.js` + one row in `tools.json`; live tools are also
hand-written into the catalog HTML for SEO. Build order lives in
`assets/data/tools.json` (priority = `sortOrder`), not in this file.

---

## Rule first: tool acceptance

Before any tool is approved, all six questions must be answered "yes"
(ARCHITECTURE.md §17). Anything else goes to `status: "backlog"`. Never ship
a tool that fails the rule just to grow the catalog.

---

## Phase 1 (current) — Platform + Manifest Generator

- [x] Architecture & docs
- [x] Catalog JSON (approved plan + backlog), presets JSON
- [x] Home, about, tools, privacy, manifest tool, 404, headers, redirects, sitemap
- [x] Manifest Generator (format_version 2, pack types, optional script module,
      copy/download, validation)
- [x] Site search (filter over catalog; backlog excluded)
- [ ] Final Lighthouse / Rich Results / W3C pass before going public

## Phase 2 — Minecraft batch (approved, next)

1. [x] Manifest Validator — reuses validation rules from the generator
      (`manifest-rules.js`; paste/upload + live field-level results).
2. [x] Identifier Validator — namespace/identifier character rules
      (`identifier-rules.js`; batch list validation).
3. [x] Pack Structure Checker — folder-layout checklist + embedded manifest
      checks (dependency-free ZIP parser in `zip-parse.js`,
      DecompressionStream deflate).
4. [x] Pack Version Generator — version bumping with sanity checks
      (`version-rules.js`; bump + consistency views).
5. [x] UUID Generator (listed under Web; ships here too) — v4 IDs for pack
      UUIDs (batch, case/format/braces options).

## Phase 3 — Core web & JSON batch (shipped along Phase 5 of the 2026 build)

1. [x] JSON Formatter — pretty/indent/minify with line-accurate errors
      (`json-tools.js`; V8's modern parse messages handled via
      `parseErrorPosition`).
2. [x] JSON Validator — parse check with line/column + snippet.
3. [x] Base64 Encode/Decode — Unicode-safe round trips, bad-input
      rejection (`base64-tools.js`).
4. [x] URL Encoder / URL Decoder — percent-encoding with double-encode
      detection and bad-escape flags (`urls.js`).
5. [x] Slug Generator — title → slug conversion, UTF-8 aware.
6. [x] Regex Tester — live highlight, flags, compile errors, 2000-mark cap.
7. [x] Meta Tag Generator — title/description/canonical/OG/Twitter block
   (`web-tags.js`).
8. [x] Open Graph Generator — six required tags + card preview.
9. [x] robots.txt Generator — groups, allow/disallow, sitemap line.
10. [x] sitemap.xml Generator — XML entries + platform rename.
11. [x] CSS Gradient Generator — linear/radial + up to 3 stops (`css-generators.js`).
12. [x] CSS Shadow Generator — offset/blur/spread/color/inset presets.
13. [x] Flexbox Generator — direction/justify/align/wrap/gap live stage.
14. [x] Grid Generator — column count/gap live preview.

## Phase 4 — YouTube batch (shipped 2026-08-06)

1. [x] Thumbnail Fetcher — five sizes from any link; missing sizes
      detected via real `naturalWidth` probes (`youtube.js`).
2. [x] Thumbnail Downloader — size tabs + verified real resolution +
      one-tap fetch/blob download (i.ytimg.com now sends CORS headers);
      updated 2026-08-08 with mobile support.
3. [x] Timestamp Generator — durations → absolute timestamps
      (`buildChaptersFromDurations` in `chapters.js`).
4. [x] Chapter Formatter — messy notes → `00:00`-normalized lines with
      YouTube rule checks (0:00 start, ≥ 3 chapters, ≥ 10 s).
5. [x] Description Formatter — body + chapters + links blocks with
      live 5,000-character count (`YT_LIMITS.description`). Shipped at
      slug `description-generator` (catalog slug wins over the ROADMAP
      name).
6. [x] Title Length Checker — 100-char limit, emoji warning, ~70-char
      truncation preview.
7. [x] Hashtag Formatter — CamelCase normalization, dedupe, counts,
      60-tag guard (`hashtags.js`).

## Phase 4.1 — Polish & bug reporting (shipped 2026-08-06)

1. [x] Bug report system: "Report a bug" link in every footer → overlay
      → mailto to the site contact address (obfuscated at runtime) (page + browser + steps
      pre-filled) with a Copy-details fallback. No backend needed.
2. [x] Thumbnail tools: technical size keys replaced with friendly
      quality labels (Best · up to 1080p / 480p / 360p / 180p / 144p)
      in the UI; technical names kept in SEO copy.
3. [x] Samples switched to real YouTube videos
      (watch?v=kpdVvvglzSo etc.) instead of generic links; hero demo
      pre-fills with the channel video.
4. [x] Timestamp Generator UX fixes: warning state now amber (not
      green), cleaner wording, and pasting existing timestamps (e.g.
      "0:30 Intro") now explains the tool expects durations and links
      to the Chapter Formatter.

## Phase 4.2 — Polish round 2: themes + downloader upgrade (shipped 2026-08-08)

1. [x] Light theme with toggle (dark stays the untouched source of truth):
      `data-theme="light"` token overrides in `app.css`, `theme-init.js`
      (anti-flash, localStorage `af-theme`, prefers-color-scheme fallback),
      `theme.js` (toggle wiring, `themeColorMeta` sync, 420 ms cross-fade
      that respects reduced-motion). Desktop + mobile toggles in
      `templates/nav.html` (canonical; copied to every page; 404.html gets
      scripts only, no toggles).
2. [x] Thumbnail Downloader download filename → `notgamingplayz-thumbnail-downloader-<size>.jpg`
      (branded; was `videoId-<size>.jpg`).
3. [x] Thumbnail Downloader presentation: text rows → thumbnail cards with
      real previews, resolution badges, "Best quality" marker (promotes to
      first available size when maxres is missing), missing-size overlay,
      per-card Download / Open / Copy URL, and the video title via YouTube
      `oEmbed` (CSP: added `https://www.youtube.com` to `connect-src`).

## Phase 5 — Student, Design, Security, File batches

Student: MCQ (rule-based only) · Study Planner · Revision Planner ·
Attendance · Percentage · CGPA · Reading Time · Word Counter · Character Counter.
Design: Color Palette · Glassmorphism · Contrast Checker · Border Radius ·
SVG Optimizer · Favicon.
Security: Password Generator · Password Strength · SHA-256 · QR Generate/Scan.
File: CSV↔JSON · YAML→JSON · XML Formatter · Markdown Preview · Diff Checker.

> Business batch (GST · ROI · Profit · Margin · EMI · Invoice · Quotation) was
> dropped from the plan on 2026-08-07 — removed from the catalog and the build
> plan; not in the roadmap anymore.

### Phase 5a — Student core 6 (shipped 2026-08-06)

Chose "Core 6 first" out of the Student list: Percentage, CGPA, Attendance,
Reading Time, Word Counter, Character Counter. Exam-builders (MCQ, Study
Planner, Revision Planner) wait for the rule-based approval pass.

1. [x] Percentage Calculator — four modes (of / what-percent / change /
      difference) over `assets/js/validate/student-tools.js`
      (`percentageOf`, `valueOfPercent`, `percentChange`, `percentDifference`).
2. [x] CGPA Calculator — credit-weighted: parses "grade credits" lines
      (`cgpaFromRows`, `cgpaFromText`); invalid grades surface per
      line-ignored, not byte-silent.
3. [x] Attendance Calculator — `attendanceBreakdown` gives pct + target to
      stay ≥ threshold, with the soft-unreachable honesty messaging when even
      attending everything can't save a category.
4. [x] Reading Time Calculator — `readingTimeMinutes = words / wpm`; speeds
      (200/150/130/240) in `SPEEDS`; <1 min rendered as seconds.
5. [x] Word Counter — `countWords` / `countSentences` / `countParagraphs` /
      `countChars`; reading time = words ÷ SPEEDS.reading.
6. [x] Character Counter — chars with/without spaces + limit checks
      (`CHAR_LIMITS`: sms 160, tweet 280, bio 60, meta 160, title 100),
      ✓/✗ per limit and "fits n of m" summary.

All six: `assets/js/validate/student-tools.js` is pure and node-tested;
tool JS drives UI via CSSOM only (no inline `style=` — CSP keeps
`style-src 'self'`).

## Phase 5b — Design batch (shipped 2026-08-07)

1. [x] Color Palette Generator — monochromatic/analogous/complementary/
      split/triadic/tetradic/shades from one seed (hex → HSL → hex). Shipped
      with a fix for the default-mode infinite-loop (`MODE_OFFSETS`)
      discovered during the verification pass.
2. [x] Glassmorphism Generator — frosted panel preview via CSSOM
      (backdrop-filter + rgba), presets; `#`-prefix ID bug fixed on ship.
3. [x] Contrast Checker — WCAG 2.1 ratio + AA/AAA, large-text toggle, swap.
4. [x] Border Radius Generator — 4-corner sliders + uniform + `%`/`px`.
5. [x] SVG Optimizer — strips comments + whitespace, no parser deps.
6. [x] Favicon Generator — glyph over color → PNG at 6 standard sizes
      (16/32/48/180/192/512) via Canvas + Blob, client-side only.

All six live rows flipped in `tools.json`; Design group added on `/tools/`;
sitemap + `main.js` fallback updated (44 URLs, 40 live rows).
Logic in `assets/js/validate/design-tools.js` — pure and node-tested
(`test-design.mjs`, regression tests added for the monochromatic fix and
the `$('gl…')` selector conventions).

## Phase 5c — Plan additions (2026-08-07)

New planned rows added to the "Coming next" list, all CSP-safe / browser-only:
Case Converter, Lorem Ipsum Generator, HTML Minifier, CSS Minifier,
Random Number Generator (Web Dev), Study Timer (Student), List Sorter
(File Tools). Totals after Phase 5b+5c: **40 live / 20 planned / 14 backlog**
(74 catalog rows; 60 approved).

## Backlog — NOT scheduled (architecture-ready only)

Minecraft skin preview/converter, geometry, animation, entity, loot table,
recipe, block and item generators, plus optional AI tools (BYOK). These have
catalog rows (`status: "backlog"`) so the architecture stays ready, but they
are excluded from the tools page and from search until re-approved.

## Phase 6 — Growth engineering

- Cloudflare Web Analytics on (adds CSP entries — see ARCHITECTURE §15.5).
- Ad integration into reserved `ad-slot` containers (AdSense suggested).
- If catalog exceeds ~20 pages: add a tiny build script to push `tools.json`
  into `sitemap.xml` (single-purpose, still no framework).

## Phase 6.1 — Bug bounty (FINAL phase, run against the live site)

Attacker's-eye audit of the **deployed/live** website only, done at the **very
end** when every tool and page is ready. This is a deliberate ordering change:
no bug-hunting mid-build (the 2026-08-07 run happened too early and is parked
in SECURITY.md; a fresh live-site hunt supersedes it). Standing rule: after
the final live deploy, re-run the SECURITY.md "audit findings" checklist and
hunt for loopholes before going further.

1. [x] Zip-bomb hardening — `MAX_DECOMPRESSED` cap in `zip-parse.js` +
      streaming inflate guard in Pack Structure Checker (High, fixed).
2. [x] `tg-tool-card` href attribute-escaped (`_escAttr`) for poisoned-JSON
      hardening (MED, fixed).
3. [ ] [REQ 2026-08-07] Re-run the whole audit against the live site at the
      very end of the plan (all phases shipped) — do not run it before.
4. [ ] CSP `<meta>` fallback so the header perimeter isn't the only one —
      notify the plan in SECURITY.md; stage Report-Only before enforcing.
5. [x] Verified-safe baseline re-checked: no eval/Function/document.write,
      no inline handlers, all output textContent/escaped, thumbnails and
      mailto fully validated, no secrets in repo.

## Adding a new tool — runbook

1. Run the tool acceptance rule (ARCHITECTURE.md §17). Failed → backlog row.
2. `docs/DATA.md`: confirm the catalog contract covers the tool.
3. Verify any real-world formats against official docs (learn.microsoft.com
   for Minecraft, caniuse for browser APIs). Write the finding in the tool's
   per-feature doc.
4. Create `tools/<slug>/index.html` (copy chrome from an existing tool page;
   update title/description/canonical/JSON-LD/FAQ).
5. Create `assets/js/tools/<slug>.js`; reuse components.
6. Set the catalog row to `status: "live"` and fix `sortOrder`.
7. Add `<url>` to `sitemap.xml`; re-run the SEO.md static checklist.
8. Static-check, review pass, then ship.

## Explicit non-goals (until business hires server capacity)

Service worker/PWA, comments, accounts, server-side anything, payment
processing, on-site login, AI features. The static contract means Cloudflare
Pages stays the only "server".