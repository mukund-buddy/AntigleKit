# Feature doc — Word Counter

Page: `tools/word-counter/index.html`
Logic: `assets/js/tools/word-counter.js` over `assets/js/validate/student-tools.js`
Data: none · Catalog id: `word-counter` (category `Student`) · Status: **live**

---

## 1. Why it exists

Essay word limits, SEO content targets, social captions — "how many words is
this?" is a daily check. This counter adds sentences/paragraphs plus reading
time from the same text, all live. ROADMAP Phase 5a Student core.

## 2. How it works

1. Textarea; every input re-runs `countWords`, `countSentences`,
   `countParagraphs`, `countChars`.
2. `countWords` splits on Unicode-aware whitespace (trimmed, blanks
   excluded); `countSentences` splits on `. ! ?` (stripping trailing
   punctuation, counting terminal-mark runs); `countParagraphs` splits on
   blank-line runs.
3. Reading time = `countWords ÷ SPEEDS.reading` via `readingTimeMinutes`,
   with the same `fmtTime` (<1 min → seconds) as the Reading Time tool.
4. The big three (words / chars / read-time) plus sentence and paragraph
   counts render read-only; nothing writes inline styles.

## 3. Limitations

- Sentence splitter is punctuation-based — abbreviations ("Dr.") count one
  extra sentence; smart-quote/format edges not fully normalized.
- No per-line breakdown or per-language stopwords.

## 4. Browser compatibility

- ES modules + template strings; universal (2020+); CSP-safe.

## 5. Maintenance requirements

- Counting functions pure in `student-tools.js`; node-tested (words/sentence
  paragraph vectors incl. the read-time line in the shared suite).

## 6. Trade-offs

- **Punctuation-based sentences** (chosen): simple, deterministic, and
  node-testable; sentence *quality* metrics stay out of scope.

## 7. Future improvements

- Reading-ease bonus (Flesch); keyword density; per-paragraph counts.

## 8. Verified references

- Word/sentence/paragraph counting conventions are universal; no vendor
  reference needed (verified 2026-08-06).