# Feature doc — Password Generator

Page: `tools/password-generator/index.html`
Logic: `assets/js/tools/password-generator.js` over `assets/js/validate/security-tools.js`
Data: none · Catalog id: `password-generator` (category `security`) · Status: **live**

---

## 1. Why it exists

People still reuse weak passwords because strong ones are hard to invent. A
generator that is **cryptographically random**, guarantees one character from each
selected set, and runs entirely locally fills a daily developer + personal need
(ROADMAP Phase 5 Security).

## 2. How it works

1. A range slider (4–128) and four checkboxes pick the length and character sets
   (upper, lower, digits, symbols). An optional "exclude ambiguous" box drops
   `Il1O0`.
2. `security-tools.js → generatePassword(opts)` builds the active character pool,
   draws with `cryptoRandom()` (`crypto.getRandomValues`, `Math.random` fallback),
   then reshuffles the first position of each selected set into the result so the
   policy is always met.
3. The result, its length, and an entropy estimate render live; a `tg-copy-button`
   copies it in one tap.

## 3. Limitations

- Local randomness only — not synced to any vault. Users must save the result
  themselves (e.g. paste into a password manager).
- No "memorable passphrase" mode; this is a random-character generator only.

## 4. Browser compatibility

- `crypto.getRandomValues` / `TextEncoder` — all modern browsers. ES modules.
  Offline-safe.

## 5. Maintenance requirements

- Character-set policy lives in `validate/security-tools.js`; the page only reads
  options.

## 6. Trade-offs

- **Web Crypto randomness** (chosen) over `Math.random` for unpredictability.
- **Per-set guarantees** (chosen) so a generated password always matches the
  selected policy, at the cost of a reshuffle step.

## 7. Future improvements

- Passphrase mode (diceware-style word list).
- Strength meter inline on the generated password.
- One-click "copy + clear clipboard after N seconds".

## 8. Verified references

- `crypto.getRandomValues` (MDN) — 2026-08-08.