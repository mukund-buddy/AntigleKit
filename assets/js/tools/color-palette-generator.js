/* color-palette-generator.js — harmonious palettes from one seed color.
   CSP-safe (CSSOM only). */
import { generatePalette, generateShades, hexToRgb, PALETTE_MODES, PICKER_COLORS } from '../validate/design-tools.js';

const $ = (id) => document.getElementById(id);

const SWATCH_COUNT = 5;

function bgOf(hex, alpha) {
  const c = hexToRgb(hex);
  return c ? 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + alpha + ')' : '';
}

function render() {
  const hex = $('cpColor').value;
  const mode = $('cpMode').value;

  let colors;
  if (mode === 'shades') {
    colors = generateShades(hex, 6);
  } else {
    colors = generatePalette(hex, mode === 'shades' ? 'monochromatic' : mode);
    while (colors.length < SWATCH_COUNT) colors = colors.concat(colors);
    colors = colors.slice(0, SWATCH_COUNT);
  }

  const stage = $('cpStage');
  stage.textContent = '';

  const swatches = document.createElement('div');
  swatches.className = 'palette-swatches';

  colors.forEach(function (c) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'palette-swatch';
    cell.title = c.hex;
    cell.style.backgroundColor = c.hex;

    const label = document.createElement('span');
    label.className = 'palette-swatch-label';
    label.textContent = c.hex.toUpperCase();
    cell.appendChild(label);

    cell.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(c.hex.toUpperCase()).then(function () {
          setNote(c.hex.toUpperCase() + ' copied');
        }, function () { setNote('Copy failed — select manually'); });
      } else {
        setNote('Copy not supported here');
      }
    });

    swatches.appendChild(cell);
  });
  stage.appendChild(swatches);

  const outLines = [];
  outLines.push('/* ' + PALETTE_MODES[mode] + ' from ' + hex.toUpperCase() + ' */');
  outLines.push(':root {');
  colors.forEach(function (c, i) {
    outLines.push('  --c' + (i + 1) + ': ' + c.hex.toLowerCase() + ';');
  });
  outLines.push('}');
  $('cpOut').textContent = outLines.join('\n');
  $('cpCssCount').textContent = colors.length + ' colors';
}

function setNote(msg) {
  const n = $('cpDetected');
  n.className = 'chk-detected';
  n.textContent = msg;
}

function renderModeOptions() {
  const sel = $('cpMode');
  Object.keys(PALETTE_MODES).forEach(function (k) {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = PALETTE_MODES[k];
    sel.appendChild(opt);
  });
}

function wire() {
  $('colorInput').addEventListener('input', function () {
    const v = $('colorInput').value.trim();
    if (/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(v)) {
      $('cpColor').value = v;
      render();
    }
  });
  $('cpColor').addEventListener('input', render);
  $('cpMode').addEventListener('change', render);
  $('fSample').addEventListener('click', function () {
    const pick = PICKER_COLORS[Math.floor(Math.random() * PICKER_COLORS.length)];
    $('cpColor').value = pick;
    $('colorInput').value = pick;
    render();
    setNote('New seed color loaded');
  });
}

function init() {
  renderModeOptions();
  render();
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}