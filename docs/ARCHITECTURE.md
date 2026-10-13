# AntigleKit — Architecture & Decision Record

Status: MVP (Phase 1 — Manifest Generator only)
Last updated: 2026-08-06

This document records every significant architectural decision for the
AntigleKit tools platform, the **reason** it was chosen, the **trade-offs** it
carries, and the **alternatives** that were considered and rejected.

It is the source of truth. If code and this document disagree, the document is
wrong — fix the document first.

---

## 1. Context

AntigleKit is a static web platform of free browser tools (Minecraft Bedrock
utilities, web development, YouTube, student, business, design, security, and
file tools) monetized by advertising and by redirecting users to external
premium products.

Current scope: **one live tool** — the Minecraft Bedrock `manifest.json`
Generator — plus the platform shell and the **approved build plan** (60
approved tools in priority order, catalogued in `tools.json`).

Hard constraints from the business brief:

- No backend of any kind (no Node/Express/PHP/Python/databases).
- Deployed from a **private GitHub repository** to **Cloudflare Pages**.
- No authentication, no accounts.
- No payment processing — premium items redirect to external stores only.
- **AI is never required.** The site works completely without AI services.
  Optional BYOK (bring your own key) features may be designed later but are
  currently in the backlog and must never be a dependency of any tool.
- Ads must never degrade UX (no popups, popunders, interstitials, fake buttons).
- SEO is a primary business driver and must be engineered in, not bolted on.
- Quality over quantity: every tool must pass the tool acceptance rule (§17)
  before it is approved.

---

## 2. Verified facts (research, not assumptions)

Everything below was verified against official sources on 2026-08-06.
Do not "update" these without re-verifying against the official source.

### 2.1 Minecraft Bedrock manifest.json — official schema (Microsoft Learn)

Source: `learn.microsoft.com/minecraft/creator/reference/content/addonsreference/packmanifest`

| Field | Rules |
|---|---|
| `format_version` | `1` for skin packs, `2` for resource/behavior/world-template packs. **Version 3 is preview-only** (1.21.110+): semver *strings* instead of arrays, plus custom pack settings. |
| `header.name` | Required string. |
| `header.description` | Required string. |
| `header.uuid` | Required. Format `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (hex). |
| `header.version` | Required array `[major, minor, revision]` of integers. |
| `header.min_engine_version` | **Required for resource and behavior packs.** Vector `[a, b, c]`. Use the highest current version. |
| `header.pack_scope` | Resource packs only. `"world"`, `"global"`, `"any"`. Default `"any"`. |
| `header.allow_random_seed` / `base_game_version` / `lock_template_options` | World-template manifests only. |
| `modules[].type` | `resources`, `data`, `world_template`, `script` (docs table; the official example also shows `client_data`). `skin_pack` exists for format_version 1 skin packs. |
| `modules[].uuid` | Must differ from the pack UUID and from every other module UUID. |
| `modules[].version` | Same array format as header version. |
| `modules[].language` | Only when `type: "script"`; value `"javascript"`. |
| `modules[].entry` | Script modules: path to entry file (e.g. `scripts/main.js`). |
| `dependencies[]` | Either `{ uuid, version }` (another pack) or `{ module_name, version }` (scripting module such as `@minecraft/server`). |
| `capabilities` | Optional feature flags (e.g. `script_eval`). Exact token list not fully re-verified in this pass — see §7 unknowns. |
| `metadata` | `authors`, `license`, `url`, `generated_with` — optional. |
| `subpacks` | `folder_name`, `name`, `memory_tier`. |

**MVP decision:** the generator emits `format_version: 2` with integer
version arrays only. Version 3 output is deliberately NOT implemented (it is
preview and would ship unverifiable output). Skin packs (format 1) are
deferred. Both are in ROADMAP.md.

### 2.2 SEO landscape 2026

- Core Web Vitals (LCP ≤ 2.5 s, **INP ≤ 200 ms**, CLS ≤ 0.1) are confirmed
  ranking signals. INP replaced FID in March 2024 — any guide still talking
  about FID is outdated.
- Google's **two-wave indexing**: JavaScript-rendered content can take hours
  or days to index. Critical content must exist in the initial HTML response.
  AI crawlers do not execute JavaScript at all.
- Pages returning non-200 codes may be skipped by the rendering pipeline —
  a `404.html` that returns a real 404 is mandatory.
- Structured data (JSON-LD) drives rich results and AI-Overview inclusion.
  **Schema drift** (JSON-LD contradicting visible content) gets rich results
  revoked. Keep JSON-LD in sync with rendered content — never generate schema
  from JavaScript for content that is also in HTML.
- Recommended schema types: Organization, WebSite, Article, FAQPage, HowTo,
  BreadcrumbList, SoftwareApplication (tools).
- robots.txt must not block CSS/JS. Mobile-first indexing is universal.
- 48×48 px touch targets; 16px minimum body text.

### 2.3 Cloudflare Pages

- `_headers` (plain text, no extension, in the deploy output root) sets
  response headers per URL pattern. This is where CSP/HSTS/cache live.
- `_redirects` supports static (2000) + dynamic (100) redirects; redirects
  win over headers; `/*  /404.html  404` gives a real 404 status.
- Private GitHub repos are supported via the Pages GitHub integration.
- `*.pages.dev` domains can be `noindex`ed via `X-Robots-Tag`.
- Cloudflare analytics (if used) needs BOTH `script-src static.cloudflareinsights.com`
  and `connect-src cloudflareinsights.com` in the CSP.

### 2.4 Gemini API from the browser (BYOK) — feasibility verified

- The **legacy REST endpoint**
  `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
  with header `x-goog-api-key` **works from browsers**: Google's CORS
  preflight allowlist accepts `content-type`, `x-goog-api-key`,
  `x-goog-api-client`, `authorization`. Verified via preflight tests
  (curl OPTIONS) documented in googleapis/js-genai issue #1723.
- The newer **Interactions API** (`/v1beta/interactions`) currently fails
  browser preflight because the SDK adds an `api-revision` header that is
  not in the CORS allowlist. **Do not use the Interactions API from the
  browser.** Use raw `fetch` + `generateContent`.
- Since **June 19, 2026** Gemini rejects *unrestricted* API keys. Keys created
  in Google AI Studio are restricted to the Gemini API by default — the docs
  for the BYOK flow must tell users to generate a key in AI Studio (and,
  optionally, add an origin restriction).
- Google's official stance: client-side calls are "for prototyping". Our
  BYOK model makes the user's own key the exposed secret, which is the
  standard consumer-tool trade-off. Document it; never store keys server-side
  (there is no server); never log them.

AI tools are FUTURE phase — §8 records the pattern only.

---

## 3. Decision 1 — Multi-Page Application (MPA), not SPA

The existing gaming platform uses an SPA (single `index.html`, view switching
in JS, content fetched from JSON). The tools platform deliberately diverges.

**Why:** two-wave indexing, AI-crawler blindness to JS, and the business
model (traffic = revenue) mean every tool page must ship complete HTML in the
first response: title, meta, H1, intro, guide, FAQ, related links. A tool's
*interactive* behavior is progressive enhancement; its *content* is static
HTML.

**Trade-offs:** the nav/footer markup is duplicated per page (mitigated by
canonical partials in `templates/`, see §7 of this doc); no shared runtime
state between pages (irrelevant here).

**Alternatives rejected:** SPA (as the gaming platform — SEO-hostile for a
content platform), SSG with a build step (see Decision 2).

---

## 4. Decision 2 — Zero build step

The repo is deployed as-is: hand-written HTML, one global CSS file, small
ES-module JS files, JSON data. No npm, no bundler, no generator.

**Why:** the entire product fits in a handful of files; a build step adds a
Node dependency, lockfile churn, and a failure mode for a site whose total JS
is under 30 KB. Cloudflare Pages builds from a plain repo with `--root .`
and no build command.

**Trade-offs:** shared markup is duplicated across pages. Mitigation: the
`templates/nav.html` and `templates/footer.html` files are the canonical
copies; a documented copy procedure; and a future low-risk migration path to
11ty/Astro if page count ever justifies it (ROADMAP).

**Alternatives rejected:** 11ty, Astro, Vite+HTML plugin, hand-rolled Python
generator. All add moving parts with no MVP benefit.

---

## 5. Decision 3 — Design system: reuse Antigle tokens, extend with glass

Source of brand truth: `E:\Welcome\Projects\the-antigle-gaming-platform\assets\css\app.css`
(dark gold/black cinematic system). Tokens reused verbatim:

```
--ink #080A0F  --surface #0F121A  --elevated #161B26
--mist #9AA5B5 --dim #7A869A      --bright #E6EAF2
--gold #C8A84E --gold-bright #DCC06A --gold-deep #A98C3C
--hairline rgba(200,168,78,0.16)  --hairline-soft rgba(200,168,78,0.08)
--line rgba(255,255,255,0.06)
8pt spacing scale, --ease-out cubic-bezier(0.16,1,0.3,1),
Space Grotesk (display) + Inter (body), 1200px container, 65ch measure.
```

The brief asks for glassmorphism; the gaming system is flat. Resolution:
keep the brand tokens, add a **tool-chrome layer** on top:

```
--glass: rgba(255,255,255,0.03)      (panel fill)
--glass-strong: rgba(255,255,255,0.05)
--glass-border: rgba(255,255,255,0.08)
backdrop-filter: blur(14px) — only on tool panels, with a solid fallback
  (backdrop-filter unsupported → plain rgba fill; verify in test pass)
```

**Why backdrop-filter only on tool panels:** `backdrop-filter` is a
compositing cost; on the whole site it would threaten INP/CWV. Progressive
enhancement: without support, panels are simply darker.

**No loading screen, no custom cursor.** The gaming platform has both; a fake
loader delays LCP and a custom cursor adds main-thread work on a site whose
whole job is fast interaction. Deliberate divergence — documented here so it
reads as a decision, not an omission.

---

## 6. Decision 4 — Component strategy: Web Components + plain HTML

- **Site chrome** (nav, footer, hero, cards, ad slots): plain semantic HTML
  in each page. Crawlable, no JS needed.
- **Interactive widgets**: small custom elements, one class per file:
  - `<tg-tool-card>` — renders a tool card from `data-tool="id"` using the
    catalog JSON. (Used only where the card is decoration; where it matters
    for SEO the markup is written out by hand in HTML instead.)
  - `<tg-copy-button>` — copies target text/JSON to clipboard; success via
    `<tg-toast>`; graceful fallback (no clipboard API → select + execCommand).
  - `<tg-toast>` — `role="status"` notification, auto-dismiss.
  - `<tg-json-view>` — syntax-highlighted read-only JSON view with line
    numbers. Used by the generator output and future tools.
  - Future: `<tg-skin-viewer>`, `<tg-ai-form>` etc. — one file each.

**Why custom elements:** self-contained, no framework, no shadow-DOM CSP
issues (we use light DOM so page CSS applies), declarative in HTML.

---

## 7. Decision 5 — Data architecture (static JSON)

| File | Purpose | Consumed by |
|---|---|---|
| `assets/data/tools.json` | Tool catalog: id, slug, name, tagline, category, description, keywords, status (`live`/`planned`), related ids, href. **Single source of truth** for the tools index, related-tools links, and the sitemap. | `index.html`, `tools/index.html`, tool pages (related tools), `sitemap.xml` (manual sync, see §7 of this doc) |
| `assets/data/manifest-presets.json` | Generator presets: pack types, `min_engine_version` presets, script-module options, `@minecraft/server` version presets. Curated by hand; **requires maintenance** as Minecraft versions move. | `manifest-generator.js` |
| `assets/data/store.json` (future) | External store links for premium redirects. | premium pages |

Schema contracts (names, types, required fields) are specified in
`docs/DATA.md`. Validation: `tools.json` is validated by the catalog renderer;
new fields must be added to DATA.md first.

**Trade-off:** a hand-maintained catalog can drift from sitemap.xml. The
sitemap generation procedure is documented in SEO.md; when the catalog
grows beyond ~20 entries, add a tiny script (ROADMAP).

---

## 8. Decision 6 — AI architecture (future tools, planned now)

> **(2026) Product decision:** AI tools are NOT in the approved build plan and
> are flagged `status: "backlog"` in `tools.json`. The website must work
> completely without AI services. This section is kept as the design record
> for any future *optional, BYOK-only* AI feature approved through the tool
> acceptance rule — it must never become required.

Rules that future AI tools MUST follow (recorded now so they are not
redesigned under pressure):

1. Browser-only. User pastes their own Gemini API key into the tool UI.
2. The key is stored in `localStorage` ONLY with explicit opt-in and a
   visible security note; stored so re-use across the user's sessions is
   optional (off by default; per-session only otherwise). Never transmitted
   anywhere except `generativelanguage.googleapis.com`.
3. Calls use raw `fetch()` against
   `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
   with `x-goog-api-key` header. **Never** the Interactions API (§2.4).
4. Model names are data, not code: curated list in a JSON file. Model names
   change; the curator updates data, not logic. **Model availability must be
   re-verified before each new AI tool ships** (AI Studio release notes).
5. CSP: when the first AI tool ships, add
   `connect-src ... https://generativelanguage.googleapis.com` to `_headers`
   (scoped to the tool path, not globally).
6. API key input is `type="password"` + autocomplete="off"; the key is never
   echoed, logged, or embedded in URLs (query strings leak to analytics).
7. User guidance must mention: keys are user-managed; AI Studio keys are
   Gemini-restricted by default; recommend an origin/IP restriction.

Trade-off: BYOK means some users won't have keys and bounce. Mitigation:
free tools must remain fully usable without AI; AI is an optional layer.

---

## 9. Decision 7 — Monetization architecture (ads)

- Ad slots are **reserved, fixed-size containers** in the HTML:
  `<aside class="ad-slot" data-slot="top">` — always sized with explicit
  `min-height` (CLS-safe). No ad network is wired in MVP (none chosen yet);
  when one is, the script goes in a dedicated `assets/js/ads.js` loaded with
  `defer`, and the slot markup is unchanged.
- Placements allowed: one top banner, one footer banner, one in-article
  slot. Nothing else. No popups/popunders/redirects/interstitials by policy.
- If the chosen network's snippet requires inline script → it breaks CSP;
  then the decision is documented (either a nonce, or drop that network).

---

## 10. Decision 8 — Security posture (static site)

Delivered via `_headers` (Cloudflare Pages):

- `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://i.ytimg.com https://www.youtube.com; media-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests`
  — inline `<script type="application/ld+json">` is data, not executable,
  and is permitted under this policy (CSP does not block non-executable
  script types). All behavior comes from external files.
- `https://i.ytimg.com` is in `connect-src` solely for the Thumbnail
  Downloader's direct download (fetch + blob). Image-only host, no scripts
  or credentials.
- `https://www.youtube.com` is in `connect-src` for the Thumbnail
  Downloader's `oEmbed` title lookup — returns title/author only, fails
  silently, never gates the tool flow.
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`,
  `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  (preload only after the domain is long-lived — do not rush it),
  `Cross-Origin-Opener-Policy: same-origin`,
  `Cross-Origin-Resource-Policy: same-origin`.
- Cache: hashed/immutable assets `public, max-age=31536000, immutable`;
  HTML `public, max-age=0, must-revalidate`.
- JS rules (enforced by review, not tooling): no `eval`, no inline handlers,
  no `innerHTML` with unescaped data — every dynamic injection passes through
  an `esc()`/`textContent` helper (pattern inherited from the gaming
  platform's app.js).

---

## 11. Decision 9 — SEO architecture

- Every page: unique `<title>`, meta description, canonical, OG + Twitter
  tags, `theme-color`.
- JSON-LD per page type: Organization (global), WebSite (home), BreadcrumbList
  + SoftwareApplication + FAQPage (tool page). FAQ JSON-LD mirrors the
  visible FAQ section **exactly** (anti-schema-drift rule).
- `sitemap.xml` + `robots.txt` (allow all, reference sitemap; must not block
  assets). Update sitemap every time a page is added (procedure in SEO.md).
- Internal linking: every tool page links to its related tools and category;
  every page is ≤ 2 clicks from home. Anchor text descriptive.
- No `SearchAction` in WebSite schema: there is no server-side search
  endpoint, and emitting a fake search URL would be schema drift.
- The MPA choice (§3) is itself the core SEO decision.
- Target: Lighthouse Performance/Accessibility/SEO/Best-Practices ≥ 95 on
  every page, verified per release (procedure in SEO.md).

---

## 11a. Theme system (dark-first, light opt-in) — since 2026-08-08

- **Dark theme is the source of truth.** The `:root` tokens in `assets/css/app.css`
  are the dark palette and must never change. The light theme is a pure
  override block, `html[data-theme="light"] { … }`, that swaps token values
  only — same layout, spacing, animation, and glass language (no
  `filter: invert()`, no redesigns).
- **Adaptive tokens.** Hardcoded translucent colors (white tints, dark
  scrims, shadows, scrollbar) live as tokens in `:root` with light values
  under `[data-theme="light"]`. Keep hardcoded rgba/hex out of component
  rules; use these tokens so both themes stay in sync.
- **Mechanism.** `assets/js/theme-init.js` (in `<head>`, anti-flash) reads
  `localStorage["af-theme"]` ("light"|"dark"), falls back to
  `prefers-color-scheme: light`, and sets `data-theme` on `<html>`.
  `assets/js/theme.js` (before `main.js`) wires the toggles, keeps
  `aria-pressed` in sync, updates the `theme-color` meta
  (needs `id="themeColorMeta"`), and adds a 420 ms `html.theme-anim`
  cross-fade (respects `prefers-reduced-motion`).
- **Markup.** Desktop toggle (`.theme-toggle--desktop`) lives in the header
  next to the search toggle; mobile toggle (`.theme-toggle--mobile`) lives in
  the mobile menu. `templates/nav.html` is the canonical source — copy it
  into every page verbatim and keep it in sync.
- **Page requirements.** Every page needs, in order: the `themeColorMeta`
  meta tag, `theme-init.js` immediately after it in `<head>`, `theme.js`
  before `main.js`. `404.html` has no nav and therefore no toggles, but
  still loads both scripts.
- **Cache note.** `/assets/*` is immutable for 1 year — after changing
  `app.css`/`theme*.js`, purge the Cloudflare cache at deploy.

---

## 12. Folder structure (canonical)

```
The-Antigle/
├─ index.html                     Home (hub)
├─ 404.html                       Custom 404 (real 404 status via _redirects)
├─ robots.txt
├─ sitemap.xml
├─ favicon.svg
├─ _headers                       Cloudflare response headers (CSP etc.)
├─ _redirects                     Cloudflare redirects + 404 rule
├─ privacy/index.html             Privacy policy + disclaimer (noindex)
├─ tools/
│  ├─ index.html                  Live tool + approved build plan
│  └─ manifest-generator/
│     └─ index.html               Live tool
├─ assets/
│  ├─ css/app.css                 Tokens + base + shared components
│  ├─ js/
│  │  ├─ main.js                  Site chrome (nav, mobile, reveal, search overlay)
│  │  ├─ tools-index.js           Tools page: renders approved plan from tools.json
│  │  ├─ components/              One file per custom element
│  │  │  ├─ tg-tool-card.js
│  │  │  ├─ tg-copy-button.js
│  │  │  ├─ tg-toast.js
│  │  │  └─ tg-json-view.js
│  │  └─ tools/
│  │     └─ manifest-generator.js Tool logic
│  ├─ img/                        Optimized brand assets (logo.png, me.jpg)
│  └─ data/
│     ├─ tools.json
│     └─ manifest-presets.json
├─ templates/                     Canonical copies of shared markup
│  ├─ nav.html
│  └─ footer.html
└─ docs/                          This documentation set
```

**Future tool page rule:** every future tool gets its own
`tools/<slug>/index.html` + `assets/js/tools/<slug>.js`. That keeps the URL
clean (`/tools/manifest-generator/`), the assets per-tool, and the page
self-contained — no cross-tool coupling.

---

## 13. Naming conventions

- Files & folders: `kebab-case` (URLs are paths, not objects).
- JS: IIFE-free; ES modules `export` named functions; components:
  `class TgToolCard extends HTMLElement` registered as `tg-tool-card`.
- CSS: flat BEM-ish classes (`tool-panel`, `tool-panel__field`) matching the
  existing system's style; new tool-chrome classes prefixed `tool-`.
- Data: camelCase keys; `snake_case` ONLY for fields that map 1:1 to the
  Minecraft manifest schema (correctness beats style).
- Icons: inline SVG, `viewBox="0 0 24 24"`, stroke 1.5, `currentColor`,
  `aria-hidden="true"` — no icon font, no library (CSP + perf).

---

## 14. Page hierarchy (current)

```
/                    → Hub: hero, featured tool, catalog grid, ad slot, brand block
/about               → Brand, mission, contact (mailto), Organization schema
/tools/              → Live tools (static HTML) + approved build plan (from tools.json)
/tools/manifest-generator/  → The tool (form, JSON view, copy/download, guide, FAQ)
/privacy             → Privacy policy + disclaimer (noindex)
404                  → Branded 404 with real status + links back
```

Future: `/articles/*`, `/premium/*` — each gets its own subtree. AI tools
stay in the backlog (see §8) until explicitly approved.

---

## 15. Uncertainties & open items (honest list)

1. **Production domain is unknown.** Canonical URLs, OG URLs, sitemap and
   JSON-LD use `https://mukund-buddy.github.io/AntigleKit` placeholders. Replace once the
   Cloudflare Pages custom domain exists (one grep for `YOUR-DOMAIN`).
2. **`capabilities` token list** (e.g. `script_eval`) is referenced by docs
   but the authoritative token table was not fully re-verified in this pass.
   The generator exposes capabilities as optional free-form checkboxes with
   documented defaults; verify against
   `learn.microsoft.com/minecraft/creator/reference/content/addonsreference/packmanifest`
   before editing presets.
3. **`min_engine_version` and `@minecraft/server` presets are time-bound.**
   The presets file is curated; verify current values per Minecraft release
   (learn.microsoft.com release notes) when publishing.
4. **Ad network**: none chosen; slots are ready, wiring is out of scope.
5. **Analytics**: Cloudflare Web Analytics (privacy-friendly, first-party-ish)
   is the candidate; adds `script-src static.cloudflareinsights.com` +
   `connect-src cloudflareinsights.com` to CSP when enabled.

## 16. What is deliberately NOT built (current)

- No version-3 (string) manifests, no skin-pack manifests, no world-template
  options beyond the base module type, no resource+behavior combined packs.
- No AI tools (backlog by product decision), no login/demo UI, no premium
  store pages, no articles.
- No PWA, no service worker, no analytics wiring, no ad network wiring.
- Backlog tools (skin/geometry/animation/entity/loot/recipe/block/item
  generators) are NOT scheduled despite having catalog rows — they must pass
  the acceptance rule (§17) and be re-planned first.
- No favicon redesign, no og-image generation (Open Graph images added when
  the brand artwork exists).

## 17. Tool acceptance rule & approved plan

**Every candidate tool must answer all six questions with "yes"** before it
is added to the approved plan. Otherwise it goes to `status: "backlog"`.

1. Does it solve a real problem?
2. Can it work completely inside the browser (no backend)?
3. Can it generate SEO traffic?
4. Can documentation/a guide be written for it?
5. Will it be easy to maintain?
6. Can users get results within 30 seconds?

**Approved plan** (60 tools, in build order): Minecraft bugs (5) →
YouTube (7) → Web development (16) → Student (9) → Design (6)
→ Security (5) → File tools (5) + growth/plan additions (Case Converter,
Lorem Ipsum, HTML/CSS Minifier, Random Number, Study Timer, List Sorter).
Stored in `assets/data/tools.json` with `status: "live" | "planned"`;
anything not approved has `status: "backlog"` and is excluded from the
tools page plan and from site search.

> The Business batch (GST · ROI · Profit · Margin · EMI · Invoice · Quotation)
> was dropped from the approved plan on 2026-08-07 — catalog rows and the build
> plan were removed.

**Build-order changes are made in `tools.json`, not in HTML.** The tools
index renders the approved plan from the catalog; only live tools are also
hand-written into the HTML for SEO. Sitemap is synced from the catalog
(`status: "live"` rows) — see §7 of this doc.
