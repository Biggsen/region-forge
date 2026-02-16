# Dual Map Layers (Terrain + Biome) Specification

## Overview

This specification defines the technical requirements for supporting **two map layers** in Region Forge: a **Terrain** layer (elevation/heightmap) and a **Biome** layer (biome color map). Currently, "Generate Map Image" imports only a single map—either terrain or biome depending on the MC Map Generator configuration. The goal is to allow both layers to be loaded, displayed, and manipulated independently.

## Goals

1. Support importing and displaying both terrain and biome maps simultaneously
2. Allow users to control layer visibility and opacity
3. Use the biome layer for region biome scanning (color-to-biome matching)
4. Maintain backward compatibility with single-image projects and imports
5. Integrate with MC Map Generator when it provides dual outputs

---

## Current Architecture

### Map State
- **Location:** `src/types.ts`, `src/hooks/useMapState.ts`
- **Structure:** `MapState` holds a single `image: HTMLImageElement | null`
- **Rendering:** `MapCanvas` draws `mapState.image` once in `drawMap`
- **Biome Scanner:** `biomeScanner.ts` samples the single map image for pixel colors

### Import Paths
1. **MC Map Generator** – Generate from seed → `imageUrl`/`terrainUrl` from `/api/status/{jobId}`; overworld also returns `biomeUrl` but Region Forge currently imports only one
2. **Load from URL** – Single URL input
3. **Project file import** – `MapExportData` with `imageData` (base64) or `imageSrc`
4. **Router state** – `ImageImportHandler` receives `importImage` URL

### Persistence
- `saveMapState` / `loadMapState` – single image source in localStorage
- Export embeds single `imageData` in project JSON

---

## Proposed Architecture

### 1. Map State Model

**File:** `src/types.ts`

Extend `MapState` to support two layers:

```typescript
export type MapState = {
  // Primary display image (backward compatibility - see Migration)
  image: HTMLImageElement | null

  // Dual layer support
  terrainImage: HTMLImageElement | null
  biomeImage: HTMLImageElement | null

  // Layer visibility and opacity
  terrainVisible: boolean
  terrainOpacity: number
  biomeVisible: boolean
  biomeOpacity: number

  // Existing fields
  scale: number
  offsetX: number
  offsetY: number
  isDragging: boolean
  lastMousePos: { x: number; y: number } | null
  originSelected: boolean
  originOffset: { x: number; y: number } | null
  imageOpacity: number  // Global/image-layer opacity (kept for single-image mode)
}
```

**Derived display logic:**
- When both `terrainImage` and `biomeImage` are set → use dual-layer compositing
- When only one is set → treat as single-image mode (display that layer)
- When neither is set but `image` is set → legacy single-image mode

### 2. Canvas Rendering

**File:** `src/components/MapCanvas.tsx`

Update `drawMap` to composite layers:

1. Determine effective layers based on state
2. Draw terrain layer first (base) if `terrainVisible` and `terrainImage` exists
3. Draw biome layer on top if `biomeVisible` and `biomeImage` exists
4. Apply respective opacity via `ctx.globalAlpha` for each layer
5. Fall back to single `image` when in legacy mode

**Compositing order:** Terrain (bottom) → Biome (top). Both layers must have matching dimensions; validate on load.

### 3. Biome Scanner

**File:** `src/utils/biomeScanner.ts`

- Accept an `image` parameter (unchanged signature)
- Callers must pass the **biome layer** when available: `biomeImage ?? terrainImage ?? image`
- If only terrain is loaded, biome scan should either return empty/null or show a helpful message (e.g., "Load a biome map to scan biomes")

**File:** `src/components/RegionDetailsView.tsx`

- Update `scanBiomes` call to pass the appropriate image: prefer `biomeImage`, fallback to `terrainImage`, then `image`

### 4. MC Map Generator Integration

**Note:** The MC Map Generator API already supports dual outputs for `overworld` dimension. See `reference/mc-map-generator API docs.md`.

**Status response (overworld, ready):** Returns `terrainUrl`, `biomeUrl`, and `imageUrl` (alias for `terrainUrl`). Nether/End return only `terrainUrl` and `imageUrl`.

```json
{
  "success": true,
  "jobId": "...",
  "status": "ready",
  "terrainUrl": "https://.../seed-overworld-8k-xxx.png",
  "biomeUrl": "https://.../seed-overworld-8k-biome-xxx.png",
  "imageUrl": "https://.../seed-overworld-8k-xxx.png",
  "metadata": { ... }
}
```

**Fallback:** For nether/end (or if `biomeUrl` absent), use `terrainUrl` or `imageUrl` for terrain layer; biome layer remains null.

**File:** `src/components/MapLoaderControls.tsx`

- Parse `terrainUrl` and `biomeUrl` from status response
- Load both images in parallel when available
- Validate dimensions match between layers
- Call `setTerrainImage` and `setBiomeImage` (or equivalent)
- If dimensions mismatch, show error and do not import

### 5. Map State Hook

**File:** `src/hooks/useMapState.ts`

Add setters:
- `setTerrainImage(image: HTMLImageElement | null)`
- `setBiomeImage(image: HTMLImageElement | null)`
- `setTerrainOpacity(opacity: number)`
- `setBiomeOpacity(opacity: number)`
- `setTerrainVisible(visible: boolean)`
- `setBiomeVisible(visible: boolean)`

Update `setImage` to maintain backward compatibility:
- When setting a single image in legacy flow, populate `terrainImage` and `biomeImage` as appropriate (e.g., both set to same image, or terrain only)

### 6. Persistence

**File:** `src/utils/persistenceUtils.ts`

- `saveMapState`: Persist `terrainImage` and `biomeImage` sources (URL or omit if data URI). Use keys: `terrainImageSrc`, `biomeImageSrc` or embed in structure.
- `loadMapState`: Restore both images from stored sources; handle legacy state with only `image`/`imageSrc`

### 7. Import/Export

**File:** `src/utils/exportUtils.ts`

**MapExportData extension:**
```typescript
export interface MapExportData {
  // ... existing fields ...
  imageData?: string           // Legacy single image
  terrainImageData?: string    // Base64 terrain layer
  biomeImageData?: string     // Base64 biome layer
  imageFilename?: string
  terrainImageFilename?: string
  biomeImageFilename?: string
}
```

**Export logic:**
- When dual layers: embed `terrainImageData` and `biomeImageData`
- When single image (legacy): keep `imageData` as-is

**Import logic:**
- If `terrainImageData` and/or `biomeImageData` present → load into respective layers
- If only `imageData` present → load into `image` and set `terrainImage` (legacy mode)
- Validate dimensions when both layers present

### 8. Project File Import

**File:** `src/components/MainApp.tsx`

- Handle `terrainImageData` and `biomeImageData` in import flow
- Apply same validation as other import paths

**File:** `src/components/AdvancedPanel.tsx`

- Same handling for project file import

### 9. Load from URL

**Option A (MVP):** Two URL inputs – "Terrain Map URL" and "Biome Map URL". User can fill one or both.
**Option B:** Single URL that loads into terrain; add optional "Biome Map URL" field.

Recommendation: Option A for clarity. Both optional; at least one required.

**File:** `src/components/MapLoaderControls.tsx`

- Add `terrainUrl` and `biomeUrl` (or extend existing URL section)
- Load both when provided; validate dimensions match
- Preview could show composited result or tabs for each layer

### 10. Router / ImageImportHandler

**File:** `src/components/ImageImportHandler.tsx`

- Extend `location.state` to support:
  - `importTerrainImage?: string`
  - `importBiomeImage?: string`
  - `importImage?: string` (legacy, maps to terrain)

### 11. Layer Controls UI

**File:** `src/components/MapDisplayControls.tsx` (or new `MapLayerControls.tsx`)

Add controls:
- Terrain: visibility toggle, opacity slider
- Biome: visibility toggle, opacity slider
- Ensure both layers can be shown together with configurable blend

Placement: Expand existing "Display" panel or add a "Layers" section in Map tab sidebar.

---

## Migration & Backward Compatibility

### Legacy Projects
- Projects with only `imageData` or `imageSrc` load as before
- Set `terrainImage = loadedImage`, `biomeImage = null`
- Rendering uses single-layer path

### Legacy Map State (localStorage)
- `loadMapState` checks for `terrainImageSrc` / `biomeImageSrc`
- If absent but `image`/`imageSrc` exists → migrate to `terrainImage` and `terrainImageSrc`

### Default Values
- `terrainVisible: true`, `terrainOpacity: 1`
- `biomeVisible: true`, `biomeOpacity: 0.8` (slight transparency to see terrain beneath)
- New projects with dual layers get these defaults

---

## Validation Rules

1. **Dimension match:** When both terrain and biome are loaded, `terrainImage.width/height` must equal `biomeImage.width/height`. Reject mismatch with clear error.
2. **At least one layer:** Either `image` (legacy) or at least one of `terrainImage`/`biomeImage` must be set for the map to be usable.
3. **Image validation:** Reuse `validateImageDimensions` for each layer.

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Terrain and biome dimension mismatch | Show error toast, do not import; suggest user check sources |
| MC Map Generator returns only one URL | Import that as terrain; biome remains null |
| Project file has only legacy imageData | Load as terrain; biome null |
| CORS on layer URL | Same as current: use proxy; if export fails, prompt to save image separately |

---

## Implementation Phases

### Phase 1: Data Model & Rendering
- [ ] Extend `MapState` in types
- [ ] Update `useMapState` with new fields and setters
- [ ] Update `MapCanvas` draw logic for dual layers
- [ ] Add layer visibility/opacity controls
- [ ] Update persistence (save/load) for dual layers

### Phase 2: Biome Scanner & Display
- [ ] Update biome scanner to use biome layer
- [ ] Update RegionDetailsView to pass correct image
- [ ] Handle "biome map not loaded" state in Scan biomes UI

### Phase 3: Import Paths
- [ ] Extend project file import/export
- [ ] Add dual-URL input for Load from URL (or extend UI)
- [ ] Update ImageImportHandler for router state
- [ ] Integrate MC Map Generator dual-URL response (`terrainUrl`, `biomeUrl` from status)

### Phase 4: Polish
- [ ] Migration for legacy localStorage state
- [ ] Update documentation
- [ ] Manual testing of all import/export paths

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types.ts` | Extend MapState |
| `src/hooks/useMapState.ts` | New fields, setters |
| `src/components/MapCanvas.tsx` | Dual-layer draw logic |
| `src/components/MapDisplayControls.tsx` | Layer visibility/opacity toggles |
| `src/utils/biomeScanner.ts` | Document that caller passes biome layer |
| `src/components/RegionDetailsView.tsx` | Pass biome image to scanBiomes |
| `src/utils/persistenceUtils.ts` | Save/load both layers |
| `src/utils/exportUtils.ts` | Extend MapExportData, export/import logic |
| `src/components/MapLoaderControls.tsx` | Dual URL inputs, MC Map Generator integration |
| `src/components/MainApp.tsx` | Import handling for dual layers |
| `src/components/AdvancedPanel.tsx` | Import handling for dual layers |
| `src/components/ImageImportHandler.tsx` | Router state for dual images |

---

## MC Map Generator (External Dependency)

The MC Map Generator **already returns** dual outputs for overworld dimension:

- **Overworld:** `terrainUrl` + `biomeUrl` (both 1000×1000 PNG, same dimensions)
- **Nether/End:** `terrainUrl` / `imageUrl` only (single image)

No API changes required. Region Forge needs to:

- Poll `GET /api/status/{jobId}` and parse `terrainUrl` and `biomeUrl` when `status === "ready"`
- Load both images in parallel for overworld; populate terrain and biome layers
- For nether/end, use `terrainUrl` or `imageUrl` for terrain layer only

---

## Success Criteria

- [ ] Both terrain and biome layers can be loaded and displayed
- [ ] Layer visibility and opacity are user-configurable
- [ ] Biome scanner uses the biome layer when available
- [ ] Legacy single-image projects load correctly
- [ ] Project export/import round-trips both layers
- [ ] Load from URL supports loading terrain and biome independently
- [ ] Clear errors when dimensions mismatch
- [ ] No regressions in single-image workflows

---

## Future Enhancements

- Blend modes between layers (multiply, overlay, etc.)
- Layer order control (terrain on top vs biome on top)
- Separate opacity for export (e.g., export composited preview)
- Support for more than two layers (e.g., structures overlay)
