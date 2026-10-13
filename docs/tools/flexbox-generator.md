# Feature doc — Flexbox Generator

Page: `tools/flexbox-generator/index.html`
Logic: `assets/js/tools/flexbox-generator.js` over `assets/js/validate/css-generators.js`
Data: none · Catalog id: `flexbox-generator` (category `web`) · Status: **live**

---

## 1. Why it exists

Flexbox's 10+ properties are *behavioral*: you can't tell what
`justify-content: space-between` will do from reading it. A generator with
real child elements that re-layout live — and emits the CSS that produced the
exact layout — teaches and ships in one tool (ROADMAP Phase 3).

## 2. How it works

1. Controls: `flex-direction` (row/row-reverse/column/column-reverse),
   `justify-content`, `align-items`, `flex-wrap`, and a `gap` slider. A
   random preset button ("Try a preset") demonstrates layouts.
2. `css-generators.js` `flexboxCss(opts)` emits the five declarations; the
   page applies them to the `.flex-stage` via CSSOM (CSP-safe).
3. The three preview children are real elements, so wrapping, cross-axis
   alignment, and direction reversals are all visibly true — including
   `gap` spacing.
4. The status line summarizes the active combination ("space-between, 16px
   gap"); the CSS block is copy-ready in a `<pre>`.

## 3. Limitations

- Container properties only (no `flex-grow/shrink/basis` per item, no
   `align-content` — the 95% of use cases).
- `gap` is px-only via slider.

## 4. Browser compatibility

- Flexbox universal (since 2015-era); CSSOM preview CSP-safe; ES modules.

## 5. Maintenance requirements

- `flexboxCss` pure in `css-generators.js`; node-tested.

## 6. Trade-offs

- **Real children in preview** (chosen) over a painted mock — the tool
  teaches behavior, and there's nothing fake to desync.
- **Container-only scope** (chosen) for v1; item properties are the natural
  v2.

## 7. Future improvements

- Per-item flex properties; `align-content`; visual alignment guides.

## 8. Verified references

- MDN flexbox layout (container properties) — 2026-08-06.