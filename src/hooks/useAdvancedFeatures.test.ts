import { describe, it, expect } from 'vitest'
import { getShowAdvancedFromSearch } from './useAdvancedFeatures'

describe('getShowAdvancedFromSearch', () => {
  it('returns true when advanced=true', () => {
    expect(getShowAdvancedFromSearch('?advanced=true')).toBe(true)
    expect(getShowAdvancedFromSearch('?foo=1&advanced=true')).toBe(true)
    expect(getShowAdvancedFromSearch('?advanced=true&bar=2')).toBe(true)
  })

  it('returns false when advanced is missing or not true', () => {
    expect(getShowAdvancedFromSearch('')).toBe(false)
    expect(getShowAdvancedFromSearch('?')).toBe(false)
    expect(getShowAdvancedFromSearch('?advanced=1')).toBe(false)
    expect(getShowAdvancedFromSearch('?advanced=false')).toBe(false)
    expect(getShowAdvancedFromSearch('?other=value')).toBe(false)
  })
})
