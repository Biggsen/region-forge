import type { EditMode } from '../types'

export const DEFAULT_EDIT_MODE: EditMode = {
  isEditing: false,
  editingRegionId: null,
  draggingPointIndex: null,
  isMovingRegion: false,
  movingRegionId: null,
  moveStartPosition: null,
  originalRegionPoints: null,
  isSplittingRegion: false,
  splittingRegionId: null,
  splitPoints: [],
}

export function editModeForEditing(regionId: string): EditMode {
  return {
    ...DEFAULT_EDIT_MODE,
    isEditing: true,
    editingRegionId: regionId,
  }
}

export function editModeForMove(
  regionId: string,
  startX: number,
  startZ: number,
  originalPoints: { x: number; z: number }[]
): EditMode {
  return {
    ...DEFAULT_EDIT_MODE,
    isMovingRegion: true,
    movingRegionId: regionId,
    moveStartPosition: { x: startX, z: startZ },
    originalRegionPoints: originalPoints,
  }
}

export function editModeForSplit(regionId: string): EditMode {
  return {
    ...DEFAULT_EDIT_MODE,
    isSplittingRegion: true,
    splittingRegionId: regionId,
  }
}
