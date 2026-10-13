/* student-planning-tools.js — pure helpers for the Student planning suite:
   rule-based MCQ practice sheets (no AI), weekly study grids, spaced-revision
   schedules, and study-timer phase math. No DOM, no network, Node-testable.
   Every function treats invalid/empty input defensively and returns null / []
   instead of throwing. All loops are bounded by array lengths — arrays are
   never grown with open-ended while-fill loops. */
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ── tiny internal helpers ──────────────────────────────────────── */
function pad2(n) { return n < 10 ? '0' + n : String(n); }

function toIntClamped(v, fallback, min, max) {
  var n = Math.round(Number(v));
  if (!isFinite(n)) n = fallback;
  if (isFinite(min) && n < min) n = min;
  if (isFinite(max) && n > max) n = max;
  return n;
}

function parseDate(v) {
  var d = null;
  if (v instanceof Date && !isNaN(v.getTime())) d = new Date(v.getTime());
  else if (typeof v === 'number' && isFinite(v)) d = new Date(v);
  else {
    var s = String(v == null ? '' : v).trim();
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
    if (m) {
      var y = Number(m[1]), mo = Number(m[2]), da = Number(m[3]);
      d = new Date(y, mo - 1, da);
      if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) d = null;
    }
    else if (s) { var t = Date.parse(s); if (!isNaN(t)) d = new Date(t); }
  }
  return d && !isNaN(d.getTime()) ? d : null;
}

function isoDate(d) {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function addDays(d, n) {
  var o = new Date(d.getTime());
  o.setDate(o.getDate() + n);
  return o;
}

function chunk(arr, size) {
  var out = [];
  for (var i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/* unique positive integers from an array or comma string, with a fallback */
function intervalValues(v, fallback) {
  var src = Array.isArray(v) ? v : String(v == null ? '' : v).split(',');
  var seen = Object.create(null);
  var out = [];
  src.forEach(function (x) {
    var n = Math.floor(Number(x));
    if (!isFinite(n) || n < 1 || n > 1000) return;
    if (seen[n]) return;
    seen[n] = true;
    out.push(n);
  });
var f = fallback.slice();
  if (out.length === 0) {
    for (var i = 0; i < f.length; i++) {
      if (!seen[f[i]]) { seen[f[i]] = true; out.push(f[i]); }
    }
  }
  return out.slice(0, 14);
}

var STOP = Object.create(null);
('the and or a an of to in on at for by with from as is are was were be been it its ' +
 'this that these those you your his her their our we they i he she no not do does did ' +
 'had have has will would can could should may might must than then there here when where why ' +
 'how which who whom what if but so very just too about into over under').split(/\s+/)
  .forEach(function (w) { if (w) STOP[w] = true; });

/* ── MCQ generator (rule-based, zero AI) ────────────────────────── */

/* Split raw notes into sentences. */
export function splitToSentences(text) {
  var s = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  if (!s) return [];
  var m = s.match(/[^.!?…]+[.!?…]+|\S+$/g) || [];
  return m.map(function (x) { return x.trim(); }).filter(Boolean);
}

function rawWords(str) {
  return (String(str).match(/[A-Za-z][A-Za-z0-9''’\-]*/g) || []);
}

function lowerClean(w) {
  return String(w == null ? '' : w).toLowerCase()
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
}

function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildWordPool(text) {
  var counts = Object.create(null);
  rawWords(text).forEach(function (w) {
    var lw = lowerClean(w);
    if (lw.length < 3 || STOP[lw]) return;
    counts[lw] = (counts[lw] || 0) + 1;
  });
  return Object.keys(counts).map(function (w) { return { w: w, n: counts[w] }; });
}

/* Pick a blankable content word in a sentence by a deterministic score:
   longer words win, proper nouns are attractive, first position avoided. */
function pickBlank(sentence) {
  var toks = rawWords(sentence);
  if (!toks.length) return null;
  var best = null;
  for (var i = 0; i < toks.length; i++) {
    var lw = lowerClean(toks[i]);
    if (lw.length < 4 || STOP[lw]) continue;
    var score = lw.length;
    if (/^[A-Z]/.test(toks[i])) score += 8;
    if (i === 0) score -= 6;
    if (best === null || score > best.score) best = { token: toks[i], score: score };
  }
  return best;
}

/* Replace the first occurrence of `token` in a sentence with ____. */
function blankIn(sentence, token) {
  var lw = lowerClean(token);
  var re = new RegExp('\\b' + escRe(lw) + '\\b', 'i');
  var out = sentence.replace(re, '____');
  return out === sentence ? null : out;
}

function seededShuffle(arr, seed) {
  var a = arr.slice();
  var s = (seed >>> 0) || 1;
  function next() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(next() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/* Distractors: nearest-length words from the answer pool first, then from
   the document pool, never colliding with the answer (case-insensitive). */
function distractorsFor(answer, pool, answersPool, want) {
  var aw = lowerClean(answer);
  var cands = [];
  (answersPool || []).forEach(function (s) {
    var w = lowerClean(s);
    if (!w || w === aw || w.indexOf('____') !== -1) return;
    cands.push({ w: w, score: 100 - Math.abs(w.length - aw.length) * 2 });
  });
  pool.forEach(function (p) {
    if (p.w === aw) return;
    var dl = Math.abs(p.w.length - aw.length);
    if (dl > 4 && aw.length <= 14) return;
    cands.push({ w: p.w, score: p.n * 2 - Math.min(dl, 4) });
  });
  cands.sort(function (a, b) { return b.score - a.score; });
  var seen = Object.create(null);
  var out = [];
  for (var i = 0; i < cands.length && out.length < want; i++) {
    var w = cands[i].w;
    if (w === aw || seen[w]) continue;
    seen[w] = true;
    out.push(w);
  }
  return out;
}

function makeQuestion(stem, answer, dist, seed) {
  var shuffled = seededShuffle(dist.concat([answer]), seed * 13 + 5);
  var seen = Object.create(null);
  var opts = [];
  for (var i = 0; i < shuffled.length; i++) {
    var k = lowerClean(shuffled[i]);
    if (!k || seen[k]) continue;
    seen[k] = true;
    opts.push(shuffled[i]);
  }
  var ci = -1;
  for (i = 0; i < opts.length; i++) {
    if (lowerClean(opts[i]) === lowerClean(answer)) { ci = i; break; }
  }
  if (opts.length < 2 || ci < 0) return null;
  return { stem: stem, options: opts, answer: answer, correctIndex: ci };
}

/* Parse "Question? Answer" pairs — one per line. */
export function mcqPairLines(text) {
  var s = String(text == null ? '' : text);
  var out = [];
  s.split(/\r?\n/).forEach(function (line) {
    var t = line.trim();
    if (!t) return;
    var qi = t.indexOf('?');
    if (qi < 0) return;
    var after = t.slice(qi + 1).replace(/^[\s:=\-,.]+/, '').trim();
    if (rawWords(after).length < 2) return;
    var q = t.slice(0, qi).replace(/^[\s:=\-,.]+/, '').replace(/^Q\s*\d*\s*[:.-]\s*/i, '').trim();
    out.push({ q: q || line.trim(), a: after, answer: after });
  });
  return out;
}

/* MCQ sheet from plain study notes: blanked keyword + doc-sourced
   distractors. */
export function mcqFromNotes(text, limit) {
  var s = String(text == null ? '' : text);
  var max = toIntClamped(limit, 8, 1, 25);
  if (!s.trim()) return [];
  var pool = buildWordPool(s);
  var sentences = splitToSentences(s);
  var used = Object.create(null);
  var questions = [];
  for (var i = 0; i < sentences.length && questions.length < max; i++) {
    var pick = pickBlank(sentences[i]);
    if (!pick) continue;
    var key = lowerClean(pick.token);
    if (used[key]) continue;
    var stem = blankIn(sentences[i], pick.token);
    if (!stem || rawWords(stem).length < 5) continue;
    var dist = distractorsFor(pick.token, pool, [], 3);
    if (dist.length < 2) continue;
    var q = makeQuestion(stem, pick.token, dist.slice(0, 3), questions.length);
    if (q) { used[key] = true; questions.push(q); }
  }
  return questions;
}

/* MCQ sheet from explicit "Question? Answer" pairs. */
export function mcqFromPairs(text, limit) {
  var s = String(text == null ? '' : text);
  var pairs = mcqPairLines(s);
  if (!pairs.length || !s.trim()) return [];
  var max = toIntClamped(limit, 8, 1, 25);
  var pool = buildWordPool(s);
  var answersPool = pairs.map(function (p) { return p.answer; });
  var used = Object.create(null);
  var questions = [];
  for (var i = 0; i < pairs.length && questions.length < max; i++) {
    var p = pairs[i];
    var key = lowerClean(p.q);
    if (!key || used[key]) continue;
    used[key] = true;
    var stem = p.q + (p.q.slice(-1) === '?' ? '' : '?');
    var dist = distractorsFor(p.answer, pool, answersPool, 3);
    if (dist.length < 2) continue;
    var q = makeQuestion(stem, p.answer, dist.slice(0, 3), questions.length);
    if (q) questions.push(q);
  }
  return questions;
}

/* Dispatcher: auto-detects pair layout vs plain notes. */
export function mcqBuildSheet(text, limit) {
  var s = String(text == null ? '' : text);
  if (!s.trim()) return [];
  return mcqDetectedMode(s) === 'pairs' ? mcqFromPairs(s, limit) : mcqFromNotes(s, limit);
}

export function mcqDetectedMode(text) {
  return mcqPairLines(text).length >= 1 ? 'pairs' : 'notes';
}

var LETTERS = ['A', 'B', 'C', 'D', 'E'];

export function mcqSheetLines(questions) {
  if (!Array.isArray(questions) || !questions.length) return [];
  var out = [];
  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    out.push('Q' + (i + 1) + '. ' + q.stem);
    var n = Math.min(q.options.length, 5);
    for (var o = 0; o < n; o++) out.push('     ' + LETTERS[o] + '. ' + q.options[o]);
    if (i < questions.length - 1) out.push('');
  }
  return out;
}

export function mcqAnswerKeyLines(questions) {
  if (!Array.isArray(questions) || !questions.length) return [];
  var out = [];
  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    out.push((i + 1) + '. ' + (LETTERS[q.correctIndex] || '?') + ' — ' + q.answer);
  }
  return out;
}

/* ── Weekly study planner ───────────────────────────────────────── */

export function studyParseLines(text) {
  var s = String(text == null ? '' : text);
  var out = [];
  s.split(/\r?\n/).forEach(function (line) {
    var t = line.replace(/^[#*\u2022\- ]+/, '').trim();
    if (!t) return;
    var m = t.match(/^(.*?)\s*(?:[:=]|[xX\u00d7])\s*(\d{1,2})\s*$/);
    var name, weight = 1;
    if (m) { name = m[1].trim(); weight = parseInt(m[2], 10); }
    else { name = t; }
    name = name.replace(/[*~`]/g, '').trim().slice(0, 48);
    if (!name) return;
    out.push({ name: name, weight: Math.min(6, Math.max(1, weight)) });
  });
  return out;
}

/* Build a balanced weekly timetable: subjects repeat by weight, at most one
   session per subject per day, and the day-start index rotates so blocks
   spread evenly. Returns one entry per day. */
export function studyWeek(rows, opts) {
  if (!Array.isArray(rows) || !rows.length) return [];
  var o = opts || {};
var days = toIntClamped(o.days, 7, 1, 21);
  var slotsSource = o.slotsPerDay != null ? o.slotsPerDay : o.slots;
  var slots = toIntClamped(slotsSource, 5, 1, 12);
  var minutes = toIntClamped(o.sessionMinutes, 45, 5, 240);
  var labels = Array.isArray(o.dayLabels) ? o.dayLabels : DAYS;
  var pool = [];
  rows.forEach(function (r) {
    var w = Math.min(5, Math.max(1, r.weight));
    for (var k = 0; k < w; k++) pool.push(r.name);
  });
  var week = [];
  for (var d = 0; d < days; d++) {
    var usedToday = Object.create(null);
    var sessions = [];
    for (var slot = 0; slot < slots; slot++) {
      var chosen = null;
      for (var pick = 0; pick < pool.length; pick++) {
        var subj = pool[(d + pick) % pool.length];
        if (usedToday[subj]) continue;
        chosen = subj; break;
      }
      if (chosen === null) chosen = pool[d % pool.length];
      usedToday[chosen] = true;
      sessions.push({ subject: chosen, minutes: minutes });
    }
    week.push({ day: d + 1, dayLabel: labels[d] || String(d + 1), sessions: sessions });
  }
  return week;
}

export function studyWeekSummary(week) {
  if (!Array.isArray(week) || !week.length) return null;
  var totals = Object.create(null);
  var slots = 0;
  var totalMinutes = 0;
  week.forEach(function (day) {
    day.sessions.forEach(function (s) {
      if (!s || !s.subject) return;
      var mins = Number(s.minutes) || 0;
      totals[s.subject] = (totals[s.subject] || 0) + mins;
      totalMinutes += mins;
      slots++;
    });
  });
  return {
    totalMinutes: totalMinutes,
    slots: slots,
    subjects: Object.keys(totals).map(function (name) {
      return { name: name, minutes: totals[name] };
    })
  };
}

/* ── Spaced revision scheduler ──────────────────────────────────── */

export function revisionTopics(topics, count) {
  var names = [];
  if (Array.isArray(topics)) {
    topics.forEach(function (t) { var s = String(t).trim(); if (s) names.push(s.slice(0, 60)); });
  } else if (typeof topics === 'string') {
    String(topics).split(/\r?\n/).forEach(function (t) { var s = t.trim(); if (s) names.push(s.slice(0, 60)); });
  } else if (typeof topics === 'number') {
    var c = toIntClamped(topics, 0, 0, 30);
    for (var i = 0; i < c; i++) names.push('Topic ' + (i + 1));
  }
  return names.slice(0, 60);
}

export function revisionLabel(offsetDays) {
  var n = Math.round(Number(offsetDays)) || 0;
  if (n === 0) return 'Exam day';
  return n + (n === 1 ? ' day' : ' days') + ' before';
}

/* Sessions for every topic at each "days before exam" interval, plus an
   exam-day marker natural. */
export function revisionSchedule(examDate, topics, intervalDays) {
  var d = parseDate(examDate);
  if (!d) return [];
  var names = revisionTopics(topics);
  if (!names.length) return [];
  var ivs = intervalValues(intervalDays, [1, 3, 7, 14, 30]);
  var seqs = [];
  for (var s = 0; s < names.length; s++) {
    seqs.push([]);
    for (var iv = 0; iv < ivs.length; iv++) {
      seqs[s].push({ offsetDays: ivs[iv] });
    }
    seqs[s].push({ offsetDays: 0 });
  }
  var byDate = Object.create(null);
  for (s = 0; s < names.length; s++) {
    for (var r = 0; r < seqs[s].length; r++) {
      var off = seqs[s][r].offsetDays;
      var node = byDate[off];
      if (!node) {
        node = {
          offsetDays: off,
          date: isoDate(addDays(d, -off)),
          label: revisionLabel(off),
          topics: []
        };
        byDate[off] = node;
      }
      node.topics.push(names[s]);
    }
  }
  var out = Object.keys(byDate).map(function (k) { return byDate[k]; });
  out.sort(function (a, b) { return b.offsetDays - a.offsetDays; });
  return out;
}

/* ── Study timer helpers ────────────────────────────────────────── */

export const TIMER_PRESETS = [
  { id: 'pomodoro', label: 'Pomodoro', focus: 25, short: 5, long: 15, rounds: 4 },
  { id: 'deep', label: 'Deep Focus', focus: 50, short: 10, long: 20, rounds: 3 },
  { id: 'quick', label: 'Quick', focus: 15, short: 5, long: 0, rounds: 2 },
  { id: 'marathon', label: 'Marathon', focus: 90, short: 15, long: 40, rounds: 4 }
];

export function timerPresetById(id) {
  for (var i = 0; i < TIMER_PRESETS.length; i++) {
    if (TIMER_PRESETS[i].id === id) return TIMER_PRESETS[i];
  }
  return TIMER_PRESETS[0];
}

/* Expand a preset into a phase list: focus / short-break / long-break. */
export function phasesFor(preset) {
  var p = (preset && preset.id) ? preset : timerPresetById(preset);
  var focus = toIntClamped(p.focus, 25, 1, 180);
  var short = toIntClamped(p.short, 0, 0, 60);
  var long = toIntClamped(p.long, 0, 0, 120);
  var rounds = toIntClamped(p.rounds, 4, 1, 8);
  var out = [];
  for (var r = 0; r < rounds; r++) {
    out.push({ type: 'focus', minutes: focus });
    if (r < rounds - 1) {
      if (short > 0) out.push({ type: 'break', minutes: short });
    } else if (long > 0) {
      out.push({ type: 'break', minutes: long, longBreak: true });
    }
  }
  return out;
}

/* Cumulative start/end seconds of each phase plus total length. */
export function phaseBounds(phases) {
  if (!Array.isArray(phases) || !phases.length) return null;
  var total = 0;
  var bounds = [];
  for (var i = 0; i < phases.length; i++) {
    var sec = Math.round(phases[i].minutes) * 60;
    bounds.push({ start: total, end: total + sec, type: phases[i].type });
    total += sec;
  }
  return { bounds: bounds, totalSeconds: total };
}

export function formatStudyTime(seconds) {
  var t = Math.max(0, Math.round(Number(seconds) || 0));
  var h = Math.floor(t / 3600);
  var m = Math.floor((t % 3600) / 60);
  var s = t % 60;
  return h > 0 ? h + ':' + pad2(m) + ':' + pad2(s) : pad2(m) + ':' + pad2(s);
}

/* Roll-up of completed sessions (each {type, minutes}). */
export function sessionSummary(entries) {
  if (!Array.isArray(entries)) return null;
  var focus = 0, brk = 0, focusCount = 0, breakCount = 0;
  entries.forEach(function (e) {
    var m = Math.round(Number(e && e.minutes));
    if (!isFinite(m) || m < 0) return;
    if (e.type === 'focus') { focus += m; focusCount++; }
    else if (e.type === 'break') { brk += m; breakCount++; }
  });
return { focusMinutes: focus, breakMinutes: brk, focusCount: focusCount, breakCount: breakCount };
}
