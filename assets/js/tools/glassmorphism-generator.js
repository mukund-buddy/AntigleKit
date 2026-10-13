/* glassmorphism-generator.js — frosted-glass panel preview + CSS output.
   CSP-safe (CSSOM only). */
import { glassCss, GLASS_PRESETS } from '../validate/design-tools.js';

const $ = (id) => document.getElementById(id);

function render() {
  const opts = {
    color: $('glColor').value,
    alpha: Number($('glAlpha').value),
    blur: Number($('glBlur').value),
    saturate: Number($('glSaturate').value),
    radius: Number($('glRadius').value)
  };

  const panel = $('glPanel');
  const c = hexToRgbGl(opts.color);
  panel.style.backgroundColor = c ? 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + (opts.alpha / 100).toFixed(2) + ')' : 'rgba(255,255,255,0.3)';
  panel.style.backdropFilter = 'blur(' + opts.blur + 'px) saturate(' + opts.saturate + '%)';
  panel.style.webkitBackdropFilter = 'blur(' + opts.blur + 'px) saturate(' + opts.saturate + '%)';
  panel.style.borderRadius = opts.radius + 'px';

  $('glAlphaOut').textContent = opts.alpha + '%';
  $('glBlurOut').textContent = opts.blur + 'px';
  $('glSaturateOut').textContent = opts.saturate + '%';
  $('glRadiusOut').textContent = opts.radius + 'px';

  $('glOut').textContent = glassCss(opts);
}

function hexToRgbGl(hex) {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex) || /^#([0-9a-fA-F]{3})$/.exec(hex);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map(function (x) { return x + x; }).join('');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  };
}

function wire() {
  ['glAlpha', 'glBlur', 'glSaturate', 'glRadius'].forEach(function (id) {
    $(id).addEventListener('input', render);
  });
  $('glColor').addEventListener('input', render);
  $('fSample').addEventListener('click', function () {
    const p = GLASS_PRESETS[Math.floor(Math.random() * GLASS_PRESETS.length)];
    $('glColor').value = p.color;
    $('glAlpha').value = p.alpha;
    $('glBlur').value = p.blur;
    $('glSaturate').value = p.saturate;
    $('glRadius').value = p.radius;
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