# AntigleKit

**Free, privacy-first browser tools — online or offline.** Every tool runs entirely inside your browser: no uploads, no accounts, no trackers. Use it on the web, or download the repo and run it locally.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Live site:** <https://mukund-buddy.github.io/AntigleKit/>
> Open it in any browser — nothing to install. Bookmark it or share the link.

---

## What is AntigleKit?

AntigleKit is a single, dependable collection of utilities for everyday tasks — Minecraft add-on tooling, YouTube helpers, web-development generators, design utilities, student calculators, and more.

Everything is **static**: plain HTML, CSS, and JavaScript with no backend and no build step. Your files and inputs never leave your device — the processing happens in the tab you already have open.

## Why AntigleKit?

- **100% client-side** — all processing happens in your browser.
- **No accounts, no sign-up** — just open a tool and use it.
- **Privacy-first** — your files and text are never uploaded anywhere.
- **Works offline** — clone the repo and serve it locally with no internet.
- **No build step** — the repository *is* the deploy.
- **Dark and light themes** with a responsive, mobile-friendly layout.

## Tools (56 live)

Each tool runs on its own page under `tools/<tool-name>/`. The tables below are
the complete live catalog, kept in sync with the data registry
([`assets/data/tools.json`](assets/data/tools.json)).

### Minecraft (7 tools)

| Tool | What it does |
|---|---|
| [Manifest Generator](tools/manifest-generator/) | Generate a valid manifest.json for Bedrock resource, behavior, world-template, and script packs. |
| [Manifest Validator](tools/manifest-validator/) | Validate an existing manifest.json against Bedrock rules — required fields, UUID format, integer versions. |
| [Identifier Validator](tools/identifier-validator/) | Check namespaces and resource identifiers against Bedrock's allowed character rules. |
| [Pack Structure Checker](tools/pack-structure-checker/) | Verify an add-on's folder layout against what Bedrock expects inside an .mcpack. |
| [Pack Version Generator](tools/pack-version-generator/) | Pick the correct next version for your pack, with bumping and consistency checks. |
| [MC Title Studio](tools/mc-title-studio/) | Turn a photo into a Bedrock resource pack that fills the full title screen — cropped, packed, and downloaded in your browser. |
| [Command Builder](tools/cmd-builder/) | Build and validate Minecraft Bedrock commands — /give, /tp, /effect, /tag and more — with copy-ready output. |

### YouTube (8 tools)

| Tool | What it does |
|---|---|
| [Thumbnail Fetcher](tools/thumbnail-fetcher/) | Get a video's thumbnail URL from its link — no login, no account. |
| [Thumbnail Downloader](tools/thumbnail-downloader/) | Download a video thumbnail in several sizes — default, hq, maxres. |
| [Video & Audio Downloader](tools/video-downloader/) | Paste a link and jump straight to cobalt.tools — save video or audio from YouTube, TikTok, Instagram, X, Reddit, Facebook and 20+ more sites. |
| [Timestamp Generator](tools/timestamp-generator/) | Convert a list of minute/second markers into clean, copy-ready timestamps. |
| [Chapter Formatter](tools/chapter-formatter/) | Format raw notes into YouTube's accepted chapter lines with headings and times. |
| [Description Formatter](tools/description-generator/) | Format video descriptions — credits, links, and timestamps — consistently. |
| [Title Length Checker](tools/title-length-checker/) | Check titles against length limits and see how they may be truncated. |
| [Hashtag Formatter](tools/hashtag-formatter/) | Clean, deduplicate, and count hashtags; check against tag limits. |

### Web Development (21 tools)

| Tool | What it does |
|---|---|
| [Meta Tag Generator](tools/meta-tag-generator/) | Generate title, description, canonical, Open Graph, and Twitter tags. |
| [robots.txt Generator](tools/robots-generator/) | Build a robots.txt with allowed and disallowed paths and a sitemap line. |
| [sitemap.xml Generator](tools/sitemap-generator/) | Generate sitemap.xml entries from a pasted list of URLs. |
| [Open Graph Generator](tools/open-graph-generator/) | Build and preview Open Graph tags for social sharing cards. |
| [JSON Formatter](tools/json-formatter/) | Format and indent JSON for readability. |
| [JSON Validator](tools/json-validator/) | Validate JSON syntax and get clear, line-level errors. |
| [Base64 Encode / Decode](tools/base64-encode-decode/) | Encode and decode Base64 for text and files. |
| [URL Encoder](tools/url-encoder/) | Percent-encode a string for safe use in URLs and query strings. |
| [URL Decoder](tools/url-decoder/) | Decode percent-encoded URLs and read decoded query strings. |
| [Slug Generator](tools/slug-generator/) | Convert titles and captions into clean, URL-safe slugs. |
| [Regex Tester](tools/regex-tester/) | Test regular expressions live against sample text. |
| [UUID Generator](tools/uuid-generator/) | Generate v4 UUIDs, one or many, ready to copy. |
| [CSS Gradient Generator](tools/css-gradient-generator/) | Design linear and radial gradients visually and copy CSS. |
| [CSS Shadow Generator](tools/css-shadow-generator/) | Fine-tune box-shadows visually and copy the CSS. |
| [Flexbox Generator](tools/flexbox-generator/) | Configure flex containers and items and copy the CSS. |
| [Grid Generator](tools/grid-generator/) | Configure CSS grid templates and copy the CSS. |
| [Pinterest Pin Saver](tools/pinterest-downloader/) | Preview any Pinterest pin — photos and video pins — and save the image with your browser's save menu. |
| [JSON to Types](tools/json-to-types/) | Paste JSON once and get TypeScript interfaces, Python TypedDicts, Zod schemas and Go struct types, ready to copy. |
| [JSON Forge](tools/json-forge/) | Three-pane JSON workspace — format, validate, minify and explore one payload side by side. |
| [GitHub Launchpad](tools/github-launchpad/) | Package a GitHub repo in one form — description with the 350-character limit, topic validation, README opener and a launch checklist. |
| [AskMint](tools/askmint/) | Embeddable ask-me-anything box for static sites — local drafts with email or custom-link delivery, no backend. |

### Student (6 tools)

| Tool | What it does |
|---|---|
| [Attendance Calculator](tools/attendance-calculator/) | Calculate attendance percentages and what is needed to stay above a threshold. |
| [Percentage Calculator](tools/percentage-calculator/) | Find percentages, changes, and percentage differences instantly. |
| [CGPA Calculator](tools/cgpa-calculator/) | Compute CGPA from semester credits and grades. |
| [Reading Time Calculator](tools/reading-time-calculator/) | Estimate how long text takes to read at various speeds. |
| [Word Counter](tools/word-counter/) | Count words, sentences, and paragraphs in any text. |
| [Character Counter](tools/character-counter/) | Count characters with focus on limits (titles, bios, SMS). |

### Design (7 tools)

| Tool | What it does |
|---|---|
| [Color Palette Generator](tools/color-palette-generator/) | Generate harmonious color palettes and copy HEX/RGB/HSL. |
| [Glassmorphism Generator](tools/glassmorphism-generator/) | Design frosted-glass panels and copy the CSS. |
| [Contrast Checker](tools/contrast-checker/) | Check WCAG contrast ratios between two colors. |
| [Border Radius Generator](tools/border-radius-generator/) | Shape corner radii visually and copy the CSS. |
| [SVG Optimizer](tools/svg-optimizer/) | Clean up and minify inline SVG markup. |
| [Favicon Generator](tools/favicon-generator/) | Create favicon sizes from an image or emoji and download them. |
| [Contrast Lab](tools/contrast-lab/) | Paste a whole CSS file and get every colour pair ranked by real WCAG contrast — pass/fail at AA and AAA. |

### Security (5 tools)

| Tool | What it does |
|---|---|
| [Password Generator](tools/password-generator/) | Generate strong, random passwords locally in your browser. |
| [Password Strength Checker](tools/password-strength-checker/) | Score password strength and entropy without sending it anywhere. |
| [SHA-256 Generator](tools/sha256-generator/) | Hash text or files with SHA-256 using the browser's Web Crypto API. |
| [QR Code Generator](tools/qrcode-generator/) | Create QR codes from any text or URL and download them. |
| [QR Scanner](tools/qr-code-scanner/) | Scan and decode QR codes from an image or camera. |

### Business (2 tools)

| Tool | What it does |
|---|---|
| [Barcode Generator](tools/barcode-generator/) | Create Code 128, Code 39, EAN-13, or UPC-A barcodes and download them as PNG. |
| [Unit Converter](tools/unit-converter/) | Convert length, mass, temperature, volume, area, time, data, and speed instantly. |

Note on consolidation: **JSON to Types, JSON Forge, GitHub Launchpad, AskMint,
Command Builder and Contrast Lab** were previously standalone repositories and
now live in this kit; their standalone pages redirect interest here. The kit is
the single place where these tools are updated.

The full catalog — including planned and backlog tools — is defined in
[`assets/data/tools.json`](assets/data/tools.json). Only `"status": "live"`
tools have working pages.

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
- **One folder per tool** under `tools/`. Kit-native tools load their logic from
  `assets/js/tools/`; consolidated tools carry their own `app.js` / `style.css`
  inside the folder and remain fully self-contained.
- **The catalog is data, not markup**: `assets/data/tools.json` drives the tools
  page, search, and category filters. `main.js` mirrors the same list as a
  fetch-failure fallback — keep the two in step.
- **Shared design system** in `assets/css/app.css` (color tokens, components,
  dark and light themes). Consolidated tools keep their own visual styling for
  now; restyling them onto the shared system is tracked in the roadmap.

Testing locally is just serving the folder; there is nothing to compile.

## Deploy

The site is static, so anywhere that serves files works.

- **GitHub Pages (current):** the `main` branch is published as-is.
- **Cloudflare Pages / Netlify:** build command empty, output directory `.`;
  `_headers` and `_redirects` are picked up automatically.

## Contributing

Contributions and new tool ideas are welcome.

1. Read [ADDING-NEW-TOOLS.md](ADDING-NEW-TOOLS.md) — it is the complete,
   checklist-style guide for registering a new tool correctly.
2. Fork the repository and create a feature branch.
3. Add your tool under `tools/<tool-name>/`, register it in
   `assets/data/tools.json`, and update the counts and sitemap as documented.
4. Test locally with `python -m http.server` or `npx serve .`.
5. Open a pull request.

Every tool should solve a real problem, run fully in the browser, and produce a result
in under 30 seconds.

## License

[MIT](LICENSE) © The Antigle.

## Acknowledgements

Built with care by [The Antigle](https://github.com/mukund-buddy). Thanks to the
open-source projects and authors whose work makes tools like these possible.
