# Feature doc — sitemap.xml Generator

Page: `tools/sitemap-generator/index.html`
Logic: `assets/js/tools/sitemap-generator.js` over `assets/js/validate/web-tags.js`
Data: none · Catalog id: `sitemap-generator` (category `web`) · Status: **live**

---

## 1. Why it exists

Adding a page to your sitemap means writing the same `<url><loc>…` boilerplate
again and again. Feeding a plain list of URLs in and getting valid
`sitemap.xml` entries out — including a check that the output can be renamed
to real `.xml` — is a staple SEO utility (ROADMAP Phase 3).

## 2. How it works

1. Paste one URL per line (or use the 7-URL sample). `lastmod` can be added
   (defaults to "today"), and a base host is used to "complete" relative
   paths.
2. `web-tags.js` `buildSitemap` wraps each URL in `<url><loc>…`
   `<lastmod>`…`</url>`, and `validateXml` runs the assembled string through
   `DOMParser` (or a lightweight stack check) telling the user whether the
   result parses as XML — the tool's "is it really XML?" guarantee.
3. Output is a `<pre>` with the full document including the `urlset` header;
   the detected summary shows entry count. Copy all in one click.

## 3. Limitations

- URLs are expected absolute (or relative + a known host); no per-URL
  priority/changefreq editor (kept to the same value for the batch).
- Max-50k-URL sitemap limit is out of scope for a clipboard-paste tool; there
  is a soft cap to keep the page snappy.

## 4. Browser compatibility

- `DOMParser` for XML validation is universal; ES modules; offline-safe.

## 5. Maintenance requirements

- None; `buildSitemap`/`validateXml` live in `web-tags.js` (node-testable).

## 6. Trade-offs

- **Plain-list input** (chosen): the whole point is *not* building each line.
- **XML validity check** (chosen) over blind output — invalid candidates get
  flagged before you publish.

## 7. Future improvements

- Per-URL lastmod override; image/video sitemap extensions.

## 8. Verified references

- sitemaps.org protocol (URL Set fields) — 2026-08-06.