import { describe, it, expect } from 'vitest'
import { getJunglePyramidCuboid, getIglooCuboid, getTrailRuinsCuboid, getBuriedTreasureCuboid, generateSubregionYAML, nameToRegionId, parseVillageCSV, createStructureSubregion, buildManualStructureSubregion, ANCIENT_CITY_IMPORT_Y, buildRegionHeartsVillageFormatCSV, REGION_HEART_CSV_STRUCTURE, parseRegionHeartImportRows } from './villageUtils'
import { STRUCTURE_TYPES } from '../types'

describe('getIglooCuboid', () => {
  it('uses locator offsets: west −2, east +8, north 0, south +12, down −36, up +12', () => {
    const r = getIglooCuboid(100, -50, 64)
    expect(r).toEqual({
      minX: 98,
      maxX: 108,
      minZ: -50,
      maxZ: -38,
      minY: 28,
      maxY: 76
    })
  })
})

describe('getBuriedTreasureCuboid', () => {
  it('uses 3x3x3 with ±1 radius on each axis from chest block', () => {
    const r = getBuriedTreasureCuboid(100, -50, 70)
    expect(r).toEqual({
      minX: 99,
      maxX: 101,
      minZ: -51,
      maxZ: -49,
      minY: 69,
      maxY: 71
    })
  })
})

describe('getTrailRuinsCuboid', () => {
  it('uses XZ ±6 from locator and y−6 … y+2', () => {
    const r = getTrailRuinsCuboid(100, -50, 83)
    expect(r).toEqual({
      minX: 94,
      maxX: 106,
      minZ: -56,
      maxZ: -44,
      minY: 77,
      maxY: 85
    })
  })
})

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

describe('buildRegionHeartsVillageFormatCSV', () => {
  const triangle = [
    { x: 0, z: 0 },
    { x: 10, z: 0 },
    { x: 5, z: 10 }
  ]

  it('returns null when no hearts', () => {
    expect(buildRegionHeartsVillageFormatCSV([], '1')).toBeNull()
    expect(
      buildRegionHeartsVillageFormatCSV(
        [{ id: 'a', name: 'R', points: triangle, centerPoint: null }],
        '1'
      )
    ).toBeNull()
  })

  it('matches Teledosi-style layout and round-trips through parseVillageCSV', () => {
    const regions = [
      { id: '1', name: 'Mossbound', points: triangle, centerPoint: { x: -3136.2, z: -1440.8 } },
      { id: '2', name: 'Alpha Peak', points: triangle, centerPoint: { x: 100, z: -200 } }
    ]
    const csv = buildRegionHeartsVillageFormatCSV(regions, '1203994305')!
    const lines = csv.split('\n')
    expect(lines[0]).toBe('Sep=;')
    expect(lines[1]).toMatch(/^#X1;-?\d+$/)
    expect(lines[2]).toMatch(/^#Z1;-?\d+$/)
    expect(lines[3]).toMatch(/^#X2;-?\d+$/)
    expect(lines[4]).toMatch(/^#Z2;-?\d+$/)
    expect(lines[5]).toBe('seed;structure;x;z;details')
    expect(csv).toContain(`1203994305;${REGION_HEART_CSV_STRUCTURE};100;-200;Alpha Peak`)
    expect(csv).toContain(`1203994305;${REGION_HEART_CSV_STRUCTURE};-3136;-1441;Mossbound`)
    const parsed = parseVillageCSV(csv)
    expect(parsed).toHaveLength(2)
    expect(parsed.every(r => r.type === REGION_HEART_CSV_STRUCTURE)).toBe(true)
  })

  it('uses 0 as seed when unset', () => {
    const csv = buildRegionHeartsVillageFormatCSV(
      [{ id: '1', name: 'Only', points: triangle, centerPoint: { x: 0, z: 0 } }],
      undefined
    )!
    expect(csv).toContain('0;region_heart;0;0;Only')
  })
})

describe('parseRegionHeartImportRows', () => {
  it('keeps only region_heart rows with x;y;z', () => {
    const csv = `Sep=;
seed;structure;x;y;z;details
1;village;1;64;3;a
1203994305;region_heart;-1234;69;1915;Aureas
`
    const rows = parseRegionHeartImportRows(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      x: -1234,
      y: 69,
      z: 1915,
      type: 'region_heart',
      details: 'Aureas'
    })
  })

  it('is case-insensitive on structure column', () => {
    const csv = `seed;structure;x;z;details
1;Region_Heart;10;20;ignored
`
    const rows = parseRegionHeartImportRows(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].x).toBe(10)
    expect(rows[0].z).toBe(20)
  })
})

describe('createStructureSubregion', () => {
  it('uses fixed Y for ancient city imports; ignores CSV y', () => {
    const sub = createStructureSubregion(
      { x: 100, z: 200, y: 99, details: 'deep_dark', type: 'ancient_city' },
      0,
      STRUCTURE_TYPES.ANCIENT_CITY
    )
    expect(sub.y).toBe(ANCIENT_CITY_IMPORT_Y)
    expect(sub.y).toBe(-32)
  })
})

describe('buildManualStructureSubregion', () => {
  it('uses explicit id and createStructureSubregion for coords and type', () => {
    const sub = buildManualStructureSubregion({
      structureType: STRUCTURE_TYPES.DESERT_PYRAMID,
      x: 10,
      z: 20,
      y: 64,
      parentRegionId: 'region-a',
      existingNames: new Set(),
      subregionId: 'structure_desert_pyramid_customid123',
    })
    expect(sub.id).toBe('structure_desert_pyramid_customid123')
    expect(sub.x).toBe(10)
    expect(sub.z).toBe(20)
    expect(sub.y).toBe(64)
    expect(sub.structureType).toBe(STRUCTURE_TYPES.DESERT_PYRAMID)
    expect(sub.parentRegionId).toBe('region-a')
    expect(sub.type).toBe('structure')
  })

  it('overrides name when provided', () => {
    const sub = buildManualStructureSubregion({
      structureType: STRUCTURE_TYPES.IGLOO,
      x: 0,
      z: 0,
      y: 70,
      parentRegionId: 'r1',
      existingNames: new Set(),
      subregionId: 'structure_igloo_x',
      name: 'Custom Igloo Name',
    })
    expect(sub.name).toBe('Custom Igloo Name')
  })

  it('suffixes manual name when it collides with an existing subregion name', () => {
    const sub = buildManualStructureSubregion({
      structureType: STRUCTURE_TYPES.WOODLAND_MANSION,
      x: 1,
      z: 2,
      y: 64,
      parentRegionId: 'r1',
      existingNames: new Set(['Blackbriar Hall', 'Blackbriar Hall 1']),
      subregionId: 'structure_woodland_mansion_x',
      name: 'Blackbriar Hall',
    })
    expect(sub.name).toBe('Blackbriar Hall 2')
  })

  it('uses ancient city fixed Y like createStructureSubregion', () => {
    const sub = buildManualStructureSubregion({
      structureType: STRUCTURE_TYPES.ANCIENT_CITY,
      x: 0,
      z: 0,
      y: 100,
      parentRegionId: 'r1',
      existingNames: new Set(),
      subregionId: 'structure_ancient_city_x',
    })
    expect(sub.y).toBe(ANCIENT_CITY_IMPORT_Y)
  })
})

describe('nameToRegionId', () => {
  it('strips apostrophes and uses snake_case', () => {
    expect(nameToRegionId("Calder's Hoard")).toBe('calders_hoard')
  })

  it('replaces ampersands with and for the id', () => {
    expect(nameToRegionId('Sora & Briar')).toBe('sora_and_briar')
  })

  it('preserves hyphens in names', () => {
    expect(nameToRegionId('Sea-Nymph')).toBe('sea-nymph')
  })
})

describe('generateSubregionYAML', () => {
  it('returns null for any structure without y', () => {
    expect(generateSubregionYAML({
      id: 's1',
      name: 'Temple of Doom',
      x: 100, z: -50, radius: 64,
      type: 'structure',
      structureType: STRUCTURE_TYPES.JUNGLE_TEMPLE
    }, 'MyRegion')).toBeNull()
    expect(generateSubregionYAML({
      id: 's2',
      name: 'Ice Shelter',
      x: 1280, z: 1024, radius: 64,
      type: 'structure',
      structureType: STRUCTURE_TYPES.IGLOO
    }, 'MyRegion')).toBeNull()
  })

  it('returns cuboid YAML for jungle temple with y', () => {
    const subregion = {
      id: 's1',
      name: 'Temple of Doom',
      x: 100,
      z: -50,
      radius: 64,
      type: 'structure' as const,
      structureType: STRUCTURE_TYPES.JUNGLE_TEMPLE,
      y: 80
    }
    const yaml = generateSubregionYAML(subregion, 'MyRegion')
    expect(yaml).not.toBeNull()
    expect(yaml).toContain('  temple_of_doom:')
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
    expect(yaml).toContain('  bradford:')
    expect(yaml).toContain('min: {x: 36, y: 31, z: -114}')
    expect(yaml).toContain('max: {x: 164, y: 111, z: 14}')
    expect(yaml).not.toContain('min-y:')
    expect(yaml).not.toContain('max-y:')
  })

  it('returns cuboid YAML for ancient city with XZ radius 36 from locator', () => {
    const subregion = {
      id: 'ac1',
      name: 'Deep Echo',
      x: 100,
      z: -50,
      radius: 64,
      type: 'structure' as const,
      structureType: STRUCTURE_TYPES.ANCIENT_CITY,
      y: -32
    }
    const yaml = generateSubregionYAML(subregion, 'MyRegion')
    expect(yaml).not.toBeNull()
    expect(yaml).toContain('  deep_echo:')
    expect(yaml).toContain('min: {x: 64, y: -53, z: -86}')
    expect(yaml).toContain('max: {x: 136, y: -19, z: -14}')
  })

  it('returns cuboid YAML for igloo from locator offsets', () => {
    const subregion = {
      id: 'ig1',
      name: 'Frost Igloo',
      x: 100,
      z: -50,
      radius: 64,
      type: 'structure' as const,
      structureType: STRUCTURE_TYPES.IGLOO,
      y: 64
    }
    const yaml = generateSubregionYAML(subregion, 'MyRegion')
    expect(yaml).not.toBeNull()
    expect(yaml).toContain('  frost_igloo:')
    expect(yaml).toContain('min: {x: 98, y: 28, z: -50}')
    expect(yaml).toContain('max: {x: 108, y: 76, z: -38}')
  })

  it('returns cuboid YAML for trail ruins with XZ radius 6 and tight Y', () => {
    const subregion = {
      id: 'tr1',
      name: 'Moss Shard Site',
      x: 100,
      z: -50,
      radius: 64,
      type: 'structure' as const,
      structureType: STRUCTURE_TYPES.TRAIL_RUINS,
      y: 83
    }
    const yaml = generateSubregionYAML(subregion, 'MyRegion')
    expect(yaml).not.toBeNull()
    expect(yaml).toContain('  moss_shard_site:')
    expect(yaml).toContain('min: {x: 94, y: 77, z: -56}')
    expect(yaml).toContain('max: {x: 106, y: 85, z: -44}')
  })

  it('returns center-based cuboid YAML for desert well with y offsets', () => {
    const subregion = {
      id: 'dw1',
      name: 'Sun Refuge',
      x: 100,
      z: -50,
      radius: 64,
      type: 'structure' as const,
      structureType: STRUCTURE_TYPES.DESERT_WELL,
      y: 70
    }
    const yaml = generateSubregionYAML(subregion, 'MyRegion')
    expect(yaml).not.toBeNull()
    expect(yaml).toContain('  sun_refuge:')
    expect(yaml).toContain('min: {x: 97, y: 60, z: -53}')
    expect(yaml).toContain('max: {x: 103, y: 71, z: -47}')
  })

  it('returns cuboid YAML for woodland mansion (center x,z; 84×66 XZ; y−34..y+3)', () => {
    const subregion = {
      id: 'wm1',
      name: 'Blackbriar Hall',
      x: 100,
      z: -50,
      radius: 64,
      type: 'structure' as const,
      structureType: STRUCTURE_TYPES.WOODLAND_MANSION,
      y: 70
    }
    const yaml = generateSubregionYAML(subregion, 'MyRegion')
    expect(yaml).not.toBeNull()
    expect(yaml).toContain('  blackbriar_hall:')
    expect(yaml).toContain('min: {x: 58, y: 36, z: -83}')
    expect(yaml).toContain('max: {x: 141, y: 73, z: -18}')
  })

  it('returns cuboid YAML for swamp hut (7×7 footprint from min x,z; padded XZ; y−10..y+3)', () => {
    const subregion = {
      id: 'sh1',
      name: 'Mirewhisper Hut',
      x: 100,
      z: -50,
      radius: 64,
      type: 'structure' as const,
      structureType: STRUCTURE_TYPES.SWAMP_HUT,
      y: 70
    }
    const yaml = generateSubregionYAML(subregion, 'MyRegion')
    expect(yaml).not.toBeNull()
    expect(yaml).toContain('  mirewhisper_hut:')
    expect(yaml).toContain('min: {x: 98, y: 60, z: -52}')
    expect(yaml).toContain('max: {x: 108, y: 73, z: -42}')
  })

  it('returns 3x3x3 cuboid YAML for buried treasure (coords = chest block)', () => {
    const subregion = {
      id: 'bt1',
      name: 'Old Salt Hoard',
      x: 100,
      z: -50,
      radius: 64,
      type: 'structure' as const,
      structureType: STRUCTURE_TYPES.BURIED_TREASURE,
      y: 70
    }
    const yaml = generateSubregionYAML(subregion, 'MyRegion')
    expect(yaml).not.toBeNull()
    expect(yaml).toContain('  old_salt_hoard:')
    expect(yaml).toContain('min: {x: 99, y: 69, z: -51}')
    expect(yaml).toContain('max: {x: 101, y: 71, z: -49}')
  })

  it('returns shipwreck cuboid YAML (x centered 32 wide; z from locator to locator+32; y±10)', () => {
    const subregion = {
      id: 'sw1',
      name: 'Saltgrave Wreck',
      x: 100,
      z: -50,
      radius: 64,
      type: 'structure' as const,
      structureType: STRUCTURE_TYPES.SHIPWRECK,
      y: 70
    }
    const yaml = generateSubregionYAML(subregion, 'MyRegion')
    expect(yaml).not.toBeNull()
    expect(yaml).toContain('  saltgrave_wreck:')
    expect(yaml).toContain('min: {x: 85, y: 60, z: -50}')
    expect(yaml).toContain('max: {x: 116, y: 80, z: -18}')
  })

  it('returns ocean ruin cuboid YAML (locator center; ±20 xz, ±10 y)', () => {
    const subregion = {
      id: 'or1',
      name: 'Foam Hall Vault',
      x: 100,
      z: -50,
      radius: 64,
      type: 'structure' as const,
      structureType: STRUCTURE_TYPES.OCEAN_RUIN,
      y: 70
    }
    const yaml = generateSubregionYAML(subregion, 'MyRegion')
    expect(yaml).not.toBeNull()
    expect(yaml).toContain('  foam_hall_vault:')
    expect(yaml).toContain('min: {x: 80, y: 60, z: -70}')
    expect(yaml).toContain('max: {x: 120, y: 80, z: -30}')
  })

  it('drops apostrophes in YAML region key for buried treasure', () => {
    const subregion = {
      id: 'bt2',
      name: "Calder's Hoard",
      x: 100,
      z: -50,
      radius: 64,
      type: 'structure' as const,
      structureType: STRUCTURE_TYPES.BURIED_TREASURE,
      y: 70
    }
    const yaml = generateSubregionYAML(subregion, "O'Brien Vale")
    expect(yaml).not.toBeNull()
    expect(yaml).toContain('  calders_hoard:')
    expect(yaml).toContain('parent: obrien_vale')
    expect(yaml).toContain('max: {x: 101, y: 71, z: -49}')
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
