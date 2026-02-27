import { useState, useEffect, useCallback } from 'react'
import { saveRegionFillOpacity, loadRegionFillOpacity } from '../utils/persistenceUtils'

export function useRegionFillOpacity() {
  const [regionFillOpacity, setRegionFillOpacityState] = useState(loadRegionFillOpacity)

  useEffect(() => {
    saveRegionFillOpacity(regionFillOpacity)
  }, [regionFillOpacity])

  const setRegionFillOpacity = useCallback((value: number) => {
    const clamped = Math.max(0, Math.min(1, value))
    setRegionFillOpacityState(clamped)
  }, [])

  return { regionFillOpacity, setRegionFillOpacity }
}
