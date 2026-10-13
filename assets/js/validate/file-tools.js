/* file-tools.js — pure helpers for the file-tools batch: CSV, YAML, XML,
   Markdown, diff and line sorting. No DOM, no network. Node-testable.
   Never throws; hostile input yields { ok:false, ... } or empty defaults.
   Style mirrors student-tools.js / text-web-tools.js. */

function asStr(v) {
  return typeof v === 'string' ? v : String(v == null ? '' : v);
}

function isPlainObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/* Run a producer inside a guard so no export can throw at the caller. */
function safe(fn, fallback) {
  try {
    return fn();
  } catch (e) {
    return fallback;
  }
}

/* ── CSV ─────────────────────────────────────────────────────────── */
/* Parse CSV text into an array of arrays. opts: { delimiter }.
   Handles double-quoted fields (commas, newlines, "" escapes).
   Returns { ok, rows, count } or { ok:false, error, line }. */
export function csvParse(text, opts) {
  return safe(function () {
    var s = asStr(text);
    var o = isPlainObj(opts) ? opts : {};
    var sep = o.delimiter == null ? ',' : String(o.delimiter);
    if (sep === '') sep = ',';
    if (!s) return { ok: true, rows: [], count: 0 };

    var rows = [];
    var field = '';
    var record = [];
    var inQuote = false;
    var line = 1;
    var quoteLine = 1;
    var i = 0;
    var n = s.length;

    for (i = 0; i < n; i++) {
      var c = s.charAt(i);
      if (inQuote) {
        if (c === '"') {
          if (s.charAt(i + 1) === '"') { field += '"'; i++; }
          else inQuote = false;
        } else {
          field += c;
        }
        continue;
      }
      if (c === '"' && field === '') { inQuote = true; quoteLine = line; continue; }
      if (c === sep) { record.push(field); field = ''; continue; }
      if (c === '\n') {
        record.push(field); field = '';
        rows.push(record); record = [];
        line++;
        continue;
      }
      if (c === '\r') {
        if (s.charAt(i + 1) === '\n') continue;
        record.push(field); field = '';
        rows.push(record); record = [];
        line++;
        continue;
      }
      field += c;
    }
    if (inQuote) {
      return {
        ok: false,
        error: 'Unterminated quoted field — a field that opens with a double quote must close it before the CSV ends.',
        line: quoteLine
      };
    }
    if (field !== '' || record.length) { record.push(field); rows.push(record); }
    return { ok: true, rows: rows, count: rows.length };
  }, { ok: false, error: 'Could not parse CSV.', line: 1 });
}

/* Rows → JSON value. headers:true turns the first row into object keys. */
export function rowsToJson(rows, headers) {
  if (!Array.isArray(rows) || !rows.length) {
    return { ok: true, data: [], headers: headers ? [] : null, count: 0, columns: 0 };
  }
  if (headers) {
    var used = {};
    var names = (rows[0] || []).map(function (hd, idx) {
      var base = String(hd == null ? '' : hd).trim() || 'field' + (idx + 1);
      var key = base;
      var k = 2;
      while (used[key]) { key = base + '_' + k; k++; }
      used[key] = true;
      return key;
    });
    var data = rows.slice(1).map(function (r) {
      var obj = {};
      names.forEach(function (nm, idx) { obj[nm] = (r && r[idx]) === undefined ? '' : r[idx]; });
      return obj;
    });
    return { ok: true, data: data, headers: names, count: data.length, columns: names.length };
  }
  var out = rows.map(function (r) { return (r || []).slice(); });
  return { ok: true, data: out, headers: null, count: out.length, columns: out.length && out[0] ? out[0].length : 0 };
}

/* CSV text → JSON value. */
export function csvToJson(text, opts) {
  return safe(function () {
    var o = isPlainObj(opts) ? opts : {};
    var parsed = csvParse(text, o);
    if (!parsed.ok) return { ok: false, data: null, error: parsed.error, line: parsed.line };
    return rowsToJson(parsed.rows, o.headers === true);
  }, { ok: false, data: null, error: 'Could not convert CSV.', line: 1 });
}

function csvEscapeCell(v) {
  var s = v === null || v === undefined ? '' : String(v);
  if (/[",\r\n]/.test(s) || /^[ \t]+|[ \t]+$/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function jsonCellValue(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/* JSON (text) → CSV text. opts: { delimiter, headers } — headers
   defaults to true when converting an array of objects. */
export function jsonToCsv(text, opts) {
  return safe(function () {
    var o = isPlainObj(opts) ? opts : {};
    var sep = o.delimiter == null ? ',' : String(o.delimiter);
    var raw = asStr(text);
    if (!raw.trim()) return { ok: true, data: '', rows: 0, columns: 0 };

    var value;
    try {
      value = JSON.parse(raw);
    } catch (e) {
      return { ok: false, data: null, error: 'Invalid JSON: ' + e.message, line: 1 };
    }

    var items = Array.isArray(value) ? value : [value];
    if (!items.length) return { ok: true, data: '', rows: 0, columns: 0 };

    var allObjects = items.every(function (it) { return isPlainObj(it); });
    var matrix = [];
    var headers = [];

    if (allObjects) {
      var order = [];
      var seen = {};
      items.forEach(function (obj) {
        Object.keys(obj).forEach(function (k) {
          if (!seen[k]) { seen[k] = true; order.push(k); }
        });
      });
      headers = order.slice();
      matrix = items.map(function (obj) {
        return headers.map(function (k) { return csvEscapeCell(jsonCellValue(obj[k])); });
      });
    } else {
      matrix = items.map(function (it) {
        if (Array.isArray(it)) return it.map(function (c) { return csvEscapeCell(jsonCellValue(c)); });
        return [csvEscapeCell(jsonCellValue(it))];
      });
    }

    var linesOut = [];
    if (o.headers !== false && headers.length) linesOut.push(headers.map(csvEscapeCell).join(sep));
    matrix.forEach(function (row) { linesOut.push(row.join(sep)); });

    return {
      ok: true,
      data: linesOut.join('\n'),
      rows: matrix.length,
      columns: headers.length || (matrix[0] ? matrix[0].length : 0),
      headers: headers
    };
  }, { ok: false, data: null, error: 'Could not convert JSON.', line: 1 });
}

/* ── YAML → JSON ─────────────────────────────────────────────────── */
/* Hand-rolled parser for a practical YAML subset: nested block maps,
   block sequences, flow {…} / […], plain scalars, single + double
   quoted strings, # comments, and | / > block strings. Errors carry a
   1-based line number; nothing here can throw. */

var YAML_NUM = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;
var YAML_TRUE = /^(true|True|TRUE)$/;
var YAML_FALSE = /^(false|False|FALSE)$/;
var YAML_NULL = /^(null|Null|NULL|~)$/;

function yamlScalar(t, no, err) {
  var s = asStr(t).trim();
  var ch = s.charAt(0);
  if (ch === "'") {
    if (s.length < 2 || s.charAt(s.length - 1) !== "'") return err('Unterminated single-quoted string.', no);
    return s.slice(1, -1).replace(/''/g, "'");
  }
  if (ch === '"') {
    if (s.length < 2 || s.charAt(s.length - 1) !== '"') return err('Unterminated double-quoted string.', no);
    return decodeYamlDq(s, no);
  }
  if (YAML_TRUE.test(s)) return true;
  if (YAML_FALSE.test(s)) return false;
  if (YAML_NULL.test(s)) return null;
  if (YAML_NUM.test(s)) return Number(s);
  return s;
}

function decodeYamlDq(s, no) {
  var out = '';
  var i = 1;
  var n = s.length - 1;
  while (i < n) {
    var c = s.charAt(i);
    if (c === '\\') {
      var nxt = s.charAt(i + 1);
      if (nxt === 'n') { out += '\n'; i += 2; }
      else if (nxt === 't') { out += '\t'; i += 2; }
      else if (nxt === 'r') { out += '\r'; i += 2; }
      else if (nxt === 'b') { out += '\b'; i += 2; }
      else if (nxt === 'f') { out += '\f'; i += 2; }
      else if (nxt === '\\' || nxt === '"') { out += nxt; i += 2; }
      else { out += c; i++; }
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

/* Split "key: value" — colon must be followed by space or nothing. */
function yamlSplitKey(content) {
  var q = '';
  for (var i = 0; i < content.length; i++) {
    var c = content.charAt(i);
    if (q) {
      if (q === '"' && c === '\\') { i++; continue; }
      if (c === q) q = '';
    } else if (c === '"' || c === "'") {
      q = c;
    } else if (c === ':') {
      var after = content.slice(i + 1);
      if (after === '' || /^[ \t]/.test(after)) {
        return { key: content.slice(0, i), rest: after };
      }
    }
  }
  return null;
}

function yamlDashRest(content) {
  var t = content.trim();
  if (t === '-') return '';
  var m = /^-\s*/.exec(t);
  if (!m) return null;
  return t.slice(m[0].length);
}

/* Strip # comments (kept out of quoted strings). */
function stripYamlComment(line) {
  var q = '';
  for (var i = 0; i < line.length; i++) {
    var c = line.charAt(i);
    if (q) {
      if (q === '"' && c === '\\') { i++; continue; }
      if (c === q) q = '';
    } else if (c === '"' || c === "'") {
      q = c;
    } else if (c === '#' && (i === 0 || /\s/.test(line.charAt(i - 1)))) {
      return line.slice(0, i);
    }
  }
  return line;
}

/* Parse a flow collection (single line, starts with { or [). Internal
   problems throw so the outer guard maps them to a line-accurate error. */
function parseYamlFlow(t, no, err) {
  var i = 0;
  var n = t.length;

  function fail(msg) {
    throw new Error(msg);
  }

  function skipWs() { while (i < n && /\s/.test(t.charAt(i))) i++; }

  function scalar() {
    var s = '';
    while (i < n && t.charAt(i) !== ',' && t.charAt(i) !== '}' && t.charAt(i) !== ']') {
      s += t.charAt(i);
      i++;
    }
    var v = yamlScalar(s, no, err);
    if (v && typeof v === 'object' && v.ok === false) throw new Error('Unterminated quoted string inside a flow collection.');
    return v;
  }

  function parse() {
    skipWs();
    if (i >= n) fail('Unterminated flow collection.');
    var c = t.charAt(i);
    if (c === '{') return parseObj();
    if (c === '[') return parseArr();
    return scalar();
  }

  function parseObj() {
    i++;
    var obj = {};
    skipWs();
    if (t.charAt(i) === '}') { i++; return obj; }
    for (;;) {
      skipWs();
      var keyStart = i;
      var q = '';
      var colonAt = -1;
      while (i < n) {
        var c = t.charAt(i);
        if (q) {
          if (q === '"' && c === '\\') { i++; }
          else if (c === q) q = '';
        } else if (c === '"' || c === "'") {
          q = c;
        } else if (c === ':') {
          var after = t.slice(i + 1);
          if (after === '' || /^[ \t]/.test(after) || after.charAt(0) === '{' || after.charAt(0) === '[') {
            colonAt = i;
            break;
          }
        }
        i++;
      }
      if (colonAt < 0) fail('Invalid key inside a flow collection.');
      var key = yamlScalar(t.slice(keyStart, colonAt), no, err);
      if (key && typeof key === 'object' && key.ok === false) fail('Unterminated quoted key inside a flow collection.');
      i = colonAt + 1;
      skipWs();
      var value;
      var nc = t.charAt(i);
      if (nc === '{' || nc === '[') value = parse();
      else value = scalar();
      obj[key] = value;
      skipWs();
      if (t.charAt(i) === ',') { i++; continue; }
      if (t.charAt(i) === '}') { i++; return obj; }
      fail('Expected "," or "}" inside a flow collection.');
    }
  }

  function parseArr() {
    i++;
    var arr = [];
    skipWs();
    if (t.charAt(i) === ']') { i++; return arr; }
    for (;;) {
      skipWs();
      var c = t.charAt(i);
      if (c === '{' || c === '[') arr.push(parse());
      else arr.push(scalar());
      skipWs();
      if (t.charAt(i) === ',') { i++; continue; }
      if (t.charAt(i) === ']') { i++; return arr; }
      fail('Expected "," or "]" inside a flow collection.');
    }
  }

  try {
    var out = parse();
    skipWs();
    if (i !== n) fail('Unexpected characters after a flow collection.');
    return out;
  } catch (e) {
    return err(e && e.message ? e.message : 'Could not parse flow collection.', no);
  }
}

function yamlValueFromText(rest, no, err) {
  var t = asStr(rest).trim();
  if (t === '') return '';
  var ch = t.charAt(0);
  if (ch === '{' || ch === '[') return parseYamlFlow(t, no, err);
  return yamlScalar(t, no, err);
}

export function yamlToJson(text) {
  return safe(function () {
    var raw = asStr(text);
    if (!raw.trim()) return { ok: true, data: null };

    var src = [];
    var pieces = raw.split(/\r\n|\r|\n/);
    for (var k = 0; k < pieces.length; k++) {
      var lineNo = k + 1;
      if (/^\s*\t/.test(pieces[k])) {
        return { ok: false, data: null, error: 'Tabs cannot be used for indentation.', line: lineNo };
      }
      var content = stripYamlComment(pieces[k]).trimEnd();
      var indent = pieces[k].length - pieces[k].trimStart().length;
      if (content === '') continue;
      if (content === '---' || content === '...') continue;
      src.push({ indent: indent, content: content, line: lineNo });
    }
    if (!src.length) return { ok: true, data: null };

    var pos = 0;
    var n = src.length;

    function err(msg, no) {
      return { ok: false, data: null, error: msg, line: no };
    }

    function peek() { return src[pos]; }

    function isMapLine(content) { return yamlSplitKey(content) !== null; }

    function isSeqLine(content) { return yamlDashRest(content) !== null; }

    /* parse the value of "key:" whose body continues on deeper lines */
    function parseNested(indent, no) {
      var c = peek();
      if (!c || c.indent <= indent) return null;
      return parseNode(c.indent);
    }

    /* parse a full node (map, sequence or scalar) whose first line is
       at src[pos] with exactly `indent` spaces */
    function parseNode(indent) {
      var c = peek();
      if (!c) return null;
      if (c.indent < indent) return null;
      if (c.indent > indent) return err('Unexpected indentation on line ' + c.line + '.', c.line);
      if (isSeqLine(c.content)) return parseSeq(indent);
      if (isMapLine(c.content)) return parseMap(indent);
      /* scalar node */
      pos++;
      return yamlValueFromText(c.content, c.line, err);
    }

    function parseMap(indent) {
      var obj = {};
      for (;;) {
        var c = peek();
        if (!c || c.indent < indent) break;
        if (c.indent > indent) {
          var prior = src[pos - 1] || c;
          return err('Unexpected indentation on line ' + c.line + '.', c.line);
        }
        var kv = yamlSplitKey(c.content);
        if (!kv) return err('Expected "key: value" on line ' + c.line + '.', c.line);
        pos++;
        var key = yamlScalar(kv.key, c.line, err);
        if (key && typeof key === 'object' && key.ok === false) return key;
        var rest = kv.rest.trim();
        var value;
        if (rest === '') {
          value = parseNested(indent, c.line);
          if (value && typeof value === 'object' && value.ok === false) return value;
          if (value === undefined) value = null;
        } else if (rest === '|' || rest === '>' || rest === '|-' || rest === '>-') {
          value = parseBlockString(rest.charAt(0), indent, c.line);
          if (value && value.ok === false) return value;
        } else {
          value = yamlValueFromText(rest, c.line, err);
          if (value && typeof value === 'object' && value.ok === false) return value;
        }
        obj[key] = value;
      }
      return obj;
    }

    /* literal | or folded > block string, consuming deeper lines */
    function parseBlockString(kind, indent, no) {
      var parts = [];
      var i = pos;
      var last = i;
      while (i < n && src[i].indent > indent) { last = i + 1; i++; }
      for (var j = pos; j < last; j++) parts.push(src[j].content);
      pos = last;
      if (!parts.length) return '';
      var out;
      if (kind === '>') out = parts.join(' ');
      else out = parts.join('\n');
      return out;
    }

    function parseSeq(indent) {
      var arr = [];
      for (;;) {
        var c = peek();
        if (!c || c.indent < indent) break;
        if (c.indent > indent) return err('Unexpected indentation on line ' + c.line + '.', c.line);
        var rest = yamlDashRest(c.content);
        if (rest === null) break;
        pos++;
        var value;
        if (rest === '') {
          var nested = parseNested(indent, c.line);
          if (nested && nested.ok === false) return nested;
          value = nested === undefined || nested === null ? null : nested;
        } else if (isMapLine(rest)) {
          /* "- key: value" starts a nested mapping; further keys follow
             at this same indentation. Reuse parseMap, but the current
             line was already consumed — seed the object manually. */
          var kv = yamlSplitKey(rest);
          var obj = {};
          var key = yamlScalar(kv.key, c.line, err);
          if (key && typeof key === 'object' && key.ok === false) return key;
          var r2 = kv.rest.trim();
          if (r2 === '') {
            var child = parseNested(indent, c.line);
            if (child && child.ok === false) return child;
            obj[key] = child === undefined ? null : child;
          } else if (r2 === '|' || r2 === '>') {
            obj[key] = parseBlockString(r2.charAt(0), indent, c.line);
          } else {
            obj[key] = yamlValueFromText(r2, c.line, err);
          }
          value = obj;
          /* continue collecting sibling keys at this indent — but stop
             when the next line opens a new "- " item */
          for (;;) {
            var nxt = peek();
            if (!nxt || nxt.indent < indent) break;
            if (nxt.indent > indent) return err('Unexpected indentation on line ' + nxt.line + '.', nxt.line);
            if (yamlDashRest(nxt.content) !== null) break;
            var kv2 = yamlSplitKey(nxt.content);
            if (!kv2) break;
            pos++;
            var key2 = yamlScalar(kv2.key, nxt.line, err);
            if (key2 && typeof key2 === 'object' && key2.ok === false) return key2;
            var r3 = kv2.rest.trim();
            if (r3 === '') {
              var ch2 = parseNested(indent, nxt.line);
              if (ch2 && ch2.ok === false) return ch2;
              obj[key2] = ch2 === undefined ? null : ch2;
            } else {
              obj[key2] = yamlValueFromText(r3, nxt.line, err);
            }
          }
        } else {
          value = yamlValueFromText(rest, c.line, err);
          if (value && value.ok === false) return value;
        }
        arr.push(value);
      }
      return arr;
    }

    var first = peek();
    var root;
    if (isSeqLine(first.content)) {
      root = parseSeq(first.indent);
    } else if (isMapLine(first.content)) {
      root = parseMap(first.indent);
    } else {
      pos++;
      root = yamlValueFromText(first.content, first.line, err);
    }
    if (root && typeof root === 'object' && root.ok === false) return root;
    if (pos < n) {
      var leftover = src[pos];
      return err('Unexpected content on line ' + leftover.line + '.', leftover.line);
    }
    return { ok: true, data: root };
  }, { ok: false, data: null, error: 'Could not parse YAML.', line: 1 });
}

/* ── XML ─────────────────────────────────────────────────────────── */
/* Tokenizer + well-formedness validation with line/col errors.
   Token types: element / end / text / comment / cdata / decl / pi. */

function xmlLineCol(s, idx) {
  var line = 1;
  var col = 1;
  var end = Math.min(idx, s.length);
  for (var i = 0; i < end; i++) {
    if (s.charAt(i) === '\n') { line++; col = 1; } else { col++; }
  }
  return { line: line, col: col };
}

function xmlParseAttr(tagInner, startIdx, posInfo, err) {
  var attrs = [];
  var i = 0;
  var n = tagInner.length;
  while (i < n) {
    while (i < n && /\s/.test(tagInner.charAt(i))) i++;
    if (i >= n) break;
    var nameStart = i;
    while (i < n && !/[\s=]/.test(tagInner.charAt(i))) i++;
    if (i === nameStart) break;
    var name = tagInner.slice(nameStart, i);
    while (i < n && /\s/.test(tagInner.charAt(i))) i++;
    var value = null;
    if (tagInner.charAt(i) === '=') {
      i++;
      while (i < n && /\s/.test(tagInner.charAt(i))) i++;
      var q = tagInner.charAt(i);
      if (q !== '"' && q !== "'") {
        return err('Attribute "' + name + '" must have a quoted value.', posInfo.line, posInfo.col);
      }
      i++;
      var vs = i;
      while (i < n && tagInner.charAt(i) !== q) i++;
      if (i >= n) return err('Unterminated value for attribute "' + name + '".', posInfo.line, posInfo.col);
      value = tagInner.slice(vs, i);
      i++;
    }
    attrs.push({ name: name, value: value });
  }
  return { ok: true, attrs: attrs };
}

function xmlNameOk(name) {
  return /^[A-Za-z_][A-Za-z0-9_.-]*$/.test(name);
}

/* Core scanner: returns { ok, nodes } or { ok:false, error, line, col }. */
export function xmlValidate(text) {
  return safe(function () {
    var s = asStr(text).trim();
    if (!s) return { ok: true, nodes: [] };

    var nodes = [];
    var stack = [];
    var i = 0;
    var n = s.length;

    function err(msg, idx) {
      var lc = xmlLineCol(s, idx);
      return { ok: false, error: msg, line: lc.line, col: lc.col, position: idx };
    }

    function skipWs() { while (i < n && /\s/.test(s.charAt(i))) i++; }

    function textRun() {
      var start = i;
      while (i < n && s.charAt(i) !== '<') i++;
      if (i > start) nodes.push({ type: 'text', value: s.slice(start, i) });
    }

    while (i < n) {
      if (s.charAt(i) !== '<') { textRun(); continue; }

      /* comment */
      if (s.slice(i, i + 4) === '<!--') {
        var ce = s.indexOf('-->', i + 4);
        if (ce === -1) return err('Unterminated comment.', i);
        nodes.push({ type: 'comment', value: s.slice(i + 4, ce) });
        i = ce + 3;
        continue;
      }

      /* CDATA */
      if (s.slice(i, i + 9) === '<![CDATA[') {
        var de = s.indexOf(']]>', i + 9);
        if (de === -1) return err('Unterminated CDATA section.', i);
        nodes.push({ type: 'cdata', value: s.slice(i + 9, de) });
        i = de + 3;
        continue;
      }

      /* declaration / DOCTYPE / PI (kept verbatim) */
      if (s.charAt(i + 1) === '!' || s.charAt(i + 1) === '?') {
        var closer = s.charAt(i + 1) === '?' ? '?>' : '>';
        var dd = s.indexOf(closer, i + 2);
        if (dd === -1) return err('Unterminated markup declaration.', i);
        var raw = s.slice(i, dd + closer.length);
        if (/^<\?xml/i.test(raw)) nodes.push({ type: 'decl', value: raw });
        else if (s.charAt(i + 1) === '!') nodes.push({ type: 'doctype', value: raw });
        else nodes.push({ type: 'pi', value: raw });
        i = dd + closer.length;
        continue;
      }

      /* element tag */
      var gt = s.indexOf('>', i + 1);
      if (gt === -1) return err('Unterminated tag.', i);
      var tagRaw = s.slice(i + 1, gt);
      var selfClose = /\/\s*$/.test(tagRaw);
      if (selfClose) tagRaw = tagRaw.replace(/\/\s*$/, '');
      var isEnd = tagRaw.charAt(0) === '/';
      if (isEnd) tagRaw = tagRaw.slice(1).trim();
      else tagRaw = tagRaw.trim();

      if (!tagRaw) return err('Empty tag name.', i);
      var nameEnd = /[\s/]/.exec(tagRaw);
      var name = nameEnd ? tagRaw.slice(0, nameEnd.index) : tagRaw;
      if (!xmlNameOk(name)) return err('Invalid tag name "' + name + '".', i);

      if (isEnd) {
        if (!stack.length) return err('Unexpected closing tag </' + tagRaw + '>.', i);
        var top = stack[stack.length - 1];
        if (top !== tagRaw) return err('Mismatched tag: expected </' + top + '> but found </' + tagRaw + '>.', i);
        stack.pop();
        nodes.push({ type: 'end', name: tagRaw });
        i = gt + 1;
        continue;
      }

      /* attributes live before any whitespace in the tag name area */
      var inner = nameEnd ? tagRaw.slice(nameEnd.index) : '';
      var attrRes = xmlParseAttr(inner, i, { line: 0, col: 0 }, err);
      if (attrRes.ok === false) return attrRes;
      nodes.push({ type: 'element', name: name, attrs: attrRes.attrs, selfClose: selfClose });
      if (!selfClose) stack.push(name);
      i = gt + 1;
    }

    if (stack.length) {
      return err('Unexpected end of document — tag <' + stack[stack.length - 1] + '> is never closed.', s.length);
    }
    return { ok: true, nodes: nodes };
  }, { ok: false, error: 'Could not validate XML.', line: 1, col: 1 });
}

/* Pretty-print validated XML (2-space indent). */
export function xmlPretty(text) {
  return safe(function () {
    var check = xmlValidate(text);
    if (!check.ok) return check;
    var nodes = check.nodes;
    var out = [];
    var indent = '  ';

    function esc(v) {
      return String(v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function render(idx, depth) {
      if (idx >= nodes.length) return idx;
      var node = nodes[idx];
      var pad = depth ? new Array(depth + 1).join(indent) : '';
      if (node.type === 'text') {
        if (/\S/.test(node.value)) out.push(node.value.trim());
        return idx + 1;
      }
      if (node.type === 'comment') { out.push(pad + '<!--' + node.value + '-->'); return idx + 1; }
      if (node.type === 'cdata') { out.push(pad + '<![CDATA[' + node.value + ']]>'); return idx + 1; }
      if (node.type === 'decl' || node.type === 'doctype' || node.type === 'pi') {
        out.push(node.value);
        return idx + 1;
      }
      if (node.type === 'end') {
        out.push(pad + '</' + node.name + '>');
        return idx + 1;
      }
      /* element */
      var attrs = (node.attrs || []).map(function (a) {
        return a.value === null ? ' ' + a.name : ' ' + a.name + '="' + esc(a.value) + '"';
      }).join('');
      var open = '<' + node.name + attrs;
      if (node.selfClose) { out.push(pad + open + '/>'); return idx + 1; }

      var next = nodes[idx + 1];
      var onlyText = next && next.type === 'text' && /\S/.test(next.value) &&
        (nodes[idx + 2] === undefined || nodes[idx + 2].type === 'end');
      if (onlyText) {
        out.push(pad + open + '>' + next.value.trim() + '</' + node.name + '>');
        return idx + 2;
      }

      var child = idx + 1;
      var childCount = 0;
      var j = child;
      while (j < nodes.length && !(nodes[j].type === 'end' && nodes[j].name === node.name)) { j++; childCount++; }
      if (childCount === 0) { out.push(pad + open + '></' + node.name + '>'); return j + 1; }
      out.push(pad + open + '>');
      var p = child;
      while (p < j) p = render(p, depth + 1);
      out.push(pad + '</' + node.name + '>');
      return j + 1;
    }

    var p = 0;
    while (p < nodes.length) p = render(p, 0);
    return { ok: true, data: out.join('\n') };
  }, { ok: false, error: 'Could not format XML.', line: 1, col: 1 });
}

/* Minify validated XML: comments removed, inter-tag whitespace gone. */
export function xmlMinify(text) {
  return safe(function () {
    var check = xmlValidate(text);
    if (!check.ok) return check;
    var nodes = check.nodes;
    var out = [];

    function esc(v) {
      return String(v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.type === 'comment') continue;
      if (node.type === 'text') { if (/\S/.test(node.value)) out.push(node.value.trim()); continue; }
      if (node.type === 'cdata') { out.push('<![CDATA[' + node.value + ']]>'); continue; }
      if (node.type === 'decl' || node.type === 'doctype' || node.type === 'pi') { out.push(node.value); continue; }
      if (node.type === 'end') { out.push('</' + node.name + '>'); continue; }
      var attrs = (node.attrs || []).map(function (a) {
        return a.value === null ? ' ' + a.name : ' ' + a.name + '="' + esc(a.value) + '"';
      }).join('');
      if (node.selfClose) out.push('<' + node.name + attrs + '/>');
      else out.push('<' + node.name + attrs + '>');
    }
    return { ok: true, data: out.join('') };
  }, { ok: false, error: 'Could not minify XML.', line: 1, col: 1 });
}

/* ── Markdown ────────────────────────────────────────────────────── */
/* Block + inline tokenizer. Never throws; garbage in → safe tokens.
   Block token types: h (level), p, ul, ol, code, bq, hr.
   Inline token types: text, strong, em, code, link. */

function mdEscape(v) {
  return String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mdInlineTokens(s) {
  var out = [];
  var i = 0;
  var n = s.length;

  function pushText(t) {
    if (t === '') return;
    var last = out[out.length - 1];
    if (last && last.t === 'text') last.v += t;
    else out.push({ t: 'text', v: t });
  }

  function findChar(str, ch, from, count) {
    for (var k = from; k < str.length; k++) {
      if (str.charAt(k) === ch) {
        var run = 1;
        while (run < count && str.charAt(k + run) === ch) run++;
        if (run === count) return k;
      }
    }
    return -1;
  }

  while (i < n) {
    var c = s.charAt(i);

    if (c === '`') {
      var run = 1;
      while (s.charAt(i + run) === '`') run++;
      var marker = new Array(run + 1).join('`');
      var close = s.indexOf(marker, i + run);
      if (close !== -1) {
        out.push({ t: 'code', v: s.slice(i + run, close) });
        i = close + run;
        continue;
      }
      pushText(c);
      i++;
      continue;
    }

    if (c === '[') {
      var lb = s.indexOf('](', i + 1);
      if (lb !== -1) {
        var rb = s.indexOf(')', lb + 2);
        if (rb !== -1) {
          var label = s.slice(i + 1, lb);
          var dest = s.slice(lb + 2, rb).trim();
          var title = '';
          var dm = /^(\S+)(?:\s+["']([^"']*)["'])?$/.exec(dest);
          if (dm) { dest = dm[1]; title = dm[2] || ''; }
          if (/^(https?:\/\/|mailto:)/.test(dest) || /^\/|^#/.test(dest) || /^[A-Za-z0-9_.\/-]+$/.test(dest)) {
            out.push({ t: 'link', href: dest, title: title, c: mdInlineTokens(label) });
            i = rb + 1;
            continue;
          }
        }
      }
      pushText(c);
      i++;
      continue;
    }

    if (c === '<') {
      var lt = s.indexOf('>', i + 1);
      if (lt !== -1) {
        var inner = s.slice(i + 1, lt);
        if (/^[a-z]+:/i.test(inner) && /^(https?:\/\/|mailto:)/.test(inner)) {
          out.push({ t: 'link', href: inner, title: '', c: [{ t: 'text', v: inner }] });
          i = lt + 1;
          continue;
        }
      }
      pushText(c);
      i++;
      continue;
    }

    if (c === '*' || c === '_') {
      var strong = c === '*' ? s.charAt(i + 1) === '*' : s.charAt(i + 1) === '_';
      var opener = strong ? c + c : c;
      var closer = findChar(s, c, i + opener.length, strong ? 2 : 1);
      if (closer !== -1 && closer > i + opener.length) {
        var innerText = s.slice(i + opener.length, closer);
        var inner = mdInlineTokens(innerText);
        out.push({ t: strong ? 'strong' : 'em', c: inner });
        i = closer + opener.length;
        continue;
      }
      pushText(c);
      i++;
      continue;
    }

    var next = n;
    var sc = -1;
    for (var j = i; j < n; j++) {
      var ch = s.charAt(j);
      if (ch === '*' || ch === '_' || ch === '`' || ch === '[' || ch === '<') { sc = j; break; }
    }
    if (sc === -1) { pushText(s.slice(i)); break; }
    pushText(s.slice(i, sc));
    i = sc;
  }
  return out;
}

export function markdownTokens(text) {
  return safe(function () {
    var s = asStr(text).replace(/\r\n/g, '\n');
    var lines = s.split('\n');
    var blocks = [];
    var i = 0;
    var n = lines.length;

    function isBlank(l) { return l.trim() === ''; }

    function fenceAt(l) {
      var m = /^\s*(```+|~~~+)\s*(\S*)\s*$/.exec(l);
      return m ? { mark: m[1], lang: m[2] } : null;
    }

    function hrAt(l) {
      var t = l.trim();
      return /^(-{3,}|\*{3,}|_{3,})$/.test(t);
    }

    function hdAt(l) {
      var m = /^\s*(#{1,6})\s+(.*)$/.exec(l);
      return m ? { level: m[1].length, rest: m[2] } : null;
    }

    function quoteAt(l) {
      var m = /^\s*>\s?(.*)$/.exec(l);
      return m ? m[1] : null;
    }

    function listAt(l) {
      var m = /^\s*([-*+]|\d+[.)])\s+(.*)$/.exec(l);
      if (!m) return null;
      var ordered = /\d/.test(m[1]);
      return { ordered: ordered, rest: m[2] };
    }

    while (i < n) {
      var line = lines[i];
      if (isBlank(line)) { i++; continue; }

      var hd = hdAt(line);
      if (hd) {
        blocks.push({ t: 'h', level: hd.level, c: mdInlineTokens(hd.rest) });
        i++;
        continue;
      }

      var f = fenceAt(line);
      if (f) {
        var lang = f.lang;
        var codeLines = [];
        i++;
        while (i < n) {
          var maybe = fenceAt(lines[i]);
          if (maybe) { i++; break; }
          codeLines.push(lines[i]);
          i++;
        }
        blocks.push({ t: 'code', lang: lang, v: codeLines.join('\n') });
        continue;
      }

      if (hrAt(line)) {
        blocks.push({ t: 'hr' });
        i++;
        continue;
      }

      var q = quoteAt(line);
      if (q !== null) {
        var qLines = [q];
        i++;
        while (i < n) {
          var qn = quoteAt(lines[i]);
          if (qn === null) break;
          qLines.push(qn);
          i++;
        }
        blocks.push({ t: 'bq', c: mdInlineTokens(qLines.join('\n')) });
        continue;
      }

      var li = listAt(line);
      if (li) {
        var ordered = li.ordered;
        var items = [li.rest];
        i++;
        while (i < n) {
          var lin = listAt(lines[i]);
          if (lin && lin.ordered === ordered) { items.push(lin.rest); i++; continue; }
          if (isBlank(lines[i])) {
            var j2 = i + 1;
            if (j2 < n && listAt(lines[j2]) && listAt(lines[j2]).ordered === ordered) { i = j2; continue; }
          }
          break;
        }
        blocks.push({ t: ordered ? 'ol' : 'ul', items: items.map(function (it) { return { c: mdInlineTokens(it) }; }) });
        continue;
      }

      /* paragraph: join until blank or another block starter */
      var para = [line.trim()];
      i++;
      while (i < n) {
        var l2 = lines[i];
        if (isBlank(l2) || hdAt(l2) || fenceAt(l2) || hrAt(l2) || quoteAt(l2) !== null || listAt(l2)) break;
        para.push(l2.trim());
        i++;
      }
      blocks.push({ t: 'p', c: mdInlineTokens(para.join(' ')) });
    }
    return blocks;
  }, []);
}

/* Render tokens to an escaped HTML string (used for the copy button). */
export function markdownToHtml(text) {
  return safe(function () {
    var blocks = markdownTokens(text);
    var out = [];

    function inline(toks) {
      var h = '';
      toks.forEach(function (tk) {
        if (tk.t === 'text') h += mdEscape(tk.v);
        else if (tk.t === 'code') h += '<code>' + mdEscape(tk.v) + '</code>';
        else if (tk.t === 'strong') h += '<strong>' + inline(tk.c) + '</strong>';
        else if (tk.t === 'em') h += '<em>' + inline(tk.c) + '</em>';
        else if (tk.t === 'link') {
          h += '<a href="' + mdEscape(tk.href) + '"' + (tk.title ? ' title="' + mdEscape(tk.title) + '"' : '') + '>' + inline(tk.c) + '</a>';
        }
      });
      return h;
    }

    blocks.forEach(function (b) {
      if (b.t === 'h') out.push('<h' + b.level + '>' + inline(b.c) + '</h' + b.level + '>');
      else if (b.t === 'p') out.push('<p>' + inline(b.c) + '</p>');
      else if (b.t === 'hr') out.push('<hr>');
      else if (b.t === 'code') out.push('<pre><code>' + mdEscape(b.v) + '</code></pre>');
      else if (b.t === 'bq') out.push('<blockquote>' + inline(b.c) + '</blockquote>');
      else if (b.t === 'ul' || b.t === 'ol') {
        var tag = b.t === 'ul' ? 'ul' : 'ol';
        out.push('<' + tag + '>' + b.items.map(function (it) { return '<li>' + inline(it.c) + '</li>'; }).join('') + '</' + tag + '>');
      }
    });
    return out.join('\n');
  }, '');
}

/* ── Diff (word-level LCS) ───────────────────────────────────────── */
function splitWords(s) {
  var re = /(\s+)|([^\s]+)/g;
  var m;
  var out = [];
  while ((m = re.exec(s)) !== null) {
    out.push({ text: m[0], ws: m[1] !== undefined });
  }
  return out;
}

/* Backtrack an LCS table into ops, merging neighbouring runs. */
function lcsOps(a, b) {
  var m = a.length;
  var n = b.length;
  var i, j;
  var dp = [];
  for (i = 0; i <= m; i++) {
    dp.push(new Array(n + 1).fill(0));
  }
  for (i = m - 1; i >= 0; i--) {
    for (j = n - 1; j >= 0; j--) {
      if (a[i].text === b[j].text) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = dp[i + 1][j] > dp[i][j + 1] ? dp[i + 1][j] : dp[i][j + 1];
    }
  }
  var ops = [];
  i = 0;
  j = 0;
  while (i < m && j < n) {
    if (a[i].text === b[j].text) {
      ops.push({ type: 'same', text: a[i].text });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'del', text: a[i].text });
      i++;
    } else {
      ops.push({ type: 'add', text: b[j].text });
      j++;
    }
  }
  while (i < m) { ops.push({ type: 'del', text: a[i].text }); i++; }
  while (j < n) { ops.push({ type: 'add', text: b[j].text }); j++; }
  return ops;
}

function mergeOps(ops) {
  var merged = [];
  ops.forEach(function (op) {
    var last = merged[merged.length - 1];
    if (last && last.type === op.type) last.text += op.text;
    else merged.push({ type: op.type, text: op.text });
  });
  return merged;
}

/* Word-level LCS diff. Returns { ops, counts, wordsA, wordsB }. */
export function diffWords(textA, textB) {
  return safe(function () {
    var a = splitWords(asStr(textA));
    var b = splitWords(asStr(textB));
    var ops;
    if (a.length * b.length > 3000000) {
      /* guard huge inputs: identical prefix, then del/add the rest */
      var prefix = 0;
      while (prefix < a.length && prefix < b.length && a[prefix].text === b[prefix].text) prefix++;
      ops = [];
      for (var k = 0; k < prefix; k++) ops.push({ type: 'same', text: a[k].text });
      for (var x = prefix; x < a.length; x++) ops.push({ type: 'del', text: a[x].text });
      for (var y = prefix; y < b.length; y++) ops.push({ type: 'add', text: b[y].text });
    } else {
      ops = mergeOps(lcsOps(a, b));
    }
    var counts = { add: 0, del: 0, same: 0 };
    ops.forEach(function (op) {
      var words = splitWords(op.text).filter(function (w) { return !w.ws; }).length;
      if (op.type === 'add') counts.add += words;
      else if (op.type === 'del') counts.del += words;
      else counts.same += words;
    });
    return { ops: ops, counts: counts, wordsA: a.filter(function (w) { return !w.ws; }).length, wordsB: b.filter(function (w) { return !w.ws; }).length };
  }, { ops: [], counts: { add: 0, del: 0, same: 0 }, wordsA: 0, wordsB: 0 });
}

/* Line-level LCS diff (whole lines as units). */
export function diffLines(textA, textB) {
  return safe(function () {
    var a = asStr(textA).split(/\r\n|\n/);
    var b = asStr(textB).split(/\r\n|\n/);
    if (a.length && a[a.length - 1] === '') a.pop();
    if (b.length && b[b.length - 1] === '') b.pop();
    var ops;
    if (a.length * b.length > 1000000) {
      var prefix = 0;
      while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++;
      ops = [];
      for (var k = 0; k < prefix; k++) ops.push({ type: 'same', line: a[k] });
      for (var x = prefix; x < a.length; x++) ops.push({ type: 'del', line: a[x] });
      for (var y = prefix; y < b.length; y++) ops.push({ type: 'add', line: b[y] });
    } else {
      var linesA = a.map(function (l) { return { text: l }; });
      var linesB = b.map(function (l) { return { text: l }; });
      var merged = mergeOps(lcsOps(linesA, linesB));
      ops = merged.map(function (op) { return { type: op.type, line: op.text }; });
    }
    var counts = { add: 0, del: 0, same: 0 };
    ops.forEach(function (op) {
      if (op.type === 'add') counts.add++;
      else if (op.type === 'del') counts.del++;
      else counts.same++;
    });
    return { ops: ops, counts: counts, linesA: a.length, linesB: b.length };
  }, { ops: [], counts: { add: 0, del: 0, same: 0 }, linesA: 0, linesB: 0 });
}

/* ── List sorter ─────────────────────────────────────────────────── */
/* Sort/dedupe/reverse/shuffle an array of lines.
   opts: { order:'alpha'|'numeric', direction:'asc'|'desc',
           dedupe:bool, dedupeMode:'exact'|'trim'|'ci',
           reverse:bool, shuffle:bool, rng:function } */
export function sortList(input, opts) {
  return safe(function () {
    var o = isPlainObj(opts) ? opts : {};
    var lines = [];
    if (Array.isArray(input)) {
      lines = input.map(function (l) { return String(l == null ? '' : l); });
    } else if (typeof input === 'string') {
      lines = input.split(/\r\n|\r|\n/);
    }
    var total = lines.length;

    function rngFn(r) {
      if (typeof r === 'function') return r;
      if (r && typeof r.next === 'function') return function () { return r.next(); };
      return Math.random;
    }

    var arr = lines.slice();

    if (o.shuffle === true) {
      var r = rngFn(o.rng);
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(r() * (i + 1));
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
    } else {
      var numeric = o.order === 'numeric';
      var dir = o.direction === 'desc' ? -1 : 1;
      var nonNumeric = 0;
      var parsed = arr.map(function (l) {
        var v = parseFloat(l.replace(/,/g, ''));
        if (numeric && !isFinite(v)) { nonNumeric++; return null; }
        return v;
      });
      var sorted = arr.slice();
      sorted.sort(function (x, y) {
        if (numeric) {
          var px = parseFloat(x.replace(/,/g, ''));
          var py = parseFloat(y.replace(/,/g, ''));
          var fx = isFinite(px);
          var fy = isFinite(py);
          if (fx && fy) return px === py ? 0 : (px < py ? -1 * dir : 1 * dir);
          if (fx) return -1;
          if (fy) return 1;
          return dir === 1 ? 1 : -1;
        }
        var c = String(x).localeCompare(String(y));
        return c * dir;
      });
      arr = sorted;
    }

    if (o.dedupe === true) {
      var mode = o.dedupeMode || 'exact';
      var seen = {};
      var out = [];
      arr.forEach(function (l) {
        var key;
        if (mode === 'trim') key = '|' + l.trim();
        else if (mode === 'ci') key = '|' + l.toLocaleLowerCase();
        else key = '|' + l;
        if (!seen[key]) { seen[key] = true; out.push(l); }
      });
      arr = out;
    }

    if (o.reverse === true && o.shuffle !== true) {
      var rev = [];
      for (var k = arr.length - 1; k >= 0; k--) rev.push(arr[k]);
      arr = rev;
    }

    return {
      ok: true,
      lines: arr,
      stats: {
        total: total,
        output: arr.length,
        removed: total - arr.length,
        deduped: total - arr.length
      }
    };
  }, { ok: true, lines: [], stats: { total: 0, output: 0, removed: 0, deduped: 0 } });
}
