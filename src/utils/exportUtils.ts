import { Region, MapState } from '../types'
import { getEffectiveMapImage } from './mapStateUtils'
import { scanBiomes } from './biomeScanner'
import { generateRegionYAML } from './polygonUtils'
import { ExportSettings, loadExportSettings } from './persistenceUtils'
import yaml from 'js-yaml'


export interface MapExportData {
  version: string
  worldName: string
  seed?: string
  dimension?: string
  worldSize?: number
  imageSize?: { width: number; height: number }
  regions: Region[]
  mapState: Omit<MapState, 'image'> & { imageSrc?: string }
  spawnCoordinates?: { x: number; z: number; radius?: number } | null
  exportDate: string
  imageData?: string
  terrainImageData?: string
  biomeImageData?: string
  imageFilename?: string
  terrainImageFilename?: string
  biomeImageFilename?: string
  exportSettings?: ExportSettings
}

const CURRENT_VERSION = '1.0.0'


// Export complete map with embedded image data
export async function exportCompleteMap(
  regions: Region[], 
  mapState: MapState, 
  worldName: string, 
  spawnCoordinates?: { x: number; z: number; radius?: number } | null, 
  dimension?: 'overworld' | 'nether' | 'end', 
  seed?: string, 
  worldSize?: number, 
  imageSize?: { width: number; height: number },
  onShowToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void
): Promise<void> {
  const effectiveImage = getEffectiveMapImage(mapState)
  if (!effectiveImage) {
    onShowToast('No map image loaded. Please load an image first.', 'error')
    return
  }

  try {
    let imageData: string | null = null
    let terrainImageData: string | null = null
    let biomeImageData: string | null = null
    const hasDual = mapState.terrainImage && mapState.biomeImage

    const toBase64 = (img: HTMLImageElement): string | null => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return null
        ctx.drawImage(img, 0, 0)
        return canvas.toDataURL('image/png')
      } catch {
        return null
      }
    }

    if (hasDual) {
      terrainImageData = toBase64(mapState.terrainImage!)
      biomeImageData = toBase64(mapState.biomeImage!)
    } else {
      imageData = toBase64(effectiveImage)
    }

    if (!hasDual && !imageData) {
      const userConfirmed = confirm(
        'The map image is from a different origin and cannot be embedded.\n\nContinue with export (image will be omitted)?'
      )
      if (!userConfirmed) return
    }

    const exportSettings = loadExportSettings()
    const dateStr = new Date().toISOString().split('T')[0]

    const exportData: MapExportData = {
      version: CURRENT_VERSION,
      worldName,
      seed,
      dimension,
      worldSize,
      imageSize,
      regions,
      mapState: {
        scale: mapState.scale,
        offsetX: mapState.offsetX,
        offsetY: mapState.offsetY,
        isDragging: mapState.isDragging,
        lastMousePos: mapState.lastMousePos,
        originSelected: mapState.originSelected,
        originOffset: mapState.originOffset,
        imageSrc: (effectiveImage as any)?.src || undefined
      },
      spawnCoordinates,
      exportDate: new Date().toISOString(),
      imageData: imageData || undefined,
      terrainImageData: terrainImageData || undefined,
      biomeImageData: biomeImageData || undefined,
      imageFilename: imageData ? `map-image-${dateStr}.png` : undefined,
      terrainImageFilename: terrainImageData ? `terrain-${dateStr}.png` : undefined,
      biomeImageFilename: biomeImageData ? `biome-${dateStr}.png` : undefined,
      exportSettings: exportSettings || undefined
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    const worldNameSlug = worldName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
    const date = new Date().toISOString().split('T')[0]
    const dimensionSlug = dimension || 'overworld'
    link.download = `${worldNameSlug}-${dimensionSlug}-${date}.json`
    link.click()
    
    URL.revokeObjectURL(link.href)
    
    // No toast - the browser's download dialog provides the necessary feedback
    // We can't detect if the user actually saved or canceled the download
  } catch (error) {
    console.error('Error exporting complete map:', error)
    onShowToast('Failed to export complete map. Please try again.', 'error')
  }
}

// Build filename prefix from world name, dimension and date (same pattern as project save)
function exportFilenamePrefix(worldName: string, dimension: 'overworld' | 'nether' | 'end'): string {
  const worldNameSlug = worldName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
  const date = new Date().toISOString().split('T')[0]
  const dimensionSlug = dimension || 'overworld'
  return `${worldNameSlug}-${dimensionSlug}-${date}`
}

// Export all regions to YAML file in WorldGuard format
export function exportRegionsYAML(
  regions: Region[], 
  includeVillages: boolean = true, 
  includeHeartRegions: boolean = true,
  includeSpawnRegion: boolean = false,
  spawnCoordinates?: { x: number; z: number; radius?: number } | null,
  dimension?: 'overworld' | 'nether' | 'end',
  worldName: string = 'world',
  useModernWorldHeight: boolean = true,
  useGreetingsAndFarewells: boolean = false,
  greetingSize: 'large' | 'small' | 'chat' = 'large',
  includeChallengeLevelSubheading: boolean = false,
  onShowToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void
): void {
  const effectiveDimension = dimension === 'end' ? 'overworld' : (dimension || 'overworld')
  
  // Filter out disabled regions
  const enabledRegions = regions.filter(region => !region.disabled)
  
  if (enabledRegions.length === 0 && (!includeSpawnRegion || effectiveDimension === 'nether')) {
    onShowToast('No regions to export', 'error')
    return
  }

  let yamlContent = 'regions:\n'
  
  // Add spawn region if requested and coordinates exist (only for overworld)
  if (includeSpawnRegion && spawnCoordinates && spawnCoordinates.radius && effectiveDimension !== 'nether') {
    const spawnRegion = generateSpawnRegionYAML(spawnCoordinates as { x: number; z: number; radius: number }, useModernWorldHeight)
    yamlContent += spawnRegion
    if (enabledRegions.length > 0) {
      yamlContent += '\n'
    }
  }
  
  enabledRegions.forEach((region, index) => {
    yamlContent += generateRegionYAML(region, includeVillages, includeHeartRegions, effectiveDimension, useModernWorldHeight, useGreetingsAndFarewells, greetingSize, includeChallengeLevelSubheading)
    // Add a blank line between regions (except after the last one)
    if (index < enabledRegions.length - 1) {
      yamlContent += '\n'
    }
  })

  const dataBlob = new Blob([yamlContent], { type: 'text/yaml' })
  const prefix = exportFilenamePrefix(worldName, effectiveDimension)
  const link = document.createElement('a')
  link.href = URL.createObjectURL(dataBlob)
  link.download = `${prefix}-regions.yml`
  link.click()
  
  URL.revokeObjectURL(link.href)
}

// Generate spawn region YAML
function generateSpawnRegionYAML(spawnCoordinates: { x: number; z: number; radius: number }, useModernWorldHeight: boolean = true): string {
  const { x, z, radius } = spawnCoordinates
  
  // Calculate cuboid bounds based on spawn point and radius
  const minX = x - radius
  const maxX = x + radius
  const minZ = z - radius
  const maxZ = z + radius
  
  // Set Y coordinates based on world height setting
  const minY = useModernWorldHeight ? -64 : 0
  const maxY = useModernWorldHeight ? 320 : 255
  
  let yaml = `  spawn:\n`
  yaml += `    min: {x: ${minX}, y: ${minY}, z: ${minZ}}\n`
  yaml += `    max: {x: ${maxX}, y: ${maxY}, z: ${maxZ}}\n`
  yaml += `    members: {}\n`
  yaml += `    flags:\n`
  yaml += `      build: deny\n`
  yaml += `      pvp: deny\n`
  yaml += `      mob-spawning: deny\n`
  yaml += `      creeper-explosion: deny\n`
  yaml += `      other-explosion: deny\n`
  yaml += `      tnt: deny\n`
  yaml += `    owners: {}\n`
  yaml += `    type: cuboid\n`
  yaml += `    priority: 10\n`
  
  return yaml
}

// Challenge levels are now stored directly as difficulty band names (easy, normal, hard, severe, deadly)
// This mapping provides backward compatibility for imports with old names
const LEGACY_CHALLENGE_TO_BAND: Record<string, string> = {
  Vanilla: 'easy',
  Bronze: 'normal',
  Silver: 'hard',
  Gold: 'severe',
  Platinum: 'deadly'
}

// Migrate old challenge level name to new difficulty band name
function migrateChallengLevel(level?: string): string | undefined {
  if (!level) return undefined
  return LEGACY_CHALLENGE_TO_BAND[level] || level
}

function toRegionId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_')
}

function getRecipeId(kind: 'system' | 'region' | 'village' | 'heart', world: 'overworld' | 'nether' | 'end'): string {
  if (kind === 'system') return 'none'
  const effectiveWorld = world === 'end' ? 'overworld' : world
  if (effectiveWorld === 'nether') {
    if (kind === 'region') return 'nether_region'
    if (kind === 'heart') return 'nether_heart'
  }
  return kind
}

function getStandardWorldName(dimension: 'overworld' | 'nether' | 'end'): string {
  const effectiveDimension = dimension === 'end' ? 'overworld' : dimension
  switch (effectiveDimension) {
    case 'overworld':
      return 'world'
    case 'nether':
      return 'world_nether'
    default:
      return 'world'
  }
}

export function exportRegionsMetaYAML(
  regions: Region[],
  dimension: 'overworld' | 'nether' | 'end',
  worldName: string,
  spawnState: { coordinates: { x: number; z: number } | null; radius: number },
  includeVillages: boolean,
  includeHeartRegions: boolean,
  includeSpawnRegion: boolean,
  onShowToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void,
  mapState?: MapState | null
): void {
  const effectiveDimension = dimension === 'end' ? 'overworld' : dimension
  const dim = effectiveDimension
  const hasSpawnCoords = !!spawnState.coordinates
  const hasSpawnRegion = dim === 'overworld' && includeSpawnRegion && hasSpawnCoords && !!spawnState.radius

  // Filter out disabled regions
  const enabledRegions = regions.filter(region => !region.disabled)

  const biomeImage = mapState?.biomeImage ?? mapState?.terrainImage ?? mapState?.image ?? null
  const originOffset = mapState?.originOffset ?? null

  const metaRegions: { id: string; world: string; kind: string; discover: { method: string; recipeId: string }; biomes?: { biome: string; percentage: number }[]; category?: string; items?: { id: string; name: string }[]; theme?: { a: string; b: string }[]; description?: string }[] = []

  if (hasSpawnRegion) {
    metaRegions.push({
      id: 'spawn',
      world: dim,
      kind: 'system',
      discover: { method: 'disabled', recipeId: 'none' }
    })
  }

  for (const region of enabledRegions) {
    const mainId = toRegionId(region.name)
    let regionEntry: { id: string; world: string; kind: string; discover: { method: string; recipeId: string }; biomes?: { biome: string; percentage: number }[]; category?: string; items?: { id: string; name: string }[]; theme?: { a: string; b: string }[]; description?: string } = {
      id: mainId,
      world: dim,
      kind: 'region',
      discover: {
        method: region.hasSpawn === true ? 'first_join' : 'on_enter',
        recipeId: getRecipeId('region', dim)
      }
    }
    if (region.description) regionEntry.description = region.description
    if (region.minecraftCategory) regionEntry.category = region.minecraftCategory
    if (region.minecraftItems && region.minecraftItems.length > 0) regionEntry.items = region.minecraftItems
    if (region.regionTheme && region.regionTheme.length > 0) regionEntry.theme = region.regionTheme
    if (biomeImage && region.points.length >= 3) {
      const breakdown = scanBiomes(region, biomeImage, originOffset)
      if (breakdown && breakdown.length > 0) {
        regionEntry.biomes = breakdown.map(({ biome, percentage }) => ({ biome, percentage }))
      }
    }
    metaRegions.push(regionEntry)
    if (includeHeartRegions && region.centerPoint != null) {
      metaRegions.push({
        id: `heart_of_${mainId}`,
        world: dim,
        kind: 'heart',
        discover: { method: 'on_enter', recipeId: getRecipeId('heart', dim) }
      })
    }
    if (includeVillages && dim !== 'nether' && region.subregions) {
      for (const sub of region.subregions) {
        if (sub.type === 'village') {
          metaRegions.push({
            id: toRegionId(sub.name),
            world: dim,
            kind: 'village',
            discover: { method: 'on_enter', recipeId: getRecipeId('village', dim) }
          })
        }
      }
    }
  }

  if (metaRegions.length === 0) {
    onShowToast('No regions to export', 'error')
    return
  }

  const root: Record<string, unknown> = {
    format: 1,
    world: dim,
    regions: metaRegions
  }

  if (dim === 'overworld' && hasSpawnCoords) {
    root.spawnCenter = {
      world: getStandardWorldName(dim),
      x: spawnState.coordinates!.x,
      z: spawnState.coordinates!.z
    }
  }

  const hasSpawnRegionWithHasSpawn = dim === 'overworld' && hasSpawnCoords && enabledRegions.some(r => r.hasSpawn === true)
  if (hasSpawnRegionWithHasSpawn) {
    const startRegion = enabledRegions.find(r => r.hasSpawn === true)!
    root.onboarding = {
      startRegionId: toRegionId(startRegion.name),
      teleport: {
        world: getStandardWorldName(dim),
        x: spawnState.coordinates!.x,
        z: spawnState.coordinates!.z
      }
    }
  }

  const regionBands: Record<string, string> = {}
  for (const r of enabledRegions) {
    if (r.challengeLevel) {
      // Challenge levels are now stored as band names directly, but handle legacy imports
      const band = migrateChallengLevel(r.challengeLevel)
      if (band) {
        regionBands[toRegionId(r.name)] = band
      }
    }
  }
  const hasVillagesForLevelled = includeVillages && enabledRegions.some(r => r.subregions?.some(s => s.type === 'village'))
  if (Object.keys(regionBands).length > 0 || hasVillagesForLevelled) {
    root.levelledMobs = {
      ...(dim !== 'nether' ? { villageBandStrategy: 'easy' as const } : {}),
      ...(Object.keys(regionBands).length > 0 ? { regionBands } : {})
    }
  }

  const prefix = exportFilenamePrefix(worldName, dim)
  const filename = `${prefix}-regions-meta.yml`
  try {
    const yamlStr = yaml.dump(root, { lineWidth: -1, noRefs: true })
    const blob = new Blob([yamlStr], { type: 'text/yaml' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  } catch (e) {
    onShowToast(`Failed to generate ${filename}`, 'error')
  }
}

// Import map data from JSON file
export function importMapData(file: File): Promise<MapExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const data: MapExportData = JSON.parse(content)
        
        // Validate the imported data
        if (!data.version || !data.regions || !data.mapState) {
          throw new Error('Invalid file format')
        }
        
        // Handle legacy imports that don't have worldName
        if (!data.worldName) {
          data.worldName = 'world'
        }
        
        // Migrate old challenge level names to new difficulty band names
        data.regions = data.regions.map(region => ({
          ...region,
          challengeLevel: migrateChallengLevel(region.challengeLevel) as Region['challengeLevel']
        }))
        
        resolve(data)
      } catch (error) {
        reject(new Error('Failed to parse import file'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read import file'))
    }
    
    reader.readAsText(file)
  })
}

// Load image from base64 data (for complete map imports)
export function loadImageFromBase64(base64Data: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = base64Data
  })
}

// Load image from source URL (for imports)
export function loadImageFromSrc(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    // Set crossOrigin to anonymous to allow canvas export if the server supports CORS
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

// Validate imported data structure
export function validateImportData(data: any): data is MapExportData {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.version === 'string' &&
    Array.isArray(data.regions) &&
    typeof data.mapState === 'object' &&
    data.mapState !== null &&
    typeof data.exportDate === 'string'
  )
}
