# World Seed & Dimension Management Specification

## Status: ✅ IMPLEMENTED

**Implementation Date**: Completed  
**Known Issues**: See "Known Issues & Future Refactoring" section below

## Overview
This specification outlines the implementation of world seed and dimension management to ensure critical seed information is properly captured, displayed, edited, and persisted across all map loading scenarios.

## Problem Statement
Currently, when users generate or load map images, the seed information is not reliably stored or displayed. This is problematic because:
1. Seed information is crucial for Minecraft world generation and reproducibility
2. Users need to know and save the seed for their regions to be meaningful
3. Seed information is lost when exporting/importing projects
4. Different map loading methods (Generate, Load URL, Import) handle seed inconsistently

## Goals
1. **Display**: Show seed and dimension prominently on Regions tab, editable inline
2. **Capture**: Unified World Details section at top of Map tab (seed/dimension shared by all methods)
3. **Persistence**: Save seed/dimension to localStorage with dedicated key
4. **Export/Import**: Include seed/dimension in project save/load files
5. **Consistency**: Ensure seed is captured regardless of how map is loaded
6. **UX**: Consistent preview → import flow for both Generate and Load from URL

## Requirements

### 1. Display & Edit (Regions Tab)
- Display seed and dimension below world name heading
- Both fields should be editable inline (click to edit)
- Display "Not set" when empty
- Auto-save to localStorage on change
- Visual indicator (pencil icon) for editability

### 2. Storage
- Dedicated localStorage key: `mc-region-maker-world-seed`
- Store as JSON object: `{ seed?: string, dimension?: string }`
- Persist across browser sessions
- Clear when clearing all data

### 3. Map Tab UI Structure

#### New Layout:
```
┌─────────────────────────────────────┐
│ World Details                        │
│ ┌─────────────────────────────────┐  │
│ │ Seed: [input]                  │  │
│ │ Dimension: [dropdown]           │  │
│ └─────────────────────────────────┘  │
│ (Shared by both Generate and Load)   │
├─────────────────────────────────────┤
│ Map Image                            │
│                                      │
│ 1. Generate from Seed                │
│    World Size: [slider]              │
│    [Generate Map Image]              │
│    ↓ (shows preview)                │
│    [Preview with Import Map button]  │
│                                      │
│ 2. Load from URL                     │
│    URL: [input]                      │
│    [Load]                            │
│    ↓ (shows preview)                 │
│    [Preview with Import Map button]  │
└─────────────────────────────────────┘
```

#### 3.1 World Details Section (Top of Map Tab)
- **Location**: Top of MapLoaderControls component
- **Fields**: 
  - Seed input (text/number)
  - Dimension dropdown (overworld/nether/end)
- **Behavior**:
  - Shared state from `useSeedInfo` hook
  - Auto-saves to localStorage on change
  - Loaded from localStorage on mount
  - Used by both Generate and Load from URL methods

#### 3.2 Generate Map from Seed Flow
- **Uses**: Seed/dimension from World Details + world size slider
- **Flow**:
  1. User sets World Details (seed, dimension)
  2. User sets world size slider (for overworld only)
  3. Click "Generate Map Image" → async generation with polling
  4. Preview appears with generated image
  5. Click "Import Map" → saves seed/dimension to localStorage + loads image into canvas

#### 3.3 Load from URL Flow
- **Uses**: Seed/dimension from World Details
- **Flow**:
  1. User sets World Details (seed, dimension)
  2. User enters image URL
  3. Click "Load" → fetches image and shows preview (does NOT load into canvas yet)
  4. Preview appears with loaded image
  5. Click "Import Map" → saves seed/dimension to localStorage + loads image into canvas

#### 3.4 Unified Import Functionality
- **Both methods use same "Import Map" button**
- **Function**: `handleImportMap(previewImageUrl)`
- **Behavior**:
  - Saves seed/dimension from World Details to localStorage (via useSeedInfo)
  - Loads preview image into main canvas
  - Clears preview state
  - Handles confirmation if existing data exists

#### 3.5 Import via Router State (ImageImportHandler)
- **Current**: Clears seed data
- **Required**: Optionally accept seed/dimension from location.state
- **Required**: If provided, populate World Details section
- **Required**: If not provided, leave World Details as-is (don't clear)

#### 3.6 Load Complete Map Export
- **Current**: Seed/dimension not included in export file
- **Required**: Include seed/dimension in export JSON
- **Required**: Restore seed/dimension to World Details section when loading export file

### 4. Export/Import Format

#### Export File Structure
```json
{
  "version": "1.0.0",
  "worldName": "...",
  "seed": "12345",
  "dimension": "overworld",
  "regions": [...],
  "mapState": {...},
  "spawnCoordinates": {...},
  "worldType": "overworld",
  "exportDate": "...",
  "imageData": "...",
  "imageFilename": "..."
}
```

#### Import Behavior
- Restore seed/dimension if present in export file
- If seed/dimension missing (legacy files), clear current values (intentional - user is loading a new project)
- Update localStorage immediately on import

## Implementation Details

### New Files

#### `src/hooks/useSeedInfo.ts`
- Custom hook for seed/dimension state management
- Load from localStorage on mount
- Save to localStorage on update
- Return: `{ seedInfo: { seed?, dimension? }, updateSeedInfo: (info) => void }`

#### `src/components/SeedInfoHeading.tsx`
- Inline-editable seed and dimension display
- Similar pattern to `WorldNameHeading.tsx`
- Click to edit, Enter to save, Escape to cancel
- Dimension uses dropdown: overworld/nether/end
- **Note**: "none" option was considered but not implemented (not needed)
- **Known Issue**: Currently uses `worldType` as fallback for dimension display, which can cause confusion (will be fixed in unification refactor)

### Modified Files

#### `src/context/AppContext.tsx`
- Add `useSeedInfo()` hook
- Include `seedInfo` in context provider

#### `src/components/RegionPanel.tsx`
- Import `SeedInfoHeading`
- Render below `WorldNameHeading`

#### `src/components/MapLoaderControls.tsx`
**Major Restructure:**
1. **Add World Details section at top**:
   - Use `seedInfo` from context (useSeedInfo hook)
   - Seed input field connected to `seedInfo.seedInfo.seed`
   - Dimension dropdown connected to `seedInfo.seedInfo.dimension`
   - Auto-saves via `seedInfo.updateSeedInfo()` on change

2. **Unified preview state**:
   - Create `previewImageUrl` state (for both generate and URL)
   - Both flows populate this state
   - Both show same preview component

3. **Update Generate flow**:
   - Uses seed/dimension from World Details section
   - Generates map → sets `previewImageUrl`
   - Shows preview with "Import Map" button

4. **Update Load from URL flow**:
   - Uses seed/dimension from World Details section
   - Loads image → sets `previewImageUrl` (does NOT load into canvas)
   - Shows preview with "Import Map" button

5. **Unified Import Map function**:
   - Single `handleImportMap(previewImageUrl)` function
   - Saves seed/dimension from World Details to localStorage
   - Loads preview image into main canvas
   - Clears preview state
   - Handles confirmation for existing data

6. **Remove direct image loading**:
   - `handleUrlSubmit()` no longer directly calls `handleImageUrl()`
   - `handleImageUrl()` renamed/refactored to `loadImageToPreview()`

#### `src/components/MainApp.tsx`
**Changes:**
1. Access `seedInfo` from context
2. Update `handleSave()` to pass seed/dimension to `exportCompleteMap()`
3. Update `handleFileImport()` to restore seed/dimension from import data

#### `src/utils/exportUtils.ts`
**Changes:**
1. Add `seed?: string` and `dimension?: string` to `MapExportData` interface
2. Update `exportCompleteMap()` signature to accept seed/dimension parameters
3. Include seed/dimension in export data object

#### `src/utils/persistenceUtils.ts`
**Changes:**
1. Add `WORLD_SEED: 'mc-region-maker-world-seed'` to STORAGE_KEYS
2. Update `clearSavedData()` to clear seed info

#### `src/components/ImageImportHandler.tsx`
**Changes:**
1. Clear seed info on import (unless provided in location.state)
2. Optionally accept seed/dimension from `location.state?.seed` and `state?.dimension`

### Race Condition Fix
The current issue where seed/dimension could be lost during import:

**Solution**: 
- Seed/dimension stored in World Details section (from useSeedInfo hook) before any import
- Import Map button saves seed/dimension to localStorage FIRST, then loads image
- No race condition because seed/dimension are already set in World Details before import occurs

## User Flows

### Flow 1: Generate Map from Seed
1. User sets World Details (seed, dimension) at top of Map tab
2. User sets world size slider (for overworld only)
3. User clicks "Generate Map Image"
4. Map generates (30-60 seconds) and preview displays
5. User clicks "Import Map" button
6. Seed and dimension are saved to localStorage (from World Details)
7. Preview image loads into main canvas
8. User sees seed/dimension displayed on Regions tab (from localStorage)

### Flow 2: Load from URL
1. User sets World Details (seed, dimension) at top of Map tab
2. User enters image URL
3. User clicks "Load"
4. Image fetches and preview displays (image NOT loaded into canvas yet)
5. User clicks "Import Map" button
6. Seed and dimension are saved to localStorage (from World Details)
7. Preview image loads into main canvas
8. User sees seed/dimension displayed on Regions tab (from localStorage)

### Flow 3: Edit Seed on Regions Tab
1. User clicks on "Seed: Not set" (or existing seed)
2. Input field appears with current value
3. User types new seed, presses Enter (or clicks away)
4. Seed saved to localStorage immediately
5. Display updates
6. World Details section on Map tab also updates (shared state)

### Flow 4: Save Project
1. User has regions and seed/dimension set (in World Details)
2. User clicks "Save" button
3. Export file includes seed and dimension (from seedInfo hook)
4. File downloads with embedded seed info

### Flow 5: Load Project
1. User clicks "Load" and selects exported JSON file
2. Import data includes seed/dimension
3. Seed/dimension restored to World Details section on Map tab
4. Seed/dimension also displayed on Regions tab (both from same source)

## Edge Cases

### Legacy Export Files
- Files without seed/dimension fields should import successfully
- When loading a project file, seed/dimension are cleared if not present (intentional - user is loading a new project, should start fresh)

### Empty Values
- Seed can be empty string (user clears it)
- Dimension defaults to 'overworld' if not set
- Both fields optional but seed is recommended for map generation

### Multiple Import Methods
- World Details section maintains seed/dimension state across all operations
- If user generates map with seed X, then loads URL - World Details still shows seed X
- User can update World Details at any time
- Import Map button always uses current World Details values

### Browser Storage Limits
- Handle localStorage quota errors gracefully
- Log warnings if save fails

## Testing Checklist

- [x] Seed/dimension displayed on Regions tab
- [x] Inline editing works for both fields
- [x] Changes persist to localStorage
- [x] Generate Map → Import sets seed correctly
- [x] Load from URL captures seed/dimension
- [x] Save project includes seed/dimension in file
- [x] Load project restores seed/dimension (clears if missing - intentional)
- [x] Legacy files without seed import successfully
- [x] Clearing all data clears seed/dimension
- [x] Dimension dropdown shows correct options (overworld/nether/end)
- [x] Seed field accepts text and numbers
- [x] Race condition fixed (seed persists after import)

## Migration Notes

### Existing Users
- Users with existing projects (no seed in exports): seed will be empty initially
- Users can manually enter seed in Regions tab after loading project
- localStorage will be populated on first use

### Data Format
- Old format (ImageDetails): Still used but separate from seed storage
- New format (WorldSeed): Dedicated storage for seed/dimension only
- Both can coexist during transition

## Known Issues & Future Refactoring

### WorldType / Dimension Unification

**Issue**: There is conceptual duplication between `worldType` and `dimension`:
- `worldType`: Only supports `'overworld' | 'nether'` (used for name generation)
- `dimension`: Supports `'overworld' | 'nether' | 'end'` (used for seed/map generation)

**Impact**: 
- Confusion in `SeedInfoHeading.tsx` which uses `worldType` as fallback for `dimension` display
- Two separate storage locations for essentially the same concept
- Export files contain both fields

**Solution**: See `spec/worldtype-dimension-unification-spec.md` for refactoring plan to unify these concepts.

**Status**: Spec created, implementation pending

## Future Enhancements
- Auto-detect seed from map image metadata (if available)
- Seed validation (Minecraft seed format)
- Quick copy seed to clipboard button
- Seed history/autocomplete
- Unify worldType and dimension (see unification spec above)

