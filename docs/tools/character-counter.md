# Feature doc — Character Counter

Page: `tools/character-counter/index.html`
Logic: `assets/js/tools/character-counter.js` over `assets/js/validate/student-tools.js`
Data: none · Catalog id: `character-counter` (category `Student`) · Status: **live**

---

## 1. Why it exists

Titles, bios, SMS, tweets, meta descriptions — every platform enforces a
character ceiling. This counter shows raw counts (with/without spaces) and
then checks them against the five limits people actually hit. ROADMAP
Phase 5a Student core.

## 2. How it works

1. Textarea input; live counts: `countChars(text, true)` (with spaces),
   `countChars(text, false)` (without spaces), plus word estimate.
2. Limit-check lines render ✓/✗ against `CHAR_LIMITS` —
   `{ meta: 160, sms: 160, tweet: 280, bio: 60, title: 100 }` — each line
   `Name (N): count/N`.
3. The summary line ("Fits every checked limit." / "Fits n of m limits —
   over by X") uses a `chk-detected` state class applied via CSSOM;
   `WORD_LIMITS` (the sibling limits list) is reserved for a future
   word-mode.
4. Empty text neutralizes to a placeholder; no inline styles ever.

## 3. Limitations

- ASCII-oriented; emoji are multi-codepoint but counted as codepoints, so a
  BIO may still show a mismatch against a platform's display-length rule.
- No paste-from-clipboard "smart count" (only what's in the box).

## 4. Browser compatibility

- ES modules; universal (2020+); CSP-safe (state via className, never
  `style=`).

## 5. Maintenance requirements

- `CHAR_LIMITS` + `countChars` pure in `student-tools.js`; node-tested
  (fits-all and over-bio vectors in the shared suite).

## 6. Trade-offs

- **Codepoint counting** (chosen): simple, deterministic, honest for plain
  text; the docs page notes the emoji caveat rather than silently fixing it.

## 7. Future improvements

- Word-mode limit presets; grapheme-aware counting for emoji-heavy text.

## 8. Verified references

- SMS 160, tweet 280, meta 160, bio 60, title 100 — platform limits
  (ref-checked 2026-08-06).