/* css-gradient-generator.js — live linear/radial gradient designer with
   copy-ready CSS. CSP-safe (CSSOM only). */
import { linearGradientCss, radialGradientCss } from '../validate/css-generators.js';

const $ = (id) => document.getElementById(id);

const MODE = { value: 'linear' };

function stops() {
  return [
    { color: $('gdC1').value, position: Number($('gdP1').value) },
    { color: $('gdC2').value, position: Number($('gdP2').value) },
    { color: $('gdC3').value, position: Number($('gdP3').value) }
  ];
}

function currentCss() {
  const s = stops();
  if (MODE.value === 'linear') {
    return linearGradientCss(Number($('gdAngle').value), s);
  }
  return radialGradientCss($('gdShape').value, $('gdPos').value, s);
}

function setMode(mode) {
  MODE.value = mode;
  $('tabLinear').classList.toggle('is-active', mode === 'linear');
  $('tabRadial').classList.toggle('is-active', mode === 'radial');
  $('tabLinear').setAttribute('aria-selected', mode === 'linear' ? 'true' : 'false');
  $('tabRadial').setAttribute('aria-selected', mode === 'radial' ? 'true' : 'false');
  $('rowAngle').hidden = mode !== 'linear';
  $('rowRadial').hidden = mode !== 'radial';
  render();
}

function render() {
  const css = currentCss();
  const preview = $('gdPreview');
  preview.style.background = css;
  $('gdOut').textContent = 'background: ' + css + ';';
  $('gdDetected').textContent = MODE.value === 'linear'
    ? 'Linear, ' + $('gdAngle').value + '°, ' + stops().filter(function (s) { return s.position >= 0; }).length + ' stops.'
    : 'Radial ' + $('gdShape').value + ($('gdPos').value ? ' at ' + $('gdPos').value : ' centered') + ', 3 stops.';
  $('gdAngleOut').textContent = $('gdAngle').value + '°';
  $('gdP1Out').textContent = $('gdP1').value + '%';
  $('gdP2Out').textContent = $('gdP2').value + '%';
  $('gdP3Out').textContent = $('gdP3').value + '%';
}

function randomColor() {
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
}

function wire() {
  $('tabLinear').addEventListener('click', function () { setMode('linear'); });
  $('tabRadial').addEventListener('click', function () { setMode('radial'); });
  ['gdAngle', 'gdC1', 'gdP1', 'gdC2', 'gdP2', 'gdC3', 'gdP3', 'gdShape', 'gdPos'].forEach(function (id) {
    $(id).addEventListener('input', render);
  });
  $('fSample').addEventListener('click', function () {
    $('gdC1').value = randomColor();
    $('gdC2').value = randomColor();
    $('gdC3').value = randomColor();
    render();
  });
}

function init() {
  setMode('linear');
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}