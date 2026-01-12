# Overworld/Nether Dimension Unification Specification

## Overview
This specification outlines the refactoring to unify the `worldType` and `dimension` concepts for Overworld and Nether dimensions. This will simplify the codebase and eliminate confusion where these two similar concepts are used inconsistently.

**Prerequisites**: Complete `nether-completion-spec.md` first to ensure Nether is fully functional before unification.

## Problem Statement

Currently, the application has two separate but overlapping concepts:

1. **`worldType`** (`useWorldType` hook)
   - Type: `'overworld' | 'nether'` (2 values)
   - Storage: `localStorage` key `'mc-region-maker-world-type'`
   - Used for: Name generation style, YAML generation, achievements/events
   - UI: Advanced Panel toggle

2. **`dimension`** (`useSeedInfo` hook)
   - Type: `'overworld' | 'nether' | 'end'` (3 values, includes 'end' but it's disabled)
   - Storage: Part of `seedInfo` object in `'mc-region-maker-world-seed'`
   - Used for: Map generation from seed, display in Regions tab
   - UI: SeedInfoHeading, MapLoaderControls World Details section

### Issues with Current Implementation

1. **Conceptual Duplication**: Both represent the same thing (Minecraft dimension)
2. **Type Mismatch**: worldType supports 2 values, dimension supports 3 (but End is disabled)
3. **Confused Fallback Logic**: `SeedInfoHeading.tsx` uses `worldType` as fallback for `dimension` display, mixing concepts
4. **Multiple Storage Locations**: Stored in different localStorage keys
5. **Inconsistent Usage**: Some places use worldType, others use dimension, sometimes both
6. **Export Format Confusion**: Export files contain both `worldType` and `dimension` fields

## Goals

1. **Unify Concepts**: Single source of truth for dimension/world type (for Overworld and Nether)
2. **Consolidate Storage**: Single localStorage key for dimension information
3. **Update All References**: Replace all dimension references with worldType (for Overworld and Nether)
4. **Maintain Backwards Compatibility**: Handle migration from old data format
5. **Simplify Codebase**: Remove duplicate logic and confusion
6. **Note**: End dimension will be added in a separate spec after unification is complete

## Solution

### Unified Type Definition

Replace both concepts with a single `worldType` that supports Overworld and Nether:

```typescript
export type WorldType = 'overworld' | 'nether'
```

**Note**: End will be added later in `end-dimension-addition-spec.md`

### Storage Strategy

- **Primary Storage**: `'mc-region-maker-world-type'` localStorage key
- **Remove**: `dimension` field from `seedInfo` object
- **Migration**: On app load, if `seedInfo.dimension` exists and `worldType` doesn't, migrate dimension → worldType
- **Handle End**: If old `dimension` is 'end', default to 'overworld' (End not yet supported)

### API Changes

#### `src/hooks/useWorldType.ts`
**Changes:**
- Type already supports `'overworld' | 'nether'` (no change needed)
- Update `toggleWorldType` to work correctly (currently only toggles between 2 values, which is fine)
- Ensure localStorage persistence works correctly

#### `src/hooks/useSeedInfo.ts`
**Changes:**
- Remove `dimension` from `SeedInfo` interface
- Keep only `seed?: string`
- Remove dimension from all `updateSeedInfo` calls
- Migration logic: Check for old dimension in seedInfo on mount, migrate to worldType
- If old dimension is 'end', default to 'overworld' and log warning

#### `src/components/SeedInfoHeading.tsx`
**Changes:**
- Remove dimension display/editing entirely
- Display only seed (dimension is now handled by worldType)
- Remove all dimension-related state and handlers
- Remove worldType fallback logic (no longer needed)

#### `src/components/MapLoaderControls.tsx`
**Changes:**
- Remove dimension dropdown from World Details section
- Use `worldType` from context instead of `seedInfo.dimension`
- Update `importDimension` state to use `worldType` from context
- Update dimension references in generate/import flows to use `worldType`
- Keep End option disabled (will be enabled in separate spec)

#### `src/components/AdvancedPanel.tsx`
**Changes:**
- No changes needed (already uses worldType correctly)
- Toggle buttons already work for overworld/nether

#### `src/utils/nameGenerator.ts`
**Changes:**
- Already supports `'overworld' | 'nether'` (no change needed)
- Will be updated to include 'end' in separate spec

#### `src/utils/polygonUtils.ts`
**Changes:**
- Update all functions accepting `worldType?: 'overworld' | 'nether'` to use `WorldType` type
- Ensure type consistency across all functions

#### `src/utils/exportUtils.ts`
**Changes:**
- Remove `dimension` from `MapExportData` interface
- Keep only `worldType` field (type: `'overworld' | 'nether'`)
- Update export/import logic to only use `worldType`
- Handle migration: If old export has `dimension`, migrate to `worldType`
- If old export has `dimension: 'end'`, default to 'overworld'

#### `src/components/MainApp.tsx`
**Changes:**
- Remove `seedInfo.seedInfo.dimension` from export calls
- Remove dimension restoration from import logic (use worldType only)
- Handle migration in import: if old data has dimension, migrate to worldType

#### `src/components/ImageImportHandler.tsx`
**Changes:**
- Remove dimension handling from router state
- Use worldType from context instead

#### `src/context/AppContext.tsx`
**Changes:**
- Update `useRegions(worldType.worldType)` to pass the full WorldType
- Ensure worldType is properly typed

#### Additional Files to Update

- `src/components/RegionCreationForm.tsx`: Update worldType type
- `src/components/RegionDetailsView.tsx`: Update worldType type
- `src/hooks/useDataChanged.ts`: Update worldType type
- `src/utils/villageUtils.ts`: Update worldType type
- `src/hooks/useRegions.ts`: Update worldType type

## Migration Plan

### Data Migration (on app load)

1. Check if `seedInfo.dimension` exists in localStorage
2. If exists and `worldType` doesn't exist or is default:
   - If `dimension` is 'overworld' or 'nether': Copy to `worldType`
   - If `dimension` is 'end': Default to 'overworld' and log warning (End not yet supported)
   - Remove `dimension` from `seedInfo` object
3. If both exist and differ:
   - Prefer `worldType` (more recent), log warning
   - Remove `dimension` from `seedInfo`
4. Update `seedInfo` storage to remove dimension

### Export File Migration

Legacy export files may contain both `worldType` and `dimension`:
- On import, prefer `worldType` if present
- If only `dimension` exists:
  - If 'overworld' or 'nether': Use it to set `worldType`
  - If 'end': Default to 'overworld' and log warning
- Remove `dimension` from import logic after migration period

## Implementation Checklist

### Phase 1: Update Type References
- [ ] Update all function signatures that accept `worldType?: 'overworld' | 'nether'` to use `WorldType` type
- [ ] Update `RegionCreationForm.tsx` worldType type
- [ ] Update `RegionDetailsView.tsx` worldType type
- [ ] Update `useDataChanged.ts` worldType type
- [ ] Update `villageUtils.ts` worldType type
- [ ] Update `useRegions.ts` worldType type
- [ ] Update `polygonUtils.ts` to use `WorldType` type
- [ ] Update `exportUtils.ts` to use `WorldType` type

### Phase 2: Remove dimension from seedInfo
- [ ] Remove `dimension` from `SeedInfo` interface in `useSeedInfo.ts`
- [ ] Remove dimension from `useSeedInfo` hook logic
- [ ] Update `SeedInfoHeading.tsx` to remove dimension UI
- [ ] Remove dimension from `MapLoaderControls.tsx` World Details section
- [ ] Update all `updateSeedInfo` calls to remove dimension

### Phase 3: Update Components to Use worldType
- [ ] Update `MapLoaderControls.tsx` to use `worldType` from context
- [ ] Update `MainApp.tsx` to use `worldType` instead of dimension
- [ ] Update `ImageImportHandler.tsx` to use `worldType` from context
- [ ] Remove dimension fallback logic from `SeedInfoHeading.tsx`

### Phase 4: Update Export/Import
- [ ] Remove `dimension` from `MapExportData` interface
- [ ] Update export logic to only use `worldType`
- [ ] Update import logic to migrate old `dimension` to `worldType`
- [ ] Handle 'end' dimension gracefully (default to 'overworld')

### Phase 5: Data Migration
- [ ] Implement migration logic in `useWorldType` hook
- [ ] Implement migration logic in `useSeedInfo` hook
- [ ] Test migration from old data format
- [ ] Test export/import with both old and new formats

### Phase 6: Cleanup
- [ ] Remove all references to `seedInfo.dimension`
- [ ] Remove dimension from export format documentation
- [ ] Update all comments/documentation
- [ ] Remove unused dimension-related code

## Testing Requirements

### Unit Tests
- [ ] worldType hook handles overworld and nether correctly
- [ ] Migration logic correctly migrates dimension → worldType
- [ ] Migration handles 'end' dimension gracefully (defaults to 'overworld')

### Integration Tests
- [ ] Export/import maintains worldType correctly
- [ ] UI displays worldType correctly everywhere
- [ ] Map generation uses worldType correctly
- [ ] YAML generation uses worldType correctly
- [ ] Switching between overworld and nether works correctly

### Edge Cases
- [ ] Migration from old format with dimension only ('overworld')
- [ ] Migration from old format with dimension only ('nether')
- [ ] Migration from old format with dimension only ('end') - should default to 'overworld'
- [ ] Migration from old format with both dimension and worldType
- [ ] Export file with dimension only (legacy)
- [ ] Export file with both (transition period)
- [ ] Empty/null worldType handling

## Backwards Compatibility

### Export Files
- **Version 1.0.0**: Contains both `worldType` and `dimension`
- **Version 1.1.0+**: Contains only `worldType`

Import logic should handle both formats:
1. If `worldType` exists → use it
2. Else if `dimension` exists:
   - If 'overworld' or 'nether' → migrate to `worldType`
   - If 'end' → default to 'overworld' (End not yet supported)
3. Else → default to 'overworld'

### localStorage
- Old format: `seedInfo` contains `dimension`
- New format: `worldType` stored separately, `seedInfo` only contains `seed`
- Migration happens automatically on first load after update

## Rollback Plan

If issues arise, rollback steps:
1. Revert type changes to support both concepts
2. Restore dimension field to seedInfo
3. Add migration to copy worldType → dimension for backwards compatibility
4. Keep both in export format temporarily

## Success Criteria

- [ ] Only one concept (worldType) exists in codebase for overworld/nether
- [ ] No duplicate storage or confusion
- [ ] All existing functionality works with unified concept
- [ ] Migration handles old data correctly
- [ ] Export/import maintains compatibility
- [ ] No regressions in functionality
- [ ] End dimension remains disabled (will be handled in separate spec)

## Dependencies

- **Prerequisite**: `nether-completion-spec.md` must be completed first

## Next Steps

After completing this spec:
1. Proceed to `end-dimension-addition-spec.md` to add End dimension support to the unified system
