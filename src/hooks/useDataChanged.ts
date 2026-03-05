import { useState, useEffect, useRef, useCallback } from 'react'
import { Region, MapState } from '../types'
import { getEffectiveMapImage } from '../utils/mapStateUtils'

interface LastSavedState {
  regions: Region[]
  worldName: string
  spawnCoordinates: { x: number; z: number; y?: number; radius?: number } | null
  dimension: 'overworld' | 'nether' | 'end'
  mapImageSrc: string | null
}

export function useDataChanged(
  regions: Region[],
  mapState: MapState,
  worldName: string,
  spawnCoordinates: { x: number; z: number; y?: number; radius?: number } | null,
  dimension: 'overworld' | 'nether' | 'end'
) {
  const [hasChanged, setHasChanged] = useState(false)
  const lastSavedRef = useRef<LastSavedState | null>(null)

  // Get a stable representation of the map image
  const effectiveImage = getEffectiveMapImage(mapState)
  const getMapImageKey = useCallback((): string | null => {
    if (!effectiveImage) return null
    const image = effectiveImage as any
    return image.src || `${image.width}x${image.height}`
  }, [effectiveImage])

  // Check if current state differs from last saved
  const checkForChanges = useCallback(() => {
    if (!lastSavedRef.current) {
      const hasData = 
        regions.length > 0 ||
        effectiveImage !== null ||
        worldName !== 'world' ||
        spawnCoordinates !== null
      setHasChanged(hasData)
      return
    }

    const last = lastSavedRef.current
    const currentImageKey = getMapImageKey()

    const regionsChanged = JSON.stringify(regions) !== JSON.stringify(last.regions)
    const worldNameChanged = worldName !== last.worldName
    const spawnChanged = JSON.stringify(spawnCoordinates) !== JSON.stringify(last.spawnCoordinates)
    const dimensionChanged = dimension !== last.dimension
    const mapImageChanged = currentImageKey !== last.mapImageSrc

    setHasChanged(
      regionsChanged ||
      worldNameChanged ||
      spawnChanged ||
      dimensionChanged ||
      mapImageChanged
    )
  }, [regions, effectiveImage, worldName, spawnCoordinates, dimension, getMapImageKey])

  // Check for changes whenever monitored data changes
  useEffect(() => {
    checkForChanges()
  }, [checkForChanges])

  // Mark data as saved (call this after successful export)
  const markAsSaved = () => {
    lastSavedRef.current = {
      regions: JSON.parse(JSON.stringify(regions)), // Deep clone (includes subregions/villages)
      worldName,
      spawnCoordinates: spawnCoordinates ? JSON.parse(JSON.stringify(spawnCoordinates)) : null,
      dimension,
      mapImageSrc: getMapImageKey()
    }
    setHasChanged(false)
  }

  return { hasChanged, markAsSaved }
}

