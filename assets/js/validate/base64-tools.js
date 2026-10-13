/* base64-tools.js — pure Base64 encode/decode for text (Unicode-safe
   via TextEncoder/TextDecoder). Node-testable. */

function bytesToBase64(bytes) {
  var binary = '';
  var chunk = 0x8000;
  for (var i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return btoa(binary);
}

/* Encode text to Base64. Returns '' on failure (never throws). */
export function encodeTextBase64(text) {
  try {
    var bytes = new TextEncoder().encode(String(text == null ? '' : text));
    return bytesToBase64(bytes);
  } catch (e) {
    return '';
  }
}

/* Decode Base64 to text. Returns null when the input is not valid
   Base64 or does not decode to UTF-8. */
export function decodeTextBase64(b64) {
  try {
    var clean = String(b64 == null ? '' : b64).trim();
    var binary = atob(clean);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (e) {
    return null;
  }
}

/* Loose shape check: non-empty, correct alphabet, length divisible by 4. */
export function looksLikeBase64(b64) {
  var clean = String(b64 == null ? '' : b64).trim();
  if (!clean) return false;
  if (clean.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]*={0,2}$/.test(clean);
}
