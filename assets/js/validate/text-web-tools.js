/* text-web-tools.js — shared pure helpers for the text/web tool batch:
   case conversion, lorem ipsum, HTML/CSS minifiers, random numbers.
   No DOM, no network. Never throws; bad input yields '' / [] / null.
   ES-stringify-safe; style mirrors student-tools.js. */

function asStr(v) {
  return typeof v === 'string' ? v : String(v == null ? '' : v);
}

function toNum(v, fallback) {
  var n = typeof v === 'number' ? v : parseFloat(String(v == null ? '' : v));
  return isFinite(n) ? n : fallback;
}

function clampInt(v, def, min, max) {
  var n = toNum(v, def);
  return Math.max(min, Math.min(max, Math.round(n)));
}

function rngFn(rng) {
  if (typeof rng === 'function') return rng;
  if (rng && typeof rng.next === 'function') return function () { return rng.next(); };
  return Math.random;
}

function toWords(s) {
  var m = s.split(/[^A-Za-z0-9]+/);
  var out = [];
  for (var i = 0; i < m.length; i++) if (m[i]) out.push(m[i]);
  return out;
}

function capWord(w) {
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

/* ── Case converter ────────────────────────────────────────────── */
export function convertCase(text, mode) {
  var s = asStr(text);
  var m = asStr(mode);
  if (!s) return '';

  switch (m) {
    case 'upper':
      return s.toUpperCase();
    case 'lower':
      return s.toLowerCase();
    case 'title':
      return s.replace(/(^|[\s'"([/-])([a-z])/g, function (all, lead, ch) {
        return lead + ch.toUpperCase();
      });
    case 'sentence':
      /* matchTools: entire string to lowercase first, then capitalize
         the first letter of every sentence. */
      return s.toLowerCase().replace(/([.!?…]+\s*|^)([a-z])/g, function (all, pre, ch) {
        return pre + ch.toUpperCase();
      });
    case 'camel':
      return camelFromWords(toWords(s), false);
    case 'pascal':
      return camelFromWords(toWords(s), true);
    case 'snake':
      return joinLower(toWords(s), '_');
    case 'kebab':
      return joinLower(toWords(s), '-');
    case 'toggle':
      return toggleCase(s);
    default:
      return s;
  }
}

function camelFromWords(words, pascal) {
  var out = '';
  for (var i = 0; i < words.length; i++) {
    var w = words[i].toLowerCase();
    if (i === 0 && !pascal) out += w;
    else out += capWord(w);
  }
  return out;
}

function joinLower(words, sep) {
  var out = [];
  for (var i = 0; i < words.length; i++) out.push(words[i].toLowerCase());
  return out.join(sep);
}

/* "toggle case" → "tOgGlE cAsE" (letters flip case one by one). */
function toggleCase(s) {
  var out = '';
  var up = false;
  for (var i = 0; i < s.length; i++) {
    var c = s.charAt(i);
    if (/[A-Za-z]/.test(c)) {
      out += up ? c.toUpperCase() : c.toLowerCase();
      up = !up;
    } else {
      out += c;
    }
  }
  return out;
}

/* ── Lorem ipsum ───────────────────────────────────────────────── */
export const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing',
  'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore',
  'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam',
  'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
  'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure',
  'in', 'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'eu',
  'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat',
  'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
];

function randomWord(rng) {
  return LOREM_WORDS[Math.floor(rng() * LOREM_WORDS.length)];
}

function sentence(words, rng) {
  var text = '';
  for (var i = 0; i < words; i++) {
    if (i) text += ' ';
    text += randomWord(rng);
  }
  text = text.replace(/^\w/, function (c) { return c.toUpperCase(); });
  return text + '.';
}

/* opts: { paragraphs, sentencesPer, startClassic } → array of paragraph strings. */
export function loremParagraphs(opts, rng) {
  var o = opts && typeof opts === 'object' ? opts : {};
  var r = rngFn(rng);
  var paras = clampInt(o.paragraphs, 4, 1, 20);
  var per = clampInt(o.sentencesPer, 4, 1, 10);
  var start = o.startClassic !== false;
  var out = [];

  for (var p = 0; p < paras; p++) {
    var para = [];
    for (var i = 0; i < per; i++) {
      if (p === 0 && i === 0 && start) {
        para.push('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.');
      } else {
        para.push(sentence(6 + Math.floor(r() * 8), r));
      }
    }
    out.push(para.join(' '));
  }
  return out;
}

/* ── HTML minifier ─────────────────────────────────────────────── */
/* Tokenizer keeps the inside of pre/textarea/script/style untouched. */

var HTML_RAW = ['pre', 'textarea', 'script', 'style'];

export function minifyHtml(text, opts) {
  var s = asStr(text);
  if (!s) return '';
  var o = opts && typeof opts === 'object' ? opts : {};
  var removeComments = o.removeComments !== false;
  var out = [];
  var i = 0;
  var len = s.length;

  function tagNameAt(start) {
    var j = start + 1;
    while (j < len) {
      var c = s.charAt(j);
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '>') break;
      j++;
    }
    return s.slice(start + 1, j).toLowerCase();
  }

  function tagEndAt(start) {
    var q = '';
    var j = start + 1;
    while (j < len) {
      var c = s.charAt(j);
      if (q) {
        if (c === q) q = '';
      } else if (c === '"' || c === "'") {
        q = c;
      } else if (c === '>') {
        return j;
      }
      j++;
    }
    return -1;
  }

  /* Protected content: copy verbatim up to `</name`, then emit the closer. */
  function copyRaw(from, name) {
    var lower = name.toLowerCase();
    var inner = s.toLowerCase().indexOf('</' + lower, from);
    if (inner === -1) { out.push(s.slice(from)); return len; }
    out.push(s.slice(from, inner + lower.length + 2));
    var gt = s.indexOf('>', inner);
    if (gt === -1) { out.push('>'); return len; }
    out.push(s.charAt(gt));
    return gt + 1;
  }

  while (i < len) {
    if (s.charAt(i) !== '<') {
      var nt = s.indexOf('<', i);
      if (nt === -1) { out.push(collapseText(s.slice(i))); break; }
      out.push(collapseText(s.slice(i, nt)));
      i = nt;
      continue;
    }

    /* comment */
    if (s.slice(i, i + 4) === '<!--') {
      var ce = s.indexOf('-->', i + 4);
      if (ce === -1) break;
      if (!removeComments) out.push(s.slice(i, ce + 3));
      i = ce + 3;
      continue;
    }

    /* <!DOCTYPE …> and friends stay untouched. */
    if (s.charAt(i + 1) === '!') {
      var de = s.indexOf('>', i);
      if (de === -1) break;
      out.push(s.slice(i, de + 1));
      i = de + 1;
      continue;
    }

    var name = tagNameAt(i);
    if (!name) { out.push('<'); i++; continue; }
    var end = tagEndAt(i);
    if (end === -1) { out.push(s.slice(i)); break; }

    var tag = s.slice(i, end + 1);
    var selfClose = /\/\s*>$/.test(tag);
    var closing = s.charAt(i + 1) === '/';
    out.push(collapseText(tag));

    if (!selfClose && !closing && HTML_RAW.indexOf(name) !== -1) {
      i = copyRaw(end + 1, name);
    } else {
      i = end + 1;
    }
  }

  return out.join('');
}

/* Total whitespace between tags: keep at most a single rendered space
   (only if the run actually contained one), else nothing. */
function whitespaceRun(str) {
  return /[ \t\u00A0]/.test(str) ? ' ' : '';
}

/* Collapse runs of whitespace to a single space, preserving one rendered
   space between inline elements but dropping newline-only gaps between
   block tags. Quoted attribute values are never touched because the
   quote state switches the normalizer off inside them. */
function collapseText(str) {
  if (!/\S/.test(str)) return whitespaceRun(str);
  var out = '';
  var q = '';
  var pending = false;
  for (var i = 0; i < str.length; i++) {
    var c = str.charAt(i);
    if (q) {
      out += c;
      if (c === q && str.charAt(i - 1) !== '\\') q = '';
      continue;
    }
    if (c === '"' || c === "'") { if (pending) out += ' '; pending = false; q = c; out += c; continue; }
    if (/\s/.test(c)) { pending = out.length > 0; continue; }
    if (pending) { out += ' '; pending = false; }
    out += c;
  }
  return out;
}

/* ── CSS minifier ─────────────────────────────────────────────── */
/* A tiny lexer: comments stripped; strings and url() kept verbatim;
   whitespace dropped only in positions safe for CSS grammar. */

function dropAfter(c) { return c === '{' || c === '(' || c === ':' || c === ',' || c === ';' || c === '>'; }
function dropBefore(c) { return c === '}' || c === ')' || c === ',' || c === ';' || c === '{'; }

export function minifyCss(text, opts) {
  var s = asStr(text);
  if (!s) return '';
  var o = opts && typeof opts === 'object' ? opts : {};
  var dropFinalSemi = o.removeLastSemicolon !== false;

  var out = [];
  var i = 0;
  var len = s.length;
  var pendingSpace = false;
  var pendingSemi = false;

  /* Emit the pending space (if any) before a new significant char. */
  function reconcile(c) {
    if (pendingSemi) {
      if (!(dropFinalSemi && c === '}')) out.push(';');
      pendingSemi = false;
    }
    if (pendingSpace) {
      var last = out.length ? out[out.length - 1] : '';
      if (last && last !== ' ' && !dropAfter(last) && !dropBefore(c)) out.push(' ');
      pendingSpace = false;
    }
  }

  while (i < len) {
    var c = s.charAt(i);

    /* comment */
    if (c === '/' && s.charAt(i + 1) === '*') {
      var ce = s.indexOf('*/', i + 2);
      if (ce === -1) break;
      i = ce + 2;
      continue;
    }

    /* string — copy verbatim including escapes */
    if (c === '"' || c === "'") {
      reconcile(c);
      var q = c;
      out.push(c);
      i++;
      while (i < len) {
        var x = s.charAt(i);
        out.push(x);
        if (x === '\\' && i + 1 < len) { out.push(s.charAt(i + 1)); i += 2; continue; }
        i++;
        if (x === q) break;
      }
      continue;
    }

    /* url( … ) — copy through the closing paren, ignoring quotes/parens inside */
    if (c === 'u' && /url\s*\(/i.test(s.slice(i, i + 6))) {
      var open = i + 3;
      while (open < len && /\s/.test(s.charAt(open))) open++;
      if (s.charAt(open) === '(') {
        reconcile('(');
        var close = findUrlClose(s, open + 1);
        if (close >= open) {
          out.push(s.slice(i, open + 1));
          out.push(s.slice(open + 1, close));
          out.push(')');
          i = close + 1;
          continue;
        }
      }
    }

    /* whitespace — remember, decide on the next significant char */
    if (/\s/.test(c)) { pendingSpace = out.length > 0; i++; continue; }

    if (c === ';') {
      pendingSemi = true;
      pendingSpace = false;
      i++;
      continue;
    }

    reconcile(c);
    out.push(c);
    i++;
  }
  reconcile(' ');
  if (pendingSemi && !dropFinalSemi) out.push(';');
  pendingSemi = false;

  return out.join('');
}

function findUrlClose(s, start) {
  var depth = 1;
  var i = start;
  var q = '';
  while (i < s.length) {
    var c = s.charAt(i);
    if (q) {
      if (c === q) q = '';
      else if (c === '\\') { i += 2; continue; }
    } else if (c === '"' || c === "'") {
      q = c;
    } else if (c === '(') {
      depth++;
    } else if (c === ')') {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return s.length - 1;
}

/* ── Random numbers ───────────────────────────────────────────── */
export function randomNumbers(opts, rng) {
  var o = opts && typeof opts === 'object' ? opts : {};
  var r = rngFn(rng);
  var min = toNum(o.min, 1);
  var max = toNum(o.max, 100);
  if (min > max) { var t = min; min = max; max = t; }

  var count = clampInt(o.count, 10, 1, 1000);
  var decimals = clampInt(o.decimals, 0, 0, 6);
  var unique = o.unique === true || o.allowDuplicates === false;
  var sorted = o.sorted === true;

  var factor = Math.pow(10, decimals);
  var lo = Math.round(min * factor);
  var hi = Math.round(max * factor);

  /* unique draws need a pool; guard against gigantic ranges */
  if (unique && hi - lo + 1 > 2000000) {
    return { list: [], stats: null };
  }

  var list = [];
  if (unique) {
    var span = hi - lo + 1;
    var need = Math.min(count, span);
    var pool = new Array(span);
    for (var k = 0; k < span; k++) pool[k] = lo + k;
    for (var m = span - 1; m > 0; m--) {
      var idx = Math.floor(r() * (m + 1));
      var tmp = pool[m]; pool[m] = pool[idx]; pool[idx] = tmp;
    }
    for (var a = 0; a < need; a++) list.push(roundFloat(pool[a], factor));
  } else {
    for (var b = 0; b < count; b++) {
      list.push(roundFloat(lo + Math.floor(r() * (hi - lo + 1)), factor));
    }
  }

  if (sorted) list.sort(function (x, y) { return x - y; });

  return {
    list: list,
    stats: statsOf(list)
  };
}

function roundFloat(v, factor) {
  return Math.round(v) / factor;
}

function statsOf(list) {
  if (!list.length) return null;
  var min = Infinity, max = -Infinity, sum = 0;
  for (var i = 0; i < list.length; i++) {
    var v = list[i];
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  return { min: min, max: max, sum: sum, avg: sum / list.length };
}