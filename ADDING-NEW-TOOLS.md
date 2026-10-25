# Adding a New Tool to AntigleKit

> The complete, checklist-style guide for registering a new tool so the kit
> stays consistent: catalog, home page counts, the fallback mirror, the
> sitemap and the live site. Follow it in order; every step has a verify
> line. Field-level contracts are documented in [docs/DATA.md](docs/DATA.md).

## Before you start

- The tool must run **fully client-side** — no accounts, no uploads, no
  trackers, and it should produce a usable result in under 30 seconds.
- It must not duplicate an existing tool. Read the catalog
  ([`assets/data/tools.json`](assets/data/tools.json)) first; if your idea
  overlaps, differentiate it clearly (for example: JSON Formatter vs
  JSON Forge — one formats, one is a three-pane workspace).
- Keep names in `lowercase-hyphen` for folders and slugs, Title Case for the
  display name.

## Step 1 — Create the tool folder

Create `tools/<tool-name>/` with at least an `index.html`.

Two supported layouts:

1. **Kit-native** (preferred for new work): `index.html` plus its logic
   module under `assets/js/tools/<tool-name>.js` and styles using the shared
   design system in `assets/css/app.css`.
2. **Self-contained** (how consolidated tools were merged): the folder carries
   its own `app.js`, `style.css` and assets. The page must be served over
   HTTP and work from its final path — use relative paths only.

Verify: `http://localhost:8080/tools/<tool-name>/` renders the tool when the
repo is served (`python -m http.server 8080` or `npx serve .`).

## Step 2 — Register it in the catalog

Add one entry to the `tools` array in
[`assets/data/tools.json`](assets/data/tools.json):

```json
{
  "id": "tool-name",
  "slug": "tool-name",
  "name": "Tool Name",
  "category": "web",
  "categoryLabel": "Web Development",
  "tagline": "One clear sentence on what the tool does.",
  "status": "live",
  "href": "/tools/tool-name/",
  "keywords": ["search", "terms", "users", "would", "type"],
  "related": ["any", "existing", "tool", "ids"],
  "sortOrder": 999
}
```

Rules:

- `id` must equal the folder name and must be unique.
- `category` is an existing key: `minecraft`, `youtube`, `web`, `student`,
  `design`, `security`, `business`, `file`. Add nothing new unless you also
  update every consumer.
- `href` starts with `/tools/` — the runtime converts it for GitHub Pages.
- `sortOrder` must be strictly greater than the current maximum for that
  category (entries render in order).
- `status` is `live` only when the tool genuinely works. Use `planned` or
  `backlog` for roadmap entries (those do not need folders).
- The catalog page, search and related-links all read from this file — that
  is why this step is mandatory.

Verify: `node -e "JSON.parse(require('fs').readFileSync('assets/data/tools.json','utf8'))"`
prints nothing — the JSON is valid.

## Step 3 — Mirror the entry in the fallback

`assets/js/main.js` contains `var FALLBACK_TOOLS = [...]` — the same catalog
as a JavaScript mirror used when the JSON fetch fails. Add one matching
single-line object so the two stay in step:

```js
{ name: "Tool Name", href: "/tools/tool-name/", tagline: "…", categoryLabel: "…", status: "live", keywords: ["…"], sortOrder: 999 },
```

Verify: the count of `name:` entries inside `FALLBACK_TOOLS` equals the count
of `status: "live"` entries in `tools.json`.

## Step 4 — Update the visible tool count

The number of live tools appears as plain text in four places
(search-and-replace the old count, e.g. `56` → `57`):

1. `index.html` — hero badge: `AntigleKit · 56 free browser tools`
2. `index.html` — stats section: `<dt>56</dt>`
3. `index.html` — footer tagline: `56 live tools · zero trackers`
4. `tools/index.html` — noscript note: `The 56 live tools work without it`

Verify: `git grep -n "56 free browser\|56 live tools\|<dt>56</dt>"` shows the
updated spots and no stale old numbers outside tool content.

## Step 5 — Add the page to the sitemap

Append one block to `sitemap.xml` (manual mirror, one block per tool URL):

```xml
  <url>
    <loc>https://mukund-buddy.github.io/AntigleKit/tools/tool-name/</loc>
    <lastmod>YYYY-MM-DD</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
```

Verify: the XML parses (`xmllint sitemap.xml` or load it in a browser).

## Step 6 — Mention it in the README

Add the tool to the correct category table in
[README.md](README.md) (columns: Tool, What it does) and bump the count in
the `## Tools (N live)` heading. Keep the table copy identical in meaning to
the registry `tagline`.

## Step 7 — Test before you push

Serve the repo locally and check:

- [ ] Home page renders; hero badge shows the new count.
- [ ] `/tools/` lists the new tool under the right category; search finds it.
- [ ] The tool page itself works: load it, complete the core action once.
- [ ] Browser console (F12) shows no errors on the home, catalog and tool
      pages.
- [ ] `node -e "JSON.parse(...)"` — JSON valid (see Step 2).
- [ ] `docs/DATA.md` is updated first if you added or changed a field.

## Step 8 — Ship

Push to `main`. GitHub Pages redeploys automatically. Confirm the live page:

`https://mukund-buddy.github.io/AntigleKit/tools/<tool-name>/`

## Consolidating an external tool (special case)

When bringing a tool from a standalone repository into the kit:

- Copy the runtime files only (`index.html`, `app.js`, `style.css`, images) —
  not the old README or LICENSE; the kit root already carries those.
- Rewrite every absolute URL pointing at the old repo (canonical, `og:url`,
  `og:image`) to `https://mukund-buddy.github.io/AntigleKit/tools/<name>/`.
- Register, mirror, count, sitemap and README exactly as Steps 2-6 above.
- Announce the consolidation in the README's note on consolidated tools.
