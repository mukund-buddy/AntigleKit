/* border-radius-generator.js — visual corner-radius preview with
   per-corner sliders. CSP-safe (CSSOM only). */
import { borderRadiusCss, borderRadiusPctCss } from '../validate/design-tools.js';

const $ = (id) => document.getElementById(id);

function render() {
  const tl = Number($('radTL').value);
  const tr = Number($('radTR').value);
  const br = Number($('radBR').value);
  const bl = Number($('radBL').value);
  const pct = $('radUnit').value === 'pct';

  const box = $('radBox');
  box.style.borderRadius = pct
    ? [tl, tr, br, bl].map((v) => v + '%').join(' ')
    : [tl, tr, br, bl].map((v) => v + 'px').join(' ');

  const css = pct ? borderRadiusPctCss(tl, tr, br, bl) : borderRadiusCss(tl, tr, br, bl);
  $('radOut').textContent = css;

  ['radTL', 'radTR', 'radBR', 'radBL'].forEach(function (id) {
    const o = $(id + 'Out');
    if (o) o.textContent = $(id).value + (pct ? '%' : 'px');
  });

  $('radDetected').textContent = 'Corners: ' + [tl, tr, br, bl].join(' · ') + (pct ? ' %' : ' px');
}

function wire() {
  ['radTL', 'radTR', 'radBR', 'radBL'].forEach(function (id) {
    $(id).addEventListener('input', render);
  });
  $('radUnit').addEventListener('change', render);
  $('fAll').addEventListener('click', function () {
    const v = $('radAll').value;
    ['radTL', 'radTR', 'radBR', 'radBL'].forEach(function (id) { $(id).value = v; });
    render();
  });
  $('fSample').addEventListener('click', function () {
    const presets = [
      [16, 16, 16, 16], [50, 50, 50, 50], [30, 6, 30, 6], [6, 30, 6, 30], [0, 20, 0, 20]
    ];
    const p = presets[Math.floor(Math.random() * presets.length)];
    ['radTL', 'radTR', 'radBR', 'radBL'].forEach(function (id, i) { $(id).value = p[i]; });
    render();
  });
}

function init() {
  render();
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}