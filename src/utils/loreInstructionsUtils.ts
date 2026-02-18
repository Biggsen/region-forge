import { Region } from '../types'
import { BiomeBreakdownEntry } from './biomeScanner'
import { calculatePolygonArea, formatArea } from './polygonUtils'

const DIFFICULTY_ORDER: Record<string, number> = {
  easy: 1,
  normal: 2,
  hard: 3,
  severe: 4,
  deadly: 5
}

function formatBiomeName(id: string): string {
  return id
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

export function formatRegionLore(
  region: Region,
  worldName: string,
  biomeBreakdown: BiomeBreakdownEntry[] | null,
  simpler = false
): string {
  const level = region.challengeLevel ?? 'easy'
  const levelNum = DIFFICULTY_ORDER[level] ?? 1
  const levelLabel = level.charAt(0).toUpperCase() + level.slice(1)

  const biomesLine = biomeBreakdown && biomeBreakdown.length > 0
    ? (() => {
        let total = 0
        const parts: string[] = []
        for (const b of biomeBreakdown) {
          parts.push(`${formatBiomeName(b.biome)} ${b.percentage}%`)
          total += b.percentage
          if (total >= 80) break
        }
        return parts.join(', ')
      })()
    : '—'

  const category = region.minecraftCategory
    ? region.minecraftCategory.charAt(0).toUpperCase() + region.minecraftCategory.slice(1).replace(/_/g, ' ')
    : '—'

  const items = region.minecraftItems?.length
    ? region.minecraftItems.map(i => i.name).join(', ')
    : '—'

  const themes = region.regionTheme?.filter(p => p.a || p.b).length
    ? region.regionTheme!.filter(p => p.a || p.b).map(p => `${p.a} ${p.b}`).join(', ')
    : '—'

  const villages = region.subregions?.filter(s => s.type === 'village').length
    ? region.subregions!.filter(s => s.type === 'village').map(s => s.name).join(', ')
    : '—'

  const areaInBlocks = region.points.length >= 3 ? calculatePolygonArea(region.points) : 0
  const sizeStr = formatArea(areaInBlocks)

  const lines = [
    `World: ${worldName}`,
    `Region name: ${region.name}`,
    `Region size: ${sizeStr}`,
    `Difficulty (Mob Strength): ${levelLabel} (${levelNum} out of 5 (Easy, Normal, Hard, Severe, Deadly))`
  ]
  if (!simpler) {
    lines.push(`Biomes: ${biomesLine}`)
    lines.push(`Special Category: ${category}`)
    lines.push(`3 special items: ${items}`)
  }
  lines.push(`Minor theme/historical hints: ${themes}`)
  lines.push(`Villages: ${villages}`)
  return lines.join('\n')
}
