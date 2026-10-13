# DATA.md — Static data contracts

Every JSON file in `assets/data/` has a contract below. Adding a field?
Update this document first. Values are `snake_case` only when they mirror the
Minecraft manifest schema (manifest-presets.json); everything else is
`camelCase`.

---

## 1. `assets/data/tools.json`

The catalog of ALL tools — live, planned (approved build plan), and backlog.
Drives `tools/index.html`, the home catalog, related-tools links, and
(manually mirrored) sitemap.xml.

```jsonc
{
  "tools": [
    {
      "id": "manifest-generator",          // URL-safe; == folder name in /tools/
      "slug": "manifest-generator",
      "name": "Manifest Generator",
      "category": "minecraft",             // build-plan category key, see below
      "categoryLabel": "Minecraft",
      "tagline": "Generate a valid manifest.json for Bedrock packs in seconds.",
      "status": "live",                    // "live" | "planned" | "backlog"
      "href": "/tools/manifest-generator/",
      "keywords": ["manifest.json", "bedrock", "addon", "resource pack", "behavior pack"],
      "related": ["manifest-validator", "json-formatter"],  // ids, may include planned
      "sortOrder": 10
    }
  ]
}
```

`category` values (approved plan order): `minecraft`, `youtube`, `web`,
`student`, `design`, `security`, `file`. (The `business` category was
dropped on 2026-08-07.) Backlog items use
`"category": "backlog"`.

Rules:
- `related` only references tool `id`s that exist — no dangling links.
- `live` tools have a real page and appear in the static HTML catalog.
- `planned` tools are approved but not built; they render in the build plan
  list on /tools/ (from `tools-index.js`) and in search. They link to nothing
  yet.
- `backlog` tools are NOT approved or scheduled; they have a catalog row so
  the architecture stays ready, but they are excluded from the tools page
  plan and from site search. Promote to `planned` only after passing the
  tool acceptance rule (ARCHITECTURE.md §17).
- Every NEW live tool = one entry here + one row in sitemap.xml + one folder
  in `/tools/`. Follow the checklist in ROADMAP.md.

## 2. `assets/data/manifest-presets.json`

Generator selectable data. Structure (values must be re-verified per
Minecraft release):

```jsonc
{
  "packTypes": [                          // module.type values offered
    { "value": "resources", "label": "Resource pack" },
    { "value": "data", "label": "Behavior pack" },
    { "value": "world_template", "label": "World template" }
  ],
  "minEngineVersions": [                 // presets; user can also type a custom [a,b,c]
    { "value": [1, 21, 50], "label": "1.21.50 and up (recommended)" },
    { "value": [1, 21, 0], "label": "1.21.0" }
  ],
  "scriptModules": {
    "support": true,                     // allow adding a 'script' module
    "languages": ["javascript"],
    "serverModuleVersions": [            // @minecraft/server presets for dependencies[]
      { "value": "1.9.0", "label": "1.9.0" },
      { "value": "custom", "label": "Custom" }
    ]
  },
  "capabilities": {
    "available": true,
    "items": [
      { "value": "script_eval", "label": "script_eval (scripting modules)" }
    ]
  }
}
```

Validate-access posts these settings only; model/version truth lives here so
logic changes are data-only edits.