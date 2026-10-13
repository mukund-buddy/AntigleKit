# Feature doc — Thumbnail Downloader

Page: `tools/thumbnail-downloader/index.html`
Logic: `assets/js/tools/thumbnail-downloader.js` + `assets/js/validate/youtube.js`
Data: none · Catalog id: `thumbnail-downloader` · Status: **live**

---

## 1. Why it exists

Creators routinely need the thumbnail of their own or referenced videos —
for editors, thumbnails grids, or community posts. The Fetcher gives URLs;
the Downloader gives a per-size preview with **verified real resolution**
and a one-tap save on any device.

## 2. How it works

1. Same `parseVideoId()` entry as the Fetcher (shared module).
2. A size tab strip (maxres / sd / hq / mq / default) shows a preview; the
   preview image is probed first and its actual `naturalWidth`/`naturalHeight`
   are reported ("Actual file size: 1280×720 px — this is what gets saved").
   A non-default size with `naturalWidth <= 120` — or a fetch 404 — is flagged
   as missing (size does not exist for that video) and its **Download button
   is disabled**.
3. **Direct download** (since 2026-08-08): `i.ytimg.com` sends
   `Access-Control-Allow-Origin: *`, so the tool `fetch()`es the original
   file, converts it to a blob URL, and triggers `a[download]` named
   `notgamingplayz-thumbnail-downloader-sizeKey.jpg` (branded filename,
   since 2026-08-08; previously `videoId-sizeKey.jpg`). CSP allows this via
   `connect-src 'self' https://i.ytimg.com` in `/_headers`.
4. Platform-aware hints (iOS / Android / desktop) explain the best save path:
   Download button, press-and-hold the preview, or Open in new tab.
5. A **thumbnail card grid** lists every size with a real image preview, a
   resolution badge, a "Best quality" marker on the highest available size,
   and per-card Download / Open / **Copy URL** buttons. The video title is
   fetched from YouTube's `oEmbed` endpoint (`https://www.youtube.com/oembed`,
   allowed via `connect-src`) and shown next to the video ID.
6. Missing sizes are flagged per-card (grey overlay + disabled Download) as
   soon as the card's own image probe reports the 120×90 placeholder.

## 3. Limitations

- The direct download works everywhere except older iOS Safari builds, where
  `a[download]` on blob URLs may open a preview instead. The press-and-hold
  and Open-in-tab fallbacks always work there.
- Existence checks use fetch status + the `naturalWidth` heuristic, shared
  with the Fetcher.
- No watermark/overlay features — by design, the file is saved untouched.

## 4. Browser compatibility

- ES modules + `Image` probing + `fetch`/`blob` download. Baseline is
  identical to the Fetcher; the download button is progressively enhanced
  (older browsers can still open in a new tab).

## 5. Maintenance requirements

- Sizes/URLs shared via `validate/youtube.js`; keep both thumbnail tools in
  lockstep (they intentionally share `THUMB_SIZES`).
- If YouTube removes the CORS headers from `i.ytimg.com`, the fetch download
  fails gracefully into the "Open in new tab" fallback — no crash. Note the
  change in this doc and the FAQ.

## 6. Trade-offs

- **Tab previews** (chosen) over a full grid: one large image at a time
  keeps the page light and focuses the save action; the card grid below
  covers the "compare all sizes" case.
- **Fetch + blob download** (chosen) over canvas workarounds: canvas reads
  still fail on this origin and would silently produce broken files.
- **Missing sizes disable Download** rather than saving the grey placeholder
  — users get a clear message instead of a useless 120×90 file.
- **oEmbed title** is a client-side fetch to `www.youtube.com`; it fails
  silently offline or if YouTube's CORS headers change, and never gates
  the tool's core flow.

## 7. Future improvements

- Persist the last video ID in `sessionStorage` for tab-refresh continuity.

## 8. Verified references

- CORS behaviour of `i.ytimg.com` (`Access-Control-Allow-Origin: *` on
  thumbnails) verified live 2026-08-08; earlier doc note (2026-08-06) claimed
  no CORS — that was outdated, the header is present on image responses.
- Size map: paulirish/lite-youtube-embed `youtube-thumbnail-urls.md`.
