/* design-tools.js — pure color, contrast, border-radius and glass
   helpers for the Design batch. No DOM, no network. Node-testable. */

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function clamp255(v) { return Math.round(clamp01(v / 255) * 255); }
function clamp360(v) { return ((v % 360) + 360) % 360; }
function clampL(v) { return v < 0 ? 0 : v > 100 ? 100 : v; }

/* '#rgb' | '#rrggbb' | 'rgb()' | named fallback -> {r,g,b} or null. */
export function hexToRgb(hex) {
  if (typeof hex !== 'string') return null;
  const s = hex.trim();
  const m3 = /^#([0-9a-fA-F]{3})$/.exec(s);
  if (m3) {
    return {
      r: parseInt(m3[1][0] + m3[1][0], 16),
      g: parseInt(m3[1][1] + m3[1][1], 16),
      b: parseInt(m3[1][2] + m3[1][2], 16)
    };
  }
  const m6 = /^#([0-9a-fA-F]{6})$/.exec(s);
  if (m6) {
    return {
      r: parseInt(m6[1].slice(0, 2), 16),
      g: parseInt(m6[1].slice(2, 4), 16),
      b: parseInt(m6[1].slice(4, 6), 16)
    };
  }
  return null;
}

function toHex(n) {
  return clamp255(n).toString(16).padStart(2, '0');
}

export function rgbToHex(r, g, b) {
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

export function rgbToHsl(r, g, b) {
  r = clamp255(r) / 255;
  g = clamp255(g) / 255;
  b = clamp255(b) / 255;
  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);
  var l = (max + min) / 2;
  var h = 0;
  var s = 0;
  if (max !== min) {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d) + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = clamp360(h * 60);
  }
  return { h: h, s: s * 100, l: l * 100 };
}

export function hslToRgb(h, s, l) {
  h = clamp360(h) / 360;
  s = clamp01(s / 100);
  l = clamp01(l / 100);
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
  var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  var p = 2 * l - q;
  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1 / 3) * 255
  };
}

export function hslToHex(h, s, l) {
  const c = hslToRgb(h, s, l);
  return rgbToHex(c.r, c.g, c.b);
}

/* Palette modes → list of {hex, h, s, l}. Hue rotation keeps s/l close. */
const MODE_OFFSETS = {
  complementary: [0, 180],
  analogous: [0, 30, 60, -30, -60],
  triadic: [0, 120, 240],
  triadicPlus: [0, 120, 240, 30, 210],
  splitComplementary: [0, 150, 210],
  tetradic: [0, 90, 180, 270],
  tetradicACC: [0, 90, 180, 270, 225],
  monochromatic: null
};

export function generatePalette(hex, mode) {
  const rgb = hexToRgb(hex);
  if (!rgb) return [];
  const base = rgbToHsl(rgb.r, rgb.g, rgb.b);
  if (mode === 'monochromatic') {
    return [40, 55, 70, 85].map(function (l) {
      const c = hslToRgb(base.h, base.s, l);
      return { hex: rgbToHex(c.r, c.g, c.b), h: base.h, s: base.s, l: l };
    });
  }
  if (!MODE_OFFSETS[mode]) return [];
  return MODE_OFFSETS[mode].map(function (off) {
    const h = clamp360(base.h + off);
    const c = hslToRgb(h, base.s, base.l);
    return { hex: rgbToHex(c.r, c.g, c.b), h: h, s: base.s, l: base.l };
  });
}

export function generateShades(hex, count) {
  const rgb = hexToRgb(hex);
  if (!rgb || !count) return [];
  const base = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const out = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const l = clampL(base.l + (t - 0.5) * 88);
    const c = hslToRgb(base.h, base.s, l);
    out.push({ hex: rgbToHex(c.r, c.g, c.b), h: base.h, s: base.s, l: l });
  }
  return out;
}

export function isShadesMode(mode) { return mode === 'shades'; }

/* --------- Contrast --------- */

export function relativeLuminance(r, g, b) {
  const linearize = function (c) {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const R = linearize(clamp255(r));
  const G = linearize(clamp255(g));
  const B = linearize(clamp255(b));
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrastRatio(color1, color2) {
  const a = hexToRgb(color1);
  const b = hexToRgb(color2);
  if (!a || !b) return null;
  const l1 = relativeLuminance(a.r, a.g, a.b);
  const l2 = relativeLuminance(b.r, b.g, b.b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

/* WCAG 2.1 AA/AAA for normal vs large text. */
export function wcagLevel(ratio, largeText) {
  if (ratio == null) return null;
  const aa = largeText ? 3 : 4.5;
  const aaa = largeText ? 4.5 : 7;
  if (ratio >= aaa) return 'AAA';
  if (ratio >= aa) return 'AA';
  return 'FAIL';
}

/* --------- Border radius --------- */

export function borderRadiusCss(tl, tr, br, bl) {
  const mod = function (n) { return Number(n) || 0; };
  return 'border-radius: ' +
    [mod(tl), mod(tr), mod(br), mod(bl)].map((v) => v + 'px').join(' ') + ';';
}

export function borderRadiusPctCss(tl, tr, br, bl) {
  return 'border-radius: ' + [tl, tr, br, bl].map((v) => (Number(v) || 0) + '%').join(' ') + ';';
}

/* --------- Glassmorphism --------- */

export function rgbaString(r, g, b, alpha01) {
  return 'rgba(' + clamp255(r) + ', ' + clamp255(g) + ', ' + clamp255(b) + ', ' +
    clamp01(Number(alpha01)) + ')';
}

export function glassCss(opts) {
  const o = opts || {};
  const bg = hexToRgb(o.color);
  const alpha01 = o.alpha == null ? 0.5 : (Number(o.alpha) || 0) / 100;
  const lines = [];
  lines.push('background: ' + (bg ? rgbaString(bg.r, bg.g, bg.b, alpha01) : 'rgba(255,255,255,0.3)') + ';');
  lines.push('backdrop-filter: blur(' + (Number(o.blur) || 12) + 'px) saturate(' + (Number(o.saturate) || 150) + '%);');
  lines.push('-webkit-backdrop-filter: blur(' + (Number(o.blur) || 12) + 'px) saturate(' + (Number(o.saturate) || 150) + '%);');
  lines.push('border: 1px solid rgba(255,255,255,0.25);');
  lines.push('border-radius: ' + (Number(o.radius) || 16) + 'px;');
  return lines.join('\n');
}

/* --------- SVG -------- */

/* Build a rounded-square favicon SVG from a glyph (emoji or char) with
   an optional brand-ish background. Output is a data-safe string. */
export function faviconSvg(chars, bg, fg) {
  const text = String(chars || '★').trim().slice(0, 2);
  const b = String(bg || '#7C6BFF');
  const f = String(fg || '#ffffff');
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
    '<rect width="64" height="64" rx="14" fill="' + ens(b) + '"/>',
    '<text x="32" y="34" text-anchor="middle" dominant-baseline="central"',
    ' font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, Arial, sans-serif"',
    ' font-size="34" fill="' + ens(f) + '">' + ens(text) + '</text>',
    '</svg>'
  ].join('\n');

  function ens(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
}

/* Lightweight, safe SVG minifier: trims, collapses inter-tag whitespace,
   strips XML declaration + comments, lowest-damage only. Value attributes
   in path data are NOT collapsed (keeps hand-written d safe). */
export function svgMinify(input) {
  if (typeof input !== 'string') return { ok: false, error: 'No input.' };
  let s = input.trim();
  if (!s) return { ok: false, error: 'No SVG to optimize.' };
  const hasTag = /<svg[\s>]/i.test(s);
  if (!hasTag) return { ok: false, error: 'This does not look like an SVG document.' };

  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<\?xml[^>]*\?>/gi, '');
  s = s.replace(/<!DOCTYPE[^>]*>/gi, '');

  const before = s.length;
  /* collapse whitespace runs between tags and around attribute separators */
  s = s.replace(/>\s+</g, '><');
  s = s.replace(/\s{2,}/g, ' ');
  s = s.replace(/\s*\/>/g, '/>');
  s = s.replace(/>\s+/g, '>');
  s = s.replace(/\s+</g, '<');
  s = s.replace(/[\t\n\r ]+/g, function (m) { return /[\t\n\r]/.test(m) ? ' ' : m; });
  s = s.trim();

  return {
    ok: true,
    out: s,
    bytesSaved: before - s.length,
    origBytes: input.length
  };
}

export const FAVICON_SIZES = [
  { label: 'favicon-16', size: 16 },
  { label: 'favicon-32', size: 32 },
  { label: 'favicon-48', size: 48 },
  { label: 'apple-touch-icon (180)', size: 180 },
  { label: 'android-chrome-192', size: 192 },
  { label: 'android-chrome-512', size: 512 }
];

/* --------- Presets --------- */

export const PALETTE_MODES = {
  monochromatic: 'Monochromatic',
  analogous: 'Analogous',
  complementary: 'Complementary',
  splitComplementary: 'Split complementary',
  triadic: 'Triadic',
  tetradic: 'Tetradic',
  shades: 'Shades'
};

export const PICKER_COLORS = ['#7C6BFF', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
export const GLASS_PRESETS = [
  { label: 'Frosted', color: '#ffffff', alpha: 20, blur: 12, saturate: 150, radius: 16 },
  { label: 'Dark glass', color: '#0b1120', alpha: 45, blur: 14, saturate: 120, radius: 20 },
  { label: 'Pastel', color: '#fde68a', alpha: 25, blur: 16, saturate: 180, radius: 12 }
];