# Feature doc — Hashtag Formatter

Page: `tools/hashtag-formatter/index.html`
Logic: `assets/js/tools/hashtag-formatter.js` + `assets/js/validate/hashtags.js`
Data: none · Catalog id: `hashtag-formatter` · Status: **live**

---

## 1. Why it exists

Hashtag text arrives in every possible shape — `#minecraft builds`, commas,
newlines, duplicates, junk symbols. YouTube's conventions (no spaces;
CamelCase; only the first three tags display above the title; very large
lists can get tags ignored entirely) are easy to trip over silently. A
normalizer with counts and honest issue reporting makes the tag block a
one-paste operation.

## 2. How it works

1. `splitTagTokens` splits on commas, semicolons, and newlines; a `#` inside
   a chunk starts a new tag; spaces within a chunk form one multi-word tag.
2. `normalizeHashtag` CamelCases each tag (`minecraft builds` →
   `#MinecraftBuilds`), keeps letters/digits/underscores, and drops
   unreadable tokens to `issues` as `unreadable` — reported, never silent.
3. Duplicates are removed (`duplicate` issues) — first occurrence wins.
4. Output: tag chips, tag count, character count **with** `#` included,
   an inline copy line, and a summary that states how many tags can appear
   above the title (3) and warns when the list exceeds 60 tags.

## 3. Limitations

- No social-network cross-checks; conventions verified are YouTube's.
- Non-Latin scripts pass through (letters are kept), but CamelCasing is
  tuned for Latin text.
- The "60 tags" warning is YouTube's documented behaviour (tags may be
  ignored above that), not a hard API error.

## 4. Browser compatibility

- Pure ES module; `textContent`-only rendering. Works offline.

## 5. Maintenance requirements

- Rule logic lives in `validate/hashtags.js` (Node-tested alongside the
  chapters/youtube suites).
- Keep the FAQ aligned with the catalog row (drift rule, SEO.md).

## 6. Trade-offs

- **CamelCase normalization** (chosen): matches YouTube's own display
  convention (`#MinecraftBuilds`) and stays readable; lowercase-only fans
  can edit the output before pasting.
- **Duplicate removal with notice** (chosen) over keeping duplicates:
  dedupe is almost always wanted; the issue row makes it visible.

## 7. Future improvements

- Optional lowercase/underscore output modes.
- Per-tag character budget hints for long tags.

## 8. Verified references

- YouTube Help 6390658 (hashtag rules: no spaces, CamelCase, first-three
  display, 60-tag guidance) — recorded 2026-08-06 in `hashtags.js`.
