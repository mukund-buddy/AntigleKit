# Feature doc — JSON Validator

Page: `tools/json-validator/index.html`
Logic: `assets/js/tools/json-validator.js` over `assets/js/validate/json-tools.js`
Data: none · Catalog id: `json-validator` (category `web`) · Status: **live**

---

## 1. Why it exists

Most JSON "validators" just turn everything red. This one tells you exactly
*were* the problem is — line, column, and a snippet — which is what developers
actually need when a pasted payload fails to load. Ships in the core web batch
(ROADMAP Phase 3).

## 2. How it works

1. Paste JSON and choose a mode: **Validate** (parse + report) or validate
   from the Formatter's sibling UI. Empty input and whitespace-only input are
   reported as "nothing to check".
2. `json-tools.js` runs `JSON.parse` through `parseJson`. On success it shows
   top-level type, key count at depth 1, nesting depth, and byte size.
3. On failure, `parseErrorPosition` maps the native message to a character
   offset, then an index scan converts that to `line` and `column`. The report
   prints "line L, column C" plus the offending line with a caret marker, and
   the error summary channel surfaces a clean `OK` / `Invalid` verdict.
4. No network calls; validation is synchronous and instant.

## 3. Limitations

- Applies strict `JSON.parse` rules — no JSON5, no comments, no trailing
  commas. That is the correct strictness for a validator.
- Detected `valid`/`invalid` statuses are single-value; schema/business-rule
  validation (types, required keys) is out of scope.

## 4. Browser compatibility

- ES modules + `JSON.parse`; universal. Works offline.

## 5. Maintenance requirements

- Keep in sync with the Formatter: both share `json-tools.js`, so a wording
  change in parse errors is fixed once. Run the module tests after any change.

## 6. Trade-offs

- **Strict validator + clear errors** (chosen) over a permissive "fixer" —
  fixing silently is dangerous with data. Ambiguity is surfaced, not hidden.
- **Line scan indexes** chosen over `String.raw` re-parsing for speed on large
  payloads.

## 7. Future improvements

- Basic schema hints (expected type at the failing key) as a follow-up.
- Batch validate a JSON file upload (.json) via reader.

## 8. Verified references

- `JSON.parse` error text across browser engines (MDN / testing) — 2026-08-06.