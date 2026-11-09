import { describe, it, expect } from 'vitest'
import { generateRegionYAML } from './polygonUtils'
import type { Region } from '../types'

const minimalRegion = (overrides: Partial<Region> = {}): Region => ({
  id: 'r1',
  name: 'Test Region',
  points: [
    { x: 0, z: 0 },
    { x: 100, z: 0 },
    { x: 50, z: 80 }
  ],
  centerPoint: null,
  nervePoint: null,
  soulPoint: null,
  ...overrides
})

describe('generateRegionYAML', () => {
  it('includes nerve_of cuboid when includeNerveRegions and nervePoint are set', () => {
    const yaml = generateRegionYAML(
      minimalRegion({ nervePoint: { x: 50, z: 40, y: 70 } }),
      false,
      false,
      false,
      true,
      false,
      'overworld',
      true,
      true,
      'large',
      false
    )
    expect(yaml).toContain('nerve_of_test_region')
    expect(yaml).toContain('Nerve of Test Region')
    expect(yaml).toContain('type: cuboid')
    expect(yaml).toMatch(/nerve_of_test_region:[\s\S]*?min: \{x: \d+, y: 60, z: \d+\}/)
    expect(yaml).toMatch(/nerve_of_test_region:[\s\S]*?max: \{x: \d+, y: 72, z: \d+\}/)
  })

  it('omits nerve cuboid in nether even when includeNerveRegions is true', () => {
    const yaml = generateRegionYAML(
      minimalRegion({ nervePoint: { x: 50, z: 40, y: 70 } }),
      false,
      false,
      false,
      true,
      false,
      'nether',
      true,
      false,
      'large',
      false
    )
    expect(yaml).not.toContain('nerve_of_')
  })

  it('omits nerve cuboid when includeNerveRegions is false', () => {
    const yaml = generateRegionYAML(
      minimalRegion({ nervePoint: { x: 50, z: 40 } }),
      false,
      false,
      false,
      false,
      false,
      'overworld'
    )
    expect(yaml).not.toContain('nerve_of_')
  })

  it('includes a 5x5 soul cuboid from Y-1 to Y+2 when includeSoulRegions and soulPoint are set', () => {
    const yaml = generateRegionYAML(
      minimalRegion({ soulPoint: { x: 50, z: 40, y: 70 } }),
      false,
      false,
      false,
      false,
      true,
      'overworld',
      true,
      true,
      'large',
      false
    )
    expect(yaml).toContain('soul_of_test_region')
    expect(yaml).toContain('Soul of Test Region')
    expect(yaml).toMatch(/soul_of_test_region:[\s\S]*?min: \{x: 48, y: 69, z: 38\}/)
    expect(yaml).toMatch(/soul_of_test_region:[\s\S]*?max: \{x: 52, y: 72, z: 42\}/)
  })

  it('omits soul cuboid in nether even when includeSoulRegions is true', () => {
    const yaml = generateRegionYAML(
      minimalRegion({ soulPoint: { x: 50, z: 40, y: 70 } }),
      false,
      false,
      false,
      false,
      true,
      'nether',
      true,
      false,
      'large',
      false
    )
    expect(yaml).not.toContain('soul_of_')
  })

  it('omits soul cuboid when includeSoulRegions is false', () => {
    const yaml = generateRegionYAML(
      minimalRegion({ soulPoint: { x: 50, z: 40 } }),
      false,
      false,
      false,
      false,
      false,
      'overworld'
    )
    expect(yaml).not.toContain('soul_of_')
  })
})
