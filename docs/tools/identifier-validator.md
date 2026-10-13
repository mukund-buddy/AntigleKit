# Feature doc — Identifier Validator

Page: `tools/identifier-validator/index.html`
Logic: `assets/js/tools/identifier-validator.js` + `assets/js/validate/identifier-rules.js`
Data: none (rules are code) · Catalog id: `identifier-validator` · Status: **live**

---

## 1. Why it exists

A single bad identifier (uppercase letter, leading digit, stray space) silently
breaks entities, items, tags, and commands across an add-on. Creators usually
discover this only by toggling content errors. This tool validates whole lists
at once against the verified Bedrock character rules, so the mistake is caught
before the player ever installs the pack.

## 2. How it works

All processing is client-side in the browser:

1. The user pastes identifiers one per line (lines starting with `#` are
   treated as comments; blank lines skip). A "Load sample" button inserts a
   mixed valid/invalid/warning set for demonstration.
2. `identifier-rules.js` (pure module) splits lines and, for each, checks:
   - exactly one `:` (format `namespace:name`);
   - no spaces anywhere;
   - namespace: `^[a-z_][a-z0-9_]*$`;
   - name: `^[a-z_][a-z0-9_.]*$` (dots allowed);
   - `minecraft:` namespace → **warning** (reserved for vanilla; custom
     content should use its own namespace);
   - no colon → **warning** (many contexts assume `minecraft:`), then the bare
     name is checked with the same regexes.
3. Each line renders as a row with a severity badge (`Valid`/`Warning`/`Error`),
   the identifier, and the reason(s); the summary bar shows
   `ok valid · n warnings · m errors` and an overall status badge.

## 3. Limitations

- Character-rule validation only — does not check that the referenced object
  actually exists in game or in your pack (that is a content check, not a
  format check).
- Length limits are not enforced (not verified in official docs; Bedrock has no
  documented single cap in scope of this tool).
- Case-insensitivity: the rules require lowercase, matching Bedrock
  convention; no `minecraft:` normalization is applied (we only warn).

## 4. Browser compatibility

- Requires `JSON`-free simple string ops, `RegExp` (universal), ES modules
  (Chrome 61+, Firefox 60+, Safari 11+). No other APIs.
- Works fully offline once page assets are cached.
- `identifier-rules.js` is importable from Node for regression tests.

## 5. Maintenance requirements

- If Mojang ever relaxes the character set (unlikely), update the two regexes
  in `identifier-rules.js` and re-verify against the official docs; record any
  change in ARCHITECTURE.md §2.x notes.
- The catalog row (`tools.json`) holds SEO metadata; keep the page's
  title/description/FAQ in sync with it (schema-drift rule, SEO.md).

## 6. Trade-offs

- **Line-based batch validation** (chosen) over a single-input box: real lists
  are dozens of IDs long. Cost: users with just one ID must still press enter —
  a trivial sacrifice.
- **Comment/blank tolerance** (chosen): makes it usable as a quick scratchpad.
  Cost: slightly larger parser surface.
- **No auto-fix** (chosen): renaming an identifier requires renaming every
  reference — out of scope, and dangerous to guess.

## 7. Future improvements

- Optional: detect a bare name and show the `minecraft:<name>` expansion.
- Optional: remember the last list in `localStorage` (matching the search
  feature's storage pattern) — deferred until storage on tool pages is
  reviewed for consistency.

## 8. Verified references

- Bedrock identifier rules (learn.microsoft.com + bedrock.dev), verified
  2026-08-06: `namespace:name`; lowercase a-z, 0-9, `_`; name may contain
  dots; never start with a digit; `minecraft:` reserved for vanilla.