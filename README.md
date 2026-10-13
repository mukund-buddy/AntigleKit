# AntigleKit

**Free, privacy-first browser tools — online or offline.** Every tool runs entirely inside your browser: no uploads, no accounts, no trackers. Use it on the web, or download the repo and run it locally.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Live site:** <https://mukund-buddy.github.io/AntigleKit/>
> Open it in any browser — nothing to install. Bookmark it or share the link.

---

## What is AntigleKit?

AntigleKit is a collection of practical utilities for everyday tasks — Minecraft add-on
tooling, YouTube helpers, web-development generators, design and image utilities,
student calculators, and more.

Everything is **static**: plain HTML, CSS, and JavaScript with no backend and no build
step. Your files and inputs never leave your device — the processing happens in the tab
you already have open.

## Why AntigleKit?

- **100% client-side** — all processing happens in your browser.
- **No accounts, no sign-up** — just open a tool and use it.
- **Privacy-first** — your files and text are never uploaded anywhere.
- **Works offline** — clone the repo and serve it locally with no internet.
- **No build step** — the repository *is* the deploy.
- **Dark & light themes** and a responsive, mobile-friendly layout.

## Tools (50 live)

| Category | Tools |
|---|---|
| **Minecraft** | Manifest Generator · Manifest Validator · Identifier Validator · Pack Structure Checker · Pack Version Generator · MC Title Studio |
| **YouTube** | Thumbnail Fetcher · Thumbnail Downloader · Timestamp Generator · Chapter Formatter · Description Formatter · Title Length Checker · Hashtag Formatter · Video & Audio Downloader |
| **Web Development** | Meta Tag Generator · robots.txt Generator · sitemap.xml Generator · Open Graph Generator · JSON Formatter · JSON Validator · Base64 Encode/Decode · URL Encoder · URL Decoder · Slug Generator · Regex Tester · UUID Generator · CSS Gradient Generator · CSS Shadow Generator · Flexbox Generator · Grid Generator · Pinterest Pin Saver |
| **Design** | Color Palette Generator · Contrast Checker · Favicon Generator · Border Radius Generator · Glassmorphism Generator · SVG Optimizer |
| **Security** | Password Generator · Password Strength Checker · QR Code Generator · QR Scanner · SHA-256 Generator |
| **Student** | Percentage Calculator · Attendance Calculator · CGPA Calculator · Reading Time Calculator · Word Counter · Character Counter |
| **Business** | Barcode Generator · Unit Converter |

The full catalog (including planned/backlog tools) is defined in
[`assets/data/tools.json`](assets/data/tools.json). Tools marked `"status": "backlog"`
are on the roadmap; only `"status": "live"` tools appear as usable.

## Use it online

1. Open the live site: <https://mukund-buddy.github.io/AntigleKit/>
2. Pick a tool from the catalog, or deep-link straight to one, for example:
   - Word Counter — <https://mukund-buddy.github.io/AntigleKit/tools/word-counter/>
   - Manifest Generator — <https://mukund-buddy.github.io/AntigleKit/tools/manifest-generator/>
   - MC Title Studio — <https://mukund-buddy.github.io/AntigleKit/tools/mc-title-studio/>

No install, no account. Everything runs locally in your browser.

## Run it locally (offline)

Because the site uses ES modules, you must serve it over `http://` — opening the files
directly with `file://` will not work. Any static server will do.

### 1. Get the files

```bash
git clone https://github.com/mukund-buddy/AntigleKit.git
cd AntigleKit
```

(Or click **Code → Download ZIP** on GitHub and extract it.)

### 2. Start a static server

```bash
# Python 3 (usually pre-installed)
python -m http.server 8080

# or Node.js
npx serve .
```

### 3. Open it

Visit <http://localhost:8080> in your browser. Pick a tool and go.

## Project structure

```
AntigleKit/
├── index.html                 Home — hero + live tool families
├── about/index.html           About the project
├── privacy/index.html         Privacy policy + disclaimer
├── tools/
│   ├── index.html             Tool catalog (rendered from tools.json)
│   └── <tool-name>/index.html One folder per live tool
├── assets/
│   ├── css/app.css            Design system (tokens, components, themes)
│   ├── img/                   Optimized images (deployed)
│   ├── data/tools.json        Tool catalog — the source of truth
│   └── js/
│       ├── main.js            Site chrome (nav, catalog, filters, theme)
│       ├── components/        Shared Web Components (toast, copy, json-view…)
│       ├── validate/          Pure logic modules (Node-testable)
│       └── tools/             Per-tool logic
├── templates/                 Canonical nav/footer (kept in sync with pages)
├── docs/                      Architecture, data contracts, SEO, security, roadmap
├── _headers, _redirects       Optional host config (Cloudflare Pages)
├── 404.html                   Custom not-found page
├── sitemap.xml, robots.txt    SEO
└── ads.txt                    Ad-network declarations (optional)
```

## How it's built

- **Vanilla JavaScript with ES modules** — no framework, no bundler, no build step.
- **One folder per tool** under `tools/`, each a self-contained `index.html` that loads
  its own module from `assets/js/tools/`.
- **The catalog is data**, not markup: `assets/data/tools.json` drives the tools page,
  search, and category filters.
- **Shared design system** in `assets/css/app.css` (color tokens, components, dark and
  light themes).

Testing locally is just serving the folder; there is nothing to compile.

## Deploy

The site is static, so anywhere that serves files works.

- **GitHub Pages (current):** the `main` branch is published as-is.
- **Cloudflare Pages / Netlify:** build command empty, output directory `.`;
  `_headers` and `_redirects` are picked up automatically.

## Contributing

Contributions and new tool ideas are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Add your tool under `tools/<tool-name>/` plus its module in `assets/js/tools/`, and
   register it in `assets/data/tools.json`.
4. Test locally with `python -m http.server` or `npx serve .`.
5. Open a pull request.

Every tool should solve a real problem, run fully in the browser, and produce a result
in under 30 seconds.

## License

[MIT](LICENSE) © The Antigle.

## Acknowledgements

Built with care by [The Antigle](https://github.com/mukund-buddy). Thanks to the
open-source projects and authors whose work makes tools like these possible.
