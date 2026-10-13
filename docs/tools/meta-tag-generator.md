# Feature doc — Meta Tag Generator

Page: `tools/meta-tag-generator/index.html`
Logic: `assets/js/tools/meta-tag-generator.js` over `assets/js/validate/web-tags.js`
Data: none · Catalog id: `meta-tag-generator` (category `web`) · Status: **live**

---

## 1. Why it exists

Every new page needs a title, description, canonical, Open Graph, and Twitter
card block — and getting the escaping and `og:`/`twitter:` split right by hand
is tedious. A form that emits the whole `<head>` block, with a preview, is a
classic SEO-crowd tool (ROADMAP Phase 3).

## 2. How it works

1. One form: page title, description, canonical URL, site name, image URL,
   and type. Everything updates live and is also written to a generated block.
2. `web-tags.js` `buildMetaTags` returns the lines: `title`, `description`,
   `robots`, `canonical`, the six Open Graph tags (`og:type`, `og:title`,
   `og:description`, `og:url`, `og:site_name`, `og:image`), and `twitter:card`.
   Values are HTML-escaped with `escapeHtml` so `&`, `<`, `"` can't break the
   emitted markup.
3. A small card preview renders the title/description/site name; the full
   block lands in a `<pre>` for one-click copy via `<tg-copy-button>`.
4. Canonical, og:url, and twitter links default to a placeholder domain —
   consistent with the site's `mukund-buddy.github.io/AntigleKit` pre-launch convention.

## 3. Limitations

- Emits HTML5 meta tags only; no JSON-LD (that's the page's own script).
- `og:image` is assumed absolute; relative URLs are copied as typed.

## 4. Browser compatibility

- Pure string building + DOM; ES modules; offline-safe.

## 5. Maintenance requirements

- If the site's canonical domain changes, only the page copy + placeholder
  defaults change — the generator itself stays domain-agnostic.

## 6. Trade-offs

- **Pre-defined tag set** (chosen) over a free-form tag builder: every
  emitted tag is one the page actually validates (6 required OG).
- **Escape, then copy** (chosen) over raw strings.

## 7. Future improvements

- Open Graph type presets (article/product) and `og:image` dimension fields.

## 8. Verified references

- Open Graph protocol required tags (ogp.me) — 2026-08-06.
- Twitter Card summary spec (developer.x.com) — 2026-08-06.