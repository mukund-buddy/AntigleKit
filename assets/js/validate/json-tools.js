/* json-tools.js — pure JSON formatting and validation with line/column
   error positions. Node-testable. */

/* Pretty-print JSON; returns null when the text is not valid JSON. */
export function formatJson(text, indent) {
  try {
    return JSON.stringify(JSON.parse(String(text == null ? '' : text)), null, indent == null ? 2 : indent);
  } catch (e) {
    return null;
  }
}

/* Locate the first parse error: { position, line, col, message } or null
   when the text parses cleanly. Handles both the legacy "at position N"
   message and the newer V8 format ("Unexpected token 'x', ...tail"). */
export function parseErrorPosition(text) {
  var raw = String(text == null ? '' : text);
  try {
    JSON.parse(raw);
    return null;
  } catch (e) {
    var msg = String(e.message);
    var m = msg.match(/position\s+(\d+)/i);
    var position = m ? Number(m[1]) : -1;
    if (position < 0) {
      var tm = msg.match(/Unexpected token '([^']+)'/);
      if (tm) {
        var idx = raw.lastIndexOf(tm[1]);
        if (idx >= 0) position = idx + 1;
      } else if (/end of JSON input/i.test(msg)) {
        position = raw.length;
      }
    }
    var line = 1, col = 1;
    if (position >= 0) {
      var end = Math.min(position, raw.length);
      for (var i = 0; i < end; i++) {
        if (raw[i] === '\n') { line++; col = 1; } else { col++; }
      }
    }
    return { position: position, line: line, col: col, message: msg };
  }
}

/* Validate JSON; { ok: true } or { ok: false, position, line, col,
   message }. */
export function validateJson(text) {
  var err = parseErrorPosition(text);
  if (!err) return { ok: true };
  return { ok: false, position: err.position, line: err.line, col: err.col, message: err.message };
}
