import { describe, it, expect } from 'vitest'
import { DEFAULT_EDIT_MODE, editModeForEditing, editModeForMove, editModeForSplit } from './editModeUtils'

describe('editModeUtils', () => {
  describe('DEFAULT_EDIT_MODE', () => {
    it('has all editing flags off and null ids', () => {
      expect(DEFAULT_EDIT_MODE.isEditing).toBe(false)
      expect(DEFAULT_EDIT_MODE.editingRegionId).toBeNull()
      expect(DEFAULT_EDIT_MODE.isMovingRegion).toBe(false)
      expect(DEFAULT_EDIT_MODE.movingRegionId).toBeNull()
      expect(DEFAULT_EDIT_MODE.isSplittingRegion).toBe(false)
      expect(DEFAULT_EDIT_MODE.splittingRegionId).toBeNull()
      expect(DEFAULT_EDIT_MODE.splitPoints).toEqual([])
    })
  })

  describe('editModeForEditing', () => {
    it('returns mode with isEditing true and editingRegionId set', () => {
      const mode = editModeForEditing('region-1')
      expect(mode.isEditing).toBe(true)
      expect(mode.editingRegionId).toBe('region-1')
      expect(mode.isMovingRegion).toBe(false)
      expect(mode.isSplittingRegion).toBe(false)
    })
  })

  describe('editModeForMove', () => {
    it('returns mode with move state set', () => {
      const points = [{ x: 0, z: 0 }, { x: 1, z: 0 }]
      const mode = editModeForMove('r1', 10, 20, points)
      expect(mode.isMovingRegion).toBe(true)
      expect(mode.movingRegionId).toBe('r1')
      expect(mode.moveStartPosition).toEqual({ x: 10, z: 20 })
      expect(mode.originalRegionPoints).toEqual(points)
      expect(mode.isEditing).toBe(false)
      expect(mode.isSplittingRegion).toBe(false)
    })
  })

  describe('editModeForSplit', () => {
    it('returns mode with split state set', () => {
      const mode = editModeForSplit('region-2')
      expect(mode.isSplittingRegion).toBe(true)
      expect(mode.splittingRegionId).toBe('region-2')
      expect(mode.splitPoints).toEqual([])
      expect(mode.isEditing).toBe(false)
      expect(mode.isMovingRegion).toBe(false)
    })
  })
})
