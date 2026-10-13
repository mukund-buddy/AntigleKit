# Feature doc — Description Generator

Page: `tools/description-generator/index.html`
Logic: `assets/js/tools/description-generator.js` + `assets/js/validate/chapters.js` + `youtube.js`
Data: none · Catalog id: `description-generator` · Status: **live**

---

## 1. Why it exists

A consistent description (body + timestamps + links/credits) is a small
brand signal and a real discovery lever. Assembling it by hand in YouTube
Studio means re-typing chapter lists and losing formatting every time.
This tool composes the three blocks, normalizes chapters through the same
tested parser as the Chapter Formatter, and counts against the real
5,000-character description limit (`YT_LIMITS.description`).

## 2. How it works

1. **Body** — kept verbatim; runs of 3+ newlines collapse to a paragraph
   break. Empty fields are skipped entirely (no empty blocks in output).
2. **Chapters** — raw notes go through `buildChapters` +
   `formatTimestamp(long)` into a `Timestamps:` block. Chapter-rule errors
   are summarized in the detected line (full detail lives in the Chapter
   Formatter).
3. **Links** — one per line; `Label = URL` and `Label — URL` pairs become
   `Label — URL`; bare URLs pass through. Blocks are separated by blank
   lines.
4. Live count: `n / 5000` with a gradient progress bar that turns red over
   the limit, plus an overage message.

## 3. Limitations

- No URL expansion/shortening (by design — never rewrite user links).
- The `Timestamps:` heading is fixed text; localisation is out of scope.
- Chapter issues are summarized, not listed per-rule (see Chapter
   Formatter for the full checker).

## 4. Browser compatibility

- ES modules + `textContent`; no network. Offline-safe.

## 5. Maintenance requirements

- `YT_LIMITS.description` is the single source for the limit
  (`validate/youtube.js`, verified against YouTube Help).
- Keep the FAQ aligned with the catalog row (drift rule, SEO.md).

## 6. Trade-offs

- **Three dedicated fields** (chosen) over one free-text box: structure
  keeps chapters and links consistent; costs a slightly longer form.
- **Chapter summary only** (chosen): the output panel stays focused on the
  description itself.

## 7. Future improvements

- Optional "remove first three hashtags from description" helper (they
  display above the title anyway).
- Copy-without-chapters toggle.

## 8. Verified references

- YouTube Help: description limit 5,000 characters — verified 2026-08-06,
  recorded in `youtube.js` (`YT_LIMITS`).
- Chapter rules: YouTube Help 9884579 (via `chapters.js`).
