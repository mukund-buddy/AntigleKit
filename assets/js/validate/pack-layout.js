/* pack-layout.js — Bedrock pack folder-layout checks against a parsed ZIP.
   Depends on manifest-rules.js for the embedded manifest and on zip-parse.js
   entry shapes ({ name, isDir }). Pure module: no DOM, no network.
   Output: { issues: [{severity: 'error'|'warning'|'info', message}],
            pack: {name, formatVersion, moduleTypes, scriptEntries} | null,
            root: [{name, dir, count}] } */

import { validateManifest } from './manifest-rules.js';

const MODULE_FOLDERS = {
  resources: ['textures', 'texts', 'models', 'animation_controllers', 'render_controllers', 'sound', 'fog', 'particles', 'attachables', 'entity'],
  data: ['functions', 'scripts', 'loot_tables', 'tables', 'recipes', 'entities', 'items', 'blocks', 'spawn_rules', 'structures', 'trading', 'dialogue', 'tags', 'features', 'feature_rules']
};

const JUNK_BASENAMES = ['.ds_store', 'thumbs.db', '.thumbnails', 'desktop.ini'];

export function normalizePath(name) {
  let p = String(name).replace(/\\/g, '/');
  while (p.indexOf('./') === 0) p = p.slice(2);
  while (p.indexOf('/') === 0) p = p.slice(1);
  return p;
}

export function isDirEntry(entry) {
  return entry.isDir === true;
}

/**
 * checkPackLayout(entries, manifestObj) — entries from parseZip (files and
 * dirs), manifestObj is the parsed manifest.json (or null).
 */
export function checkPackLayout(entries, manifestObj) {
  const issues = [];
  const files = entries.filter(function (e) { return !isDirEntry(e); });
  const names = files.map(function (e) { return normalizePath(e.name); });
  const lower = names.map(function (n) { return n.toLowerCase(); });

  /* zip-slip / root escape */
  files.forEach(function (e) {
    const segs = normalizePath(e.name).split('/');
    if (segs.indexOf('..') !== -1) {
      issues.push({ severity: 'error', message: 'Entry escapes the pack root (../): "' + e.name + '"' });
    }
  });

  /* manifest at root */
  let manifestIndex = -1;
  const manLower = lower.indexOf('manifest.json');
  if (manLower === -1) {
    issues.push({ severity: 'error', message: 'manifest.json is missing from the pack root — Bedrock will not load this pack.' });
  } else {
    manifestIndex = names[manLower] === 'manifest.json' ? manLower : -1;
    if (manifestIndex === -1) {
      issues.push({ severity: 'warning', message: 'The manifest is named "' + names[manLower] + '" — Bedrock expects exactly "manifest.json" (lowercase).' });
      manifestIndex = manLower;
    }
  }

  /* junk files (common when zipping on macOS/Windows) */
  files.forEach(function (e) {
    const n = normalizePath(e.name);
    const base = n.split('/').pop().toLowerCase();
    if (n.indexOf('__macosx/') === 0 || base === '._' || base === '.ds_store' || JUNK_BASENAMES.indexOf(base) !== -1) {
      issues.push({ severity: 'warning', message: 'Junk entry found: "' + e.name + '" — remove it before sharing the pack.' });
    }
  });

  /* pack info from manifest */
  let pack = null;
  if (manifestIndex !== -1 && manifestObj && typeof manifestObj === 'object') {
    const manCheck = validateManifest(manifestObj);
    manCheck.issues.forEach(function (i) {
      issues.push({ severity: i.severity === 'error' ? 'error' : 'warning', message: 'manifest.json — ' + i.message });
    });
    pack = {
      name: manifestObj && manifestObj.header ? manifestObj.header.name : '',
      formatVersion: manifestObj ? manifestObj.format_version : null,
      moduleTypes: Array.isArray(manifestObj && manifestObj.modules)
        ? manifestObj.modules.map(function (m) { return m && m.type; }).filter(Boolean)
        : []
    };
  }

  /* root-level structure */
  const rootMap = new Map();
  files.forEach(function (e) {
    const n = normalizePath(e.name);
    if (!n) return;
    const first = n.indexOf('/') === -1 ? n : n.slice(0, n.indexOf('/'));
    if (!rootMap.has(first)) rootMap.set(first, { name: first, dir: n.indexOf('/') !== -1, count: 0 });
    rootMap.get(first).count += 1;
  });
  const root = Array.from(rootMap.values()).sort(function (a, b) {
    if (a.dir !== b.dir) return a.dir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  /* expected folders per module type */
  if (pack && pack.moduleTypes.length) {
    const topDirs = root.filter(function (r) { return r.dir; }).map(function (r) { return r.name.toLowerCase(); });
    pack.moduleTypes.forEach(function (type) {
      const expected = MODULE_FOLDERS[type];
      if (!expected) return;
      const present = expected.filter(function (f) { return topDirs.indexOf(f) !== -1; });
      if (present.length === 0) {
        issues.push({
          severity: 'info',
          message: 'No ' + type + '-pack subfolders found at the root (common ones: ' + expected.slice(0, 4).join(', ') + '). A minimal pack can be valid without them.'
        });
      }
    });
  }

  /* script module entry files must exist */
  if (manifestObj && Array.isArray(manifestObj.modules)) {
    manifestObj.modules.forEach(function (m, i) {
      if (!m || m.type !== 'script' || !m.entry) return;
      const target = normalizePath(m.entry);
      const idx = names.indexOf(target);
      if (idx === -1) {
        const ci = lower.indexOf(target.toLowerCase());
        if (ci !== -1) {
          issues.push({ severity: 'warning', message: 'Script entry "' + target + '" exists with a different case: "' + names[ci] + '".' });
        } else {
          issues.push({ severity: 'error', message: 'Script entry file not found in the archive: "' + m.entry + '" (module ' + i + ').' });
        }
      }
    });
  }

  return { issues: issues, pack: pack, root: root, fileCount: files.length, entryCount: entries.length };
}
