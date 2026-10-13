# Feature doc — Chapter Formatter

Page: `tools/chapter-formatter/index.html`
Logic: `assets/js/tools/chapter-formatter.js` + `assets/js/validate/chapters.js`
Data: none · Catalog id: `chapter-formatter` · Status: **live**

---

## 1. Why it exists

Chapter notes arrive messy: bullet points, numbering, timestamps at either
end of the line, brackets and parentheses. Pasting that into YouTube either
fails or produces chapters that never display because one quiet rule is
broken. A formatter that normalizes anything and then *checks the display
rules* converts a fiddly, error-prone paste into a reliable publish step.

## 2. How it works

1. Each line is parsed by `parseChapterLine` (timestamps accepted first
   (`0:00 Title`) or last (`Title 0:00`), with optional `( )` `[ ]`
   wrapping). `stripListMarks` removes bullets (`-`, `–`, `—`, `•`, `*`,
   `#`) and numbering (`1.` `1)`).
2. `buildChapters` skips unparseable lines; they are reported as "Skipped"
   rows — never silently dropped.
3. Output normalizes every chapter to `00:00 Title` (`formatTimestamp`
   long style), a format YouTube accepts alongside `0:00`.
4. `analyzeChapters` enforces the display rules: starts at 0:00, ≥ 3
   chapters, ascending order, every chapter ≥ 10 seconds. Each failure is a
   chk row with an actionable message ("Start the first chapter at 0:00…").

## 3. Limitations

- Timestamps with seconds but no zero padding are normalized (`0:05` → `00:05`);
  hours are supported up to 99:59:59.
- Non-adjacent gaps are fine; the tool does not add padding chapters.
- The 3-chapter minimum is a warning, not a hard error — YouTube still
   ignores shorter lists, so the message explains why.

## 4. Browser compatibility

- Pure ES module; `textContent`-only rendering. Works offline.

## 5. Maintenance requirements

- Rule changes belong in `validate/chapters.js` (Node-tested).
- Keep the FAQ's "why aren't my chapters showing" answer aligned with the
  verified rules list.

## 6. Trade-offs

- **Skipped-line reporting** (chosen) over dropping junk silently: costs a
  few extra list rows, saves users from mysterious missing chapters.
- **Long-format output** (chosen) over short: zero-padded times look
  deliberate in descriptions; both are accepted by YouTube.

## 7. Future improvements

- Duplicate-title detection (identical chapter names).
- Optional plain-text export for scripts/notes files.

## 8. Verified references

- YouTube Help 9884579 (chapter display rules) — recorded 2026-08-06 in
  `chapters.js` header; regex variants covered by the 74-test suite.
