/* version-rules.js — Bedrock pack version helpers: parsing, bumping and
   consistency analysis. Bedrock manifests use integer version arrays
   [major, minor, patch], each 0–255 (ARCHITECTURE.md §2.1; generator emits
   the same). Pure module: no DOM, no network; Node-testable. */

const VERSION_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const BRACKET_RE = /^\[?\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\]?$/;

export function normalizeVersion(parts) {
  if (!Array.isArray(parts) || parts.length !== 3) return null;
  const out = parts.map(function (n) { const v = Number(n); return Number.isInteger(v) && v >= 0 ? v : -1; });
  if (out.indexOf(-1) !== -1) return null;
  return out;
}

/** Parse a single version token: "1.2.3", "[1, 2, 3]", or integer triple. */
export function parseVersionToken(token) {
  if (typeof token === 'number') return normalizeVersion([token, 0, 0]);
  if (Array.isArray(token)) return normalizeVersion(token);
  const s = String(token == null ? '' : token).trim();
  if (!s) return null;
  let m = s.match(VERSION_RE);
  if (m) return normalizeVersion([m[1], m[2], m[3]]);
  m = s.match(BRACKET_RE);
  if (m) return normalizeVersion([m[1], m[2], m[3]]);
  return null;
}

/**
 * parseVersionLine(line) — "label = 1.2.3", "label: [1, 0, 0]", or bare
 * "1.2.3". Returns { label, version } or { error }.
 */
export function parseVersionLine(line) {
  const s = String(line == null ? '' : line).trim();
  if (!s) return { error: 'Empty line.' };

  const sep = s.indexOf('=');
  const colon = s.indexOf(':');
  const cut = sep === -1 ? colon : colon === -1 || sep < colon ? sep : colon;
  if (cut === -1) {
    const version = parseVersionToken(s);
    return version ? { label: '', version: version } : { error: 'Not a 3-part version (e.g. 1.2.3 or [1, 2, 0]).' };
  }

  const label = s.slice(0, cut).trim();
  const rest = s.slice(cut + 1).trim();
  const version = parseVersionToken(rest);
  return version ? { label: label, version: version } : { error: 'Value after "' + s.slice(0, cut + 1) + '" is not a 3-part version.' };
}

export function formatVersion(version, dotted) {
  return dotted ? version.join('.') : '[' + version.join(', ') + ']';
}

const BUMP_PARTS = { patch: 2, minor: 1, major: 0 };

/**
 * bumpVersion(version, kind) → { ok, version, error }
 * kind: 'patch' | 'minor' | 'major'. Each part caps at 255; a bump that would
 * exceed the cap returns an error telling the user to bump the next level.
 */
export function bumpVersion(version, kind) {
  const v = normalizeVersion(version);
  if (!v) return { ok: false, version: null, error: 'Version must be three integers 0–255.' };
  const idx = BUMP_PARTS[kind];
  if (idx === undefined) return { ok: false, version: null, error: 'Unknown bump type.' };

  const next = v.slice();
  next[idx] += 1;
  if (next[idx] > 255) {
    return { ok: false, version: null, error: (kind === 'patch' ? 'Patch' : kind === 'minor' ? 'Minor' : 'Major') + ' would exceed 255 — bump the next level up instead (all parts must stay 0–255).' };
  }
  return { ok: true, version: next, error: null };
}

/**
 * analyzeVersions(lines) — parse many labeled versions and report
 * consistency problems. Engine-version lines (label contains "engine") are
 * excluded from the equality rule. Returns { results, warnings, max, issues }.
 */
export function analyzeVersions(lines) {
  const results = [];
  const warnings = [];
  const errors = [];

  lines.forEach(function (line, i) {
    const parsed = parseVersionLine(line);
    if (parsed.error) {
      errors.push({ index: i, raw: line, message: parsed.error });
      results.push({ label: '', version: null, error: parsed.error, raw: line });
      return;
    }
    if (parsed.version.some(function (n) { return n > 255; })) {
      errors.push({ index: i, raw: line, message: 'Parts must be 0–255.' });
    }
    results.push({ label: parsed.label, version: parsed.version, error: null, raw: line });
  });

  const packVersions = results.filter(function (r) {
    return r.version && !(r.label && r.label.toLowerCase().indexOf('engine') !== -1);
  });
  const engineVersions = results.filter(function (r) {
    return r.version && r.label && r.label.toLowerCase().indexOf('engine') !== -1;
  });

  const seen = new Map();
  packVersions.forEach(function (r) {
    const key = r.version.join('.');
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(r.label || '(unnamed)');
  });

  if (seen.size > 1) {
    const summary = Array.from(seen.entries())
      .map(function (e) { return e[0] + ' (' + e[1].join(', ') + ')'; })
      .join(' vs ');
    warnings.push('Versions differ across the pack: ' + summary + '. Keep header.version and every module version equal so updates import cleanly.');
  }

  /* a label repeated with different versions is a real red flag */
  const labelVersions = new Map();
  packVersions.forEach(function (r) {
    if (!r.label) return;
    if (!labelVersions.has(r.label)) labelVersions.set(r.label, []);
    labelVersions.get(r.label).push(r.version.join('.'));
  });
  labelVersions.forEach(function (versions, label) {
    const distinct = Array.from(new Set(versions));
    if (distinct.length > 1) {
      warnings.push('"' + label + '" appears with multiple versions: ' + distinct.join(' and ') + ' — pick one.');
    }
  });

  const allVals = packVersions.map(function (r) { return r.version; });
  const max = allVals.length ? allVals.reduce(function (a, b) {
    for (let i = 0; i < 3; i++) {
      if (a[i] !== b[i]) return a[i] > b[i] ? a : b;
    }
    return a;
  }) : null;

  return { results: results, warnings: warnings, errors: errors, max: max, engineVersions: engineVersions };
}