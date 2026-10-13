import { generatePassword } from '../validate/security-tools.js';

const $ = (id) => document.getElementById(id);

function buildOpts() {
  return {
    length: parseInt($('pgLength').value, 10) || 16,
    upper: $('pgUpper').checked,
    lower: $('pgLower').checked,
    digits: $('pgDigits').checked,
    symbols: $('pgSymbols').checked,
    excludeAmbiguous: $('pgAmbiguous').checked
  };
}

function render() {
  const res = generatePassword(buildOpts());
  if (!res.ok) {
    $('pgOutput').textContent = '—';
    $('pgEntropy').textContent = res.error || 'Could not generate.';
    $('pgMetaLen').textContent = '';
    return;
  }
  $('pgOutput').textContent = res.password;
  $('pgEntropy').textContent = '≈ ' + (res.entropy ? Math.round(res.entropy) : 0) + ' bits of entropy';
  $('pgMetaLen').textContent = res.length + ' characters';
}

function wire() {
  $('pgLength').addEventListener('input', function () { $('pgLengthVal').textContent = this.value; });
  $('pgUpper').addEventListener('change', render);
  $('pgLower').addEventListener('change', render);
  $('pgDigits').addEventListener('change', render);
  $('pgSymbols').addEventListener('change', render);
  $('pgAmbiguous').addEventListener('change', render);
  $('pgGenerate').addEventListener('click', render);
  $('pgRegenerate').addEventListener('click', render);
}

function init() {
  $('pgLengthVal').textContent = $('pgLength').value;
  render();
  wire();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}