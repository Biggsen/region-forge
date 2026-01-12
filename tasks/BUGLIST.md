# 🐛 Bug List

## Open Issues

### World Size Slider for Nether and End Dimensions
**Priority:** Medium  
**Status:** Open

**Description:** The Nether and End dimensions should have world size slider controls, similar to the Overworld dimension.

**Issue:**
- Currently, world size slider may only be available for Overworld dimension
- Nether and End dimensions should also allow users to adjust world size independently

**Affected Components:**
- World size controls (likely `WorldSizeHeading.tsx` or related components)
- Dimension selection/world type management (likely `useWorldType.ts` or related hooks)

**Expected Behavior:**
- World size slider should be available and functional for all dimensions (Overworld, Nether, End)
- Each dimension should maintain its own world size setting if applicable

---

## Resolved Issues

### Region Creation Without Map Import
**Priority:** High  
**Status:** Resolved

**Description:** Users can start creating a region even when no map has been imported, which should be prevented.

**Original Issue:**
- Region creation should be disabled or blocked until a map is loaded
- Currently allows users to attempt region creation without a map context

**Solution Implemented:**
- "Create New Region" button is disabled when no map is loaded (`RegionCreationForm.tsx`)
- Clear message displayed: "To create regions, you need to import a map first."
- Tooltip on disabled button: "Please import a map first from the Map tab"
- Button state controlled by `hasMap` prop, which checks `mapState.image`

**Affected Components:**
- `src/components/RegionCreationForm.tsx` - Button disabled state and messaging
- `src/components/RegionPanel.tsx` - Passes `hasMap={!!mapState.image}` to form

**Notes:**
- The fix prevents users from starting region creation without a map
- If a map is removed after regions are created, regions remain valid and can be used once a map is added again
- This approach is sufficient as regions can always be associated with a map later

---

### Image Validation
**Priority:** High  
**Status:** Resolved  
**Resolved Date:** [Current Date]

**Description:** Images loaded from URL are not validated for size limits or square dimensions.

**Original Issue:**
- No validation that images are square (width === height)
- No maximum size limit enforced
- No minimum size limit enforced
- Code assumes square images for world size calculation and origin auto-setting
- Large images may cause performance issues

**Solution Implemented:**
- Added validation function `validateImageDimensions()` that checks:
  - Image must be square (width === height)
  - Minimum size: 250x250 pixels
  - Maximum size: 2000x2000 pixels
- Validation added to all image loading paths:
  - `MapLoaderControls.tsx` - `handleLoadFromUrl()` (validates before preview) and `loadImageToCanvas()` (validates before setting image)
  - `ImageImportHandler.tsx` - validates after image loads from router state
  - `MainApp.tsx` - validates images loaded from project file imports (both base64 and URL formats)
  - `persistenceUtils.ts` - validates images loaded from localStorage
- Clear error messages displayed with current dimensions when validation fails
- Separate error state for URL loading errors, displayed above the "Load" button in the "Load from URL" section

**Affected Components:**
- `src/components/MapLoaderControls.tsx` - `handleLoadFromUrl()` and `loadImageToCanvas()`
- `src/components/ImageImportHandler.tsx` - image loading logic
- `src/components/MainApp.tsx` - project file import handling
- `src/utils/persistenceUtils.ts` - localStorage image loading

**Notes:**
- Generated maps from the microservice are always 1000x1000, so validation primarily affects URL-loaded images
- World size calculation formula assumes square images: `imageSize / 125 = worldSize` (e.g., 750x750 = 6k)

