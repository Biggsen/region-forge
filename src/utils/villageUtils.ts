import { Subregion, Region, StructureType, STRUCTURE_TYPES } from '../types'
import { isPointInPolygon } from './polygonUtils'
import { generateVillageNameByWorldType, generateJunglePyramidName, generateIglooName, generateDesertPyramidName, generateBuriedTreasureName } from './nameGenerator'

const STRUCTURE_NAME_GENERATORS: Record<StructureType, () => string> = {
  [STRUCTURE_TYPES.JUNGLE_PYRAMID]: generateJunglePyramidName,
  [STRUCTURE_TYPES.IGLOO]: generateIglooName,
  [STRUCTURE_TYPES.DESERT_PYRAMID]: generateDesertPyramidName,
  [STRUCTURE_TYPES.BURIED_TREASURE]: generateBuriedTreasureName,
}

export interface VillageData {
  x: number
  z: number
  details: string
  type: string
}

export function parseVillageCSV(csvContent: string): VillageData[] {
  const lines = csvContent.split('\n')
  const villages: VillageData[] = []
  
  // Skip header lines and find the data start
  let dataStartIndex = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    // Skip empty lines, separator declarations, and coordinate boundaries
    if (!line || line.startsWith('Sep=') || line.startsWith('#')) {
      continue
    }
    if (line.startsWith('seed;structure;x;z;details')) {
      dataStartIndex = i + 1
      break
    }
  }
  
  // Parse village data
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    // Skip empty lines, separator declarations, and coordinate boundaries
    if (!line || line.startsWith('Sep=') || line.startsWith('#')) continue
    
    const parts = line.split(';')
    if (parts.length >= 5) {
      const [, structure, x, z, details] = parts
      villages.push({
        x: parseInt(x),
        z: parseInt(z),
        details: details,
        type: structure
      })
    }
  }
  
  return villages
}

export function findParentRegion(village: VillageData, regions: Region[]): Region | null {
  // Find the first region that contains this village
  for (const region of regions) {
    if (region.points.length >= 3 && isPointInPolygon({ x: village.x, z: village.z }, region.points)) {
      return region
    }
  }
  return null
}

export function createVillageSubregion(village: VillageData, index: number, parentRegionId?: string, existingNames: Set<string> = new Set(), dimension: 'overworld' | 'nether' | 'end' = 'overworld'): Subregion {
  let generatedName = generateVillageNameByWorldType(dimension)
  let attempts = 0
  const maxAttempts = 100 // Prevent infinite loops
  
  // Keep generating names until we find a unique one
  while (existingNames.has(generatedName) && attempts < maxAttempts) {
    generatedName = generateVillageNameByWorldType(dimension)
    attempts++
  }
  
  // If we still have a duplicate after max attempts, append a number
  if (existingNames.has(generatedName)) {
    let counter = 1
    let baseName = generatedName
    while (existingNames.has(generatedName) && counter < 1000) {
      generatedName = `${baseName} ${counter}`
      counter++
    }
  }
  
  return {
    id: `village_${index}`,
    name: generatedName,
    x: village.x,
    z: village.z,
    radius: 64, // Default village radius
    type: 'village',
    details: village.details, // Keep original details for reference
    parentRegionId
  }
}

export function createStructureSubregion(
  row: VillageData,
  index: number,
  structureType: StructureType,
  parentRegionId?: string,
  existingNames: Set<string> = new Set()
): Subregion {
  const generateName = STRUCTURE_NAME_GENERATORS[structureType]
  let generatedName = generateName()
  let attempts = 0
  const maxAttempts = 100
  while (existingNames.has(generatedName) && attempts < maxAttempts) {
    generatedName = generateName()
    attempts++
  }
  if (existingNames.has(generatedName)) {
    let counter = 1
    const baseName = generatedName
    while (existingNames.has(generatedName) && counter < 1000) {
      generatedName = `${baseName} ${counter}`
      counter++
    }
  }
  return {
    id: `structure_${structureType}_${index}`,
    name: generatedName,
    x: row.x,
    z: row.z,
    radius: 64,
    type: 'structure',
    structureType,
    details: row.details,
    parentRegionId
  }
}

export function generateSubregionYAML(subregion: Subregion, parentRegionName: string, _dimension?: 'overworld' | 'nether' | 'end', useModernWorldHeight: boolean = true, useGreetingsAndFarewells: boolean = false, greetingSize: 'large' | 'small' | 'chat' = 'large'): string {
  const subregionName = subregion.name.toLowerCase().replace(/\s+/g, '_')
  const parentRegionNameForYAML = parentRegionName.toLowerCase().replace(/\s+/g, '_')
  
  const isVillage = subregion.type === 'village'
  const greetingText = isVillage ? 'Welcome to' : 'Entering'
  const locationLabel = isVillage ? `${subregion.name} village` : subregion.name
  
  // Use world height setting instead of subregion's minY/maxY
  const minY = useModernWorldHeight ? -64 : 0
  const maxY = useModernWorldHeight ? 320 : 255

  let flags: string
  if (useGreetingsAndFarewells) {
    if (greetingSize === 'chat') {
      flags = `      greeting: §2Entering §7${locationLabel}\n      farewell: §6Leaving §7${locationLabel}\n      passthrough: allow`
    } else {
      let greetingLine1: string
      let greetingLine2: string
      let farewellLine1: string
      let farewellLine2: string
      
      if (greetingSize === 'large') {
        greetingLine1 = `§f${isVillage ? greetingText + ' ' : ''}${locationLabel}`
        greetingLine2 = `§f`
        farewellLine1 = `§fLeaving ${locationLabel}`
        farewellLine2 = `§f`
      } else {
        greetingLine1 = `§f`
        greetingLine2 = `§f${isVillage ? greetingText + ' ' : ''}${locationLabel}`
        farewellLine1 = `§f`
        farewellLine2 = `§fLeaving ${locationLabel}`
      }
      
      flags = `      greeting-title: |-\n        ${greetingLine1}\n        ${greetingLine2}\n      farewell-title: |-\n        ${farewellLine1}\n        ${farewellLine2}\n      passthrough: allow`
    }
  } else {
    flags = `{passthrough: allow}`
  }

  return `  ${subregionName}:
    type: cuboid
    min-y: ${minY}
    max-y: ${maxY}
    priority: 10
    parent: ${parentRegionNameForYAML}
    ${useGreetingsAndFarewells ? `flags:\n${flags}` : `flags: ${flags}`}
    min: {x: ${subregion.x - subregion.radius}, y: ${minY}, z: ${subregion.z - subregion.radius}}
    max: {x: ${subregion.x + subregion.radius}, y: ${maxY}, z: ${subregion.z + subregion.radius}}`
}
