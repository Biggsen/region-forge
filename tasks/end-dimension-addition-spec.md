# End Dimension Addition Specification

## Overview
This specification outlines adding End dimension support to the unified worldType system. This should be completed after `overworld-nether-unification-spec.md` is finished, so that End is added to an already-unified system.

**Prerequisites**: 
1. Complete `nether-completion-spec.md` first
2. Complete `overworld-nether-unification-spec.md` first

## Problem Statement

After unification, the system has a single `worldType` concept supporting `'overworld' | 'nether'`. End dimension needs to be added to complete multi-dimension support.

### Current State

1. **Type Support**: `WorldType` is `'overworld' | 'nether'` (End not included)
2. **UI Disabled**: End option is disabled with "Coming soon" text in:
   - `SeedInfoHeading.tsx`
   - `MapLoaderControls.tsx`
3. **Missing Functionality**:
   - No End-specific name generation
   - No End-specific YAML generation logic
   - No End-specific achievements/events logic
   - World size slider doesn't support End
   - Spawn region handling for End (needs decision)

## Goals

1. **Extend Type**: Add 'end' to `WorldType` type
2. **Enable End in UI**: Remove disabled flags and "Coming soon" text
3. **Implement End Name Generation**: Create End-specific name generation or use default
4. **Add World Size Slider**: Support world size adjustment for End dimension
5. **Update All References**: Ensure all functions handle End dimension
6. **Test End Functionality**: Verify End works end-to-end

## Solution

### Phase 1: Extend Type Definition

#### `src/hooks/useWorldType.ts`
**Changes:**
- Extend `WorldType` type to include `'end'`: `export type WorldType = 'overworld' | 'nether' | 'end'`
- Update default value handling to support all three
- Update `toggleWorldType` function (needs redesign - can't toggle between 3 options)
  - **Option A**: Remove toggle, use direct setter only
  - **Option B**: Cycle through all three: overworld → nether → end → overworld
  - **Option C**: Replace with dropdown/select UI

### Phase 2: Enable End in UI

#### `src/components/SeedInfoHeading.tsx`
**Changes:**
- Remove `disabled` attribute from End option
- Remove "Coming soon" text from End option
- Note: Dimension display should already be removed (from unification spec)

#### `src/components/MapLoaderControls.tsx`
**Changes:**
- Remove `disabled` attribute from End option in dimension dropdown
- Remove "Coming soon" text from End option
- Note: Dimension dropdown should already be removed (from unification spec)
- If dimension dropdown still exists, remove it and use worldType from context

#### `src/components/AdvancedPanel.tsx`
**Changes:**
- Add 'End' button to world type selection
- Update styling/colors for End dimension (suggest purple/void theme)
- Update toggle/selection mechanism:
  - If using buttons: Add third button for End
  - If using toggle: Redesign to handle 3 options (see Phase 1)
  - Consider dropdown/select for better UX with 3 options

### Phase 3: Implement End Name Generation

#### `src/utils/nameGenerator.ts`
**Changes:**
- Update `generateRegionName()` to accept `WorldType` (includes 'end')
- Decide on End name generation approach:
  - **Option A**: Create End-specific name generation function (`generateEndName()`)
  - **Option B**: Default to overworld style for End
  - **Option C**: Use nether style for End
- If creating End-specific generation:
  - Add End-specific prefixes, suffixes, themes
  - Consider void/space/end-themed naming (e.g., "Void", "Ender", "Chorus", "Shulker", "End City" themes)
- Update `generateRegionName()` to handle 'end' case

### Phase 4: Add World Size Slider for End

#### `src/components/MapLoaderControls.tsx`
**Changes:**
- Update world size slider condition to include End:
  - From: `{(importDimension === 'overworld' || importDimension === 'nether') && ...}`
  - To: `{(importDimension === 'overworld' || importDimension === 'nether' || importDimension === 'end') && ...}`
  - Or better: Use worldType from context and show for all dimensions
- Ensure world size calculation works correctly for End
- Test that world size persists correctly for End dimension

### Phase 5: Update All Type References

Update all files that use `WorldType` to ensure they handle 'end':

#### `src/utils/polygonUtils.ts`
**Changes:**
- Update functions to handle 'end' dimension in YAML generation
- Decide on End-specific YAML formatting (if any)
- Update greeting text logic if needed

#### `src/utils/exportUtils.ts`
**Changes:**
- Update `MapExportData` interface: `worldType?: 'overworld' | 'nether' | 'end'`
- Update all function signatures to include 'end'
- Update export/import logic to handle 'end'
- Update achievements/events generation to handle End dimension

#### `src/utils/villageUtils.ts`
**Changes:**
- Update worldType parameter to include 'end'
- Decide if villages exist in End (probably not, but handle gracefully)

#### `src/components/RegionCreationForm.tsx`
**Changes:**
- Update worldType type to include 'end'

#### `src/components/RegionDetailsView.tsx`
**Changes:**
- Update worldType type to include 'end'

#### `src/hooks/useDataChanged.ts`
**Changes:**
- Update worldType type to include 'end'

#### `src/hooks/useRegions.ts`
**Changes:**
- Update worldType type to include 'end'

### Phase 6: Spawn Region Handling

#### Decision Needed
- Should End dimension support spawn regions?
- Current: Nether doesn't support spawn (by design)
- Options:
  - **Option A**: End doesn't support spawn (like Nether)
  - **Option B**: End supports spawn (like Overworld)
  - **Option C**: Make it configurable

#### Files to Update (based on decision)
- `src/components/AdvancedPanel.tsx`: Update spawn region checks
- `src/components/ExportPanel.tsx`: Update spawn region checks
- `src/utils/exportUtils.ts`: Update spawn region YAML generation

### Phase 7: Achievements/Events for End

#### `src/utils/exportUtils.ts`
**Changes:**
- Update `generateAchievementsYAML()` to handle End dimension
- Add End-specific achievement messages/names if needed
- Update `generateEventConditionsYAML()` to handle End dimension
- Add End-specific event logic if needed

## Implementation Checklist

### Phase 1: Extend Type
- [ ] Update `WorldType` type to include 'end' in `useWorldType.ts`
- [ ] Update `useWorldType` hook to handle 'end'
- [ ] Redesign toggle function (remove or cycle through 3 options)
- [ ] Test localStorage persistence with 'end'

### Phase 2: Enable End in UI
- [ ] Remove `disabled` from End option in `SeedInfoHeading.tsx` (if dimension UI still exists)
- [ ] Remove "Coming soon" text from End option
- [ ] Remove `disabled` from End option in `MapLoaderControls.tsx` (if dimension UI still exists)
- [ ] Add 'End' button to `AdvancedPanel.tsx`
- [ ] Update styling/colors for End dimension
- [ ] Test End can be selected

### Phase 3: Name Generation
- [ ] Decide on End name generation approach
- [ ] Implement End name generation (if creating specific function)
- [ ] Update `generateRegionName()` to handle 'end'
- [ ] Test End region name generation

### Phase 4: World Size Slider
- [ ] Update world size slider condition to include End
- [ ] Test world size slider appears for End dimension
- [ ] Test world size calculation for End
- [ ] Test world size persistence for End

### Phase 5: Update Type References
- [ ] Update `polygonUtils.ts` to handle 'end'
- [ ] Update `exportUtils.ts` to handle 'end'
- [ ] Update `villageUtils.ts` to handle 'end'
- [ ] Update `RegionCreationForm.tsx` to handle 'end'
- [ ] Update `RegionDetailsView.tsx` to handle 'end'
- [ ] Update `useDataChanged.ts` to handle 'end'
- [ ] Update `useRegions.ts` to handle 'end'

### Phase 6: Spawn Region Decision
- [ ] Make decision on End spawn region support
- [ ] Update spawn region checks based on decision
- [ ] Test spawn region behavior for End

### Phase 7: Achievements/Events
- [ ] Update achievements generation for End
- [ ] Update event conditions generation for End
- [ ] Test achievements/events for End regions

### Phase 8: Testing
- [ ] Test map generation from seed with End
- [ ] Test region creation in End
- [ ] Test region name generation (should use End style)
- [ ] Test YAML export for End regions
- [ ] Test achievements generation for End
- [ ] Test event conditions generation for End
- [ ] Test spawn region behavior (based on decision)
- [ ] Test export/import with End dimension
- [ ] Test world size slider functionality
- [ ] Test switching between all three dimensions

## Testing Requirements

### Functional Tests
- [ ] End can be selected in UI
- [ ] World size slider appears for End
- [ ] World size slider works correctly for End
- [ ] Map generation works with End dimension
- [ ] Region creation works in End
- [ ] Region names use End-style generation (or default)
- [ ] YAML export works for End regions
- [ ] Achievements generation works for End
- [ ] Event conditions generation works for End
- [ ] Spawn region behavior works correctly (based on decision)
- [ ] Export/import preserves End dimension
- [ ] Switching between overworld/nether/end works correctly

### Edge Cases
- [ ] Switching between all three dimensions
- [ ] World size persistence across dimension switches
- [ ] Export file with End dimension
- [ ] Import file with End dimension
- [ ] Migration from old format with End dimension

## Design Decisions Needed

1. **End Name Generation**: Create End-specific function or use default?
2. **Toggle Function**: Remove, cycle, or replace with dropdown?
3. **Spawn Regions**: Should End support spawn regions?
4. **End Color Theme**: What colors/styling for End dimension UI?

## Future Considerations

1. **End-Specific Features**: Are there End-specific features needed beyond basic support?
2. **End City Integration**: Should End cities be handled specially?
3. **End Gateway Handling**: Should End gateways be considered?

## Success Criteria

- [ ] End dimension is fully supported in unified worldType system
- [ ] End can be selected and used in all UI locations
- [ ] World size slider works for End
- [ ] All End functionality works end-to-end
- [ ] No regressions in Overworld or Nether functionality
- [ ] All tests pass
- [ ] Documentation updated

## Dependencies

- **Prerequisites**: 
  1. `nether-completion-spec.md` must be completed
  2. `overworld-nether-unification-spec.md` must be completed

## Rollback Plan

If issues arise, rollback steps:
1. Revert type changes to exclude 'end'
2. Re-enable disabled flags in UI
3. Remove End-specific code
4. Keep End disabled until issues are resolved
