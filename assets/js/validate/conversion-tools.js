/* conversion-tools.js — pure unit-conversion helpers for the unit
   converter batch. No DOM, no network. Node-testable. Never throws;
   hostile input yields { ok:false, error }.
   Style mirrors text-web-tools.js / barcode-tools.js. */

function asStr(v) {
  return typeof v === 'string' ? v : String(v == null ? '' : v);
}

function isPlainObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function safe(fn, fallback) {
  try {
    return fn();
  } catch (e) {
    return fallback;
  }
}

/* ── Unit catalogs ───────────────────────────────────────────────── */
/* factor = units per base unit; base unit has factor 1. */
var UNITS = {
  length: {
    id: 'length', label: 'Length',
    units: [
      { id: 'mm', label: 'Millimetres (mm)', factor: 0.001 },
      { id: 'cm', label: 'Centimetres (cm)', factor: 0.01 },
      { id: 'm', label: 'Metres (m)', factor: 1 },
      { id: 'km', label: 'Kilometres (km)', factor: 1000 },
      { id: 'in', label: 'Inches (in)', factor: 0.0254 },
      { id: 'ft', label: 'Feet (ft)', factor: 0.3048 },
      { id: 'yd', label: 'Yards (yd)', factor: 0.9144 },
      { id: 'mi', label: 'Miles (mi)', factor: 1609.344 },
      { id: 'nmi', label: 'Nautical miles (nmi)', factor: 1852 }
    ]
  },
  mass: {
    id: 'mass', label: 'Mass / weight',
    units: [
      { id: 'mg', label: 'Milligrams (mg)', factor: 0.000001 },
      { id: 'g', label: 'Grams (g)', factor: 0.001 },
      { id: 'kg', label: 'Kilograms (kg)', factor: 1 },
      { id: 't', label: 'Tonnes (t)', factor: 1000 },
      { id: 'oz', label: 'Ounces (oz)', factor: 0.028349523125 },
      { id: 'lb', label: 'Pounds (lb)', factor: 0.45359237 },
      { id: 'st', label: 'Stones (st)', factor: 6.35029318 }
    ]
  },
  temperature: {
    id: 'temperature', label: 'Temperature',
    units: [
      { id: 'c', label: 'Celsius (°C)', kind: 'offset', offset: 0 },
      { id: 'f', label: 'Fahrenheit (°F)', kind: 'offset', offset: 32, scale: 9 / 5 },
      { id: 'k', label: 'Kelvin (K)', kind: 'offset', offset: 273.15 }
    ]
  },
  volume: {
    id: 'volume', label: 'Volume',
    units: [
      { id: 'ml', label: 'Millilitres (ml)', factor: 0.001 },
      { id: 'l', label: 'Litres (l)', factor: 1 },
      { id: 'm3', label: 'Cubic metres (m³)', factor: 1000 },
      { id: 'cm3', label: 'Cubic centimetres (cm³)', factor: 0.001 },
      { id: 'tsp', label: 'Teaspoons (US)', factor: 0.00492892159375 },
      { id: 'tbsp', label: 'Tablespoons (US)', factor: 0.01478676478125 },
      { id: 'cup', label: 'Cups (US)', factor: 0.2365882365 },
      { id: 'floz', label: 'Fluid ounces (US)', factor: 0.0295735295625 },
      { id: 'pt', label: 'Pints (US)', factor: 0.473176473 },
      { id: 'qt', label: 'Quarts (US)', factor: 0.946352946 },
      { id: 'gal', label: 'Gallons (US)', factor: 3.785411784 }
    ]
  },
  area: {
    id: 'area', label: 'Area',
    units: [
      { id: 'mm2', label: 'Square millimetres (mm²)', factor: 0.000001 },
      { id: 'cm2', label: 'Square centimetres (cm²)', factor: 0.0001 },
      { id: 'm2', label: 'Square metres (m²)', factor: 1 },
      { id: 'km2', label: 'Square kilometres (km²)', factor: 1000000 },
      { id: 'ha', label: 'Hectares (ha)', factor: 10000 },
      { id: 'sqin', label: 'Square inches (in²)', factor: 0.00064516 },
      { id: 'sqft', label: 'Square feet (ft²)', factor: 0.09290304 },
      { id: 'sqyd', label: 'Square yards (yd²)', factor: 0.83612736 },
      { id: 'acre', label: 'Acres', factor: 4046.8564224 },
      { id: 'sqmi', label: 'Square miles (mi²)', factor: 2589988.110336 }
    ]
  },
  time: {
    id: 'time', label: 'Time',
    units: [
      { id: 'ms', label: 'Milliseconds (ms)', factor: 0.001 },
      { id: 's', label: 'Seconds (s)', factor: 1 },
      { id: 'min', label: 'Minutes (min)', factor: 60 },
      { id: 'h', label: 'Hours (h)', factor: 3600 },
      { id: 'd', label: 'Days (d)', factor: 86400 },
      { id: 'wk', label: 'Weeks', factor: 604800 },
      { id: 'mo', label: 'Months (30 days)', factor: 2592000 },
      { id: 'yr', label: 'Years (365 days)', factor: 31536000 }
    ]
  },
  data: {
    id: 'data', label: 'Digital storage',
    units: [
      { id: 'bit', label: 'Bits (bit)', factor: 0.125 },
      { id: 'b', label: 'Bytes (B)', factor: 1 },
      { id: 'kb', label: 'Kilobytes (KB)', factor: 1000 },
      { id: 'mb', label: 'Megabytes (MB)', factor: 1000000 },
      { id: 'gb', label: 'Gigabytes (GB)', factor: 1000000000 },
      { id: 'tb', label: 'Terabytes (TB)', factor: 1000000000000 },
      { id: 'kib', label: 'Kibibytes (KiB)', factor: 1024 },
      { id: 'mib', label: 'Mebibytes (MiB)', factor: 1048576 },
      { id: 'gib', label: 'Gibibytes (GiB)', factor: 1073741824 },
      { id: 'tib', label: 'Tebibytes (TiB)', factor: 1099511627776 }
    ]
  },
  speed: {
    id: 'speed', label: 'Speed',
    units: [
      { id: 'ms', label: 'Metres/second (m/s)', factor: 1 },
      { id: 'kmh', label: 'Kilometres/hour (km/h)', factor: 0.2777777777777778 },
      { id: 'mph', label: 'Miles/hour (mph)', factor: 0.44704 },
      { id: 'knot', label: 'Knots (kn)', factor: 0.5144444444444445 },
      { id: 'fts', label: 'Feet/second (ft/s)', factor: 0.3048 }
    ]
  }
};

function categoryInfo(id) {
  return UNITS[id] || null;
}

/* List of unit ids for a category (excluding unit metadata). */
export function unitList(id) {
  var cat = categoryInfo(asStr(id));
  if (!cat) return [];
  return cat.units.map(function (u) { return { id: u.id, label: u.label }; });
}

export function conversionCategories() {
  return Object.keys(UNITS).map(function (k) {
    return { id: UNITS[k].id, label: UNITS[k].label };
  });
}

function findUnit(cat, id) {
  var found = null;
  cat.units.some(function (u) {
    if (u.id === id) { found = u; return true; }
    return false;
  });
  return found;
}

/* Convert value (number) from one unit id to another within a category. */
export function convertValue(value, fromUnitId, toUnitId, categoryId) {
  var v = Number(value);
  if (typeof value === 'string' && value.trim() === '') {
    return { ok: false, error: 'Enter a value to convert.' };
  }
  if (!isFinite(v)) {
    return { ok: false, error: 'That value is not a valid number.' };
  }
  var cat = categoryInfo(asStr(categoryId));
  if (!cat) return { ok: false, error: 'Unknown category.' };
  var from = findUnit(cat, asStr(fromUnitId));
  var to = findUnit(cat, asStr(toUnitId));
  if (!from || !to) return { ok: false, error: 'Unknown unit.' };

  var celsius;
  if (from.kind === 'offset') {
    if (from.scale) celsius = (v - from.offset) / from.scale;
    else celsius = v - from.offset;
    if (to.scale) return { ok: true, value: celsius * to.scale + to.offset, fromUnit: from.id, toUnit: to.id };
    return { ok: true, value: celsius + to.offset, fromUnit: from.id, toUnit: to.id };
  }

  var base = v * from.factor;
  var result = base / to.factor;
  return { ok: true, value: result, fromUnit: from.id, toUnit: to.id };
}

/* Format a result for display: up to 12 significant digits, no trailing zeros. */
export function formatValue(value, maxSig) {
  var v = Number(value);
  if (!isFinite(v)) return '—';
  var sig = typeof maxSig === 'number' && maxSig > 0 ? maxSig : 12;
  var abs = Math.abs(v);
  if (abs !== 0 && (abs >= 1e15 || abs < 1e-9)) {
    return v.toExponential(Math.min(sig - 1, 6));
  }
  if (abs >= 1) {
    var rounded = Number(v.toPrecision(sig));
    return String(rounded);
  }
  var fixed = v.toFixed(10);
  var trimmed = fixed.replace(/0+$/, '').replace(/\.$/, '');
  return trimmed;
}

/* Swap the from/to roles for a UI swap button. */
export function swapUnits(fromId, toId) {
  return { fromUnitId: toId, toUnitId: fromId };
}

export var conversionCatalog = UNITS;
