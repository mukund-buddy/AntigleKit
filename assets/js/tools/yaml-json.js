/* yaml-json.js — YAML → JSON converter. CSP-safe. */
import { yamlToJson } from '../validate/file-tools.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = [
  '# Server configuration',
  'server:',
  '  host: 0.0.0.0',
  '  port: 8080',
  '  https: true',
  'users:',
  '  - name: dev',
  '    role: admin',
  '  - name: guest',
  '    role: viewer',
  'counts: [1, 2, 3]',
  'note: |',
  '  Multi-line text',
  '  stays wrapped.'
].join('\n');

function render() {
  var input = $('yjInput').value;
  var out = $('yjOut');
  var status = $('yjStatus');

  if (!input.trim()) {
    out.textContent = '';
    status.textContent = '';
    return;
  }

  var res = yamlToJson(input);
  if (res.ok) {
    var pretty;
    try {
      pretty = JSON.stringify(res.data, null, 2);
    } catch (e) {
      pretty = String(res.data);
    }
    out.textContent = pretty;
    status.className = 'chk-detected';
    status.textContent = 'Converted → valid JSON';
  } else {
    out.textContent = '';
    status.className = 'chk-detected chk-error';
    status.textContent = 'YAML error: ' + res.error + ' (line ' + res.line + ')';
  }
}

function wire() {
  $('yjInput').addEventListener('input', render);
  $('fSample').addEventListener('click', function () {
    $('yjInput').value = SAMPLE;
    render();
  });
  $('fClear').addEventListener('click', function () {
    $('yjInput').value = '';
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