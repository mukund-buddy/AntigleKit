/* chapters.js — pure YouTube chapter/timestamp parsing and formatting.
   No DOM, no network. Node-testable.

   Verified 2026-08-06 (YouTube Help 9884579): for chapters to appear,
   the list must start at 00:00, contain at least 3 timestamps in ascending
   order, and every chapter must be at least 10 seconds long. */

export var MAX_CHAPTER_SECONDS = 359999; /* 99:59:59 */

/* "1:23" | "01:23" | "1:23:45" | "123" (bare = seconds). */
export function parseTimestamp(token) {
  if (typeof token !== 'string') return null;
  var s = token.trim();
  if (!s) return null;
  if (/^\d{1,5}$/.test(s)) {
    var n = Number(s);
    return n <= MAX_CHAPTER_SECONDS ? { seconds: n } : null;
  }
  var m = s.match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  var min = Number(m[2]);
  var sec = Number(m[3]);
  if (min > 59 || sec > 59) return null;
  var hours = m[1] ? Number(m[1]) : 0;
  var total = hours * 3600 + min * 60 + sec;
  return total <= MAX_CHAPTER_SECONDS ? { seconds: total } : null;
}

/* style 'short' -> "0:00", 'long' -> "00:00"; hours render as H:MM:SS. */
export function formatTimestamp(seconds, style) {
  var total = Math.max(0, Math.floor(seconds));
  var h = Math.floor(total / 3600);
  var m = Math.floor((total % 3600) / 60);
  var s = total % 60;
  var ss = String(s).padStart(2, '0');
  if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + ss;
  if (style === 'long') return String(m).padStart(2, '0') + ':' + ss;
  return m + ':' + ss;
}

var LEAD_BULLETS = /^[\s\-–—*•·#]+/;
var NUM_PREFIX = /^\d+[.)]\s*/;
var TRAILING_JUNK = /[\s\-–—:]+$/;

function cleanTitle(raw) {
  var t = String(raw).replace(LEAD_BULLETS, '').replace(TRAILING_JUNK, '').trim();
  return t.replace(/\s+/g, ' ');
}

/* Strip leading bullets ("- ", "• ", "# ") and numbering ("1. ") so messy
   notes parse cleanly. */
function stripListMarks(raw) {
  return String(raw).replace(LEAD_BULLETS, '').replace(NUM_PREFIX, '');
}

/* One absolute chapter line:
   - "0:00 Intro"              (timestamp first)
   - "Intro 0:00" / "Intro (0:00)" (timestamp last)
   Returns { title, seconds, raw } or null when no timestamp is found. */
export function parseChapterLine(line) {
  if (typeof line !== 'string') return null;
  var raw = line.trim();
  if (!raw) return null;
  var prep = stripListMarks(raw);

  var m = prep.match(/^(\d{1,2}(?::\d{1,2}){1,2})\s+(.+)$/);
  if (m) {
    var t = parseTimestamp(m[1]);
    if (t && m[2].trim()) return { title: cleanTitle(m[2]), seconds: t.seconds, raw: raw };
  }

  m = prep.match(/^(.*?)[\s([]{1,}(\d{1,2}(?::\d{1,2}){1,2})[)\]]?\s*$/);
  if (m) {
    t = parseTimestamp(m[2]);
    var title = cleanTitle(m[1]);
    if (t && title) return { title: title, seconds: t.seconds, raw: raw };
  }

  return null;
}

/* One duration line for the Timestamp Generator: "Intro 0:30" or "Intro 90"
   (bare number = seconds). Returns { title, seconds, raw } or null. */
export function parseDurationLine(line) {
  if (typeof line !== 'string') return null;
  var raw = line.trim();
  if (!raw) return null;
  var prep = stripListMarks(raw);

  var m = prep.match(/^(.*?)[\s([]{1,}(\d{1,5}(?::\d{1,2}){0,2})[)\]]?\s*$/);
  if (!m) return null;
  var t = parseTimestamp(m[2]);
  var title = cleanTitle(m[1]);
  if (!t || !title) return null;
  return { title: title, seconds: t.seconds, raw: raw };
}

/* Map a list of lines to absolute chapter objects (silently skips lines
   that contain no parseable timestamp). */
export function buildChapters(lines) {
  var out = [];
  for (var i = 0; i < lines.length; i++) {
    var p = parseChapterLine(lines[i]);
    if (p) out.push(p);
  }
  return out;
}

/* Cumulatively sum duration segments: [{title, seconds}] -> chapters with
   start times. Returns { chapters, issues }. */
export function buildChaptersFromDurations(segments) {
  var chapters = [];
  var issues = [];
  var cursor = 0;
  for (var i = 0; i < segments.length; i++) {
    var seg = segments[i];
    if (seg.seconds < 0) {
      issues.push({ severity: 'error', code: 'negative', message: 'Duration for "' + seg.title + '" cannot be negative.' });
      continue;
    }
    chapters.push({ title: seg.title, seconds: cursor, raw: seg.raw });
    cursor += seg.seconds;
  }
  return { chapters: chapters, issues: issues };
}

/* YouTube chapter acceptance rules (YouTube Help 9884579). */
export function analyzeChapters(chapters) {
  var issues = [];
  if (!chapters || !chapters.length) return issues;
  if (chapters.length < 3) {
    issues.push({ severity: 'warning', code: 'few', message: 'YouTube needs at least 3 chapters before it shows them.' });
  }
  if (chapters[0].seconds !== 0) {
    issues.push({ severity: 'warning', code: 'first', message: 'Start the first chapter at 0:00 so YouTube recognises the list.' });
  }
  for (var i = 1; i < chapters.length; i++) {
    var gap = chapters[i].seconds - chapters[i - 1].seconds;
    if (gap < 0) {
      issues.push({ severity: 'error', code: 'order', message: 'Chapter ' + (i + 1) + ' ("' + chapters[i].title + '") starts before the previous one.' });
    } else if (gap > 0 && gap < 10) {
      issues.push({ severity: 'warning', code: 'short', message: 'Chapter ' + (i + 1) + ' ("' + chapters[i].title + '") is only ' + gap + ' seconds — chapters need at least 10 seconds.' });
    }
  }
  return issues;
}
