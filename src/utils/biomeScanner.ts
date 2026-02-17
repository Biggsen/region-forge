import { Region } from '../types'
import { pixelToWorld, isPointInPolygon } from './coordinateUtils'
import { findNearestBiome } from './biomeColors'

export type BiomeBreakdownEntry = { biome: string; count: number; percentage: number }

export type BiomeBreakdownWithCentroid = BiomeBreakdownEntry & { centroid: { x: number; z: number } }

/** A single label placement - biome name + position. Same biome can appear multiple times. */
export type BiomeLabelPlacement = { biome: string; centroid: { x: number; z: number } }

const SAMPLE_STEP = 4

/**
 * Samples pixels within a region on the map image and returns a biome breakdown.
 * Uses color-to-biome matching for estimation. Requires a loaded map image and origin.
 */
export function scanBiomes(
  region: Region,
  image: HTMLImageElement,
  originOffset: { x: number; y: number } | null
): BiomeBreakdownEntry[] | null {
  const { width, height } = image
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  try {
    ctx.drawImage(image, 0, 0)
  } catch {
    return null
  }

  let imageData: ImageData
  try {
    imageData = ctx.getImageData(0, 0, width, height)
  } catch {
    return null
  }
  const data = imageData.data
  const counts: Record<string, number> = {}
  let total = 0

  const originX = originOffset ? originOffset.x : Math.floor(width / 2)
  const originY = originOffset ? originOffset.y : Math.floor(height / 2)
  const minX = Math.max(0, Math.min(...region.points.map(p => p.x)) / 8 + originX)
  const maxX = Math.min(width - 1, Math.max(...region.points.map(p => p.x)) / 8 + originX)
  const minY = Math.max(0, Math.min(...region.points.map(p => p.z)) / 8 + originY)
  const maxY = Math.min(height - 1, Math.max(...region.points.map(p => p.z)) / 8 + originY)

  for (let iy = Math.floor(minY); iy <= Math.ceil(maxY); iy += SAMPLE_STEP) {
    for (let ix = Math.floor(minX); ix <= Math.ceil(maxX); ix += SAMPLE_STEP) {
      const world = pixelToWorld(ix, iy, width, height, originOffset)
      if (!isPointInPolygon(world, region.points)) continue

      const idx = (iy * width + ix) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const a = data[idx + 3]
      if (a < 128) continue

      const biome = findNearestBiome(r, g, b)
      counts[biome] = (counts[biome] ?? 0) + 1
      total++
    }
  }

  if (total === 0) return null

  return Object.entries(counts)
    .map(([biome, count]) => ({
      biome,
      count,
      percentage: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.percentage - a.percentage)
}

/** World-distance radius for clustering: points within this are "same patch". */
const CLUSTER_RADIUS = 64

/** Minimum samples in a cluster to warrant a label (avoids tiny noise). */
const MIN_CLUSTER_SIZE = 8

/** Above this size, subdivide a cluster into a 2x2 grid for better label spread. */
const LARGE_CLUSTER_THRESHOLD = 56

/** Above this size, use 3x3 grid for very large biome areas. */
const VERY_LARGE_CLUSTER_THRESHOLD = 160

/**
 * Returns label placements covering the biome spread across the region.
 * Same biome can appear multiple times – once per spatially distinct patch.
 * Large patches get multiple labels distributed across the area.
 */
export function scanBiomesWithCentroids(
  region: Region,
  image: HTMLImageElement,
  originOffset: { x: number; y: number } | null
): BiomeLabelPlacement[] | null {
  const { width, height } = image
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  try {
    ctx.drawImage(image, 0, 0)
  } catch {
    return null
  }

  let imageData: ImageData
  try {
    imageData = ctx.getImageData(0, 0, width, height)
  } catch {
    return null
  }
  const data = imageData.data
  const pointsByBiome: Record<string, { x: number; z: number }[]> = {}
  let total = 0

  const originX = originOffset ? originOffset.x : Math.floor(width / 2)
  const originY = originOffset ? originOffset.y : Math.floor(height / 2)
  const minX = Math.max(0, Math.min(...region.points.map(p => p.x)) / 8 + originX)
  const maxX = Math.min(width - 1, Math.max(...region.points.map(p => p.x)) / 8 + originX)
  const minY = Math.max(0, Math.min(...region.points.map(p => p.z)) / 8 + originY)
  const maxY = Math.min(height - 1, Math.max(...region.points.map(p => p.z)) / 8 + originY)

  for (let iy = Math.floor(minY); iy <= Math.ceil(maxY); iy += SAMPLE_STEP) {
    for (let ix = Math.floor(minX); ix <= Math.ceil(maxX); ix += SAMPLE_STEP) {
      const world = pixelToWorld(ix, iy, width, height, originOffset)
      if (!isPointInPolygon(world, region.points)) continue

      const idx = (iy * width + ix) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const a = data[idx + 3]
      if (a < 128) continue

      const biome = findNearestBiome(r, g, b)
      if (!pointsByBiome[biome]) pointsByBiome[biome] = []
      pointsByBiome[biome].push({ x: world.x, z: world.z })
      total++
    }
  }

  if (total === 0) return null

  const labels: BiomeLabelPlacement[] = []
  const rSq = CLUSTER_RADIUS * CLUSTER_RADIUS

  for (const [biome, points] of Object.entries(pointsByBiome)) {
    const clusters = clusterByProximity(points, rSq)
    for (const cluster of clusters) {
      if (cluster.length < MIN_CLUSTER_SIZE) continue

      const placements = subdivideClusterForLabels(cluster)
      for (const centroid of placements) {
        labels.push({ biome, centroid })
      }
    }
  }

  return labels
}

/**
 * Returns one or more label positions for a cluster. Small clusters get one label.
 * Large clusters get multiple labels via spatial subdivision for better spread.
 */
function subdivideClusterForLabels(
  cluster: { x: number; z: number }[]
): { x: number; z: number }[] {
  if (cluster.length < LARGE_CLUSTER_THRESHOLD) {
    const centroid = cluster.reduce(
      (acc, p) => ({ x: acc.x + p.x, z: acc.z + p.z }),
      { x: 0, z: 0 }
    )
    centroid.x /= cluster.length
    centroid.z /= cluster.length
    return [centroid]
  }

  const minX = Math.min(...cluster.map(p => p.x))
  const maxX = Math.max(...cluster.map(p => p.x))
  const minZ = Math.min(...cluster.map(p => p.z))
  const maxZ = Math.max(...cluster.map(p => p.z))
  const extentX = maxX - minX
  const extentZ = maxZ - minZ
  if (extentX < 32 || extentZ < 32) {
    const cen = cluster.reduce((acc, p) => ({ x: acc.x + p.x, z: acc.z + p.z }), { x: 0, z: 0 })
    cen.x /= cluster.length
    cen.z /= cluster.length
    return [cen]
  }
  const gridSize = cluster.length >= VERY_LARGE_CLUSTER_THRESHOLD ? 3 : 2
  const stepX = extentX / gridSize
  const stepZ = extentZ / gridSize
  const cellPointsByIndex = new Map<string, { x: number; z: number }[]>()
  for (const p of cluster) {
    const col = Math.min(gridSize - 1, Math.max(0, Math.floor((p.x - minX) / stepX)))
    const row = Math.min(gridSize - 1, Math.max(0, Math.floor((p.z - minZ) / stepZ)))
    const key = `${row},${col}`
    if (!cellPointsByIndex.has(key)) cellPointsByIndex.set(key, [])
    cellPointsByIndex.get(key)!.push(p)
  }

  const centroids: { x: number; z: number }[] = []
  for (const cellPoints of cellPointsByIndex.values()) {
    if (cellPoints.length < MIN_CLUSTER_SIZE) continue
    const cen = cellPoints.reduce(
      (acc, p) => ({ x: acc.x + p.x, z: acc.z + p.z }),
      { x: 0, z: 0 }
    )
    cen.x /= cellPoints.length
    cen.z /= cellPoints.length
    centroids.push(cen)
  }

  if (centroids.length > 0) return centroids

  const fallback = cluster.reduce(
    (acc, p) => ({ x: acc.x + p.x, z: acc.z + p.z }),
    { x: 0, z: 0 }
  )
  fallback.x /= cluster.length
  fallback.z /= cluster.length
  return [fallback]
}

/**
 * Groups points into spatial clusters using union-find. Points within CLUSTER_RADIUS
 * of each other belong to the same cluster.
 */
function clusterByProximity(
  points: { x: number; z: number }[],
  radiusSq: number
): { x: number; z: number }[][] {
  if (points.length === 0) return []
  if (points.length === 1) return [points]

  const parent = points.map((_, i) => i)
  const find = (i: number): number => {
    if (parent[i] !== i) parent[i] = find(parent[i])
    return parent[i]
  }
  const union = (a: number, b: number) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent[ra] = rb
  }

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].x - points[j].x
      const dz = points[i].z - points[j].z
      if (dx * dx + dz * dz <= radiusSq) union(i, j)
    }
  }

  const groups = new Map<number, { x: number; z: number }[]>()
  for (let i = 0; i < points.length; i++) {
    const root = find(i)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root)!.push(points[i])
  }
  return Array.from(groups.values())
}
