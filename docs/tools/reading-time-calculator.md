# Feature doc — Reading Time Calculator

Page: `tools/reading-time-calculator/index.html`
Logic: `assets/js/tools/reading-time-calculator.js` over `assets/js/validate/student-tools.js`
Data: none · Catalog id: `reading-time-calculator` (category `Student`) · Status: **live**

---

## 1. Why it exists

Writers, students, and editors need to know how long a text takes to read —
for blog post lengths, speech timing, or essay pacing. Three speed presets
cover slow reading, average reading, and fast skimming. ROADMAP Phase 5a.

## 2. How it works

1. Textarea + speed tabs (slow 130 / average 200 / fast 240 wpm from
   `SPEEDS`; speaking 150 exists for future talks).
2. `countWords` in `student-tools.js` splits on Unicode-aware whitespace;
   `readingTimeMinutes(words, wpm)` = `words / wpm`.
3. Display uses `fmtTime`: ≥ 1 min → "8 min", < 1 min → "~45 sec" (no more
   "0 min" dead-end).
4. Live recalc on input; empty text shows a neutral placeholder.

## 3. Limitations

- Fixed reading-speed constants, no user speed input yet.
- Counts words only — no per-language average (e.g. Hindi/English mix).

## 4. Browser compatibility

- ES modules; universal (2020+); CSP-safe output.

## 5. Maintenance requirements

- `SPEEDS`, `countWords`, `readingTimeMinutes` pure in `student-tools.js`;
  node-tested (the 1000-words → 5 min vector lives in the shared suite).

## 6. Trade-offs

- **Fixed speed table** (chosen): the presets match the actual 130–240 wpm
  reading literature; a slider can replace them without touching the pure
  layer.

## 7. Future improvements

- Custom wpm slider; per-language reading speeds; total "speak time".

## 8. Verified references

- Average adult reading speed ~200 wpm (common publishing benchmark,
  ref-checked 2026-08-06).