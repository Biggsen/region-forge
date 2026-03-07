import type { SpawnState } from '../types'

export type SpawnExportData = {
  x: number
  z: number
  y: number
  radius: number
}

export function getSpawnExportData(spawnState: SpawnState): SpawnExportData | null {
  if (!spawnState.coordinates) return null
  return {
    x: spawnState.coordinates.x,
    z: spawnState.coordinates.z,
    y: spawnState.coordinates.y,
    radius: spawnState.radius,
  }
}
