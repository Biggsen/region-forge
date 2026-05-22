import type { Region } from '../types'

export type AnchorPoint = { x: number; z: number; y?: number }

export function formatMinecraftTpCommand(point: AnchorPoint): string {
  const y = point.y !== undefined && !Number.isNaN(point.y) ? Math.round(point.y) : '~'
  return `/minecraft:tp @s ${Math.round(point.x)} ${y} ${Math.round(point.z)}`
}

export function buildBulkAnchorTpText(
  regions: Region[],
  getAnchor: (region: Region) => AnchorPoint | null | undefined
): string {
  return [...regions]
    .filter(r => getAnchor(r) != null)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(region => {
      const anchor = getAnchor(region)!
      return `${region.name}:\n${formatMinecraftTpCommand(anchor)}`
    })
    .join('\n\n')
}

export function copySubregionTpToClipboard(target: { x: number; z: number; y?: number }): void {
  navigator.clipboard.writeText(
    formatMinecraftTpCommand({ x: target.x, z: target.z, y: target.y })
  )
}
