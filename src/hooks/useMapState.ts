import { useState, useCallback, useEffect, useRef } from 'react'
import { MapState } from '../types'
import { saveMapState, loadMapState } from '../utils/persistenceUtils'

export function useMapState() {
  const isHydratedRef = useRef(false)
  const latestMapStateRef = useRef<MapState | null>(null)
  const [mapState, setMapState] = useState<MapState>({
    image: null,
    terrainImage: null,
    biomeImage: null,
    terrainVisible: true,
    terrainOpacity: 1,
    biomeVisible: true,
    biomeOpacity: 0.8,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastMousePos: null,
    originSelected: false,
    originOffset: null,
    imageOpacity: 1
  })

  // Load saved state on mount
  useEffect(() => {
    const loadSavedState = async () => {
      const savedState = await loadMapState()
      if (savedState) {
        setMapState(savedState)
      }
    }
    loadSavedState().finally(() => {
      isHydratedRef.current = true
    })
  }, [])

  latestMapStateRef.current = mapState

  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = latestMapStateRef.current
      if (state?.terrainImage || state?.image) {
        saveMapState(state)
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Save state whenever it changes (but not during initial load)
  useEffect(() => {
    if (!isHydratedRef.current) return
    if (!mapState.terrainImage && !mapState.image) return
    saveMapState(mapState)
  }, [mapState])

  const setImage = useCallback((image: HTMLImageElement) => {
    setMapState(prev => ({
      ...prev,
      image,
      terrainImage: image,
      biomeImage: null
    }))
  }, [])

  const setTerrainImage = useCallback((image: HTMLImageElement | null) => {
    setMapState(prev => ({ ...prev, terrainImage: image }))
  }, [])

  const setBiomeImage = useCallback((image: HTMLImageElement | null) => {
    setMapState(prev => ({ ...prev, biomeImage: image }))
  }, [])

  const setTerrainOpacity = useCallback((opacity: number) => {
    setMapState(prev => ({ ...prev, terrainOpacity: Math.max(0, Math.min(1, opacity)) }))
  }, [])

  const setBiomeOpacity = useCallback((opacity: number) => {
    setMapState(prev => ({ ...prev, biomeOpacity: Math.max(0, Math.min(1, opacity)) }))
  }, [])

  const setTerrainVisible = useCallback((visible: boolean) => {
    setMapState(prev => ({ ...prev, terrainVisible: visible }))
  }, [])

  const setBiomeVisible = useCallback((visible: boolean) => {
    setMapState(prev => ({ ...prev, biomeVisible: visible }))
  }, [])

  const setScale = useCallback((scale: number) => {
    setMapState(prev => ({ ...prev, scale: Math.max(0.1, Math.min(5, scale)) }))
  }, [])

  const setOffset = useCallback((offsetX: number, offsetY: number) => {
    setMapState(prev => ({ ...prev, offsetX, offsetY }))
  }, [])

  const setOrigin = useCallback((originX: number, originY: number) => {
    setMapState(prev => ({ 
      ...prev, 
      originSelected: true, 
      originOffset: { x: originX, y: originY } 
    }))
  }, [])

  const setOriginSelected = useCallback((selected: boolean) => {
    setMapState(prev => ({ ...prev, originSelected: selected }))
  }, [])

  const setOriginOffset = useCallback((offset: { x: number; y: number } | null) => {
    setMapState(prev => ({ ...prev, originOffset: offset }))
  }, [])

  const startDragging = useCallback((x: number, y: number) => {
    setMapState(prev => ({
      ...prev,
      isDragging: true,
      lastMousePos: { x, y }
    }))
  }, [])

  const stopDragging = useCallback(() => {
    setMapState(prev => ({
      ...prev,
      isDragging: false,
      lastMousePos: null
    }))
  }, [])

  const handleMouseMove = useCallback((x: number, y: number) => {
    if (!mapState.isDragging || !mapState.lastMousePos) return

    const deltaX = x - mapState.lastMousePos.x
    const deltaY = y - mapState.lastMousePos.y

    setMapState(prev => ({
      ...prev,
      offsetX: prev.offsetX + deltaX,
      offsetY: prev.offsetY + deltaY,
      lastMousePos: { x, y }
    }))
  }, [mapState.isDragging, mapState.lastMousePos])

  const handleWheel = useCallback((deltaY: number, x: number, y: number) => {
    const zoomFactor = deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.1, Math.min(10, mapState.scale * zoomFactor))

    // Calculate the point under the mouse before zoom
    const pointXBeforeZoom = (x - mapState.offsetX) / mapState.scale
    const pointYBeforeZoom = (y - mapState.offsetY) / mapState.scale

    // Calculate the point under the mouse after zoom
    const pointXAfterZoom = (x - mapState.offsetX) / newScale
    const pointYAfterZoom = (y - mapState.offsetY) / newScale

    // Calculate the new offset to keep the same point under the mouse
    const newOffsetX = mapState.offsetX + (pointXAfterZoom - pointXBeforeZoom) * newScale
    const newOffsetY = mapState.offsetY + (pointYAfterZoom - pointYBeforeZoom) * newScale

    setMapState(prev => ({
      ...prev,
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    }))
  }, [mapState.scale, mapState.offsetX, mapState.offsetY])

  const setImageOpacity = useCallback((opacity: number) => {
    setMapState(prev => ({ ...prev, imageOpacity: Math.max(0, Math.min(1, opacity)) }))
  }, [])

  return {
    mapState,
    setImage,
    setTerrainImage,
    setBiomeImage,
    setScale,
    setOffset,
    setOrigin,
    setOriginSelected,
    setOriginOffset,
    startDragging,
    stopDragging,
    handleMouseMove,
    handleWheel,
    setImageOpacity,
    setTerrainOpacity,
    setBiomeOpacity,
    setTerrainVisible,
    setBiomeVisible
  }
}
