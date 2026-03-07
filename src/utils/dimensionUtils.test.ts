import { describe, it, expect } from 'vitest'
import { getValidDimension } from './dimensionUtils'

describe('getValidDimension', () => {
  it('returns overworld for valid "overworld"', () => {
    expect(getValidDimension('overworld')).toBe('overworld')
  })

  it('returns nether for valid "nether"', () => {
    expect(getValidDimension('nether')).toBe('nether')
  })

  it('returns end for valid "end"', () => {
    expect(getValidDimension('end')).toBe('end')
  })

  it('returns overworld for undefined', () => {
    expect(getValidDimension(undefined)).toBe('overworld')
  })

  it('returns overworld for invalid string', () => {
    expect(getValidDimension('')).toBe('overworld')
    expect(getValidDimension('foo')).toBe('overworld')
    expect(getValidDimension('the_end')).toBe('overworld')
  })
})
