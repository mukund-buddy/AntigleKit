# Feature doc — CGPA Calculator

Page: `tools/cgpa-calculator/index.html`
Logic: `assets/js/tools/cgpa-calculator.js` over `assets/js/validate/student-tools.js`
Data: none · Catalog id: `cgpa-calculator` (category `Student`) · Status: **live**

---

## 1. Why it exists

CGPA (Cumulative Grade Point Average) is the credit-weighted average nearly
every Indian/Commonwealth university report card eventually asks for. A
pastable "grade credits" textarea does it instantly and per-line honestly.
ROADMAP Phase 5a Student core.

## 2. How it works

1. Textarea takes lines like `A 4` or `B+ 3` (grade + credits; flexible
   separators via `cgpaFromText`).
2. `cgpaFromRows` consumes rows of `{ grade, credits }`, maps the grade to
   its point via the internal grade table, and returns `sum(points *
   credits) / sum(credits)` — credit-weighted, so a 4-credit A dominates a
   1-credit A−.
3. Unknown grades are reported line-by-line and skipped (never silently
   zeroing the result); zero total credits throws a user-facing error.
4. Live recalc; the tool prints the weighted average and a per-invalid-line
   note.

## 3. Limitations

- Fixed 10-point grade table (A=10 … F=0) — no per-university scaling yet.
- No percentage ↔ CGPA conversion; single-blocks only (no term weighting).

## 4. Browser compatibility

- ES modules; universal (2020+). CSP-safe DOM writes (`textContent`, CSSOM).

## 5. Maintenance requirements

- `cgpaFromRows`/`cgpaFromText` pure in `student-tools.js`; node-tested
  (credit-weighting vector in the shared suite).

## 6. Trade-offs

- **Grade table hard-coded** (chosen): honesty over configurability — the
  docs page states the 10-point scale; a custom-scale mode can follow.

## 7. Future improvements

- Custom scale switcher (4.3/10-point/percentage); multi-semester cumulative
  rollup.

## 8. Verified references

- Standard CGPA = Σ(points × credits)/Σ(credits) convention —
  2026-08-06.