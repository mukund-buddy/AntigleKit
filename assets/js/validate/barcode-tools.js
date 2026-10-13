/* barcode-tools.js — pure helpers for the barcode generator batch:
   Code 128 (Start B, printable ASCII), Code 39, EAN-13 and UPC-A.
   No DOM, no network. Node-testable. Never throws; hostile input
   yields { ok:false, error } or empty defaults.
   Style mirrors student-tools.js / text-web-tools.js. */

function asStr(v) {
  return typeof v === 'string' ? v : String(v == null ? '' : v);
}

function isPlainObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function safe(fn, fallback) {
  try {
    return fn();
  } catch (e) {
    return fallback;
  }
}

/* ── Code 128 (subset: Start B for ASCII 32–126) ────────────────── */
/* Each symbol is 11 modules (3 bars + 3 spaces). Table by symbol value. */
var CODE128_PATTERNS = [
  '11011001100','11001101100','11001100110','10010011000','10010001100',
  '10001001100','10011001000','10011000100','10001100100','11001001000',
  '11001000100','11000100100','10110011100','10011011100','10011001110',
  '10111001100','10011101100','10011100110','11001110010','11001011100',
  '11001001110','11011100100','11001110100','11101101110','11101001100',
  '11100101100','11100100110','11101100100','11100110100','11100110010',
  '11011011000','11011000110','11000110110','10100011000','10001011000',
  '10001000110','10110001000','10001101000','10001100010','11010001000',
  '11000101000','11000100010','10110111000','10110001110','10001101110',
  '10111011000','10111000110','10001110110','11101110110','11010001110',
  '11000101110','11011101000','11011100010','11011101110','11101011000',
  '11101000110','11100010110','11101101000','11101100010','11100011010',
  '11101111010','11001000010','11110001010','10100110000','10100001100',
  '10010110000','10010000110','10000101100','10000100110','10110010000',
  '10110000100','10011010000','10011000010','10000110100','10000110010',
  '11000010010','11001010000','11110111010','11000010100','10001111010',
  '10100111100','10010111100','10010011110','10111100100','10011110100',
  '10011110010','11110100100','11110010100','11110010010','11011011110',
  '11011110110','11110110110','10101111000','10100011110','10001011110',
  '10111101000','10111100010','11110101000','11110100010','10111011110',
  '10111101110','11101011110','11110101110','11010000100','11010010000',
  '11010011100','1100011101011'
];
var CODE128_START_B = 104;
var CODE128_STOP = 106;

function code128(text) {
  var s = asStr(text);
  if (!s) return { ok: false, error: 'Enter some text to encode.' };
  var chars = [];
  for (var i = 0; i < s.length; i++) {
    var code = s.charCodeAt(i);
    if (code < 32 || code > 126) {
      return { ok: false, error: 'Code 128 supports printable ASCII (characters 32–126) only.' };
    }
    chars.push(code - 32);
  }
  if (chars.length > 80) {
    return { ok: false, error: 'Keep the input under 80 characters — longer codes may not scan reliably.' };
  }

  var values = [CODE128_START_B].concat(chars);
  var checksum = CODE128_START_B;
  for (var j = 0; j < chars.length; j++) {
    checksum += chars[j] * (j + 1);
  }
  checksum %= 103;
  values.push(checksum);
  values.push(CODE128_STOP);

  var modules = '';
  values.forEach(function (v) { modules += CODE128_PATTERNS[v]; });

  return {
    ok: true,
    format: 'Code 128',
    text: s,
    modules: modules,
    quietWidth: 10,
    symbols: values.length
  };
}

/* ── Code 39 ─────────────────────────────────────────────────────── */
/* Each symbol is 9 elements (5 bars + 4 spaces), 3 wide. 1 = wide. */
var CODE39_PATTERNS = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
  '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
  '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
  'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
  'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
  'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
  'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
  'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
  'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
  '-': '010000101', '.': '110000100', ' ': '011000100', '$': '010101000',
  '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100'
};
var CODE39_VALUES = { '0':0,'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,
  'A':10,'B':11,'C':12,'D':13,'E':14,'F':15,'G':16,'H':17,'I':18,'J':19,'K':20,
  'L':21,'M':22,'N':23,'O':24,'P':25,'Q':26,'R':27,'S':28,'T':29,'U':30,'V':31,
  'W':32,'X':33,'Y':34,'Z':35,'-':36,'.':37,' ':38,'$':39,'/':40,'+':41,'%':42 };

function code39(text, opts) {
  var s = asStr(text);
  if (!s) return { ok: false, error: 'Enter some text to encode.' };
  var o = isPlainObj(opts) ? opts : {};
  var withCheck = o.checkDigit !== false;
  var chars = [];
  for (var i = 0; i < s.length; i++) {
    var ch = s.charAt(i).toUpperCase();
    if (!CODE39_PATTERNS[ch]) {
      return { ok: false, error: 'Code 39 allows A–Z, 0–9, and the characters - . space $ / + % only.' };
    }
    chars.push(ch);
  }
  if (chars.length > 60) {
    return { ok: false, error: 'Keep the input under 60 characters — longer codes may not scan reliably.' };
  }

  var symbols = ['*'].concat(chars);
  if (withCheck) {
    var sum = 0;
    for (var k = 0; k < chars.length; k++) {
      sum += CODE39_VALUES[chars[k]] * ((k + 1) % 43);
    }
    var check = sum % 43;
    var checkChar = Object.keys(CODE39_VALUES).find(function (key) {
      return CODE39_VALUES[key] === check;
    });
    symbols.push(checkChar);
  }
  symbols.push('*');

  var modules = '';
  symbols.forEach(function (ch) { modules += CODE39_PATTERNS[ch] + '0'; });
  modules = modules.slice(0, -1);

  return {
    ok: true,
    format: 'Code 39',
    text: s,
    modules: modules,
    quietWidth: 10,
    symbols: symbols.length
  };
}

/* ── EAN-13 ──────────────────────────────────────────────────────── */
var EAN_L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
var EAN_G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
var EAN_R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
var EAN_FIRST = {
  '0': 'LLLLLL', '1': 'LLGLGG', '2': 'LLGGLG', '3': 'LLGGGL',
  '4': 'LGLLGG', '5': 'LGGLLG', '6': 'LGGGLL', '7': 'LGLGLG',
  '8': 'LGLGGL', '9': 'LGGLGL'
};

function ean13Check(digits) {
  var sum = 0;
  for (var i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

function ean13(text) {
  var s = asStr(text).replace(/\s+/g, '');
  if (!/^\d{12,13}$/.test(s)) {
    return { ok: false, error: 'EAN-13 needs 12 digits (a 13th is added automatically as the check digit).' };
  }
  var digits = s.slice(0, 12).split('').map(Number);
  var check = ean13Check(digits);
  var first = digits[0];
  var pattern = EAN_FIRST[String(first)];

  var modules = '101';
  for (var pos = 1; pos <= 6; pos++) {
    var d = digits[pos];
    var table = pattern.charAt(pos - 1) === 'L' ? EAN_L : EAN_G;
    modules += table[d];
  }
  modules += '01010';
  for (var pos2 = 7; pos2 < 12; pos2++) {
    modules += EAN_R[digits[pos2]];
  }
  modules += EAN_R[check];
  modules += '101';

  return {
    ok: true,
    format: 'EAN-13',
    text: s.slice(0, 12) + check,
    checkDigit: check,
    modules: modules,
    quietWidth: 11,
    guardText: true
  };
}

/* ── UPC-A ───────────────────────────────────────────────────────── */
function upcCheck(digits) {
  var sum = 0;
  for (var i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

function upcA(text) {
  var s = asStr(text).replace(/\s+/g, '');
  if (!/^\d{11,12}$/.test(s)) {
    return { ok: false, error: 'UPC-A needs 11 digits (a 12th is added automatically as the check digit).' };
  }
  var digits = s.slice(0, 11).split('').map(Number);
  var check = upcCheck(digits);

  var modules = '101';
  for (var pos = 0; pos < 6; pos++) modules += EAN_L[digits[pos]];
  modules += '01010';
  for (var pos2 = 6; pos2 < 11; pos2++) modules += EAN_R[digits[pos2]];
  modules += EAN_R[check];
  modules += '101';

  return {
    ok: true,
    format: 'UPC-A',
    text: s.slice(0, 11) + check,
    checkDigit: check,
    modules: modules,
    quietWidth: 9,
    guardText: true
  };
}

/* ── Public API ──────────────────────────────────────────────────── */
export function barcodeEncode(text, opts) {
  var o = isPlainObj(opts) ? opts : {};
  var format = asStr(o.format || 'code128').toLowerCase();
  var s = asStr(text);
  if (!s) return { ok: false, error: 'Enter some text to encode.' };
  if (format === 'code128') return code128(s);
  if (format === 'code39') return code39(s, o);
  if (format === 'ean13') return ean13(s);
  if (format === 'upca') return upcA(s);
  return { ok: false, error: 'Unknown barcode format.' };
}

/* Human-readable text drawn under the bars (EAN/UPC use guard digits). */
export function barcodeCaption(res, opts) {
  if (!res || !res.ok) return '';
  var o = isPlainObj(opts) ? opts : {};
  var font = asStr(o.font || 'monospace');
  var text = res.text;
  if (res.guardText && res.format === 'EAN-13') {
    return text.replace(/(.)(......)(......)/, '$1 $2 $3');
  }
  if (res.guardText && res.format === 'UPC-A') {
    return text.replace(/(.)(.....)(.....)(.)/, '$1  $2 $3  $4');
  }
  return text;
}

export function barcodeRuns(modules) {
  if (!modules) return [];
  var runs = [];
  var cur = modules.charAt(0);
  var len = 1;
  for (var i = 1; i < modules.length; i++) {
    if (modules.charAt(i) === cur) {
      len++;
    } else {
      runs.push({ on: cur === '1', width: len });
      cur = modules.charAt(i);
      len = 1;
    }
  }
  runs.push({ on: cur === '1', width: len });
  return runs;
}

export function barcodeStats(modules, quietWidth) {
  var runs = barcodeRuns(modules);
  var total = modules.length + (quietWidth || 0) * 2;
  var minBar = 1;
  runs.forEach(function (r) { if (r.on && r.width < minBar) minBar = r.width; });
  return { totalModules: total, runs: runs.length, minBarWidth: minBar };
}
