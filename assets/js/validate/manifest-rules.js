/* manifest-rules.js — Bedrock pack manifest validation rules.
   Mirrors ARCHITECTURE.md §2.1 (verified against Microsoft Learn, 2026-08-06).
   Pure functions: no DOM, no network — reusable in the browser (ESM) and in
   Node for tests. Shared by the Manifest Validator tool.
   Output: { valid, errors, warnings, issues, summary } */

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const MODULE_TYPES = ['resources', 'data', 'world_template', 'script', 'client_data', 'skin_pack'];

export const PACK_SCOPES = ['world', 'global', 'any'];

const KNOWN_TOP = ['format_version', 'header', 'modules', 'dependencies', 'capabilities', 'metadata', 'subpacks'];
const KNOWN_HEADER = ['name', 'description', 'uuid', 'version', 'min_engine_version', 'pack_scope', 'allow_random_seed', 'base_game_version', 'lock_template_options'];
const KNOWN_MODULE = ['description', 'type', 'uuid', 'version', 'language', 'entry'];
const KNOWN_META = ['authors', 'license', 'url', 'generated_with'];

function isInt(n, hi) {
  return Number.isInteger(n) && n >= 0 && n <= (hi === undefined ? 255 : hi);
}

function isVersionArray(v) {
  return Array.isArray(v) && v.length === 3 && v.every(function (n) { return isInt(n); });
}

function isStr(v) {
  return typeof v === 'string';
}

function isPlainObj(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function unknownKeys(obj, known) {
  return Object.keys(obj).filter(function (k) { return known.indexOf(k) === -1; });
}

/**
 * validateManifest(value) — value is a parsed JSON object (not a string).
 * Returns { valid, errors, warnings, issues, summary } where issues is an
 * array of { severity: 'error'|'warning', path, message }.
 */
export function validateManifest(value) {
  const issues = [];
  const push = function (severity, path, message) { issues.push({ severity: severity, path: path, message: message }); };

  if (!isPlainObj(value)) {
    return {
      valid: false,
      errors: 1,
      warnings: 0,
      issues: [{ severity: 'error', path: '(root)', message: 'A manifest must be a JSON object.' }],
      summary: { formatVersion: null, moduleTypes: [], resourceBehavior: false }
    };
  }

  /* format_version */
  let formatVersion = null;
  if ('format_version' in value) {
    formatVersion = value.format_version;
    if (formatVersion === 1 || formatVersion === 2) {
      /* fine */
    } else if (formatVersion === 3) {
      push('warning', 'format_version', 'Version 3 is still preview-only (1.21.110+); it expects semver strings instead of version arrays.');
    } else {
      push('error', 'format_version', 'Must be 1 or 2 (3 is preview-only). Found: ' + String(formatVersion) + '.');
    }
  } else {
    push('error', 'format_version', 'Required field is missing.');
  }

  /* header */
  const header = value.header;
  if (!isPlainObj(header)) {
    push('error', 'header', 'Required "header" object is missing or not an object.');
  } else {
    const hName = header.name;
    if (!isStr(hName) || !hName.trim()) push('error', 'header.name', 'Required string is missing or empty.');
    else if (hName.length > 80) push('warning', 'header.name', 'Over 80 characters — Minecraft may truncate the pack name in lists.');

    const hDesc = header.description;
    if (!isStr(hDesc) || !hDesc.trim()) push('error', 'header.description', 'Required string is missing or empty.');
    else if (hDesc.length > 120) push('warning', 'header.description', 'Over 120 characters — Minecraft recommends a 1–2 line description.');

    const hUuid = header.uuid;
    if (!isStr(hUuid) || !UUID_RE.test(hUuid)) {
      push('error', 'header.uuid', 'Must look like 8-4-4-4-12 hexadecimal digits, e.g. 1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e.');
    }

    if (!isVersionArray(header.version)) {
      push('error', 'header.version', 'Must be an array of 3 integers (0–255), e.g. [1, 0, 0].');
    }

    const scope = header.pack_scope;
    if (scope !== undefined) {
      if (PACK_SCOPES.indexOf(scope) === -1) {
        push('error', 'header.pack_scope', 'Must be one of: "world", "global", "any".');
      }
    }

    const reservedForWorld = [
      ['allow_random_seed', 'boolean'],
      ['lock_template_options', 'boolean'],
      ['base_game_version', 'array']
    ];
    reservedForWorld.forEach(function (pair) {
      const key = pair[0];
      if (header[key] !== undefined && typeof header[key] !== pair[1]) {
        push('error', 'header.' + key, 'World-template field must be a ' + pair[1] + '.');
      }
    });

    unknownKeys(header, KNOWN_HEADER).forEach(function (k) {
      push('warning', 'header.' + k, 'Unrecognized field — check for a typo; Minecraft ignores fields it does not know.');
    });
  }

  /* modules */
  const modules = value.modules;
  if (!Array.isArray(modules) || modules.length === 0) {
    push('error', 'modules', 'Required "modules" array is missing or empty — a pack needs at least one module.');
  } else {
    const seenUuids = header && isStr(header.uuid) ? [header.uuid.toLowerCase()] : [];
    const moduleTypes = [];
    let skinPack = false;
    modules.forEach(function (mod, i) {
      const base = 'modules[' + i + ']';
      if (!isPlainObj(mod)) {
        push('error', base, 'Each module must be an object.');
        return;
      }

      const type = mod.type;
      if (!isStr(type) || MODULE_TYPES.indexOf(type) === -1) {
        push('error', base + '.type', 'Unknown module type "' + String(type) + '". Allowed: ' + MODULE_TYPES.join(', ') + '.');
      } else {
        moduleTypes.push(type);
        if (type === 'skin_pack') skinPack = true;
      }

      const uuid = mod.uuid;
      if (!isStr(uuid) || !UUID_RE.test(uuid)) {
        push('error', base + '.uuid', 'Must be a valid 8-4-4-4-12 hex UUID.');
      } else {
        const low = uuid.toLowerCase();
        if (seenUuids.indexOf(low) !== -1) {
          push('error', base + '.uuid', 'Duplicate UUID — every module uuid must differ from the pack uuid and from every other module.');
        } else {
          seenUuids.push(low);
        }
      }

      if (!isVersionArray(mod.version)) {
        push('error', base + '.version', 'Must be an array of 3 integers (0–255), e.g. [1, 0, 0].');
      }

      if (type === 'script') {
        if (mod.language !== 'javascript') push('error', base + '.language', 'Script modules must set "language" to "javascript".');
        if (!isStr(mod.entry) || !mod.entry.trim()) {
          push('error', base + '.entry', 'Script modules need an "entry" path (e.g. scripts/main.js).');
        } else if (!/\.js$/.test(mod.entry)) {
          push('error', base + '.entry', 'Entry should point to a .js file (e.g. scripts/main.js).');
        }
      }

      unknownKeys(mod, KNOWN_MODULE).forEach(function (k) {
        push('warning', base + '.' + k, 'Unrecognized module field — check for a typo.');
      });
    });

    /* min_engine_version requirement */
    const needsMin = moduleTypes.indexOf('resources') !== -1 || moduleTypes.indexOf('data') !== -1;
    if (header && needsMin && !isVersionArray(header.min_engine_version)) {
      push('error', 'header.min_engine_version', 'Required for resource and behavior packs — use a 3-integer vector like [1, 21, 0].');
    }
    if (header && !needsMin && header.min_engine_version !== undefined && !isVersionArray(header.min_engine_version)) {
      push('error', 'header.min_engine_version', 'Must be a 3-integer vector like [1, 21, 0].');
    }

    if (header && !needsMin && header.pack_scope !== undefined) {
      push('warning', 'header.pack_scope', 'pack_scope only applies to resource packs.');
    }

    if (header && needsMin && (header.allow_random_seed !== undefined || header.lock_template_options !== undefined || header.base_game_version !== undefined)) {
      push('warning', 'header', 'World-template fields are only used by world_template manifests.');
    }

    if (formatVersion === 1 && !skinPack) {
      push('warning', 'format_version', 'Format 1 is the skin-pack format; resource/behavior/world-template packs use format 2.');
    }
    if (formatVersion === 2 && skinPack) {
      push('warning', 'modules', 'skin_pack modules belong to format_version 1 manifests.');
    }
  }

  /* dependencies */
  if (value.dependencies !== undefined) {
    if (!Array.isArray(value.dependencies)) {
      push('error', 'dependencies', 'Must be an array.');
    } else {
      value.dependencies.forEach(function (dep, i) {
        const base = 'dependencies[' + i + ']';
        if (!isPlainObj(dep)) {
          push('error', base, 'Each dependency must be an object.');
          return;
        }
        const hasName = isStr(dep.module_name) && dep.module_name.trim() !== '';
        const hasUuid = isStr(dep.uuid) && UUID_RE.test(dep.uuid);
        if (!hasName && !hasUuid) {
          push('error', base, 'Needs either "module_name" (scripting module) or "uuid" (another pack).');
        }
        if (hasName && !isStr(dep.version)) {
          push('error', base + '.version', 'Scripting-module versions are strings, e.g. "1.14.0" or ">=1.14.0".');
        }
        if (hasUuid && !isVersionArray(dep.version)) {
          push('error', base + '.version', 'Pack-dependency versions are 3-integer arrays, e.g. [1, 0, 0].');
        }
      });
    }
  }

  /* capabilities */
  if (value.capabilities !== undefined) {
    if (!Array.isArray(value.capabilities) || !value.capabilities.every(isStr)) {
      push('error', 'capabilities', 'Must be an array of strings (e.g. ["script_eval"]).');
    }
  }

  /* metadata */
  if (value.metadata !== undefined) {
    const meta = value.metadata;
    if (!isPlainObj(meta)) {
      push('error', 'metadata', 'Must be an object.');
    } else {
      if (meta.authors !== undefined && (!Array.isArray(meta.authors) || !meta.authors.every(isStr))) {
        push('error', 'metadata.authors', 'Must be an array of strings.');
      }
      if (meta.license !== undefined && !isStr(meta.license)) {
        push('error', 'metadata.license', 'Must be a string.');
      }
      if (meta.url !== undefined) {
        try { new URL(meta.url); } catch (e) { push('error', 'metadata.url', 'Must be a valid URL.'); }
      }
      unknownKeys(meta, KNOWN_META).forEach(function (k) {
        push('warning', 'metadata.' + k, 'Unrecognized metadata field — check for a typo.');
      });
    }
  }

  /* subpacks */
  if (value.subpacks !== undefined) {
    if (!Array.isArray(value.subpacks)) {
      push('error', 'subpacks', 'Must be an array.');
    } else {
      value.subpacks.forEach(function (sp, i) {
        const base = 'subpacks[' + i + ']';
        if (!isPlainObj(sp)) {
          push('error', base, 'Each subpack must be an object.');
          return;
        }
        if (!isStr(sp.folder_name) || !sp.folder_name.trim()) push('error', base + '.folder_name', 'Required string is missing.');
        if (!isStr(sp.name) || !sp.name.trim()) push('error', base + '.name', 'Required string is missing.');
        if (sp.memory_tier !== undefined && !isInt(sp.memory_tier, 3)) push('error', base + '.memory_tier', 'Must be an integer 0–3.');
        else if (sp.memory_tier === undefined) push('warning', base + '.memory_tier', 'Recommended for subpacks (0 = low, 3 = high).');
      });
    }
  }

  /* unknown top-level keys */
  unknownKeys(value, KNOWN_TOP).forEach(function (k) {
    push('warning', k, 'Unrecognized top-level field — check for a typo; Minecraft ignores fields it does not know.');
  });

  const errors = issues.filter(function (i) { return i.severity === 'error'; }).length;
  const warnings = issues.length - errors;
  const moduleTypes = (Array.isArray(modules) ? modules : [])
    .filter(function (m) { return isPlainObj(m) && isStr(m.type); })
    .map(function (m) { return m.type; });

  return {
    valid: errors === 0,
    errors: errors,
    warnings: warnings,
    issues: issues,
    summary: {
      formatVersion: formatVersion,
      moduleTypes: moduleTypes,
      resourceBehavior: moduleTypes.indexOf('resources') !== -1 || moduleTypes.indexOf('data') !== -1
    }
  };
}
