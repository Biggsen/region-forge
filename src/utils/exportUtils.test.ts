import { describe, expect, it } from 'vitest'
import { STRUCTURE_TYPES } from '../types'
import type { Region } from '../types'
import {
  buildRegionsMetaRoot,
  getRegionsYmlExportStats,
  isRegionsMetaWater,
  metaCoordsFromAnchor,
} from './exportUtils'

const baseRegion = (overrides: Partial<Region> = {}): Region => ({
  id: 'r1',
  name: 'Dradacliff',
  points: [
    { x: 0, z: 0 },
    { x: 10, z: 0 },
    { x: 10, z: 10 },
  ],
  ...overrides,
})

const baseParams = {
  spawnState: { coordinates: null, radius: 0 },
  includeVillages: true,
  includeStructures: true,
  includeHeartRegions: true,
  includeNerveRegions: true,
  includeSoulRegions: true,
  includeSpawnRegion: false,
}

describe('metaCoordsFromAnchor', () => {
  it('returns rounded x/z and omits y when unset', () => {
    expect(metaCoordsFromAnchor({ x: 224.7, z: -848.2 })).toEqual({ x: 225, z: -848 })
  })

  it('includes y when set', () => {
    expect(metaCoordsFromAnchor({ x: 10, z: 20, y: 64.9 })).toEqual({ x: 10, z: 20, y: 65 })
  })

  it('returns undefined for null anchor', () => {
    expect(metaCoordsFromAnchor(null)).toBeUndefined()
  })
})

describe('isRegionsMetaWater', () => {
  const waterRegion = baseRegion({ isWater: true })

  it('is true only on overworld', () => {
    expect(isRegionsMetaWater(waterRegion, 'overworld')).toBe(true)
    expect(isRegionsMetaWater(waterRegion, 'nether')).toBe(false)
    expect(isRegionsMetaWater(waterRegion, 'end')).toBe(false)
  })
})

describe('buildRegionsMetaRoot', () => {
  it('exports coords on heart, nerve, soul, village, and structure rows', () => {
    const root = buildRegionsMetaRoot({
      ...baseParams,
      dimension: 'overworld',
      regions: [
        baseRegion({
          centerPoint: { x: 224, z: -848, y: 99 },
          nervePoint: { x: 220, z: -850, y: 100 },
          soulPoint: { x: 218, z: -846, y: 101 },
          subregions: [
            {
              id: 'v1',
              name: 'Acornbrook',
              x: 120,
              z: -340,
              y: 64,
              radius: 5,
              type: 'village',
            },
            {
              id: 's1',
              name: 'Inner Core',
              x: -300,
              z: 600,
              y: 85,
              radius: 3,
              type: 'structure',
              structureType: STRUCTURE_TYPES.ANCIENT_CITY,
            },
          ],
        }),
      ],
    })

    const regions = root!.regions as Array<{ id: string; coords?: { x: number; z: number; y?: number } }>
    expect(regions.find(r => r.id === 'heart_of_dradacliff')?.coords).toEqual({ x: 224, z: -848, y: 99 })
    expect(regions.find(r => r.id === 'nerve_of_dradacliff')?.coords).toEqual({ x: 220, z: -850, y: 100 })
    expect(regions.find(r => r.id === 'soul_of_dradacliff')?.coords).toEqual({ x: 218, z: -846, y: 101 })
    expect(regions.find(r => r.id === 'acornbrook')?.coords).toEqual({ x: 120, z: -340, y: 64 })
    expect(regions.find(r => r.id === 'inner_core')?.coords).toEqual({ x: -300, z: 600, y: 85 })
    expect(root!.structureFamilies).toEqual({
      ancient_city: { label: 'Ancient Cities', shortLabel: 'Ancient Cities', counter: 'ancient_cities_found' },
    })
  })

  it('exports a hard-coded shortLabel for each used structure family', () => {
    const root = buildRegionsMetaRoot({
      ...baseParams,
      dimension: 'overworld',
      regions: [
        baseRegion({
          subregions: [
            {
              id: 's1',
              name: 'Hidden Chest',
              x: 1,
              z: 2,
              y: 3,
              radius: 1,
              type: 'structure',
              structureType: STRUCTURE_TYPES.BURIED_TREASURE,
            },
          ],
        }),
      ],
    })

    expect(root!.structureFamilies).toEqual({
      buried_treasure: { label: 'Buried Treasures', shortLabel: 'Treasures', counter: 'buried_treasures_found' },
    })
  })

  it('exports kind water with on_enter discover only on overworld', () => {
    const waterRegion = baseRegion({ name: 'Northern Sea', isWater: true })

    const overworld = buildRegionsMetaRoot({
      ...baseParams,
      dimension: 'overworld',
      regions: [waterRegion],
      includeVillages: false,
      includeStructures: false,
      includeHeartRegions: false,
      includeNerveRegions: false,
      includeSoulRegions: false,
    })
    const mainOverworld = (overworld!.regions as Array<{ kind: string; discover: { method: string } }>)[0]
    expect(mainOverworld.kind).toBe('water')
    expect(mainOverworld.discover.method).toBe('on_enter')

    const end = buildRegionsMetaRoot({
      ...baseParams,
      dimension: 'end',
      regions: [waterRegion],
      includeVillages: false,
      includeStructures: false,
      includeHeartRegions: false,
      includeNerveRegions: false,
      includeSoulRegions: false,
    })
    const mainEnd = (end!.regions as Array<{ kind: string; discover: { method: string } }>)[0]
    expect(mainEnd.kind).toBe('region')
    expect(mainEnd.discover.method).toBe('on_enter')
  })

  it('omits soul rows outside the overworld', () => {
    const regions = [baseRegion({ soulPoint: { x: 12, z: 34, y: 56 } })]
    const nether = buildRegionsMetaRoot({
      ...baseParams,
      dimension: 'nether',
      regions,
    })
    const rows = nether!.regions as Array<{ id: string; kind: string }>
    expect(rows.some(row => row.kind === 'soul' || row.id.startsWith('soul_of_'))).toBe(false)
  })
})

describe('getRegionsYmlExportStats', () => {
  const counted = baseRegion({
    centerPoint: { x: 1, z: 2 },
    nervePoint: { x: 3, z: 4 },
    soulPoint: { x: 5, z: 6 },
  })

  it('counts souls only for overworld exports', () => {
    const overworld = getRegionsYmlExportStats(
      [counted],
      false,
      false,
      true,
      true,
      true,
      false,
      null,
      'overworld',
      true,
      false,
      'large'
    )
    expect(overworld).toMatchObject({ heartCount: 1, nerveCount: 1, soulCount: 1 })

    const nether = getRegionsYmlExportStats(
      [counted],
      false,
      false,
      true,
      true,
      true,
      false,
      null,
      'nether',
      true,
      false,
      'large'
    )
    expect(nether).toMatchObject({ heartCount: 1, nerveCount: 0, soulCount: 0 })
  })
})
