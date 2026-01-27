# Remove Redundant WorldType Setting Specification

## Overview
This specification outlines the removal of the redundant `worldType` toggle from the Advanced Panel. The `dimension` setting (selected when creating/loading maps) is the explicit user choice and should be the single source of truth. The `worldType` toggle creates confusion and allows conflicting states (e.g., nether map with overworld names).

**Prerequisites**: None - this is a cleanup refactor that should be done before completing nether support.

## Problem Statement

The application currently has a redundant setting that creates confusion:

1. **`dimension`** (`useSeedInfo` hook)
   - Type: `'overworld' | 'nether' | 'end'` (end is disabled)
   - Storage: Part of `seedInfo` object in `'mc-region-maker-world-seed'`
   - UI: SeedInfoHeading, MapLoaderControls World Details section
   - **Purpose**: Explicit user choice when creating/loading a map
   - **This is the correct source of truth**

2. **`worldType`** (`useWorldType` hook) - **REDUNDANT**
   - Type: `'overworld' | 'nether'` (2 values)
   - Storage: `localStorage` key `'mc-region-maker-world-type'`
   - UI: Advanced Panel toggle buttons
   - **Purpose**: Supposedly controls name generation style, YAML generation, etc.
   - **Problem**: This is the same thing as dimension, but can be set independently, causing conflicts

### Issues with Current Implementation

1. **Redundant Setting**: `worldType` duplicates what `dimension` already represents
2. **Conflicting States**: User can select "nether" dimension but toggle worldType to "overworld", causing:
   - Nether maps with overworld-style names
   - Nether maps with overworld export behavior
   - Confusion about which setting controls what
3. **No Legitimate Use Case**: There's no scenario where dimension and worldType should differ
4. **Code Complexity**: Many places use `worldType` with fallback to `dimension`, or vice versa
5. **Storage Duplication**: Same information stored in two places
6. **Export Format Confusion**: Export files contain both `worldType` and `dimension` fields

## Goals

1. **Remove Redundant Setting**: Delete the `worldType` toggle from Advanced Panel
2. **Use Dimension as Single Source of Truth**: All code should use `dimension` from `seedInfo`
3. **Simplify Codebase**: Remove `useWorldType` hook, remove all worldType references
4. **Maintain Backwards Compatibility**: Migrate existing `worldType` localStorage data to `dimension` if needed
5. **Clean Foundation**: After this refactor, nether support can be implemented cleanly

## Solution

### Core Principle
**`dimension` is the explicit user choice and should drive all behavior.** There is no need for a separate `worldType` setting.

### Removal Strategy

1. **Remove UI**: Delete the "World Type" toggle section from Advanced Panel
2. **Remove Hook**: Delete `useWorldType.ts` hook entirely
3. **Update Context**: Remove `worldType` from AppContext
4. **Update All References**: Replace all `worldType.worldType` with `seedInfo.seedInfo.dimension` (with appropriate fallbacks)
5. **Update Function Signatures**: Change functions that accept `worldType` parameter to accept `dimension` instead
6. **Migration**: On app load, if `worldType` exists in localStorage but `dimension` doesn't, copy it to `dimension`

### Type Changes

Functions currently accepting `worldType: 'overworld' | 'nether'` should accept `dimension: 'overworld' | 'nether' | 'end'` instead. For functions that only support overworld/nether (not end), filter out 'end' or default to 'overworld'.

## Implementation Plan

### Phase 1: Remove UI and Hook

#### `src/components/AdvancedPanel.tsx`
**Changes:**
- Remove the entire "World Type" toggle section (lines ~148-190)
- Remove `isWorldTypeExpanded` state
- Remove `worldType` from destructured context
- Update spawn visibility checks to use `seedInfo.seedInfo.dimension` instead of `worldType.worldType`

#### `src/hooks/useWorldType.ts`
**Changes:**
- Delete this file entirely

#### `src/context/AppContext.tsx`
**Changes:**
- Remove `useWorldType` import
- Remove `worldType` from context type
- Remove `worldType` from provider value
- Update `useRegions` call to use `seedInfo.seedInfo.dimension` instead of `worldType.worldType`

### Phase 2: Update All References

#### `src/components/ExportPanel.tsx`
**Changes:**
- Replace `worldType.worldType` with `seedInfo.seedInfo.dimension` (with fallback to 'overworld')
- Update spawn region checks: `seedInfo.seedInfo.dimension !== 'nether'`
- Update export function calls to pass `dimension` instead of `worldType`

#### `src/components/MainApp.tsx`
**Changes:**
- Replace `worldType.worldType` with `seedInfo.seedInfo.dimension`
- Update export calls to use `dimension`
- Update import logic: if old export has `worldType`, copy to `dimension` if missing
- Update `useDataChanged` to use `dimension` instead of `worldType`

#### `src/components/RegionPanel.tsx`
**Changes:**
- Remove `worldType` from context destructuring
- Update `RegionCreationForm` to pass `seedInfo.seedInfo.dimension` (with fallback)
- Update `RegionDetailsView` to pass `seedInfo.seedInfo.dimension` (with fallback)

#### `src/components/SeedInfoHeading.tsx`
**Changes:**
- Remove `worldType` from context destructuring
- Remove fallback logic: `seedInfo.seedInfo.dimension || worldType.worldType` → just `seedInfo.seedInfo.dimension`

#### `src/components/RegionCreationForm.tsx`
**Changes:**
- Rename prop from `worldType` to `dimension` (or keep name but update usage)
- Update to accept `'overworld' | 'nether' | 'end'` but filter 'end' to 'overworld' for name generation

#### `src/components/RegionDetailsView.tsx`
**Changes:**
- Rename prop from `worldType` to `dimension`
- Update name generation to use `dimension`

### Phase 3: Update Utility Functions

#### `src/utils/nameGenerator.ts`
**Changes:**
- `generateRegionName` should accept `dimension: 'overworld' | 'nether' | 'end'`
- Filter 'end' to 'overworld' for now (end names not implemented)

#### `src/utils/exportUtils.ts`
**Changes:**
- Update `exportRegionsYAML` to accept `dimension` instead of `worldType`
- Update `exportRegionsMetaYAML` to accept `dimension` instead of `worldType`
- Update `exportCompleteMap` to remove `worldType` field, keep only `dimension`
- Update `MapExportData` interface: remove `worldType`, keep `dimension`

#### `src/utils/polygonUtils.ts`
**Changes:**
- Update `generateRegionYAML` to accept `dimension` instead of `worldType`
- Update all related functions

#### `src/utils/villageUtils.ts`
**Changes:**
- Update functions to accept `dimension` instead of `worldType`

#### `src/hooks/useRegions.ts`
**Changes:**
- Update hook signature to accept `dimension: 'overworld' | 'nether' | 'end'` instead of `worldType`
- Filter 'end' to 'overworld' for now

#### `src/hooks/useDataChanged.ts`
**Changes:**
- Update to use `dimension` instead of `worldType`

### Phase 4: Migration Logic

#### `src/hooks/useSeedInfo.ts`
**Changes:**
- Add migration on mount: if `worldType` exists in localStorage but `dimension` doesn't, copy it
- If `worldType` is 'overworld' or 'nether', set `dimension` to that value
- Clear old `worldType` from localStorage after migration

#### `src/components/MainApp.tsx` (Import Logic)
**Changes:**
- When importing old export files with `worldType` but no `dimension`:
  - Copy `worldType` → `dimension`
  - If `worldType` is 'end', default to 'overworld'

### Phase 5: Cleanup

- Remove all references to `worldType` from codebase
- Remove `worldType` from export format
- Update comments/documentation
- Remove unused imports

## Migration Plan

### Data Migration (on app load)

1. Check if `worldType` exists in localStorage (`'mc-region-maker-world-type'`)
2. Check if `dimension` exists in `seedInfo`
3. If `worldType` exists and `dimension` doesn't:
   - If `worldType` is 'overworld' or 'nether': Copy to `seedInfo.dimension`
   - If `worldType` is invalid: Default to 'overworld'
4. After migration, remove `worldType` from localStorage
5. Save updated `seedInfo` with `dimension`

### Export File Migration

Legacy export files may contain `worldType`:
- On import, if `dimension` is missing but `worldType` exists:
  - Copy `worldType` → `dimension`
  - If `worldType` is 'end', default to 'overworld'
- If both exist, prefer `dimension` (it's the newer, correct field)

## Implementation Checklist

### Phase 1: Remove UI and Hook
- [x] Remove "World Type" toggle section from `AdvancedPanel.tsx`
- [x] Remove `isWorldTypeExpanded` state
- [x] Update spawn visibility checks in `AdvancedPanel.tsx` to use `dimension`
- [x] Delete `src/hooks/useWorldType.ts`
- [x] Remove `worldType` from `AppContext.tsx`
- [x] Update `useRegions` call in context to use `dimension`

### Phase 2: Update Component References
- [x] Update `ExportPanel.tsx` to use `dimension` instead of `worldType`
- [x] Update `MainApp.tsx` to use `dimension` instead of `worldType`
- [x] Update `RegionPanel.tsx` to use `dimension` instead of `worldType`
- [x] Update `SeedInfoHeading.tsx` to remove `worldType` fallback
- [x] Update `RegionCreationForm.tsx` prop name/usage
- [x] Update `RegionDetailsView.tsx` prop name/usage

### Phase 3: Update Utility Functions
- [x] Update `nameGenerator.ts` to accept `dimension`
- [x] Update `exportUtils.ts` to accept `dimension` instead of `worldType`
- [x] Update `polygonUtils.ts` to accept `dimension`
- [x] Update `villageUtils.ts` to accept `dimension`
- [x] Update `useRegions.ts` to accept `dimension`
- [x] Update `useDataChanged.ts` to use `dimension`

### Phase 4: Migration
- [x] Add migration logic to `useSeedInfo.ts`
- [x] Add migration logic to import in `MainApp.tsx`
- [x] Test migration from old localStorage format
- [x] Test migration from old export files

### Phase 5: Cleanup
- [x] Remove all `worldType` references
- [x] Remove `worldType` from export format
- [x] Update documentation
- [x] Verify no regressions

## Testing Requirements

### Functional Tests
- [ ] Dimension selection works correctly everywhere
- [ ] Name generation uses correct dimension
- [ ] YAML export uses correct dimension
- [ ] Spawn visibility works correctly (hidden for nether)
- [ ] Export/import preserves dimension correctly
- [ ] Migration from old format works

### Edge Cases
- [ ] Migration from old localStorage with `worldType` only
- [ ] Migration from old export file with `worldType` only
- [ ] Migration from export file with both `worldType` and `dimension` (prefer dimension)
- [ ] Empty/null dimension handling (default to 'overworld')
- [ ] Switching between overworld and nether dimensions

## Backwards Compatibility

### Export Files
- **Old format**: May contain `worldType` field
- **New format**: Contains only `dimension` field
- **Migration**: Import logic copies `worldType` → `dimension` if needed

### localStorage
- **Old format**: `worldType` in separate localStorage key
- **New format**: `dimension` in `seedInfo` object
- **Migration**: Automatic on first load after update

## Success Criteria

- [x] `worldType` toggle removed from Advanced Panel
- [x] `useWorldType` hook deleted
- [x] All code uses `dimension` as single source of truth
- [x] No `worldType` references remain in codebase (except for migration logic)
- [x] Migration handles old data correctly
- [x] Export/import maintains compatibility
- [x] No regressions in functionality
- [x] Codebase is simpler and clearer

## Completion Summary

**Completed:** January 27, 2026

**Implementation Notes:**
- All phases completed successfully
- Migration logic implemented for both localStorage and export files
- Backwards compatibility maintained with automatic migration
- Bug fix: Corrected `exportCompleteMap` parameter order issue (worldSize/imageSize were being passed incorrectly due to duplicate dimension parameter)

**Files Changed:**
- 16 files modified
- 1 file deleted (`src/hooks/useWorldType.ts`)
- Net code reduction: 132 insertions, 161 deletions

**Commit:** `01f7b39` - "refactor: remove redundant worldType setting, use dimension as single source of truth"

## Dependencies

- **None** - This is a cleanup refactor that should be done before nether completion

## Next Steps

After completing this spec:
1. Proceed to `nether-completion-spec.md` to complete nether support (will be much simpler now)
2. Then proceed to `end-dimension-addition-spec.md` to add End dimension support
