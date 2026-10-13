# Feature doc — Timestamp Generator

Page: `tools/timestamp-generator/index.html`
Logic: `assets/js/tools/timestamp-generator.js` + `assets/js/validate/chapters.js`
Data: none · Catalog id: `timestamp-generator` · Status: **live**

---

## 1. Why it exists

When scripting a video you think in **durations** ("intro is 30 seconds,
building section two minutes"), not absolute markers. Editing a mid-video
segment means recomputing every later timestamp by hand — a classic source of
stale chapters. Generating absolute times by summing durations removes the
arithmetic and produces a list that is already checked against YouTube's
chapter acceptance rules.

## 2. How it works

1. One segment per line: `Name DURATION`, where DURATION is `0:30`
   (m:ss), `1:20:05` (h:mm:ss), or a bare number of seconds (`45`).
   Leading bullets/numbering are stripped (`parseDurationLine`).
2. `buildChaptersFromDurations` sums segments into absolute start times.
3. Output lines use `formatTimestamp` in short (`0:00`) or long (`00:00`)
   style — both accepted by YouTube — plus the total video length.
4. `analyzeChapters` reports the three rules that make chapters appear:
   must start at `0:00`, ≥ 3 chapters, every chapter ≥ 10 seconds
   (YouTube Help 9884579). Errors/warnings render as chk rows; unparsed
   lines are listed under "Skipped" so nothing vanishes silently.

## 3. Limitations

- Durations are not validated against the actual uploaded video — YouTube
  re-syncs and may drop the last chapter if the total overruns the video.
- Bare seconds are capped at 99:59:59 (`MAX_CHAPTER_SECONDS`).
- Segment order is preserved as typed; no sorting.

## 4. Browser compatibility

- Pure ES module logic; no DOM APIs beyond `textContent`. Works offline.

## 5. Maintenance requirements

- Any YouTube chapter-rule change goes into `validate/chapters.js` first
  (Node-tested, 74 tests covering parse/format/analyze paths).

## 6. Trade-offs

- **Live rendering on input** (chosen): results update as you type.
- **Durations over absolute times** (chosen): this tool's whole point is
  computing absolute times; the Chapter Formatter handles the reverse.

## 7. Future improvements

- Optional "sync to video duration" field that clips the final chapter.
- CSV export of the segment table.

## 8. Verified references

- YouTube Help 9884579 (chapter requirements: 0:00 start, ≥ 3 timestamps,
  10-second minimum) — recorded 2026-08-06 in `chapters.js`.
