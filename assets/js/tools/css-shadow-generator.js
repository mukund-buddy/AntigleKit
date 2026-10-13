/* css-shadow-generator.js — live box-shadow designer. CSP-safe (CSSOM). */
import { boxShadowCss } from '../validate/css-generators.js';

const $ = (id) => document.getElementById(id);

function hexToRgb(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + (alpha / 100).toFixed(2) + ')';
}

function render() {
  const x = Number($('shX').value);
  const y = Number($('shY').value);
  const blur = Number($('shBlur').value);
  const spread = Number($('shSpread').value);
  const op = Number($('shOpacity').value);
  const color = hexToRgb($('shColor').value, op);

  const css = boxShadowCss(x, y, blur, spread, color, $('shInset').checked);
  const preview = $('shPreview');
  preview.style.boxShadow = css;
  $('shOut').textContent = 'box-shadow: ' + css + ';';
  $('shDetected').textContent = (blur === 0 || spread === color ? 'Sharp' : 'Soft') + ' shadow ' +
    ($('shInset').checked ? '· inset' : '') + ' · ' + Math.round(x) + 'px / ' + Math.round(y) + 'px · rgba alpha ' + op + '%';
  $('shXOut').textContent = x + 'px';
  $('shYOut').textContent = y + 'px';
  $('shBlurOut').textContent = blur + 'px';
  $('shSpreadOut').textContent = spread + 'px';
  $('shOpacityOut').textContent = op + '%';
}

function set(x, y, blur, spread, op, inset) {
  $('shX').value = x;
  $('shY').value = y;
  $('shBlur').value = blur;
  $('shSpread').value = spread;
  $('shOpacity').value = op;
  $('shInset').checked = inset;
  render();
}

const PRESETS = {
  'Card': [2, 8, 24, 0, 40, false],
  'Elevated': [0, 12, 32, -4, 45, false],
  'Glow': [0, 0, 24, 0, 80, false],
  'Inset pressed': [0, 3, 8, 0, 50, true]
};

function wire() {
  ['shX', 'shY', 'shBlur', 'shSpread', 'shOpacity', 'shColor'].forEach(function (id) {
    $(id).addEventListener('input', render);
  });
  $('shInset').addEventListener('change', render);
  $('fSample').addEventListener('click', function () {
    const names = Object.keys(PRESETS);
    const name = names[Math.floor(Math.random() * names.length)];
    const vals = PRESETS[name];
    set(vals[0], vals[1], vals[2], vals[3], vals[4], vals[5]);
    $('shDetected').textContent = 'Loaded preset: ' + name + '.';
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