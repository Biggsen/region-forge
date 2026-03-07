import { describe, it, expect } from 'vitest'
import { getSpawnExportData } from './spawnUtils'
import type { SpawnState } from '../types'

describe('getSpawnExportData', () => {
  it('returns null when coordinates are null', () => {
    const state: SpawnState = {
      coordinates: null,
      isPlacing: false,
      radius: 50,
    }
    expect(getSpawnExportData(state)).toBeNull()
  })

  it('returns spawn export object when coordinates exist', () => {
    const state: SpawnState = {
      coordinates: { x: 100, z: -200, y: 64 },
      isPlacing: false,
      radius: 75,
    }
    expect(getSpawnExportData(state)).toEqual({
      x: 100,
      z: -200,
      y: 64,
      radius: 75,
    })
  })

  it('uses radius from spawnState', () => {
    const state: SpawnState = {
      coordinates: { x: 0, z: 0, y: 0 },
      isPlacing: false,
      radius: 100,
    }
    expect(getSpawnExportData(state)?.radius).toBe(100)
  })
})
