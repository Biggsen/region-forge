import { describe, it, expect } from 'vitest'
import { generateOceanRuinName, generateOceanRuinNames, isValidOceanRuinName } from './nameGenerator'

function hasAdjacentDuplicateTokens(name: string): boolean {
  const tokens = name
    .trim()
    .split(/\s+/)
    .map(t => t.toLowerCase().replace(/[^a-z']/g, ''))
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i] !== '' && tokens[i] === tokens[i + 1]) return true
  }
  return false
}

describe('generateOceanRuinName / generateOceanRuinNames', () => {
  it('returns 200 unique names with no adjacent duplicate tokens', () => {
    const names = generateOceanRuinNames(200)
    expect(names.length).toBe(200)
    expect(new Set(names).size).toBe(200)
    for (const n of names) {
      expect(hasAdjacentDuplicateTokens(n)).toBe(false)
    }
  })

  it('is deterministic for the same seed', () => {
    expect(generateOceanRuinName(999)).toBe(generateOceanRuinName(999))
    expect(generateOceanRuinName('anchor-seed')).toBe(generateOceanRuinName('anchor-seed'))
  })

  it('generateOceanRuinNames with seed is stable', () => {
    const a = generateOceanRuinNames(50, 'reef-ledger')
    const b = generateOceanRuinNames(50, 'reef-ledger')
    expect(a).toEqual(b)
  })

  it('rejects suffix echo and other brief rules', () => {
    expect(isValidOceanRuinName('Brinewatch Watch')).toBe(false)
    expect(isValidOceanRuinName('Tidegate Gate')).toBe(false)
    expect(isValidOceanRuinName('Salt Salt Vault')).toBe(false)
    expect(isValidOceanRuinName('Ancient Hall')).toBe(false)
    expect(isValidOceanRuinName('Foam Crossing')).toBe(false)
    expect(isValidOceanRuinName('Current Salt Mere')).toBe(false)
    expect(isValidOceanRuinName('Tideglass Beacon')).toBe(true)
    expect(isValidOceanRuinName('The Ninth Reliquary of Serakar')).toBe(true)
  })
})
