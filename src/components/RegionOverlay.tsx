import { useEffect, useRef } from 'react'
import { MapState, Region, EditMode, HighlightMode, Subregion, WorldCoordinate, ChallengeLevel } from '../types'
import { worldToPixel, imageToCanvas, canvasToImage, pixelToWorld } from '../utils/coordinateUtils'
import { getEffectiveMapImage } from '../utils/mapStateUtils'
import { scanBiomesWithCentroids } from '../utils/biomeScanner'

/** Max chars per line for biome labels (e.g. "Old Growth" / "Birch Forest"). */
const BIOME_LABEL_MAX_CHARS = 11

/** Wraps a long biome name into multiple lines of ~10-12 chars. */
function wrapBiomeLabel(text: string): string[] {
  const words = text.split(' ')
  if (words.length <= 1) return [text]

  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= BIOME_LABEL_MAX_CHARS) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

const CHALLENGE_LEVEL_COLORS: Record<ChallengeLevel, { fill: string; stroke: string }> = {
  easy: { fill: 'rgba(34, 139, 34, 0.7)', stroke: 'rgba(34, 139, 34, 0.9)' }, // Forest Green
  normal: { fill: 'rgba(255, 140, 0, 0.7)', stroke: 'rgba(255, 140, 0, 0.9)' }, // Dark Orange
  hard: { fill: 'rgba(255, 69, 0, 0.7)', stroke: 'rgba(255, 69, 0, 0.9)' }, // Red Orange
  severe: { fill: 'rgba(200, 0, 0, 0.7)', stroke: 'rgba(200, 0, 0, 0.9)' }, // Pure Red
  deadly: { fill: 'rgba(80, 0, 0, 0.7)', stroke: 'rgba(80, 0, 0, 0.9)' } // Very Dark Red
}

interface RegionOverlayProps {
  canvas: HTMLCanvasElement | null
  mapState: MapState
  drawingRegion: Region | null
  selectedRegionId: string | null
  hoveredRegionId: string | null
  editMode: EditMode
  highlightMode: HighlightMode
  regions?: Region[]
  spawnCoordinates?: WorldCoordinate | null
  isSpacePressed?: boolean
  onPointMouseDown?: (regionId: string, pointIndex: number, event: React.MouseEvent) => void
  onPointMouseMove?: (regionId: string, pointIndex: number, x: number, z: number) => void
  onPointMouseUp?: () => void
  onInsertPointClick?: (regionId: string, pointIndex: number, x: number, z: number) => void
  onPointDoubleClick?: (regionId: string, pointIndex: number) => void
  isWarping?: boolean
  warpRadius?: number
  mouseCoordinates?: { x: number; z: number } | null
  isMouseOverCanvas?: boolean
  isolatedMode?: boolean
  hiddenBiomeLabels?: Set<string>
  showBiomeLabels?: boolean
  regionFillOpacity?: number
}

export function RegionOverlay({ 
  canvas, 
  mapState, 
  drawingRegion, 
  selectedRegionId,
  hoveredRegionId,
  editMode,
  highlightMode,
  regions = [],
  spawnCoordinates,
  isSpacePressed = false,
  onPointMouseDown,
  onPointMouseMove,
  onPointMouseUp,
  onInsertPointClick,
  onPointDoubleClick,
  isWarping = false,
  warpRadius = 40,
  mouseCoordinates = null,
  isMouseOverCanvas = false,
  isolatedMode = false,
  hiddenBiomeLabels,
  showBiomeLabels = false,
  regionFillOpacity = 0.2
}: RegionOverlayProps) {
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

    // Draw villages first (so they appear behind region labels)
    if (highlightMode.showVillages) {
      regions.forEach(region => {
        if (region.subregions) {
          region.subregions.forEach(subregion => {
            drawVillage(ctx, subregion, mapState, img, region.id === selectedRegionId, highlightMode.showNames)
          })
        }
      })
    }

    // Draw all regions (with labels on top) - skip boundaries when isolated, but keep label
    if (!isolatedMode) {
      regions.forEach(region => {
        const isSelected = region.id === selectedRegionId
        const isHovered = region.id === hoveredRegionId
        const isEditing = editMode.isEditing && editMode.editingRegionId === region.id
        const isMoving = editMode.isMovingRegion && editMode.movingRegionId === region.id
        const isSplitting = editMode.isSplittingRegion && editMode.splittingRegionId === region.id
        const isHighlighted = highlightMode.highlightAll
        const showChallengeLevels = highlightMode.showChallengeLevels
        const isDisabled = region.disabled === true
        drawRegion(ctx, region, mapState, img, isSelected, false, isEditing, isHighlighted, showChallengeLevels, isMoving, isHovered, isDisabled, highlightMode.showNames, regionFillOpacity)
        
        if (highlightMode.showCenterPoints) {
          drawCenterPoint(ctx, region, mapState, img, isSelected)
        }

        if (isSplitting) {
          drawSplitPoints(ctx, mapState, img, editMode.splitPoints)
        }
      })
    } else if (highlightMode.showNames && regions.length > 0) {
      regions.forEach(region => {
        if (region.points.length < 2) return
        const canvasPoints = region.points.map(point => {
          const pixelPos = worldToPixel(point.x, point.z, img.width, img.height, mapState.originOffset)
          return imageToCanvas(pixelPos.x, pixelPos.y, mapState.scale, mapState.offsetX, mapState.offsetY)
        })
        const labelPos = region.labelPosition
          ? (() => {
              const pixelPos = worldToPixel(region.labelPosition.x, region.labelPosition.z, img.width, img.height, mapState.originOffset)
              return imageToCanvas(pixelPos.x, pixelPos.y, mapState.scale, mapState.offsetX, mapState.offsetY)
            })()
          : null
        const centerX = labelPos?.x ?? canvasPoints.reduce((sum, p) => sum + p.x, 0) / canvasPoints.length
        const centerY = labelPos?.y ?? canvasPoints.reduce((sum, p) => sum + p.y, 0) / canvasPoints.length
        ctx.font = '14px "Source Sans 3", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
        ctx.shadowBlur = 10
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 2
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)'
        ctx.lineWidth = 2
        ctx.strokeText(region.name, centerX, centerY)
        ctx.fillStyle = 'white'
        ctx.fillText(region.name, centerX, centerY)
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
      })

    }

    if (isolatedMode && showBiomeLabels && regions.length > 0) {
      const biomeImage = mapState.biomeImage ?? mapState.terrainImage
      const region = regions[0]
      if (biomeImage && mapState.originOffset && region.points.length >= 3) {
        const biomeBreakdown = scanBiomesWithCentroids(region, biomeImage, mapState.originOffset)
        if (biomeBreakdown) {
          biomeBreakdown.forEach(({ biome, centroid }) => {
              if (hiddenBiomeLabels?.has(biome)) return
              const pixelPos = worldToPixel(centroid.x, centroid.z, img.width, img.height, mapState.originOffset)
              const canvasPos = imageToCanvas(pixelPos.x, pixelPos.y, mapState.scale, mapState.offsetX, mapState.offsetY)
              ctx.font = '11px sans-serif'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)'
              ctx.lineWidth = 2
              const lines = wrapBiomeLabel(biome)
              const lineHeight = 13
              const totalHeight = (lines.length - 1) * lineHeight
              let y = canvasPos.y - totalHeight / 2
              for (const line of lines) {
                ctx.strokeText(line, canvasPos.x, y)
                ctx.fillStyle = 'white'
                ctx.fillText(line, canvasPos.x, y)
                y += lineHeight
              }
            })
        }
      }
    }

    // Draw drawing region
    if (drawingRegion && drawingRegion.points.length > 0) {
      drawRegion(ctx, drawingRegion, mapState, img, false, true, false, false, false, false, false, false, highlightMode.showNames, regionFillOpacity)
      if (highlightMode.showCenterPoints) {
        drawCenterPoint(ctx, drawingRegion, mapState, img, false)
      }
    }

    if (spawnCoordinates) {
      drawSpawnPoint(ctx, spawnCoordinates, mapState, img)
    }

    if (isWarping && mouseCoordinates && isMouseOverCanvas) {
      drawWarpBrush(ctx, mouseCoordinates, mapState, img, warpRadius)
    }

  }, [canvas, mapState, img, drawingRegion, selectedRegionId, hoveredRegionId, editMode, highlightMode, regions, spawnCoordinates, isWarping, warpRadius, mouseCoordinates, isMouseOverCanvas, isolatedMode, hiddenBiomeLabels, showBiomeLabels, regionFillOpacity])

  const drawRegion = (
    ctx: CanvasRenderingContext2D, 
    region: Region, 
    mapState: MapState,
    img: HTMLImageElement,
    isSelected: boolean = false,
    isDrawing: boolean = false,
    isEditing: boolean = false,
    isHighlighted: boolean = false,
    showChallengeLevels: boolean = false,
    isMoving: boolean = false,
    isHovered: boolean = false,
    isDisabled: boolean = false,
    showNames: boolean = true,
    fillOpacity: number = 0.2
  ) => {
    if (region.points.length < 2) return

    // Convert world coordinates to canvas coordinates
    const canvasPoints = region.points.map(point => {
      const pixelPos = worldToPixel(point.x, point.z, img.width, img.height, mapState.originOffset)
      return imageToCanvas(pixelPos.x, pixelPos.y, mapState.scale, mapState.offsetX, mapState.offsetY)
    })

    // Draw polygon fill (fillOpacity 0 = transparent, 1 = fully opaque)
    let fillColor: string
    if (isMoving) {
      fillColor = `rgba(255, 165, 0, ${fillOpacity})` // Orange for moving regions
    } else if (isSelected) {
      fillColor = `rgba(0, 255, 0, ${fillOpacity})`
    } else if (isDrawing) {
      fillColor = `rgba(255, 255, 0, ${fillOpacity})`
    } else if (isHighlighted) {
      fillColor = `rgba(255, 255, 0, ${fillOpacity})`
    } else if (isHovered) {
      fillColor = `rgba(0, 255, 255, ${fillOpacity})` // Cyan highlight for hovered regions
    } else if (showChallengeLevels && !isDisabled) {
      const challengeLevel = region.challengeLevel || 'easy'
      const base = CHALLENGE_LEVEL_COLORS[challengeLevel].fill
      const match = base.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      fillColor = match ? `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${fillOpacity})` : base
    } else {
      fillColor = `rgba(0, 100, 255, ${fillOpacity})`
    }
    ctx.fillStyle = fillColor
    
    ctx.beginPath()
    ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y)
    for (let i = 1; i < canvasPoints.length; i++) {
      ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y)
    }
    ctx.closePath()
    ctx.fill()

    // Draw polygon outline
    let strokeColor: string
    if (isMoving) {
      strokeColor = 'rgba(255, 165, 0, 1)' // Orange outline for moving regions
    } else if (isSelected) {
      strokeColor = 'rgba(0, 255, 0, 0.8)'
    } else if (isDrawing) {
      strokeColor = 'rgba(0, 0, 0, 1)'
    } else if (isHighlighted) {
      strokeColor = 'rgba(0, 0, 0, 1)'
    } else if (isHovered) {
      strokeColor = 'rgba(0, 0, 0, 1)'
    } else if (showChallengeLevels && !isDisabled) {
      strokeColor = 'rgba(0, 0, 0, 1)'
    } else {
      strokeColor = 'rgba(0, 0, 0, 1)'
    }
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = isMoving ? 4 : isSelected ? 3 : isHighlighted ? 4 : isHovered ? 3 : 2
    
    // Use dashed line for disabled regions
    if (isDisabled) {
      ctx.setLineDash([5, 5])
    } else {
      ctx.setLineDash([])
    }
    
    ctx.beginPath()
    ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y)
    for (let i = 1; i < canvasPoints.length; i++) {
      ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y)
    }
    if (!isDrawing) {
      ctx.closePath()
    }
    ctx.stroke()
    
    // Reset line dash
    ctx.setLineDash([])

    // Draw points only when region is selected or being edited
    if (isSelected || isEditing || isDrawing) {
      canvasPoints.forEach((point, index) => {
        const isDragging = editMode.draggingPointIndex === index && editMode.editingRegionId === region.id
        const pointSize = isEditing ? 8 : 4
        
        // Draw point background (white circle)
        if (isEditing) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.beginPath()
          ctx.arc(point.x, point.y, pointSize + 2, 0, 2 * Math.PI)
          ctx.fill()
        }
        
        // Draw point
        ctx.fillStyle = isSelected 
          ? 'rgba(0, 255, 0, 1)' 
          : isDrawing 
            ? 'rgba(255, 255, 0, 1)'
            : isEditing
              ? 'rgba(255, 100, 0, 1)'
              : isHighlighted
                ? 'rgba(255, 255, 0, 1)'
                : 'rgba(0, 100, 255, 1)'
        
        ctx.beginPath()
        ctx.arc(point.x, point.y, pointSize, 0, 2 * Math.PI)
        ctx.fill()

        // Draw point border for editing mode
        if (isEditing) {
          ctx.strokeStyle = isDragging ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 0.8)'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      })
    }

    // Draw insertion points between existing points when in edit mode
    if (isEditing && canvasPoints.length >= 2) {
      ctx.fillStyle = 'rgba(0, 255, 255, 0.8)'
      ctx.strokeStyle = 'rgba(0, 255, 255, 1)'
      ctx.lineWidth = 1
      
      for (let i = 0; i < canvasPoints.length; i++) {
        const currentPoint = canvasPoints[i]
        const nextPoint = canvasPoints[(i + 1) % canvasPoints.length]
        
        // Calculate midpoint between current and next point
        const midX = (currentPoint.x + nextPoint.x) / 2
        const midY = (currentPoint.y + nextPoint.y) / 2
        
        // Draw insertion point
        ctx.beginPath()
        ctx.arc(midX, midY, 4, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
      }
    }

    // Draw region name
    if (showNames && canvasPoints.length > 0) {
      const labelPos = region.labelPosition
        ? (() => {
            const pixelPos = worldToPixel(region.labelPosition!.x, region.labelPosition!.z, img.width, img.height, mapState.originOffset)
            return imageToCanvas(pixelPos.x, pixelPos.y, mapState.scale, mapState.offsetX, mapState.offsetY)
          })()
        : null
      const centerX = labelPos?.x ?? canvasPoints.reduce((sum, p) => sum + p.x, 0) / canvasPoints.length
      const centerY = labelPos?.y ?? canvasPoints.reduce((sum, p) => sum + p.y, 0) / canvasPoints.length
      
      ctx.font = '14px "Source Sans 3", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 2
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)'
      ctx.lineWidth = 2
      ctx.strokeText(region.name, centerX, centerY)
      ctx.fillStyle = 'white'
      ctx.fillText(region.name, centerX, centerY)
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }
  }

  const drawCenterPoint = (
    ctx: CanvasRenderingContext2D,
    region: Region,
    mapState: MapState,
    img: HTMLImageElement,
    isSelected: boolean = false
  ) => {
    if (!region.centerPoint) return

    const pixelPos = worldToPixel(region.centerPoint.x, region.centerPoint.z, img.width, img.height, mapState.originOffset)
    const canvasPos = imageToCanvas(pixelPos.x, pixelPos.y, mapState.scale, mapState.offsetX, mapState.offsetY)

    // Draw center point marker (smaller size)
    const markerSize = isSelected ? 6 : 4
    
    // Draw outer ring (white background)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.beginPath()
    ctx.arc(canvasPos.x, canvasPos.y, markerSize + 1, 0, 2 * Math.PI)
    ctx.fill()
    
    // Draw center point (purple for custom center points)
    ctx.fillStyle = 'rgba(255, 0, 255, 1)'
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.lineWidth = 1
    
    ctx.beginPath()
    ctx.arc(canvasPos.x, canvasPos.y, markerSize, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()

    // Draw center point label only for selected regions
    if (isSelected) {
      ctx.font = '9px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const textMetrics = ctx.measureText('Region Heart')
      const textWidth = textMetrics.width
      const padding = 6
      const boxWidth = textWidth + padding * 2
      const boxHeight = 16
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(canvasPos.x - boxWidth / 2, canvasPos.y - markerSize - 20, boxWidth, boxHeight)
      
      ctx.fillStyle = 'white'
      ctx.fillText('Region Heart', canvasPos.x, canvasPos.y - markerSize - 12)
    }
  }

  const drawVillage = (
    ctx: CanvasRenderingContext2D,
    subregion: Subregion,
    mapState: MapState,
    img: HTMLImageElement,
    isParentSelected: boolean = false,
    showNames: boolean = true
  ) => {
    const pixelPos = worldToPixel(subregion.x, subregion.z, img.width, img.height, mapState.originOffset)
    const canvasPos = imageToCanvas(pixelPos.x, pixelPos.y, mapState.scale, mapState.offsetX, mapState.offsetY)
    
    // Draw village center point
    ctx.fillStyle = isParentSelected 
      ? 'rgba(255, 255, 255, 1)' // White center
      : 'rgba(255, 255, 255, 0.8)' // White center
    
    ctx.strokeStyle = isParentSelected 
      ? 'rgba(0, 0, 0, 1)' // Black border
      : 'rgba(0, 0, 0, 0.8)' // Black border
    
    ctx.lineWidth = 2
    
    // Draw village marker (small circle)
    ctx.beginPath()
    ctx.arc(canvasPos.x, canvasPos.y, 6, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
    
    // Draw village name
    if (showNames && isParentSelected) {
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const textMetrics = ctx.measureText(subregion.name)
      const textWidth = textMetrics.width
      const padding = 6
      const boxWidth = textWidth + padding * 2
      const boxHeight = 20
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(canvasPos.x - boxWidth / 2, canvasPos.y - 25, boxWidth, boxHeight)
      
      ctx.fillStyle = 'white'
      ctx.fillText(subregion.name, canvasPos.x, canvasPos.y - 15)
    }
  }

  const drawSpawnPoint = (
    ctx: CanvasRenderingContext2D,
    spawnCoordinates: WorldCoordinate,
    mapState: MapState,
    img: HTMLImageElement
  ) => {
    const pixelPos = worldToPixel(spawnCoordinates.x, spawnCoordinates.z, img.width, img.height, mapState.originOffset)
    const canvasPos = imageToCanvas(pixelPos.x, pixelPos.y, mapState.scale, mapState.offsetX, mapState.offsetY)

    ctx.fillStyle = 'rgba(255, 0, 0, 1)' // Red spawn point
    ctx.strokeStyle = 'rgba(0, 0, 0, 1)' // Black border
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.arc(canvasPos.x, canvasPos.y, 8, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Spawn', canvasPos.x, canvasPos.y + 10)
  }

  const drawWarpBrush = (
    ctx: CanvasRenderingContext2D,
    mouseCoordinates: { x: number; z: number },
    mapState: MapState,
    img: HTMLImageElement,
    radius: number
  ) => {
    const pixelPos = worldToPixel(mouseCoordinates.x, mouseCoordinates.z, img.width, img.height, mapState.originOffset)
    const canvasPos = imageToCanvas(pixelPos.x, pixelPos.y, mapState.scale, mapState.offsetX, mapState.offsetY)

    // Convert radius from world coordinates to canvas pixels
    // Reduce visual radius by 90% (0.125 * 0.9) to better match actual effect
    const canvasRadius = (radius * 0.1125) * mapState.scale

    // Draw a semi-transparent circle
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.8)' // Purple color
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.arc(canvasPos.x, canvasPos.y, canvasRadius, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.setLineDash([])
  }

  const drawSplitPoints = (
    ctx: CanvasRenderingContext2D,
    mapState: MapState,
    img: HTMLImageElement,
    splitPoints: { x: number; z: number }[]
  ) => {
    if (splitPoints.length === 0) return

    splitPoints.forEach((point, index) => {
      const pixelPos = worldToPixel(point.x, point.z, img.width, img.height, mapState.originOffset)
      const canvasPos = imageToCanvas(pixelPos.x, pixelPos.y, mapState.scale, mapState.offsetX, mapState.offsetY)
      
      // Draw split point
      ctx.fillStyle = 'rgba(255, 0, 255, 0.8)'
      ctx.strokeStyle = 'rgba(255, 0, 255, 1)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(canvasPos.x, canvasPos.y, 6, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
      
      // Draw point number
      ctx.fillStyle = 'rgba(255, 0, 255, 1)'
      ctx.font = 'bold 10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText((index + 1).toString(), canvasPos.x, canvasPos.y + 3)
    })

    // Draw split line if we have 2 points
    if (splitPoints.length === 2) {
      const pixelPos1 = worldToPixel(splitPoints[0].x, splitPoints[0].z, img.width, img.height, mapState.originOffset)
      const pixelPos2 = worldToPixel(splitPoints[1].x, splitPoints[1].z, img.width, img.height, mapState.originOffset)
      const canvasPos1 = imageToCanvas(pixelPos1.x, pixelPos1.y, mapState.scale, mapState.offsetX, mapState.offsetY)
      const canvasPos2 = imageToCanvas(pixelPos2.x, pixelPos2.y, mapState.scale, mapState.offsetX, mapState.offsetY)
      
      // Draw split line
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.8)'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(canvasPos1.x, canvasPos1.y)
      ctx.lineTo(canvasPos2.x, canvasPos2.y)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onPointMouseDown || !editMode.isEditing || !editMode.editingRegionId) return

    const canvas = overlayRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if clicking on a point
    const editingRegion = regions.find(r => r.id === editMode.editingRegionId)
    if (!editingRegion) return

    const canvasPoints = editingRegion.points.map(point => {
      const pixelPos = worldToPixel(point.x, point.z, img.width, img.height, mapState.originOffset)
      return imageToCanvas(pixelPos.x, pixelPos.y, mapState.scale, mapState.offsetX, mapState.offsetY)
    })

    // Check each point for click
    for (let i = 0; i < canvasPoints.length; i++) {
      const point = canvasPoints[i]
      const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2))
      const clickRadius = 12 // Larger click area for editing

      if (distance <= clickRadius) {
        onPointMouseDown(editingRegion.id, i, e)
        return
      }
    }

    // Check insertion points if we have the callback
    if (onInsertPointClick && canvasPoints.length >= 2) {
      for (let i = 0; i < canvasPoints.length; i++) {
        const currentPoint = canvasPoints[i]
        const nextPoint = canvasPoints[(i + 1) % canvasPoints.length]
        
        // Calculate midpoint between current and next point
        const midX = (currentPoint.x + nextPoint.x) / 2
        const midY = (currentPoint.y + nextPoint.y) / 2
        
        const distance = Math.sqrt(Math.pow(x - midX, 2) + Math.pow(y - midY, 2))
        const clickRadius = 8 // Click area for insertion points
        
        if (distance <= clickRadius) {
          // Convert canvas coordinates to world coordinates
          const imagePos = canvasToImage(midX, midY, mapState.scale, mapState.offsetX, mapState.offsetY)
          const worldPos = pixelToWorld(imagePos.x, imagePos.y, img.width, img.height, mapState.originOffset)
          
          // Insert point after the current point
          const insertIndex = (i + 1) % canvasPoints.length
          onInsertPointClick(editingRegion.id, insertIndex, worldPos.x, worldPos.z)
          return
        }
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onPointMouseMove || !editMode.isEditing || !editMode.editingRegionId || editMode.draggingPointIndex === null) return

    const canvas = overlayRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert canvas coordinates to world coordinates
    const imagePos = canvasToImage(x, y, mapState.scale, mapState.offsetX, mapState.offsetY)
    const worldPos = pixelToWorld(imagePos.x, imagePos.y, img.width, img.height, mapState.originOffset)

    onPointMouseMove(editMode.editingRegionId, editMode.draggingPointIndex, worldPos.x, worldPos.z)
  }

  const handleMouseUp = () => {
    if (onPointMouseUp) {
      onPointMouseUp()
    }
  }

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onPointDoubleClick || !editMode.isEditing || !editMode.editingRegionId) return

    const canvas = overlayRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if double-clicking on a point
    const editingRegion = regions.find(r => r.id === editMode.editingRegionId)
    if (!editingRegion) return

    const canvasPoints = editingRegion.points.map(point => {
      const pixelPos = worldToPixel(point.x, point.z, img.width, img.height, mapState.originOffset)
      return imageToCanvas(pixelPos.x, pixelPos.y, mapState.scale, mapState.offsetX, mapState.offsetY)
    })

    for (let i = 0; i < canvasPoints.length; i++) {
      const point = canvasPoints[i]
      const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2))
      const clickRadius = 12 // Click area for points

      if (distance <= clickRadius) {
        onPointDoubleClick(editingRegion.id, i)
        return
      }
    }
  }

  if (!canvas || !img) return null

  return (
    <canvas
      ref={overlayRef}
      className={`absolute top-0 left-0 ${editMode.isEditing && !isSpacePressed ? 'pointer-events-auto cursor-grab' : 'pointer-events-none'}`}
      style={{ width: canvas.width, height: canvas.height }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onWheel={(e) => {
        // Allow wheel events to pass through to the main canvas for zooming
        e.stopPropagation()
        const mainCanvas = canvas
        if (mainCanvas) {
          const wheelEvent = new WheelEvent('wheel', {
            deltaY: e.deltaY,
            clientX: e.clientX,
            clientY: e.clientY,
            bubbles: true
          })
          mainCanvas.dispatchEvent(wheelEvent)
        }
      }}
    />
  )
}
