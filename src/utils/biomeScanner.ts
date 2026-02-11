import { Region } from '../types'
import { pixelToWorld, isPointInPolygon } from './coordinateUtils'
import { findNearestBiome } from './biomeColors'

export type BiomeBreakdownEntry = { biome: string; count: number; percentage: number }

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
