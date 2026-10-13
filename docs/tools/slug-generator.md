# Feature doc — Slug Generator

Page: `tools/slug-generator/index.html`
Logic: `assets/js/tools/slug-generator.js` over `assets/js/validate/urls.js`
Data: none · Catalog id: `slug-generator` (category `web`) · Status: **live**

---

## 1. Why it exists

Blog posts, listings, and file names all need URL-safe slugs, and titles
rarely arrive slug-ready ("Café Déjà Vu: Launching 2026!"). Converting titles
to clean slugs, with an option for underscores, is a compact high-traffic
developer/SEO tool (ROADMAP Phase 3).

## 2. How it works

1. Type a title; the slug updates live. Separator choice (dash vs underscore)
   is a control; the output is a single `<pre>`.
2. `urls.js` `slugify`: lowercases, strips diacritics (`é` → `e` via
   `normalize('NFD')`), removes punctuation/emoji, collapses whitespace and
   repeated separators, and trims the separator ends.
3. Numbers survive (the "2026" in the sample); the detected summary shows
   character count and what was removed.

## 3. Limitations

- Latin-script oriented: CJK/emoji are dropped, not transliterated (no
  library). Unicode letters with NFD decompositions survive as ASCII.
- No stopword removal or word separators beyond dash/underscore — those are
  editorial choices, out of scope.

## 4. Browser compatibility

- `String.prototype.normalize` (ES6) — all modern browsers; ES modules;
  offline-safe.

## 5. Maintenance requirements

- None; `slugify` is a pure function in `urls.js` (node-testable).

## 6. Trade-offs

- **Drop non-ASCII after NFD** (chosen) over leaving raw Unicode (safe for
  URLs but surprising) — documented in the page copy.
- **Live re-render** (chosen) over a "generate" button; matches the suite.

## 7. Future improvements

- Max-length cap (e.g. 60 chars) with suffix option for SEO usage.

## 8. Verified references

- Unicode normalization (MDN) — 2026-08-06.