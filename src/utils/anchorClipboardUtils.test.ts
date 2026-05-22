import { describe, it, expect } from 'vitest'
import { formatMinecraftTpCommand, buildBulkAnchorTpText } from './anchorClipboardUtils'
import type { Region } from '../types'

describe('formatMinecraftTpCommand', () => {
  it('rounds x/z and uses ~ when y is missing', () => {
    expect(formatMinecraftTpCommand({ x: 10.4, z: -3.6 })).toBe('/minecraft:tp @s 10 ~ -4')
  })

  it('rounds y when set', () => {
    expect(formatMinecraftTpCommand({ x: 1, z: 2, y: 64.7 })).toBe('/minecraft:tp @s 1 65 2')
  })
})

describe('buildBulkAnchorTpText', () => {
  it('sorts by name and formats each anchor', () => {
    const regions = [
      { id: 'b', name: 'Beta', centerPoint: { x: 1, z: 2 } },
      { id: 'a', name: 'Alpha', centerPoint: { x: 3, z: 4, y: 10 } }
    ] as Region[]
    const text = buildBulkAnchorTpText(regions, r => r.centerPoint)
    expect(text).toBe(
      'Alpha:\n/minecraft:tp @s 3 10 4\n\nBeta:\n/minecraft:tp @s 1 ~ 2'
    )
  })
})
