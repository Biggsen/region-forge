import { useState, useCallback } from 'react'
import type { HighlightMode, StructureType } from '../types'
import { DEFAULT_HIGHLIGHT_MODE } from '../utils/highlightModeUtils'

export function useRegionHighlight() {
  const [highlightMode, setHighlightMode] = useState<HighlightMode>(DEFAULT_HIGHLIGHT_MODE)

  const setStructureTypeVisible = useCallback((structureType: StructureType, visible: boolean) => {
    setHighlightMode(prev => ({
      ...prev,
      visibleStructureTypes: { ...prev.visibleStructureTypes, [structureType]: visible },
    }))
  }, [])

  const setHighlightedStructureType = useCallback((structureType: StructureType | null) => {
    setHighlightMode(prev => ({ ...prev, highlightedStructureType: structureType }))
  }, [])

  const toggleHighlightAll = useCallback(() => {
    setHighlightMode(prev => ({ ...prev, highlightAll: !prev.highlightAll }))
  }, [])

  const toggleShowRegions = useCallback(() => {
    setHighlightMode(prev => ({ ...prev, showRegions: !prev.showRegions }))
  }, [])

  const toggleShowVillages = useCallback(() => {
    setHighlightMode(prev => ({ ...prev, showVillages: !prev.showVillages }))
  }, [])

  const toggleShowCenterPoints = useCallback(() => {
    setHighlightMode(prev => ({ ...prev, showCenterPoints: !prev.showCenterPoints }))
  }, [])

  const toggleShowChallengeLevels = useCallback(() => {
    setHighlightMode(prev => ({ ...prev, showChallengeLevels: !prev.showChallengeLevels }))
  }, [])

  const toggleShowGrid = useCallback(() => {
    setHighlightMode(prev => ({ ...prev, showGrid: !prev.showGrid }))
  }, [])

  const toggleShowNames = useCallback(() => {
    setHighlightMode(prev => ({ ...prev, showNames: !prev.showNames }))
  }, [])

  return {
    highlightMode,
    setHighlightMode,
    setStructureTypeVisible,
    setHighlightedStructureType,
    toggleHighlightAll,
    toggleShowRegions,
    toggleShowVillages,
    toggleShowCenterPoints,
    toggleShowChallengeLevels,
    toggleShowGrid,
    toggleShowNames,
  }
}
