import { describe, it, expect } from 'vitest'
import { getJunglePyramidCuboid, generateSubregionYAML, parseVillageCSV } from './villageUtils'
import { STRUCTURE_TYPES } from '../types'

describe('getJunglePyramidCuboid', () => {
  it('computes bounds from x, z, topY', () => {
    const r = getJunglePyramidCuboid(100, -50, 80)
    expect(r.minX).toBe(98)
    expect(r.maxX).toBe(116)
    expect(r.minZ).toBe(-52)
    expect(r.maxZ).toBe(-34)
    expect(r.minY).toBe(73)
    expect(r.maxY).toBe(89)
  })

  it('uses formula minX = x-2, maxX = x+16, minZ = z-2, maxZ = z+16, minY = topY-7, maxY = topY+9', () => {
    const r = getJunglePyramidCuboid(0, 0, 64)
    expect(r.minX).toBe(-2)
    expect(r.maxX).toBe(16)
    expect(r.minZ).toBe(-2)
    expect(r.maxZ).toBe(16)
    expect(r.minY).toBe(57)
    expect(r.maxY).toBe(73)
  })
})

describe('parseVillageCSV', () => {
  it('parses seed map format with x;y;z columns', () => {
    const csv = `Sep=;
#X1;-4000
seed;structure;x;y;z;details
3069048097508106794;village;-3952;66;-432;plains_meeting_point_2
3069048097508106794;village;-3488;84;-1376;plains_meeting_point_2
`
    const rows = parseVillageCSV(csv)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ x: -3952, y: 66, z: -432, type: 'village', details: 'plains_meeting_point_2' })
    expect(rows[1]).toMatchObject({ x: -3488, y: 84, z: -1376, type: 'village', details: 'plains_meeting_point_2' })
  })

  it('parses legacy format without y column', () => {
    const csv = `seed;structure;x;z;details
1;village;100;200;plains_meeting_point_1
`
    const rows = parseVillageCSV(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ x: 100, z: 200, type: 'village', details: 'plains_meeting_point_1' })
    expect(rows[0].y).toBeUndefined()
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
    expect(yaml).toContain('min: {x: 98, y: 73, z: -52}')
    expect(yaml).toContain('max: {x: 116, y: 89, z: -34}')
    expect(yaml).not.toContain('min-y:')
    expect(yaml).not.toContain('max-y:')
  })

  it('returns cuboid YAML for village with y offsets', () => {
    const subregion = {
      id: 'v1',
      name: 'Bradford',
      x: 100,
      z: -50,
      radius: 64,
      type: 'village' as const,
      y: 66,
    }
    const yaml = generateSubregionYAML(subregion, 'MyRegion')
    expect(yaml).not.toBeNull()
    expect(yaml).toContain('min: {x: 36, y: 31, z: -114}')
    expect(yaml).toContain('max: {x: 164, y: 111, z: 14}')
    expect(yaml).not.toContain('min-y:')
    expect(yaml).not.toContain('max-y:')
  })

  it('uses custom village height with rounded-up half span', () => {
    const subregion = {
      id: 'v2',
      name: 'Riverton',
      x: 100,
      z: -50,
      radius: 64,
      type: 'village' as const,
      y: 66,
      height: 71,
    }
    const yaml = generateSubregionYAML(subregion, 'MyRegion')
    expect(yaml).not.toBeNull()
    expect(yaml).toContain('min: {x: 36, y: 30, z: -114}')
    expect(yaml).toContain('max: {x: 164, y: 102, z: 14}')
  })
})
