/* xml-formatter.js — format / validate / minify XML. CSP-safe. */
import { xmlValidate, xmlPretty, xmlMinify } from '../validate/file-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = '<?xml version="1.0" encoding="UTF-8"?>\n<server><name>The Antigle</name><ports><http>80</http><https>443</https></ports><enabled>true</enabled><tags><item a="1"/><item b="2"/></tags></server>';

const state = { mode: 'format' };

function wire() {
  $('xfInput').addEventListener('input', render);

  document.querySelectorAll('.mode-chip').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.mode = btn.getAttribute('data-mode');
      document.querySelectorAll('.mode-chip').forEach(function (b) {
        var on = b.getAttribute('data-mode') === state.mode;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      render();
    });
  });

  $('fSample').addEventListener('click', function () {
    $('xfInput').value = SAMPLE;
    render();
  });
  $('fClear').addEventListener('click', function () {
    $('xfInput').value = '';
    render();
  });
}

function render() {
  var input = $('xfInput').value;
  var out = $('xfOut');
  var status = $('xfStatus');

  if (!input.trim()) {
    out.textContent = '';
    status.textContent = '';
    return;
  }

  var check = xmlValidate(input);
  if (!check.ok) {
    out.textContent = '';
    status.className = 'chk-detected chk-error';
    status.textContent = 'XML error: ' + check.error + ' (line ' + check.line + ', column ' + check.col + ')';
    return;
  }

  var res = state.mode === 'format' ? xmlPretty(input) : xmlMinify(input);
  if (res.ok) {
    out.textContent = res.data;
    status.className = 'chk-detected';
    var bytes = res.data.length;
    var size = bytes < 1024 ? bytes + ' B' : (bytes / 1024).toFixed(2) + ' KB';
    status.className = 'chk-detected';
    status.textContent = 'Valid XML · ' + check.nodes.length + ' node' + (check.nodes.length === 1 ? '' : 's') + ' · ' + size;
  } else {
    out.textContent = '';
    status.className = 'chk-detected chk-error';
    status.textContent = 'XML error: ' + res.error;
  }
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