import { Subregion, Region, StructureType, STRUCTURE_TYPES } from '../types'
import { isPointInPolygon } from './polygonUtils'
import { generateVillageNameByWorldType, generateJunglePyramidName, generateIglooName, generateDesertPyramidName, generateDesertWellName, generatePillagerOutpostName, generateAncientCityName, generateTrailRuinsName, generateBuriedTreasureName } from './nameGenerator'

/** Cuboid bounds for jungle pyramid (x, z = origin, topY = top of pyramid). */
export function getJunglePyramidCuboid(x: number, z: number, topY: number): { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number } {
  return {
    minX: x - 2,
    maxX: x + 16,
    minZ: z - 2,
    maxZ: z + 16,
    minY: topY - 7,
    maxY: topY + 9
  }
}

/** Cuboid bounds for desert pyramid (x, z = NW corner; y = structure Y from CSV). */
export function getDesertPyramidCuboid(x: number, z: number, y: number): { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number } {
  // Structure footprint is 21x21 inclusive from NW corner. Expand by 2 blocks on each side to get 25x25.
  return {
    minX: x - 2,
    maxX: x + 22,
    minZ: z - 2,
    maxZ: z + 22,
    minY: y - 25,
    maxY: y + 5
  }
}

/**
 * Cuboid bounds for pillager outpost (x, z, y = structure position from CSV / locator).
 * East–west: ±25 from locator x (51 blocks inclusive). Z unchanged.
 * Vertical span: y−6 … y+12.
 */
export function getPillagerOutpostCuboid(x: number, z: number, y: number): { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number } {
  return {
    minX: x - 25,
    maxX: x + 25,
    minZ: z - 32,
    maxZ: z + 18,
    minY: y - 6,
    maxY: y + 12
  }
}

const STRUCTURE_NAME_GENERATORS: Record<StructureType, () => string> = {
  [STRUCTURE_TYPES.JUNGLE_PYRAMID]: generateJunglePyramidName,
  [STRUCTURE_TYPES.IGLOO]: generateIglooName,
  [STRUCTURE_TYPES.DESERT_PYRAMID]: generateDesertPyramidName,
  [STRUCTURE_TYPES.DESERT_WELL]: generateDesertWellName,
  [STRUCTURE_TYPES.PILLAGER_OUTPOST]: generatePillagerOutpostName,
  [STRUCTURE_TYPES.ANCIENT_CITY]: generateAncientCityName,
  [STRUCTURE_TYPES.TRAIL_RUINS]: generateTrailRuinsName,
  [STRUCTURE_TYPES.BURIED_TREASURE]: generateBuriedTreasureName,
}

export interface VillageData {
  x: number
  z: number
  /** Present when CSV uses seed;structure;x;y;z;details */
  y?: number
  details: string
  type: string
}

function csvRowHasYColumn(headerLine: string): boolean {
  const line = headerLine.trim().toLowerCase()
  return line.includes('x;y;z') || /^seed[^;]*;structure[^;]*;x[^;]*;y[^;]*;z/i.test(line)
}

export function parseVillageCSV(csvContent: string): VillageData[] {
  const lines = csvContent.split('\n')
  const villages: VillageData[] = []

  let dataStartIndex = 0
  let hasYColumn = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith('Sep=') || line.startsWith('#')) {
      continue
    }
    if (line.startsWith('seed') && line.includes('structure') && line.includes('x') && line.includes('z')) {
      hasYColumn = csvRowHasYColumn(line)
      dataStartIndex = i + 1
      break
    }
  }

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith('Sep=') || line.startsWith('#')) continue

    const parts = line.split(';')
    if (hasYColumn && parts.length >= 6) {
      const [, structure, xs, ys, zs] = parts
      const details = parts.slice(5).join(';')
      const yNum = parseInt(ys, 10)
      villages.push({
        x: parseInt(xs, 10),
        z: parseInt(zs, 10),
        ...(!Number.isNaN(yNum) ? { y: yNum } : {}),
        details,
        type: structure
      })
    } else if (!hasYColumn && parts.length >= 5) {
      const [, structure, xs, zs] = parts
      const details = parts.slice(4).join(';')
      villages.push({
        x: parseInt(xs, 10),
        z: parseInt(zs, 10),
        details,
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
    ...(village.y !== undefined ? { y: village.y } : {}),
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
    ...(row.y !== undefined ? { y: row.y } : {}),
    radius: 64,
    type: 'structure',
    structureType,
    details: row.details,
    parentRegionId
  }
}

export function generateSubregionYAML(subregion: Subregion, parentRegionName: string, _dimension?: 'overworld' | 'nether' | 'end', useModernWorldHeight: boolean = true, useGreetingsAndFarewells: boolean = false, greetingSize: 'large' | 'small' | 'chat' = 'large'): string | null {
  const subregionName = subregion.name.toLowerCase().replace(/\s+/g, '_')
  const parentRegionNameForYAML = parentRegionName.toLowerCase().replace(/\s+/g, '_')
  
  const isVillage = subregion.type === 'village'
  const isStructure = subregion.type === 'structure'
  const isJunglePyramid = isStructure && subregion.structureType === STRUCTURE_TYPES.JUNGLE_PYRAMID
  const isDesertPyramid = isStructure && subregion.structureType === STRUCTURE_TYPES.DESERT_PYRAMID
  const isPillagerOutpost = isStructure && subregion.structureType === STRUCTURE_TYPES.PILLAGER_OUTPOST
  const isDesertWell = isStructure && subregion.structureType === STRUCTURE_TYPES.DESERT_WELL

  if (isStructure && subregion.y === undefined) {
    return null
  }

  let minX: number
  let maxX: number
  let minZ: number
  let maxZ: number
  let minY: number
  let maxY: number

  const worldMinY = useModernWorldHeight ? -64 : 0
  const worldMaxY = useModernWorldHeight ? 320 : 255

  if (isJunglePyramid && subregion.y !== undefined) {
    const cuboid = getJunglePyramidCuboid(subregion.x, subregion.z, subregion.y)
    minX = cuboid.minX
    maxX = cuboid.maxX
    minZ = cuboid.minZ
    maxZ = cuboid.maxZ
    minY = Math.max(worldMinY, cuboid.minY)
    maxY = Math.min(worldMaxY, cuboid.maxY)
  } else if (isDesertPyramid && subregion.y !== undefined) {
    const cuboid = getDesertPyramidCuboid(subregion.x, subregion.z, subregion.y)
    minX = cuboid.minX
    maxX = cuboid.maxX
    minZ = cuboid.minZ
    maxZ = cuboid.maxZ
    minY = Math.max(worldMinY, cuboid.minY)
    maxY = Math.min(worldMaxY, cuboid.maxY)
  } else if (isPillagerOutpost && subregion.y !== undefined) {
    const cuboid = getPillagerOutpostCuboid(subregion.x, subregion.z, subregion.y)
    minX = cuboid.minX
    maxX = cuboid.maxX
    minZ = cuboid.minZ
    maxZ = cuboid.maxZ
    minY = Math.max(worldMinY, cuboid.minY)
    maxY = Math.min(worldMaxY, cuboid.maxY)
  } else if (isDesertWell && subregion.y !== undefined) {
    // Desert wells: CSV coordinates are the center of the structure.
    minX = subregion.x - 3
    maxX = subregion.x + 3
    minZ = subregion.z - 3
    maxZ = subregion.z + 3
    minY = subregion.y - 10
    maxY = subregion.y + 1
  } else if (isVillage && subregion.y !== undefined) {
    // Villages: use village Y to size the WorldGuard cuboid.
    // Auto behavior: min = y-35, max = y+45.
    // Custom height behavior: min/max use ceil(height/2) on both sides.
    minX = subregion.x - subregion.radius
    maxX = subregion.x + subregion.radius
    minZ = subregion.z - subregion.radius
    maxZ = subregion.z + subregion.radius
    if (subregion.height !== undefined) {
      const halfHeight = Math.ceil(subregion.height / 2)
      minY = subregion.y - halfHeight
      maxY = subregion.y + halfHeight
    } else {
      minY = subregion.y - 35
      maxY = subregion.y + 45
    }
  } else {
    // Fallback (no structure Y for non-jungle structures; no village Y from legacy CSVs).
    minY = worldMinY
    maxY = worldMaxY
    minX = subregion.x - subregion.radius
    maxX = subregion.x + subregion.radius
    minZ = subregion.z - subregion.radius
    maxZ = subregion.z + subregion.radius
  }

  const greetingText = isVillage ? 'Welcome to' : 'Entering'
  const locationLabel = isVillage ? `${subregion.name} village` : subregion.name

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
    priority: 10
    parent: ${parentRegionNameForYAML}
    ${useGreetingsAndFarewells ? `flags:\n${flags}` : `flags: ${flags}`}
    min: {x: ${minX}, y: ${minY}, z: ${minZ}}
    max: {x: ${maxX}, y: ${maxY}, z: ${maxZ}}`
}
