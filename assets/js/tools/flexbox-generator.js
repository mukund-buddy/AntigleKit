/* flexbox-generator.js — live flexbox designer with real children.
   CSP-safe (CSSOM only). */
import { flexboxCss } from '../validate/css-generators.js';

const $ = (id) => document.getElementById(id);

function render() {
  const opts = {
    direction: $('fxDir').value,
    justify: $('fxJustify').value,
    align: $('fxAlign').value,
    wrap: $('fxWrap').value,
    gap: Number($('fxGap').value)
  };
  const stage = $('fxPreview');
  stage.style.flexDirection = opts.direction;
  stage.style.justifyContent = opts.justify;
  stage.style.alignItems = opts.align;
  stage.style.flexWrap = opts.wrap;
  stage.style.gap = opts.gap + 'px';

  const css = flexboxCss(opts);
  $('fxOut').textContent = css;
  /* also give preview children a defensive width so wrap is visible */
  stage.style.width = '100%';

  $('fxDetected').textContent = [
    opts.direction + (opts.direction !== 'row' ? ' direction' : ''),
    opts.justify !== 'flex-start' ? 'justify ' + opts.justify : '',
    opts.align !== 'stretch' ? 'align ' + opts.align : '',
    opts.wrap !== 'nowrap' ? 'wrapping' : '',
    opts.gap ? opts.gap + 'px gap' : 'no gap'
  ].filter(Boolean).join(' · ') || 'Defaults (row, stretch, no gap).';
  $('fxGapOut').textContent = opts.gap + 'px';
}

const PRESETS = [
  { dir: 'row', justify: 'space-between', align: 'center', wrap: 'nowrap', gap: 16 },
  { dir: 'column', justify: 'flex-start', align: 'center', wrap: 'nowrap', gap: 20 },
  { dir: 'row', justify: 'space-evenly', align: 'flex-start', wrap: 'wrap', gap: 12 },
  { dir: 'row-reverse', justify: 'flex-end', align: 'flex-end', wrap: 'nowrap', gap: 8 }
];

function wire() {
  ['fxDir', 'fxJustify', 'fxAlign', 'fxWrap'].forEach(function (id) {
    $(id).addEventListener('change', render);
  });
  $('fxGap').addEventListener('input', render);
  $('fSample').addEventListener('click', function () {
    const p = PRESETS[Math.floor(Math.random() * PRESETS.length)];
    $('fxDir').value = p.dir;
    $('fxJustify').value = p.justify;
    $('fxAlign').value = p.align;
    $('fxWrap').value = p.wrap;
    $('fxGap').value = p.gap;
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