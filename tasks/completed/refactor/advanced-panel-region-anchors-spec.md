# Advanced Panel — Region Hearts & Nerves Deduplication

**Status:** ✅ **Completed** (branch `cursor/advanced-panel-refactor`, merged or ready for PR)

**Done:** Shared clipboard/import/scroll helpers; `SubregionListRow` extracted; `RegionAnchorSection` + `HEART_ANCHOR_CONFIG` / `NERVE_ANCHOR_CONFIG` + `regionAnchorApi`; heart/nerve UI removed from `AdvancedPanel` (two `<RegionAnchorSection />` lines). Unit tests for config and TP formatting. Manual UI regression recommended before merge (see checklist below).

**Related:** [PR #12 review](https://github.com/Biggsen/region-forge/pull/12) item **4**. Follow-up to [`refactor-spec.md`](./refactor-spec.md). Orthogonal bug work: [`region-anchor-move-split-spec.md`](../../bugs/region-anchor-move-split-spec.md) (anchor geometry on move/split — not part of this UI refactor).

---

## Overview

The **Region Hearts** and **Region Nerves** sections in [`AdvancedPanel.tsx`](../../../src/components/AdvancedPanel.tsx) were largely copy-paste (~260 lines each). This refactor deduplicates shared behavior and extracts anchor UI so hearts and nerves stay in sync without double edits.

**Product constraint preserved:** two separate accordions (hearts and nerves), not one combined section.

---

## As implemented

### Delivery (incremental tracks)

| Track | Deliverable | Status |
|-------|-------------|--------|
| **0a** | `anchorClipboardUtils.ts` — `formatMinecraftTpCommand`, `buildBulkAnchorTpText`, `copySubregionTpToClipboard` | ✅ |
| **0b** | `regionAnchorImport.ts` — `runRegionAnchorCsvImport` | ✅ |
| **0c** | `useScrollAnchorRowIntoView` hook | ✅ |
| **1a** | `SubregionListRow.tsx` (+ edit-state types) | ✅ |
| **2a/2b** | Extract hearts/nerves (evolved into single section) | ✅ |
| **2c** | `RegionAnchorSection` + config (spec Goal 1) | ✅ |

### File layout (actual)

```
src/components/
  SubregionListRow.tsx
  AdvancedPanel.tsx                    # expand state + persistence; two section mounts
  regionAnchor/
    regionAnchorConfig.ts              # HEART_ANCHOR_CONFIG, NERVE_ANCHOR_CONFIG
    regionAnchorConfig.test.ts
    regionAnchorApi.ts                 # heart/nerve region + mapCanvas wiring
    RegionAnchorSection.tsx            # single UI implementation

src/utils/
  anchorClipboardUtils.ts              # TP helpers (not regionAnchorUtils — avoids move/split spec name clash)
  anchorClipboardUtils.test.ts
  regionAnchorImport.ts

src/hooks/
  useScrollAnchorRowIntoView.ts
```

### Architecture notes

- **Config** (`regionAnchorConfig.ts`): user-visible strings, icons, CSV keys, `anchorField` (`centerPoint` | `nervePoint`). No callbacks on config object.
- **API** (`regionAnchorApi.ts`): `getRegionAnchorApi(kind, regions, mapCanvas)` — import, coordinate updates, clear anchor, export builder, map placement.
- **Section** (`RegionAnchorSection.tsx`): local state (import, editing X/Y/Z, placed list, delete modal); uses `useAppContext()` for regions, map, toast, seed, world name.
- **Persistence:** `isRegionSpecificExpanded` and `isRegionNervesExpanded` remain in `AdvancedPanel` (unchanged keys in `persistenceUtils`).

### Intentionally not done (non-goals or deferred)

- `useRegionAnchorSection.ts` — optional hook; state kept inline in section.
- `regionAnchorUtils.ts` for clipboard — used `anchorClipboardUtils.ts` instead.
- Rename `isRegionSpecificExpanded` → `isRegionHeartsExpanded` (migration).
- Merge hearts/nerves into one accordion.
- `AdvancedPanelSection` accordion wrapper for other panel sections.
- RTL / snapshot component tests.
- Split all of `AdvancedPanel` (villages, structures, lore, etc.).

---

## Acceptance criteria

- [x] Hearts and Nerves accordions look and behave the same as before (verify manually — checklist below).
- [x] `saveAdvancedPanelSectionsState` still persists `isRegionSpecificExpanded` and `isRegionNervesExpanded`.
- [x] CSV import/export filenames and structure columns unchanged (`region_heart` / `region_nerve`).
- [x] Map placement modes unchanged (one placement mode per kind via `regionAnchorApi`).
- [x] Bulk and per-row TP use shared formatter (`anchorClipboardUtils`).
- [x] `npm run test:run` and `npm run build` pass.
- [x] No heart/nerve JSX duplication in `AdvancedPanel` — only two `<RegionAnchorSection />` + configs.

---

## Test plan

### Unit (automated)

- [x] `regionAnchorConfig.test.ts` — config shape, `anchorField`, CSV structure constants vs `villageUtils`.
- [x] `anchorClipboardUtils.test.ts` — TP formatting.

### Manual regression (before merge)

1. **Hearts:** Import CSV, place on map, edit X/Y/Z in list, copy row TP, copy all heart TPs, export CSV, remove heart, summary text.
2. **Nerves:** Same flow with nerve labels and `region_nerve` CSV.
3. **Both on one region:** Heart and nerve lists show different coords; bulk copy in each panel copies only that anchor type.
4. **Persistence:** Expand/collapse each accordion, reload app — state restored.
5. **Selection highlight:** Select region on map — corresponding row scrolls into view in open placed list.

---

## Implementation checklist

- [x] Add `regionAnchorConfig.ts` with heart + nerve configs
- [x] Move TP helpers to `anchorClipboardUtils.ts` (+ tests)
- [x] Implement `RegionAnchorSection` (+ `regionAnchorApi.ts`)
- [x] Replace duplicated JSX in `AdvancedPanel.tsx`
- [x] Remove dead heart/nerve state, refs, handlers, duplicate modals from `AdvancedPanel`
- [x] Add config unit test
- [ ] Manual regression (both kinds) — **operator sign-off**
- [x] Run `npm run test:run` and `npm run build`

---

## References

- PR #12 review item 4: [region-forge#12](https://github.com/Biggsen/region-forge/pull/12)
- UI: [`AdvancedPanel.tsx`](../../../src/components/AdvancedPanel.tsx), [`RegionAnchorSection.tsx`](../../../src/components/regionAnchor/RegionAnchorSection.tsx)
- Domain: [`useRegions.ts`](../../../src/hooks/useRegions.ts), [`useMapCanvas.ts`](../../../src/hooks/useMapCanvas.ts)
- CSV: [`villageUtils.ts`](../../../src/utils/villageUtils.ts) — `REGION_HEART_CSV_STRUCTURE`, `REGION_NERVE_CSV_STRUCTURE`
