# Feature doc — CSS Shadow Generator

Page: `tools/css-shadow-generator/index.html`
Logic: `assets/js/tools/css-shadow-generator.js` over `assets/js/validate/css-generators.js`
Data: none · Catalog id: `css-shadow-generator` (category `web`) · Status: **live**

---

## 1. Why it exists

`box-shadow` is powerful and unreadable: `0 4px 12px rgba(0,0,0,.25)` hides
six knobs. A slider-driven designer with a live shadowed box and copy-ready
CSS is the second pillar of the CSS-generator family (ROADMAP Phase 3).

## 2. How it works

1. Controls: X offset, Y offset, blur, spread, opacity (→ alpha), color
   (`#` input), and an `inset` toggle. All update live.
2. `css-generators.js` `boxShadowCss(x, y, blur, spread, color, inset)`
   returns e.g. `0 8px 24px 0 rgba(0,0,0,0.25)`; the hex→rgba conversion is
   internal so the alpha slider composes correctly.
3. **Presets** (soft, layered, card, neon…) jump the sliders to known-good
   values — instant inspiration without typing.
4. Live preview via CSSOM (`element.style.boxShadow = value`) — CSP-safe
   (same verified path as the Gradient Generator). The full declaration
   renders in a `<pre>` for copy.

## 3. Limitations

- Single shadow layer only (no comma-joined multi-shadow list — future).
- `color` uses the hex input; named colors/`currentColor` not supported.

## 4. Browser compatibility

- `box-shadow` universal; CSSOM assignment CSP-safe; ES modules.

## 5. Maintenance requirements

- `boxShadowCss` pure in `css-generators.js`; node-tested.

## 6. Trade-offs

- **Opacity-as-alpha** (chosen): the most common real workflow; the raw hex
  stays editable so rgba isn't forced.
- **Single shadow** (chosen) over a layer manager for v1.

## 7. Future improvements

- Multi-layer list; `text-shadow` mode; presets from named design systems.

## 8. Verified references

- MDN box-shadow syntax — 2026-08-06.