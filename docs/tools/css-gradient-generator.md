# Feature doc — CSS Gradient Generator

Page: `tools/css-gradient-generator/index.html`
Logic: `assets/js/tools/css-gradient-generator.js` over `assets/js/validate/css-generators.js`
Data: none · Catalog id: `css-gradient-generator` (category `web`) · Status: **live**

---

## 1. Why it exists

Gradients are everywhere in modern UI, but hand-writing `linear-gradient(45deg,
#f00 0%, #0f0 100%)` is guesswork. A visual designer — pick the angle/shape,
drag three color stops, read the CSS — is the most-requested CSS tool family
(ROADMAP Phase 3).

## 2. How it works

1. Tabs switch **Linear** (angle 0–360, optional "to bottom" style) vs
   **Radial** (circle/ellipse + position). Three color stops with `#` color
   inputs update live.
2. `css-generators.js` `linearGradientCss(angle, stops)` /
   `radialGradientCss(shape, position, stops)` build the exact
   `background-image` value.
3. **CSP-safe preview**: the page never sets `style=` attributes. The live
   `.grad-stage` div gets `style.background` assigned via the CSSOM
   (`element.style.background = value`), which the production CSP
   (`style-src 'self'`) allows — verified empirically in Playwright.
4. The generated CSS (a complete `background: …;` line) renders in a `<pre>`
   for one-click copy.

## 3. Limitations

- `background-image` syntax only (no `repeating-` variants, no `to` keyword
  mix — angle is a number).
- Stops are hard-set at three; more stops = future iteration.

## 4. Browser compatibility

- CSS `linear-gradient`/`radial-gradient` universal; CSSOM `element.style`
  assignment is CSP-exempt (`style-src` blocks inline *attributes* and
  `<style>` blocks from strings, not property sets); ES modules.

## 5. Maintenance requirements

- Keep the two builder functions pure in `css-generators.js`; node-tested.

## 6. Trade-offs

- **CSSOM-only preview** (chosen): the CSP-clean way to do live styling —
  verified `style.width` etc. work under the production CSP.
- **Three stops** (chosen) as the 95% case over a complex stop editor.

## 7. Future improvements

- Add/remove stop list; `repeating-linear-gradient`; preset swatches.

## 8. Verified references

- CSP `style-src` semantics (style attributes vs CSSOM) — tested via
  Playwright under production headers, 2026-08-06.