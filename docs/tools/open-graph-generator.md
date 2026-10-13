# Feature doc — Open Graph Generator

Page: `tools/open-graph-generator/index.html`
Logic: `assets/js/tools/open-graph-generator.js` over `assets/js/validate/web-tags.js`
Data: none · Catalog id: `open-graph-generator` (category `web`) · Status: **live**

---

## 1. Why it exists

The six Open Graph tags decide how a link looks when shared on WhatsApp,
Discord, X, and Facebook — and a missing `og:image` or `og:type` silently
degrades the card. A generator that builds the tags *and previews the card*
closes the loop without a deploy (ROADMAP Phase 3).

## 2. How it works

1. Form: page title, description, canonical URL, site name, image URL. The
   six required OG tags render in a `<pre>` plus `twitter:card` summary.
2. `web-tags.js` `buildOpenGraph` returns the tags (escaped via
   `escapeHtml`); a `completeOgTags` check counts the six required ones so the
   status line can say "6/6 required tags present".
3. The preview block renders a mini social card: image (with onerror fallback
   if the sample URL doesn't resolve — a placeholder-domain image throws
   `ERR_NAME_NOT_RESOLVED`, handled by the error handler showing a fallback),
   title, description, site name.
4. Copy the tag block with one click. No network calls besides the image
   probe.

## 3. Limitations

- The preview mirrors the text layout, not every platform's exact renderer;
  X/Discord resize and crop.
- No `og:image:width/height` (auto-detected from the image when possible).

## 4. Browser compatibility

- Pure DOM + string building; ES modules; offline-safe (image probe excepted).

## 5. Maintenance requirements

- The image onerror path expects `yourdomain.example` placeholders to fail
  gracefully; when the production domain exists, the sample image resolves
  and the fallback message simply stops appearing.

## 6. Trade-offs

- **Escaped, complete tag set** (chosen) over raw copy-paste; safety first.
- **Embedded preview** (chosen) over linking out to debugging tools — private
  and instant.

## 7. Future improvements

- `og:type` presets (article/product/profile) and locale field.

## 8. Verified references

- Open Graph protocol core properties (ogp.me) — 2026-08-06.