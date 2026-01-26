import { Region, MapState } from '../types'
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
  worldType?: 'overworld' | 'nether'
  exportDate: string
  imageData?: string // Base64 encoded image data
  imageFilename?: string
  exportSettings?: ExportSettings
}

const CURRENT_VERSION = '1.0.0'


// Export complete map with embedded image data
export async function exportCompleteMap(
  regions: Region[], 
  mapState: MapState, 
  worldName: string, 
  spawnCoordinates?: { x: number; z: number; radius?: number } | null, 
  worldType?: 'overworld' | 'nether', 
  seed?: string, 
  dimension?: string, 
  worldSize?: number, 
  imageSize?: { width: number; height: number },
  onShowToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void
): Promise<void> {
  if (!mapState.image) {
    onShowToast('No map image loaded. Please load an image first.', 'error')
    return
  }

  try {
    let imageData: string | null = null
    
    // Try to convert image to base64, but handle CORS issues gracefully
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      canvas.width = mapState.image.width
      canvas.height = mapState.image.height
      ctx.drawImage(mapState.image, 0, 0)
      
      imageData = canvas.toDataURL('image/png')
    } catch (corsError) {
      console.warn('Cannot export image data due to CORS restrictions:', corsError)
      
      // For cross-origin images, we'll include the image source URL instead
      // The user will need to manually save the image if they want a complete export
      const userConfirmed = confirm(
        'The map image is from a different origin and cannot be embedded in the export file.\n\n' +
        'The export will include the image URL instead. You can manually save the image separately if needed.\n\n' +
        'Continue with export?'
      )
      
      if (!userConfirmed) {
        return
      }
    }
    
    // Load current export settings to include in project export
    const exportSettings = loadExportSettings()
    
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
        imageSrc: (mapState.image as any)?.imageSrc || undefined
      },
      spawnCoordinates,
      worldType,
      exportDate: new Date().toISOString(),
      imageData: imageData || undefined,
      imageFilename: imageData ? `map-image-${new Date().toISOString().split('T')[0]}.png` : undefined,
      exportSettings: exportSettings || undefined
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    const worldNameSlug = worldName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
    const date = new Date().toISOString().split('T')[0]
    link.download = `${worldNameSlug}-${worldType || 'overworld'}-${date}.json`
    link.click()
    
    URL.revokeObjectURL(link.href)
    
    // No toast - the browser's download dialog provides the necessary feedback
    // We can't detect if the user actually saved or canceled the download
  } catch (error) {
    console.error('Error exporting complete map:', error)
    onShowToast('Failed to export complete map. Please try again.', 'error')
  }
}

// Export all regions to YAML file in WorldGuard format
export function exportRegionsYAML(
  regions: Region[], 
  includeVillages: boolean = true, 
  randomMobSpawn: boolean = false, 
  includeHeartRegions: boolean = true,
  includeSpawnRegion: boolean = false,
  spawnCoordinates?: { x: number; z: number; radius?: number } | null,
  worldType?: 'overworld' | 'nether',
  useModernWorldHeight: boolean = true,
  useGreetingsAndFarewells: boolean = false,
  greetingSize: 'large' | 'small' | 'chat' = 'large',
  includeChallengeLevelSubheading: boolean = false,
  onShowToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void
): void {
  if (regions.length === 0 && (!includeSpawnRegion || worldType === 'nether')) {
    onShowToast('No regions to export', 'error')
    return
  }

  let yamlContent = 'regions:\n'
  
  // Add spawn region if requested and coordinates exist (only for overworld)
  if (includeSpawnRegion && spawnCoordinates && spawnCoordinates.radius && worldType !== 'nether') {
    const spawnRegion = generateSpawnRegionYAML(spawnCoordinates as { x: number; z: number; radius: number }, useModernWorldHeight)
    yamlContent += spawnRegion
    if (regions.length > 0) {
      yamlContent += '\n'
    }
  }
  
  regions.forEach((region, index) => {
    yamlContent += generateRegionYAML(region, includeVillages, randomMobSpawn, includeHeartRegions, worldType, useModernWorldHeight, useGreetingsAndFarewells, greetingSize, includeChallengeLevelSubheading)
    // Add a blank line between regions (except after the last one)
    if (index < regions.length - 1) {
      yamlContent += '\n'
    }
  })

  const dataBlob = new Blob([yamlContent], { type: 'text/yaml' })
  
  const link = document.createElement('a')
  link.href = URL.createObjectURL(dataBlob)
  link.download = `regions.yml`
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

const CHALLENGE_TO_BAND: Record<string, string> = {
  Vanilla: 'easy',
  Bronze: 'normal',
  Silver: 'hard',
  Gold: 'severe',
  Platinum: 'deadly'
}

function toRegionId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_')
}

function getRecipeId(kind: 'system' | 'region' | 'village' | 'heart', world: 'overworld' | 'nether'): string {
  if (kind === 'system') return 'none'
  if (world === 'nether') {
    if (kind === 'region') return 'nether_region'
    if (kind === 'heart') return 'nether_heart'
    if (kind === 'village') return 'nether_village'
  }
  return kind
}

function getStandardWorldName(worldType: 'overworld' | 'nether'): string {
  switch (worldType) {
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
  worldType: 'overworld' | 'nether',
  worldName: string,
  spawnState: { coordinates: { x: number; z: number } | null; radius: number },
  includeVillages: boolean,
  includeHeartRegions: boolean,
  includeSpawnRegion: boolean,
  onShowToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void
): void {
  const dim = worldType
  const hasSpawnCoords = !!spawnState.coordinates
  const hasSpawnRegion = dim === 'overworld' && includeSpawnRegion && hasSpawnCoords && !!spawnState.radius

  const metaRegions: { id: string; world: string; kind: string; discover: { method: string; recipeId: string } }[] = []

  if (hasSpawnRegion) {
    metaRegions.push({
      id: 'spawn',
      world: dim,
      kind: 'system',
      discover: { method: 'disabled', recipeId: 'none' }
    })
  }

  for (const region of regions) {
    const mainId = toRegionId(region.name)
    metaRegions.push({
      id: mainId,
      world: dim,
      kind: 'region',
      discover: {
        method: region.hasSpawn === true ? 'first_join' : 'on_enter',
        recipeId: getRecipeId('region', dim)
      }
    })
    if (includeHeartRegions) {
      metaRegions.push({
        id: `heart_of_${mainId}`,
        world: dim,
        kind: 'heart',
        discover: { method: 'on_enter', recipeId: getRecipeId('heart', dim) }
      })
    }
    if (includeVillages && region.subregions) {
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

  const hasSpawnRegionWithHasSpawn = dim === 'overworld' && hasSpawnCoords && regions.some(r => r.hasSpawn === true)
  if (hasSpawnRegionWithHasSpawn) {
    const startRegion = regions.find(r => r.hasSpawn === true)!
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
  for (const r of regions) {
    if (r.challengeLevel && CHALLENGE_TO_BAND[r.challengeLevel]) {
      regionBands[toRegionId(r.name)] = CHALLENGE_TO_BAND[r.challengeLevel]
    }
  }
  const hasVillagesForLevelled = includeVillages && regions.some(r => r.subregions?.some(s => s.type === 'village'))
  if (Object.keys(regionBands).length > 0 || hasVillagesForLevelled) {
    root.levelledMobs = {
      villageBandStrategy: 'easy',
      ...(Object.keys(regionBands).length > 0 ? { regionBands } : {})
    }
  }

  try {
    const yamlStr = yaml.dump(root, { lineWidth: -1, noRefs: true })
    const blob = new Blob([yamlStr], { type: 'text/yaml' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'regions-meta.yml'
    link.click()
    URL.revokeObjectURL(link.href)
  } catch (e) {
    onShowToast('Failed to generate regions-meta.yml', 'error')
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

// Generate LevelledMobs rules YAML
export function generateLevelledMobsRulesYAML(
  regions: Region[], 
  worldName: string,
  spawnCoordinates?: { x: number; z: number; radius?: number } | null,
  worldType?: 'overworld' | 'nether',
  onShowToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void
): void {
  if (regions.length === 0 && !spawnCoordinates) {
    onShowToast('No regions or spawn to generate LevelledMobs rules for', 'error')
    return
  }

  let yamlContent = '# LevelledMobs Rules Configuration\n'
  yamlContent += `# Generated for world: ${worldName}\n`
  yamlContent += `# Generated on: ${new Date().toISOString()}\n\n`

  let ruleCount = 0

  // 1. Spawn region rule (if spawn is set)
  if (spawnCoordinates) {
    yamlContent += `# Spawn region rule\n`
    yamlContent += `- custom-rule: 'Disable Leveling in Spawn Region'\n`
    yamlContent += `  is-enabled: true\n`
    yamlContent += `  use-preset: challenge-vanilla\n`
    yamlContent += `  conditions:\n`
    yamlContent += `    worlds: 'world'\n`
    yamlContent += `    worldguard-regions: 'spawn'\n\n`
    ruleCount++
  }

  // 2. Heart regions rule (all heart regions with vanilla level)
  const heartRegions = regions.map(region => `heart_of_${region.name.toLowerCase().replace(/\s+/g, '_')}`)
  if (heartRegions.length > 0) {
    yamlContent += `# Heart regions rule\n`
    yamlContent += `- custom-rule: 'Disable Leveling in Heart Regions'\n`
    yamlContent += `  is-enabled: true\n`
    yamlContent += `  use-preset: challenge-vanilla\n`
    yamlContent += `  conditions:\n`
    yamlContent += `    worlds: 'world'\n`
    yamlContent += `    worldguard-regions:\n`
    heartRegions.forEach(region => {
      yamlContent += `      - '${region}'\n`
    })
    yamlContent += `\n`
    ruleCount++
  }

  // 3. Village regions rule (all villages with vanilla level)
  const villageRegions: string[] = []
  regions.forEach(region => {
    if (region.subregions) {
      region.subregions.forEach(subregion => {
        if (subregion.type === 'village') {
          villageRegions.push(subregion.name.toLowerCase().replace(/\s+/g, '_'))
        }
      })
    }
  })
  
  if (villageRegions.length > 0) {
    yamlContent += `# Village regions rule\n`
    yamlContent += `- custom-rule: 'Disable Leveling in Village Regions'\n`
    yamlContent += `  is-enabled: true\n`
    yamlContent += `  use-preset: challenge-vanilla\n`
    yamlContent += `  conditions:\n`
    yamlContent += `    worlds: 'world'\n`
    yamlContent += `    worldguard-regions:\n`
    villageRegions.forEach(region => {
      yamlContent += `      - '${region}'\n`
    })
    yamlContent += `\n`
    ruleCount++
  }

  // 4. Individual region rules based on their challenge levels
  yamlContent += `# Region-specific challenge presets\n`
  regions.forEach(region => {
    if (region.challengeLevel) {
      const presetName = `challenge-${region.challengeLevel.toLowerCase()}`
      const regionName = region.name.toLowerCase().replace(/\s+/g, '_')
      
      yamlContent += `- custom-rule: '${region.name} - ${region.challengeLevel} Challenge'\n`
      yamlContent += `  is-enabled: true\n`
      yamlContent += `  use-preset: ${presetName}\n`
      yamlContent += `  conditions:\n`
      yamlContent += `    worlds: 'world'\n`
      yamlContent += `    worldguard-regions: '${regionName}'\n\n`
      ruleCount++
    }
  })

  const dataBlob = new Blob([yamlContent], { type: 'text/yaml' })
  
  const link = document.createElement('a')
  link.href = URL.createObjectURL(dataBlob)
  link.download = `${worldName}-rules.yml`
  link.click()
  
  URL.revokeObjectURL(link.href)
  
  onShowToast(`Generated ${ruleCount} LevelledMobs rules`, 'success')
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
