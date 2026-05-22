# Water Region Kind Specification

## Status: ✅ IMPLEMENTED

**Completed:** 2026 (schema changelog 2.0)  
**Archived:** `tasks/completed/` (May 2026)

**Originally drafted as** `tasks/sea-region-kind-spec.md` (`kind: sea`, `isSea`, `recipeId: sea_region`). **Shipped design differs:** `kind: water`, `isWater`, `discover.method: passive`, **`recipeId` omitted** (aligned with `tasks/completed/regions-meta-structure-and-discover-export-spec.md`).

**Schema reference:** `reference/regions-meta-schema.md` (format `1`, changelog **2.0**)

**Primary implementation:** `src/utils/exportUtils.ts` — `exportRegionsMetaYAML`; `src/types.ts`; `src/components/AdvancedPanel.tsx`; `src/utils/polygonUtils.ts`; `src/components/RegionOverlay.tsx`

---

## Overview

Large water bodies (oceans, seas, lakes) are polygonal regions like land, but export to regions-meta as **`kind: water`** so mc-plugin-manager can keep them in the catalogue (WorldGuard id, LevelledMobs `regionBands`, TAB coloring) **without** main exploration discovery (CE discover-once, AA commands, progression counters).

---

## Problem Statement

Land and sea were indistinguishable in regions-meta (`kind: region` for both). Users need ocean-named regions that behave differently downstream from discoverable land.

---

## Shipped solution (summary)

| Area | Shipped behaviour |
|------|-------------------|
| App flag | `Region.isWater?: boolean` (default `false`) |
| regions-meta | `kind: water`, `discover: { method: passive }` — **no `recipeId`** |
| UI | Advanced → **Water** collapsible; checkbox “Set as water region” (hidden in nether dimension) |
| Mutual exclusion | Marking water clears `hasSpawn`; marking spawn clears `isWater` |
| WorldGuard | Sea-level Y band 35–75; water-specific greeting copy when greetings enabled |
| Onboarding | Regions with `isWater` are not eligible as `onboarding.startRegionId` |

---

## Schema (`reference/regions-meta-schema.md`)

### `kind: water`

- Polygonal main region (same `points` / WorldGuard poly2d as land).
- **Does not** count toward main exploration totals.
- **`discover.method: passive`** — live for LM/TAB; no CE/AA discovery output in mc-plugin-manager v1.
- **`recipeId`:** omit on new Forge exports; importer derives **`none`** for `kind: water`.
- **`biomes`:** allowed when biome map is available (overworld/nether with map; not End).
- Optional `description`, `category`, `items`, `theme` — same as land regions.

### Not shipped from original draft

- `kind: sea`, `isSea`, `recipeId: sea_region` / `nether_sea_region`
- `getRecipeId` (removed project-wide)

---

## Region Forge implementation

### `src/types.ts`

```ts
/** When true, regions-meta exports as kind: water with discover.method: passive. */
isWater?: boolean
```

### `src/hooks/useRegions.ts` / `src/hooks/useRegionDrawing.ts`

- Migration: `isWater: region.isWater ?? false`
- New regions: `isWater: false`

### `src/components/AdvancedPanel.tsx`

- **Water** section (Droplets icon), `isWaterExpanded` persisted in advanced panel state.
- Shown when `dimension !== 'nether'`.
- Checkbox when a region is selected; help text documents `kind: water` + `passive`.
- `isWater: true` sets `hasSpawn: false`; spawn checkbox sets `isWater: false`.

### `src/utils/exportUtils.ts` — `exportRegionsMetaYAML`

For each enabled main region (not nether water rows — `isWater` only applies when `dim !== 'nether'`):

```yaml
id: <nameToRegionId>
world: overworld   # or end
kind: water        # when isWater === true
discover:
  method: passive
# recipeId omitted
```

Land: `kind: region`, `method: on_enter` or `first_join` when `hasSpawn`.

`onboarding.startRegionId` excludes `isWater === true` regions.

### `src/utils/polygonUtils.ts` — `regions.yml`

When `isWater && dim !== 'nether'`:

- `min-y: 35`, `max-y: 75`
- Greeting copy uses “Crossing …” (no farewell when water-only greeting path)
- Challenge subheading text uses water-themed lines when enabled

### `src/components/RegionOverlay.tsx`

- Distinct fill/stroke/label styling for `isWater` regions on the map canvas.

### Project import/export

`isWater` is part of `Region` and persists via project JSON / `exportCompleteMap` like other region fields.

---

## Testing checklist (verification)

- [x] New region, water unchecked → `kind: region`, `discover.method: on_enter` (or `first_join` if spawn)
- [x] Water checked in Advanced → `kind: water`, `discover.method: passive`, no `recipeId`
- [x] Water + spawn mutually exclusive in UI
- [x] Nether: Water UI hidden; no `kind: water` export from nether dimension path
- [x] `regions.yml` water poly2d uses Y 35–75
- [x] Legacy projects without `isWater` load as land (`false`)
- [x] Biome breakdown still emitted for water regions when biome map present

---

## Related specs

| Spec | Relationship |
|------|----------------|
| `tasks/completed/regions-meta-structure-and-discover-export-spec.md` | Lists `kind: water` as shipped alongside `recipeId` omission |
| `tasks/completed/region-meta-export-spec.md` | Initial regions-meta export |
| `reference/regions-meta-schema.md` | Authoritative schema (§3.2 `water`, §3.4 `passive`, changelog 2.0) |

---

## Notes

- **Hearts / nerves / villages:** Unchanged; parent can be water; heart/nerve/village rows keep their own `kind`.
- **mc-plugin-manager:** Must understand `kind: water` and `passive` (separate MCPM work).
- **Biome hints:** `isSeaBiome` / land-vs-sea breakdown in `biomeScanner.ts` are advisory only; not required to mark `isWater`.

---

## Changelog (this spec)

| Date | Note |
|------|------|
| (draft) | Original `sea-region-kind-spec.md`: `kind: sea`, `isSea`, `recipeId: sea_region`. |
| 2026 | Shipped as `kind: water`, `isWater`, `passive`, no `recipeId`; schema 2.0. |
| 2026-05-21 | Rewritten to match shipped behaviour; renamed to `water-region-kind-spec.md`; archived under `tasks/completed/`. |
