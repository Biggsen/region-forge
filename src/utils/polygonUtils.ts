import { Region, ChallengeLevel } from '../types'
import { generateSubregionYAML, nameToRegionId } from './villageUtils'

// Map challenge levels to their color codes and descriptions (WorldGuard greeting sublines)
function getChallengeLevelColor(challengeLevel: ChallengeLevel, isWater?: boolean): string {
  if (isWater) {
    switch (challengeLevel) {
      case 'easy':
        return '§aQuiet waters — the surface lies undisturbed'
      case 'normal':
        return '§eOpen waters — faint movements ripple below'
      case 'hard':
        return '§6Deep waters — something watches from beneath'
      case 'severe':
        return '§cDark waters — the depths stir with intent'
      case 'deadly':
        return '§4Abyssal waters — the deep is ready to take you'
      default:
        return '§aQuiet waters — the surface lies undisturbed'
    }
  }
  switch (challengeLevel) {
    case 'easy':
      return '§aA safe haven from stronger mobs'
    case 'normal':
      return '§eMobs here are a little bit stronger'
    case 'hard':
      return '§6Mobs put up a decent fight here'
    case 'severe':
      return '§cMobs here hit hard — be ready'
    case 'deadly':
      return '§4Mobs here are extremely dangerous'
    default:
      return '§aMobs here fight as usual'
  }
}

export function generateRegionYAML(region: Region, includeVillages: boolean = true, includeStructures: boolean = true, includeHeartRegions: boolean = true, includeNerveRegions: boolean = true, dimension?: 'overworld' | 'nether' | 'end', useModernWorldHeight: boolean = true, useGreetingsAndFarewells: boolean = false, greetingSize: 'large' | 'small' | 'chat' = 'large', includeChallengeLevelSubheading: boolean = false): string {
  const points = region.points.map(point => `      - {x: ${Math.round(point.x)}, z: ${Math.round(point.z)}}`).join('\n')
  
  // Check if this is a main region (not spawn, hearts, or villages)
  const isMainRegion = !region.name.toLowerCase().includes('spawn') && 
                      !region.name.toLowerCase().includes('heart') && 
                      !region.name.toLowerCase().includes('village')
  
  const dim = dimension ?? 'overworld'
  // Determine greeting text based on dimension
  const greetingText = dim === 'nether' ? 'You descend into' : 'Welcome to'
  
  // Generate flags based on region type
  let flags: string
  const isWaterRegion = region.isWater === true && dim === 'overworld'
  if (useGreetingsAndFarewells) {
    if (greetingSize === 'chat') {
      // Chat format uses greeting: and farewell: with single-line values
      // Challenge text only in greeting, never in farewell. Use YAML \n escape so the value
      // stays on one line in the source; replace(/\n/g, '\n  ') then won't add spaces into the string.
      let greetingMsg = isWaterRegion
        ? `§2Crossing §7${region.name}`
        : `§2Entering §7${region.name}`
      if (isMainRegion && region.challengeLevel && includeChallengeLevelSubheading) {
        greetingMsg += '\\n' + getChallengeLevelColor(region.challengeLevel, isWaterRegion)
      }
      const hasChallenge = isMainRegion && region.challengeLevel && includeChallengeLevelSubheading
      const greetingStr = hasChallenge ? `"${greetingMsg.replace(/"/g, '\\"')}"` : greetingMsg
      if (isWaterRegion) {
        flags = `    greeting: ${greetingStr}\n    passthrough: allow`
      } else {
        const farewellMsg = `§6Leaving §7${region.name}`
        flags = `    greeting: ${greetingStr}\n    farewell: ${farewellMsg}\n    passthrough: allow`
      }
    } else if (isMainRegion && region.challengeLevel) {
      // Main regions with challenge levels get the new multi-line format
      // Large: challenge on greeting-title line 2 when option on. Small: greeting-title for title; greeting: (chat) for challenge when option on. Never in farewell/farewell-title.
      const challengeColor = (includeChallengeLevelSubheading && greetingSize === 'large')
        ? getChallengeLevelColor(region.challengeLevel, isWaterRegion)
        : '§f'
      
      // Build greeting and farewell lines based on greeting size
      let greetingLine1: string
      let greetingLine2: string
      let farewellLine1: string
      let farewellLine2: string
      
      if (greetingSize === 'large') {
        // Large: greeting text on first line, challenge color on second
        if (isWaterRegion) {
          greetingLine1 = `§fCrossing ${region.name}`
          greetingLine2 = challengeColor
          farewellLine1 = ''
          farewellLine2 = ''
        } else {
          greetingLine1 = `§f${greetingText} ${region.name}`
          greetingLine2 = challengeColor
          farewellLine1 = `§fLeaving ${region.name}`
          farewellLine2 = `§f`
        }
      } else {
        // Small: §f on first line, greeting text on second line; challenge goes in greeting: (chat) when option on
        if (isWaterRegion) {
          greetingLine1 = `§f`
          greetingLine2 = `§fCrossing ${region.name}`
          farewellLine1 = ''
          farewellLine2 = ''
        } else {
          greetingLine1 = `§f`
          greetingLine2 = `§f${greetingText} ${region.name}`
          farewellLine1 = `§f`
          farewellLine2 = `§fLeaving ${region.name}`
        }
      }
    
      const smallGreetingChat = (includeChallengeLevelSubheading && greetingSize === 'small')
        ? `\n    greeting: ${getChallengeLevelColor(region.challengeLevel, isWaterRegion)}`
        : ''
      const farewellBlock = isWaterRegion
        ? ''
        : `\n    farewell-title: |-\n      ${farewellLine1}\n      ${farewellLine2}`
      flags = `    greeting-title: |-\n      ${greetingLine1}\n      ${greetingLine2}${smallGreetingChat}${farewellBlock}\n    passthrough: allow`
    } else {
      // Other regions (spawn, hearts, villages) keep the old format (unless chat is selected)
      if (isWaterRegion && isMainRegion) {
        flags = `{greeting-title: Crossing ${region.name}, passthrough: allow}`
      } else {
        flags = `{greeting-title: ${greetingText} ${region.name}, farewell-title: Leaving ${region.name}., passthrough: allow}`
      }
    }
  } else {
    // No greetings/farewells - only passthrough flag
    flags = `{passthrough: allow}`
  }

  const regionNameForYAML = nameToRegionId(region.name)

  // Water regions: fixed sea-level band for regions.yml. Land uses world height setting.
  // Nether main poly2d: bedrock floor to below roof (126); heart cuboids keep their own Y (see below).
  const landMinY = useModernWorldHeight ? -64 : 0
  const landMaxY = useModernWorldHeight ? 320 : 255
  const minY = isWaterRegion ? 35 : dim === 'nether' ? 0 : landMinY
  const maxY = isWaterRegion ? 75 : dim === 'nether' ? 126 : landMaxY

  let yaml = `  ${regionNameForYAML}:
    type: poly2d
    min-y: ${minY}
    max-y: ${maxY}
    priority: 0
    flags:
${useGreetingsAndFarewells && ((isMainRegion && region.challengeLevel && greetingSize !== 'chat') || greetingSize === 'chat') ? '  ' + flags.replace(/\n/g, '\n  ') : '      ' + flags}
    points:
${points}`

  // Add heart_of_[region] subregion only for regions with a set heart, if enabled
  if (includeHeartRegions && region.centerPoint != null) {
    const regionCenter = region.centerPoint
    const heartRegionName = `heart_of_${nameToRegionId(region.name)}`
    const heartSize = 7 // 7x7 size as requested
    const heartY = regionCenter.y
    const heartFallbackMinY = isWaterRegion ? 35 : landMinY
    const heartFallbackMaxY = isWaterRegion ? 75 : landMaxY
    const heartMinY =
      heartY !== undefined && !Number.isNaN(heartY) ? Math.round(heartY) - 5 : heartFallbackMinY
    const heartMaxY =
      heartY !== undefined && !Number.isNaN(heartY) ? Math.round(heartY) + 2 : heartFallbackMaxY

    let heartFlags: string
    if (useGreetingsAndFarewells) {
      if (greetingSize === 'chat') {
        // Chat format uses greeting: and farewell: with single-line values
        heartFlags = `      greeting: §2Entering §7Heart of ${region.name}\n      farewell: §6Leaving §7Heart of ${region.name}\n      build: deny\n      interact: allow\n      creeper-explosion: deny\n      other-explosion: deny\n      tnt: deny`
      } else {
        // Large/small format uses greeting-title: and farewell-title: with multi-line values
        let greetingLine1: string
        let greetingLine2: string
        let farewellLine1: string
        let farewellLine2: string
        
        if (greetingSize === 'large') {
          // Large: greeting text on first line, §f on second
          greetingLine1 = `§fHeart of ${region.name}`
          greetingLine2 = `§f`
          farewellLine1 = `§fLeaving Heart of ${region.name}`
          farewellLine2 = `§f`
        } else {
          // Small: §f on first line, greeting text on second line
          greetingLine1 = `§f`
          greetingLine2 = `§fHeart of ${region.name}`
          farewellLine1 = `§f`
          farewellLine2 = `§fLeaving Heart of ${region.name}`
        }
        
        heartFlags = `      greeting-title: |-\n        ${greetingLine1}\n        ${greetingLine2}\n      farewell-title: |-\n        ${farewellLine1}\n        ${farewellLine2}\n      build: deny\n      interact: allow\n      creeper-explosion: deny\n      other-explosion: deny\n      tnt: deny`
      }
    } else {
      heartFlags = `{build: deny, interact: allow, creeper-explosion: deny, other-explosion: deny, tnt: deny}`
    }
    
    yaml += `\n\n  ${heartRegionName}:
    type: cuboid
    min: {x: ${Math.round(regionCenter.x - Math.floor(heartSize / 2))}, y: ${heartMinY}, z: ${Math.round(regionCenter.z - Math.floor(heartSize / 2))}}
    max: {x: ${Math.round(regionCenter.x + Math.floor(heartSize / 2))}, y: ${heartMaxY}, z: ${Math.round(regionCenter.z + Math.floor(heartSize / 2))}}
    members: {}
    owners: {}
    flags:${useGreetingsAndFarewells ? '\n' + heartFlags : ' ' + heartFlags}
    priority: 10`
  }

  // Add nerve_of_[region] subregion (parallel to heart), overworld only — if enabled and set
  if (includeNerveRegions && region.nervePoint != null && dim === 'overworld') {
    const regionCenter = region.nervePoint
    const nerveRegionName = `nerve_of_${nameToRegionId(region.name)}`
    const nerveSize = 7
    const nerveY = regionCenter.y
    const nerveFallbackMinY = isWaterRegion ? 35 : landMinY
    const nerveFallbackMaxY = isWaterRegion ? 75 : landMaxY
    const nerveMinY =
      nerveY !== undefined && !Number.isNaN(nerveY) ? Math.round(nerveY) - 10 : nerveFallbackMinY
    const nerveMaxY =
      nerveY !== undefined && !Number.isNaN(nerveY) ? Math.round(nerveY) + 2 : nerveFallbackMaxY

    let nerveFlags: string
    if (useGreetingsAndFarewells) {
      if (greetingSize === 'chat') {
        nerveFlags = `      greeting: §2Entering §7Nerve of ${region.name}\n      farewell: §6Leaving §7Nerve of ${region.name}\n      build: deny\n      interact: allow\n      creeper-explosion: deny\n      other-explosion: deny\n      tnt: deny`
      } else {
        let greetingLine1: string
        let greetingLine2: string
        let farewellLine1: string
        let farewellLine2: string

        if (greetingSize === 'large') {
          greetingLine1 = `§fNerve of ${region.name}`
          greetingLine2 = `§f`
          farewellLine1 = `§fLeaving Nerve of ${region.name}`
          farewellLine2 = `§f`
        } else {
          greetingLine1 = `§f`
          greetingLine2 = `§fNerve of ${region.name}`
          farewellLine1 = `§f`
          farewellLine2 = `§fLeaving Nerve of ${region.name}`
        }

        nerveFlags = `      greeting-title: |-\n        ${greetingLine1}\n        ${greetingLine2}\n      farewell-title: |-\n        ${farewellLine1}\n        ${farewellLine2}\n      build: deny\n      interact: allow\n      creeper-explosion: deny\n      other-explosion: deny\n      tnt: deny`
      }
    } else {
      nerveFlags = `{build: deny, interact: allow, creeper-explosion: deny, other-explosion: deny, tnt: deny}`
    }

    yaml += `\n\n  ${nerveRegionName}:
    type: cuboid
    min: {x: ${Math.round(regionCenter.x - Math.floor(nerveSize / 2))}, y: ${nerveMinY}, z: ${Math.round(regionCenter.z - Math.floor(nerveSize / 2))}}
    max: {x: ${Math.round(regionCenter.x + Math.floor(nerveSize / 2))}, y: ${nerveMaxY}, z: ${Math.round(regionCenter.z + Math.floor(nerveSize / 2))}}
    members: {}
    owners: {}
    flags:${useGreetingsAndFarewells ? '\n' + nerveFlags : ' ' + nerveFlags}
    priority: 10`
  }

  // Add subregions when includeVillages (villages) or includeStructures (structures) is true (structures without required data e.g. jungle temple without y are skipped)
  if ((includeVillages || includeStructures) && region.subregions && region.subregions.length > 0) {
    const subregionBlocks = region.subregions
      .filter(sub => (sub.type === 'village' && includeVillages) || (sub.type === 'structure' && includeStructures))
      .map(subregion => generateSubregionYAML(subregion, region.name, dimension || 'overworld', useModernWorldHeight, useGreetingsAndFarewells, greetingSize))
      .filter((block): block is string => block !== null)
    if (subregionBlocks.length > 0) {
      yaml += '\n\n'
      yaml += subregionBlocks.join('\n\n')
    }
  }
  
  return yaml
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function isPointInPolygon(
  point: { x: number; z: number },
  polygon: { x: number; z: number }[]
): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (
      ((polygon[i].z > point.z) !== (polygon[j].z > point.z)) &&
      (point.x < (polygon[j].x - polygon[i].x) * (point.z - polygon[i].z) / (polygon[j].z - polygon[i].z) + polygon[i].x)
    ) {
      inside = !inside
    }
  }
  return inside
}

/**
 * Calculate the area of a polygon using the shoelace formula
 * @param points Array of polygon points with x and z coordinates
 * @returns Area in square blocks (since each block = 1 unit)
 */
export function calculatePolygonArea(points: { x: number; z: number }[]): number {
  if (points.length < 3) return 0
  
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    area += points[i].x * points[j].z
    area -= points[j].x * points[i].z
  }
  
  return Math.abs(area) / 2
}

/**
 * Format area for display with appropriate units
 * @param areaInBlocks Area in square blocks
 * @returns Formatted string with area in hectares when available
 */
export function formatArea(areaInBlocks: number): string {
  const squareMeters = areaInBlocks // 1 block ≈ 1 square meter in Minecraft
  
  if (squareMeters >= 10000) {
    const hectares = squareMeters / 10000
    return `${Math.round(hectares)} hectares`
  } else {
    return `${Math.round(areaInBlocks).toLocaleString()} blocks²`
  }
}

/**
 * Calculate the center point (centroid) of a polygon
 * @param points Array of polygon points with x and z coordinates
 * @returns Center point coordinates {x, z}
 */
export function calculatePolygonCenter(points: { x: number; z: number }[]): { x: number; z: number } {
  if (points.length === 0) {
    return { x: 0, z: 0 }
  }
  
  if (points.length === 1) {
    return { x: points[0].x, z: points[0].z }
  }
  
  let sumX = 0
  let sumZ = 0
  
  for (const point of points) {
    sumX += point.x
    sumZ += point.z
  }
  
  return {
    x: sumX / points.length,
    z: sumZ / points.length
  }
}

/**
 * Calculate the center point of a region
 * @param region The region to calculate the center for
 * @returns Center point coordinates {x, z}
 */
export function calculateRegionCenter(region: Region): { x: number; z: number } {
  if (region.nervePoint) {
    return region.nervePoint
  }
  if (region.centerPoint) {
    return region.centerPoint
  }
  return calculatePolygonCenter(region.points)
}

/**
 * Move all points in a region by an offset
 * @param points Array of region points
 * @param offsetX Offset to apply to x coordinate
 * @param offsetZ Offset to apply to z coordinate
 * @returns New array of points with offsets applied
 */
export function moveRegionPoints(
  points: { x: number; z: number }[],
  offsetX: number,
  offsetZ: number
): { x: number; z: number }[] {
  if (points.length === 0) return points
  return points.map(p => ({ x: p.x + offsetX, z: p.z + offsetZ }))
}

/**
 * Move a region to a new center position
 * @param points Array of region points
 * @param newCenterX New center X coordinate
 * @param newCenterZ New center Z coordinate
 * @returns New array of points centered at the new position
 */
export function moveRegionToCenter(
  points: { x: number; z: number }[],
  newCenterX: number,
  newCenterZ: number
): { x: number; z: number }[] {
  if (points.length === 0) return points
  
  // Calculate current center
  const currentCenter = calculatePolygonCenter(points)
  
  // Calculate offset needed
  const offsetX = newCenterX - currentCenter.x
  const offsetZ = newCenterZ - currentCenter.z
  
  // Apply offset to all points
  return moveRegionPoints(points, offsetX, offsetZ)
}

/**
 * Resize a region by scaling all points around a center point
 * @param points Array of region points
 * @param centerX Center X coordinate for scaling
 * @param centerZ Center Z coordinate for scaling
 * @param scaleFactor Scale factor (1.0 = no change, 1.5 = 150%, 0.5 = 50%)
 * @returns New array of scaled points
 */
export function resizeRegionPoints(
  points: { x: number; z: number }[],
  centerX: number,
  centerZ: number,
  scaleFactor: number
): { x: number; z: number }[] {
  if (points.length === 0 || scaleFactor <= 0) return points
  
  return points.map(p => {
    // Calculate offset from center
    const offsetX = p.x - centerX
    const offsetZ = p.z - centerZ
    
    // Scale the offset
    const scaledOffsetX = offsetX * scaleFactor
    const scaledOffsetZ = offsetZ * scaleFactor
    
    // Return new point
    return {
      x: centerX + scaledOffsetX,
      z: centerZ + scaledOffsetZ
    }
  })
}

/**
 * Push points away from a center within a radius by a strength factor.
 * Strength is the maximum displacement at the center; it eases to 0 at radius.
 */
export function warpRegionPoints(
  points: { x: number; z: number }[],
  centerX: number,
  centerZ: number,
  radius: number,
  strength: number
): { x: number; z: number }[] {
  if (points.length === 0 || radius <= 0 || strength === 0) return points
  const radiusSq = radius * radius
  return points.map(p => {
    const dx = p.x - centerX
    const dz = p.z - centerZ
    const distSq = dx * dx + dz * dz
    if (distSq >= radiusSq) return p
    const dist = Math.sqrt(Math.max(distSq, 1e-8))
    const falloff = 1 - dist / radius
    const displacement = strength * falloff
    const ux = dx / dist
    const uz = dz / dist
    return { x: p.x + ux * displacement, z: p.z + uz * displacement }
  })
}

/**
 * Insert a midpoint between every consecutive pair of polygon vertices.
 */
export function doublePolygonVertices(
  points: { x: number; z: number }[]
): { x: number; z: number }[] {
  if (points.length < 2) return points
  const result: { x: number; z: number }[] = []
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    result.push(a)
    result.push({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 })
  }
  return result
}

/**
 * Remove every other vertex to approximately halve vertex count, preserving a valid polygon (min 3).
 */
export function halvePolygonVertices(
  points: { x: number; z: number }[]
): { x: number; z: number }[] {
  if (points.length <= 3) return points
  const kept: { x: number; z: number }[] = []
  for (let i = 0; i < points.length; i++) {
    if (i % 2 === 0) kept.push(points[i])
  }
  if (kept.length < 3) {
    // Ensure at least 3 by adding back some points
    const needed = 3 - kept.length
    for (let i = 0; i < needed; i++) {
      kept.push(points[(2 * i + 1) % points.length])
    }
  }
  return kept
}

/**
 * Simplify polygon using Ramer–Douglas–Peucker while preserving overall shape.
 * Tolerance controls allowable deviation; higher values remove more points.
 */
export function simplifyPolygonVertices(
  points: { x: number; z: number }[],
  tolerance: number
): { x: number; z: number }[] {
  if (points.length <= 3) return points
  const eps = Math.max(0, tolerance)

  // Treat as closed polygon: simplify the open ring and then reconstruct
  const open = [...points]

  function perpendicularDistance(p: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }) {
    const dx = b.x - a.x
    const dz = b.z - a.z
    if (dx === 0 && dz === 0) return Math.hypot(p.x - a.x, p.z - a.z)
    const t = ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz)
    const projX = a.x + t * dx
    const projZ = a.z + t * dz
    return Math.hypot(p.x - projX, p.z - projZ)
  }

  function rdp(pts: { x: number; z: number }[], first: number, last: number, keep: boolean[]) {
    let maxDist = 0
    let index = -1
    for (let i = first + 1; i < last; i++) {
      const d = perpendicularDistance(pts[i], pts[first], pts[last])
      if (d > maxDist) {
        maxDist = d
        index = i
      }
    }
    if (maxDist > eps && index !== -1) {
      keep[index] = true
      rdp(pts, first, index, keep)
      rdp(pts, index, last, keep)
    }
  }

  // Run RDP over the open ring, then ensure closure by keeping first point
  const keepFlags = new Array(open.length).fill(false)
  keepFlags[0] = true
  keepFlags[open.length - 1] = true
  rdp(open, 0, open.length - 1, keepFlags)
  const simplified = open.filter((_, i) => keepFlags[i])

  // For polygons, ensure we have at least 3 points
  if (simplified.length < 3) return points
  return simplified
}

/**
 * Split a polygon into two parts using a line defined by two points
 * @param points Array of polygon points
 * @param splitPoint1 First point of the split line
 * @param splitPoint2 Second point of the split line
 * @returns Array containing two polygons (left and right of the split line)
 */
export function splitPolygon(
  points: { x: number; z: number }[],
  splitPoint1: { x: number; z: number },
  splitPoint2: { x: number; z: number }
): { x: number; z: number }[][] {
  if (points.length < 3) return [points, []]
  
  // Calculate the line equation: ax + bz + c = 0
  const dx = splitPoint2.x - splitPoint1.x
  const dz = splitPoint2.z - splitPoint1.z
  
  // Handle vertical line case
  if (Math.abs(dx) < 1e-10) {
    const xLine = splitPoint1.x
    const leftPoints: { x: number; z: number }[] = []
    const rightPoints: { x: number; z: number }[] = []
    
    for (const point of points) {
      if (point.x <= xLine) {
        leftPoints.push(point)
      } else {
        rightPoints.push(point)
      }
    }
    
    return [leftPoints, rightPoints]
  }
  
  // Calculate line coefficients
  const a = dz
  const b = -dx
  const c = -(a * splitPoint1.x + b * splitPoint1.z)
  
  const leftPoints: { x: number; z: number }[] = []
  const rightPoints: { x: number; z: number }[] = []
  
  for (const point of points) {
    const side = a * point.x + b * point.z + c
    if (side <= 0) {
      leftPoints.push(point)
    } else {
      rightPoints.push(point)
    }
  }
  
  // Ensure both polygons have at least 3 points
  if (leftPoints.length < 3 || rightPoints.length < 3) {
    return [points, []]
  }
  
  return [leftPoints, rightPoints]
}

/**
 * Find the closest point on a polygon edge to a given point
 * @param point The point to find the closest edge point for
 * @param polygon Array of polygon points
 * @returns The closest point on the polygon edge
 */
export function findClosestPointOnPolygonEdge(
  point: { x: number; z: number },
  polygon: { x: number; z: number }[]
): { x: number; z: number } {
  let closestPoint = polygon[0]
  let minDistance = Math.hypot(point.x - polygon[0].x, point.z - polygon[0].z)
  
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i]
    const p2 = polygon[(i + 1) % polygon.length]
    
    // Find closest point on line segment p1-p2
    const dx = p2.x - p1.x
    const dz = p2.z - p1.z
    const lengthSq = dx * dx + dz * dz
    
    if (lengthSq === 0) {
      // Degenerate line segment
      const distance = Math.hypot(point.x - p1.x, point.z - p1.z)
      if (distance < minDistance) {
        minDistance = distance
        closestPoint = p1
      }
      continue
    }
    
    // Project point onto line segment
    const t = Math.max(0, Math.min(1, ((point.x - p1.x) * dx + (point.z - p1.z) * dz) / lengthSq))
    const closest = {
      x: p1.x + t * dx,
      z: p1.z + t * dz
    }
    
    const distance = Math.hypot(point.x - closest.x, point.z - closest.z)
    if (distance < minDistance) {
      minDistance = distance
      closestPoint = closest
    }
  }
  
  return closestPoint
}