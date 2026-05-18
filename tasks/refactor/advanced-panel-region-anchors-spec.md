# Advanced Panel — Region Hearts & Nerves Deduplication

## Overview

[PR #12 review](https://github.com/Biggsen/region-forge/pull/12) item **4**: the **Region Hearts** and **Region Nerves** sections in [`AdvancedPanel.tsx`](../../src/components/AdvancedPanel.tsx) are largely copy-paste (~260 lines each, ~520 lines total). They share layout, CSV import/export, placed-anchor list, map placement UX, bulk TP copy, and delete modals — differing only in labels, icons, region fields, and hook callbacks.

This refactor extracts a **single parameterized anchor panel** so heart and nerve behavior stay in sync (e.g. bulk TP copy, `formatMinecraftTpCommand`) without double edits.

**Status:** Open  
**Priority:** Low (maintainability; not user-facing unless drift causes bugs)  
**Effort:** Medium  
**Prerequisites:** Region nerve feature stable on `master` (or merged branch). Prefer completing [`tasks/bugs/region-anchor-move-split-spec.md`](../bugs/region-anchor-move-split-spec.md) first if touching move/split in the same files.

**Related completed work:** [`tasks/completed/refactor/refactor-spec.md`](../completed/refactor/refactor-spec.md) (hook splits, helpers). This spec is a **follow-up** focused on `AdvancedPanel` anchor UI only.

---

## Problem Statement

### Duplication map

| Concern | Hearts (today) | Nerves (today) | Shared? |
|--------|----------------|----------------|---------|
| Accordion header + expand state | `isRegionSpecificExpanded` | `isRegionNervesExpanded` | Pattern only |
| CSV import UI + handler | `handleHeartImport` | `handleNerveImport` | ~identical |
| Placed list + `SubregionListRow` | `heartRegions`, `editingHeart*` | `nerveRegions`, `editingNerve*` | ~identical |
| Copy names / Export CSV | `buildRegionHeartsVillageFormatCSV` | `buildRegionNervesVillageFormatCSV` | ~identical |
| Map placement CTA | `startSettingCenterPoint` | `startSettingNervePoint` | ~identical |
| Bulk TP copy | `buildBulkAnchorTpText(..., centerPoint)` | `... nervePoint` | Already shared helper |
| Per-row TP copy | inline `/minecraft:tp` | inline `/minecraft:tp` | Should use `formatMinecraftTpCommand` |
| Summary line | “X hearts set…” | “X nerves set…” | ~identical |
| Delete modal | `pendingHeartDelete` | `pendingNerveDelete` | ~identical |
| Scroll selected row into view | `useEffect` + `heartListItemRefs` | `useEffect` + `nerveListItemRefs` | ~identical |

### Risks of duplication

- Fixes or copy changes land in one section only (historical example: bulk TP used `calculateRegionCenter` in both panels before the heart/nerve split fix).
- Per-row TP still duplicates string formatting while `formatMinecraftTpCommand` exists at file top.
- New anchor types (hypothetical) would triple the paste cost.

### Already extracted (keep / extend)

- [`SubregionListRow`](../../src/components/AdvancedPanel.tsx) — coordinate list row for hearts, nerves, structures, villages.
- `formatMinecraftTpCommand` / `buildBulkAnchorTpText` — move to shared util when refactoring (see § Utilities).

---

## Goals

1. **One UI component** renders both hearts and nerves from a **config object** (`kind: 'heart' | 'nerve'`).
2. **One import handler factory** (or shared function) for CSV file pick + toast messages.
3. **AdvancedPanel** shrinks by roughly **200–350 lines** net (after new file overhead).
4. **No behavior change** for users: same accordions, persistence keys, labels, export filenames, map modes.
5. **Tests** where cheap: config completeness; optional snapshot or RTL smoke for one kind.

### Non-goals

- Splitting all of `AdvancedPanel` (villages, structures, lore, etc.).
- Merging hearts and nerves into a **single** accordion (product wants two sections).
- Renaming persisted key `isRegionSpecificExpanded` → `isRegionHeartsExpanded` (optional follow-up; would migrate `persistenceUtils`).

---

## Solution

### Phase 1 — Config-driven anchor kind

#### 1.1 Type and config table

**New file:** `src/components/regionAnchor/regionAnchorConfig.ts`

```ts
export type RegionAnchorKind = 'heart' | 'nerve'

export type RegionAnchorConfig = {
  kind: RegionAnchorKind
  label: string                    // "heart" | "nerve"
  labelPlural: string              // "hearts" | "nerves"
  title: string                    // "Region Hearts"
  icon: LucideIcon                 // Heart | Activity
  csvStructure: string             // REGION_HEART_CSV_STRUCTURE | REGION_NERVE_CSV_STRUCTURE
  getAnchor: (r: Region) => AnchorPoint | null | undefined
  // ... callbacks wired from useRegions / useMapCanvas
}
```

Build two constants: `HEART_ANCHOR_CONFIG`, `NERVE_ANCHOR_CONFIG`. All user-visible strings live here (import blurb, button labels, toast fragments, empty states, delete label).

#### 1.2 Bind region APIs in AdvancedPanel

Pass into config (or into section props) closures from context:

| Config field | Heart | Nerve |
|--------------|-------|-------|
| `getAnchor` | `r => r.centerPoint` | `r => r.nervePoint` |
| `setAnchor` | `setCustomCenterPoint` | `setCustomNervePoint` |
| `updateX/Y/Z` | `updateRegionHeartX/Y/Z` | `updateRegionNerveX/Y/Z` |
| `importCsv` | `importHeartsFromCSV` | `importNervesFromCSV` |
| `buildExportCsv` | `buildRegionHeartsVillageFormatCSV` | `buildRegionNervesVillageFormatCSV` |
| `isPlacing` | `mapCanvas.isSettingCenterPoint` | `mapCanvas.isSettingNervePoint` |
| `placingRegionId` | `mapCanvas.centerPointRegionId` | `mapCanvas.nervePointRegionId` |
| `startPlacing` | `startSettingCenterPoint` | `startSettingNervePoint` |
| `stopPlacing` | `stopSettingCenterPoint` | `stopSettingNervePoint` |
| `exportFilenameSuffix` | `region-hearts` | `region-nerves` |
| `persistenceExpandedKey` | `isRegionSpecificExpanded` | `isRegionNervesExpanded` |

Keep persistence key names unchanged for saved panel state.

---

### Phase 2 — `RegionAnchorSection` component

**New file:** `src/components/regionAnchor/RegionAnchorSection.tsx`

**Props (sketch):**

```ts
type RegionAnchorSectionProps = {
  config: RegionAnchorConfig
  expanded: boolean
  onToggleExpanded: () => void
  availableRegions: Region[]
  allRegions: Region[]
  selectedRegionId: string | null
  seed: string | undefined
  worldName: string
  toast: ToastApi
}
```

**Renders (single implementation):**

1. Accordion header (icon + title + chevron) — same classes as today.
2. When expanded:
   - Import CSV block (hidden file input, error banner, viridian button).
   - Placed anchors collapsible list → map regions with `getAnchor != null` → `SubregionListRow`.
   - Copy names + Export CSV footer actions.
   - Selected-region placement UI (Set location / saffron “click map” banner / Cancel).
   - “Select a region…” empty state when none selected.
   - “Copy all {kind} TPs” when any anchor exists (`buildBulkAnchorTpText`).
   - Summary count line.

**Local state** (per section instance via `useRegionAnchorSectionState(kind)` hook or internal `useState`):

- `isImporting`, `importError`
- `editingX`, `editingY`, `editingZ`
- `expandedList` (placed list open)
- `pendingDelete` (replaces separate heart/nerve pending state)
- `csvFileInputRef`, `listItemRefs`

**Delete confirmation:** Either one `DeleteSubregionModal` inside the section (controlled by `pendingDelete`) or lift a single modal in `AdvancedPanel` that reads `pendingDelete.kind` — prefer **modal inside section** to keep AdvancedPanel thin.

**Scroll-into-view:** One `useEffect` in the section, keyed on `selectedRegionId`, `expanded`, `getAnchor(selected)`.

---

### Phase 3 — Utilities and small cleanups

#### Move TP helpers

Move from `AdvancedPanel.tsx` to `src/utils/regionAnchorUtils.ts` (same module planned in move/split bug spec, or a UI-focused `anchorClipboardUtils.ts`):

- `formatMinecraftTpCommand`
- `buildBulkAnchorTpText`

Import from both `RegionAnchorSection` and anywhere else needed.

#### Use `formatMinecraftTpCommand` in `SubregionListRow` callbacks

Replace duplicated:

```ts
const tpCommand = `/minecraft:tp @s ${target.x} ${y} ${target.z}`
```

with `formatMinecraftTpCommand({ x: target.x, z: target.z, y: target.y })` passed from section `onCopyTp`.

#### Shared CSV import helper

**New:** `src/utils/regionAnchorImport.ts` (or method on config)

```ts
async function importRegionAnchorCsv(
  file: File,
  importFn: (text: string) => { regionsUpdated: number; orphaned: number; heartRows?: number; nerveRows?: number },
  rowKey: 'heartRows' | 'nerveRows',
  emptyToast: string
): Promise<{ ok: boolean; error?: string }>
```

`handleHeartImport` / `handleNerveImport` become thin wrappers or disappear.

---

### Phase 4 — Wire AdvancedPanel

Replace blocks:

```tsx
{/* Region Hearts */} ... ~260 lines ...
{/* Region Nerves */} ... ~260 lines ...
```

With:

```tsx
<RegionAnchorSection
  config={HEART_ANCHOR_CONFIG}
  expanded={isRegionSpecificExpanded}
  onToggleExpanded={() => setIsRegionSpecificExpanded(v => !v)}
  ...
/>
<RegionAnchorSection
  config={NERVE_ANCHOR_CONFIG}
  expanded={isRegionNervesExpanded}
  onToggleExpanded={() => setIsRegionNervesExpanded(v => !v)}
  ...
/>
```

Remove duplicate refs, state, handlers, modals, and effects from `AdvancedPanel`.

**Optional:** Extract `AdvancedPanelSection` wrapper (accordion chrome only) if other sections later want the same header pattern — **not required** for this spec.

---

## File layout (target)

```
src/components/regionAnchor/
  regionAnchorConfig.ts      # HEART_ANCHOR_CONFIG, NERVE_ANCHOR_CONFIG
  RegionAnchorSection.tsx    # UI
  useRegionAnchorSection.ts  # optional: local state + import + scroll effect
  regionAnchorConfig.test.ts # kind-specific strings / getAnchor keys

src/utils/
  regionAnchorUtils.ts       # formatMinecraftTpCommand, buildBulkAnchorTpText
  regionAnchorImport.ts      # shared CSV import flow (optional)
```

---

## Acceptance criteria

- [ ] Hearts and Nerves accordions look and behave the same as before (manual checklist below).
- [ ] `saveAdvancedPanelSectionsState` still persists `isRegionSpecificExpanded` and `isRegionNervesExpanded`.
- [ ] CSV import/export filenames and structure columns unchanged (`region_heart` / `region_nerve`).
- [ ] Map placement modes unchanged (only one placement mode active per kind).
- [ ] Bulk and per-row TP commands identical to pre-refactor (use shared formatter).
- [ ] `npm run test:run` and `npm run build` pass.
- [ ] No new duplication between heart and nerve JSX in `AdvancedPanel.tsx` (only two `<RegionAnchorSection />` lines plus configs).

---

## Test plan

### Unit

- `regionAnchorConfig.test.ts`: both configs define required keys; `getAnchor` reads correct `Region` field; CSV structure constants match `villageUtils`.
- `regionAnchorUtils.test.ts`: TP formatting (optional if moved from inline tests).

### Manual regression

1. **Hearts:** Import CSV, place on map, edit X/Y/Z in list, copy row TP, copy all heart TPs, export CSV, remove heart, summary text.
2. **Nerves:** Same flow with nerve labels and `region_nerve` CSV.
3. **Both on one region:** Heart and nerve lists show different coords; bulk copy in each panel copies only that anchor type.
4. **Persistence:** Expand/collapse each accordion, reload app — state restored.
5. **Selection highlight:** Select region on map — corresponding row scrolls into view in open list.

---

## Implementation checklist

- [ ] Add `regionAnchorConfig.ts` with heart + nerve configs
- [ ] Move TP helpers to `regionAnchorUtils.ts`
- [ ] Implement `RegionAnchorSection` (+ optional hook)
- [ ] Replace duplicated JSX in `AdvancedPanel.tsx`
- [ ] Remove dead heart/nerve state, refs, handlers, duplicate modals
- [ ] Add config unit test
- [ ] Manual regression (both kinds)
- [ ] Run `npm run test:run` and `npm run build`

---

## Incremental delivery (recommended)

| Step | Deliverable | Risk |
|------|-------------|------|
| A | Move TP helpers + use in existing duplicate `onCopyTp` only | Very low |
| B | Add `RegionAnchorSection` + nerve panel behind it; hearts still inline | Low |
| C | Switch hearts to `RegionAnchorSection`; delete heart duplicate | Low |
| D | Shared CSV import helper | Low |

Ship A–C as one PR if preferred; D can be same PR or follow-up.

---

## References

- PR #12 review item 4: [region-forge#12](https://github.com/Biggsen/region-forge/pull/12)
- Current UI: [`AdvancedPanel.tsx`](../../src/components/AdvancedPanel.tsx) lines ~2255–2773 (Hearts + Nerves)
- List row: `SubregionListRow` in same file
- Domain: [`useRegions.ts`](../../src/hooks/useRegions.ts) heart/nerve CRUD; [`useMapCanvas.ts`](../../src/hooks/useMapCanvas.ts) placement flags
- CSV: [`villageUtils.ts`](../../src/utils/villageUtils.ts) — `REGION_HEART_CSV_STRUCTURE`, `REGION_NERVE_CSV_STRUCTURE`, build/export helpers
- Related bug spec (orthogonal): [`tasks/bugs/region-anchor-move-split-spec.md`](../bugs/region-anchor-move-split-spec.md)
