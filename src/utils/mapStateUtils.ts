import { MapState } from '../types'

export function getEffectiveMapImage(mapState: MapState): HTMLImageElement | null {
  return mapState.terrainImage ?? mapState.biomeImage ?? mapState.image
}

export function hasMapLoaded(mapState: MapState): boolean {
  return getEffectiveMapImage(mapState) !== null
}
