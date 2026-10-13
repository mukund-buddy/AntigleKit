/* identifier-rules.js — Minecraft Bedrock identifier validation rules.
   Verified against learn.microsoft.com + bedrock.dev (2026-08-06):
   - identifiers are `namespace:name`
   - both parts: lowercase a-z, 0-9, `_`; may not start with a digit
   - the name part may additionally contain `.`
   - the `minecraft:` namespace is reserved for vanilla content
   Pure module: no DOM, no network; importable from Node for tests.
   Output: { valid, severity: 'ok'|'warning'|'error', issues, normalized } */

const PART_RE = /^[a-z_][a-z0-9_]*$/;
const NAME_RE = /^[a-z_][a-z0-9_.]*$/;

/**
 * validateIdentifier(raw) — validate one identifier string (trimmed).
 * Returns { valid, severity, issues: [{severity, message}], normalized }.
 */
export function validateIdentifier(raw) {
  const value = String(raw == null ? '' : raw).trim();
  const issues = [];

  if (!value) {
    return { valid: false, severity: 'error', issues: [{ severity: 'error', message: 'Empty identifier.' }], normalized: '' };
  }

  if (/\s/.test(value)) {
    issues.push({ severity: 'error', message: 'Identifiers cannot contain spaces.' });
    return { valid: false, severity: 'error', issues: issues, normalized: value };
  }

  if (value.indexOf(':') === -1) {
    issues.push({
      severity: 'warning',
      message: 'No namespace. Many contexts assume the default "minecraft:" namespace — always use your own namespace for custom content (e.g. myaddon:name).'
    });
    const okName = NAME_RE.test(value);
    const okBase = PART_RE.test(value);
    if (!okName || !okBase) {
      issues.push({ severity: 'error', message: 'Allowed characters are lowercase a-z, 0-9 and "_" (and "." in the name). Must not start with a digit.' });
    }
    if (okBase && okName) {
      return { valid: true, severity: 'warning', issues: issues, normalized: value };
    }
    return { valid: false, severity: 'error', issues: issues, normalized: value };
  }

  const parts = value.split(':');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    issues.push({ severity: 'error', message: 'Use exactly one ":" — format is namespace:name.' });
    return { valid: false, severity: 'error', issues: issues, normalized: value };
  }

  const ns = parts[0];
  const name = parts[1];

  if (ns === 'minecraft') {
    issues.push({
      severity: 'warning',
      message: 'The "minecraft:" namespace is reserved for vanilla content — custom content should use its own namespace to avoid conflicts.'
    });
  }

  if (!PART_RE.test(ns)) {
    issues.push({
      severity: 'error',
      message: 'Namespace must be lowercase a-z, 0-9, "_", and must not start with a digit. Found: "' + ns + '".'
    });
  }

  if (!NAME_RE.test(name)) {
    issues.push({
      severity: 'error',
      message: 'Name must be lowercase a-z, 0-9, "_" or ".", and must not start with a digit. Found: "' + name + '".'
    });
  }

  const hasError = issues.some(function (i) { return i.severity === 'error'; });
  return {
    valid: !hasError,
    severity: hasError ? 'error' : (ns === 'minecraft' ? 'warning' : 'ok'),
    issues: issues,
    normalized: value
  };
}

/**
 * validateIdentifiers(text) — split a textarea body into lines, skip blanks
 * and lines starting with #, validate each. Returns { results, valid, errors }.
 */
export function validateIdentifiers(text) {
  const lines = String(text == null ? '' : text).split(/\r?\n/);
  const results = [];
  let errors = 0;

  lines.forEach(function (line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.charAt(0) === '#') return;
    const r = validateIdentifier(trimmed);
    if (!r.valid) errors += 1;
    results.push({ raw: trimmed, ...r });
  });

  return {
    results: results,
    valid: errors === 0 && results.length > 0,
    errors: errors,
    total: results.length
  };
}
