/* css-generators.js — pure CSS builders for gradients, box-shadows,
   flexbox and grid. No DOM, no network. Node-testable. */

/* stops: [{ color: '#f00', position: 0|'' }] — empty position means
   auto (no stop). */
function stopsCss(stops) {
  return stops.map(function (s) {
    var c = String(s.color || '').trim();
    if (!c) return '';
    if (s.position !== '' && s.position != null && !isNaN(Number(s.position))) {
      return c + ' ' + Number(s.position) + '%';
    }
    return c;
  }).filter(Boolean).join(', ');
}

export function linearGradientCss(angle, stops) {
  return 'linear-gradient(' + (Number(angle) || 0) + 'deg, ' + stopsCss(stops) + ')';
}

export function radialGradientCss(shape, position, stops) {
  var head = shape === 'circle' ? 'circle' : 'ellipse';
  if (position) head += ' at ' + position;
  return 'radial-gradient(' + head + ', ' + stopsCss(stops) + ')';
}

export function boxShadowCss(x, y, blur, spread, color, inset) {
  var parts = [];
  if (inset) parts.push('inset');
  parts.push((Number(x) || 0) + 'px ' + (Number(y) || 0) + 'px ' + (Number(blur) || 0) + 'px ' + (Number(spread) || 0) + 'px');
  parts.push(String(color || '#000').trim());
  return parts.join(' ');
}

export function flexboxCss(opts) {
  var lines = ['display: flex;'];
  if (opts.direction && opts.direction !== 'row') lines.push('flex-direction: ' + opts.direction + ';');
  if (opts.justify && opts.justify !== 'flex-start') lines.push('justify-content: ' + opts.justify + ';');
  if (opts.align && opts.align !== 'stretch') lines.push('align-items: ' + opts.align + ';');
  if (opts.wrap && opts.wrap !== 'nowrap') lines.push('flex-wrap: ' + opts.wrap + ';');
  if (opts.gap) lines.push('gap: ' + Number(opts.gap) + 'px;');
  return lines.join('\n');
}

export function gridCss(opts) {
  var lines = ['display: grid;'];
  if (opts.columns) lines.push('grid-template-columns: ' + opts.columns + ';');
  if (opts.rows) lines.push('grid-template-rows: ' + opts.rows + ';');
  if (opts.gap) lines.push('gap: ' + Number(opts.gap) + 'px;');
  return lines.join('\n');
}
