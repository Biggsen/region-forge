import { describe, it, expect } from 'vitest'
import { generateRuinedPortalName, generateRuinedPortalNames, isValidRuinedPortalName } from './nameGenerator'

describe('generateRuinedPortalName / generateRuinedPortalNames', () => {
  it('returns 80 unique names that stay inside the sample pools', () => {
    const names = generateRuinedPortalNames(80)
    expect(names.length).toBe(80)
    expect(new Set(names).size).toBe(80)
    for (const n of names) {
      expect(isValidRuinedPortalName(n)).toBe(true)
    }
  })

  it('accepts both sample patterns and rejects words outside the pools', () => {
    expect(isValidRuinedPortalName('Twilight Rift')).toBe(true)
    expect(isValidRuinedPortalName('Doorway of Selvar')).toBe(true)
    expect(isValidRuinedPortalName('Portal of Eldren')).toBe(true)
    expect(isValidRuinedPortalName('Crying Gateway')).toBe(false)
    expect(isValidRuinedPortalName('Rift of Nobody')).toBe(false)
    expect(isValidRuinedPortalName('Twilight')).toBe(false)
  })

  it('generateRuinedPortalName always matches a pool pattern', () => {
    for (let i = 0; i < 40; i++) {
      expect(isValidRuinedPortalName(generateRuinedPortalName())).toBe(true)
    }
  })
})
