# Feature doc — Pinterest Pin Saver

Page: `tools/pinterest-downloader/index.html`
Logic: `assets/js/tools/pinterest-downloader.js`
Data: none · Catalog id: `pinterest-downloader` · Status: **live**

---

## 1. Why it exists

Pinterest is the second most common "download an image" request after YouTube
thumbnails. The tool previews any pin — photo or video — via Pinterest's own
official embed widget, then guides the user to save the image with the
browser's built-in save menu (right-click → Save image as…, or press-and-hold
on Android/iPhone). No account, no upload, no server.

## 2. How it works

1. The pin link is parsed client-side: `pinterest.com/pin/<id>` on any
   regional TLD, or a bare 10–25 digit pin number. `pin.it` short links are
   rejected with a clear message (they cannot be resolved in a browser
   without a network fetch) instructing the user to open the pin once and
   paste the full link.
2. The pin is rendered with Pinterest's official embed widget:
   `https://assets.pinterest.com/ext/embed.html?id=<id>&src=oembed&width=600`
   inside a fixed-ratio iframe (`aspect-ratio: 600/1000`, width-driven so it
   scales fluidly on any screen; the ratio fits 2:3 portrait pins, which are
   the most common on Pinterest, without clipping the footer).
3. A shimmer skeleton shows until the iframe `load` fires; a 12 s timeout
   falls back to "open the pin on Pinterest" guidance instead of a silent
   blank frame.
4. A platform-aware hint (iOS / Android / desktop) explains the correct save
   gesture, alongside **Open on Pinterest** and **Copy link** actions.
5. A quiet "Please use responsibly" callout and an FAQ explain the rights
   situation and why there is no direct Download button.

## 3. Limitations

- **No direct file download.** Pinterest serves `i.pinimg.com` and its video
  CDN without `Access-Control-Allow-Origin` and with no working JSONP, and
  every public CORS proxy was verified blocked (corsproxy.io → 403
  "server-side requests not allowed on your plan", allorigins → HTTP 520,
  codetabs → blocked, Microlink → antibot/EPROXYNEEDED). With no backend
  (hard platform rule: static site only), a fetch+blob download is
  impossible; the browser's own save menu is the lawful equivalent.
- Video pins play inside the official player; the video file itself can only
  be saved via the Pinterest app. This is stated honestly on the page.
- The embed renders at Pinterest's served size; the saved image is what
  Pinterest serves to its official widget (full quality, not re-encoded).

## 4. Browser compatibility

- ES modules + `iframe` + `navigator.clipboard` (with `execCommand` fallback).
- The iframe embed requires Pinterest's `assets.pinterest.com` to be framable
  — it is, by design (official widget used across the web).
- CSP: `/_headers` adds `frame-src https://assets.pinterest.com`
  (2026-08-19); without it the embed is blocked on the deployed site even
  though it works on `localhost` (which sends no CSP).

## 5. Maintenance requirements

- If Pinterest changes the embed URL format (`ext/embed.html`), update
  `EMBED_BASE` in `assets/js/tools/pinterest-downloader.js`; the FAQ wording
  may need a matching tweak.
- If Pinterest ever serves proper CORS headers, a direct download button
  could be added — see below.
- Iframe ratio (600/1000) is tuned for 2:3 portrait pins; very wide
  landscape pins get vertical whitespace (centered, deliberate).

## 6. Trade-offs

- **Official embed** (chosen) over scraping pin pages or proxying oEmbed:
  fully lawful, no ToS violation, no server, and it renders video pins too.
- **Centered single-column layout** (chosen) over the two-panel tool layout:
  one obvious path (paste → preview → save) keeps the page calm on mobile,
  where the pin is the whole point.
- **Fixed-ratio iframe** (chosen) over pixel-measured embeds: cross-origin
  content cannot be measured client-side; the ratio guarantees no clipping
  for the dominant pin format while staying fluid.

## 7. Future improvements

- Direct download button, if Pinterest ever adds CORS headers.
- `pin.it` short-link resolution is impossible without a backend; if a
  Cloudflare Pages Function is ever allowed (current rule: no backend), it
  could resolve short links with a single server-side redirect.

## 8. Verified references

- Pinterest oEmbed endpoint (`oembed.json`) returns data server-side only;
  browser fetch → `TypeError: Failed to fetch` (no CORS), JSONP → timeout.
  Verified live 2026-08-19.
- `i.pinimg.com` image CDN: no CORS headers at 236x/474x/736x/originals —
  `fetch`+`blob` download blocked. Verified live 2026-08-19.
- Official embed widget `assets.pinterest.com/ext/embed.html?id=…&src=oembed`
  renders image pins and video pins, including the pin's own Save button.
  Verified live 2026-08-19 with pin `617415430169271912`.
- CORS proxies (corsproxy.io, allorigins, codetabs, Microlink) all blocked or
  behind paid plans. Verified live 2026-08-19.
