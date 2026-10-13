# Feature doc — Attendance Calculator

Page: `tools/attendance-calculator/index.html`
Logic: `assets/js/tools/attendance-calculator.js` over `assets/js/validate/student-tools.js`
Data: none · Catalog id: `attendance-calculator` (category `Student`) · Status: **live**

---

## 1. Why it exists

Indian colleges cut students below a threshold (usually 75%). The evergreen
question is "how many can I skip, or do I need to attend every remaining
class?" This tool answers it with planning math, and — unlike most tools —
is honest when attendance can no longer be saved. ROADMAP Phase 5a Student.

## 2. How it works

1. Inputs: attended, held, planned (remaining classes), threshold (default
   75, clamped 0–100).
2. `attendanceBreakdown(attended, held, planned, threshold)` returns
   `{pct, held, attended, threshold, planned, future, mustAttend, canSkip,
   targetAttended, reachable, state}`.
3. Guards: `attended > held` or `held <= 0` → `null` (UI shows an error,
   never a fabricated number).
4. Planning accesses the honest two branches:
   - reachable → "attend ≥ N of the remaining M to stay ≥ 75%" (can skip
     M−N);
   - unreachable → even attending all M gives only X%, with the real
     percentage stated instead of a fake "attend at least N".

## 3. Limitations

- Assumes every remaining class counts 1 toward total; no per-period
  weighting / already-declared attendance.
- Single threshold at a time.

## 4. Browser compatibility

- ES modules + CSSOM live styling; universal (2020+).

## 5. Maintenance requirements

- `attendanceBreakdown` pure in `student-tools.js`; node-tested via the
  att-reachable and att-unreachable cases in the shared suite.

## 6. Trade-offs

- **Honest unreachable messaging** (chosen) over the common fake
  "attend ≥ N": the tool never promises the impossible, which protects the
  product's math credibility.

## 7. Future improvements

- Absolute dates per class; threshold presets (60/65/70/75/80/85).

## 8. Verified references

- 75% attendance convention widely used across Indian universities
  (tool is faithful to the formula; anecdat verified 2026-08-06).