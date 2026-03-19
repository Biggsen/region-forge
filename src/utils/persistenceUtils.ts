import { MapState, Region, HighlightMode, StructureType, STRUCTURE_TYPES } from '../types'
import { validateImageDimensions } from './imageValidation'

export interface ImageDetails {
  seed?: string
  dimension?: string
  worldSize?: number
  imageSize?: { width: number; height: number }
}

export interface ExportSettings {
  includeVillages: boolean
  includeStructures: boolean
  includeHeartRegions: boolean
  includeSpawnRegion: boolean
  useModernWorldHeight: boolean
  useGreetingsAndFarewells: boolean
  greetingSize: 'large' | 'small' | 'chat'
  includeChallengeLevelSubheading: boolean
}

export type StructureTableSort = {
  column: 'type' | 'count' | 'regions'
  dir: 'asc' | 'desc'
}

export type AdvancedPanelSectionsState = {
  isOtherRegionTypesExpanded: boolean
  isPluginsExpanded: boolean
  isVillagesExpanded: boolean
  isStructuresExpanded: boolean
  isImportExpanded: boolean
  isRegionSpecificExpanded: boolean
  isRegionDescriptionExpanded: boolean
  isBiomeDataExpanded: boolean
  isWorldBiomeDataExpanded: boolean
  isMinecraftDataExpanded: boolean
  isRegionThemeExpanded: boolean
  isLoreInstructionsExpanded: boolean
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
  EXPORT_SETTINGS: 'mc-region-maker-export-settings',
  REGION_SORT: 'mc-region-maker-region-sort',
  REGION_FILL_OPACITY: 'mc-region-maker-region-fill-opacity',
  HIGHLIGHT_MODE: 'mc-region-maker-highlight-mode',
  STRUCTURE_TABLE_SORT: 'mc-region-maker-structure-table-sort',
  ADVANCED_PANEL_SECTIONS: 'mc-region-maker-advanced-panel-sections'
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

function serializeImageForStorage(image: HTMLImageElement | null): string | null {
  if (!image) return null
  const src = getImageSource(image)
  return src.startsWith('file://') ? null : src
}

// Save map state to localStorage
export async function saveMapState(mapState: MapState): Promise<void> {
  try {
    const stateToSave: Record<string, unknown> = { ...mapState }

    const imageSrc = mapState.image ? serializeImageForStorage(mapState.image) : null
    const terrainImageSrc = mapState.terrainImage ? serializeImageForStorage(mapState.terrainImage) : null
    const biomeImageSrc = mapState.biomeImage ? serializeImageForStorage(mapState.biomeImage) : null

    stateToSave.image = imageSrc ?? null
    stateToSave.terrainImage = terrainImageSrc ?? null
    stateToSave.biomeImage = biomeImageSrc ?? null

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
    const terrainSrc = typeof parsed.terrainImage === 'string' ? parsed.terrainImage : parsed.terrainImageSrc

    if (parsed.imageOpacity === undefined) parsed.imageOpacity = 1
    if (parsed.terrainVisible === undefined) parsed.terrainVisible = true
    if (parsed.terrainOpacity === undefined) parsed.terrainOpacity = 1
    if (parsed.biomeVisible === undefined) parsed.biomeVisible = true
    if (parsed.biomeOpacity === undefined) parsed.biomeOpacity = 0.8

    const biomeSrc = typeof parsed.biomeImage === 'string' ? parsed.biomeImage : parsed.biomeImageSrc
    const imageSrc = typeof parsed.image === 'string' ? parsed.image : null

    if (terrainSrc) {
      parsed.terrainImage = await loadImageFromSource(terrainSrc)
    } else {
      parsed.terrainImage = null
    }

    if (biomeSrc) {
      parsed.biomeImage = await loadImageFromSource(biomeSrc)
    } else {
      parsed.biomeImage = null
    }

    if (imageSrc && !terrainSrc) {
      parsed.image = await loadImageFromSource(imageSrc)
      if (!parsed.terrainImage) parsed.terrainImage = parsed.image
    } else {
      if (!parsed.image && parsed.terrainImage) parsed.image = parsed.terrainImage
    }

    return parsed as MapState
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

export type RegionSortBy = 'name' | 'size' | 'newest'
export type RegionSortOrder = 'asc' | 'desc'

export function saveRegionSort(sortBy: RegionSortBy, sortOrder: RegionSortOrder): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REGION_SORT, JSON.stringify({ sortBy, sortOrder }))
  } catch (error) {
    console.error('Failed to save region sort:', error)
  }
}

export function loadRegionSort(): { sortBy: RegionSortBy; sortOrder: RegionSortOrder } {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.REGION_SORT)
    if (!saved) return { sortBy: 'newest', sortOrder: 'desc' }
    const parsed = JSON.parse(saved)
    const sortBy = ['name', 'size', 'newest'].includes(parsed?.sortBy) ? parsed.sortBy : 'newest'
    const sortOrder = parsed?.sortOrder === 'asc' || parsed?.sortOrder === 'desc' ? parsed.sortOrder : 'desc'
    return { sortBy, sortOrder }
  } catch (error) {
    console.error('Failed to load region sort:', error)
    return { sortBy: 'newest', sortOrder: 'desc' }
  }
}

export function saveRegionFillOpacity(value: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REGION_FILL_OPACITY, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save region fill opacity:', error)
  }
}

export function loadRegionFillOpacity(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.REGION_FILL_OPACITY)
    if (!saved) return 0.2
    const parsed = parseFloat(saved)
    return isNaN(parsed) || parsed < 0 ? 0 : parsed > 1 ? 1 : parsed
  } catch (error) {
    console.error('Failed to load region fill opacity:', error)
    return 0.2
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
    if (!saved) return null
    const parsed = JSON.parse(saved) as Partial<ExportSettings>
    if (parsed.includeStructures === undefined) {
      parsed.includeStructures = true
    }
    return parsed as ExportSettings
  } catch (error) {
    console.error('Failed to load export settings:', error)
    return null
  }
}

export function saveHighlightMode(mode: HighlightMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HIGHLIGHT_MODE, JSON.stringify(mode))
  } catch (error) {
    console.error('Failed to save highlight mode:', error)
  }
}

export function loadHighlightMode(defaultMode: HighlightMode): HighlightMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HIGHLIGHT_MODE)
    if (!saved) return defaultMode

    const parsed = JSON.parse(saved) as Partial<HighlightMode>
    const structureTypes = Object.values(STRUCTURE_TYPES) as StructureType[]
    const visibleStructureTypes: Partial<Record<StructureType, boolean>> = { ...(defaultMode.visibleStructureTypes || {}) }
    for (const structureType of structureTypes) {
      const raw = parsed.visibleStructureTypes?.[structureType]
      if (typeof raw === 'boolean') {
        visibleStructureTypes[structureType] = raw
      }
    }

    const highlightedStructureType =
      parsed.highlightedStructureType && structureTypes.includes(parsed.highlightedStructureType)
        ? parsed.highlightedStructureType
        : null

    return {
      ...defaultMode,
      ...parsed,
      visibleStructureTypes,
      highlightedStructureType,
    }
  } catch (error) {
    console.error('Failed to load highlight mode:', error)
    return defaultMode
  }
}

export function saveStructureTableSort(sort: StructureTableSort): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STRUCTURE_TABLE_SORT, JSON.stringify(sort))
  } catch (error) {
    console.error('Failed to save structure table sort:', error)
  }
}

export function loadStructureTableSort(): StructureTableSort {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.STRUCTURE_TABLE_SORT)
    if (!saved) return { column: 'type', dir: 'asc' }
    const parsed = JSON.parse(saved) as Partial<StructureTableSort>
    const column = parsed.column === 'type' || parsed.column === 'count' || parsed.column === 'regions' ? parsed.column : 'type'
    const dir = parsed.dir === 'asc' || parsed.dir === 'desc' ? parsed.dir : 'asc'
    return { column, dir }
  } catch (error) {
    console.error('Failed to load structure table sort:', error)
    return { column: 'type', dir: 'asc' }
  }
}

export function saveAdvancedPanelSectionsState(state: AdvancedPanelSectionsState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ADVANCED_PANEL_SECTIONS, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save advanced panel sections state:', error)
  }
}

export function loadAdvancedPanelSectionsState(defaultState: AdvancedPanelSectionsState): AdvancedPanelSectionsState {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ADVANCED_PANEL_SECTIONS)
    if (!saved) return defaultState
    const parsed = JSON.parse(saved) as Partial<AdvancedPanelSectionsState>
    return {
      isOtherRegionTypesExpanded: typeof parsed.isOtherRegionTypesExpanded === 'boolean' ? parsed.isOtherRegionTypesExpanded : defaultState.isOtherRegionTypesExpanded,
      isPluginsExpanded: typeof parsed.isPluginsExpanded === 'boolean' ? parsed.isPluginsExpanded : defaultState.isPluginsExpanded,
      isVillagesExpanded: typeof parsed.isVillagesExpanded === 'boolean' ? parsed.isVillagesExpanded : defaultState.isVillagesExpanded,
      isStructuresExpanded: typeof parsed.isStructuresExpanded === 'boolean' ? parsed.isStructuresExpanded : defaultState.isStructuresExpanded,
      isImportExpanded: typeof parsed.isImportExpanded === 'boolean' ? parsed.isImportExpanded : defaultState.isImportExpanded,
      isRegionSpecificExpanded: typeof parsed.isRegionSpecificExpanded === 'boolean' ? parsed.isRegionSpecificExpanded : defaultState.isRegionSpecificExpanded,
      isRegionDescriptionExpanded: typeof parsed.isRegionDescriptionExpanded === 'boolean' ? parsed.isRegionDescriptionExpanded : defaultState.isRegionDescriptionExpanded,
      isBiomeDataExpanded: typeof parsed.isBiomeDataExpanded === 'boolean' ? parsed.isBiomeDataExpanded : defaultState.isBiomeDataExpanded,
      isWorldBiomeDataExpanded: typeof parsed.isWorldBiomeDataExpanded === 'boolean' ? parsed.isWorldBiomeDataExpanded : defaultState.isWorldBiomeDataExpanded,
      isMinecraftDataExpanded: typeof parsed.isMinecraftDataExpanded === 'boolean' ? parsed.isMinecraftDataExpanded : defaultState.isMinecraftDataExpanded,
      isRegionThemeExpanded: typeof parsed.isRegionThemeExpanded === 'boolean' ? parsed.isRegionThemeExpanded : defaultState.isRegionThemeExpanded,
      isLoreInstructionsExpanded: typeof parsed.isLoreInstructionsExpanded === 'boolean' ? parsed.isLoreInstructionsExpanded : defaultState.isLoreInstructionsExpanded,
    }
  } catch (error) {
    console.error('Failed to load advanced panel sections state:', error)
    return defaultState
  }
}

// Clear all saved data
export function clearSavedData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}
