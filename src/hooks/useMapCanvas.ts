import { useState, useCallback } from 'react'

export function useMapCanvas() {
  const [isSettingCenterPoint, setIsSettingCenterPoint] = useState(false)
  const [centerPointRegionId, setCenterPointRegionId] = useState<string | null>(null)
  const [isSettingNervePoint, setIsSettingNervePoint] = useState(false)
  const [nervePointRegionId, setNervePointRegionId] = useState<string | null>(null)
  const [isSettingSoulPoint, setIsSettingSoulPoint] = useState(false)
  const [soulPointRegionId, setSoulPointRegionId] = useState<string | null>(null)
  const [isPlacingLabel, setIsPlacingLabel] = useState(false)
  const [placingLabelRegionId, setPlacingLabelRegionId] = useState<string | null>(null)
  const [isWarping, setIsWarping] = useState(false)
  const [warpRadius, setWarpRadius] = useState(40)
  const [warpStrength, setWarpStrength] = useState(12)

  const startSettingCenterPoint = useCallback((regionId: string) => {
    setIsSettingNervePoint(false)
    setNervePointRegionId(null)
    setIsSettingSoulPoint(false)
    setSoulPointRegionId(null)
    setIsSettingCenterPoint(true)
    setCenterPointRegionId(regionId)
  }, [])

  const stopSettingCenterPoint = useCallback(() => {
    setIsSettingCenterPoint(false)
    setCenterPointRegionId(null)
  }, [])

  const startSettingNervePoint = useCallback((regionId: string) => {
    setIsSettingCenterPoint(false)
    setCenterPointRegionId(null)
    setIsSettingSoulPoint(false)
    setSoulPointRegionId(null)
    setIsSettingNervePoint(true)
    setNervePointRegionId(regionId)
  }, [])

  const stopSettingNervePoint = useCallback(() => {
    setIsSettingNervePoint(false)
    setNervePointRegionId(null)
  }, [])

  const startSettingSoulPoint = useCallback((regionId: string) => {
    setIsSettingCenterPoint(false)
    setCenterPointRegionId(null)
    setIsSettingNervePoint(false)
    setNervePointRegionId(null)
    setIsSettingSoulPoint(true)
    setSoulPointRegionId(regionId)
  }, [])

  const stopSettingSoulPoint = useCallback(() => {
    setIsSettingSoulPoint(false)
    setSoulPointRegionId(null)
  }, [])

  const startPlacingLabel = useCallback((regionId: string) => {
    setIsPlacingLabel(true)
    setPlacingLabelRegionId(regionId)
  }, [])

  const stopPlacingLabel = useCallback(() => {
    setIsPlacingLabel(false)
    setPlacingLabelRegionId(null)
  }, [])

  return {
    isSettingCenterPoint,
    centerPointRegionId,
    startSettingCenterPoint,
    stopSettingCenterPoint,
    isSettingNervePoint,
    nervePointRegionId,
    startSettingNervePoint,
    stopSettingNervePoint,
    isSettingSoulPoint,
    soulPointRegionId,
    startSettingSoulPoint,
    stopSettingSoulPoint,
    isPlacingLabel,
    placingLabelRegionId,
    startPlacingLabel,
    stopPlacingLabel,
    isWarping,
    setIsWarping,
    warpRadius,
    setWarpRadius,
    warpStrength,
    setWarpStrength
  }
}
