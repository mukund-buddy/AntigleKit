/* security-tools.js — pure helpers for the security batch: password
   generation, password strength scoring, SHA-256 digest, and a full
   QR Code encoder + decoder (byte/numeric/alphanumeric modes, masks,
   format/version info, Reed-Solomon ECC with error correction).

   Style mirrors student-tools.js / text-web-tools.js. Nothing here can
   throw; hostile inputs degrade to safe empty results. */

function isPlainObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function asStr(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

/* Run a producer inside a guard so no export can throw at the caller. */
function safe(fn, fallback) {
  try {
    return fn();
  } catch (e) {
    return fallback;
  }
}

/* ── Random ─────────────────────────────────────────────────────── */
function cryptoRandom() {
  var c = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
  if (c && typeof c.getRandomValues === 'function') {
    try {
      var b = new Uint8Array(1);
      c.getRandomValues(b);
      return b[0] / 256;
    } catch (e) {}
  }
  return Math.random();
}

/* ── Password generator ─────────────────────────────────────────── */
/* opts: { length, upper, lower, digits, symbols, excludeAmbiguous,
          excludeSimilar } → { ok, password, length, entropy } */
export function generatePassword(opts) {
  return safe(function () {
    var o = isPlainObj(opts) ? opts : {};
    var length = Math.max(1, Math.min(128, parseInt(o.length, 10) || 16));

    var LOWER = 'abcdefghijklmnopqrstuvwxyz';
    var UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var DIGITS = '0123456789';
    var SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>?/~';

    function clean(set) {
      var s = set;
      if (o.excludeAmbiguous) s = s.replace(/[Il1O0]/g, '');
      if (o.excludeSimilar) s = s.replace(/[Il1oO0]/g, '');
      return s;
    }

    var sets = [];
    var guarantees = [];
    if (o.upper !== false) { var u = clean(UPPER); if (u.length) { sets.push(u); guarantees.push(u.charAt(cryptoRandom() * u.length | 0)); } }
    if (o.lower !== false) { var l = clean(LOWER); if (l.length) { sets.push(l); guarantees.push(l.charAt(cryptoRandom() * l.length | 0)); } }
    if (o.digits !== false) { var d = clean(DIGITS); if (d.length) { sets.push(d); guarantees.push(d.charAt(cryptoRandom() * d.length | 0)); } }
    if (o.symbols === true) { var s2 = clean(SYMBOLS); if (s2.length) { sets.push(s2); guarantees.push(s2.charAt(cryptoRandom() * s2.length | 0)); } }

    if (!sets.length) return { ok: false, error: 'At least one character set must be enabled.' };
    if (length < guarantees.length) {
      return { ok: false, error: 'Length is shorter than the number of enabled character sets.' };
    }

    var all = sets.join('');
    var chars = guarantees.slice();
    while (chars.length < length) {
      chars.push(all.charAt(cryptoRandom() * all.length | 0));
    }
    /* Fisher-Yates shuffle so guaranteed chars are not predictable */
    for (var i = chars.length - 1; i > 0; i--) {
      var j = cryptoRandom() * (i + 1) | 0;
      var tmp = chars[i]; chars[i] = chars[j]; chars[j] = tmp;
    }
    var password = chars.join('');
    var entropy = Math.round(Math.log2(Math.pow(all.length, password.length)) * 10) / 10;
    return { ok: true, password: password, length: password.length, entropy: entropy, sets: sets.length };
  }, { ok: false, error: 'Could not generate a password.', length: 0, entropy: 0, sets: 0 });
}

/* ── Password strength ──────────────────────────────────────────── */
var COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '123456', '12345678', '123456789', '1234567890',
  '1234567', '12345', '1234', '123', 'qwerty', 'qwertyuiop', 'qwerty123', 'abc123', 'letmein',
  'welcome', 'monkey', 'dragon', '111111', 'iloveyou', 'admin', 'login', 'sunshine', 'princess',
  'master', 'superman', 'football', 'baseball', 'shadow', 'trustno1', 'azerty', 'welcome1',
  'hello', 'passw0rd', 'michael', 'jordan', 'ninja', 'mustang', 'batman', 'whatever'
]);

/* → { ok, score(0-100), strength, entropy, classes, length, checks } */
export function passwordStrength(password, opts) {
  return safe(function () {
    var pw = asStr(password);
    var o = isPlainObj(opts) ? opts : {};
    var minLen = Math.max(1, parseInt(o.minLength, 10) || 8);
    if (!pw) return { ok: true, score: 0, strength: 'very-weak', entropy: 0, classes: 0, length: 0, checks: {} };

    var checks = {
      length: pw.length >= minLen,
      upper: /[A-Z]/.test(pw),
      lower: /[a-z]/.test(pw),
      digit: /[0-9]/.test(pw),
      symbol: /[^A-Za-z0-9]/.test(pw)
    };
    var classes = (checks.upper ? 1 : 0) + (checks.lower ? 1 : 0) + (checks.digit ? 1 : 0) + (checks.symbol ? 1 : 0);

    var score = 0;
    score += Math.min(30, pw.length * 3);
    score += Math.max(0, (pw.length - minLen) * 2);
    score += (classes - 1) * 12;
    if (checks.length) score += 4;
    if (pw.length >= 12 && classes >= 3) score += 6;
    if (pw.length >= 16 && classes === 4) score += 6;

    var lower = pw.toLowerCase();
    if (COMMON_PASSWORDS.has(lower)) score = Math.min(score, 15);
    if (/(.)\1\1/.test(pw)) score -= 12;
    if (/^(?:(.)\1+)+$/.test(pw)) score -= 20;
    if (isSequential(lower)) score -= 15;
    if (pw.length < 8) score -= 15;

    score = Math.max(0, Math.min(100, score));
    var strength = score >= 80 ? 'very-strong' : score >= 60 ? 'strong' : score >= 40 ? 'fair' : score >= 20 ? 'weak' : 'very-weak';

    var pool = 0;
    if (checks.lower) pool += 26;
    if (checks.upper) pool += 26;
    if (checks.digit) pool += 10;
    if (checks.symbol) pool += 33;
    var entropy = pool ? Math.round(Math.log2(Math.pow(pool, pw.length)) * 10) / 10 : 0;

    return { ok: true, score: score, strength: strength, entropy: entropy, classes: classes, length: pw.length, checks: checks, common: COMMON_PASSWORDS.has(lower) };
  }, { ok: false, score: 0, strength: 'very-weak', entropy: 0, classes: 0, length: 0, checks: {} });
}

function isSequential(s) {
  for (var i = 0; i + 2 < s.length; i++) {
    var a = s.charCodeAt(i), b = s.charCodeAt(i + 1), c = s.charCodeAt(i + 2);
    if (b === a + 1 && c === b + 1) return true;
  }
  return false;
}

/* ── SHA-256 (FIPS 180-4) ───────────────────────────────────────── */
var K256 = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

function sha256Compress(bytes) {
  var h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  var h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  var w = new Uint32Array(64);
  var n = bytes.length;
  var len = Math.ceil((n + 9) / 64) * 64;
  var padded = new Uint8Array(len);
  padded.set(bytes);
  padded[n] = 0x80;
  var bitLen = n * 8;
  for (var b = 0; b < 8; b++) {
    padded[len - 1 - b] = (bitLen / Math.pow(2, 8 * b)) % 256 | 0;
  }

  for (var off = 0; off < padded.length; off += 64) {
    for (var t = 0; t < 16; t++) {
      var p = off + t * 4;
      w[t] = (padded[p] << 24) | (padded[p + 1] << 16) | (padded[p + 2] << 8) | padded[p + 3];
    }
    for (var x = 16; x < 64; x++) {
      var s0 = ror(w[x - 15], 7) ^ ror(w[x - 15], 18) ^ (w[x - 15] >>> 3);
      var s1 = ror(w[x - 2], 17) ^ ror(w[x - 2], 19) ^ (w[x - 2] >>> 10);
      w[x] = (w[x - 16] + s0 + w[x - 7] + s1) >>> 0;
    }
    var a = h0, b0 = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (var r = 0; r < 64; r++) {
      var S1 = ror(e, 6) ^ ror(e, 11) ^ ror(e, 25);
      var ch = (e & f) ^ (~e & g);
      var t1 = (h + S1 + ch + K256[r] + w[r]) >>> 0;
      var S0 = ror(a, 2) ^ ror(a, 13) ^ ror(a, 22);
      var maj = (a & b0) ^ (a & c) ^ (b0 & c);
      var t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b0; b0 = a; a = (t1 + t2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b0) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7];
}

function ror(x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0; }

/* → { ok, hex, bytes } */
export function sha256(text) {
  return safe(function () {
    var input = typeof text === 'string' ? text : asStr(text);
    var bytes = utf8Bytes(input);
    var words = sha256Compress(bytes);
    var hex = '';
    var out = [];
    for (var j = 0; j < 8; j++) {
      for (var k = 3; k >= 0; k--) {
        var byteVal = (words[j] >>> (k * 8)) & 0xff;
        out.push(byteVal);
        hex += ('0' + byteVal.toString(16)).slice(-2);
      }
    }
    return { ok: true, hex: hex, bytes: out };
  }, { ok: false, hex: '', bytes: [] });
}

/* ══════════════════════════════════════════════════════════════════
   QR Code (ISO/IEC 18004). Tables and constants follow the reference
   qrcode-generator implementation; only byte, numeric and alphanumeric
   modes are produced/consumed. Encoder chooses the best mask by the
   standard penalty rules. Decoder performs full Reed-Solomon error
   correction.
   ══════════════════════════════════════════════════════════════════ */

var QR_ECC = { L: 1, M: 0, Q: 3, H: 2 };
var QR_ECC_NAME = { 0: 'M', 1: 'L', 2: 'H', 3: 'Q' };

var PATTERN_POSITION_TABLE = [
  [],
  [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
  [6, 30, 54], [6, 32, 58], [6, 34, 62],
  [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74],
  [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90],
  [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170]
];

/* [count, totalPerBlock, dataPerBlock] triples; index = (version-1)*4 + level.
   level order: L M Q H */
var RS_BLOCK_TABLE = [
  /* 1 */  [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
  /* 2 */  [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
  /* 3 */  [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
  /* 4 */  [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
  /* 5 */  [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
  /* 6 */  [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
  /* 7 */  [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
  /* 8 */  [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
  /* 9 */  [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
  /* 10 */ [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16],
  /* 11 */ [4, 101, 81], [1, 80, 50, 4, 81, 51], [4, 50, 22, 4, 51, 23], [3, 36, 12, 8, 37, 13],
  /* 12 */ [2, 116, 92, 2, 117, 93], [6, 58, 36, 2, 59, 37], [4, 46, 20, 6, 47, 21], [7, 42, 14, 4, 43, 15],
  /* 13 */ [4, 133, 107], [8, 59, 37, 1, 60, 38], [8, 44, 20, 4, 45, 21], [12, 33, 11, 4, 34, 12],
  /* 14 */ [3, 145, 115, 1, 146, 116], [4, 64, 40, 5, 65, 41], [11, 36, 16, 5, 37, 17], [11, 36, 12, 5, 37, 13],
  /* 15 */ [5, 109, 87, 1, 110, 88], [5, 65, 41, 5, 66, 42], [5, 54, 24, 7, 55, 25], [11, 36, 12, 7, 37, 13],
  /* 16 */ [5, 122, 98, 1, 123, 99], [7, 73, 45, 3, 74, 46], [15, 43, 19, 2, 44, 20], [3, 45, 15, 13, 46, 16],
  /* 17 */ [1, 135, 107, 5, 136, 108], [10, 74, 46, 1, 75, 47], [1, 50, 22, 15, 51, 23], [2, 42, 14, 17, 43, 15],
  /* 18 */ [5, 150, 120, 1, 151, 121], [9, 69, 43, 4, 70, 44], [17, 50, 22, 1, 51, 23], [2, 42, 14, 19, 43, 15],
  /* 19 */ [3, 141, 113, 4, 142, 114], [3, 70, 44, 11, 71, 45], [17, 47, 21, 4, 48, 22], [9, 39, 13, 16, 40, 14],
  /* 20 */ [3, 135, 107, 5, 136, 108], [3, 67, 41, 13, 68, 42], [15, 54, 24, 5, 55, 25], [15, 43, 15, 10, 44, 16],
  /* 21 */ [4, 144, 116, 4, 145, 117], [17, 68, 42], [17, 50, 22, 6, 51, 23], [19, 46, 16, 6, 47, 17],
  /* 22 */ [2, 139, 111, 7, 140, 112], [17, 74, 46], [7, 54, 24, 16, 55, 25], [34, 37, 13],
  /* 23 */ [4, 151, 121, 5, 152, 122], [4, 75, 47, 14, 76, 48], [11, 54, 24, 14, 55, 25], [16, 45, 15, 14, 46, 16],
  /* 24 */ [6, 147, 117, 4, 148, 118], [6, 73, 45, 14, 74, 46], [11, 54, 24, 16, 55, 25], [30, 46, 16, 2, 47, 17],
  /* 25 */ [8, 132, 106, 4, 133, 107], [8, 75, 47, 13, 76, 48], [7, 54, 24, 22, 55, 25], [22, 45, 15, 13, 46, 16],
  /* 26 */ [10, 142, 114, 2, 143, 115], [19, 74, 46, 4, 75, 47], [28, 50, 22, 6, 51, 23], [33, 46, 16, 4, 47, 17],
  /* 27 */ [8, 152, 122, 4, 153, 123], [22, 73, 45, 3, 74, 46], [8, 53, 23, 26, 54, 24], [12, 45, 15, 28, 46, 16],
  /* 28 */ [3, 147, 117, 10, 148, 118], [3, 73, 45, 23, 74, 46], [4, 54, 24, 31, 55, 25], [11, 45, 15, 31, 46, 16],
  /* 29 */ [7, 146, 116, 7, 147, 117], [21, 73, 45, 7, 74, 46], [1, 53, 23, 37, 54, 24], [19, 45, 15, 26, 46, 16],
  /* 30 */ [5, 145, 115, 10, 146, 116], [19, 75, 47, 10, 76, 48], [15, 54, 24, 25, 55, 25], [23, 45, 15, 25, 46, 16],
  /* 31 */ [13, 145, 115, 3, 146, 116], [2, 74, 46, 29, 75, 47], [42, 54, 24, 1, 55, 25], [23, 45, 15, 28, 46, 16],
  /* 32 */ [17, 145, 115], [10, 74, 46, 23, 75, 47], [10, 54, 24, 35, 55, 25], [19, 45, 15, 35, 46, 16],
  /* 33 */ [17, 145, 115, 1, 146, 116], [14, 74, 46, 21, 75, 47], [29, 54, 24, 19, 55, 25], [11, 45, 15, 46, 46, 16],
  /* 34 */ [13, 145, 115, 6, 146, 116], [14, 74, 46, 23, 75, 47], [44, 54, 24, 7, 55, 25], [59, 46, 16, 1, 47, 17],
  /* 35 */ [12, 151, 121, 7, 152, 122], [12, 75, 47, 26, 76, 48], [39, 54, 24, 14, 55, 25], [22, 45, 15, 41, 46, 16],
  /* 36 */ [6, 151, 121, 14, 152, 122], [6, 75, 47, 34, 76, 48], [46, 54, 24, 10, 55, 25], [2, 45, 15, 64, 46, 16],
  /* 37 */ [17, 152, 122, 4, 153, 123], [29, 74, 46, 14, 75, 47], [49, 54, 24, 10, 55, 25], [24, 45, 15, 46, 46, 16],
  /* 38 */ [4, 152, 122, 18, 153, 123], [13, 74, 46, 32, 75, 47], [48, 54, 24, 14, 55, 25], [42, 45, 15, 32, 46, 16],
  /* 39 */ [20, 147, 117, 4, 148, 118], [40, 75, 47, 7, 76, 48], [43, 54, 24, 22, 55, 25], [10, 45, 15, 67, 46, 16],
  /* 40 */ [19, 148, 118, 6, 149, 119], [18, 75, 47, 31, 76, 48], [34, 54, 24, 34, 55, 25], [20, 45, 15, 61, 46, 16]
];

var G15 = 0x537;
var G18 = 0x1f25;
var G15_MASK = 0x5412;

function getBchDigit(data) {
  var digit = 0;
  while (data !== 0) { digit++; data >>>= 1; }
  return digit;
}

function getBchTypeInfo(data) {
  var d = data << 10;
  while (getBchDigit(d) - getBchDigit(G15) >= 0) {
    d ^= (G15 << (getBchDigit(d) - getBchDigit(G15)));
  }
  return ((data << 10) | d) ^ G15_MASK;
}

function getBchTypeNumber(data) {
  var d = data << 12;
  while (getBchDigit(d) - getBchDigit(G18) >= 0) {
    d ^= (G18 << (getBchDigit(d) - getBchDigit(G18)));
  }
  return (data << 12) | d;
}

function getRsBlocks(version, levelIdx) {
  var rowOffset = levelIdx === 1 ? 0 : levelIdx === 0 ? 1 : levelIdx === 3 ? 2 : 3;
  var table = RS_BLOCK_TABLE[(version - 1) * 4 + rowOffset];
  var list = [];
  for (var i = 0; i < table.length; i += 3) {
    var count = table[i], total = table[i + 1], data = table[i + 2];
    for (var j = 0; j < count; j++) list.push({ total: total, data: data });
  }
  return list;
}

function getLengthInBits(mode, version) {
  if (version <= 9) {
    if (mode === 1) return 10;
    if (mode === 2) return 9;
    return 8;
  }
  if (version <= 26) {
    if (mode === 1) return 12;
    if (mode === 2) return 11;
    return 16;
  }
  if (mode === 1) return 14;
  if (mode === 2) return 13;
  return 16;
}

function maskFunction(mask, row, col) {
  switch (mask) {
    case 0: return (row + col) % 2 === 0;
    case 1: return row % 2 === 0;
    case 2: return col % 3 === 0;
    case 3: return (row + col) % 3 === 0;
    case 4: return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5: return (row * col) % 2 + (row * col) % 3 === 0;
    case 6: return ((row * col) % 2 + (row * col) % 3) % 2 === 0;
    case 7: return ((row * col) % 3 + (row + col) % 2) % 2 === 0;
  }
  return false;
}

/* ── GF(256) for Reed-Solomon ──────────────────────────────────── */
var GF_EXP = new Uint8Array(512);
var GF_LOG = new Uint8Array(256);
(function () {
  var x = 1;
  for (var i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (var j = 255; j < 512; j++) GF_EXP[j] = GF_EXP[j - 255];
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function gfPow(a, e) {
  if (a === 0) return 0;
  return GF_EXP[(GF_LOG[a] * e) % 255];
}

function gfInv(a) {
  if (a === 0) return 0;
  return GF_EXP[255 - GF_LOG[a]];
}

function rsGeneratorPoly(degree) {
  var g = [1];
  for (var i = 0; i < degree; i++) {
    g = polyMul(g, [1, GF_EXP[i]]);
  }
  return g;
}

function polyMul(a, b) {
  var out = new Array(a.length + b.length - 1).fill(0);
  for (var i = 0; i < a.length; i++) {
    for (var j = 0; j < b.length; j++) {
      out[i + j] ^= gfMul(a[i], b[j]);
    }
  }
  return out;
}

/* data (codewords) → data + ecc appended (GF polynomial division) */
function rsEncodeBlock(data, eccLen) {
  var gen = rsGeneratorPoly(eccLen);
  var res = data.slice().concat(new Array(eccLen).fill(0));
  for (var i = 0; i < data.length; i++) {
    var lead = res[i];
    if (lead !== 0) {
      for (var j = 1; j < gen.length; j++) {
        res[i + j] ^= gfMul(gen[j], lead);
      }
    }
  }
  var ecc = res.slice(data.length);
  if (ecc.length < eccLen) {
    while (ecc.length < eccLen) ecc.unshift(0);
  }
  return ecc.slice(ecc.length - eccLen);
}

function polyEval(coeffs, x) {
  /* coeffs[0] = highest degree term */
  var result = 0;
  for (var i = 0; i < coeffs.length; i++) {
    result = gfMul(result, x) ^ coeffs[i];
  }
  return result;
}

/* ── Reed–Solomon decoding (ZXing algorithm) ──────────────────── */
/* Polynomials are arrays with coefficients[0] = highest degree, in
   GF(256) with primitive 0x11d (alpha = 2). Follows ZXing's
   GenericGF / GenericGFPoly / ReedSolomonDecoder structure. */

function gfInvField(x) {
  if (x === 0) return 0;
  return GF_EXP[255 - GF_LOG[x]];
}

function polyTrimZ(coeffs) {
  var len = coeffs.length;
  var idx = 0;
  while (idx < len && coeffs[idx] === 0) idx++;
  return idx === len ? [0] : coeffs.slice(idx);
}
function polyDegreeZ(coeffs) { return coeffs.length - 1; }
function polyIsZeroZ(coeffs) { return coeffs[0] === 0; }
function polyGetCoeffZ(coeffs, degree) {
  if (degree < 0 || degree >= coeffs.length) return 0;
  return coeffs[coeffs.length - 1 - degree];
}
function polyEvalZ(coeffs, a) {
  if (a === 0) return polyGetCoeffZ(coeffs, 0);
  if (a === 1) {
    var s = 0;
    for (var i = 0; i < coeffs.length; i++) s ^= coeffs[i];
    return s;
  }
  var result = coeffs[0];
  for (var j = 1; j < coeffs.length; j++) {
    result = gfMul(result, a) ^ coeffs[j];
  }
  return result;
}
function polyAddZ(a, b) {
  if (polyIsZeroZ(a)) return b.slice();
  if (polyIsZeroZ(b)) return a.slice();
  var big = a.length >= b.length ? a : b;
  var small = a.length >= b.length ? b : a;
  var out = big.slice();
  var diff = big.length - small.length;
  for (var i = 0; i < small.length; i++) out[diff + i] ^= small[i];
  return polyTrimZ(out);
}
function polyScaleZ(coeffs, s) {
  if (s === 0) return [0];
  var out = new Array(coeffs.length).fill(0);
  for (var i = 0; i < coeffs.length; i++) out[i] = gfMul(coeffs[i], s);
  return out;
}
function polyShiftZ(coeffs, degree, scale) {
  if (scale === 0) return [0];
  var out = new Array(coeffs.length + degree).fill(0);
  for (var i = 0; i < coeffs.length; i++) out[i] = gfMul(coeffs[i], scale);
  return out;
}
function polyMulZ(a, b) {
  if (polyIsZeroZ(a) || polyIsZeroZ(b)) return [0];
  var out = new Array(a.length + b.length - 1).fill(0);
  for (var i = 0; i < a.length; i++) {
    for (var j = 0; j < b.length; j++) {
      out[i + j] ^= gfMul(a[i], b[j]);
    }
  }
  return polyTrimZ(out);
}
function polyMonomialZ(degree, coefficient) {
  if (coefficient === 0) return [0];
  var out = new Array(degree + 1).fill(0);
  out[0] = coefficient;
  return out;
}

function runEuclideanAlgorithmZ(a, b, R) {
  if (polyDegreeZ(a) < polyDegreeZ(b)) { var tmp = a; a = b; b = tmp; }
  var rLast = a;
  var r = b;
  var tLast = [0];
  var t = [1];
  while (2 * polyDegreeZ(r) >= R) {
    var rLastLast = rLast;
    var tLastLast = tLast;
    rLast = r;
    tLast = t;
    if (polyIsZeroZ(rLast)) return null;
    r = rLastLast;
    var q = [0];
    var denominatorLeadingTerm = polyGetCoeffZ(rLast, polyDegreeZ(rLast));
    var dltInverse = gfInvField(denominatorLeadingTerm);
    while (polyDegreeZ(r) >= polyDegreeZ(rLast) && !polyIsZeroZ(r)) {
      var degreeDiff = polyDegreeZ(r) - polyDegreeZ(rLast);
      var scale = gfMul(polyGetCoeffZ(r, polyDegreeZ(r)), dltInverse);
      q = polyAddZ(q, polyMonomialZ(degreeDiff, scale));
      r = polyAddZ(r, polyShiftZ(rLast, degreeDiff, scale));
    }
    t = polyAddZ(polyMulZ(q, tLast), tLastLast);
    if (polyDegreeZ(r) >= polyDegreeZ(rLast)) return null;
  }
  var sigmaTildeAtZero = polyGetCoeffZ(t, 0);
  if (sigmaTildeAtZero === 0) return null;
  var inv = gfInvField(sigmaTildeAtZero);
  return [polyScaleZ(t, inv), polyScaleZ(r, inv)];
}

function findErrorLocationsZ(errorLocator) {
  var numErrors = polyDegreeZ(errorLocator);
  if (numErrors === 1) return [polyGetCoeffZ(errorLocator, 1)];
  var result = [];
  var e = 0;
  for (var i = 1; i < 256 && e < numErrors; i++) {
    if (polyEvalZ(errorLocator, GF_EXP[i % 255]) === 0) {
      result.push(gfInvField(GF_EXP[i % 255]));
      e++;
    }
  }
  if (e !== numErrors) return null;
  return result;
}

function findErrorMagnitudesZ(errorEvaluator, errorLocations) {
  var s = errorLocations.length;
  var result = [];
  for (var i = 0; i < s; i++) {
    var xiInverse = gfInvField(errorLocations[i]);
    var denominator = 1;
    for (var j = 0; j < s; j++) {
      if (i !== j) {
        var term = gfMul(errorLocations[j], xiInverse);
        var termPlus1 = (term & 0x1) === 0 ? term | 1 : term & ~1;
        denominator = gfMul(denominator, termPlus1);
      }
    }
    result.push(gfMul(polyEvalZ(errorEvaluator, xiInverse), gfInvField(denominator)));
  }
  return result;
}

/* Correct errors in received = data+ecc (received[0] = highest degree).
   Returns corrected codewords or null when uncorrectable. */
function rsDecodeBlock(received, eccLen) {
  var poly = polyTrimZ(received);
  var twoS = eccLen;
  var syndromeCoefficients = new Array(twoS).fill(0);
  var noError = true;
  for (var i = 0; i < twoS; i++) {
    var evalResult = polyEvalZ(poly, GF_EXP[i % 255]);
    syndromeCoefficients[twoS - 1 - i] = evalResult;
    if (evalResult !== 0) noError = false;
  }
  if (noError) return received;

  var syndrome = polyTrimZ(syndromeCoefficients);
  var sigmaOmega = runEuclideanAlgorithmZ(polyMonomialZ(twoS, 1), syndrome, twoS);
  if (!sigmaOmega) return null;
  var sigma = sigmaOmega[0];
  var omega = sigmaOmega[1];
  var errorLocations = findErrorLocationsZ(sigma);
  if (!errorLocations) return null;
  var errorMagnitudes = findErrorMagnitudesZ(omega, errorLocations);
  var corrected = received.slice();
  for (var k = 0; k < errorLocations.length; k++) {
    var position = received.length - 1 - GF_LOG[errorLocations[k]];
    if (position < 0 || position >= received.length) return null;
    corrected[position] ^= errorMagnitudes[k];
  }
  return corrected;
}

/* ── QR matrix construction ────────────────────────────────────── */
function makeModuleGrid(version) {
  var size = version * 4 + 17;
  var grid = [];
  for (var r = 0; r < size; r++) grid.push(new Array(size).fill(null));
  return grid;
}

function setupFinderPattern(grid, row, col, size) {
  for (var r = -1; r <= 7; r++) {
    if (row + r < 0 || size <= row + r) continue;
    for (var c = -1; c <= 7; c++) {
      if (col + c < 0 || size <= col + c) continue;
      var dark = (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
                 (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
                 (2 <= r && r <= 4 && 2 <= c && c <= 4);
      grid[row + r][col + c] = dark;
    }
  }
}

function setupTiming(grid, size) {
  for (var r = 8; r < size - 8; r++) {
    if (grid[r][6] === null) grid[r][6] = (r % 2 === 0);
  }
  for (var c = 8; c < size - 8; c++) {
    if (grid[6][c] === null) grid[6][c] = (c % 2 === 0);
  }
}

function setupAlignment(grid, version, size) {
  var pos = PATTERN_POSITION_TABLE[version - 1] || [];
  for (var i = 0; i < pos.length; i++) {
    for (var j = 0; j < pos.length; j++) {
      var row = pos[i], col = pos[j];
      if (grid[row][col] !== null) continue;
      for (var r = -2; r <= 2; r++) {
        for (var c = -2; c <= 2; c++) {
          grid[row + r][col + c] = (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0));
        }
      }
    }
  }
}

function setupFormatInfo(grid, levelIdx, mask, size, test) {
  var bits = getBchTypeInfo(getLevelCode(levelIdx, mask));
  for (var i = 0; i < 15; i++) {
    var mod = (!test && ((bits >> i) & 1) === 1);
    if (i < 6) grid[i][8] = mod;
    else if (i < 8) grid[i + 1][8] = mod;
    else grid[size - 15 + i][8] = mod;
  }
  for (var j = 0; j < 15; j++) {
    var mod2 = (!test && ((bits >> j) & 1) === 1);
    if (j < 8) grid[8][size - j - 1] = mod2;
    else if (j < 9) grid[8][15 - j - 1 + 1] = mod2;
    else grid[8][15 - j - 1] = mod2;
  }
  grid[size - 8][8] = !test;
}

function getLevelCode(levelIdx, mask) {
  return (levelIdx << 3) | mask;
}

function setupVersionInfo(grid, version, size, test) {
  if (version < 7) return;
  var bits = getBchTypeNumber(version);
  for (var i = 0; i < 18; i++) {
    var mod = (!test && ((bits >> i) & 1) === 1);
    grid[Math.floor(i / 3)][(i % 3) + size - 8 - 3] = mod;
  }
  for (var j = 0; j < 18; j++) {
    var mod2 = (!test && ((bits >> j) & 1) === 1);
    grid[(j % 3) + size - 8 - 3][Math.floor(j / 3)] = mod2;
  }
}

function mapData(grid, codewords, mask, size) {
  var inc = -1;
  var row = size - 1;
  var bitIndex = 7;
  var byteIndex = 0;
  for (var col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (;;) {
      for (var c = 0; c < 2; c++) {
        if (grid[row][col - c] === null) {
          var dark = false;
          if (byteIndex < codewords.length) {
            dark = ((codewords[byteIndex] >>> bitIndex) & 1) === 1;
          }
          if (maskFunction(mask, row, col - c)) dark = !dark;
          grid[row][col - c] = dark;
          bitIndex--;
          if (bitIndex === -1) { byteIndex++; bitIndex = 7; }
        }
      }
      row += inc;
      if (row < 0 || size <= row) {
        row -= inc;
        inc = -inc;
        break;
      }
    }
  }
}

function lostPoint(grid, size) {
  var lost = 0;
  for (var row = 0; row < size; row++) {
    for (var col = 0; col < size; col++) {
      var sameCount = 0;
      var dark = grid[row][col];
      for (var r = -1; r <= 1; r++) {
        if (row + r < 0 || size <= row + r) continue;
        for (var c = -1; c <= 1; c++) {
          if (col + c < 0 || size <= col + c) continue;
          if (r === 0 && c === 0) continue;
          if (dark === grid[row + r][col + c]) sameCount++;
        }
      }
      if (sameCount > 5) lost += (3 + sameCount - 5);
    }
  }
  for (var row2 = 0; row2 < size - 1; row2++) {
    for (var col2 = 0; col2 < size - 1; col2++) {
      var count = 0;
      if (grid[row2][col2]) count++;
      if (grid[row2 + 1][col2]) count++;
      if (grid[row2][col2 + 1]) count++;
      if (grid[row2 + 1][col2 + 1]) count++;
      if (count === 0 || count === 4) lost += 3;
    }
  }
  for (var row3 = 0; row3 < size; row3++) {
    for (var col3 = 0; col3 < size - 6; col3++) {
      if (grid[row3][col3] && !grid[row3][col3 + 1] && grid[row3][col3 + 2] && grid[row3][col3 + 3] &&
          grid[row3][col3 + 4] && !grid[row3][col3 + 5] && grid[row3][col3 + 6]) lost += 40;
    }
  }
  for (var col4 = 0; col4 < size; col4++) {
    for (var row4 = 0; row4 < size - 6; row4++) {
      if (grid[row4][col4] && !grid[row4 + 1][col4] && grid[row4 + 2][col4] && grid[row4 + 3][col4] &&
          grid[row4 + 4][col4] && !grid[row4 + 5][col4] && grid[row4 + 6][col4]) lost += 40;
    }
  }
  var darkCount = 0;
  for (var r2 = 0; r2 < size; r2++) {
    for (var c2 = 0; c2 < size; c2++) if (grid[r2][c2]) darkCount++;
  }
  var ratio = Math.abs(100 * darkCount / size / size - 50) / 5;
  lost += ratio * 10;
  return lost;
}

/* ── QR encode ──────────────────────────────────────────────────── */
/* opts: { eccLevel: 'L'|'M'|'Q'|'H' (default M), version: fixed (optional) }
   → { ok, version, level, size, matrix: boolean[][] } */
export function qrEncode(text, opts) {
  return safe(function () {
    var s = asStr(text);
    if (!s) return { ok: false, error: 'Nothing to encode — enter some text or a URL.', version: 0, level: 'M', size: 0, matrix: [] };
    var o = isPlainObj(opts) ? opts : {};
    var levelName = String(o.eccLevel || 'M').toUpperCase();
    if (!(levelName in QR_ECC)) levelName = 'M';
    var levelIdx = QR_ECC[levelName];

    var bytes = utf8Bytes(s);
    var bitsLength = 4 + getLengthInBits(4, 40) + bytes.length * 8;
    var version = parseInt(o.version, 10) || 0;
    if (version === 0) {
      version = -1;
      for (var v = 1; v <= 40; v++) {
        var blocks = getRsBlocks(v, levelIdx);
        var cap = 0;
        for (var b = 0; b < blocks.length; b++) cap += blocks[b].data;
        if (4 + getLengthInBits(4, v) + bytes.length * 8 <= cap * 8) { version = v; break; }
      }
    }
    if (version < 1 || version > 40) return { ok: false, error: 'Input is too long for a QR code at this level.', version: 0, level: levelName, size: 0, matrix: [] };

    var dataCodewords = encodeDataCodewords(bytes, version, levelIdx);
    if (!dataCodewords) return { ok: false, error: 'Could not build QR data.', version: version, level: levelName, size: 0, matrix: [] };

    var bestMask = 0;
    var bestLost = Infinity;
    var bestGrid = null;
    for (var m = 0; m < 8; m++) {
      var grid = makeModuleGrid(version);
      var size = version * 4 + 17;
      setupFinderPattern(grid, 0, 0, size);
      setupFinderPattern(grid, size - 7, 0, size);
      setupFinderPattern(grid, 0, size - 7, size);
      setupAlignment(grid, version, size);
      setupTiming(grid, size);
      setupFormatInfo(grid, levelIdx, m, size, true);
      setupVersionInfo(grid, version, size, true);
      mapData(grid, dataCodewords, m, size);
      var lp = lostPoint(grid, size);
      if (lp < bestLost) { bestLost = lp; bestMask = m; bestGrid = grid; }
    }
    var finalGrid = makeModuleGrid(version);
    var fsize = version * 4 + 17;
    setupFinderPattern(finalGrid, 0, 0, fsize);
    setupFinderPattern(finalGrid, fsize - 7, 0, fsize);
    setupFinderPattern(finalGrid, 0, fsize - 7, fsize);
    setupAlignment(finalGrid, version, fsize);
    setupTiming(finalGrid, fsize);
    setupFormatInfo(finalGrid, levelIdx, bestMask, fsize, false);
    setupVersionInfo(finalGrid, version, fsize, false);
    mapData(finalGrid, dataCodewords, bestMask, fsize);

    var matrix = finalGrid.map(function (rowArr) {
      return rowArr.map(function (v) { return v === true; });
    });
    return { ok: true, version: version, level: levelName, mask: bestMask, size: fsize, matrix: matrix };
  }, { ok: false, error: 'Could not encode QR code.', version: 0, level: 'M', size: 0, matrix: [] });
}

function utf8Bytes(s) {
  var bytes = [];
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    if (c <= 0x7f) bytes.push(c);
    else if (c <= 0x7ff) { bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f)); }
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
      var lo = s.charCodeAt(i + 1);
      if (lo >= 0xdc00 && lo <= 0xdfff) {
        var cp = 0x10000 + ((c - 0xd800) << 10) + (lo - 0xdc00);
        bytes.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
        i++;
        continue;
      }
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
    else { bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f)); }
  }
  return bytes;
}

function utf8Decode(bytes) {
  var out = '';
  var i = 0;
  while (i < bytes.length) {
    var b = bytes[i];
    if (b < 0x80) { out += String.fromCharCode(b); i++; }
    else if ((b & 0xe0) === 0xc0) {
      out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f));
      i += 2;
    } else if ((b & 0xf0) === 0xe0) {
      out += String.fromCharCode(((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f));
      i += 3;
    } else if ((b & 0xf8) === 0xf0) {
      var cp = ((b & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f);
      cp -= 0x10000;
      out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
      i += 4;
    } else { out += '?'; i++; }
  }
  return out;
}

function encodeDataCodewords(bytes, version, levelIdx) {
  var blocks = getRsBlocks(version, levelIdx);
  var capacity = 0;
  for (var i = 0; i < blocks.length; i++) capacity += blocks[i].data;

  /* bit buffer */
  var bits = [];
  function put(val, len) {
    for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  }
  put(4, 4); /* byte mode */
  put(bytes.length, getLengthInBits(4, version));
  for (var j = 0; j < bytes.length; j++) put(bytes[j], 8);

  var capBits = capacity * 8;
  if (bits.length > capBits) return null;
  if (bits.length + 4 <= capBits) put(0, 4);
  while (bits.length % 8 !== 0) bits.push(0);
  var pad = 0xec;
  while (bits.length < capBits) {
    put(pad, 8);
    pad = pad === 0xec ? 0x11 : 0xec;
  }

  var codewords = [];
  for (var k = 0; k < bits.length; k += 8) {
    var byteVal = 0;
    for (var b = 0; b < 8; b++) byteVal = (byteVal << 1) | bits[k + b];
    codewords.push(byteVal);
  }

  /* split into blocks, compute ecc per block, interleave */
  var dcdata = [];
  var ecdata = [];
  var maxDc = 0, maxEc = 0;
  var offset = 0;
  for (var bl = 0; bl < blocks.length; bl++) {
    var dcCount = blocks[bl].data;
    var ecCount = blocks[bl].total - dcCount;
    maxDc = Math.max(maxDc, dcCount);
    maxEc = Math.max(maxEc, ecCount);
    var dc = codewords.slice(offset, offset + dcCount);
    if (dc.length < dcCount) {
      while (dc.length < dcCount) dc.push(0);
    }
    dcdata.push(dc);
    ecdata.push(rsEncodeBlock(dc, ecCount));
    offset += dcCount;
  }

  var out = [];
  for (var x = 0; x < maxDc; x++) {
    for (var bl2 = 0; bl2 < blocks.length; bl2++) {
      if (x < dcdata[bl2].length) out.push(dcdata[bl2][x]);
    }
  }
  for (var y = 0; y < maxEc; y++) {
    for (var bl3 = 0; bl3 < blocks.length; bl3++) {
      if (y < ecdata[bl3].length) out.push(ecdata[bl3][y]);
    }
  }
  return out;
}

/* ── QR decode ──────────────────────────────────────────────────── */
/* matrix: boolean[][] (size 21+4v) → { ok, text, version, level, mask, corrected, error } */
export function qrDecode(matrix) {
  return safe(function () {
    if (!Array.isArray(matrix) || !matrix.length || !Array.isArray(matrix[0])) {
      return { ok: false, error: 'No image data to decode.' };
    }
    var size = matrix.length;
    var version = (size - 17) / 4;
    if (version < 1 || version > 40 || version !== Math.floor(version) || matrix[0].length !== size) {
      return { ok: false, error: 'Invalid QR size — expected 21, 25, 29… modules per side.' };
    }

    var fmt = readFormatInfo(matrix, size);
    if (!fmt) return { ok: false, error: 'Could not read the QR format information (bad or damaged image).' };
    var levelIdx = fmt.levelIdx;
    var levelName = QR_ECC_NAME[levelIdx];
    var mask = fmt.mask;

    /* rebuild function map: same cells the encoder leaves non-null */
    var fmap = makeFunctionMap(version, size);

    /* walk modules in mapData order, collect bits, unmask */
    var bits = [];
    var inc = -1;
    var row = size - 1;
    for (var col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (;;) {
        for (var c = 0; c < 2; c++) {
          var rr = row, cc = col - c;
          if (fmap[rr][cc] === null) {
            var dark = matrix[rr][cc] === true;
            if (maskFunction(mask, rr, cc)) dark = !dark;
            bits.push(dark ? 1 : 0);
          }
        }
        row += inc;
        if (row < 0 || size <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }

    var totalCodewords = 0;
    var blocks = getRsBlocks(version, levelIdx);
    for (var b = 0; b < blocks.length; b++) totalCodewords += blocks[b].total;

    var codewords = [];
    for (var i = 0; i < totalCodewords * 8 && i + 7 < bits.length; i += 8) {
      var byteVal = 0;
      for (var k = 0; k < 8; k++) byteVal = (byteVal << 1) | bits[i + k];
      codewords.push(byteVal);
    }
    if (codewords.length < totalCodewords) return { ok: false, error: 'Too few modules to read the QR data.' };

    /* de-interleave into blocks and correct */
    var dcdata = [];
    var ecLen = blocks[0].total - blocks[0].data;
    var maxDc = 0;
    for (var bl = 0; bl < blocks.length; bl++) {
      dcdata.push({ data: [], ecc: [] });
      maxDc = Math.max(maxDc, blocks[bl].data);
    }
    var idx = 0;
    for (var x = 0; x < maxDc; x++) {
      for (var bl2 = 0; bl2 < blocks.length; bl2++) {
        if (x < blocks[bl2].data && idx < codewords.length) dcdata[bl2].data.push(codewords[idx++]);
      }
    }
    var maxEcCw = blocks[0].total - blocks[0].data;
    for (var y = 0; y < maxEcCw; y++) {
      for (var bl3 = 0; bl3 < blocks.length; bl3++) {
        if (y < (blocks[bl3].total - blocks[bl3].data) && idx < codewords.length) dcdata[bl3].ecc.push(codewords[idx++]);
      }
    }

    var corrected = false;
    var allData = [];
    for (var bl4 = 0; bl4 < blocks.length; bl4++) {
      var recv = dcdata[bl4].data.concat(dcdata[bl4].ecc);
      var fixed = rsDecodeBlock(recv, blocks[bl4].total - blocks[bl4].data);
      if (!fixed) return { ok: false, error: 'Reed-Solomon correction failed — the image may be too damaged.' };
      if (fixed.join(',') !== recv.join(',')) corrected = true;
      for (var q = 0; q < blocks[bl4].data; q++) allData.push(fixed[q]);
    }

    var parsed = parseDataStream(allData, version);
    if (!parsed.ok) return parsed;
    return { ok: true, text: parsed.text, version: version, level: levelName, mask: mask, corrected: corrected };
  }, { ok: false, error: 'Could not decode QR code.' });
}

function readFormatInfo(matrix, size) {
  var bit1 = [];
  var bit2 = [];
  for (var i = 0; i < 15; i++) {
    var cell1;
    if (i < 6) cell1 = matrix[i][8];
    else if (i < 8) cell1 = matrix[i + 1][8];
    else cell1 = matrix[size - 15 + i][8];
    bit1.push(cell1 === true ? 1 : 0);

    var cell2;
    if (i < 8) cell2 = matrix[8][size - i - 1];
    else if (i < 9) cell2 = matrix[8][15 - i - 1 + 1];
    else cell2 = matrix[8][15 - i - 1];
    bit2.push(cell2 === true ? 1 : 0);
  }
  var val1 = 0, val2 = 0;
  for (var j = 0; j < 15; j++) {
    val1 |= bit1[j] << j;
    val2 |= bit2[j] << j;
  }

  /* find best matching (level, mask) among the 32 valid codes */
  var best = null;
  var bestDist = 9;
  for (var l = 0; l < 4; l++) {
    for (var m = 0; m < 8; m++) {
      var target = getBchTypeInfo(getLevelCode(l, m));
      var d1 = popCount(val1 ^ target);
      var d2 = popCount(val2 ^ target);
      var d = Math.min(d1, d2);
      if (d < bestDist) { bestDist = d; best = { levelIdx: l, mask: m }; }
    }
  }
  if (!best || bestDist > 3) return null;
  return best;
}

function popCount(x) {
  var n = 0;
  while (x) { n += x & 1; x >>>= 1; }
  return n;
}

function makeFunctionMap(version, size) {
  var fmap = makeModuleGrid(version);
  /* function cells are flagged true (any truthy non-null value) */
  setupFinderPattern(fmap, 0, 0, size);
  setupFinderPattern(fmap, size - 7, 0, size);
  setupFinderPattern(fmap, 0, size - 7, size);
  setupAlignment(fmap, version, size);
  setupTiming(fmap, size);
  /* format info + dark module + version info */
  for (var i = 0; i < 15; i++) {
    if (i < 6) fmap[i][8] = true;
    else if (i < 8) fmap[i + 1][8] = true;
    else fmap[size - 15 + i][8] = true;
    if (i < 8) fmap[8][size - i - 1] = true;
    else if (i < 9) fmap[8][15 - i - 1 + 1] = true;
    else fmap[8][15 - i - 1] = true;
  }
  fmap[size - 8][8] = true;
  if (version >= 7) {
    for (var v = 0; v < 18; v++) {
      fmap[Math.floor(v / 3)][(v % 3) + size - 8 - 3] = true;
      fmap[(v % 3) + size - 8 - 3][Math.floor(v / 3)] = true;
    }
  }
  return fmap;
}

var ALNUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

function parseDataStream(codewords, version) {
  var bits = [];
  for (var i = 0; i < codewords.length; i++) {
    for (var b = 7; b >= 0; b--) bits.push((codewords[i] >>> b) & 1);
  }
  var pos = 0;
  var out = '';
  function readBits(n) {
    var v = 0;
    for (var i = 0; i < n; i++) {
      v = (v << 1) | (pos < bits.length ? bits[pos] : 0);
      pos++;
    }
    return v;
  }
  for (;;) {
    if (pos + 4 > bits.length) break;
    var mode = readBits(4);
    if (mode === 0) break; /* terminator */
    if (mode === 1) { /* numeric */
      var nl = getLengthInBits(1, version);
      if (pos + nl > bits.length) break;
      var ncount = readBits(nl);
      var digits = '';
      var rem = ncount;
      while (rem >= 3) {
        var group = readBits(10);
        digits += String(100 + group).slice(1);
        rem -= 3;
      }
      if (rem === 2) digits += String(100 + readBits(7)).slice(1);
      else if (rem === 1) digits += String(readBits(4));
      out += digits;
    } else if (mode === 2) { /* alphanumeric */
      var al = getLengthInBits(2, version);
      if (pos + al > bits.length) break;
      var acount = readBits(al);
      var pairs = Math.floor(acount / 2);
      for (var p = 0; p < pairs; p++) {
        var v2 = readBits(11);
        out += ALNUM.charAt(Math.floor(v2 / 45)) + ALNUM.charAt(v2 % 45);
      }
      if (acount % 2 === 1) out += ALNUM.charAt(readBits(6));
    } else if (mode === 4) { /* byte */
      var bl = getLengthInBits(4, version);
      if (pos + bl > bits.length) break;
      var bcount = readBits(bl);
      var raw = [];
      for (var x = 0; x < bcount; x++) raw.push(readBits(8));
      out += utf8Decode(raw);
    } else if (mode === 7) { /* ECI: skip designator */
      var c1 = readBits(1);
      if (c1 === 0) { readBits(8); }
      else {
        var c2 = readBits(1);
        if (c2 === 0) readBits(16);
        else readBits(24);
      }
    } else if (mode === 8) { /* kanji — not supported */
      return { ok: false, error: 'Kanji-encoded QR is not supported yet.' };
    } else {
      break;
    }
  }
  if (out === '' && pos === 0) return { ok: false, error: 'No readable data in this QR code.' };
  return { ok: true, text: out };
}

/* Capacity helper for the UI: max UTF-8 bytes per level (version 40). */
export function qrCapacity(levelName) {
  var lv = String(levelName || 'M').toUpperCase();
  if (!(lv in QR_ECC)) lv = 'M';
  var blocks = getRsBlocks(40, QR_ECC[lv]);
  var cap = 0;
  for (var i = 0; i < blocks.length; i++) cap += blocks[i].data;
  return cap - 2;
}
