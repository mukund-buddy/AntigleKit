/* grid-generator.js — live CSS grid designer with auto-placed cells.
   CSP-safe (CSSOM only). */
import { gridCss } from '../validate/css-generators.js';

const $ = (id) => document.getElementById(id);

const CELLS = 8;

function buildCells(stage, count) {
  stage.textContent = '';
  for (let i = 1; i <= count; i++) {
    const cell = document.createElement('div');
    cell.className = 'preview-cell';
    cell.textContent = String(i);
    stage.appendChild(cell);
  }
}

function render() {
  const cols = Number($('grCols').value);
  const gap = Number($('grGap').value);
  const showLines = $('grLines').checked;

  const opts = {
    columns: 'repeat(' + cols + ', 1fr)',
    gap: gap
  };

  const stage = $('grPreview');
  buildCells(stage, CELLS);
  stage.style.gridTemplateColumns = opts.columns;
  stage.style.gap = gap + 'px';
  stage.style.borderStyle = showLines ? 'solid' : 'dashed';
  const cells = stage.querySelectorAll('.preview-cell');
  for (let i = 0; i < cells.length; i++) {
    cells[i].style.gridColumn = '';
    cells[i].style.background = '';
  }

  const css = gridCss(opts);
  $('grOut').textContent = css;
  $('grDetected').textContent = cols + ' equal column' + (cols === 1 ? '' : 's') + ', ' + Math.ceil(CELLS / cols) + ' rows visible, ' + gap + 'px gap.';
  $('grColsOut').textContent = String(cols);
  $('grGapOut').textContent = gap + 'px';
}

const PRESETS = [
  { cols: 2, gap: 16 },
  { cols: 3, gap: 12 },
  { cols: 4, gap: 24 },
  { cols: 6, gap: 8 }
];

function wire() {
  $('grCols').addEventListener('input', render);
  $('grGap').addEventListener('input', render);
  $('grLines').addEventListener('change', render);
  $('fSample').addEventListener('click', function () {
    const p = PRESETS[Math.floor(Math.random() * PRESETS.length)];
    $('grCols').value = p.cols;
    $('grGap').value = p.gap;
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