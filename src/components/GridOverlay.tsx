import { useEffect, useRef } from 'react'
import { MapState, Region } from '../types'
import { worldToPixel, imageToCanvas } from '../utils/coordinateUtils'
import { getEffectiveMapImage } from '../utils/mapStateUtils'

interface GridOverlayProps {
  canvas: HTMLCanvasElement | null
  mapState: MapState
  isVisible: boolean
  clipRegion?: Region | null
}

export function GridOverlay({ canvas, mapState, isVisible, clipRegion }: GridOverlayProps) {
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const img = getEffectiveMapImage(mapState)

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay || !canvas || !img || !mapState.originSelected || !isVisible) return

    overlay.width = canvas.width
    overlay.height = canvas.height

    const ctx = overlay.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, overlay.width, overlay.height)

    if (clipRegion && clipRegion.points.length >= 3 && mapState.originOffset) {
      ctx.save()
      ctx.beginPath()
      const canvasPoints = clipRegion.points.map(point => {
        const pixelPos = worldToPixel(point.x, point.z, img.width, img.height, mapState.originOffset)
        return imageToCanvas(pixelPos.x, pixelPos.y, mapState.scale, mapState.offsetX, mapState.offsetY)
      })
      ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y)
      for (let i = 1; i < canvasPoints.length; i++) {
        ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y)
      }
      ctx.closePath()
      ctx.clip()
    }

    // Draw chunk grid (16x16 blocks)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1

    const imageWidth = img.width
    const imageHeight = img.height

    // Calculate pixels per block based on image size
    // mcseedmap shows 8x8 chunks, each chunk is 16 blocks, so 128 blocks total
    // Each block = imageSize / 128
    const pixelsPerBlock = imageWidth / 128
    const blockSize = pixelsPerBlock

    // Calculate grid bounds relative to origin (if set) or image center
    let startX, endX, startZ, endZ
    if (mapState.originOffset) {
      // Use origin as reference point - ensure origin aligns with grid intersection
      const originX = mapState.originOffset.x
      const originZ = mapState.originOffset.y
      // Grid extends from -4000 to +4000 blocks (8000 blocks total = 64 chunks)
      // In pixels: 8000 * pixelsPerBlock
      const gridRadiusInPixels = 4000 * pixelsPerBlock
      // Align grid so origin is at a grid intersection
      startX = originX - Math.floor(gridRadiusInPixels / blockSize) * blockSize
      endX = originX + Math.ceil(gridRadiusInPixels / blockSize) * blockSize
      startZ = originZ - Math.floor(gridRadiusInPixels / blockSize) * blockSize
      endZ = originZ + Math.ceil(gridRadiusInPixels / blockSize) * blockSize
    } else {
      // Fallback to image center
      startX = Math.floor(-imageWidth / 2 / blockSize) * blockSize
      endX = Math.ceil(imageWidth / 2 / blockSize) * blockSize
      startZ = Math.floor(-imageHeight / 2 / blockSize) * blockSize
      endZ = Math.ceil(imageHeight / 2 / blockSize) * blockSize
    }

    // Draw vertical lines using raw pixel coordinates
    for (let x = startX; x <= endX; x += blockSize) {
      const pixelX = x
      const canvasPos = imageToCanvas(pixelX, 0, mapState.scale, mapState.offsetX, mapState.offsetY)
      
      ctx.beginPath()
      ctx.moveTo(canvasPos.x, 0)
      ctx.lineTo(canvasPos.x, overlay.height)
      ctx.stroke()
    }

    // Draw horizontal lines using raw pixel coordinates
    for (let z = startZ; z <= endZ; z += blockSize) {
      const pixelY = z
      const canvasPos = imageToCanvas(0, pixelY, mapState.scale, mapState.offsetX, mapState.offsetY)
      
      ctx.beginPath()
      ctx.moveTo(0, canvasPos.y)
      ctx.lineTo(overlay.width, canvasPos.y)
      ctx.stroke()
    }

    // Draw origin lines (thicker)
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'
    ctx.lineWidth = 2

    // Use the actual origin offset (where user clicked) for origin lines
    if (mapState.originOffset) {
      const originCanvas = imageToCanvas(mapState.originOffset.x, mapState.originOffset.y, mapState.scale, mapState.offsetX, mapState.offsetY)
      
      ctx.beginPath()
      ctx.moveTo(originCanvas.x, 0)
      ctx.lineTo(originCanvas.x, overlay.height)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, originCanvas.y)
      ctx.lineTo(overlay.width, originCanvas.y)
      ctx.stroke()
    }

    if (clipRegion) {
      ctx.restore()
    }
  }, [canvas, mapState, img, isVisible, clipRegion])

  if (!isVisible) return null

  if (!canvas || !img || !mapState.originSelected) return null

  return (
    <canvas
      ref={overlayRef}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: canvas.width, height: canvas.height }}
    />
  )
}
