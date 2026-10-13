# Feature doc — Grid Generator

Page: `tools/grid-generator/index.html`
Logic: `assets/js/tools/grid-generator.js` over `assets/js/validate/css-generators.js`
Data: none · Catalog id: `grid-generator` (category `web`) · Status: **live**

---

## 1. Why it exists

CSS grid is the modern two-dimensional layout system, and the
`repeat(3, 1fr)` idiom is what most sites want. A tool that lets you pick the
column count and gap while cells reflow live — and hands you the exact
`grid-template-columns` — completes the CSS generator family (ROADMAP
Phase 3).

## 2. How it works

1. Controls: column count (1–6 slider), gap (0–40px slider), and a "show row
   lines" checkbox that switches the stage border from dashed to solid.
2. `css-generators.js` `gridCss(opts)` emits `display: grid`,
   `grid-template-columns: repeat(N, 1fr)`, and `gap` — the copy-ready block.
3. Eight numbered `.preview-cell` elements are (re)built per render and laid
   out by the live grid via CSSOM — auto-placement does the rest, so changing
   the column count visibly reflows cells into new rows.
4. The status line reports "N equal columns, M rows visible, G px gap".
   Presets jump to 2/3/4/6 columns.

## 3. Limitations

- Equal `1fr` columns only — no asymmetric templates (`2fr 1fr`), no
  fixed/`minmax()` tracks, no `grid-template-areas`.
- Fixed 8-cell sample; item placement (span) is out of scope.

## 4. Browser compatibility

- CSS grid universal (2020+); CSSOM preview CSP-safe; ES modules.

## 5. Maintenance requirements

- `gridCss` pure in `css-generators.js`; node-tested.

## 6. Trade-offs

- **`repeat(N, 1fr)` only** (chosen): the dominant real-world template; the
  slider model stays honest about what it generates.
- **Rebuild cells on render** (chosen) over reuse — trivial cost, keeps the
  layout deterministic.

## 7. Future improvements

- Template presets (asymmetric tracks, areas); align/justify items controls;
  item span/placement.

## 8. Verified references

- MDN grid template columns / fr unit — 2026-08-06.