# SEO.md — Search optimization plan & release checklist

Strategy decisions are in ARCHITECTURE.md §3 (MPA) and §11. This file is the
operational layer.

## Principles (from verified 2026 research)

1. **Content must exist in raw HTML.** No tool page's core text, headings,
   or internal links may be injected by JS. JS enhances, never creates,
   crawlable content.
2. **One `<h1>` per page**, strict heading hierarchy (no skipped levels).
3. **Unique title + meta description per page.** Format, tool pages:
   `<Tool Name> — Free Minecraft Bedrock Generator | AntigleKit`.
4. **JSON-LD matches visible content exactly** (schema-drift rule —
   Google revokes rich results on drift).
5. **Core Web Vitals are ranking signals.** LCP ≤ 2.5s, INP ≤ 200ms,
   CLS ≤ 0.1. Our stack (no framework, tiny JS, reserved ad space) is
   designed for this.
6. **`/robots.txt` must not block assets** (CSS/JS/image dirs stay allowed).
7. **Every page ≤ 2 clicks from home**; descriptive anchor text; breadcrumbs
   on tool pages (markup + BreadcrumbList schema).

## Page schema plan

| Page | JSON-LD types |
|---|---|
| Home | `Organization` + `WebSite` |
| About | `Organization` (with `sameAs` when socials finalized) |
| `/tools/` | `CollectionPage` + `BreadcrumbList` |
| Tool page | `BreadcrumbList` + `SoftwareApplication` + `FAQPage` |
| 404 | none |

FAQ JSON-LD is authored to match the visible FAQ `<details>`/heading pairs.
If copy changes, change both — the test below catches drift on tool pages.

## Validation runs (each release)

1. `node` snippet validating `assets/data/*.json` parse (run via
   `node -e`).
2. grep for `YOUR-DOMAIN` in the repo root — must be zero before prod.
3. W3C HTML validator on each page.
4. JSON-LD: Google Rich Results Test on home, `/tools/`, and a tool page.
5. Lighthouse (desktop + mobile): Performance/Accessibility/SEO/
   Best-Practices ≥ 95.
6. Content check: one `<h1>`, meta present, canonical present, all
   internal links 200, sitemap.xml URLs 200.

## Known/expected SEO trade-offs

- Client-side-only tool interactivity is index-proof only because the
  generating *content* (description, guide, FAQ) is static HTML. Do not
  rely on the generated JSON being indexed.
- No blog in MVP ⇒ slower topical authority growth; articles are Phase 4
  (target: long-tail keywords around each tool).

## Sitemap maintenance

`sitemap.xml` is hand-synced with `assets/data/tools.json`. Every tool
addition: append `<url>` block. When catalog ~28 entries: automate (ROADMAP
Phase 5).