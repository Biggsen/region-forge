import { describe, it, expect } from 'vitest'
import { getJunglePyramidCuboid, generateSubregionYAML } from './villageUtils'
import { STRUCTURE_TYPES } from '../types'

describe('getJunglePyramidCuboid', () => {
  it('computes bounds from x, z, topY', () => {
    const r = getJunglePyramidCuboid(100, -50, 80)
    expect(r.minX).toBe(98)
    expect(r.maxX).toBe(116)
    expect(r.minZ).toBe(-52)
    expect(r.maxZ).toBe(-34)
    expect(r.minY).toBe(64)
    expect(r.maxY).toBe(82)
  })

  it('uses formula minX = x-2, maxX = x+16, minZ = z-2, maxZ = z+16, minY = topY-16, maxY = topY+2', () => {
    const r = getJunglePyramidCuboid(0, 0, 64)
    expect(r.minX).toBe(-2)
    expect(r.maxX).toBe(16)
    expect(r.minZ).toBe(-2)
    expect(r.maxZ).toBe(16)
    expect(r.minY).toBe(48)
    expect(r.maxY).toBe(66)
  })
})

describe('generateSubregionYAML', () => {
  it('returns null for any structure without y', () => {
    expect(generateSubregionYAML({
      id: 's1',
      name: 'Temple of Doom',
      x: 100, z: -50, radius: 64,
      type: 'structure',
      structureType: STRUCTURE_TYPES.JUNGLE_PYRAMID
    }, 'MyRegion')).toBeNull()
    expect(generateSubregionYAML({
      id: 's2',
      name: 'Ice Shelter',
      x: 1280, z: 1024, radius: 64,
      type: 'structure',
      structureType: STRUCTURE_TYPES.IGLOO
    }, 'MyRegion')).toBeNull()
  })

  it('returns cuboid YAML for jungle pyramid with y', () => {
    const subregion = {
      id: 's1',
      name: 'Temple of Doom',
      x: 100,
      z: -50,
      radius: 64,
      type: 'structure' as const,
      structureType: STRUCTURE_TYPES.JUNGLE_PYRAMID,
      y: 80
    }
    const yaml = generateSubregionYAML(subregion, 'MyRegion')
    expect(yaml).not.toBeNull()
    expect(yaml).toContain('min: {x: 98, y: 64, z: -52}')
    expect(yaml).toContain('max: {x: 116, y: 82, z: -34}')
  })
})
