# Low-Hanging Fruit Refactor Specification

## Overview
This specification outlines quick-win refactoring opportunities that will improve code quality, maintainability, and consistency across the codebase. These are low-risk, high-impact changes that can be implemented incrementally without major architectural changes.

## Problem Statement

The codebase has accumulated several patterns that reduce maintainability and increase technical debt:

1. **Duplicate Constants**: Image size limits (`MIN_SIZE = 250`, `MAX_SIZE = 2000`) are duplicated across 4 files
2. **Duplicate Validation Logic**: Image validation function is implemented in multiple places with slight variations
3. **Magic Numbers**: Hardcoded values like sidebar width (`384`) appear in multiple locations
4. **Poor Error UX**: 20+ instances of `alert()` calls instead of proper user feedback
5. **Type Safety Issues**: `as any` type assertions bypass TypeScript's type checking
6. **Code Duplication**: Similar logic patterns repeated (sort buttons, proxy URL construction, zoom calculations)
7. **Formatting Issues**: Excessive blank lines and inconsistent formatting

## Goals

1. **Eliminate Duplication**: Extract shared constants and utilities to single source of truth
2. **Improve Type Safety**: Remove `as any` assertions and use proper types
3. **Enhance User Experience**: Replace `alert()` calls with proper toast/notification system
4. **Increase Maintainability**: Extract complex logic into reusable utilities
5. **Improve Code Quality**: Clean up formatting and remove unused code

## Solution

### 1. Extract Constants to Shared File

**Priority:** High  
**Impact:** Reduces duplication, makes values easier to update

Create `src/utils/constants.ts`:

```typescript
// Image validation constants
export const IMAGE_MIN_SIZE = 250
export const IMAGE_MAX_SIZE = 2000

// UI layout constants
export const SIDEBAR_WIDTH = 384 // w-96 = 384px in Tailwind

// Zoom constants
export const ZOOM_PADDING = 0.2 // 20% padding for zoom to fit
export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 5

// Canvas constants
export const DEFAULT_SCALE = 1
```

**Files to Update:**
- `src/components/MainApp.tsx` - Replace local constants
- `src/components/MapLoaderControls.tsx` - Replace local constants
- `src/components/ImageImportHandler.tsx` - Replace local constants
- `src/utils/persistenceUtils.ts` - Replace local constants
- `src/components/RegionPanel.tsx` - Use `SIDEBAR_WIDTH`
- `src/components/MapCanvas.tsx` - Use `SIDEBAR_WIDTH`
- `src/components/MapLoaderControls.tsx` - Use `SIDEBAR_WIDTH` for canvas calculations

### 2. Extract Image Validation Function

**Priority:** High  
**Impact:** Single source of truth for validation logic

Create `src/utils/imageValidation.ts`:

```typescript
import { IMAGE_MIN_SIZE, IMAGE_MAX_SIZE } from './constants'

export interface ValidationResult {
  isValid: boolean
  error: string | null
}

export function validateImageDimensions(width: number, height: number): ValidationResult {
  if (width !== height) {
    return {
      isValid: false,
      error: `Image must be square (width and height must be equal). Current dimensions: ${width}x${height}`
    }
  }
  
  if (width < IMAGE_MIN_SIZE || height < IMAGE_MIN_SIZE) {
    return {
      isValid: false,
      error: `Image is too small. Minimum size is ${IMAGE_MIN_SIZE}x${IMAGE_MIN_SIZE}. Current dimensions: ${width}x${height}`
    }
  }
  
  if (width > IMAGE_MAX_SIZE || height > IMAGE_MAX_SIZE) {
    return {
      isValid: false,
      error: `Image is too large. Maximum size is ${IMAGE_MAX_SIZE}x${IMAGE_MAX_SIZE}. Current dimensions: ${width}x${height}`
    }
  }
  
  return { isValid: true, error: null }
}
```

**Files to Update:**
- `src/components/MainApp.tsx` - Replace `validateImageDimensions` function
- `src/components/MapLoaderControls.tsx` - Replace `validateImageDimensions` function
- `src/components/ImageImportHandler.tsx` - Use shared validation function
- `src/utils/persistenceUtils.ts` - Use shared validation function

### 3. Extract Image Proxy URL Utility

**Priority:** Medium  
**Impact:** Reduces duplication, centralizes proxy logic

Create `src/utils/imageUtils.ts`:

```typescript
export function getImageProxyUrl(imageUrl: string): string {
  const isProduction = import.meta.env.PROD
  const proxyUrl = isProduction 
    ? '/api/proxy-image' 
    : 'http://localhost:3002/api/proxy-image'
  
  // Only proxy external HTTP(S) URLs, not localhost
  if (imageUrl.startsWith('http') && !imageUrl.includes('localhost')) {
    return `${proxyUrl}?url=${encodeURIComponent(imageUrl)}`
  }
  
  return imageUrl
}

export function createImageElement(src: string): HTMLImageElement {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = src
  return img
}
```

**Files to Update:**
- `src/components/ImageImportHandler.tsx` - Use `getImageProxyUrl()`
- `src/components/MapLoaderControls.tsx` - Use `getImageProxyUrl()` if similar logic exists

### 4. Extract Zoom Calculation Utility

**Priority:** Medium  
**Impact:** Reusable zoom logic, cleaner component code

Create `src/utils/zoomUtils.ts`:

```typescript
import { SIDEBAR_WIDTH, ZOOM_PADDING, MIN_ZOOM, MAX_ZOOM } from './constants'
import { worldToPixel } from './coordinateUtils'

export interface ZoomToFitResult {
  scale: number
  offsetX: number
  offsetY: number
}

export function calculateZoomToFitRegion(
  regionPoints: { x: number; z: number }[],
  imageWidth: number,
  imageHeight: number,
  originOffset: { x: number; y: number } | null
): ZoomToFitResult | null {
  if (regionPoints.length < 2) {
    return null
  }

  // Convert all region points from world coordinates to pixel coordinates
  const pixelPoints = regionPoints.map(point => 
    worldToPixel(point.x, point.z, imageWidth, imageHeight, originOffset)
  )

  // Calculate bounding box in pixel coordinates
  const minX = Math.min(...pixelPoints.map(p => p.x))
  const maxX = Math.max(...pixelPoints.map(p => p.x))
  const minY = Math.min(...pixelPoints.map(p => p.y))
  const maxY = Math.max(...pixelPoints.map(p => p.y))

  const width = maxX - minX
  const height = maxY - minY
  
  if (width <= 0 || height <= 0) {
    return null
  }
  
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  // Calculate available canvas space (accounting for sidebar)
  const canvasWidth = window.innerWidth - SIDEBAR_WIDTH
  const canvasHeight = window.innerHeight

  // Add padding
  const availableWidth = canvasWidth * (1 - ZOOM_PADDING * 2)
  const availableHeight = canvasHeight * (1 - ZOOM_PADDING * 2)

  // Calculate scale to fit the region
  const scaleX = availableWidth / width
  const scaleY = availableHeight / height
  const newScale = Math.max(MIN_ZOOM, Math.min(scaleX, scaleY, MAX_ZOOM))

  if (!isFinite(newScale) || newScale <= 0) {
    return null
  }

  // Calculate offset to center the region on canvas
  const canvasCenterX = canvasWidth / 2
  const canvasCenterY = canvasHeight / 2
  const newOffsetX = canvasCenterX - centerX * newScale
  const newOffsetY = canvasCenterY - centerY * newScale

  return {
    scale: newScale,
    offsetX: newOffsetX,
    offsetY: newOffsetY
  }
}
```

**Files to Update:**
- `src/components/RegionPanel.tsx` - Replace `handleZoomToRegion` logic with utility call

### 5. Fix Type Safety Issues

**Priority:** High  
**Impact:** Prevents runtime errors, improves IDE support

**Files to Update:**
- `src/components/AdvancedPanel.tsx` (line 465):
  ```typescript
  // Before:
  onChange={(e) => regions.updateRegion(regions.selectedRegionId!, { challengeLevel: e.target.value as any })}
  
  // After:
  onChange={(e) => regions.updateRegion(regions.selectedRegionId!, { challengeLevel: e.target.value as ChallengeLevel })}
  ```
  
  Ensure `ChallengeLevel` type is imported from `../types`

### 6. Create Toast/Notification System

**Priority:** Medium  
**Impact:** Better UX, replaces 20+ alert() calls

**Option A: Simple Hook (Recommended for MVP)**
Create `src/hooks/useToast.ts`:

```typescript
import { useState, useCallback } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, showToast, dismissToast }
}
```

Create `src/components/ToastContainer.tsx`:

```typescript
import { useToast } from '../hooks/useToast'

export function ToastContainer() {
  const { toasts, dismissToast } = useToast()
  
  // This would need to be integrated with context or a global state
  // For now, this is a template
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`p-4 rounded shadow-lg ${
            toast.type === 'error' ? 'bg-red-600' :
            toast.type === 'success' ? 'bg-green-600' :
            toast.type === 'warning' ? 'bg-yellow-600' :
            'bg-blue-600'
          } text-white`}
          onClick={() => dismissToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
```

**Option B: Use a Library**
Consider lightweight libraries like `react-hot-toast` or `sonner` for production-ready solution.

**Migration Strategy:**
- Replace `alert()` calls gradually
- Start with error messages (use `showToast(message, 'error')`)
- Then success messages (use `showToast(message, 'success')`)
- Finally warnings/info messages

**Files to Update (Priority Order):**
1. `src/components/RegionPanel.tsx` - Replace alert() calls
2. `src/components/MapLoaderControls.tsx` - Replace alert() calls
3. `src/components/MainApp.tsx` - Replace alert() calls
4. `src/components/ImageImportHandler.tsx` - Replace alert() calls
5. `src/utils/exportUtils.ts` - Replace alert() calls

### 7. Extract Sort Button Component

**Priority:** Low  
**Impact:** Reduces code duplication, improves maintainability

Create `src/components/SortButton.tsx`:

```typescript
import { ArrowUp, ArrowDown } from 'lucide-react'

interface SortButtonProps {
  sortKey: 'name' | 'size' | 'newest'
  currentSort: 'name' | 'size' | 'newest'
  sortOrder: 'asc' | 'desc'
  label: string
  onClick: () => void
}

export function SortButton({ sortKey, currentSort, sortOrder, label, onClick }: SortButtonProps) {
  const isActive = currentSort === sortKey
  
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-sm border transition-colors flex items-center gap-1 ${
        isActive
          ? 'bg-outer-space border-outer-space text-white'
          : 'bg-input-bg border-input-border text-gray-300 hover:bg-gunmetal hover:border-outer-space'
      }`}
    >
      {label}
      {isActive && (
        sortOrder === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />
      )}
    </button>
  )
}
```

**Files to Update:**
- `src/components/RegionPanel.tsx` - Replace sort button code (lines 295-355)

### 8. Clean Up Formatting

**Priority:** Low  
**Impact:** Improves code readability

**Files to Clean:**
- `src/components/RegionPanel.tsx` - Remove excessive blank lines (lines 53-55)
- Run formatter across codebase (consider adding Prettier if not already present)

## Implementation Steps

### Phase 1: Constants and Utilities (High Priority) ✅ COMPLETED
1. ✅ Create `src/utils/constants.ts` with all shared constants
2. ✅ Create `src/utils/imageValidation.ts` with validation function
3. ✅ Create `src/utils/imageUtils.ts` with proxy URL utility
4. ✅ Update all files to use new constants and utilities
5. ✅ Test image loading and validation still works

**Results:**
- Removed duplicate constants (MIN_SIZE, MAX_SIZE) from 4 files
- Removed duplicate validation logic from 4 files
- Removed duplicate proxy URL logic from 3 files
- Replaced magic number `384` with `SIDEBAR_WIDTH` constant in 3 files

### Phase 2: Type Safety and Zoom Utility (High Priority) ✅ COMPLETED
1. ✅ Fix `as any` type assertion in `AdvancedPanel.tsx`
2. ✅ Create `src/utils/zoomUtils.ts` with zoom calculation
3. ✅ Update `RegionPanel.tsx` to use zoom utility
4. ✅ Test zoom to region functionality

**Results:**
- Fixed type safety issue (replaced `as any` with proper `ChallengeLevel` type)
- Extracted ~70 lines of zoom calculation logic into reusable utility
- Simplified `handleZoomToRegion` from ~68 lines to ~25 lines

### Phase 3: Toast System (Medium Priority) ✅ COMPLETED
1. ✅ Create `src/hooks/useToast.ts` hook
2. ✅ Create `src/components/ToastContainer.tsx` component
3. ✅ Integrate toast system into `AppContext` for global access
4. ✅ Replace all `alert()` calls (20+ instances)
5. ✅ Added toast examples to styleguide
6. ✅ Removed redundant alert() fallbacks from export utilities

**Results:**
- Replaced 20+ alert() calls with toast notifications
- Toast system integrated into AppContext for global access
- Auto-dismiss after 3 seconds (5 seconds for errors)
- Color-coded by type (error=red, success=green, warning=yellow, info=blue)
- Made `onShowToast` required parameter (removed redundant fallbacks)

### Phase 4: Component Extraction (Low Priority) ✅ COMPLETED
1. ✅ Create `src/components/SortButton.tsx`
2. ✅ Update `RegionPanel.tsx` to use `SortButton`
3. ✅ Clean up formatting across codebase

**Results:**
- Extracted sort button logic into reusable component
- Reduced sort button code from ~60 lines to ~42 lines
- Removed 3 duplicate button implementations
- Cleaned up excessive blank lines

## Testing Considerations

### Unit Tests (Recommended)
- `validateImageDimensions()` - Test all validation cases
- `calculateZoomToFitRegion()` - Test various region sizes and edge cases
- `getImageProxyUrl()` - Test production vs development URLs

### Manual Testing Checklist
- [x] Image loading from URL still works
- [x] Image validation shows correct error messages
- [x] Zoom to region still works correctly
- [x] Toast notifications appear and dismiss
- [x] Sort buttons work correctly
- [x] No console errors after refactoring

## Migration Notes

### Backwards Compatibility
- All changes are internal refactorings
- No breaking changes to user-facing functionality
- No changes to data formats or APIs

### Rollout Strategy
- Implement changes incrementally by phase
- Test each phase before moving to next
- Can roll back individual changes if issues arise

## Files Affected

### New Files
- `src/utils/constants.ts`
- `src/utils/imageValidation.ts`
- `src/utils/imageUtils.ts`
- `src/utils/zoomUtils.ts`
- `src/hooks/useToast.ts`
- `src/components/ToastContainer.tsx`
- `src/components/SortButton.tsx`

### Modified Files
- `src/components/MainApp.tsx`
- `src/components/MapLoaderControls.tsx`
- `src/components/ImageImportHandler.tsx`
- `src/utils/persistenceUtils.ts`
- `src/components/RegionPanel.tsx`
- `src/components/MapCanvas.tsx`
- `src/components/AdvancedPanel.tsx`
- `src/utils/exportUtils.ts`
- `src/components/ExportPanel.tsx`
- `src/context/AppContext.tsx`
- `src/components/StyleGuide.tsx`

## Success Criteria

1. ✅ **No duplicate constants** - all use shared constants file (`src/utils/constants.ts`)
2. ✅ **No duplicate validation logic** - single validation function (`src/utils/imageValidation.ts`)
3. ✅ **No magic numbers** - all use named constants (SIDEBAR_WIDTH, IMAGE_MIN_SIZE, etc.)
4. ✅ **No `alert()` calls** - all replaced with toast system (20+ instances)
5. ✅ **No `as any` assertions** - proper types used (ChallengeLevel in AdvancedPanel)
6. ✅ **Complex logic extracted to utilities** - zoom calculation, image proxy, validation
7. ✅ **Code formatting cleaned up** - removed excessive blank lines
8. ✅ **Component extraction** - SortButton component reduces duplication

## Implementation Status

**Status:** ✅ **ALL PHASES COMPLETE**

All refactoring phases have been successfully implemented:
- Phase 1: Constants and Utilities ✅
- Phase 2: Type Safety and Zoom Utility ✅
- Phase 3: Toast System ✅
- Phase 4: Component Extraction ✅

**Files Created:**
- `src/utils/constants.ts`
- `src/utils/imageValidation.ts`
- `src/utils/imageUtils.ts`
- `src/utils/zoomUtils.ts`
- `src/hooks/useToast.ts`
- `src/components/ToastContainer.tsx`
- `src/components/SortButton.tsx`

**Files Modified:**
- `src/components/MainApp.tsx`
- `src/components/MapLoaderControls.tsx`
- `src/components/ImageImportHandler.tsx`
- `src/utils/persistenceUtils.ts`
- `src/components/RegionPanel.tsx`
- `src/components/MapCanvas.tsx`
- `src/components/AdvancedPanel.tsx`
- `src/utils/exportUtils.ts`
- `src/components/ExportPanel.tsx`
- `src/context/AppContext.tsx`
- `src/components/StyleGuide.tsx`

**Key Improvements:**
- Eliminated code duplication across multiple files
- Improved type safety
- Better user experience with toast notifications
- More maintainable codebase with reusable utilities
- Cleaner component structure

## Future Enhancements

After completing these refactors, consider:
- Adding ESLint rules to prevent duplicate constants
- Adding Prettier for consistent formatting
- Creating a component library for reusable UI components
- Adding unit tests for utility functions
- Implementing a proper error boundary system

