import { useState, useCallback, useEffect } from 'react'
import { SpawnState, SpawnCoordinate } from '../types'

const SPAWN_STORAGE_KEY = 'mc-region-maker-spawn'

const DEFAULT_Y = 0

function toSpawnCoordinate(
  coords: { x: number; z: number; y?: number },
  existingY?: number
): SpawnCoordinate {
  const y = typeof coords.y === 'number' ? coords.y : (existingY ?? DEFAULT_Y)
  return { x: coords.x, z: coords.z, y }
}

export function useSpawn() {
  const [spawnState, setSpawnState] = useState<SpawnState>({
    coordinates: null,
    isPlacing: false,
    radius: 50
  })

  // Load spawn coordinates and radius from localStorage on mount
  useEffect(() => {
    try {
      const savedSpawn = localStorage.getItem(SPAWN_STORAGE_KEY)
      if (savedSpawn) {
        const parsedSpawn = JSON.parse(savedSpawn)
        if (parsedSpawn && typeof parsedSpawn.x === 'number' && typeof parsedSpawn.z === 'number') {
          const y = typeof parsedSpawn.y === 'number' ? parsedSpawn.y : DEFAULT_Y
          setSpawnState(prev => ({
            ...prev,
            coordinates: { x: parsedSpawn.x, z: parsedSpawn.z, y },
            radius: parsedSpawn.radius || 50
          }))
        }
      }
    } catch (error) {
      console.warn('Failed to load spawn data from localStorage:', error)
    }
  }, [])

  const setSpawnCoordinates = useCallback((coordinates: SpawnCoordinate | { x: number; z: number; y?: number } | null) => {
    setSpawnState(prev => {
      const nextCoords = coordinates
        ? toSpawnCoordinate(coordinates, prev.coordinates?.y)
        : null
      return {
        ...prev,
        coordinates: nextCoords,
        isPlacing: false
      }
    })

    // Save to localStorage
    if (coordinates) {
      try {
        const normalized = toSpawnCoordinate(coordinates, spawnState.coordinates?.y)
        const spawnData = { ...normalized, radius: spawnState.radius }
        localStorage.setItem(SPAWN_STORAGE_KEY, JSON.stringify(spawnData))
      } catch (error) {
        console.warn('Failed to save spawn data to localStorage:', error)
      }
    } else {
      try {
        localStorage.removeItem(SPAWN_STORAGE_KEY)
      } catch (error) {
        console.warn('Failed to remove spawn data from localStorage:', error)
      }
    }
  }, [spawnState.radius])

  const setSpawnRadius = useCallback((radius: number) => {
    setSpawnState(prev => ({
      ...prev,
      radius
    }))

    // Save radius to localStorage if coordinates exist
    if (spawnState.coordinates) {
      try {
        const spawnData = { ...spawnState.coordinates, radius }
        localStorage.setItem(SPAWN_STORAGE_KEY, JSON.stringify(spawnData))
      } catch (error) {
        console.warn('Failed to save spawn radius to localStorage:', error)
      }
    }
  }, [spawnState.coordinates])

  const startPlacingSpawn = useCallback(() => {
    setSpawnState(prev => ({
      ...prev,
      isPlacing: true
    }))
  }, [])

  const cancelPlacingSpawn = useCallback(() => {
    setSpawnState(prev => ({
      ...prev,
      isPlacing: false
    }))
  }, [])

  return {
    spawnState,
    setSpawnCoordinates,
    setSpawnRadius,
    startPlacingSpawn,
    cancelPlacingSpawn
  }
}
