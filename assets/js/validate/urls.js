/* urls.js — pure URL encode/decode and slug helpers. No DOM, no network.
   Node-testable. */

/* Percent-encode for URL/query strings (encodeURIComponent semantics). */
export function urlEncode(input) {
  var s = String(input == null ? '' : input);
  return encodeURIComponent(s);
}

/* Percent-decode; returns the original string when it is not valid
   percent-encoding (never throws). */
export function urlDecode(input) {
  var s = String(input == null ? '' : input);
  try {
    return decodeURIComponent(s);
  } catch (e) {
    return s;
  }
}

/* True when the string contains percent-escapes that decode cleanly. */
export function isEncoded(input) {
  var s = String(input == null ? '' : input);
  return /%[0-9A-Fa-f]{2}/.test(s) && urlDecode(s) !== s;
}

/* Safe URL slug: lowercase, diacritics stripped, non-alphanumerics
   collapsed into single dashes, leading/trailing dashes removed. */
export function slugify(input) {
  var s = String(input == null ? '' : input);
  s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  s = s.toLowerCase();
  s = s.replace(/[^a-z0-9]+/g, '-');
  s = s.replace(/^-+|-+$/g, '');
  return s;
}
