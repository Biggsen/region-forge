import { describe, it, expect } from 'vitest'
import { generateOceanMonumentName, generateOceanMonumentNames, isValidOceanMonumentName } from './nameGenerator'

describe('generateOceanMonumentName / generateOceanMonumentNames', () => {
  it('returns 80 unique names that stay inside the sample pools', () => {
    const names = generateOceanMonumentNames(80)
    expect(names.length).toBe(80)
    expect(new Set(names).size).toBe(80)
    for (const n of names) {
      expect(isValidOceanMonumentName(n)).toBe(true)
    }
  })

  it('accepts pool patterns and curated names, and rejects words outside them', () => {
    expect(isValidOceanMonumentName('Elder Sanctum')).toBe(true)
    expect(isValidOceanMonumentName('Temple of Pelagis')).toBe(true)
    expect(isValidOceanMonumentName('Spire of Glyphis')).toBe(true)
    expect(isValidOceanMonumentName('The Elder Sanctum')).toBe(true)
    expect(isValidOceanMonumentName("Pelagis's Spire")).toBe(true)
    expect(isValidOceanMonumentName('The Ninth Eye')).toBe(true)
    expect(isValidOceanMonumentName('Elderwatch')).toBe(true)
    expect(isValidOceanMonumentName('The Deep Remembers')).toBe(true)
    expect(isValidOceanMonumentName('The Silent Conclave')).toBe(true)
    expect(isValidOceanMonumentName('Silent Sanctum')).toBe(true)
    expect(isValidOceanMonumentName('Silent Silence')).toBe(false)
    expect(isValidOceanMonumentName('The Silent Silence')).toBe(false)
    expect(isValidOceanMonumentName('Hollow Hollow')).toBe(false)
    expect(isValidOceanMonumentName('Sunken Reliquary')).toBe(false)
    expect(isValidOceanMonumentName('Monument of Nareth')).toBe(false)
    expect(isValidOceanMonumentName('Prismarine')).toBe(false)
  })

  it('generateOceanMonumentName always matches a pool pattern', () => {
    for (let i = 0; i < 40; i++) {
      expect(isValidOceanMonumentName(generateOceanMonumentName())).toBe(true)
    }
  })
})
