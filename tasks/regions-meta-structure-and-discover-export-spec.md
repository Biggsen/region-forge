# Regions-meta: structure export + discover (`recipeId`) alignment

## Status: 📋 Planned

**Schema reference:** `reference/regions-meta-schema.md` (format `1`, changelog 1.7+)

**Primary implementation:** `src/utils/exportUtils.ts` — `exportRegionsMetaYAML`

**Related:** `tasks/completed/region-meta-export-spec.md` (initial regions-meta export; predates full structure schema and `recipeId` omission guidance)

---

## Overview

Mc-plugin-manager treats **`discover.recipeId` as optional**: it derives the stored recipe id from `kind` + `world` when the field is absent. Region Forge should **stop emitting `recipeId`** on all regions-meta entries.

The reference schema requires **`kind: structure`** rows to carry **`structureType`**, and the export should include root **`structureFamilies`** whenever any structure region is present. Today Forge exports structures with `kind: structure` and `discover.method: on_enter` but **does not** set `structureType`, **does not** emit `structureFamilies`, and incorrectly sets **`discover.recipeId`** to the main-region recipe (`getRecipeId('region', dim)`) instead of omitting it (PM expects derived `none` for structures).

Work is **phased** so internal ids match the schema **before** export emits them, then YAML matches PM, then docs match the shipped shape.

---

## End-state goals (when all phases complete)

1. **Omit `discover.recipeId`** for every `kind` Forge emits. Remove **`getRecipeId`** from `exportRegionsMetaYAML` (and from `exportUtils.ts` if unused).
2. **Per structure region:** **`structureType`** matches a key under root **`structureFamilies`** and matches `reference/regions-meta-schema.md` §3.2 canonical values.
3. **Root `structureFamilies`:** when any `kind: structure` is exported, include every **`structureType`** used in that file, each with **`label`** and **`counter`** per §7.1.
4. **Structure rows stay minimal:** no `biomes`, `category`, `items`, `theme`, or `description` unless product asks later.
5. **Reference examples:** `reference/regions-meta-schema.md` §10 / §11 show the same shape as Forge (no `recipeId` in examples).

---

## Non-goals (entire initiative)

- Changing WorldGuard **`regions.yml`** structure subregion blocks (`generateSubregionYAML` in `villageUtils.ts`).
- Adding `discover.commandIdOverride` / `discover.displayNameOverride` unless explicitly requested later.
- Nether structure exports: current code skips villages/structures loops for `dim === 'nether'`; leave that unless product asks for nether POIs.

---

## Phase 1 — Canonical `jungle_temple` id (foundation)

**Why first:** `structureType` in YAML must equal schema keys. The app still uses **`jungle_pyramid`** in places; the schema canonical is **`jungle_temple`**. Export reads **`Subregion.structureType`** — avoid export-only mapping; align app state and persistence **before** Phase 2 emits YAML.

**Priority:** High (unblocks correct `structureFamilies` keys and PM validation without special cases.)

### Decision

Align Region Forge with **`reference/regions-meta-schema.md`** §3.2: use **`jungle_temple`** as the sole id for this structure family everywhere in app state and exports.

| Area | Detail |
|------|--------|
| `STRUCTURE_TYPES` | Replace `JUNGLE_PYRAMID: 'jungle_pyramid'` with **`JUNGLE_TEMPLE: 'jungle_temple'`** in `src/types.ts` (TS key matches string). |
| References | Update every `STRUCTURE_TYPES.JUNGLE_PYRAMID` / `'jungle_pyramid'` reference (grep checklist below). |
| UI copy | “Jungle Pyramid” vs “Jungle Temple” in Advanced Panel is product preference; **schema id** is `jungle_temple`. |
| Internal symbols | `generateJunglePyramidName`, `junglePyramid*` in `nameGenerator.ts` may keep names (not exported ids). |
| Persisted data | Map JSON / `localStorage` may key structure visibility by **`jungle_pyramid`**. Add one-time migration or load-time fallback → **`jungle_temple`**. |
| CSV / docs | Update anything that treats `jungle_pyramid` as a stable external id. |

All other `STRUCTURE_TYPES` values already match the schema (`ancient_city`, `buried_treasure`, `desert_pyramid`, `desert_well`, `igloo`, `pillager_outpost`, `trail_ruins`).

### Files (Phase 1)

| File | Change |
|------|--------|
| `src/types.ts` | `JUNGLE_TEMPLE: 'jungle_temple'`; remove `JUNGLE_PYRAMID` / `jungle_pyramid`. |
| `src/utils/villageUtils.ts` | `STRUCTURE_NAME_GENERATORS`, `generateSubregionYAML` branch (`isJunglePyramid` → align with `JUNGLE_TEMPLE` / `jungle_temple`). |
| `src/utils/villageUtils.test.ts` | Fixtures: `jungle_temple` / `STRUCTURE_TYPES.JUNGLE_TEMPLE`. |
| `src/components/AdvancedPanel.tsx` | Structure UI keys: `STRUCTURE_TYPES.JUNGLE_TEMPLE`. |
| `src/components/RegionOverlay.tsx` | Highlight map: `STRUCTURE_TYPES.JUNGLE_TEMPLE`. |
| `src/utils/persistenceUtils.ts` (or equivalent) | Migrate or normalize stored structure-type keys `jungle_pyramid` → `jungle_temple`. |

**Grep checklist:** `JUNGLE_PYRAMID`, `jungle_pyramid`, `isJunglePyramid` (rename locals if desired).

### Phase 1 verification

- [ ] Existing saved maps load; jungle POI visibility and highlights behave correctly.
- [ ] No remaining `jungle_pyramid` / `JUNGLE_PYRAMID` in runtime paths that affect export or stored subregions (tests + grep).

---

## Phase 2 — regions-meta export (PM contract)

**Why second:** Depends on canonical `structureType` strings from Phase 1. Delivers the importer-facing fix: **`recipeId` omission**, **`structureType`** on rows, **`structureFamilies`**.

**Priority:** High (correct YAML for mc-plugin-manager.)

### `recipeId` removal (all kinds)

| kind | Current behaviour | Target |
|------|-------------------|--------|
| `system` | `discover: { method: disabled, recipeId: none }` | `{ method: disabled }` only |
| `region` | `recipeId` from `getRecipeId('region', dim)` | omit |
| `heart` | `recipeId` from `getRecipeId('heart', dim)` | omit |
| `village` | `recipeId` from `getRecipeId('village', dim)` | omit |
| `structure` | `recipeId` from `getRecipeId('region', dim)` — **wrong** | omit (PM derives `none`) |

Remove **`getRecipeId`** from `exportUtils.ts` if nothing else references it.

### Structure region row (target shape)

For each exported structure subregion (overworld, `includeStructures`, `sub.type === 'structure'`):

```yaml
- id: <yamlSubregionRegionId(sub)>
  world: overworld
  kind: structure
  structureType: <canonical key>
  discover:
    method: on_enter
```

No `recipeId`. No `biomes`.

### `structureFamilies` content

Stable **`label`** and **`counter`** (AA key without `Custom.` prefix). Default template aligned with reference §10:

| structureType | label (example) | counter (example) |
|---------------|-----------------|-------------------|
| `ancient_city` | Ancient Cities | `ancient_cities_found` |
| `buried_treasure` | Buried Treasures | `buried_treasures_found` |
| `desert_pyramid` | Desert Pyramids | `desert_pyramids_found` |
| `desert_well` | Desert Wells | `desert_wells_found` |
| `igloo` | Igloos | `igloos_found` |
| `jungle_temple` | Jungle Temples | `jungle_temples_found` |
| `pillager_outpost` | Pillager Outposts | `pillager_outposts_found` |
| `trail_ruins` | Trail Ruins | `trail_ruins_found` |

**Build rule:** Collect the set of `structureType` values on exported structure rows; emit **`structureFamilies`** with at least those keys (`label` + `counter` each). Optionally include all known families for stable ordering; minimum is **every referenced type**.

**Implementation sketch:** `STRUCTURE_FAMILY_META: Record<MetaStructureType, { label: string; counter: string }>` and `pickStructureFamilies(usedTypes: Set<MetaStructureType>)`, with `MetaStructureType` matching **`STRUCTURE_TYPES`** string values after Phase 1.

### Files (Phase 2)

| File | Change |
|------|--------|
| `src/utils/exportUtils.ts` | Omit `recipeId` on all `discover` objects; set `structureType` on structure rows from **`Subregion.structureType`**; build and attach `structureFamilies` when any structure exported; remove `getRecipeId` if unused. |

### Phase 2 verification

- [ ] Export with structures: every structure line has **`structureType`** present in **`structureFamilies`**.
- [ ] No `recipeId` under any `discover` block.
- [ ] Spawn: `kind: system`, `discover.method: disabled`, no `recipeId`.
- [ ] First-join region: `discover.method: first_join`, no `recipeId`.
- [ ] Mc-plugin-manager imports without errors; structure counts / AA counters match expectations.

---

## Phase 3 — Reference documentation & spec hygiene

**Why last:** Docs should describe the **shipped** export; avoids churn if Phase 1–2 adjust details.

**Priority:** Medium (accuracy and onboarding for humans; not required for PM to accept YAML from Phase 2.)

### Files (Phase 3)

| File | Change |
|------|--------|
| `reference/regions-meta-schema.md` | §10 (and §11): remove `recipeId` from examples; optional §3.4 note that omitting `recipeId` with `disabled` matches derived `none`. |
| `tasks/completed/region-meta-export-spec.md` | Optional short note at top: superseded for `recipeId` / structure rows by this spec (do not rewrite historical body). |

### Phase 3 verification

- [ ] Reference full / minimal examples match exported shape (no `recipeId`).

---

## Full verification checklist (rollup)

- [ ] **Phase 1:** Saved maps load; jungle structures use `jungle_temple`; grep clean for old ids where it matters.
- [ ] **Phase 2:** `structureType` / `structureFamilies` consistent; no `recipeId`; PM import OK.
- [ ] **Phase 3:** Schema examples match Forge.

---

## Changelog (this spec)

| Date | Note |
|------|------|
| 2026-03-23 | Initial spec: structure `structureType` + `structureFamilies`, omit `recipeId` everywhere, jungle key alignment. |
| 2026-03-23 | Decision: refactor `jungle_pyramid` → `jungle_temple` in code and persisted ids; no export-only mapping. |
| 2026-03-23 | Restructured into **Phase 1** (jungle id + persistence), **Phase 2** (export YAML), **Phase 3** (reference docs). |
