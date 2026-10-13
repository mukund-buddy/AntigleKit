# Feature doc — Title Length Checker

Page: `tools/title-length-checker/index.html`
Logic: `assets/js/tools/title-length-checker.js` + `assets/js/validate/youtube.js`
Data: none · Catalog id: `title-length-checker` · Status: **live**

---

## 1. Why it exists

Title length is a silent killer of click-through: the 100-character hard
limit is only part of the story — emoji render wider than letters, and many
surfaces cut titles around 70 characters. A live counter that combines the
official limit, an emoji warning, and a truncation preview gives creators
one honest number to optimise against before they publish.

## 2. How it works

1. Live count against `YT_LIMITS.title` (100, verified) with a progress bar.
2. Rule rows (chk list):
   - **Over limit** — error with the exact overage.
   - **Close / Good / Great** — advisory bands at 90+ / 60–90 / < 60.
   - **Emoji** — flags emoji (`/[\u{1F300}–\u{1FAFF}\u{2600}–\u{27BF}\u{FE0F}]/u`)
     and explains they render wider than letters.
3. Truncation preview: titles longer than 70 characters are shown cut at
   ~70 with an ellipsis, labelled as approximate (surfaces vary).

## 3. Limitations

- The 70-character cut point is an approximation across surfaces, not a
  YouTube API guarantee — the UI says so explicitly.
- Width-aware "actual pixels" measurement is out of scope (no canvas font
  metrics); emoji flagging is the practical substitute.

## 4. Browser compatibility

- ES modules + `textContent`; Unicode property escapes (`/u` flag) require
  ES2018 — supported in all modern browsers; the regex is static, not eval'd.

## 5. Maintenance requirements

- Limit lives in `youtube.js` (`YT_LIMITS.title`) — single source.
- If YouTube changes the displayed truncation behaviour, update
  `TRUNCATE_AT` and the FAQ wording together.

## 6. Trade-offs

- **Advisory bands** (chosen) over a single "under limit" verdict: gives
  actionable guidance without being prescriptive.
- **Truncation preview** (chosen) over pure counting: costs an approximate
  cut point, gains the most useful signal for CTR.

## 7. Future improvements

- Optional emoji "visual width" estimate using estimated glyph widths.
- Batch check (one title per line) for series planning.

## 8. Verified references

- YouTube Help: title limit 100 characters — recorded 2026-08-06 in
  `youtube.js` (`YT_LIMITS`).
