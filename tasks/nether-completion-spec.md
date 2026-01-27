# Nether Dimension Completion Specification

## Overview
This specification outlines the completion of Nether dimension support. Nether functionality is partially implemented (name generation, YAML generation, achievements/events) but is currently disabled in the UI. This spec enables Nether in the user interface and ensures all features work correctly.

**Prerequisites**: Complete `remove-worldtype-setting-spec.md` first. After the refactor, `dimension` will be the single source of truth, making nether implementation straightforward.

## Problem Statement

Currently, Nether dimension has:
- ✅ **Implemented**: Name generation (`generateNetherName()`), YAML generation with nether-specific logic, achievements/events with nether handling
- ❌ **Disabled**: UI controls show Nether as "Coming soon" and disabled
- ❌ **Missing**: World size slider support for Nether (only works for overworld)
- ❌ **Incomplete**: End-to-end testing of Nether functionality
- ❌ **Bug**: `getRecipeId()` incorrectly returns `'nether_village'` - villages don't exist in nether

### Current State

1. **UI Disabled**:
   - `SeedInfoHeading.tsx`: Nether option disabled with "Coming soon" text
   - `MapLoaderControls.tsx`: Nether option disabled in dimension dropdown

2. **World Size Slider**:
   - Only available for overworld dimension (`importDimension === 'overworld'`)
   - Nether and End dimensions cannot adjust world size

3. **Type Support**:
   - `dimension` in `seedInfo` supports `'overworld' | 'nether' | 'end'` (end is disabled)
   - After refactor: `dimension` will be the single source of truth (no worldType confusion)

## Goals

1. **Enable Nether in UI**: Remove "disabled" flags and "Coming soon" text
2. **Add World Size Slider**: Support world size adjustment for Nether dimension (nether size is independent, no conversion needed)
3. **Complete Testing**: Verify all Nether functionality works end-to-end
4. **Fix Nether-Specific Issues**: Remove `nether_village`, ensure villages are excluded from nether exports, ensure spawn/onboarding UI is hidden for nether

## Solution

### Phase 1: Enable Nether in UI

#### `src/components/SeedInfoHeading.tsx`
**Changes:**
- Remove `disabled` attribute from Nether option
- Remove "Coming soon" text from Nether option
- Keep End disabled (will be handled in separate spec)

#### `src/components/MapLoaderControls.tsx`
**Changes:**
- Remove `disabled` attribute from Nether option in dimension dropdown
- Remove "Coming soon" text from Nether option
- Keep End disabled (will be handled in separate spec)

#### Region Name Generation
**Note**: After the refactor, region name generation will automatically use the correct generator based on `dimension`:
- `RegionCreationForm` and `RegionDetailsView` will receive `dimension` prop
- Name generator functions already support nether names
- No additional changes needed - will work correctly once dimension is used everywhere

#### Spawn/Onboarding UI Exclusion
**Important**: Spawn and onboarding are overworld-only features and must not be available for nether.

**Changes:**
- `src/components/AdvancedPanel.tsx`: Update spawn button visibility check to use `dimension !== 'nether'` instead of `worldType.worldType !== 'nether'`
- `src/components/AdvancedPanel.tsx`: Update "Has Spawn" checkbox visibility to use `dimension !== 'nether'`
- `src/components/ExportPanel.tsx`: Update spawn region export checks to use `dimension !== 'nether'`
- Ensure spawn-related UI elements are completely hidden (not just disabled) when nether dimension is selected

### Phase 2: Fix Nether Village Bug

#### `src/utils/exportUtils.ts`
**Bug**: The `getRecipeId()` function incorrectly returns `'nether_village'` for villages in nether, but villages don't exist in nether.

**Changes:**
- Remove the `nether_village` case from `getRecipeId()` function
- Update `exportRegionsMetaYAML()` to skip villages when `dimension === 'nether'`
- Ensure villages are never exported for nether dimension (they are overworld-only)

**Current Code Issue:**
```typescript
function getRecipeId(kind: 'system' | 'region' | 'village' | 'heart', world: 'overworld' | 'nether'): string {
  if (kind === 'system') return 'none'
  if (world === 'nether') {
    if (kind === 'region') return 'nether_region'
    if (kind === 'heart') return 'nether_heart'
    if (kind === 'village') return 'nether_village'  // ❌ REMOVE THIS - villages don't exist in nether
  }
  return kind
}
```

**Fix:**
- Remove the `if (kind === 'village') return 'nether_village'` line
- In `exportRegionsMetaYAML()`, ensure the village export loop skips when `dimension === 'nether'`

### Phase 3: Add World Size Slider for Nether

#### Important: Nether Size is Independent

**Design Decision:**
Nether world size is independent of overworld size. The user selects the nether size they need (2k-16k), and portal restrictions are handled in-game, not by Region Forge.

**Important Note on Coordinates:**
- The app loads/imports an image in a requested dimension size (8k×8k, 2k×2k, etc.)
- The image size defines the coordinate space - **no coordinate conversion is needed**
- If a nether image is 2k×2k, regions created on it use nether coordinates directly
- If an overworld image is 8k×8k, regions created on it use overworld coordinates directly
- Exported regions will have the correct coordinates for their dimension

**Implementation Approach:**
- Nether size is selected independently (2k-16k range, same as overworld)
- No size conversion needed - send selected size directly to API
- User chooses the nether size they require for their server

**UI Display:**
- **Overworld**: "World Size: 8k (1000x1000)"
- **Nether**: "Nether World Size: 2k (250x250)" (or whatever size user selects)

#### `src/components/MapLoaderControls.tsx`
**Changes:**
- Update world size slider condition from `{importDimension === 'overworld' && ...}` to `{(importDimension === 'overworld' || importDimension === 'nether') && ...}`
- Update label to show "Nether World Size" when nether dimension is selected
- Send selected size directly to API (no conversion)
- Ensure world size persists correctly for Nether dimension

### Phase 4: Testing and Bug Fixes

#### Test Cases
1. **Map Generation**:
   - Generate map from seed with Nether dimension
   - Verify map loads correctly
   - Verify coordinates are correct

2. **Region Creation**:
   - Create regions in Nether dimension
   - Verify region names use nether-style generation (name generator uses `dimension` from seedInfo)
   - Verify regions can be edited/moved/resized
   - Verify dice button in region creation form generates nether names when dimension is nether

3. **YAML Export**:
   - Export regions YAML for Nether
   - Verify nether-specific YAML formatting
   - Verify spawn region is excluded (nether doesn't support spawn)
   - Verify villages are excluded from nether exports (villages don't exist in nether)

4. **regions-meta.yml Export**:
   - Export regions-meta.yml for Nether regions
   - Verify nether regions use correct `recipeId` values: `nether_region`, `nether_heart` (NOT `nether_village`)
   - Verify `onboarding` section is never included for nether
   - Verify `spawnCenter` section is never included for nether
   - Verify root `world` field uses `"nether"` (dimension name, not server world name)
   - Verify villages are completely excluded from nether exports

5. **Achievements/Events**:
   - Generate achievements YAML for Nether regions
   - Generate event conditions YAML for Nether regions
   - Verify nether-specific naming in achievements

6. **World Size**:
   - Set different world sizes for Nether (2k-16k)
   - Verify world size persists
   - Verify map generation uses the selected size directly (no conversion)
   - Verify API receives correct size parameter for Nether (e.g., size: 2 for 2k nether)
   - Verify coordinates are correct for the loaded image dimension (no conversion needed)

7. **Export/Import**:
   - Export project with Nether dimension
   - Import project with Nether dimension
   - Verify dimension is preserved

## Implementation Checklist

### Phase 1: Enable Nether in UI
- [ ] Remove `disabled` from Nether option in `SeedInfoHeading.tsx`
- [ ] Remove "Coming soon" text from Nether option in `SeedInfoHeading.tsx`
- [ ] Remove `disabled` from Nether option in `MapLoaderControls.tsx`
- [ ] Remove "Coming soon" text from Nether option in `MapLoaderControls.tsx`
- [ ] Update spawn visibility checks in `AdvancedPanel.tsx` to use `dimension !== 'nether'`
- [ ] Update spawn export checks in `ExportPanel.tsx` to use `dimension !== 'nether'`
- [ ] Verify region name generation uses `dimension` (should work automatically after refactor)
- [ ] Test that Nether can be selected in both locations

### Phase 2: Fix Nether Village Bug
- [ ] Remove `nether_village` case from `getRecipeId()` function in `src/utils/exportUtils.ts`
- [ ] Update `exportRegionsMetaYAML()` to skip villages when `dimension === 'nether'`
- [ ] Test that villages are never exported for nether dimension

### Phase 3: World Size Slider
- [ ] Update world size slider condition in `MapLoaderControls.tsx` to include Nether
- [ ] Update label to show "Nether World Size" when nether dimension is selected
- [ ] Send selected size directly to API (no conversion needed)
- [ ] Test world size slider appears for Nether dimension
- [ ] Test world size persistence for Nether
- [ ] Test that selected size is sent directly to API (e.g., 2k → size: 2)

### Phase 4: Testing
- [ ] Test map generation from seed with Nether
- [ ] Test region creation in Nether
- [ ] Test region name generation (should use nether style)
- [ ] Test YAML export for Nether regions
- [ ] Test achievements generation for Nether
- [ ] Test event conditions generation for Nether
- [ ] Test spawn region exclusion (nether shouldn't have spawn)
- [ ] Test villages are excluded from nether exports
- [ ] Test regions-meta.yml export for nether (correct recipeIds, no onboarding/spawnCenter)
- [ ] Test export/import with Nether dimension
- [ ] Test world size slider functionality
- [ ] Document any bugs found

### Phase 5: Bug Fixes
- [ ] Remove `nether_village` from `getRecipeId()` function in `src/utils/exportUtils.ts`
- [ ] Ensure `exportRegionsMetaYAML()` skips villages when `dimension === 'nether'` (villages don't exist in nether)
- [ ] Verify spawn/onboarding UI elements are hidden (not just disabled) for nether
- [ ] Fix any other bugs discovered during testing
- [ ] Re-test fixed functionality
- [ ] Update documentation if needed

## Testing Requirements

### Functional Tests
- [ ] Nether can be selected in SeedInfoHeading
- [ ] Nether can be selected in MapLoaderControls
- [ ] World size slider appears for Nether
- [ ] World size slider works correctly for Nether
- [ ] API receives correct size parameter for Nether dimension (selected size, no conversion)
- [ ] Coordinates are correct for loaded image dimension (no conversion needed)
- [ ] Map generation works with Nether dimension
- [ ] Region creation works in Nether
- [ ] Region names use nether-style generation (name generator uses dimension from seedInfo)
- [ ] YAML export works for Nether regions
- [ ] Achievements generation works for Nether
- [ ] Event conditions generation works for Nether
- [ ] Spawn regions are excluded for Nether
- [ ] Villages are excluded from nether exports
- [ ] regions-meta.yml export works correctly for Nether (correct recipeIds, no onboarding/spawnCenter)
- [ ] Export/import preserves Nether dimension

### Edge Cases
- [ ] Switching between Overworld and Nether
- [ ] World size persistence across dimension switches (each dimension has independent size)
- [ ] Export file with Nether dimension
- [ ] Import file with Nether dimension
- [ ] Coordinate boundaries are correct for the loaded image dimension

## Known Limitations

1. **End Dimension**: Remains disabled and will be handled in separate spec
2. **Spawn Regions**: Nether does not support spawn regions (by design). Spawn button, "Has Spawn" checkbox, and spawn region export options are hidden for nether.
3. **Onboarding**: Nether does not support onboarding (first-join teleport). Onboarding section is never exported for nether.
4. **Villages**: Villages don't exist in nether and should not be exported for nether dimension. The `nether_village` recipeId does not exist and must be removed from code.
5. **Nether Size**: Nether world size is independent of overworld size. Users select the size they need (2k-16k), and portal restrictions are handled in-game.

## Success Criteria

- [ ] Nether is fully enabled in UI (no disabled flags)
- [ ] World size slider works for Nether dimension
- [ ] All Nether functionality works end-to-end
- [ ] No regressions in Overworld functionality
- [ ] All tests pass
- [ ] Documentation updated if needed

## Dependencies

- **Prerequisite**: `remove-worldtype-setting-spec.md` must be completed first. After the refactor, `dimension` will be the single source of truth, making this implementation straightforward.

## Next Steps

After completing this spec:
1. Proceed to `end-dimension-addition-spec.md` to add End dimension support
