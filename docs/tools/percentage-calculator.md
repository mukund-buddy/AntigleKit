# Feature doc — Percentage Calculator

Page: `tools/percentage-calculator/index.html`
Logic: `assets/js/tools/percentage-calculator.js` over `assets/js/validate/student-tools.js`
Data: none · Catalog id: `percentage-calculator` (category `Student`) · Status: **live**

---

## 1. Why it exists

Percentages are the most-asked everyday math question. Four modes cover the
cases people actually type into a calculator app: "what is P% of N", "what
percent of N is M", "percent change between two numbers", and "percent
difference between two numbers". ROADMAP Phase 5a Student core.

## 2. How it works

1. Mode tabs (of / what-percent / change / difference) switch the visible
   inputs via `setMode`; zero-total inputs are rejected.
2. `percentageOf(part, total)` → `part/total*100`; mode "of" uses
   `valueOfPercent(p, total)`.
3. `percentChange(old, new)` → `(new-old)/old*100` — signed, with the value
   passed directly to CSSOM; `percentDifference(a,b)` → `|a-b|/((a+b)/2)`
   (midpoint difference).
4. Live recalc on input; totals of 0 produce an explicit error state instead
   of `Infinity/NaN`.

## 3. Limitations

- No compound/percentage-of-percentage chains; single operation per mode.
- Margin-of-error rounding not annotated (decimal rounding only).

## 4. Browser compatibility

- ES modules + modern TC39; CSP-safe CSSOM output. Universal (2020+).

## 5. Maintenance requirements

- `percentageOf`/`valueOfPercent`/`percentChange`/`percentDifference` are
  pure in `student-tools.js`; node-tested in the shared suite.

## 6. Trade-offs

- **Midpoint difference** (chosen): gives a symmetric answer for both
  growth and decline without choosing a base; documented to the user via
  the mode label.

## 7. Future improvements

- Percent-of-percentage chains; percentage point vs percent distinction;
  negative-value awareness.

## 8. Verified references

- Midpoint difference formula (ref-confirmed standard technique) —
  2026-08-06.