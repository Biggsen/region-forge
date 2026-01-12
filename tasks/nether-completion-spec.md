# Nether Dimension Completion Specification

## Overview
This specification outlines the completion of Nether dimension support. Nether functionality is partially implemented (name generation, YAML generation, achievements/events) but is currently disabled in the UI. This spec enables Nether in the user interface and ensures all features work correctly.

## Problem Statement

Currently, Nether dimension has:
- ✅ **Implemented**: Name generation (`generateNetherName()`), YAML generation with nether-specific logic, achievements/events with nether handling
- ❌ **Disabled**: UI controls show Nether as "Coming soon" and disabled
- ❌ **Missing**: World size slider support for Nether (only works for overworld)
- ❌ **Incomplete**: End-to-end testing of Nether functionality

### Current State

1. **UI Disabled**:
   - `SeedInfoHeading.tsx`: Nether option disabled with "Coming soon" text
   - `MapLoaderControls.tsx`: Nether option disabled in dimension dropdown

2. **World Size Slider**:
   - Only available for overworld dimension (`importDimension === 'overworld'`)
   - Nether and End dimensions cannot adjust world size

3. **Type Support**:
   - `useWorldType` hook supports `'overworld' | 'nether'` (no 'end' yet)
   - `dimension` in `seedInfo` supports `'overworld' | 'nether' | 'end'`

## Goals

1. **Enable Nether in UI**: Remove "disabled" flags and "Coming soon" text
2. **Add World Size Slider**: Support world size adjustment for Nether dimension
3. **Complete Testing**: Verify all Nether functionality works end-to-end
4. **Fix Nether-Specific Issues**: Address any bugs discovered during testing

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

### Phase 2: Add World Size Slider for Nether

#### Important: World Size Ratio Between Dimensions

Minecraft has a **1:8 coordinate ratio** between Overworld and Nether:
- **Overworld coordinates** are 8× larger than Nether coordinates
- **Nether coordinates** are 1/8th of Overworld coordinates

**Examples:**
- Overworld (-4000, -4000) → Nether (-500, -500)
- Overworld (4000, 4000) → Nether (500, 500)
- An 8k Overworld map (covers -4000 to +4000) corresponds to a 1k Nether map (covers -500 to +500)

**Design Decision:**
When a user selects a world size (e.g., "8k"), this represents the **Overworld equivalent size**. For map generation:
- **Overworld**: Send `size: 8` to API (generates 8k×8k map)
- **Nether**: Send `size: 1` to API (generates 1k×1k map, which is the same area in Overworld terms)

**Implementation Approach:**
Store a **base world size** (Overworld equivalent) and calculate Nether size:
- Base world size: 8k (Overworld equivalent)
- Overworld map size: `baseWorldSize` (8k)
- Nether map size: `baseWorldSize / 8` (1k)

**UI Display:**
- **Overworld**: "World Size: 8k (covers -4000 to +4000)"
- **Nether**: "World Size: 1k (covers -500 to +500, same area as 8k Overworld)"

The slider should show the **base world size** (Overworld equivalent), and the API call should automatically convert to the correct size for the selected dimension.

#### `src/components/MapLoaderControls.tsx`
**Changes:**
- Update world size slider condition from `{importDimension === 'overworld' && ...}` to `{(importDimension === 'overworld' || importDimension === 'nether') && ...}`
- When generating Nether maps, convert world size: `netherSize = worldSize / 8`
- Update API call to use converted size for Nether dimension
- Update display to show effective Nether size (e.g., "1k" when base is "8k")
- Ensure world size calculation works correctly for Nether
- Test that world size persists correctly for Nether dimension

#### `src/components/WorldSizeHeading.tsx` (if exists)
**Changes:**
- Review if dimension awareness is needed
- Ensure world size selector works for Nether
- Display effective Nether size when Nether is selected (show 1k when base is 8k)

### Phase 3: Testing and Bug Fixes

#### Test Cases
1. **Map Generation**:
   - Generate map from seed with Nether dimension
   - Verify map loads correctly
   - Verify coordinates are correct

2. **Region Creation**:
   - Create regions in Nether dimension
   - Verify region names use nether-style generation
   - Verify regions can be edited/moved/resized

3. **YAML Export**:
   - Export regions YAML for Nether
   - Verify nether-specific YAML formatting
   - Verify spawn region is excluded (nether doesn't support spawn)

4. **Achievements/Events**:
   - Generate achievements YAML for Nether regions
   - Generate event conditions YAML for Nether regions
   - Verify nether-specific naming in achievements

5. **World Size**:
   - Set different world sizes for Nether
   - Verify world size persists
   - Verify map generation uses correct world size (1/8th of Overworld size)
   - Verify API receives correct size parameter for Nether (e.g., size: 1 when base is 8k)
   - Verify coordinate conversion is correct (e.g., -4000 Overworld = -500 Nether)

6. **Export/Import**:
   - Export project with Nether dimension
   - Import project with Nether dimension
   - Verify dimension is preserved

## Implementation Checklist

### Phase 1: Enable Nether in UI
- [ ] Remove `disabled` from Nether option in `SeedInfoHeading.tsx`
- [ ] Remove "Coming soon" text from Nether option in `SeedInfoHeading.tsx`
- [ ] Remove `disabled` from Nether option in `MapLoaderControls.tsx`
- [ ] Remove "Coming soon" text from Nether option in `MapLoaderControls.tsx`
- [ ] Test that Nether can be selected in both locations

### Phase 2: World Size Slider
- [ ] Update world size slider condition in `MapLoaderControls.tsx` to include Nether
- [ ] Implement world size conversion for Nether (divide by 8)
- [ ] Update API call to use converted size for Nether dimension
- [ ] Update UI display to show effective Nether size
- [ ] Test world size slider appears for Nether dimension
- [ ] Test world size calculation for Nether (verify 8k base = 1k Nether)
- [ ] Test world size persistence for Nether
- [ ] Test coordinate conversion is correct (verify -4000 Overworld = -500 Nether)
- [ ] Review `WorldSizeHeading.tsx` if it exists

### Phase 3: Testing
- [ ] Test map generation from seed with Nether
- [ ] Test region creation in Nether
- [ ] Test region name generation (should use nether style)
- [ ] Test YAML export for Nether regions
- [ ] Test achievements generation for Nether
- [ ] Test event conditions generation for Nether
- [ ] Test spawn region exclusion (nether shouldn't have spawn)
- [ ] Test export/import with Nether dimension
- [ ] Test world size slider functionality
- [ ] Document any bugs found

### Phase 4: Bug Fixes
- [ ] Fix any bugs discovered during testing
- [ ] Re-test fixed functionality
- [ ] Update documentation if needed

## Testing Requirements

### Functional Tests
- [ ] Nether can be selected in SeedInfoHeading
- [ ] Nether can be selected in MapLoaderControls
- [ ] World size slider appears for Nether
- [ ] World size slider works correctly for Nether
- [ ] World size conversion works correctly (8k base = 1k Nether)
- [ ] API receives correct size parameter for Nether dimension
- [ ] Coordinate conversion is correct (1:8 ratio)
- [ ] Map generation works with Nether dimension
- [ ] Region creation works in Nether
- [ ] Region names use nether-style generation
- [ ] YAML export works for Nether regions
- [ ] Achievements generation works for Nether
- [ ] Event conditions generation works for Nether
- [ ] Spawn regions are excluded for Nether
- [ ] Export/import preserves Nether dimension

### Edge Cases
- [ ] Switching between Overworld and Nether
- [ ] World size persistence across dimension switches
- [ ] World size conversion when switching dimensions (8k Overworld → 1k Nether)
- [ ] Export file with Nether dimension
- [ ] Import file with Nether dimension
- [ ] Coordinate boundaries (verify -4000 Overworld = -500 Nether)

## Known Limitations

1. **End Dimension**: Remains disabled and will be handled in separate spec
2. **Spawn Regions**: Nether does not support spawn regions (by design)
3. **World Type Toggle**: Currently only toggles between overworld/nether (will be addressed in unification spec)

## Success Criteria

- [ ] Nether is fully enabled in UI (no disabled flags)
- [ ] World size slider works for Nether dimension
- [ ] All Nether functionality works end-to-end
- [ ] No regressions in Overworld functionality
- [ ] All tests pass
- [ ] Documentation updated if needed

## Dependencies

- None - this is a standalone completion task

## Next Steps

After completing this spec:
1. Proceed to `overworld-nether-unification-spec.md` to unify worldType and dimension concepts
2. Then proceed to `end-dimension-addition-spec.md` to add End dimension support
