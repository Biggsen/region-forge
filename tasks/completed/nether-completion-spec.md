# Nether Dimension Completion Specification

## Overview
This specification outlines the completion of Nether dimension support. Nether functionality is partially implemented (name generation, YAML generation) but is currently disabled in the UI. This spec enables Nether in the user interface and ensures all features work correctly.

**Prerequisites**: Complete `remove-worldtype-setting-spec.md` first. After the refactor, `dimension` will be the single source of truth, making nether implementation straightforward.

## Problem Statement

Originally, Nether dimension had:
- ✅ **Implemented**: Name generation (`generateNetherName()`), YAML generation with nether-specific logic
- ~~❌ **Disabled**: UI controls show Nether as "Coming soon" and disabled~~ → **Done**: Nether enabled in SeedInfoHeading and MapLoaderControls
- ~~❌ **Missing**: World size slider support for Nether~~ → **Done**: Slider shown for nether with "Nether World Size" label
- ~~❌ **Incomplete**: End-to-end testing~~ → **Done**: Manual testing completed
- ~~❌ **Bug**: `getRecipeId()` incorrectly returns `'nether_village'`~~ → **Done**: Removed; villages skipped for nether

### Current State (post-implementation)

1. **UI**: Nether enabled in SeedInfoHeading and MapLoaderControls. Spawn and Villages sections hidden for nether. Spawn marker hidden on map; Villages/Orphaned hidden in Display dropup.
2. **World Size Slider**: Available for overworld and nether; nether label "Nether World Size". End still no slider.
3. **Type Support**: `dimension` is the single source of truth (worldType removed). `'overworld' | 'nether' | 'end'` supported; end disabled in UI.

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
- `src/components/AdvancedPanel.tsx`: Hide the **entire** Spawn collapsible section when `dimension === 'nether'` (not just the inner button). The whole "Spawn" toggle is omitted.
- `src/components/AdvancedPanel.tsx`: Hide the **entire** Villages collapsible section when `dimension === 'nether'` (villages don't exist in nether).
- `src/components/AdvancedPanel.tsx`: "Has Spawn" / Region Specific spawn checkbox is already gated by `dimension !== 'nether'`.
- `src/components/ExportPanel.tsx`: Spawn region export checks use `dimension !== 'nether'`; "Include Spawn Region" checkbox is hidden for nether.
- Ensure spawn-related and village-related UI elements are **completely hidden** (not just disabled) when nether is selected.

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

#### Spawn on Map & Display Options
- **MapCanvas / RegionOverlay**: Do not draw the spawn marker (red circle + "Spawn" label) on the map when `dimension === 'nether'`. Pass `spawnCoordinates={null}` to `RegionOverlay` when nether.
- **MapDisplayControls** (Display dropup): Hide the "Villages" and "Orphaned Villages" options when `dimension === 'nether'`. Pass `dimension` into `MapDisplayControls` and only show village toggles when `dimension !== 'nether'`.

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

4. **regions-meta Export**:
   - Export regions-meta for Nether: filename must be **`nether-regions-meta.yml`** (prepend `nether-` when dimension is nether). Overworld remains `regions-meta.yml`.
   - Verify nether regions use correct `recipeId` values: `nether_region`, `nether_heart` (NOT `nether_village`)
   - Verify `onboarding` section is never included for nether
   - Verify `spawnCenter` section is never included for nether
   - Verify root `world` field uses `"nether"` (dimension name, not server world name)
   - Verify villages are completely excluded from nether exports
   - Verify **`villageBandStrategy: easy`** is **not** included in `levelledMobs` for nether (villages don't exist; only `regionBands` when applicable).

5. **World Size**:
   - Set different world sizes for Nether (2k-16k)
   - Verify world size persists
   - Verify map generation uses the selected size directly (no conversion)
   - Verify API receives correct size parameter for Nether (e.g., size: 2 for 2k nether)
   - Verify coordinates are correct for the loaded image dimension (no conversion needed)

6. **Export/Import**:
   - Export project with Nether dimension
   - Import project with Nether dimension
   - Verify dimension is preserved

## Implementation Checklist

### Phase 1: Enable Nether in UI
- [x] Remove `disabled` from Nether option in `SeedInfoHeading.tsx`
- [x] Remove "Coming soon" text from Nether option in `SeedInfoHeading.tsx`
- [x] Remove `disabled` from Nether option in `MapLoaderControls.tsx`
- [x] Remove "Coming soon" text from Nether option in `MapLoaderControls.tsx`
- [x] Hide **entire** Spawn collapsible section in `AdvancedPanel.tsx` when `dimension === 'nether'`
- [x] Hide **entire** Villages collapsible section in `AdvancedPanel.tsx` when `dimension === 'nether'`
- [x] Update spawn export checks in `ExportPanel.tsx` to use `dimension !== 'nether'`; hide "Include Spawn Region" for nether
- [x] Hide spawn marker on map for nether: `MapCanvas` passes `spawnCoordinates={null}` to `RegionOverlay` when nether
- [x] Hide Villages and Orphaned Villages in Display dropup for nether: `MapDisplayControls` accepts `dimension`, shows village toggles only when `dimension !== 'nether'`
- [x] Verify region name generation uses `dimension` (works via seedInfo)
- [x] Test that Nether can be selected in both locations

### Phase 2: Fix Nether Village Bug
- [x] Remove `nether_village` case from `getRecipeId()` function in `src/utils/exportUtils.ts`
- [x] Update `exportRegionsMetaYAML()` to skip villages when `dimension === 'nether'`
- [x] Test that villages are never exported for nether dimension

### Regions-meta export (nether-specific)
- [x] Use filename `nether-regions-meta.yml` when exporting for nether; `regions-meta.yml` otherwise
- [x] Omit `villageBandStrategy: 'easy'` from `levelledMobs` when dimension is nether

### Phase 3: World Size Slider
- [x] Update world size slider condition in `MapLoaderControls.tsx` to include Nether
- [x] Update label to show "Nether World Size" when nether dimension is selected
- [x] Send selected size directly to API (no conversion needed)
- [x] Test world size slider appears for Nether dimension
- [x] Test world size persistence for Nether
- [x] Test that selected size is sent directly to API (e.g., 2k → size: 2)

### Phase 4: Testing
- [x] Test map generation from seed with Nether
- [x] Test region creation in Nether
- [x] Test region name generation (should use nether style)
- [x] Test YAML export for Nether regions
- [x] Test spawn region exclusion (nether shouldn't have spawn)
- [x] Test villages are excluded from nether exports
- [x] Test regions-meta export for nether (correct recipeIds, no onboarding/spawnCenter, filename, no villageBandStrategy)
- [x] Test export/import with Nether dimension
- [x] Test world size slider functionality
- [x] Document any bugs found (none)

### Phase 5: Bug Fixes & General Export Behaviour
- [x] Remove `nether_village` from `getRecipeId()`; ensure `exportRegionsMetaYAML()` skips villages when `dimension === 'nether'`
- [x] Verify spawn/village UI elements are **hidden** (not just disabled) for nether
- [x] **Hearts (not nether-specific):** Export hearts only when `region.centerPoint != null`. Apply in both `generateRegionYAML` (regions YAML) and `exportRegionsMetaYAML` (regions-meta).
- [x] Fix any other bugs discovered during testing (none)
- [x] Re-test fixed functionality
- [x] Update documentation if needed (spec updated)

## Testing Requirements

*Manual QA completed; all items below verified.*

### Functional Tests
- [x] Nether can be selected in SeedInfoHeading
- [x] Nether can be selected in MapLoaderControls
- [x] World size slider appears for Nether
- [x] World size slider works correctly for Nether
- [x] API receives correct size parameter for Nether dimension (selected size, no conversion)
- [x] Coordinates are correct for loaded image dimension (no conversion needed)
- [x] Map generation works with Nether dimension
- [x] Region creation works in Nether
- [x] Region names use nether-style generation (name generator uses dimension from seedInfo)
- [x] YAML export works for Nether regions
- [x] Spawn regions are excluded for Nether
- [x] Villages are excluded from nether exports
- [x] regions-meta export works correctly for Nether (correct recipeIds, no onboarding/spawnCenter, no villageBandStrategy, filename `nether-regions-meta.yml`)
- [x] Spawn marker not shown on map for nether; Villages/Orphaned hidden in Display dropup for nether
- [x] Export/import preserves Nether dimension

### Edge Cases
- [x] Switching between Overworld and Nether
- [x] World size persistence across dimension switches (each dimension has independent size)
- [x] Export file with Nether dimension
- [x] Import file with Nether dimension
- [x] Coordinate boundaries are correct for the loaded image dimension

## Known Limitations

1. **End Dimension**: Remains disabled and will be handled in separate spec
2. **Spawn Regions**: Nether does not support spawn regions (by design). The entire Spawn section in Advanced Tools, spawn marker on map, "Has Spawn" checkbox, and spawn region export options are hidden for nether.
3. **Onboarding**: Nether does not support onboarding (first-join teleport). Onboarding section is never exported for nether.
4. **Villages**: Villages don't exist in nether. The Villages section in Advanced Tools and the Villages (and Orphaned Villages) options in the Display dropup are hidden for nether. Villages are never exported for nether. The `nether_village` recipeId does not exist and must be removed from code.
5. **Nether Size**: Nether world size is independent of overworld size. Users select the size they need (2k-16k), and portal restrictions are handled in-game.
6. **Hearts**: (Not nether-specific.) Hearts are only exported (regions YAML and regions-meta) when a region has a **set** heart (`centerPoint != null`). Regions without a set heart do not get a `heart_of_*` entry.

## Success Criteria

- [x] Nether is fully enabled in UI (no disabled flags)
- [x] World size slider works for Nether dimension
- [x] All Nether functionality works end-to-end
- [x] No regressions in Overworld functionality
- [x] All tests pass
- [x] Documentation updated if needed (spec updated)

## Completion Status

**Complete.** Implementation and manual testing are done. Achievements and event conditions generation have been removed from the app and are no longer in scope for this spec.

## Dependencies

- **Prerequisite**: `remove-worldtype-setting-spec.md` must be completed first. After the refactor, `dimension` will be the single source of truth, making this implementation straightforward.

## Post-Implementation Updates

The following decisions and changes were made during implementation and are now part of the spec:

| Change | Location | Notes |
|--------|----------|--------|
| Hide **entire** Spawn section for nether | `AdvancedPanel` | Whole "Spawn" collapsible omitted when `dimension === 'nether'`. |
| Hide **entire** Villages section for nether | `AdvancedPanel` | Whole "Villages" collapsible omitted when `dimension === 'nether'`. |
| Hide spawn marker on map for nether | `MapCanvas` → `RegionOverlay` | Pass `spawnCoordinates={null}` when nether so red spawn marker + label are not drawn. |
| Hide Villages / Orphaned in Display dropup for nether | `MapDisplayControls` | Accept `dimension` prop; show village toggles only when `dimension !== 'nether'`. |
| regions-meta filename for nether | `exportUtils.exportRegionsMetaYAML` | Use **`nether-regions-meta.yml`** when `dim === 'nether'`; otherwise `regions-meta.yml`. |
| Omit `villageBandStrategy` for nether | `exportUtils.exportRegionsMetaYAML` | In `levelledMobs`, include `villageBandStrategy: 'easy'` only when `dim !== 'nether'`. |
| Export hearts only when set | `polygonUtils.generateRegionYAML`, `exportUtils.exportRegionsMetaYAML` | **Not nether-specific.** Only output `heart_of_*` when `region.centerPoint != null`. Applies to both regions YAML and regions-meta. |

## Next Steps

After completing this spec:
1. Proceed to `end-dimension-addition-spec.md` to add End dimension support
