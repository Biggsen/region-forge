# WorldType / Dimension Unification Specification

## Overview
This specification outlines the refactoring to unify the `worldType` and `dimension` concepts, which are currently duplicated and serve essentially the same purpose. This will simplify the codebase and eliminate confusion where these two similar concepts are used inconsistently.

## Problem Statement

Currently, the application has two separate but overlapping concepts:

1. **`worldType`** (`useWorldType` hook)
   - Type: `'overworld' | 'nether'` (only 2 values)
   - Storage: `localStorage` key `'mc-region-maker-world-type'`
   - Used for: Name generation style, YAML generation, achievements/events
   - UI: Advanced Panel toggle

2. **`dimension`** (`useSeedInfo` hook)
   - Type: `'overworld' | 'nether' | 'end'` (3 values, includes 'end')
   - Storage: Part of `seedInfo` object in `'mc-region-maker-world-seed'`
   - Used for: Map generation from seed, display in Regions tab
   - UI: SeedInfoHeading, MapLoaderControls World Details section

### Issues with Current Implementation

1. **Conceptual Duplication**: Both represent the same thing (Minecraft dimension)
2. **Type Mismatch**: worldType only supports 2 values, dimension supports 3 (missing 'end' in worldType)
3. **Confused Fallback Logic**: `SeedInfoHeading.tsx` uses `worldType` as fallback for `dimension` display, mixing concepts
4. **Multiple Storage Locations**: Stored in different localStorage keys
5. **Inconsistent Usage**: Some places use worldType, others use dimension, sometimes both
6. **Export Format Confusion**: Export files contain both `worldType` and `dimension` fields

## Goals

1. **Unify Concepts**: Single source of truth for dimension/world type
2. **Extend Support**: Add 'end' dimension to unified type
3. **Consolidate Storage**: Single localStorage key for dimension information
4. **Update All References**: Replace all dimension references with worldType
5. **Maintain Backwards Compatibility**: Handle migration from old data format
6. **Simplify Codebase**: Remove duplicate logic and confusion

## Solution

### Unified Type Definition

Replace both concepts with a single `worldType` that supports all three dimensions:

```typescript
export type WorldType = 'overworld' | 'nether' | 'end'
```

### Storage Strategy

- **Primary Storage**: `'mc-region-maker-world-type'` localStorage key
- **Remove**: `dimension` field from `seedInfo` object
- **Migration**: On app load, if `seedInfo.dimension` exists and `worldType` doesn't, migrate dimension → worldType

### API Changes

#### `src/hooks/useWorldType.ts`
**Changes:**
- Extend type to include `'end'`
- Update default value handling to support all three
- No other changes needed (already handles localStorage properly)

#### `src/hooks/useSeedInfo.ts`
**Changes:**
- Remove `dimension` from `SeedInfo` interface
- Keep only `seed?: string`
- Remove dimension from all updateSeedInfo calls
- Migration logic: Check for old dimension in seedInfo on mount, migrate to worldType

#### `src/components/SeedInfoHeading.tsx`
**Changes:**
- Remove dimension display/editing entirely
- Display only seed (dimension is now handled by worldType)
- Remove all dimension-related state and handlers
- Remove worldType fallback logic (no longer needed)

#### `src/components/MapLoaderControls.tsx`
**Changes:**
- Remove dimension from World Details section
- Use `worldType` from context instead of `seedInfo.dimension`
- Update dimension references in generate/import flows to use `worldType`

#### `src/components/AdvancedPanel.tsx`
**Changes:**
- Add 'End' option to world type toggle buttons
- Update styling/colors for end dimension

#### `src/utils/nameGenerator.ts`
**Changes:**
- Update `generateRegionName()` to accept `WorldType` (includes 'end')
- Add support for 'end' dimension name generation (if needed, or default to overworld style)

#### `src/utils/polygonUtils.ts`
**Changes:**
- Update all functions accepting `worldType?: 'overworld' | 'nether'` to `worldType?: WorldType`
- Add handling for 'end' dimension in YAML generation if needed

#### `src/utils/exportUtils.ts`
**Changes:**
- Remove `dimension` from `MapExportData` interface
- Keep only `worldType` field
- Update export/import logic to only use `worldType`

#### `src/components/MainApp.tsx`
**Changes:**
- Remove `seedInfo.seedInfo.dimension` from export calls
- Remove dimension restoration from import logic (use worldType only)

#### `src/components/ImageImportHandler.tsx`
**Changes:**
- Remove dimension handling from router state
- Use worldType from context instead

#### `src/context/AppContext.tsx`
**Changes:**
- Update `useRegions(worldType.worldType)` to pass the full WorldType
- Ensure worldType supports 'end'

## Migration Plan

### Data Migration (on app load)

1. Check if `seedInfo.dimension` exists in localStorage
2. If exists and `worldType` doesn't exist or is default:
   - Copy `dimension` value to `worldType`
   - Remove `dimension` from `seedInfo` object
3. If both exist and differ:
   - Prefer `worldType` (more recent), log warning
   - Remove `dimension` from `seedInfo`
4. Update `seedInfo` storage to remove dimension

### Export File Migration

Legacy export files may contain both `worldType` and `dimension`:
- On import, prefer `worldType` if present
- If only `dimension` exists, use it to set `worldType`
- Remove `dimension` from import logic after migration period

## Implementation Checklist

### Phase 1: Extend worldType Type
- [ ] Update `WorldType` type to include 'end'
- [ ] Update `useWorldType` hook to handle 'end'
- [ ] Test localStorage persistence with 'end'

### Phase 2: Update All Type References
- [ ] Update all function signatures that accept worldType
- [ ] Update all function signatures that accept dimension
- [ ] Replace dimension parameters with worldType

### Phase 3: Remove dimension from seedInfo
- [ ] Remove dimension from SeedInfo interface
- [ ] Remove dimension from useSeedInfo hook
- [ ] Update SeedInfoHeading to remove dimension UI
- [ ] Remove dimension from MapLoaderControls World Details

### Phase 4: Update UI Components
- [ ] Add 'End' button to AdvancedPanel
- [ ] Update MapLoaderControls to use worldType
- [ ] Remove dimension dropdown from SeedInfoHeading
- [ ] Update all displays to use worldType

### Phase 5: Update Utility Functions
- [ ] Update nameGenerator to handle 'end'
- [ ] Update polygonUtils to use WorldType
- [ ] Update exportUtils to remove dimension
- [ ] Update villageUtils if needed

### Phase 6: Data Migration
- [ ] Implement migration logic in useWorldType
- [ ] Implement migration logic in useSeedInfo
- [ ] Test migration from old data format
- [ ] Test export/import with both old and new formats

### Phase 7: Cleanup
- [ ] Remove all references to seedInfo.dimension
- [ ] Remove dimension from export format documentation
- [ ] Update all comments/documentation
- [ ] Remove unused dimension-related code

## Testing Requirements

### Unit Tests
- [ ] worldType hook handles all three dimensions
- [ ] Migration logic correctly migrates dimension → worldType
- [ ] Name generation works for all three dimensions

### Integration Tests
- [ ] Export/import maintains worldType correctly
- [ ] UI displays worldType correctly everywhere
- [ ] Map generation uses worldType correctly
- [ ] YAML generation uses worldType correctly

### Edge Cases
- [ ] Migration from old format with dimension only
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
2. Else if `dimension` exists → migrate to `worldType`
3. Else → default to 'overworld'

### localStorage
- Old format: `seedInfo` contains `dimension`
- New format: `worldType` stored separately, `seedInfo` only contains `seed`
- Migration happens automatically on first load after update

## Future Considerations

1. **Name Generation for 'end'**: May need special name generation style for End dimension (currently would default to overworld style)
2. **YAML Generation for 'end'**: Verify that YAML generation works correctly for End dimension regions
3. **Achievements/Events for 'end'**: Ensure achievement/event generation handles End dimension correctly

## Rollback Plan

If issues arise, rollback steps:
1. Revert type changes to support both concepts
2. Restore dimension field to seedInfo
3. Add migration to copy worldType → dimension for backwards compatibility
4. Keep both in export format temporarily

## Success Criteria

- [ ] Only one concept (worldType) exists in codebase
- [ ] All three dimensions (overworld, nether, end) are supported
- [ ] No duplicate storage or confusion
- [ ] All existing functionality works with unified concept
- [ ] Migration handles old data correctly
- [ ] Export/import maintains compatibility
