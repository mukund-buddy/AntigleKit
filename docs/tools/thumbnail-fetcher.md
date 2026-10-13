# Feature doc — Thumbnail Fetcher

Page: `tools/thumbnail-fetcher/index.html`
Logic: `assets/js/tools/thumbnail-fetcher.js` + `assets/js/validate/youtube.js`
Data: none (sizes are code) · Catalog id: `thumbnail-fetcher` · Status: **live**

---

## 1. Why it exists

Video pages, community posts, and video editors all want the exact thumbnail
file of a video. YouTube hides the direct URL behind multiple redirects, and
thumbnail service sites are riddled with ads and paywalls. A one-field fetcher
that turns any video link into direct `i.ytimg.com` URLs (five documented
sizes) is the smallest useful YouTube creator tool, and it is the entry point
to the whole YouTube set.

## 2. How it works

1. `parseVideoId()` (pure module, 74 Node tests) accepts a bare 11-char ID or
   a URL: `/shorts/`, `/live/`, `/embed/`, `/v/`, `watch?v=` (any host
   prefix incl. `m.`/`music.`), and `youtu.be/`. It never fuzzy-scans
   arbitrary text — no match means an explicit "could not find a video ID".
2. Five thumbnail sizes are built: `maxresdefault` (1280×720), `sddefault`
   (640×480), `hqdefault` (480×360), `mqdefault` (320×180), `default`
   (120×90), as `i.ytimg.com/vi/{id}/{size}.jpg`.
3. **Missing-size honesty**: `maxresdefault` and `sddefault` are not
   generated for every video. When missing, YouTube serves a 120×90 grey
   placeholder JPEG with a 200 response — so `img.onerror` never fires.
   Each row loads its image and reads `naturalWidth`; a non-default size
   with `naturalWidth <= 120` is flagged "missing (placeholder)".
4. Rows offer Copy (clipboard API with toast fallback) and Open-in-new-tab.
   The preview uses `hqdefault` (exists for every video).

## 3. Limitations

- No `mqdefault`/`default` equivalent of "missing": those always exist.
- `maxresdefault` can exist at other resolutions (some videos are 1280×720
  or 1280×720 crops only) — the tool reports existence, not exact aspect.
- YouTube could change URL patterns; `URL_PATTERNS` is the single source.

## 4. Browser compatibility

- ES modules, `fetch`-free; only `Image`, `navigator.clipboard`
  (fallback to toast), `window.open`. Universal modern support.
- Images load lazily only after a valid ID is entered (no upfront weight).

## 5. Maintenance requirements

- `THUMB_SIZES` and `URL_PATTERNS` live in `validate/youtube.js` — update
  there, run the Node test suite (`yt-tests`), then rebuild any consumers.
- Keep the page FAQ in sync with the catalog row (SEO.md drift rule).

## 6. Trade-offs

- **Explicit Fetch button** (chosen) over live-as-you-type: avoids hammering
  i.ytimg.com probes on every keystroke. Cost: one extra click.
- **Real dimension probes** (chosen) over trusting URL existence: costs five
  small image requests per video, gains truthful results.
- **Copy via clipboard API** (chosen) over a hidden textarea trick: simpler
  and modern browsers universally support it.

## 7. Future improvements

- Optional `youtube-nocookie.com` mirror toggle for embeds.
- Detect `maxresdefault` variants served at non-1280 widths and report them.
- Batch mode (multiple links, one per line) with a results table.

## 8. Verified references

- Thumbnail URL map + sizes: paulirish/lite-youtube-embed
  `youtube-thumbnail-urls.md`; YouTube Data API thumbnail docs — recorded
  2026-08-06 in `validate/youtube.js` header.
- Missing-size placeholder behaviour verified against live `i.ytimg.com`.
