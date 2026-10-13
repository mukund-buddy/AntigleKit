/* student-tools.js — pure percentage/CGPA/attendance/counting/reading-time
   helpers. No DOM, no network. Node-testable. */

function num(v) {
  var n = typeof v === 'number' ? v : parseFloat(String(v == null ? '' : v).replace(',', '.').replace(/[^\d.\-]/g, ''));
  return isFinite(n) ? n : null;
}

/* Percentage: what percent is `part` of `total`, plus the numeric value. */
export function percentageOf(part, total) {
  var p = num(part);
  var t = num(total);
  if (p === null || t === null || t === 0) return null;
  return { percent: p / t * 100, value: p };
}

/* Value = percent% of total. */
export function valueOfPercent(percentVal, total) {
  var pr = num(percentVal);
  var t = num(total);
  if (pr === null || t === null) return null;
  return t * pr / 100;
}

/* Percentage change old -> new. */
export function percentChange(oldVal, newVal) {
  var o = num(oldVal);
  var n = num(newVal);
  if (o === null || n === null || o === 0) return null;
  return (n - o) / o * 100;
}

/* Central percentage difference between two values. */
export function percentDifference(a, b) {
  var x = num(a);
  var y = num(b);
  if (x === null || y === null || x + y === 0) return null;
  return Math.abs(x - y) / ((x + y) / 2) * 100;
}

/* CGPA from rows of {grade, credits}; fails (null) with no valid rows. */
export function cgpaFromRows(rows) {
  var sum = 0;
  var cred = 0;
  if (!Array.isArray(rows)) return null;
  rows.forEach(function (r) {
    var g = num(r.grade);
    var c = num(r.credits);
    if (g === null || c === null || g < 0) return;
    sum += g * c;
    cred += c;
  });
  return cred === 0 ? null : sum / cred;
}

/* Parse "grade credits" pairs (one per line or space separated). */
export function cgpaFromText(text) {
  var s = String(text == null ? '' : text);
  var lines = s.split(/\r?\n/);
  var rows = [];
  for (var i = 0; i < lines.length; i++) {
    var parts = String(lines[i]).trim().split(/\s+/);
    if (parts.length < 2) continue;
    var row = { grade: num(parts[0]), credits: num(parts[parts.length - 1]) };
    if (row.grade !== null && row.credits !== null) rows.push(row);
  }
  return rows;
}

/* Attendance: current %, plus future math against an optional threshold.
   planned is the total classes a semester will hold (null = unknown). */
export function attendanceBreakdown(attended, held, planned, threshold) {
  var a = num(attended);
  var h = num(held);
  if (a === null || h === null || h <= 0 || a < 0 || a > h) return null;
  var t = num(threshold);
  if (t === null) t = 80;
  t = Math.max(0, Math.min(100, t));
  var p = planned === undefined || planned === null || planned === '' ? null : num(planned);
  var out = {
    pct: a / h * 100,
    held: h,
    attended: a,
    threshold: t,
    planned: p,
    future: null,
    mustAttend: null,
    canSkip: null,
    state: a / h * 100 >= t ? 'ok' : 'low'
  };
  if (p !== null && p > h) {
    var rem = p - h;
    out.future = rem;
    var target = Math.ceil(t / 100 * p);
    var needed = Math.max(0, Math.ceil(t / 100 * p - a));
    out.mustAttend = Math.min(needed, rem);
    out.canSkip = Math.max(0, rem - out.mustAttend);
    out.targetAttended = target;
    out.reachable = (a + rem) / p * 100 >= t;
  }
  return out;
}

/* Word/sentence/paragraph/char counts. Whitespace-based word splitting
   (language-agnostic). */
export function countWords(text) {
  var s = String(text == null ? '' : text);
  var m = s.match(/\S+/g);
  return m ? m.length : 0;
}

export function countSentences(text) {
  var s = String(text == null ? '' : text).trim();
  if (!s) return 0;
  var m = s.match(/[^.!?…]+[.!?…]+|\S+$/g);
  return m ? m.length : 0;
}

export function countParagraphs(text) {
  var s = String(text == null ? '' : text);
  if (!s.trim()) return 0;
  var blocks = s.split(/\n\s*\n/);
  var n = 0;
  blocks.forEach(function (b) { if (String(b).trim()) n++; });
  return n;
}

export function countChars(text, includeSpaces) {
  var s = String(text == null ? '' : text);
  return includeSpaces !== false ? s.length : s.replace(/\s/g, '').length;
}

/* Reading time in minutes at a words-per-minute speed. */
export function readingTimeMinutes(words, wpm) {
  var w = num(words);
  var s = num(wpm);
  if (w === null || s === null || s <= 0) return null;
  return w / s;
}

/* Average reading speed (WPM) and speaking speed used by the page. */
export const SPEEDS = { reading: 200, speaking: 150, slow: 130, fast: 240 };
export const WORD_LIMITS = { title: 60, sms: 160, bio: 60 };
export const CHAR_LIMITS = { meta: 160, sms: 160, tweet: 280, bio: 60, title: 100 };