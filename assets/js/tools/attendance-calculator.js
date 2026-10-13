/* attendance-calculator.js — attendance % + threshold planning.
   CSP-safe. */
import { attendanceBreakdown } from '../validate/student-tools.js';

const $ = (id) => document.getElementById(id);

function fmt(n) {
  return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

function render() {
  var attendedStr = $('attAttended').value;
  var heldStr = $('attHeld').value;
  var plannedStr = $('attPlanned').value;
  var threshold = Number($('attThreshold').value);

  var out = $('attOut');
  var det = $('attDetected');
  var errEl = $('attError');

  $('attThreshOut').textContent = threshold + '%';

  if (!attendedStr.trim() && !heldStr.trim()) {
    out.textContent = '';
    det.textContent = '';
    errEl.hidden = true;
    return;
  }

  var res = attendanceBreakdown(attendedStr, heldStr, plannedStr || null, threshold);
  if (res === null) {
    errEl.textContent = 'Enter valid numbers — attended can not exceed held, and held must be positive.';
    errEl.hidden = false;
    out.textContent = '';
    det.textContent = '';
    return;
  }

  errEl.hidden = true;
  var lines = [];
  lines.push('Attendance: ' + fmt(res.pct) + '%');
  lines.push(res.attended + ' of ' + res.held + ' classes');

  if (res.planned !== null && res.planned > res.held) {
    lines.push('');
    if (res.reachable) {
      lines.push('Out of ' + (res.future) + ' classes still to come:');
      lines.push('  · attend at least ' + res.mustAttend + ' to stay ≥ ' + res.threshold + '%');
      lines.push('  · you can skip up to ' + res.canSkip);
    } else {
      lines.push('Out of ' + res.future + ' classes still to come, the threshold is out of reach:');
      lines.push('  · even attending all ' + res.future + ' gives only ' + fmt((res.attended + res.future) / (res.held + res.future) * 100) + '%');
      lines.push('  · target for the term: ' + res.targetAttended + ' of ' + res.planned + ' classes (≥ ' + res.threshold + '%)');
    }
    det.className = res.reachable ? (res.pct >= res.threshold ? 'chk-detected' : 'chk-detected is-error') : 'chk-detected is-error';
    det.textContent = res.reachable
      ? (res.pct >= res.threshold ? 'You are above ' + res.threshold + '% — the skip budget protects it.' : 'You are below ' + res.threshold + '% — the plan is to catch up.')
      : 'Below ' + res.threshold + '% with ' + res.future + ' classes left — the threshold is not reachable this term.';
  } else {
    det.className = res.pct >= res.threshold ? 'chk-detected' : 'chk-detected is-error';
    det.textContent = res.pct >= res.threshold
      ? 'Above the ' + res.threshold + '% threshold. Add the planned total to plan skips.'
      : 'Below the ' + res.threshold + '% threshold. Add the planned total to plan skips.';
  }

  out.textContent = lines.join('\n');
}

function wire() {
  ['attAttended', 'attHeld', 'attPlanned'].forEach(function (id) {
    $(id).addEventListener('input', render);
  });
  $('attThreshold').addEventListener('input', render);
  $('fSample').addEventListener('click', function () {
    $('attAttended').value = '24';
    $('attHeld').value = '30';
    $('attPlanned').value = '40';
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