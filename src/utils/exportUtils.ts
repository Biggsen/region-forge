import { Region, MapState, StructureType, STRUCTURE_TYPES } from '../types'
import { getEffectiveMapImage } from './mapStateUtils'
import { scanBiomes } from './biomeScanner'
import { generateRegionYAML } from './polygonUtils'
import { generateSubregionYAML, nameToRegionId, yamlSubregionRegionId } from './villageUtils'
import { ExportSettings, loadExportSettings } from './persistenceUtils'
import yaml from 'js-yaml'


export interface MapExportData {
  version: string
  /** Increments on each regions.yml export; persisted in project JSON. */
  regionForgeYamlGeneration?: number
  worldName: string
  seed?: string
  dimension?: string
  worldSize?: number
  imageSize?: { width: number; height: number }
  regions: Region[]
  mapState: Omit<MapState, 'image'> & { imageSrc?: string }
  spawnCoordinates?: { x: number; z: number; y?: number; radius?: number } | null
  exportDate: string
  imageData?: string
  terrainImageData?: string
  biomeImageData?: string
  imageFilename?: string
  terrainImageFilename?: string
  biomeImageFilename?: string
  exportSettings?: ExportSettings
}

/** Map project JSON `version` and regions.yml `app-version` header. */
export const REGION_FORGE_APP_VERSION = '1.0.0'


// Export complete map with embedded image data
export async function exportCompleteMap(
  regions: Region[], 
  mapState: MapState, 
  worldName: string, 
  onShowToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void,
  regionForgeYamlGeneration: number = 0,
  spawnCoordinates?: { x: number; z: number; y?: number; radius?: number } | null, 
  dimension?: 'overworld' | 'nether' | 'end', 
  seed?: string, 
  worldSize?: number, 
  imageSize?: { width: number; height: number }
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
      version: REGION_FORGE_APP_VERSION,
      regionForgeYamlGeneration,
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

function sanitizeRegionForgeField(s: string): string {
  return s.replace(/[\n\r;]/g, ' ').trim()
}

function getRegionsYmlExportStats(
  regions: Region[],
  includeVillages: boolean,
  includeStructures: boolean,
  includeHeartRegions: boolean,
  includeSpawnRegion: boolean,
  spawnCoordinates: { x: number; z: number; y?: number; radius?: number } | null | undefined,
  effectiveDimension: 'overworld' | 'nether' | 'end',
  useModernWorldHeight: boolean,
  useGreetingsAndFarewells: boolean,
  greetingSize: 'large' | 'small' | 'chat'
): {
  regionCount: number
  villageCount: number
  structureCount: number
  heartCount: number
  spawn: boolean
} {
  const enabledRegions = regions.filter((region) => !region.disabled)
  const spawnIncluded = !!(
    includeSpawnRegion &&
    spawnCoordinates?.radius &&
    effectiveDimension === 'overworld'
  )

  let villageCount = 0
  let structureCount = 0
  for (const region of enabledRegions) {
    if (!region.subregions?.length || (!includeVillages && !includeStructures)) continue
    for (const sub of region.subregions) {
      const wantVillage = sub.type === 'village' && includeVillages
      const wantStructure = sub.type === 'structure' && includeStructures
      if (!wantVillage && !wantStructure) continue
      const block = generateSubregionYAML(
        sub,
        region.name,
        effectiveDimension,
        useModernWorldHeight,
        useGreetingsAndFarewells,
        greetingSize
      )
      if (block === null) continue
      if (sub.type === 'village') villageCount++
      else structureCount++
    }
  }

  const heartCount = includeHeartRegions
    ? enabledRegions.filter((r) => r.centerPoint != null).length
    : 0

  return {
    regionCount: enabledRegions.length,
    villageCount,
    structureCount,
    heartCount,
    spawn: spawnIncluded,
  }
}

function buildRegionForgeYamlPreamble(
  generatorVersion: number,
  worldName: string,
  effectiveDimension: 'overworld' | 'nether' | 'end',
  stats: ReturnType<typeof getRegionsYmlExportStats>
): string {
  const gen = String(generatorVersion).padStart(3, '0')
  const at = new Date().toISOString()
  const buildId = `rf-${Date.now()}`
  const proj = sanitizeRegionForgeField(worldName)
  const line1 =
    `# region-forge: generator-version=${gen}; generated-at=${at}; app-version=${REGION_FORGE_APP_VERSION}; ` +
    `project=${proj}; dimension=${effectiveDimension}; plugin=worldguard; export-type=regions-yml; build-id=${buildId}`
  const { regionCount, villageCount, structureCount, heartCount, spawn } = stats
  const line2 =
    `# region-forge: regions=${regionCount}; villages=${villageCount}; structures=${structureCount}; ` +
    `hearts=${heartCount}; spawn=${spawn}`
  return `${line1}\n${line2}\n`
}

export type RegionsYmlRegionForgeOptions = {
  bumpGeneration: () => number
}

export type ExportRegionsYAMLOptions = {
  regionForge?: RegionsYmlRegionForgeOptions
}

// Export all regions to YAML file in WorldGuard format
export function exportRegionsYAML(
  regions: Region[], 
  onShowToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void,
  includeVillages: boolean = true,
  includeStructures: boolean = true,
  includeHeartRegions: boolean = true,
  includeSpawnRegion: boolean = false,
  spawnCoordinates?: { x: number; z: number; y?: number; radius?: number } | null,
  dimension?: 'overworld' | 'nether' | 'end',
  worldName: string = 'world',
  useModernWorldHeight: boolean = true,
  useGreetingsAndFarewells: boolean = false,
  greetingSize: 'large' | 'small' | 'chat' = 'large',
  includeChallengeLevelSubheading: boolean = false,
  options?: ExportRegionsYAMLOptions
): void {
  const effectiveDimension = dimension || 'overworld'
  
  // Filter out disabled regions
  const enabledRegions = regions.filter(region => !region.disabled)
  
  if (enabledRegions.length === 0 && (!includeSpawnRegion || effectiveDimension === 'nether' || effectiveDimension === 'end')) {
    onShowToast('No regions to export', 'error')
    return
  }

  const stats = getRegionsYmlExportStats(
    regions,
    includeVillages,
    includeStructures,
    includeHeartRegions,
    includeSpawnRegion,
    spawnCoordinates,
    effectiveDimension,
    useModernWorldHeight,
    useGreetingsAndFarewells,
    greetingSize
  )

  let preamble = ''
  const regionForge = options?.regionForge
  if (regionForge) {
    const generatorVersion = regionForge.bumpGeneration()
    preamble = buildRegionForgeYamlPreamble(generatorVersion, worldName, effectiveDimension, stats)
  }

  let yamlContent = preamble + 'regions:\n'
  
  // Add spawn region if requested and coordinates exist (only for overworld)
  if (includeSpawnRegion && spawnCoordinates && spawnCoordinates.radius && effectiveDimension === 'overworld') {
    const spawnRegion = generateSpawnRegionYAML(spawnCoordinates as { x: number; z: number; y: number; radius: number }, useModernWorldHeight)
    yamlContent += spawnRegion
    if (enabledRegions.length > 0) {
      yamlContent += '\n'
    }
  }
  
  enabledRegions.forEach((region, index) => {
    yamlContent += generateRegionYAML(region, includeVillages, includeStructures, includeHeartRegions, effectiveDimension, useModernWorldHeight, useGreetingsAndFarewells, greetingSize, includeChallengeLevelSubheading)
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
function generateSpawnRegionYAML(spawnCoordinates: { x: number; z: number; y: number; radius: number }, useModernWorldHeight: boolean = true): string {
  const { x, z, y, radius } = spawnCoordinates

  const worldMinY = useModernWorldHeight ? -64 : 0
  const worldMaxY = useModernWorldHeight ? 320 : 255

  // Calculate cuboid bounds based on spawn point and radius (XZ and Y use radius)
  const minX = x - radius
  const maxX = x + radius
  const minZ = z - radius
  const maxZ = z + radius
  const minY = Math.max(worldMinY, y - radius)
  const maxY = Math.min(worldMaxY, y + radius)
  
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
  yaml += `      greeting: "§2You are in Spawn. This area is safe and protected."\n`
  yaml += `      farewell: "§6You have left Spawn. Your journey begins."\n`
  yaml += `      invincible: allow\n`
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
  return nameToRegionId(name)
}

/** Label + AA counter (no `Custom.` prefix) per regions-meta §7.1 — keys match `STRUCTURE_TYPES` values. */
const STRUCTURE_FAMILY_META: Record<StructureType, { label: string; counter: string }> = {
  [STRUCTURE_TYPES.ANCIENT_CITY]: { label: 'Ancient Cities', counter: 'ancient_cities_found' },
  [STRUCTURE_TYPES.BURIED_TREASURE]: { label: 'Buried Treasures', counter: 'buried_treasures_found' },
  [STRUCTURE_TYPES.DESERT_PYRAMID]: { label: 'Desert Pyramids', counter: 'desert_pyramids_found' },
  [STRUCTURE_TYPES.DESERT_WELL]: { label: 'Desert Wells', counter: 'desert_wells_found' },
  [STRUCTURE_TYPES.IGLOO]: { label: 'Igloos', counter: 'igloos_found' },
  [STRUCTURE_TYPES.JUNGLE_TEMPLE]: { label: 'Jungle Temples', counter: 'jungle_temples_found' },
  [STRUCTURE_TYPES.PILLAGER_OUTPOST]: { label: 'Pillager Outposts', counter: 'pillager_outposts_found' },
  [STRUCTURE_TYPES.TRAIL_RUINS]: { label: 'Trail Ruins', counter: 'trail_ruins_found' },
}

function pickStructureFamilies(usedTypes: Set<StructureType>): Record<string, { label: string; counter: string }> {
  const out: Record<string, { label: string; counter: string }> = {}
  for (const t of [...usedTypes].sort()) {
    const meta = STRUCTURE_FAMILY_META[t]
    if (meta) out[t] = { label: meta.label, counter: meta.counter }
  }
  return out
}

function convertDescriptionToLiteralBlock(yamlStr: string): string {
  const regex = /^(\s*description:)\s*"((?:[^"\\]|\\.)*)"\s*$/gm
  return yamlStr.replace(regex, (_, prefix, quoted) => {
    const unescaped = quoted
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
    const lines = unescaped.split('\n')
    const baseIndent = prefix.match(/^(\s*)/)![1]
    const blockIndent = baseIndent + '  '
    const blockContent = lines.map((l) => blockIndent + l).join('\n')
    return `${prefix} |\n${blockContent}`
  })
}

function getStandardWorldName(dimension: 'overworld' | 'nether' | 'end'): string {
  switch (dimension) {
    case 'overworld':
      return 'world'
    case 'nether':
      return 'world_nether'
    case 'end':
      return 'world_the_end'
    default:
      return 'world'
  }
}

export function exportRegionsMetaYAML(
  regions: Region[],
  dimension: 'overworld' | 'nether' | 'end',
  worldName: string,
  spawnState: { coordinates: { x: number; z: number; y: number } | null; radius: number },
  includeVillages: boolean,
  includeStructures: boolean,
  includeHeartRegions: boolean,
  includeSpawnRegion: boolean,
  onShowToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void,
  mapState?: MapState | null
): void {
  const dim = dimension
  const hasSpawnCoords = !!spawnState.coordinates
  const hasSpawnRegion = dim === 'overworld' && includeSpawnRegion && hasSpawnCoords && !!spawnState.radius

  // Filter out disabled regions
  const enabledRegions = regions.filter(region => !region.disabled)

  const biomeImage = mapState?.biomeImage ?? mapState?.terrainImage ?? mapState?.image ?? null
  const originOffset = mapState?.originOffset ?? null

  type MetaDiscover = { method: string }
  type MetaRegionRow = {
    id: string
    world: string
    kind: string
    discover: MetaDiscover
    structureType?: string
    biomes?: { biome: string; percentage: number }[]
    category?: string
    items?: { id: string; name: string }[]
    theme?: { a: string; b: string }[]
    description?: string
  }

  const metaRegions: MetaRegionRow[] = []
  const usedStructureTypes = new Set<StructureType>()

  if (hasSpawnRegion) {
    metaRegions.push({
      id: 'spawn',
      world: dim,
      kind: 'system',
      discover: { method: 'disabled' },
    })
  }

  for (const region of enabledRegions) {
    const mainId = toRegionId(region.name)
    const isWater = region.isWater === true
    let regionEntry: MetaRegionRow = {
      id: mainId,
      world: dim,
      kind: isWater ? 'water' : 'region',
      discover: {
        method: isWater ? 'passive' : region.hasSpawn === true ? 'first_join' : 'on_enter',
      },
    }
    if (region.description) regionEntry.description = region.description
    if (region.minecraftCategory) regionEntry.category = region.minecraftCategory
    if (region.minecraftItems && region.minecraftItems.length > 0) regionEntry.items = region.minecraftItems
    if (region.regionTheme && region.regionTheme.length > 0) regionEntry.theme = region.regionTheme
    if (dim !== 'end' && biomeImage && region.points.length >= 3) {
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
        discover: { method: 'on_enter' },
      })
    }
    if ((includeVillages || includeStructures) && dim !== 'nether' && region.subregions) {
      for (const sub of region.subregions) {
        if (sub.type === 'village' && includeVillages) {
          metaRegions.push({
            id: toRegionId(sub.name),
            world: dim,
            kind: 'village',
            discover: { method: 'on_enter' },
          })
        }
        if (sub.type === 'structure' && includeStructures && sub.structureType) {
          usedStructureTypes.add(sub.structureType)
          metaRegions.push({
            id: yamlSubregionRegionId(sub),
            world: dim,
            kind: 'structure',
            structureType: sub.structureType,
            discover: { method: 'on_enter' },
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
    regions: metaRegions,
  }

  if (usedStructureTypes.size > 0) {
    root.structureFamilies = pickStructureFamilies(usedStructureTypes)
  }

  if (dim === 'overworld' && hasSpawnCoords) {
    root.spawnCenter = {
      world: getStandardWorldName(dim),
      x: spawnState.coordinates!.x,
      y: spawnState.coordinates!.y,
      z: spawnState.coordinates!.z
    }
  }

  const spawnStartRegion = enabledRegions.find(r => r.hasSpawn === true && r.isWater !== true)
  const hasSpawnRegionWithHasSpawn = dim === 'overworld' && hasSpawnCoords && !!spawnStartRegion
  if (hasSpawnRegionWithHasSpawn) {
    const startRegion = spawnStartRegion!
    root.onboarding = {
      startRegionId: toRegionId(startRegion.name),
      teleport: {
        world: getStandardWorldName(dim),
        x: spawnState.coordinates!.x,
        y: spawnState.coordinates!.y,
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
    let yamlStr = yaml.dump(root, { lineWidth: -1, noRefs: true })
    yamlStr = convertDescriptionToLiteralBlock(yamlStr)
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
        
        // Migrate old challenge level names to new difficulty band names; ensure labelPosition is preserved
        data.regions = data.regions.map(region => ({
          ...region,
          challengeLevel: migrateChallengLevel(region.challengeLevel) as Region['challengeLevel'],
          labelPosition: region.labelPosition ?? null
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
