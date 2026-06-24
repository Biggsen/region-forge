import { describe, expect, it } from 'vitest'
import { STRUCTURE_TYPES } from '../types'
import type { Region } from '../types'
import {
  buildRegionsMetaRoot,
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
  it('exports coords on heart, nerve, village, and structure rows', () => {
    const root = buildRegionsMetaRoot({
      ...baseParams,
      dimension: 'overworld',
      regions: [
        baseRegion({
          centerPoint: { x: 224, z: -848, y: 99 },
          nervePoint: { x: 220, z: -850, y: 100 },
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
    expect(regions.find(r => r.id === 'acornbrook')?.coords).toEqual({ x: 120, z: -340, y: 64 })
    expect(regions.find(r => r.id === 'inner_core')?.coords).toEqual({ x: -300, z: 600, y: 85 })
  })

  it('exports kind water with passive discover only on overworld', () => {
    const waterRegion = baseRegion({ name: 'Northern Sea', isWater: true })

    const overworld = buildRegionsMetaRoot({
      ...baseParams,
      dimension: 'overworld',
      regions: [waterRegion],
      includeVillages: false,
      includeStructures: false,
      includeHeartRegions: false,
      includeNerveRegions: false,
    })
    const mainOverworld = (overworld!.regions as Array<{ kind: string; discover: { method: string } }>)[0]
    expect(mainOverworld.kind).toBe('water')
    expect(mainOverworld.discover.method).toBe('passive')

    const end = buildRegionsMetaRoot({
      ...baseParams,
      dimension: 'end',
      regions: [waterRegion],
      includeVillages: false,
      includeStructures: false,
      includeHeartRegions: false,
      includeNerveRegions: false,
    })
    const mainEnd = (end!.regions as Array<{ kind: string; discover: { method: string } }>)[0]
    expect(mainEnd.kind).toBe('region')
    expect(mainEnd.discover.method).toBe('on_enter')
  })
})
