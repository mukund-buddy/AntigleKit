/* unit-converter.js — instant conversions across eight unit families.
   CSP-safe: creates <option> elements, no innerHTML with data. */
import {
  conversionCategories,
  unitList,
  convertValue,
  formatValue,
  swapUnits
} from '../validate/conversion-tools.js';

const $ = (id) => document.getElementById(id);

function fillSelect(sel, items) {
  sel.textContent = '';
  items.forEach(function (it) {
    const opt = document.createElement('option');
    opt.value = it.id;
    opt.textContent = it.label;
    sel.appendChild(opt);
  });
}

function unitLabel(catId, unitId) {
  const items = unitList(catId);
  for (let i = 0; i < items.length; i++) {
    if (items[i].id === unitId) return items[i].label;
  }
  return unitId;
}

function populateCategory(preserve) {
  const cat = $('ucCategory').value;
  const fromVal = preserve ? $('ucFrom').value : null;
  const toVal = preserve ? $('ucTo').value : null;
  const items = unitList(cat);
  if (!items.length) return;

  fillSelect($('ucFrom'), items);
  fillSelect($('ucTo'), items);

  let from = fromVal && items.some(function (i) { return i.id === fromVal; }) ? fromVal : items[0].id;
  let to = toVal && items.some(function (i) { return i.id === toVal; }) ? toVal : items[Math.min(1, items.length - 1)].id;
  $('ucFrom').value = from;
  $('ucTo').value = to;
  convert();
}

function convert() {
  const res = convertValue($('ucValue').value, $('ucFrom').value, $('ucTo').value, $('ucCategory').value);
  const err = $('ucError');
  const valueEl = $('ucResultValue');
  const unitEl = $('ucResultUnit');
  const noteEl = $('ucNote');
  const plainEl = $('ucResultPlain');

  if (!res || !res.ok) {
    valueEl.textContent = '—';
    unitEl.textContent = '';
    plainEl.textContent = '';
    noteEl.textContent = '';
    err.textContent = (res && res.error) || 'Could not convert that value.';
    err.hidden = false;
    return;
  }

  err.hidden = true;
  valueEl.textContent = formatValue(res.value);
  unitEl.textContent = unitLabel($('ucCategory').value, res.toUnit);
  plainEl.textContent = formatValue(res.value) + ' ' + unitLabel($('ucCategory').value, res.toUnit);
  noteEl.textContent = 'Converted ' + unitLabel($('ucCategory').value, res.fromUnit) + ' → ' + unitLabel($('ucCategory').value, res.toUnit);
}

function wire() {
  $('ucCategory').addEventListener('change', function () { populateCategory(false); });
  $('ucFrom').addEventListener('change', convert);
  $('ucTo').addEventListener('change', convert);
  $('ucValue').addEventListener('input', convert);
  $('ucSwap').addEventListener('click', function () {
    const swapped = swapUnits($('ucFrom').value, $('ucTo').value);
    $('ucFrom').value = swapped.fromUnitId;
    $('ucTo').value = swapped.toUnitId;
    convert();
  });
  $('ucValue').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      convert();
    }
  });
}

function init() {
  const cats = conversionCategories();
  fillSelect($('ucCategory'), cats);
  if (cats.length) $('ucCategory').value = 'length';
  populateCategory(false);
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
