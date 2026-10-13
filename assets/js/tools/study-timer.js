/* study-timer.js — pomodoro/focus timer with presets + session log.
   CSP-safe. Uses Date.now()-based deadlines so hidden tabs stay accurate. */
import { TIMER_PRESETS, timerPresetById, phasesFor, formatStudyTime, sessionSummary } from '../validate/student-planning-tools.js';

const $ = (id) => document.getElementById(id);

var presetId = 'pomodoro';
var phases = [];
var idx = 0;
var running = false;
var deadline = 0;
var remainingMs = 0;
var intervalRef = null;
var log = [];

function clearTimer() {
  if (intervalRef) { window.clearInterval(intervalRef); intervalRef = null; }
}

function currentPhaseMs() {
  var ph = phases[idx];
  return ph ? Math.round(ph.minutes) * 60000 : 0;
}

function phaseTail() {
  if (idx >= phases.length) return 'Cycle complete';
  var ph = phases[idx];
  if (!ph) return 'Ready';
  if (running) return ph.longBreak ? 'Long break' : (ph.type === 'focus' ? 'Focus' : 'Short break');
  return 'Ready';
}

function paintClock(secs) {
  var show = Math.max(0, Math.round(secs || 0));
  $('stClock').textContent = formatStudyTime(show);
  $('stPhaseName').textContent = phaseTail();
  $('stPhaseCount').textContent = phases.length ? (idx + 1) + ' / ' + phases.length : '—';
  var totalMs = currentPhaseMs();
  var pct = totalMs > 0 ? Math.max(0, Math.min(100, ((totalMs - show * 1000) / totalMs) * 100)) : 0;
  $('stProgress').style.width = pct.toFixed(2) + '%';
  $('stStart').textContent = running ? 'Pause' : (idx >= phases.length ? 'Start again' : 'Start');
}

function paintPhaseSeq() {
  var chips = $('stPhaseSeq');
  while (chips.firstChild) chips.removeChild(chips.firstChild);
  phases.forEach(function (ph, i) {
    var chip = document.createElement('span');
    chip.className = 'pill-static' + (i === idx ? ' is-active' : '');
    chip.textContent = ph.minutes + ' ' + (ph.longBreak ? 'long' : ph.type);
    chips.appendChild(chip);
  });
}

function rebuildPhases() {
  clearTimer();
  phases = phasesFor(presetId);
  idx = 0;
  remainingMs = currentPhaseMs();
  running = false;
  paintPhaseSeq();
  paintClock(remainingMs / 1000);
}

function popLog() {
  var list = $('stLogList');
  while (list.firstChild) list.removeChild(list.firstChild);
  log.forEach(function (entry, i) {
    var li = document.createElement('li');
    li.className = 'chk-item';
    var badge = document.createElement('span');
    badge.className = 'chk-badge ' + (entry.type === 'focus' ? 'chk-badge--ok' : 'chk-badge--info');
    badge.textContent = entry.type === 'focus' ? 'Focus' : 'Break';
    var text = document.createElement('span');
    text.textContent = 'Session ' + (i + 1) + ' · ' + entry.minutes + ' min';
    li.appendChild(badge);
    li.appendChild(text);
    list.appendChild(li);
  });
  var summary = sessionSummary(log);
  if (summary) {
    $('stFocusTotal').textContent = formatStudyTime(summary.focusMinutes * 60);
    $('stBreakTotal').textContent = formatStudyTime(summary.breakMinutes * 60);
    $('stSessionCount').textContent = summary.focusCount + ' focus / ' + summary.breakCount + ' breaks';
  } else {
    $('stFocusTotal').textContent = '—';
    $('stBreakTotal').textContent = '—';
    $('stSessionCount').textContent = '—';
  }
  var lines = log.map(function (e, i) { return 'Session ' + (i + 1) + ' · ' + e.type + ' · ' + e.minutes + ' min'; });
  if (summary) {
    lines.push('—');
    lines.push('Focus ' + formatStudyTime(summary.focusMinutes * 60) + ' · breaks ' + formatStudyTime(summary.breakMinutes * 60));
  }
  $('stLogOut').textContent = lines.join('\n');
}

function completePhase() {
  var ph = phases[idx];
  if (ph) log.push({ type: ph.type, minutes: ph.minutes });
  idx++;
  if (idx >= phases.length) {
    running = false;
    clearTimer();
    paintClock(0);
    paintPhaseSeq();
    popLog();
    return;
  }
  deadline = Date.now() + currentPhaseMs();
  paintPhaseSeq();
  popLog();
}

function tick() {
  var left = deadline - Date.now();
  if (left <= 0) { completePhase(); return; }
  paintClock(left / 1000);
}

function start() {
  if (running) return;
  if (idx >= phases.length) { idx = 0; remainingMs = currentPhaseMs(); }
  running = true;
  deadline = Date.now() + (remainingMs > 0 ? remainingMs : currentPhaseMs());
  remainingMs = 0;
  clearTimer();
  intervalRef = window.setInterval(tick, 250);
  paintClock((deadline - Date.now()) / 1000);
}

function pause() {
  if (!running) return;
  remainingMs = Math.max(0, deadline - Date.now());
  running = false;
  clearTimer();
  paintClock(remainingMs / 1000);
}

function skipPhase() {
  idx++;
  if (idx >= phases.length) {
    running = false;
    clearTimer();
    paintClock(0);
    paintPhaseSeq();
    return;
  }
  if (running) { deadline = Date.now() + currentPhaseMs(); }
  else { remainingMs = currentPhaseMs(); paintClock(remainingMs / 1000); }
  paintPhaseSeq();
}

function render() {
  $('stActivePreset').textContent = timerPresetById(presetId).label;
}

function wire() {
  TIMER_PRESETS.forEach(function (p) {
    var radio = document.querySelector('input[name="stPreset"][value="' + p.id + '"]');
    if (radio) radio.addEventListener('change', function () {
      presetId = p.id;
      rebuildPhases();
      render();
    });
  });
  $('stStart').addEventListener('click', function () {
    if (running) pause(); else start();
  });
  $('stSkip').addEventListener('click', skipPhase);
  $('stReset').addEventListener('click', function () {
    clearTimer();
    idx = 0;
    running = false;
    remainingMs = currentPhaseMs();
    paintClock(remainingMs / 1000);
    paintPhaseSeq();
  });
  $('stClearLog').addEventListener('click', function () {
    log = [];
    popLog();
  });
  $('fSample').addEventListener('click', function () {
    log = [
      { type: 'focus', minutes: 25 },
      { type: 'break', minutes: 5 },
      { type: 'focus', minutes: 25 }
    ];
    popLog();
  });
  $('fClear').addEventListener('click', function () {
    clearTimer();
    idx = 0;
    running = false;
    remainingMs = currentPhaseMs();
    log = [];
    paintClock(remainingMs / 1000);
    paintPhaseSeq();
    popLog();
  });
}

function init() {
  render();
  wire();
  phases = phasesFor('pomodoro');
  remainingMs = phases[0] ? phases[0].minutes * 60000 : 0;
  paintPhaseSeq();
  paintClock(remainingMs / 1000);
  popLog();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}