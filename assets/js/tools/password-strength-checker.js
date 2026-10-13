/* password-strength-checker.js — score a password's strength, entropy and
   character composition using the shared security-tools validator.
   CSP-safe, no inline handlers. */
import { passwordStrength } from '../validate/security-tools.js';

const $ = (id) => document.getElementById(id);

function strengthColor(s) {
  return s === 'very-strong' ? '#22c55e' : s === 'strong' ? '#4ade80' : s === 'fair' ? '#facc15' : s === 'weak' ? '#f97316' : '#ef4444';
}

function render() {
  const pw = $('psInput').value;
  const fill = $('psFill');
  const label = $('psLabel');
  const scoreEl = $('psScore');
  const entropyEl = $('psEntropy');
  const lenEl = $('psLen');
  const classesEl = $('psClasses');
  const tips = $('psTips');

  if (!pw) {
    fill.style.width = '0%';
    fill.style.backgroundColor = 'transparent';
    label.textContent = '';
    label.style.color = '';
    scoreEl.textContent = '—';
    entropyEl.textContent = '—';
    lenEl.textContent = '—';
    classesEl.textContent = '—';
    tips.hidden = true;
    tips.innerHTML = '';
    return;
  }

  const res = passwordStrength(pw, {});
  if (!res.ok) return;

  fill.style.width = res.score + '%';
  fill.style.backgroundColor = strengthColor(res.strength);
  label.textContent = res.strength.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  label.style.color = strengthColor(res.strength);
  scoreEl.textContent = res.score + ' / 100';
  entropyEl.textContent = Math.round(res.entropy) + ' bits';
  lenEl.textContent = res.length;
  classesEl.textContent = res.classes + ' / 4';

  var t = [];
  if (res.common) t.push('This is a commonly used password — avoid it entirely.');
  if (!res.checks.length) t.push('Make it at least 8 characters long.');
  if (!res.checks.upper) t.push('Add uppercase letters (A–Z).');
  if (!res.checks.lower) t.push('Add lowercase letters (a–z).');
  if (!res.checks.digit) t.push('Add at least one digit (0–9).');
  if (!res.checks.symbol) t.push('Add at least one symbol (!@#$…).');
  if (res.score < 60 && !/(.)\1\1/.test(pw) && !res.common) t.push('Increase length or add more character variety.');

  if (t.length) {
    tips.innerHTML = '<ul>' + t.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
    tips.hidden = false;
  } else {
    tips.hidden = true;
    tips.innerHTML = '';
  }
}

function wire() {
  $('psInput').addEventListener('input', render);
  $('psShow').addEventListener('change', function () {
    $('psInput').type = this.checked ? 'text' : 'password';
  });
}

function init() {
  $('psInput').value = '';
  render();
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
