# Feature doc — Regex Tester

Page: `tools/regex-tester/index.html`
Logic: `assets/js/tools/regex-tester.js` over `assets/js/validate/regex-tools.js`
Data: none · Catalog id: `regex-tester` (category `web`) · Status: **live**

---

## 1. Why it exists

Regex is the highest-traffic "test tool" category on the web, and the
built-in console is hostile for iterating. A live tester that highlights
matches in the sample text, counts them, exposes flags, and surfaces compile
errors in plain language is a top-tier SEO tool (ROADMAP Phase 3).

## 2. How it works

1. Type a pattern and (optionally) flags `g`, `i`, `m`; paste sample text.
   Everything re-evaluates on input.
2. `regex-tools.js` `compileRegex` wraps `new RegExp(pattern, flags)` and
   returns `{ ok, error }` — a malformed pattern shows the engine message
   instead of crashing the page.
3. Highlighting: matches are located by repeated `exec` on the sample (with
   zero-width match safety — a zero-length match advances manually), then the
   sample is re-rendered in a `<pre>` with `.mark-match` spans: the **first**
   match purple, subsequent matches green (`.mark-match--first`).
4. The hit cap is 2000 marks — beyond that the page reports "capped" instead
   of freezing. The status line shows match count and active flags.
5. Without `g`, a single match is highlighted (standard non-global behavior).

## 3. Limitations

- JavaScript regex flavor only (no PCRE lookbehind-features that V8 lacks —
  V8 supports lookbehind; no atomic groups/backtracking verbs).
- Zero-width matches are marked but can't be counted naively — handled by the
  advance-on-empty rule.
- Cap of 2000 marks guards pathological `catastrophic backtracking`-style
  inputs; larger corpora are out of scope for a paste-based tool.

## 4. Browser compatibility

- Native `RegExp`; ES modules; offline-safe. Lookbehind needs Chrome 62+ /
  Firefox 78+ / Safari 16.4+ — universal for 2026 browsers.

## 5. Maintenance requirements

- Keep the mark-cap and zero-width handling in `regex-tools.js` (node-tested
  against the 24-case suite in `temp`).

## 6. Trade-offs

- **First-match-purple convention** (chosen) so the user can see *which*
  match their captures came from; documented in page copy.
- **2000-mark cap** (chosen) over unlimited: a tester should never hang a
  tab.

## 7. Future improvements

- Capture-group pane (group 1/2/3 values per match) and replace preview.

## 8. Verified references

- MDN RegExp flags and zero-width matches — 2026-08-06.