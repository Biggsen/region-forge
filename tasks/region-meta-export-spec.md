# Region-Meta Export Specification

## Overview

This specification defines the **regions-meta export** feature for Region Forge. The export produces a `regions-meta.yml` file conforming to the schema consumed by **mc-plugin-manager** (mcpm). Region Forge currently exports only `regions.yml` (WorldGuard) and several plugin-specific YAMLs in Advanced (Achievements, Event Conditions, LevelledMobs). The region-meta export is the bridge for mcpm: it carries discovery metadata, onboarding, spawn center, and LevelledMobs bands that `regions.yml` does not. Eventually, plugin export logic in Advanced will move to mcpm; region-meta will remain Region Forge’s output for mcpm.

**Placement:** The region-meta export lives in the **Export** tab. It is only visible when `advanced=true` (the URL parameter that reveals the advanced Export Options). When hidden, the region-meta button is not rendered.

**Schema reference:** `reference/regions-meta-schema.md`

---

## Problem Statement

- **regions.yml** only describes WorldGuard regions (polygons, flags, priority). It does not express:
  - `kind` (system, region, village, heart)
  - `discover` (method, recipeId)
  - `onboarding` (start region, first-join teleport)
  - `spawnCenter`
  - `levelledMobs` (regionBands, villageBandStrategy)

- That richer data exists in Region Forge (spawn, `hasSpawn`, hearts, villages, `challengeLevel`) but is only used for `regions.yml` generation and the Advanced plugin exports. mcpm needs it in one structured format: `regions-meta.yml`.

---

## Goals

1. **Export `regions-meta.yml`** that conforms to `reference/regions-meta-schema.md` (format 1).
2. **Reuse existing Region Forge data** — no new app state or UI for region-meta–specific fields beyond what is already used for `regions.yml` and Advanced.
3. **Place the export in the Export tab**, and only show it when `advanced=true` (same condition as the advanced Export Options: `?advanced=true`).
4. **Respect overworld vs nether**: nether never has spawn, `spawnCenter`, or `onboarding`.

---

## Data Mapping: Region Forge → regions-meta

### Root

| regions-meta field | Source | Notes |
|-------------------|--------|-------|
| `format` | — | Always `1`. |
| `regions` | See § Regions array | Required. Built from main regions, hearts, villages, and (overworld-only) spawn. |
| `onboarding` | `hasSpawn`, spawn coordinates | Only when **overworld**, spawn coordinates exist, and a region has `hasSpawn`. |
| `spawnCenter` | `spawn.spawnState.coordinates` | Only when **overworld** and spawn coordinates exist. |
| `levelledMobs` | `challengeLevel`, hard-coded `villageBandStrategy` | When any region has `challengeLevel` or when `levelledMobs` is otherwise needed; see § levelledMobs. |

---

### Regions array

One entry per logical region. IDs must be unique per `world`. Use the same ID rules as `regions.yml`:

- **Main region:** `region.name.toLowerCase().replace(/\s+/g, '_')`
- **Heart:** `heart_of_${region.name.toLowerCase().replace(/\s+/g, '_')}`
- **Village:** `subregion.name.toLowerCase().replace(/\s+/g, '_')`
- **Spawn:** `spawn` (overworld only)

**Inclusion rules:** Follow the same toggles as `regions.yml` where they exist:

- **Spawn:** Only when overworld, `includeSpawnRegion` (or equivalent) is on, and `spawn.spawnState.coordinates` plus radius exist. Nether never includes spawn.
- **Hearts:** When `includeHeartRegions` is on.
- **Villages:** When `includeVillages` is on and the parent region is included.

(If region-meta is implemented before any toggles are added for it, it may always include hearts and villages when the corresponding `regions.yml` options would; the implementation can mirror `exportRegionsYAML`’s `includeHeartRegions` and `includeVillages` for consistency.)

**Per-region fields:**

| Field | Source |
|-------|--------|
| `id` | As above. |
| `world` | `worldType` → `"overworld"` or `"nether"`. |
| `kind` | `system` (spawn), `region` (main), `village` (subregion type `village`), `heart` (heart_of_X). |
| `discover.method` | Spawn → `disabled`. Region with `hasSpawn === true` → `first_join`. All others → `on_enter`. |
| `discover.recipeId` | From `kind` + `world`: `none` (system), `region`/`nether_region`, `heart`/`nether_heart`, `village`/`nether_village`. |
| `discover.commandIdOverride` | Omit. |
| `discover.displayNameOverride` | Omit. |

---

### onboarding (overworld only, when spawn and hasSpawn exist)

| Field | Source |
|-------|--------|
| `startRegionId` | The region with `hasSpawn === true`. Use its `id` as for `regions[]` (e.g. `name.toLowerCase().replace(/\s+/g, '_')`). |
| `teleport` | Object with `world`, `x`, `z` only. |

**teleport:**

| Field | Source |
|-------|--------|
| `world` | `worldName` (e.g. `"world"`). |
| `x` | `spawn.spawnState.coordinates.x`. |
| `z` | `spawn.spawnState.coordinates.z`. |

**Omit:** `y`, `yaw`, `pitch`. mcpm will handle the absence of `y`.

**When to omit `onboarding` entirely:**

- `worldType === 'nether'` (nether never has spawn/onboarding).
- No spawn coordinates.
- No region with `hasSpawn === true`.

---

### spawnCenter (overworld only)

| Field | Source |
|-------|--------|
| `world` | `worldName`. |
| `x` | `spawn.spawnState.coordinates.x`. |
| `z` | `spawn.spawnState.coordinates.z`. |

Omit `spawnCenter` when:

- `worldType === 'nether'`, or
- No spawn coordinates.

---

### levelledMobs

| Field | Source |
|-------|--------|
| `villageBandStrategy` | Always `"easy"`. Hard-coded; Region Forge does not expose this. mcpm will clarify schema if needed. |
| `regionBands` | Map: `region id` → difficulty. |

**regionBands:** Only main regions (not spawn, hearts, villages) that have `challengeLevel` set. Map `challengeLevel` to schema bands:

| Region Forge `challengeLevel` | regions-meta band |
|-------------------------------|-------------------|
| Vanilla | `easy` |
| Bronze | `normal` |
| Silver | `hard` |
| Gold | `severe` |
| Platinum | `deadly` |

Only include `levelledMobs` when:

- `regionBands` has at least one entry, or
- We always emit `villageBandStrategy`; in that case we can emit `levelledMobs: { villageBandStrategy: "easy" }` even when `regionBands` is empty. For simplicity, emit `levelledMobs` only when there is at least one `challengeLevel` set **or** when we have villages (so mcpm has `villageBandStrategy`). The spec can leave this to implementation; a minimal approach: emit `levelledMobs` only when `regionBands` is non-empty, and always set `villageBandStrategy: "easy"` when `levelledMobs` is present.

---

## Nether

- **Spawn:** Nether never has spawn. Do not add a spawn region. Do not emit `spawnCenter` or `onboarding`.
- **regions:** Only main regions, hearts, and villages. `world` = `"nether"`. `recipeId` uses `nether_region`, `nether_heart`, `nether_village` as appropriate.

---

## File and Format

- **Filename (download):** `regions-meta.yml`
- **Format:** YAML, UTF-8.
- **Root:** `format`, `regions`, and optionally `onboarding`, `spawnCenter`, `levelledMobs`.

---

## Implementation

### 1. `src/utils/exportUtils.ts`

Add:

```ts
export function exportRegionsMetaYAML(
  regions: Region[],
  worldType: 'overworld' | 'nether',
  worldName: string,
  spawnState: { coordinates: { x: number; z: number } | null; radius: number },
  includeVillages: boolean,
  includeHeartRegions: boolean,
  includeSpawnRegion: boolean,
  onShowToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void
): void
```

- Build an object matching the schema (or a YAML string). Use a YAML library if one exists (e.g. in deps), otherwise construct the YAML string.
- **regions:** Iterate main regions; append heart entries when `includeHeartRegions`; append village entries when `includeVillages`. For overworld, prepend or append spawn when `includeSpawnRegion` and `spawnState.coordinates` and radius exist.
- **onboarding:** Only overworld, when spawn and a region with `hasSpawn` exist; `startRegionId` = that region’s id; `teleport: { world: worldName, x, z }`.
- **spawnCenter:** Only overworld when spawn coordinates exist; `{ world: worldName, x, z }`.
- **levelledMobs:** When any main region has `challengeLevel`, set `villageBandStrategy: "easy"` and `regionBands` from the mapping above.
- Trigger download of `regions-meta.yml`. On error or no regions (and no spawn when overworld), call `onShowToast` and return without downloading.

### 2. `src/components/ExportPanel.tsx`

- Add a **“Generate regions-meta.yml”** button in the Export tab. Render it only when `showAdvanced` is true (i.e. `urlParams.get('advanced') === 'true'`, the same condition used for the Export Options block).
- Reuse `includeVillages`, `includeHeartRegions`, `includeSpawnRegion` from the existing ExportPanel state (already loaded from `loadExportSettings()`). For nether, pass `includeSpawnRegion: false`. On click: call `exportRegionsMetaYAML` with `regions.regions`, `worldType.worldType`, `worldName.worldName`, `spawn.spawnState`, those include flags, and `toast.showToast`.
- Disable the button when there is nothing to export: e.g. `regions.regions.length === 0` and (overworld with spawn disabled or no spawn coords, or nether). Reuse the same “no regions” / “no spawn” logic as `exportRegionsYAML` where possible.
- Optional: add a short description (e.g. “For mc-plugin-manager”) near the button.

### 3. Persistence

- Region-meta uses the same `includeVillages`, `includeHeartRegions`, `includeSpawnRegion` state as the regions.yml export (already in ExportPanel, from `loadExportSettings()`). No new persisted fields for region-meta.
- `villageBandStrategy` is not stored; it is always `"easy"` at export time.

### 4. YAML serialisation

- If the project has no YAML dependency, implement a small helper to output the regions-meta structure (numbers, strings, nested objects/arrays). Ensure correct escaping for strings. Alternatively add a lightweight YAML lib (e.g. `yaml` or `js-yaml`) and use it for this export only.

---

## Implementation Checklist

### exportUtils

- [ ] Add `exportRegionsMetaYAML` with signature above.
- [ ] Implement `regions` array: main, heart (when `includeHeartRegions`), village (when `includeVillages`), spawn (overworld + `includeSpawnRegion` + spawn coords + radius).
- [ ] Implement `onboarding` (overworld only, when spawn and `hasSpawn`); `teleport` with `world`, `x`, `z` only.
- [ ] Implement `spawnCenter` (overworld only, when spawn coords exist).
- [ ] Implement `levelledMobs`: `villageBandStrategy: "easy"` and `regionBands` from `challengeLevel` mapping; omit when no data.
- [ ] Emit valid YAML and trigger `regions-meta.yml` download.
- [ ] Handle “nothing to export” and nether spawn rules; no spawn/onboarding/spawnCenter for nether.

### ExportPanel

- [ ] Add “Generate regions-meta.yml” button; render it only when `showAdvanced` (`?advanced=true`).
- [ ] Use existing `includeVillages`, `includeHeartRegions`, `includeSpawnRegion` state; pass `includeSpawnRegion: false` when nether. Wire `exportRegionsMetaYAML` with `regions`, `worldType`, `worldName`, `spawn`, those flags, and `toast.showToast`.
- [ ] Disable button when export would be empty (no regions and no spawn for overworld, or nether with no regions).
- [ ] Optional: short description that region-meta is for mc-plugin-manager.

### Tests and schema

- [ ] Manually export overworld with spawn, `hasSpawn`, hearts, villages, and `challengeLevel`; verify structure against `reference/regions-meta-schema.md`.
- [ ] Export nether; confirm no `spawn`, `spawnCenter`, `onboarding`.
- [ ] Export overworld without spawn; no `spawnCenter` or `onboarding`.
- [ ] Export overworld with spawn but no `hasSpawn`; no `onboarding`; `spawnCenter` and spawn region present if spawn is included.
- [ ] Verify `recipeId` nether variants for nether dimension.

---

## Testing Requirements

### Overworld

- [ ] Spawn region present when spawn coords + radius + `includeSpawnRegion`; `kind: system`, `discover: { method: disabled, recipeId: none }`.
- [ ] `spawnCenter` present when spawn coords exist; `world`, `x`, `z` only.
- [ ] `onboarding` present when spawn coords and one region has `hasSpawn`; `startRegionId` = that region’s id; `teleport: { world, x, z }` only (no `y`, `yaw`, `pitch`).
- [ ] That `hasSpawn` region has `discover.method: first_join`; others `on_enter` or `disabled`.
- [ ] Hearts and villages only when `includeHeartRegions` / `includeVillages`; correct `kind` and `recipeId`.
- [ ] `levelledMobs.regionBands` only for main regions with `challengeLevel`; `villageBandStrategy: "easy"`.
- [ ] All `regions[].world` = `"overworld"`; `regions[].id` unique.

### Nether

- [ ] No spawn region, no `spawnCenter`, no `onboarding`.
- [ ] `regions[].world` = `"nether"`; `recipeId` uses `nether_region`, `nether_heart`, `nether_village` where appropriate.

### Edge cases

- [ ] Overworld, spawn set, no region with `hasSpawn`: no `onboarding`; `spawnCenter` and spawn region still if include spawn.
- [ ] No regions and no spawn (overworld): button disabled or export shows error; no file or empty `regions` handled per product choice.
- [ ] `challengeLevel` on main regions only; hearts/villages do not get `regionBands` entries.

---

## Success Criteria

- [ ] `regions-meta.yml` can be generated from the **Export** tab (when `advanced=true`) and matches the schema in `reference/regions-meta-schema.md` (format 1).
- [ ] All mappings in this spec are implemented (regions, onboarding, spawnCenter, levelledMobs).
- [ ] Nether: no spawn, `spawnCenter`, or `onboarding`.
- [ ] `onboarding.teleport` uses only `world`, `x`, `z`; `startRegionId` from the region with `hasSpawn`.
- [ ] `villageBandStrategy` is always `"easy"` when `levelledMobs` is present; no UI or persistence for it.
- [ ] No regressions in `regions.yml` or Advanced exports.
- [ ] mcpm can import the generated file (validated manually or via mcpm’s importer).

---

## Dependencies

- **Schema:** `reference/regions-meta-schema.md`. mcpm may update the schema (e.g. `villageBandStrategy` optional or default); Region Forge will continue to emit `villageBandStrategy: "easy"` when `levelledMobs` is present until told otherwise.
- **App:** `useAppContext` (regions, worldType, worldName, spawn, toast). No new hooks or global state.

---

## Out of Scope

- **Region-meta when `advanced` is false:** The region-meta button is hidden when `?advanced=true` is not set; this is intentional.
- **Plugin exports in Advanced** (Achievements, Event Conditions, LevelledMobs YAMLs): remain in Region Forge for now; eventual migration to mcpm is separate.
- **`villageBandStrategy` configuration:** hard-coded to `"easy"`; no UI.
- **`onboarding.teleport.y` (or yaw/pitch):** never exported; mcpm handles missing values.
- **Spawn in nether:** never supported in Region Forge; no change.

---

## Changelog

| Version | Date | Notes |
|--------|------|-------|
| 1 | (spec creation) | Initial spec: regions-meta export, mapping, onboarding/spawnCenter/levelledMobs rules, nether behaviour, `villageBandStrategy` fixed to `easy`, `teleport` without y/yaw/pitch, `startRegionId` from `hasSpawn`. |
| 1.1 | — | Region-meta is in the **Export** tab, visible only when `?advanced=true`. Uses existing include flags from ExportPanel state. |
