import { MapState, Region } from '../types'
import { validateImageDimensions } from './imageValidation'

export interface ImageDetails {
  seed?: string
  dimension?: string
  worldSize?: number
  imageSize?: { width: number; height: number }
}

export interface ExportSettings {
  includeVillages: boolean
  randomMobSpawn: boolean
  includeHeartRegions: boolean
  includeSpawnRegion: boolean
  useModernWorldHeight: boolean
  useGreetingsAndFarewells: boolean
  greetingSize: 'large' | 'small' | 'chat'
  includeChallengeLevelSubheading: boolean
}

const STORAGE_KEYS = {
  MAP_STATE: 'mc-region-maker-map-state',
  REGIONS: 'mc-region-maker-regions',
  SELECTED_REGION: 'mc-region-maker-selected-region',
  IMAGE_DETAILS: 'mc-region-maker-image-details',
  ACTIVE_TAB: 'mc-region-maker-active-tab',
  WORLD_NAME: 'mc-region-maker-world-name',
  WORLD_TYPE: 'mc-region-maker-world-type',
  WORLD_SEED: 'mc-region-maker-world-seed',
  EXPORT_SETTINGS: 'mc-region-maker-export-settings'
}

// Get image source URL for storage
export function getImageSource(image: HTMLImageElement): string {
  return image.src
}

// Load image from source URL
export function loadImageFromSource(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const validation = validateImageDimensions(image.width, image.height)
      if (!validation.isValid) {
        reject(new Error(validation.error || 'Image validation failed'))
      } else {
        resolve(image)
      }
    }
    image.onerror = reject
    image.src = src
  })
}

// Save map state to localStorage
export async function saveMapState(mapState: MapState): Promise<void> {
  try {
    const stateToSave = { ...mapState }
    
    // Store image source URL instead of base64
    if (mapState.image) {
      const imageSrc = getImageSource(mapState.image)
      // Only save if it's not a file:// URL (which won't work after refresh)
      if (!imageSrc.startsWith('file://')) {
        (stateToSave as any).image = imageSrc
      } else {
        // Remove image from saved state if it's a local file
        stateToSave.image = null
      }
    }
    
    localStorage.setItem(STORAGE_KEYS.MAP_STATE, JSON.stringify(stateToSave))
  } catch (error) {
    console.error('Failed to save map state:', error)
  }
}

// Load map state from localStorage
export async function loadMapState(): Promise<MapState | null> {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MAP_STATE)
    if (!saved) return null
    
    const parsed = JSON.parse(saved)
    
    // Set default opacity for backward compatibility
    if (parsed.imageOpacity === undefined) {
      parsed.imageOpacity = 1
    }
    
    // Load image from source URL if it exists
    if (parsed.image && typeof parsed.image === 'string') {
      parsed.image = await loadImageFromSource(parsed.image)
    }
    
    return parsed
  } catch (error) {
    console.error('Failed to load map state:', error)
    return null
  }
}

// Save regions to localStorage
export function saveRegions(regions: Region[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REGIONS, JSON.stringify(regions))
  } catch (error) {
    console.error('Failed to save regions:', error)
  }
}

// Load regions from localStorage
export function loadRegions(): Region[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.REGIONS)
    const regions = saved ? JSON.parse(saved) : []
    return regions
  } catch (error) {
    console.error('Failed to load regions:', error)
    return []
  }
}

// Save selected region ID
export function saveSelectedRegion(regionId: string | null): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_REGION, JSON.stringify(regionId))
  } catch (error) {
    console.error('Failed to save selected region:', error)
  }
}

// Load selected region ID
export function loadSelectedRegion(): string | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_REGION)
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.error('Failed to load selected region:', error)
    return null
  }
}

// Save image details to localStorage
export function saveImageDetails(imageDetails: ImageDetails): void {
  try {
    localStorage.setItem(STORAGE_KEYS.IMAGE_DETAILS, JSON.stringify(imageDetails))
  } catch (error) {
    console.error('Failed to save image details:', error)
  }
}

// Load image details from localStorage
export function loadImageDetails(): ImageDetails | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.IMAGE_DETAILS)
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.error('Failed to load image details:', error)
    return null
  }
}

// Save active tab to localStorage
export function saveActiveTab(tab: 'map' | 'regions' | 'export' | 'advanced'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, tab)
  } catch (error) {
    console.error('Failed to save active tab:', error)
  }
}

// Load active tab from localStorage
export function loadActiveTab(): 'map' | 'regions' | 'export' | 'advanced' {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB)
    if (saved && ['map', 'regions', 'export', 'advanced'].includes(saved)) {
      return saved as 'map' | 'regions' | 'export' | 'advanced'
    }
    return 'map' // Default to map tab
  } catch (error) {
    console.error('Failed to load active tab:', error)
    return 'map'
  }
}

// Save export settings to localStorage
export function saveExportSettings(settings: ExportSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPORT_SETTINGS, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save export settings:', error)
  }
}

// Load export settings from localStorage
export function loadExportSettings(): ExportSettings | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPORT_SETTINGS)
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.error('Failed to load export settings:', error)
    return null
  }
}

// Clear all saved data
export function clearSavedData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}
