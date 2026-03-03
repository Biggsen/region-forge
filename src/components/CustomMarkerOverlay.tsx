import { useEffect, useRef } from 'react'
import { MapState, CustomMarker } from '../types'
import { worldToPixel, imageToCanvas } from '../utils/coordinateUtils'
import { getEffectiveMapImage } from '../utils/mapStateUtils'

interface CustomMarkerOverlayProps {
  canvas: HTMLCanvasElement | null
  mapState: MapState
  customMarker: CustomMarker | null
  orphanedVillageMarkers: CustomMarker[]
  showOrphanedVillages: boolean
}

export function CustomMarkerOverlay({ canvas, mapState, customMarker, orphanedVillageMarkers, showOrphanedVillages }: CustomMarkerOverlayProps) {
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const img = getEffectiveMapImage(mapState)

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay || !canvas || !img) return

    overlay.width = canvas.width
    overlay.height = canvas.height

    const ctx = overlay.getContext('2d')
    if (!ctx) return

    // Clear overlay
    ctx.clearRect(0, 0, overlay.width, overlay.height)

    if (customMarker) {
      drawCustomMarker(ctx, customMarker, mapState, img)
    }

    if (showOrphanedVillages && orphanedVillageMarkers.length > 0) {
      orphanedVillageMarkers.forEach(marker => {
        drawOrphanedVillageMarker(ctx, marker, mapState, img)
      })
    }
  }, [canvas, mapState, img, customMarker, orphanedVillageMarkers, showOrphanedVillages])

  const drawCustomMarker = (
    ctx: CanvasRenderingContext2D,
    marker: CustomMarker,
    mapState: MapState,
    img: HTMLImageElement
  ) => {
    const pixelPos = worldToPixel(marker.coordinates.x, marker.coordinates.z, img.width, img.height, mapState.originOffset)
    const canvasPos = imageToCanvas(pixelPos.x, pixelPos.y, mapState.scale, mapState.offsetX, mapState.offsetY)

    // Draw red dot marker
    const markerSize = 8
    
    // Draw outer ring (white background for visibility)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.beginPath()
    ctx.arc(canvasPos.x, canvasPos.y, markerSize + 2, 0, 2 * Math.PI)
    ctx.fill()
    
    // Draw red dot
    ctx.fillStyle = 'rgba(255, 0, 0, 1)'
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.arc(canvasPos.x, canvasPos.y, markerSize, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()

    // Draw coordinates label
    const labelText = `X: ${marker.coordinates.x}, Z: ${marker.coordinates.z}`
    const labelWidth = ctx.measureText(labelText).width + 8
    const labelHeight = 16
    
    // Draw label background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(canvasPos.x - labelWidth/2, canvasPos.y - markerSize - labelHeight - 4, labelWidth, labelHeight)
    
    // Draw label text
    ctx.fillStyle = 'white'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(labelText, canvasPos.x, canvasPos.y - markerSize - labelHeight/2 - 4)
  }

  const drawOrphanedVillageMarker = (
    ctx: CanvasRenderingContext2D,
    marker: CustomMarker,
    mapState: MapState,
    img: HTMLImageElement
  ) => {
    const pixelPos = worldToPixel(marker.coordinates.x, marker.coordinates.z, img.width, img.height, mapState.originOffset)
    const canvasPos = imageToCanvas(pixelPos.x, pixelPos.y, mapState.scale, mapState.offsetX, mapState.offsetY)

    // Draw red dot marker for orphaned villages (not in any region)
    const markerSize = 8
    
    // Draw outer ring (white background for visibility)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.beginPath()
    ctx.arc(canvasPos.x, canvasPos.y, markerSize + 2, 0, 2 * Math.PI)
    ctx.fill()
    
    // Draw red dot for orphaned villages
    ctx.fillStyle = 'rgba(255, 0, 0, 1)'
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.arc(canvasPos.x, canvasPos.y, markerSize, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()

    // Draw village type label
    const labelText = `${marker.villageType} (${marker.coordinates.x}, ${marker.coordinates.z})`
    const labelWidth = ctx.measureText(labelText).width + 8
    const labelHeight = 16
    
    // Draw label background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(canvasPos.x - labelWidth/2, canvasPos.y - markerSize - labelHeight - 4, labelWidth, labelHeight)
    
    // Draw label text
    ctx.fillStyle = 'white'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(labelText, canvasPos.x, canvasPos.y - markerSize - labelHeight/2 - 4)
  }

  return (
    <canvas
      ref={overlayRef}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ zIndex: 5 }}
    />
  )
}
