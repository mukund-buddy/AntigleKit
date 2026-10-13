/* csv-json.js — two-way CSV &harr; JSON converter. CSP-safe. */
import { csvParse, rowsToJson, csvToJson, jsonToCsv } from '../validate/file-tools.js';

const $ = (id) => document.getElementById(id);

const CSV_SAMPLE = 'name,email,role\nalice,alice@example.com,Admin\nbob,bob@example.com,Editor\n"cha,ndra",c@example.com,Viewer';
const JSON_SAMPLE = '[\n  { "name": "alice", "email": "alice@example.com", "role": "Admin" },\n  { "name": "bob", "email": "bob@example.com", "role": "Editor" }\n]';

const state = {
  dir: 'csv2json',
  delimiter: ',',
  headerRow: true
};

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function jsonStringify(v) {
  try {
    return JSON.stringify(v, null, 2);
  } catch (e) {
    return String(v);
  }
}

function render() {
  var input = $('cjInput').value;
  var out = $('cjOut');
  var status = $('cjStatus');
  var csvMode = state.dir === 'csv2json';

  if (!input.trim()) {
    out.textContent = '';
    status.textContent = '';
    return;
  }

  var result;
  if (csvMode) {
    result = csvParse(input, { delimiter: state.delimiter });
    if (result.ok) {
      var data = rowsToJson(result.rows, state.headersRow);
      out.textContent = jsonStringify(data);
      status.className = 'chk-detected';
      status.textContent = result.count + ' row' + (result.count === 1 ? '' : 's') + ' parsed → ' + (Array.isArray(data) ? data.length + ' object' + (data.length === 1 ? '' : 's') : 'object');
    } else {
      out.textContent = '';
      status.className = 'chk-detected chk-error';
      status.textContent = 'CSV error: ' + result.error + (result.line ? ' (line ' + result.line + ')' : '');
    }
  } else {
    result = jsonToCsv(input, { delimiter: state.delimiter, headers: true });
    if (result.ok) {
      out.textContent = result.data;
      status.className = 'chk-detected';
      status.textContent = result.rows + ' row' + (result.rows === 1 ? '' : 's') + ' written';
    } else {
      out.textContent = '';
      status.className = 'chk-detected chk-error';
      status.textContent = 'JSON error: ' + result.error;
    }
  }
}

function wire() {
  $('cjInput').addEventListener('input', render);

  $('cjDir').addEventListener('change', function (e) {
    state.dir = e.target.value;
    $('cjDirLabel').textContent = state.dir === 'csv2json' ? 'CSV → JSON' : 'JSON → CSV';
    $('cjOut').textContent = '';
    render();
  });

  $('cjDelimiter').addEventListener('change', function (e) {
    var v = e.target.value;
    state.delimiter = v === 'tab' ? '\t' : v === 'semicolon' ? ';' : ',';
    render();
  });

  $('cjHeaders').addEventListener('change', function (e) {
    state.headersRow = e.target.checked;
    render();
  });

  $('fSample').addEventListener('click', function () {
    $('cjInput').value = state.dir === 'csv2json' ? CSV_SAMPLE : JSON_SAMPLE;
    render();
  });
  $('fClear').addEventListener('click', function () {
    $('cjInput').value = '';
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