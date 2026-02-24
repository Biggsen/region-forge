# Sea Region Kind Specification

## Overview

This specification adds support for **sea/ocean regions** as a first-class region kind in Region Forge and the regions-meta schema. Sea regions are polygonal (like normal regions) but semantically represent ocean/sea terrain, enabling mc-plugin-manager and downstream plugins to apply different discovery rewards, LevelledMobs bands, or other logic for water-based regions.

**Prerequisites**: None. This is an additive feature.

---

## Problem Statement

Currently, the regions-meta schema supports four kinds: `system`, `region`, `village`, `heart`. Land and sea are not differentiated—both export as `kind: region`. Users may want to:

- Define ocean regions (e.g., "The Serpent Sea", "Frozen Waters") as distinct from land regions
- Have mc-plugin-manager apply different CE rewards or discovery logic for sea vs land
- Filter or display sea regions differently in downstream tools

The region-meta schema has no way to express "this is a sea region."

---

## Goals

1. Add `kind: sea` to the regions-meta schema
2. Add `recipeId: sea_region` (and `nether_sea_region` for nether) for discover.recipeId
3. Add `isSea` property to Region type in Region Forge
4. Add UI control in Advanced Panel to mark a region as sea
5. Export sea regions with `kind: sea` and correct recipeId
6. Maintain backward compatibility (existing regions default to land)

---

## Solution

### Phase 1: Schema Update

#### `reference/regions-meta-schema.md`

**§3.2 `kind` — Allowed Values**

Add new row:

| Value    | Meaning |
|----------|---------|
| `system` | System region (e.g. spawn). No discovery rewards. |
| `region` | Normal discoverable land region. |
| `sea`    | Sea/ocean region. Polygonal like `region`; uses sea-specific recipeId for CE. |
| `village`| Village. Uses village-specific crates/counters in CE and village band in LevelledMobs. |
| `heart`  | Region heart (e.g. `heart_of_xyz`). Uses heart-specific crates/counters. |

**§3.5 `discover.recipeId` — Allowed Values**

Add new rows:

| Value           | Typical use |
|-----------------|-------------|
| `region`        | Overworld land region. |
| `sea_region`    | Overworld sea/ocean region. |
| `nether_region` | Nether region. |
| `nether_sea_region` | Nether sea region (e.g. lava oceans). |
| ...             | (existing entries unchanged) |

**§3.6 `biomes`**

Update note: "Only present for `kind: region` **or `kind: sea`** (main regions)."

**Changelog (§12)**

Add entry:

| Version | Notes |
|--------|-------|
| 1.5    | Added `kind: sea` and `recipeId: sea_region` / `nether_sea_region` for sea/ocean regions. |

---

### Phase 2: Region Type and Migration

#### `src/types.ts`

Add optional property to `Region`:

```ts
export type Region = {
  id: string
  name: string
  // ... existing fields ...
  isSea?: boolean  // When true, exports as kind: sea
}
```

#### `src/hooks/useRegions.ts`

**Migration (around line 58–66):**

Add `isSea: region.isSea ?? false` to the migrated region object so existing regions default to land.

**New region default (around line 160):**

Add `isSea: false` when creating a new region in `startDrawingRegion`.

---

### Phase 3: UI — Advanced Panel

#### `src/components/AdvancedPanel.tsx`

**Location**: Spawn section, after the "Has Spawn" checkbox (around line 372). Only shown when `regions.selectedRegionId` is set. For MVP, hide when `dimension === 'nether'`.

**Implementation**:

Add a checkbox, same pattern as "Has Spawn":

```tsx
<label className="flex items-center space-x-2">
  <input
    type="checkbox"
    checked={regions.regions.find(r => r.id === regions.selectedRegionId)?.isSea || false}
    onChange={(e) => {
      const regionId = regions.selectedRegionId!
      regions.updateRegion(regionId, { isSea: e.target.checked })
    }}
    className="w-4 h-4 text-lapis-lazuli bg-gray-700 border-gunmetal rounded focus:ring-lapis-lazuli focus:ring-2"
  />
  <span className="text-sm text-gray-300">Sea region</span>
</label>
```

**Placement**: Inside the "Spawn Region" collapsible, below "Has Spawn", or in a new "Region Properties" subsection. Grouping with "Has Spawn" is acceptable since both are region-specific toggles.

**Nether**: For MVP, hide the "Sea region" checkbox when `dimension === 'nether'`. Export logic still supports `nether_sea_region` (e.g. for imported projects); nether UI can be added later for lava oceans.

---

### Phase 4: Export Logic

#### `src/utils/exportUtils.ts`

**`getRecipeId` function (line 254):**

Extend kind parameter and add cases:

```ts
function getRecipeId(kind: 'system' | 'region' | 'sea' | 'village' | 'heart', world: 'overworld' | 'nether' | 'end'): string {
  if (kind === 'system') return 'none'
  const effectiveWorld = world === 'end' ? 'overworld' : world
  if (effectiveWorld === 'nether') {
    if (kind === 'region') return 'nether_region'
    if (kind === 'sea') return 'nether_sea_region'
    if (kind === 'heart') return 'nether_heart'
  }
  if (kind === 'sea') return 'sea_region'
  return kind
}
```

**`exportRegionsMetaYAML` (around line 324–344):**

When building `regionEntry` for each main region, set `kind` based on `region.isSea`:

```ts
kind: region.isSea === true ? 'sea' : 'region',
discover: {
  method: region.hasSpawn === true ? 'first_join' : 'on_enter',
  recipeId: getRecipeId(region.isSea === true ? 'sea' : 'region', dim)
}
```

**Biomes**: Sea regions should still receive biome breakdown (they may have ocean biomes). No change to biome scanning logic.

---

### Phase 5: Import/Export Compatibility

#### Project export/import (`exportCompleteMap`, `importMapData`)

Ensure `isSea` is included in the serialized region object. If the export format already includes all Region properties (spread or explicit), `isSea` will be included automatically. Verify that `importMapData` does not strip unknown keys; if it does, add `isSea` to the allowed/parsed fields.

---

## Summary Table

| Task | File | Description |
|------|------|-------------|
| Schema: add `kind: sea` | `reference/regions-meta-schema.md` | §3.2, §3.5, §3.6, §12 |
| Add `isSea` to Region type | `src/types.ts` | Optional boolean |
| Migration + new region default | `src/hooks/useRegions.ts` | `isSea: false` |
| Sea region checkbox | `src/components/AdvancedPanel.tsx` | Spawn section, when region selected |
| Export kind/recipeId | `src/utils/exportUtils.ts` | `getRecipeId`, `exportRegionsMetaYAML` |
| Project import/export | `src/utils/exportUtils.ts` or import handler | Ensure `isSea` persists |

---

## Testing Checklist

- [ ] Create a new region, leave "Sea region" unchecked → exports as `kind: region`, `recipeId: region`
- [ ] Create a region, check "Sea region" in Advanced Panel → exports as `kind: sea`, `recipeId: sea_region`
- [ ] Nether region with "Sea region" checked → exports as `kind: sea`, `recipeId: nether_sea_region` (if nether sea is implemented)
- [ ] Export regions-meta, verify sea regions have correct kind and recipeId
- [ ] Import project with sea regions, verify `isSea` persists
- [ ] Existing projects (no `isSea` field) load correctly and export as land regions

---

## Notes

- **Hearts and villages**: Hearts and villages are derived from regions (centerPoint, subregions). A region marked as sea can still have a heart; the heart remains `kind: heart`. Villages are overworld-only and typically land-based; no change to village export.
- **Biome scan**: Sea regions still get biome breakdown. The existing `getLandVsSeaBreakdown` and `isSeaBiome` utilities can inform the user (e.g., "This region is 95% sea biomes—consider marking as Sea region") but that is out of scope for this spec.
- **mc-plugin-manager**: This spec defines the schema; mc-plugin-manager must be updated separately to handle `kind: sea` and `recipeId: sea_region` for CE rewards, LevelledMobs, etc.
