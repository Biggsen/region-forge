# Regions-meta: structure export + discover (`recipeId`) alignment

## Status: 📋 Planned

**Schema reference:** `reference/regions-meta-schema.md` (format `1`, changelog 1.7+)

**Primary implementation:** `src/utils/exportUtils.ts` — `exportRegionsMetaYAML`

**Related:** `tasks/completed/region-meta-export-spec.md` (initial regions-meta export; predates full structure schema and `recipeId` omission guidance)

---

## Overview

Mc-plugin-manager now treats **`discover.recipeId` as optional**: it derives the stored recipe id from `kind` + `world` (and related rules) when the field is absent. Region Forge should **stop emitting `recipeId`** on all regions-meta entries so exports match the “omit” guidance and PM’s importer.

Separately, the reference schema requires **`kind: structure`** rows to carry **`structureType`**, and the export should include root **`structureFamilies`** whenever any structure region is present. Today Forge exports structures with `kind: structure` and `discover.method: on_enter` but **does not** set `structureType`, **does not** emit `structureFamilies`, and incorrectly sets **`discover.recipeId`** to the main-region recipe (`getRecipeId('region', dim)`) instead of omitting it (PM expects derived `none` for structures).

This spec covers **accurate structure-related YAML** per the reference schema plus the **global `recipeId` omission** for every kind.

---

## Goals

1. **Omit `discover.recipeId`** for spawn, main regions, hearts, villages, and structures (all `kind` values Forge emits). Remove or stop using `getRecipeId` in `exportRegionsMetaYAML` once nothing consumes it.
2. **Per structure region:** set **`structureType`** to a string that matches a key under root **`structureFamilies`** and matches `reference/regions-meta-schema.md` §3.2 canonical values.
3. **Root object:** when the export includes **any** `kind: structure` region, set **`structureFamilies`** to a complete map of every **`structureType`** value that appears in that file, each with **`label`** and **`counter`** per §7.1 of the reference doc.
4. **No extra structure fields:** do not add `biomes`, `category`, `items`, `theme`, or `description` on structure rows unless product later requires it (schema allows omit; Forge today does not set them — keep that).
5. **Documentation:** update **`reference/regions-meta-schema.md`** §10 full example (and minimal example if it includes `recipeId`) so examples **omit `recipeId`**, matching Forge and PM guidance.

---

## Non-goals (this pass)

- Changing WorldGuard **`regions.yml`** structure subregion blocks (`generateSubregionYAML` in `villageUtils.ts`).
- Adding `discover.commandIdOverride` / `discover.displayNameOverride` unless explicitly requested later.
- Nether structure exports: current code skips villages/structures loops for `dim === 'nether'`; leave that unless product asks for nether POIs.

---

## Canonical `structureType`: `jungle_temple` (refactor from `jungle_pyramid`)

**Decision:** Align Region Forge with **`reference/regions-meta-schema.md` §3.2** by using **`jungle_temple`** as the sole id for this structure family everywhere in app state and exports. **Do not** rely on a regions-meta–only alias or export-time mapping; **rename** the internal constant and stored string from `jungle_pyramid` to `jungle_temple`.

**Implementation (when this spec is implemented):**

| Change | Detail |
|--------|--------|
| `STRUCTURE_TYPES` | Replace `JUNGLE_PYRAMID: 'jungle_pyramid'` with **`JUNGLE_TEMPLE: 'jungle_temple'`** in `src/types.ts` so the TypeScript key matches the string (avoids `JUNGLE_PYRAMID` holding `jungle_temple`). |
| References | Update every `STRUCTURE_TYPES.JUNGLE_PYRAMID` / `'jungle_pyramid'` reference in the codebase (see § Files to touch — jungle rename). |
| UI copy | Labels like “Jungle Pyramid” in Advanced Panel may stay or move to “Jungle Temple” per product preference; the **schema id** is `jungle_temple` regardless. |
| Internal symbols | `generateJunglePyramidName` and `junglePyramid*` pools in `nameGenerator.ts` can keep their names (they are not exported ids); rename only if the team wants consistent wording in code. |
| Persisted data | Map JSON / `localStorage` may store `visibleStructureTypes` (or similar) keyed by the old string **`jungle_pyramid`**. Add a one-time migration or fallback when loading so existing user data keeps working after the rename. |
| External CSV / docs | Any user-facing CSV headers or docs that mention `jungle_pyramid` should be updated if they are treated as stable ids (otherwise UI-only text can lag). |

**No code changes in this task** — the above is specified for the implementation pass only.

All other `STRUCTURE_TYPES` values already match the schema table (`ancient_city`, `buried_treasure`, `desert_pyramid`, `desert_well`, `igloo`, `pillager_outpost`, `trail_ruins`).

---

## `structureFamilies` content

Use stable **`label`** (human-readable) and **`counter`** (AA custom key without `Custom.` prefix) for each family. Align spelling with whatever mc-plugin-manager / AA already use; the reference doc §10 example is the default template:

| structureType (YAML key) | label (example) | counter (example) |
|--------------------------|-----------------|---------------------|
| `ancient_city` | Ancient Cities | `ancient_cities_found` |
| `buried_treasure` | Buried Treasures | `buried_treasures_found` |
| `desert_pyramid` | Desert Pyramids | `desert_pyramids_found` |
| `desert_well` | Desert Wells | `desert_wells_found` |
| `igloo` | Igloos | `igloos_found` |
| `jungle_temple` | Jungle Temples | `jungle_temples_found` |
| `pillager_outpost` | Pillager Outposts | `pillager_outposts_found` |
| `trail_ruins` | Trail Ruins | `trail_ruins_found` |

**Build rule:** When building the export, collect the **set** of `structureType` values actually present on exported structure rows; emit **`structureFamilies`** with **exactly those keys** (each with `label` + `counter`). Optionally include all known families for consistency; minimum is **every referenced type**. Reference schema: missing family for a used `structureType` may trigger PM warnings.

Implementation sketch: a constant map `STRUCTURE_FAMILY_META: Record<MetaStructureType, { label: string; counter: string }>` and a function `pickStructureFamilies(usedTypes: Set<MetaStructureType>)`, where `MetaStructureType` matches **`STRUCTURE_TYPES`** values after the `jungle_temple` rename.

---

## `recipeId` removal (all kinds)

| kind | Current Forge behaviour | Target |
|------|-------------------------|--------|
| `system` | `discover: { method: disabled, recipeId: none }` | `{ method: disabled }` only |
| `region` | `recipeId` from `getRecipeId('region', dim)` | omit |
| `heart` | `recipeId` from `getRecipeId('heart', dim)` | omit |
| `village` | `recipeId` from `getRecipeId('village', dim)` | omit |
| `structure` | `recipeId` from `getRecipeId('region', dim)` — **wrong semantically** | omit (PM derives `none`) |

Remove **`getRecipeId`** from `exportUtils.ts` if it becomes unused after this change (today it is only referenced from `exportRegionsMetaYAML`).

---

## Structure region row (target shape)

For each exported structure subregion (existing inclusion rules: overworld, `includeStructures`, `sub.type === 'structure'`):

```yaml
- id: <yamlSubregionRegionId(sub)>
  world: overworld
  kind: structure
  structureType: <canonical key per § above>
  discover:
    method: on_enter
```

No `recipeId`. No `biomes`.

---

## Files to touch

| File | Change |
|------|--------|
| `src/utils/exportUtils.ts` | Omit `recipeId` on all `discover` objects; add `structureType` on structure rows; build and attach `structureFamilies` when any structure exported; remove `getRecipeId` if unused. `structureType` values come from **`Subregion.structureType`** after the `jungle_temple` rename (no special-case mapping). |
| `src/types.ts` | `JUNGLE_TEMPLE: 'jungle_temple'` (remove `JUNGLE_PYRAMID` / `jungle_pyramid`). |
| `src/utils/villageUtils.ts` | `STRUCTURE_NAME_GENERATORS`, `generateSubregionYAML` branch (`isJunglePyramid` → align naming with `JUNGLE_TEMPLE` / `jungle_temple`). |
| `src/utils/villageUtils.test.ts` | Update structure type fixtures to `jungle_temple` / `STRUCTURE_TYPES.JUNGLE_TEMPLE`. |
| `src/components/AdvancedPanel.tsx` | Structure UI config keys: `STRUCTURE_TYPES.JUNGLE_TEMPLE`. |
| `src/components/RegionOverlay.tsx` | Highlight color map: `STRUCTURE_TYPES.JUNGLE_TEMPLE`. |
| `src/utils/persistenceUtils.ts` (or equivalent) | If structure visibility / saved state keys use raw type strings, migrate `jungle_pyramid` → `jungle_temple` on load. |
| `reference/regions-meta-schema.md` | §10 (and §11 if applicable): remove `recipeId` from examples; optional §3.4 one-liner that omission is equivalent to derived `none` for `disabled`. |
| `tasks/completed/region-meta-export-spec.md` | Optional note at top: superseded for `recipeId` / structure rows by this spec (avoid rewriting history). |

**Jungle rename — grep checklist (implementation):** `JUNGLE_PYRAMID`, `jungle_pyramid`, `isJunglePyramid` (rename locals if desired for clarity).

---

## Verification checklist

- [ ] Export overworld with structures enabled: every structure line has **`structureType`** matching **`structureFamilies`**.
- [ ] YAML contains **no** `recipeId` under any `discover` block.
- [ ] Spawn row: `kind: system`, `discover.method: disabled`, no `recipeId`.
- [ ] First-join region: `discover.method: first_join`, no `recipeId`.
- [ ] Mc-plugin-manager imports file without errors; structure counts / AA counter wiring match expectations.
- [ ] Reference schema full example matches exported shape (omit `recipeId`).
- [ ] After `jungle_temple` rename: existing saved maps still load; structure visibility / highlights work for jungle POIs.

---

## Changelog (this spec)

| Date | Note |
|------|------|
| 2026-03-23 | Initial spec: structure `structureType` + `structureFamilies`, omit `recipeId` everywhere, jungle key alignment TBD. |
| 2026-03-23 | **Decision:** Refactor `jungle_pyramid` → `jungle_temple` in code and persisted ids; no export-only mapping. Expanded files-to-touch and checklist. |
