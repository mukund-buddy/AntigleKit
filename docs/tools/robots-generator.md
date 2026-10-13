# Feature doc — robots.txt Generator

Page: `tools/robots-generator/index.html`
Logic: `assets/js/tools/robots-generator.js` over `assets/js/validate/web-tags.js`
Data: none · Catalog id: `robots-generator` (category `web`) · Status: **live**

---

## 1. Why it exists

Every site ships a `robots.txt`, and the syntax (user-agent groups, allow vs
disallow, sitemap line) is easy to get subtly wrong. A form that assembles
the file from plain-language answers — block whole areas, block specific
paths, allow exceptions — is quick, low-maintenance, and SEO-relevant
(ROADMAP Phase 3).

## 2. How it works

1. Controls: add/remove user-agent groups (`*` or a named agent), add
   disallow paths and allow exceptions per group, plus an optional `Sitemap:`
   line.
2. `web-tags.js` `buildRobots` assembles the text: `User-agent:` lines,
   `Disallow:`/`Allow:` lines (in the order entered), blank lines between
   groups, and the sitemap URL last.
3. Output is one `<pre>`; empty fields are skipped, and the status line shows
   the group count. Copy via `<tg-copy-button>`.
4. Validation is per-line (paths should start with `/`) and shown as a hint,
   not an error — the file spec is forgiving.

## 3. Limitations

- Comments and `Crawl-delay` are not generated (non-standard/legacy).
- The sitemap line is a single entry; multiple sitemaps require a second
  line (covered by the page's FAQ note).

## 4. Browser compatibility

- Pure string assembly; ES modules; offline-safe.

## 5. Maintenance requirements

- None time-bound. The RFC 9309 "Allow wins over Disallow" note is copy, not
  logic.

## 6. Trade-offs

- **Group-by-group editor** (chosen) over a free textarea: structure is
  enforced, ordering kept.
- **Full file output** (chosen) over per-group fragments: one copy covers
  deployment.

## 7. Future improvements

- Multiple sitemap URLs field; named-bot presets (Googlebot, Bingbot).

## 8. Verified references

- RFC 9309 robots.txt spec — 2026-08-06.