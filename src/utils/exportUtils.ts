import { Region, MapState } from '../types'
import { generateRegionYAML } from './polygonUtils'
import { ExportSettings, loadExportSettings } from './persistenceUtils'


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

// Generate achievements YAML for regions and villages
export function generateAchievementsYAML(regions: Region[], worldType?: 'overworld' | 'nether', onShowToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void): void {
  if (regions.length === 0) {
    onShowToast('No regions to generate achievements for', 'error')
    return
  }

  let yamlContent = 'Commands:\n'
  let achievementCount = 0

  // Generate achievements for each region
  regions.forEach(region => {
    const regionKey = region.name.replace(/\s+/g, '')
    const achievementKey = `discover${regionKey}`
    
    // Determine messages based on world type
    const regionMessage = worldType === 'nether' 
      ? `You discovered the nether region of ${region.name}`
      : `You discovered the region of ${region.name}`
    const regionDisplayName = worldType === 'nether' 
      ? 'Nether Region Discovery'
      : 'Region Discovery'
    
    yamlContent += `  ${achievementKey}:\n`
    yamlContent += `    Goal: Discover ${region.name} Region\n`
    yamlContent += `    Message: ${regionMessage}\n`
    yamlContent += `    Name: discover_${region.name.toLowerCase().replace(/\s+/g, '_')}\n`
    yamlContent += `    DisplayName: ${regionDisplayName}\n`
    yamlContent += `    Type: normal\n`
    achievementCount++

    // Generate heart achievement for this region
    const heartKey = `discoverHeartOf${regionKey}`
    const heartMessage = worldType === 'nether'
      ? `You discovered the nether ${region.name.toLowerCase().replace(/\s+/g, '_')}`
      : `You discovered the Heart of ${region.name}`
    const heartDisplayName = worldType === 'nether'
      ? 'Nether Heart Discovery'
      : 'Heart Discovery'
    
    yamlContent += `  ${heartKey}:\n`
    yamlContent += `    Goal: Discover the Heart of ${region.name}\n`
    yamlContent += `    Message: ${heartMessage}\n`
    yamlContent += `    Name: discover_heart_of_${region.name.toLowerCase().replace(/\s+/g, '_')}\n`
    yamlContent += `    DisplayName: ${heartDisplayName}\n`
    yamlContent += `    Type: normal\n`
    achievementCount++

    // Generate achievements for villages in this region
    if (region.subregions && region.subregions.length > 0) {
      region.subregions.forEach(subregion => {
        if (subregion.type === 'village') {
          const villageKey = subregion.name.replace(/\s+/g, '')
          const villageAchievementKey = `discover${villageKey}`
          
          yamlContent += `  ${villageAchievementKey}:\n`
          yamlContent += `    Goal: Discover ${subregion.name} Village\n`
          yamlContent += `    Message: You discovered the village of ${subregion.name}\n`
          yamlContent += `    Name: discover_${subregion.name.toLowerCase().replace(/\s+/g, '_')}\n`
          yamlContent += `    DisplayName: Village Discovery\n`
          yamlContent += `    Type: normal\n`
          achievementCount++
        }
      })
    }
  })

  const dataBlob = new Blob([yamlContent], { type: 'text/yaml' })
  
  const link = document.createElement('a')
  link.href = URL.createObjectURL(dataBlob)
  link.download = `achievements.yml`
  link.click()
  
  URL.revokeObjectURL(link.href)
  
  onShowToast(`Generated ${achievementCount} achievements`, 'success')
}

// Generate event conditions YAML for regions and villages
export function generateEventConditionsYAML(regions: Region[], worldType?: 'overworld' | 'nether', onShowToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void): void {
  if (regions.length === 0) {
    onShowToast('No regions to generate event conditions for', 'error')
    return
  }

  let yamlContent = 'Events:\n'
  let eventCount = 0

  // Generate event conditions for each region
  regions.forEach(region => {
    const regionKey = region.name.toLowerCase().replace(/\s+/g, '_')
    const eventKey = `${regionKey}_discover_once`
    
    yamlContent += `  ${eventKey}:\n`
    yamlContent += `    type: wgevents_region_enter\n`
    yamlContent += `    conditions:\n`
    yamlContent += `      - '%region% == ${region.name.toLowerCase().replace(/\s+/g, '_')}'\n`
    yamlContent += `    one_time: true\n`
    yamlContent += `    actions:\n`
    yamlContent += `      default:\n`
    yamlContent += `        - 'wait: 5'\n`
    yamlContent += `        - 'console_command: aach give discover${region.name.replace(/\s+/g, '')} %player%'\n`
    yamlContent += `        - 'console_command: aach add 1 Custom.${worldType === 'nether' ? 'nether_' : ''}regions_discovered %player%'\n`
    yamlContent += `        - 'console_command: cc give virtual RegionCrate 1 %player%'\n`
    eventCount++

    // Generate heart event conditions for this region
    const heartEventKey = `heart_of_${regionKey}_discover_once`
    yamlContent += `  ${heartEventKey}:\n`
    yamlContent += `    type: wgevents_region_enter\n`
    yamlContent += `    conditions:\n`
    yamlContent += `      - '%region% == heart_of_${regionKey}'\n`
    yamlContent += `    one_time: true\n`
    yamlContent += `    actions:\n`
    yamlContent += `      default:\n`
    yamlContent += `        - 'wait: 5'\n`
    yamlContent += `        - 'console_command: aach give discoverHeartOf${region.name.replace(/\s+/g, '')} %player%'\n`
    yamlContent += `        - 'console_command: aach add 1 Custom.${worldType === 'nether' ? 'nether_' : ''}hearts_discovered %player%'\n`
    yamlContent += `        - 'console_command: cc give virtual RegionCrate 1 %player%'\n`
    eventCount++

    // Generate event conditions for villages in this region
    if (region.subregions && region.subregions.length > 0) {
      region.subregions.forEach(subregion => {
        if (subregion.type === 'village') {
          const villageKey = subregion.name.toLowerCase().replace(/\s+/g, '_')
          const villageEventKey = `${villageKey}_discover_once`
          
          yamlContent += `  ${villageEventKey}:\n`
          yamlContent += `    type: wgevents_region_enter\n`
          yamlContent += `    conditions:\n`
          yamlContent += `      - '%region% == ${subregion.name.toLowerCase().replace(/\s+/g, '_')}'\n`
          yamlContent += `    one_time: true\n`
          yamlContent += `    actions:\n`
          yamlContent += `      default:\n`
          yamlContent += `        - 'wait: 5'\n`
          yamlContent += `        - 'console_command: aach give discover${subregion.name.replace(/\s+/g, '')} %player%'\n`
          yamlContent += `        - 'console_command: aach add 1 Custom.villages_discovered %player%'\n`
          yamlContent += `        - 'console_command: aach add 1 Custom.total_discovered %player%'\n`
          yamlContent += `        - 'console_command: cc give virtual VillageCrate 1 %player%'\n`
          eventCount++
        }
      })
    }
  })

  const dataBlob = new Blob([yamlContent], { type: 'text/yaml' })
  
  const link = document.createElement('a')
  link.href = URL.createObjectURL(dataBlob)
  link.download = `event_conditions.yml`
  link.click()
  
  URL.revokeObjectURL(link.href)
  
  onShowToast(`Generated ${eventCount} event conditions`, 'success')
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
