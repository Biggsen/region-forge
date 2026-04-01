import { useState, useCallback } from 'react'
import type { Region } from '../types'
import { generateId } from '../utils/polygonUtils'
import { simplifyPolygonVertices } from '../utils/polygonUtils'

export interface UseRegionDrawingCallbacks {
  onAddRegion: (region: Omit<Region, 'id'>) => boolean
  onExitEditMode: () => void
}

export function useRegionDrawing({ onAddRegion, onExitEditMode }: UseRegionDrawingCallbacks) {
  const [drawingRegion, setDrawingRegion] = useState<Region | null>(null)
  const [freehandEnabled, setFreehandEnabled] = useState(false)

  const startDrawingRegion = useCallback((name: string) => {
    setDrawingRegion({
      id: generateId(),
      name,
      points: [],
      centerPoint: null,
      challengeLevel: 'easy',
      hasSpawn: false,
      isWater: false
    })
    onExitEditMode()
  }, [onExitEditMode])

  const addPointToDrawing = useCallback((x: number, z: number) => {
    setDrawingRegion(prev => prev ? {
      ...prev,
      points: [...prev.points, { x, z }]
    } : null)
  }, [])

  const finishDrawingRegion = useCallback(() => {
    if (!drawingRegion || drawingRegion.points.length < 3) return false
    const points = freehandEnabled
      ? simplifyPolygonVertices(drawingRegion.points, 3)
      : drawingRegion.points
    const success = onAddRegion({
      name: drawingRegion.name,
      points,
      centerPoint: drawingRegion.centerPoint ?? null,
      challengeLevel: drawingRegion.challengeLevel ?? 'easy',
      hasSpawn: drawingRegion.hasSpawn ?? false,
      isWater: drawingRegion.isWater ?? false
    })
    if (success) setDrawingRegion(null)
    return success
  }, [drawingRegion, freehandEnabled, onAddRegion])

  const cancelDrawingRegion = useCallback(() => {
    setDrawingRegion(null)
  }, [])

  return {
    drawingRegion,
    freehandEnabled,
    setFreehandEnabled,
    setDrawingRegion,
    startDrawingRegion,
    addPointToDrawing,
    finishDrawingRegion,
    cancelDrawingRegion,
  }
}
