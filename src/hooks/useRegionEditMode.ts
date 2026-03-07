import { useState, useCallback } from 'react'
import type { EditMode } from '../types'
import { DEFAULT_EDIT_MODE, editModeForEditing } from '../utils/editModeUtils'

export function useRegionEditMode() {
  const [editMode, setEditMode] = useState<EditMode>(DEFAULT_EDIT_MODE)

  const startEditMode = useCallback((regionId: string) => {
    setEditMode(editModeForEditing(regionId))
  }, [])

  const stopEditMode = useCallback(() => {
    setEditMode(DEFAULT_EDIT_MODE)
  }, [])

  const startDraggingPoint = useCallback((regionId: string, pointIndex: number) => {
    setEditMode(prev => ({
      ...prev,
      editingRegionId: regionId,
      draggingPointIndex: pointIndex
    }))
  }, [])

  const stopDraggingPoint = useCallback(() => {
    setEditMode(prev => ({
      ...prev,
      draggingPointIndex: null
    }))
  }, [])

  const finishMoveRegion = useCallback(() => {
    setEditMode(prev => ({
      ...prev,
      isMovingRegion: false,
      movingRegionId: null,
      moveStartPosition: null,
      originalRegionPoints: null
    }))
  }, [])

  const addSplitPoint = useCallback((point: { x: number; z: number }) => {
    setEditMode(prev => ({
      ...prev,
      splitPoints: [...prev.splitPoints, point]
    }))
  }, [])

  const cancelSplitRegion = useCallback(() => {
    setEditMode(DEFAULT_EDIT_MODE)
  }, [])

  return {
    editMode,
    setEditMode,
    startEditMode,
    stopEditMode,
    startDraggingPoint,
    stopDraggingPoint,
    finishMoveRegion,
    addSplitPoint,
    cancelSplitRegion,
  }
}
