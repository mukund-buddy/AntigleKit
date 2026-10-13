/* regex-tools.js — pure regex compilation and match extraction.
   Node-testable. */

/* Compile a pattern with flags; { ok, re } or { ok: false, message }. */
export function compileRegex(pattern, flags) {
  try {
    return { ok: true, re: new RegExp(pattern, flags || '') };
  } catch (e) {
    return { ok: false, message: String(e.message) };
  }
}

/* Test a pattern against text. Returns:
   { ok: true, matchCount, matches: [{ full, groups, index }] } or
   { ok: false, error }. Guards against empty-pattern infinite loops and
   caps the reported matches at 1000. */
export function testRegex(pattern, flags, text) {
  var compiled = compileRegex(pattern, flags || '');
  if (!compiled.ok) return { ok: false, error: compiled.message };
  var re = compiled.re;
  var hay = String(text == null ? '' : text);
  var global = (flags || '').indexOf('g') !== -1;
  var matches = [];
  var m;

  if (!global) {
    m = re.exec(hay);
    if (m) matches.push({ full: m[0], groups: m.slice(1), index: m.index });
    return { ok: true, matchCount: matches.length, matches: matches };
  }

  re.lastIndex = 0;
  var count = 0;
  while ((m = re.exec(hay)) !== null) {
    matches.push({ full: m[0], groups: m.slice(1), index: m.index });
    count++;
    if (count >= 1000) break;
    if (m[0] === '') re.lastIndex++;
  }
  return { ok: true, matchCount: count, matches: matches };
}
