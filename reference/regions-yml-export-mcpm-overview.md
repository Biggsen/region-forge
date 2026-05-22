# Region Forge `regions.yml` Export — Overview for MCPM Evaluation

This document describes how **Region Forge** (mc-region-maker) exports **WorldGuard-compatible `regions.yml`**, for evaluation when migrating that export to **mc-plugin-manager** (MCPM).

---

## Purpose

Produces a **WorldGuard-compatible `regions.yml`** fragment: a top-level `regions:` map of named region definitions (polygons and cuboids, flags, priorities).

It is **geometry + WorldGuard flags only** — not discovery, LevelledMobs bands, onboarding, or plugin recipes. That richer layer is **`regions-meta.yml`** (already aimed at MCPM; see `reference/regions-meta-schema.md` and `tasks/completed/region-meta-export-spec.md`).

---

## Where It Lives in Region Forge

| Layer | Role |
|--------|------|
| **UI** | Export tab → “Generate regions.yml” (`src/components/ExportPanel.tsx`) |
| **Orchestration** | `exportRegionsYAML()` in `src/utils/exportUtils.ts` |
| **Per-region body** | `generateRegionYAML()` in `src/utils/polygonUtils.ts` |
| **Villages / structures** | `generateSubregionYAML()` + structure cuboid helpers in `src/utils/villageUtils.ts` |
| **Spawn cuboid** | `generateSpawnRegionYAML()` in `src/utils/exportUtils.ts` |
| **ID normalization** | `nameToRegionId()` in `src/utils/villageUtils.ts` |

Export is **client-side only**: build a YAML string, wrap in a `Blob`, trigger browser download. **`regions.yml` is not parsed/serialized with js-yaml** — it is string templating. (`js-yaml` is used for `regions-meta.yml` only.)

---

## Process (Step by Step)

1. **Load export toggles** from `localStorage` (`mc-region-maker-export-settings` via `ExportSettings` in `src/utils/persistenceUtils.ts`), or from project JSON on import.
2. **Resolve spawn** via `getSpawnExportData()` — requires `spawn.spawnState.coordinates` and `radius`.
3. **Filter** `regions` where `disabled !== true`.
4. **Validate**: need at least one enabled region **or** (overworld + include spawn + spawn has radius). Nether/end never export spawn; empty export shows an error toast.
5. **Optional preamble** (two `# region-forge:` comment lines): generator version (incremented per export, persisted in project), timestamp, app version `1.0.0`, project name, dimension, export stats (region/village/structure/heart/nerve/spawn counts).
6. **Body**: `regions:\n` then, in order:
   - **`spawn`** cuboid (if overworld + toggle + valid spawn radius)
   - **Each enabled main region** via `generateRegionYAML()`, blank line between mains
7. **Download** as `{worldNameSlug}-{dimension}-{date}-regions.yml` (world name slug is cosmetic; **WorldGuard world binding is not written into this file**).

---

## Input Data (What MCPM Must Supply or Reimplement)

### Core app state

**`Region[]`** (`src/types.ts`), per region:

| Field | Used for `regions.yml`? | Notes |
|--------|-------------------------|--------|
| `name` | Yes | → WorldGuard key via `nameToRegionId()` |
| `points[]` `{x,z}` | Yes | Main `poly2d` (rounded integers) |
| `disabled` | Yes | Excluded entirely |
| `centerPoint` `{x,z,y?}` | If hearts on | `heart_of_{id}` cuboid |
| `nervePoint` `{x,z,y?}` | If nerves on, overworld only | `nerve_of_{id}` cuboid |
| `subregions[]` | If villages/structures on | Cuboids with `parent:` |
| `challengeLevel` | Only if greetings + subheading on | Text in greeting flags, not structured |
| `isWater` | Yes | Y band 35–75; different greeting copy |
| `hasSpawn`, `description`, themes, items, etc. | **No** | Used by `regions-meta.yml` / other exports |

**`Subregion`** (village or structure):

| Field | Notes |
|--------|--------|
| `name`, `type`, `x`, `z`, `radius` | Village cuboid on XZ; structure needs **`y`** or row is **skipped** (`null`) |
| `structureType` | One of `STRUCTURE_TYPES` — drives cuboid size/offset |
| `height` | Optional village vertical span override |

**Spawn** (`SpawnState`):

- `coordinates` `{x, z, y}` and `radius` → `spawn` cuboid when overworld + toggle.

**Context (not inside YAML body):**

- `dimension`: `overworld` | `nether` | `end` — Y limits, spawn/nerve rules, nether greeting wording (“You descend into”).
- `worldName` — filename + preamble only.
- **`regionForgeYamlGeneration`** — bumped each export for traceability in preamble + project JSON.

### Export toggles (`ExportSettings`)

| Toggle | Default in UI | Effect |
|--------|----------------|--------|
| `includeVillages` | false | Village cuboids under parent |
| `includeStructures` | true | Structure cuboids (requires `y`) |
| `includeHeartRegions` | false | `heart_of_*` |
| `includeNerveRegions` | false | `nerve_of_*` (overworld only) |
| `includeSpawnRegion` | true | `spawn` (overworld only; forced off nether/end) |
| `useModernWorldHeight` | true | Land Y -64..320 vs legacy 0..255 |
| `useGreetingsAndFarewells` | false | WG greeting/farewell flags |
| `greetingSize` | `large` | `large` / `small` / `chat` (multi-line vs chat keys) |
| `includeChallengeLevelSubheading` | false | Challenge flavor text in greetings (main regions) |

---

## Output: File Shape and Region Kinds

**Format:** YAML with root key `regions:` (WorldGuard region store style).

**Filename:** `{worldNameSlug}-{dimension}-{date}-regions.yml`

### Region kinds emitted

1. **Main region** — `type: poly2d`, `priority: 0`, `points` list, `min-y` / `max-y`, `flags` (usually `passthrough: allow`).
2. **`heart_of_{parentId}`** — `type: cuboid`, 7×7 horizontal, Y from anchor ± offsets (or water/world fallbacks), `priority: 10`, protection flags (`build: deny`, etc.).
3. **`nerve_of_{parentId}`** — Same pattern as heart; overworld only; different vertical span (nerve uses larger below-anchor range).
4. **Village / structure subregions** — `type: cuboid`, `priority: 10`, `parent: {parentId}`, cuboid from locator + type-specific rules (helpers at top of `villageUtils.ts`: jungle temple, desert pyramid, ancient city, shipwreck, etc.).
5. **`spawn`** — `type: cuboid`, `priority: 10`, centered on spawn with radius on X/Z/Y (clamped to world height), hardcoded safe-zone flags (`build: deny`, `pvp: deny`, `invincible: allow`, fixed spawn greeting strings).

### Y-height rules (summary)

| Case | min-y / max-y |
|------|----------------|
| Land main poly2d (modern) | -64 .. 320 |
| Land main poly2d (legacy) | 0 .. 255 |
| Water main (`isWater`) | 35 .. 75 |
| Nether main poly2d | 0 .. 126 |
| Heart / nerve | From anchor Y when set; else water/world fallbacks |
| Structures | Per-type cuboid calculators; **missing `y` → omitted** |
| Villages | XZ from `radius`; Y default anchor−35..anchor+45, or symmetric around anchor if `height` set |

### ID rules

`nameToRegionId(name)`:

- Lowercase
- `&` → `and`
- Strip apostrophes
- Non `[a-z0-9_-]` → `_`
- Collapse repeated underscores, trim leading/trailing `_`

Subregion keys use **display name only** (no structure-type prefix).

### Flags and priority

- **Main polygons:** `priority: 0`, `passthrough: allow` (plus optional greetings).
- **Hearts, nerves, subregions, spawn:** `priority: 10` so they override parent behavior where flags conflict.
- **Heart / nerve flags:** `build: deny`, `interact: allow`, explosion/TNT protection.
- **Spawn flags:** `build: deny`, `pvp: deny`, `mob-spawning: deny`, explosion protection, `invincible: allow`, fixed spawn greeting/farewell strings.

### Optional preamble (comment lines)

Two `# region-forge:` lines before `regions:`:

- Line 1: `generator-version`, `generated-at`, `app-version`, `project`, `dimension`, `plugin=worldguard`, `export-type=regions-yml`, `build-id`
- Line 2: counts — `regions`, `villages`, `structures`, `hearts`, `nerves`, `spawn`

---

## Explicitly NOT in `regions.yml`

These stay in Region Forge or in **`regions-meta.yml`** / Advanced exports today:

- Discovery (`kind`, `discover.method`, recipes)
- `onboarding`, `spawnCenter` as metadata
- `levelledMobs` / `regionBands`
- Region descriptions, biome scan, achievements, event conditions, LevelledMobs plugin YAMLs
- Map image, scale, `originOffset` (used in-app to convert pixels → blocks; export uses **already-converted** world coordinates)

MCPM already has a path for that via **`regions-meta.yml`**. Migrating **`regions.yml`** means porting the **WorldGuard string builders**, not the meta schema.

---

## Relationship to `regions-meta.yml`

| File | Consumer | Content |
|------|----------|---------|
| `regions.yml` | WorldGuard | Polygons/cuboids, flags, priorities |
| `regions-meta.yml` | MCPM | Discovery, onboarding, spawn center, LevelledMobs bands, structure families |

Share **`nameToRegionId`** and the same export toggles so WorldGuard keys match meta `id` fields.

---

## Migration to MCPM — Practical Notes

1. **Inputs MCPM needs:** `Region[]`, spawn state, dimension, export toggles (same semantics as `ExportSettings`), optional project name + generation counter for preamble.
2. **Port surface area:** ~3 modules — `exportRegionsYAML` orchestration, `generateRegionYAML`, `generateSubregionYAML` + structure cuboid math (large section of `villageUtils.ts` for structures).
3. **No runtime deps** beyond string building; logic is deterministic from inputs.
4. **Coupling with regions-meta:** Inclusion toggles and ID rules must stay aligned so WG keys match meta `id` fields.
5. **Validation to preserve:** empty export guard; structures without `y` silently skipped; nether/end spawn disabled; disabled regions skipped.
6. **Output delivery:** Region Forge uses browser download; MCPM would likely write to a configured server path or archive — same string content.

### Source files to port

| File | Functions / concepts |
|------|----------------------|
| `src/utils/exportUtils.ts` | `exportRegionsYAML`, `generateSpawnRegionYAML`, preamble/stats |
| `src/utils/polygonUtils.ts` | `generateRegionYAML`, challenge greeting text |
| `src/utils/villageUtils.ts` | `generateSubregionYAML`, `nameToRegionId`, structure cuboid helpers |
| `src/types.ts` | `Region`, `Subregion`, `STRUCTURE_TYPES` |
| `src/utils/spawnUtils.ts` | `getSpawnExportData` |
| `src/utils/persistenceUtils.ts` | `ExportSettings` shape |

---

## Suggested MCPM Acceptance Checks

- [ ] Same toggles → same region keys and counts as Region Forge preamble stats
- [ ] Spawn only on overworld when enabled
- [ ] Heart/nerve/subregion priorities and `parent` links
- [ ] Each `STRUCTURE_TYPES` cuboid matches Region Forge for sample locators
- [ ] Water vs land vs nether Y ranges
- [ ] Greeting modes (`large` / `small` / `chat`) match WorldGuard flag shape
- [ ] IDs stable vs `regions-meta.yml` for the same project

---

## One-Line Summary

**`regions.yml` export = WorldGuard region definitions built from drawn polygons, optional spawn/hearts/nerves/villages/structures, and export toggles. `regions-meta.yml` remains the separate MCPM contract for gameplay/discovery metadata.**
