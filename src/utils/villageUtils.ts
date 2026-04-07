import { Subregion, Region, StructureType, STRUCTURE_TYPES } from '../types'
import { isPointInPolygon } from './polygonUtils'
import { generateVillageNameByWorldType, generateJunglePyramidName, generateIglooName, generateDesertPyramidName, generateDesertWellName, generatePillagerOutpostName, generateAncientCityName, generateTrailRuinsName, generateBuriedTreasureName, generateWoodlandMansionName, generateSwampHutName, generateShipwreckName } from './nameGenerator'

/*
 * Structure CSV x/z/y are not one shared rule: each structure type maps columns differently (locator, a corner,
 * horizontal center, chest block, etc.). Each cuboid helper’s doc comment states what its arguments represent.
 */

/** Locator Y used for ancient city imports; CSV y column is ignored. */
export const ANCIENT_CITY_IMPORT_Y = -32

/** Horizontal radius from locator (x, z) for ancient city regions.yml cuboid. */
export const ANCIENT_CITY_EXPORT_XZ_RADIUS = 36

/** Vertical offsets from locator y (measured: bottom y−53, top y−19 when locator y = −32). */
export const ANCIENT_CITY_EXPORT_MIN_Y_BELOW = 21
export const ANCIENT_CITY_EXPORT_MAX_Y_ABOVE = 13

/** Cuboid bounds for ancient city (x, z = locator; y = structure/locator Y). */
export function getAncientCityCuboid(
  x: number,
  z: number,
  y: number
): { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number } {
  const r = ANCIENT_CITY_EXPORT_XZ_RADIUS
  return {
    minX: x - r,
    maxX: x + r,
    minZ: z - r,
    maxZ: z + r,
    minY: y - ANCIENT_CITY_EXPORT_MIN_Y_BELOW,
    maxY: y + ANCIENT_CITY_EXPORT_MAX_Y_ABOVE
  }
}

/** Cuboid bounds for jungle temple (x, z = origin, topY = top of structure). */
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

/** Cuboid bounds for desert pyramid only: x, z = that structure’s NW corner; y = structure Y from CSV. */
export function getDesertPyramidCuboid(x: number, z: number, y: number): { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number } {
  // Footprint 21×21 inclusive from that NW corner; pad 2 blocks each side → 25×25.
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
 * Vertical span: y−6 … y+25.
 */
export function getPillagerOutpostCuboid(x: number, z: number, y: number): { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number } {
  return {
    minX: x - 25,
    maxX: x + 25,
    minZ: z - 32,
    maxZ: z + 18,
    minY: y - 6,
    maxY: y + 25
  }
}

/** Cuboid bounds for igloo (x, z, y = locator). West −2, east +8, north 0, south +12; down −36, up +12. */
export function getIglooCuboid(x: number, z: number, y: number): { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number } {
  return {
    minX: x - 2,
    maxX: x + 8,
    minZ: z,
    maxZ: z + 12,
    minY: y - 36,
    maxY: y + 12
  }
}

/** Horizontal radius from locator (x, z) for trail ruins — small surface “discoverable” footprint. */
export const TRAIL_RUINS_EXPORT_XZ_RADIUS = 6

/** Cuboid bounds for trail ruins (x, z, y = locator). XZ ±6; vertical y−6 … y+2. */
export function getTrailRuinsCuboid(x: number, z: number, y: number): { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number } {
  const r = TRAIL_RUINS_EXPORT_XZ_RADIUS
  return {
    minX: x - r,
    maxX: x + r,
    minZ: z - r,
    maxZ: z + r,
    minY: y - 6,
    maxY: y + 2
  }
}

/**
 * Buried treasure regions.yml cuboid. CSV (x, y, z) is the chest block; 3×3×3 with ±1 radius on each axis.
 */
export function getBuriedTreasureCuboid(
  x: number,
  z: number,
  y: number
): { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number } {
  return {
    minX: x - 1,
    maxX: x + 1,
    minZ: z - 1,
    maxZ: z + 1,
    minY: y - 1,
    maxY: y + 1
  }
}

/**
 * Woodland mansion cuboid for regions.yml: CSV x,z are the structure center; y is floor/reference height.
 * Footprint 84×66 (X×Z), inclusive; Y from y−34 through y+3.
 */
export function getWoodlandMansionCuboid(
  x: number,
  z: number,
  y: number
): { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number } {
  const widthX = 84
  const widthZ = 66
  const halfX = Math.floor(widthX / 2)
  const halfZ = Math.floor(widthZ / 2)
  return {
    minX: x - halfX,
    maxX: x + (widthX - 1) - halfX,
    minZ: z - halfZ,
    maxZ: z + (widthZ - 1) - halfZ,
    minY: y - 34,
    maxY: y + 3
  }
}

/**
 * Swamp hut (witch hut) cuboid for regions.yml.
 * x, z = minimum corner of the 7×7 footprint; y = floor / reference height. Pads 2 blocks on XZ like other small structures.
 * Vertical span: y−10 … y+3.
 */
export function getSwampHutCuboid(x: number, z: number, y: number): { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number } {
  const footprint = 7
  const pad = 2
  return {
    minX: x - pad,
    maxX: x + (footprint - 1) + pad,
    minZ: z - pad,
    maxZ: z + (footprint - 1) + pad,
    minY: y - 10,
    maxY: y + 3
  }
}

/** West extent from locator x (inclusive). */
export const SHIPWRECK_EXPORT_X_NEG = 15
/** East extent from locator x (inclusive). Total width = NEG + 1 + POS = 32 (x is horizontal center). */
export const SHIPWRECK_EXPORT_X_POS = 16

/** Z length along +Z from locator (e.g. z = −240 → … −208). */
export const SHIPWRECK_EXPORT_Z_LEN = 32

/** Vertical span below / above locator y for shipwreck regions.yml. */
export const SHIPWRECK_EXPORT_MIN_Y_BELOW = 10
export const SHIPWRECK_EXPORT_MAX_Y_ABOVE = 10

/**
 * Shipwreck regions.yml cuboid. CSV (x, z, y) is the structure locator.
 * X: center at x → [x − 15, x + 16] (32 wide).
 * Z: locator at minZ → [z, z + 32] (32 long toward +Z).
 * Y: y − 10 … y + 10.
 */
export function getShipwreckCuboid(x: number, z: number, y: number): { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number } {
  return {
    minX: x - SHIPWRECK_EXPORT_X_NEG,
    maxX: x + SHIPWRECK_EXPORT_X_POS,
    minZ: z,
    maxZ: z + SHIPWRECK_EXPORT_Z_LEN,
    minY: y - SHIPWRECK_EXPORT_MIN_Y_BELOW,
    maxY: y + SHIPWRECK_EXPORT_MAX_Y_ABOVE
  }
}

const STRUCTURE_NAME_GENERATORS: Record<StructureType, () => string> = {
  [STRUCTURE_TYPES.JUNGLE_TEMPLE]: generateJunglePyramidName,
  [STRUCTURE_TYPES.IGLOO]: generateIglooName,
  [STRUCTURE_TYPES.DESERT_PYRAMID]: generateDesertPyramidName,
  [STRUCTURE_TYPES.DESERT_WELL]: generateDesertWellName,
  [STRUCTURE_TYPES.PILLAGER_OUTPOST]: generatePillagerOutpostName,
  [STRUCTURE_TYPES.ANCIENT_CITY]: generateAncientCityName,
  [STRUCTURE_TYPES.TRAIL_RUINS]: generateTrailRuinsName,
  [STRUCTURE_TYPES.BURIED_TREASURE]: generateBuriedTreasureName,
  [STRUCTURE_TYPES.WOODLAND_MANSION]: generateWoodlandMansionName,
  [STRUCTURE_TYPES.SWAMP_HUT]: generateSwampHutName,
  [STRUCTURE_TYPES.SHIPWRECK]: generateShipwreckName,
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

/** `structure` column value for region heart CSV export/import (seed-map style). */
export const REGION_HEART_CSV_STRUCTURE = 'region_heart'

/** Parsed CSV rows whose structure column is {@link REGION_HEART_CSV_STRUCTURE} (case-insensitive). Supports `x;z` or `x;y;z` headers. */
export function parseRegionHeartImportRows(csvContent: string): VillageData[] {
  return parseVillageCSV(csvContent).filter(
    r => r.type.trim().toLowerCase() === REGION_HEART_CSV_STRUCTURE
  )
}

const REGION_HEART_CSV_BOUNDS_PADDING = 256

function sanitizeVillageFormatCsvField(value: string): string {
  return value.replace(/;/g, ',').replace(/\r?\n/g, ' ')
}

/**
 * Build a CSV in the same layout as seed-map village exports:
 * `Sep=;`, `#X1`…`#Z2` bounds, header `seed;structure;x;z;details`, then one row per region heart.
 * Returns `null` if no regions have a heart set.
 */
export function buildRegionHeartsVillageFormatCSV(regions: Region[], seed: string | undefined): string | null {
  const withHearts = regions.filter(r => r.centerPoint != null && r.points.length >= 3)
  if (withHearts.length === 0) return null

  const seedStr = sanitizeVillageFormatCsvField(
    seed != null && seed.trim() !== '' ? seed.trim() : '0'
  )

  type Row = { x: number; z: number; details: string; sortName: string }
  const rows: Row[] = withHearts.map(r => {
    const cp = r.centerPoint!
    return {
      x: Math.round(cp.x),
      z: Math.round(cp.z),
      details: sanitizeVillageFormatCsvField(r.name),
      sortName: r.name
    }
  })

  const minX = Math.min(...rows.map(r => r.x))
  const maxX = Math.max(...rows.map(r => r.x))
  const minZ = Math.min(...rows.map(r => r.z))
  const maxZ = Math.max(...rows.map(r => r.z))
  const p = REGION_HEART_CSV_BOUNDS_PADDING
  const x1 = minX - p
  const z1 = minZ - p
  const x2 = maxX + p
  const z2 = maxZ + p

  rows.sort((a, b) => a.sortName.localeCompare(b.sortName))

  const lines: string[] = [
    'Sep=;',
    `#X1;${x1}`,
    `#Z1;${z1}`,
    `#X2;${x2}`,
    `#Z2;${z2}`,
    'seed;structure;x;z;details',
    ...rows.map(r => `${seedStr};${REGION_HEART_CSV_STRUCTURE};${r.x};${r.z};${r.details}`)
  ]

  return lines.join('\n')
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
  const y = structureType === STRUCTURE_TYPES.ANCIENT_CITY ? ANCIENT_CITY_IMPORT_Y : row.y
  return {
    id: `structure_${structureType}_${index}`,
    name: generatedName,
    x: row.x,
    z: row.z,
    ...(y !== undefined ? { y } : {}),
    radius: 64,
    type: 'structure',
    structureType,
    details: row.details,
    parentRegionId
  }
}

/** Same numeric suffix rule as {@link createStructureSubregion} when a generated name still collides. */
function uniqueSubregionDisplayNameAmong(base: string, existingNames: Set<string>): string {
  if (!existingNames.has(base)) return base
  let counter = 1
  while (counter < 1000) {
    const candidate = `${base} ${counter}`
    if (!existingNames.has(candidate)) return candidate
    counter++
  }
  return base
}

/** Single manual structure: same as CSV row via {@link createStructureSubregion}, with explicit id and optional display name. */
export function buildManualStructureSubregion(options: {
  structureType: StructureType
  x: number
  z: number
  y: number
  parentRegionId: string
  existingNames: Set<string>
  subregionId: string
  name?: string
}): Subregion {
  const row: VillageData = {
    x: options.x,
    z: options.z,
    y: options.y,
    details: '',
    type: options.structureType,
  }
  const sub = createStructureSubregion(row, 0, options.structureType, options.parentRegionId, options.existingNames)
  const name =
    options.name?.trim()
      ? uniqueSubregionDisplayNameAmong(options.name.trim(), options.existingNames)
      : sub.name
  return {
    ...sub,
    id: options.subregionId,
    name,
  }
}

/**
 * Lowercase id for regions.yml / WorldGuard: only `a-z`, `0-9`, `_`, `-`.
 * Replaces `&` with `and`, strips apostrophes, maps other non-alphanumeric runs to underscores, collapses repeats.
 */
export function nameToRegionId(name: string): string {
  return name
    .replace(/\s*&\s*/g, ' and ')
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/** WorldGuard region key for subregions in regions.yml (normalized display name only; no structure-type prefix). */
export function yamlSubregionRegionId(subregion: Subregion): string {
  return nameToRegionId(subregion.name)
}

export function generateSubregionYAML(subregion: Subregion, parentRegionName: string, _dimension?: 'overworld' | 'nether' | 'end', useModernWorldHeight: boolean = true, useGreetingsAndFarewells: boolean = false, greetingSize: 'large' | 'small' | 'chat' = 'large'): string | null {
  const subregionName = yamlSubregionRegionId(subregion)
  const parentRegionNameForYAML = nameToRegionId(parentRegionName)
  
  const isVillage = subregion.type === 'village'
  const isStructure = subregion.type === 'structure'
  const isJungleTemple = isStructure && subregion.structureType === STRUCTURE_TYPES.JUNGLE_TEMPLE
  const isDesertPyramid = isStructure && subregion.structureType === STRUCTURE_TYPES.DESERT_PYRAMID
  const isPillagerOutpost = isStructure && subregion.structureType === STRUCTURE_TYPES.PILLAGER_OUTPOST
  const isAncientCity = isStructure && subregion.structureType === STRUCTURE_TYPES.ANCIENT_CITY
  const isIgloo = isStructure && subregion.structureType === STRUCTURE_TYPES.IGLOO
  const isTrailRuins = isStructure && subregion.structureType === STRUCTURE_TYPES.TRAIL_RUINS
  const isDesertWell = isStructure && subregion.structureType === STRUCTURE_TYPES.DESERT_WELL
  const isBuriedTreasure = isStructure && subregion.structureType === STRUCTURE_TYPES.BURIED_TREASURE
  const isWoodlandMansion = isStructure && subregion.structureType === STRUCTURE_TYPES.WOODLAND_MANSION
  const isSwampHut = isStructure && subregion.structureType === STRUCTURE_TYPES.SWAMP_HUT
  const isShipwreck = isStructure && subregion.structureType === STRUCTURE_TYPES.SHIPWRECK

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

  if (isJungleTemple && subregion.y !== undefined) {
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
  } else if (isAncientCity && subregion.y !== undefined) {
    const cuboid = getAncientCityCuboid(subregion.x, subregion.z, subregion.y)
    minX = cuboid.minX
    maxX = cuboid.maxX
    minZ = cuboid.minZ
    maxZ = cuboid.maxZ
    minY = Math.max(worldMinY, cuboid.minY)
    maxY = Math.min(worldMaxY, cuboid.maxY)
  } else if (isIgloo && subregion.y !== undefined) {
    const cuboid = getIglooCuboid(subregion.x, subregion.z, subregion.y)
    minX = cuboid.minX
    maxX = cuboid.maxX
    minZ = cuboid.minZ
    maxZ = cuboid.maxZ
    minY = Math.max(worldMinY, cuboid.minY)
    maxY = Math.min(worldMaxY, cuboid.maxY)
  } else if (isTrailRuins && subregion.y !== undefined) {
    const cuboid = getTrailRuinsCuboid(subregion.x, subregion.z, subregion.y)
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
  } else if (isBuriedTreasure && subregion.y !== undefined) {
    const cuboid = getBuriedTreasureCuboid(subregion.x, subregion.z, subregion.y)
    minX = cuboid.minX
    maxX = cuboid.maxX
    minZ = cuboid.minZ
    maxZ = cuboid.maxZ
    minY = Math.max(worldMinY, cuboid.minY)
    maxY = Math.min(worldMaxY, cuboid.maxY)
  } else if (isWoodlandMansion && subregion.y !== undefined) {
    const cuboid = getWoodlandMansionCuboid(subregion.x, subregion.z, subregion.y)
    minX = cuboid.minX
    maxX = cuboid.maxX
    minZ = cuboid.minZ
    maxZ = cuboid.maxZ
    minY = Math.max(worldMinY, cuboid.minY)
    maxY = Math.min(worldMaxY, cuboid.maxY)
  } else if (isSwampHut && subregion.y !== undefined) {
    const cuboid = getSwampHutCuboid(subregion.x, subregion.z, subregion.y)
    minX = cuboid.minX
    maxX = cuboid.maxX
    minZ = cuboid.minZ
    maxZ = cuboid.maxZ
    minY = Math.max(worldMinY, cuboid.minY)
    maxY = Math.min(worldMaxY, cuboid.maxY)
  } else if (isShipwreck && subregion.y !== undefined) {
    const cuboid = getShipwreckCuboid(subregion.x, subregion.z, subregion.y)
    minX = cuboid.minX
    maxX = cuboid.maxX
    minZ = cuboid.minZ
    maxZ = cuboid.maxZ
    minY = Math.max(worldMinY, cuboid.minY)
    maxY = Math.min(worldMaxY, cuboid.maxY)
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
