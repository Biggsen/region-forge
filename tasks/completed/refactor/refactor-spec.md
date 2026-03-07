# MC Region Maker – Refactor Specification

**Status:** ✅ **Completed** (Phases 1, 2, 3.1, 3.2, 4.1). Optional 3.3 (context split) deferred.

**Done:** Testing setup; dimension/spawn/advanced/EditMode helpers; ExportPanel settings loader; RegionPanel context usage; useRegions split (useRegionHighlight, useRegionEditMode, useRegionDrawing); useProjectImport + AppHeader; import path verification.

---

## Overview

This spec describes refactoring opportunities identified from a codebase review. Work is grouped into **quick wins**, **medium effort**, and **larger refactors**. Implement incrementally; later items can depend on earlier ones.

## Goals

1. **Single source of truth** – Remove repeated logic (dimension, spawn data, advanced flag, EditMode resets).
2. **Smaller, focused modules** – Split oversized hooks and components.
3. **Easier maintenance** – Shared helpers and constants so behavior changes in one place.
4. **Optional performance** – Reduce re-renders via context split if needed.

---

## Testing setup (prerequisite)

A minimal test pipeline is in place so refactors can be validated without manual checks.

**Stack:** Vitest, jsdom, React Testing Library, jest-dom matchers.

**Commands:**
- `npm run test` – watch mode
- `npm run test:run` – single run (e.g. for CI)

**Where tests live:** Next to the code they test. For example:
- `src/utils/dimensionUtils.ts` → `src/utils/dimensionUtils.test.ts`
- `src/hooks/useAdvancedFeatures.ts` → `src/hooks/useAdvancedFeatures.test.ts`

**What to test as you refactor:**
- **Phase 1 helpers** – Unit test every new or moved pure function: `getValidDimension`, `getSpawnExportData`, `DEFAULT_EDIT_MODE` / editMode factories. No React, no mocks, fast.
- **Hooks** – When adding or changing hooks (e.g. `useAdvancedFeatures`, later `useProjectImport`), add tests using `renderHook` from `@testing-library/react`. Wrap in providers if the hook uses context.
- **Components** – Optional. Add component or integration tests only where they add clear value (e.g. critical save/load or export flows). Prefer testing the underlying hooks and utils first.

**Setup files:**
- `vite.config.ts` – `test` block: `globals: true`, `environment: 'jsdom'`, `setupFiles: './src/test/setup.ts'`.
- `src/test/setup.ts` – React Testing Library `cleanup` and jest-dom matchers.
- `src/vitest-env.d.ts` – Reference to Vitest globals for TypeScript.

Run `npm run test:run` after any refactor step to confirm nothing is broken.

---

## Phase 1: Quick wins

### 1.1 Dimension normalization

**Priority:** High  
**Effort:** Low  
**Impact:** Removes ~10 repeated expressions; one place to change dimension rules.

**Problem:**  
The same check appears in multiple files:

```ts
seedInfo.seedInfo.dimension === 'overworld' || seedInfo.seedInfo.dimension === 'nether' || seedInfo.seedInfo.dimension === 'end'
  ? seedInfo.seedInfo.dimension
  : 'overworld'
```

**Solution:**

- Add type and helper (e.g. in `src/utils/dimensionUtils.ts` or extend `src/utils/constants.ts`):
  - `export type Dimension = 'overworld' | 'nether' | 'end'`
  - `export function getValidDimension(value: string | undefined): Dimension`
- Optionally expose normalized dimension from `useSeedInfo()` (e.g. `dimension: Dimension`) so consumers don't need the helper.
- Replace every inline dimension normalization with the helper or `seedInfo.dimension`.

**Files to update:**

- `src/context/AppContext.tsx`
- `src/components/MainApp.tsx` (2 places)
- `src/components/ExportPanel.tsx` (3 places)
- `src/components/RegionPanel.tsx` (2 places)

---

### 1.2 Spawn export data helper

**Priority:** High  
**Effort:** Low  
**Impact:** Single place for "spawn data for export/save" shape; no duplicated object construction.

**Problem:**  
The same object is built in `MainApp.tsx` and `ExportPanel.tsx`:

```ts
spawn.spawnState.coordinates ? {
  x: spawn.spawnState.coordinates.x,
  z: spawn.spawnState.coordinates.z,
  y: spawn.spawnState.coordinates.y,
  radius: spawn.spawnState.radius
} : null
```

**Solution:**

- Add a small util or helper on spawn state, e.g.:
  - `getSpawnExportData(spawnState: SpawnState): { x: number; z: number; y: number; radius: number } | null`
- Place in `src/utils/` (e.g. a new small file or existing spawn-related util) or expose from `useSpawn` as a getter.
- Use this in MainApp (save flow) and ExportPanel (export flows).

**Files to update:**

- `src/components/MainApp.tsx`
- `src/components/ExportPanel.tsx`
- New or existing util file; optionally `src/hooks/useSpawn.ts` if exposing there.

---

### 1.3 Advanced-features URL flag

**Priority:** High  
**Effort:** Low  
**Impact:** One place to read and evolve the "advanced" query param; consistent behavior.

**Problem:**  
`urlParams.get('advanced') === 'true'` (or equivalent) appears in:

- `MainApp.tsx` (tab visibility)
- `ExportPanel.tsx`
- `MapDisplayControls.tsx`
- `RegionDetailsView.tsx`
- `MapCanvas.tsx`

**Solution:**

- Add `useAdvancedFeatures(): boolean` (or `getShowAdvanced(): boolean` reading `window.location.search`) in `src/hooks/` or `src/utils/`.
- Replace all inline checks with this hook or util.

**Files to update:**

- `src/components/MainApp.tsx`
- `src/components/ExportPanel.tsx`
- `src/components/MapDisplayControls.tsx`
- `src/components/RegionDetailsView.tsx`
- `src/components/MapCanvas.tsx`

---

### 1.4 EditMode default and reset factory

**Priority:** High  
**Effort:** Low  
**Impact:** One definition of "idle" and "reset" EditMode; easier to add new edit flags later.

**Problem:**  
The full "reset" `EditMode` object is inlined many times in `useRegions.ts` (initial state + multiple `setEditMode({ ... })` calls). Two variants exist: full reset and "move region" / "split region" partial sets.

**Solution:**

- In `src/types.ts` or next to `EditMode` (e.g. `src/utils/editModeUtils.ts`), add:
  - `DEFAULT_EDIT_MODE: EditMode` (all editing off, null ids, empty `splitPoints`).
  - Optional: `editModeForMove(regionId, startX, startZ, originalPoints): EditMode` and `editModeForSplit(regionId): EditMode` for the two partial variants.
- In `useRegions.ts`, use `DEFAULT_EDIT_MODE` for initial state and all "reset" cases; use the factories (if added) for move/split entry.
- Remove duplicated inline objects.

**Files to update:**

- `src/types.ts` (or new `src/utils/editModeUtils.ts`)
- `src/hooks/useRegions.ts` (all places that set a full or partial EditMode)

---

## Phase 2: Medium effort

### 2.1 ExportPanel settings loader

**Priority:** Medium  
**Effort:** Low  
**Impact:** One code path for "load export settings into state"; less drift when adding new settings.

**Problem:**  
Initial load and `loadSettings` in `ExportPanel` both call `loadExportSettings()` and then the same sequence of setters. Adding a new export setting requires updating both blocks.

**Solution:**

- Introduce a single function that:
  - Calls `loadExportSettings()`.
  - Applies saved values to state (either one state setter for a settings object or a fixed mapping to individual setters).
- Use this in the mount effect and in `loadSettings` (and any other "reload settings" path).

**Files to update:**

- `src/components/ExportPanel.tsx`

---

### 2.2 RegionPanel useAppContext usage

**Priority:** Low  
**Effort:** Low  
**Impact:** Clearer intent; easier to refactor context later.

**Problem:**  
RegionPanel uses `useAppContext()` and then `useAppContext().mapCanvas` and `useAppContext().mapState` for further destructuring.

**Solution:**

- Use a single `useAppContext()` call and destructure once (e.g. `const { regions, mapState, mapCanvas, ... } = useAppContext()`), then use `mapCanvas.*` and `mapState.*` from that.

**Files to update:**

- `src/components/RegionPanel.tsx`

---

## Phase 3: Larger refactors

### 3.1 Split useRegions

**Priority:** Medium  
**Effort:** High  
**Impact:** Smaller, testable units; clearer responsibilities; easier to change drawing vs edit vs highlight behavior.

**Problem:**  
`useRegions` is very large (~838 lines) and handles: region list, selection, hover, drawing, edit mode, highlight mode, isolation, and all region/edit/split/warp logic.

**Solution:**

- **Extract by concern:**
  - `useRegionDrawing` – drawing state and add-point/finish/cancel.
  - `useRegionEditMode` – EditMode state and transitions (use `DEFAULT_EDIT_MODE` and factories from 1.4).
  - `useRegionHighlight` – HighlightMode state and toggles.
  - Keep in `useRegions`: region list, selection, hover, persistence, and high-level actions that delegate to the above (or merge their state).
- **Move pure logic to utils:** Any logic that computes "next state" from "current state + action" without React can live in a util or reducer; the hook only calls it and updates state. This improves testability and keeps hooks thin.

**Files to create/update:**

- New: `src/hooks/useRegionDrawing.ts`, `useRegionEditMode.ts`, `useRegionHighlight.ts` (or similar names).
- New or existing: `src/utils/` helpers for edit-mode and drawing transitions.
- `src/hooks/useRegions.ts` – compose the new hooks and retain list/selection/persistence and public API.
- Any component that currently depends only on a subset of `useRegions` can later be wired to the specific hook if desired.

**Dependency:** Phase 1.4 (EditMode default/factory) should be done first.

---

### 3.2 MainApp and project import

**Priority:** Medium  
**Effort:** Medium  
**Impact:** Shorter MainApp; import logic reusable and testable; clearer separation of UI and data.

**Problem:**  
`MainApp.tsx` is 428+ lines. `TabNavigation` embeds load/save, file input, and a long import handler. The import handler is a large block with several branches (terrain/biome/legacy image, map state, regions, world name, spawn, dimension, image details, export settings).

**Solution:**

- **Extract project import into a hook**, e.g. `useProjectImport({ regions, mapState, worldName, spawn, seedInfo, toast, ... })` that returns:
  - `handleFileImport(event)`
  - `fileInputRef`
  - Optionally `isImporting` if you add loading state.
- The hook should perform parsing, validation, and all state updates (map, regions, world name, spawn, seed/dimension, image details, export settings, markAsSaved). MainApp only wires the file input to `handleFileImport` and passes dependencies.
- **Extract tab bar + Load/Save UI** into a presentational component that receives:
  - `activeTab`, `onTabChange`, `tabs`
  - `onLoad`, `onSave`, `hasChanged`, `fileInputRef`, `handleFileImport`
  - Any other props needed for the header (e.g. logo, Discord link).  
  MainApp stays as the composition root: provider, layout, and state/callbacks for the new component and import hook.

**Files to create/update:**

- New: `src/hooks/useProjectImport.ts` (or similar).
- New: e.g. `src/components/AppHeader.tsx` or `TabBarWithSave.tsx` (name TBD).
- `src/components/MainApp.tsx` – use the hook and the new header component; remove inlined import and tab UI logic.

---

### 3.3 Optional: Split AppContext

**Priority:** Low  
**Effort:** Medium  
**Impact:** Fewer re-renders when only map state or only regions change; better scalability.

**Problem:**  
All hook return values are in one context. Any change to any slice (regions, mapState, worldName, spawn, mapCanvas, customMarkers, seedInfo, toast, etc.) re-renders every consumer of `useAppContext()`.

**Solution:**

- Split into 2–3 contexts, e.g.:
  - **MapContext** – mapState, mapCanvas, effective image (or derivations).
  - **RegionsContext** – regions, selection, drawing, edit/highlight (or the split hooks from 3.1).
  - **AppUIContext** – worldName, spawn, seedInfo, toast, biomeLabelVisibility, regionFillOpacity, etc.
- Provide them in a single provider component that composes the three. Update consumers to use the appropriate context (and optionally multiple contexts where needed).
- Ensure no circular dependency between contexts; keep "read-only" cross-context usage where needed (e.g. regions reading map scale for drawing).

**Files to create/update:**

- New: `src/context/MapContext.tsx`, `RegionsContext.tsx`, `AppUIContext.tsx` (or similar names).
- `src/context/AppContext.tsx` – either re-export a composed provider or replace with the new providers.
- All components that use `useAppContext()` – switch to the appropriate context hook(s).

**When to do this:** After Phase 1 and 2 are stable; only if you observe unnecessary re-renders or plan to grow the app state further.

---

## Phase 4: Hygiene

### 4.1 Import path consistency

**Priority:** Low  
**Effort:** Low  
**Impact:** Consistent tooling and fewer "duplicate file" confusions on Windows.

**Problem:**  
Glob/search shows both `src/components/...` and `src\components\...`. Imports should use a single style (e.g. forward slashes) so there's no ambiguity and no accidental duplicate files.

**Solution:**

- Ensure all imports use forward slashes.
- Confirm there are no real duplicate files (e.g. two `ExportPanel.tsx` or two `useRegions.ts` in different casing/paths). Remove or merge any duplicates.

**Files to check:**

- All `src/**/*.ts`, `src/**/*.tsx` import statements.
- Repository file list for duplicates.

**Done:** Verified; all imports use forward slashes (relative paths like `'../context/AppContext'`). No duplicate files found—single file per path under `src/`. The `src\...` vs `src/...` in tool output is Windows path display only.

---

## Implementation order (recommended)

1. **1.1** Dimension normalization  
2. **1.2** Spawn export data helper  
3. **1.3** Advanced-features URL flag  
4. **1.4** EditMode default and reset factory  
5. **2.1** ExportPanel settings loader  
6. **2.2** RegionPanel useAppContext usage  
7. **3.1** Split useRegions (after 1.4)  
8. **3.2** MainApp and project import extraction  
9. **3.3** Optional context split  
10. **4.1** Import path consistency  

---

## Out of scope (for this spec)

- New features or product changes.
- Mandatory coverage targets or full-suite E2E tests (targeted unit/hook tests for refactored code are in scope; see Testing setup above).
- API or data format changes beyond internal helpers and types.

---

## References

- Codebase review (refactor opportunities) – March 2025.
- Existing patterns: `src/utils/constants.ts`, `src/utils/imageValidation.ts`, `tasks/completed/low-hanging-fruit-refactor-spec.md`.
