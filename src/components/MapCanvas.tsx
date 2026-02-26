import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { canvasToImage, pixelToWorld, worldToPixel, imageToCanvas, isPointInPolygon } from '../utils/coordinateUtils'
import { SIDEBAR_WIDTH } from '../utils/constants'
import { getEffectiveMapImage } from '../utils/mapStateUtils'
import { GridOverlay } from './GridOverlay'
import { RegionOverlay } from './RegionOverlay'
import { CustomMarkerOverlay } from './CustomMarkerOverlay'
import { CoordinateInputDialog } from './CoordinateInputDialog'
import { MapDisplayControls } from './MapDisplayControls'
import { Scan, Eye, EyeOff } from 'lucide-react'

interface MapCanvasProps {
  onNavigateToRegions?: () => void
}

export function MapCanvas({ onNavigateToRegions }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const showAdvanced = new URLSearchParams(window.location.search).get('advanced') === 'true'
  const { mapState: mapStateHook, regions, spawn, mapCanvas, customMarkers, worldName, seedInfo, biomeLabelVisibility } = useAppContext()
  const { mapState, setScale, setOffset, setOrigin, startDragging, stopDragging, handleMouseMove, handleWheel, setImageOpacity, setTerrainOpacity, setBiomeOpacity, setTerrainVisible, setBiomeVisible } = mapStateHook
  const effectiveImage = getEffectiveMapImage(mapState)
  const { 
    drawingRegion, 
    addPointToDrawing, 
    finishDrawingRegion, 
    selectedRegionId,
    editMode,
    highlightMode,
    isolatedRegionId,
    startDraggingPoint,
    stopDraggingPoint,
    updatePointPosition,
    addPointToRegion,
    removePointFromRegion,
    updateMoveRegion,
    moveRegionToPosition,
    finishMoveRegion,
    warpRegion,
    addSplitPoint
  } = regions
  const { spawnState, setSpawnCoordinates } = spawn
  const { isSettingCenterPoint, centerPointRegionId, stopSettingCenterPoint, isWarping, warpRadius, warpStrength } = mapCanvas
  const { customMarker, setMarker, orphanedVillageMarkers, showOrphanedVillages } = customMarkers
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [mouseCoordinates, setMouseCoordinates] = useState<{ x: number; z: number } | null>(null)
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [isMovingRegion, setIsMovingRegion] = useState(false)
  const [isMouseOverCanvas, setIsMouseOverCanvas] = useState(false)
  const [isCoordinateDialogOpen, setIsCoordinateDialogOpen] = useState(false)
  const lastFreehandPointRef = useRef<{ x: number; z: number } | null>(null)

  const handleCoordinateSubmit = useCallback((coordinates: { x: number; z: number }) => {
    setMarker(coordinates)
  }, [setMarker])


  // Handle space key for panning mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed) {
        // Don't capture space if user is typing in an input field
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return
        }
        e.preventDefault()
        setIsSpacePressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isSpacePressed])

  // Determine cursor style based on current mode
  const getCursorStyle = () => {
    if (editMode.isSplittingRegion) {
      return 'cursor-scissors'
    }
    if (editMode.isMovingRegion) {
      return isMovingRegion ? 'cursor-grabbing' : 'cursor-grab'
    }
    if (editMode.isEditing) {
      return editMode.draggingPointIndex !== null ? 'cursor-grabbing' : 'cursor-grab'
    }
    if (mapState.isDragging && isSpacePressed) {
      return 'cursor-grabbing'
    }
    if (isSpacePressed) {
      return 'cursor-grab'
    }
    if (isSettingCenterPoint) {
      return 'cursor-crosshair'
    }
    if (spawnState.isPlacing) {
      return 'cursor-crosshair'
    }
    if (!mapState.originSelected && effectiveImage) {
      return 'cursor-crosshair'
    }
    if (drawingRegion) {
      return 'cursor-crosshair'
    }
    return 'cursor-default'
  }

  const drawMap = useCallback(() => {
    const canvas = canvasRef.current
    const img = getEffectiveMapImage(mapState)
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const drawLayers = () => {
      ctx.translate(mapState.offsetX, mapState.offsetY)
      ctx.scale(mapState.scale, mapState.scale)

      const hasDual = mapState.terrainImage && mapState.biomeImage
      if (hasDual) {
        if (mapState.terrainVisible && mapState.terrainImage) {
          ctx.globalAlpha = mapState.terrainOpacity * mapState.imageOpacity
          ctx.drawImage(mapState.terrainImage, 0, 0)
        }
        if (mapState.biomeVisible && mapState.biomeImage) {
          ctx.globalAlpha = mapState.biomeOpacity * mapState.imageOpacity
          ctx.drawImage(mapState.biomeImage, 0, 0)
        }
      } else {
        ctx.globalAlpha = mapState.imageOpacity
        ctx.drawImage(img, 0, 0)
      }
    }

    if (isolatedRegionId && mapState.originOffset) {
      const isolatedRegion = regions.regions.find(r => r.id === isolatedRegionId)
      if (isolatedRegion && isolatedRegion.points.length >= 3) {
        ctx.save()
        ctx.beginPath()
        const canvasPoints = isolatedRegion.points.map(point => {
          const pixelPos = worldToPixel(point.x, point.z, img.width, img.height, mapState.originOffset)
          return imageToCanvas(pixelPos.x, pixelPos.y, mapState.scale, mapState.offsetX, mapState.offsetY)
        })
        ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y)
        for (let i = 1; i < canvasPoints.length; i++) {
          ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y)
        }
        ctx.closePath()
        ctx.clip()
        ctx.save()
        drawLayers()
        ctx.restore()
        ctx.restore()
        return
      }
    }

    ctx.save()
    drawLayers()
    ctx.restore()
  }, [mapState, isolatedRegionId, regions.regions])

  useEffect(() => {
    if (effectiveImage) drawMap()
  }, [drawMap, effectiveImage])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (e.button === 0) { // Left click
      setIsMouseDown(true)
      
      if (isSpacePressed) {
        // Prioritize panning when space is pressed (even in edit mode)
        startDragging(x, y)
      } else if (editMode.isEditing) {
        // If in edit mode and space is not pressed, don't handle other interactions
        return
      } else if (!mapState.originSelected && effectiveImage) {
        const imagePos = canvasToImage(x, y, mapState.scale, mapState.offsetX, mapState.offsetY)
        setOrigin(imagePos.x, imagePos.y)
      } else if (spawnState.isPlacing && effectiveImage && mapState.originSelected) {
        const imagePos = canvasToImage(x, y, mapState.scale, mapState.offsetX, mapState.offsetY)
        const worldPos = pixelToWorld(imagePos.x, imagePos.y, effectiveImage.width, effectiveImage.height, mapState.originOffset)
        setSpawnCoordinates(worldPos)
      } else if (drawingRegion && effectiveImage) {
        const imagePos = canvasToImage(x, y, mapState.scale, mapState.offsetX, mapState.offsetY)
        const worldPos = pixelToWorld(imagePos.x, imagePos.y, effectiveImage.width, effectiveImage.height, mapState.originOffset)
        
        if (regions.freehandEnabled) {
          // Start freehand stroke
          addPointToDrawing(worldPos.x, worldPos.z)
          lastFreehandPointRef.current = worldPos
        } else {
          // Check if clicking near any previous point (within 20 pixels tolerance)
          // Convert pixel tolerance to world units (8 world units per image pixel)
          const tolerance = (20 / mapState.scale) * 8
          const isNearPreviousPoint = drawingRegion.points.some(point => {
            const distance = Math.sqrt(
              Math.pow(point.x - worldPos.x, 2) + Math.pow(point.z - worldPos.z, 2)
            )
            return distance <= tolerance
          })
          
          if (isNearPreviousPoint && drawingRegion.points.length >= 3) {
            // Close the polygon
            finishDrawingRegion()
          } else {
            // Add point to drawing region
            addPointToDrawing(worldPos.x, worldPos.z)
          }
        }
      } else if (isSettingCenterPoint && effectiveImage && mapState.originSelected) {
        const imagePos = canvasToImage(x, y, mapState.scale, mapState.offsetX, mapState.offsetY)
        const worldPos = pixelToWorld(imagePos.x, imagePos.y, effectiveImage.width, effectiveImage.height, mapState.originOffset)
        
        if (centerPointRegionId) {
          regions.setCustomCenterPoint(centerPointRegionId, worldPos)
          stopSettingCenterPoint()
        }
      } else if (editMode.isMovingRegion && effectiveImage && mapState.originSelected) {
        const imagePos = canvasToImage(x, y, mapState.scale, mapState.offsetX, mapState.offsetY)
        const worldPos = pixelToWorld(imagePos.x, imagePos.y, effectiveImage.width, effectiveImage.height, mapState.originOffset)
        
        if (editMode.movingRegionId) {
          const movingRegion = regions.regions.find(r => r.id === editMode.movingRegionId)
          // Start the drag - check current position, not original
          if (movingRegion && isPointInPolygon(worldPos, movingRegion.points)) {
            setIsMovingRegion(true)
          }
        }
      } else if (effectiveImage && mapState.originSelected) {
        const imagePos = canvasToImage(x, y, mapState.scale, mapState.offsetX, mapState.offsetY)
        const worldPos = pixelToWorld(imagePos.x, imagePos.y, effectiveImage.width, effectiveImage.height, mapState.originOffset)
        
        // Warp brush applies to selected region if enabled
        if (isWarping && regions.selectedRegionId) {
          warpRegion(regions.selectedRegionId, worldPos.x, worldPos.z, warpRadius, warpStrength)
          return
        }

        // Handle split point selection
        if (editMode.isSplittingRegion && editMode.splitPoints.length < 2) {
          addSplitPoint(worldPos.x, worldPos.z)
          return
        }

        // Check each region to see if the click is inside (only isolated region when in isolate mode)
        const regionsToCheck = isolatedRegionId
          ? regions.regions.filter(r => r.id === isolatedRegionId)
          : regions.regions
        for (let i = regionsToCheck.length - 1; i >= 0; i--) {
          const region = regionsToCheck[i]
          if (isPointInPolygon(worldPos, region.points)) {
            regions.setHoveredRegionId(null)
            regions.setSelectedRegionId(region.id)
            return
          }
        }

        // If no region was clicked, deselect (but keep selection when isolated - dark area isn't clickable)
        if (!isolatedRegionId) {
          regions.setHoveredRegionId(null)
          regions.setSelectedRegionId(null)
        }
      }
      // Note: Panning is only allowed when space key is pressed (handled in the first condition)
    }
  }, [mapState.originSelected, effectiveImage, mapState.scale, mapState.offsetX, mapState.offsetY, mapState.originOffset, drawingRegion, isSpacePressed, editMode.isEditing, editMode.isMovingRegion, editMode.movingRegionId, editMode.originalRegionPoints, setIsMovingRegion, setOrigin, addPointToDrawing, finishDrawingRegion, startDragging, regions, isolatedRegionId, spawnState.isPlacing, setSpawnCoordinates, isSettingCenterPoint, centerPointRegionId, stopSettingCenterPoint, isWarping, warpRadius, warpStrength, warpRegion, addSplitPoint, editMode.isSplittingRegion, editMode.splitPoints])

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      stopDragging()
      setIsMouseDown(false)
      
      // Stop the drag but stay in move mode so user can grab and move again
      if (isMovingRegion) {
        setIsMovingRegion(false)
      }
      
      lastFreehandPointRef.current = null
    }
  }, [stopDragging, isMovingRegion])

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !effectiveImage || !mapState.originSelected) return

    if (editMode.isEditing || editMode.isMovingRegion || editMode.isSplittingRegion || drawingRegion || isSpacePressed) {
      return
    }

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const imagePos = canvasToImage(x, y, mapState.scale, mapState.offsetX, mapState.offsetY)
    const worldPos = pixelToWorld(imagePos.x, imagePos.y, effectiveImage.width, effectiveImage.height, mapState.originOffset)

    // Check each region to see if the double-click is inside (only isolated region when in isolate mode)
    const regionsToCheck = isolatedRegionId
      ? regions.regions.filter(r => r.id === isolatedRegionId)
      : regions.regions
    for (let i = regionsToCheck.length - 1; i >= 0; i--) {
      const region = regionsToCheck[i]
      if (isPointInPolygon(worldPos, region.points)) {
        regions.setSelectedRegionId(region.id)
        if (onNavigateToRegions) {
          onNavigateToRegions()
        }
        return
      }
    }
  }, [effectiveImage, mapState.originSelected, mapState.scale, mapState.offsetX, mapState.offsetY, mapState.originOffset, editMode.isEditing, editMode.isMovingRegion, editMode.isSplittingRegion, drawingRegion, isSpacePressed, regions, isolatedRegionId, onNavigateToRegions])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (effectiveImage && mapState.originSelected) {
      const imagePos = canvasToImage(x, y, mapState.scale, mapState.offsetX, mapState.offsetY)
      const worldPos = pixelToWorld(imagePos.x, imagePos.y, effectiveImage.width, effectiveImage.height, mapState.originOffset)
      setMouseCoordinates(worldPos)
      
      // Real-time region movement preview while dragging
      if (isMovingRegion && isMouseDown) {
        updateMoveRegion(worldPos.x, worldPos.z)
      }

      // Continuous warp while holding mouse
      if (isWarping && isMouseDown && regions.selectedRegionId && !isSpacePressed && !editMode.isEditing && !editMode.isMovingRegion) {
        warpRegion(regions.selectedRegionId, worldPos.x, worldPos.z, warpRadius, warpStrength)
      }

      // Freehand sampling while dragging
      if (
        drawingRegion && regions.freehandEnabled && isMouseDown && !isSpacePressed && !editMode.isEditing && !editMode.isMovingRegion
      ) {
        const last = lastFreehandPointRef.current
        const minWorldSpacing = 8 // ~1 block increments; tweak as needed
        if (!last || Math.hypot(worldPos.x - last.x, worldPos.z - last.z) >= minWorldSpacing) {
          addPointToDrawing(worldPos.x, worldPos.z)
          lastFreehandPointRef.current = worldPos
        }
      }
    } else {
      setMouseCoordinates(null)
    }

    handleMouseMove(x, y)
  }, [effectiveImage, mapState.originSelected, mapState.scale, mapState.offsetX, mapState.offsetY, mapState.originOffset, handleMouseMove, isMovingRegion, isMouseDown, updateMoveRegion, isWarping, regions.selectedRegionId, isSpacePressed, editMode.isEditing, warpRegion, warpRadius, warpStrength, regions.freehandEnabled, drawingRegion, addPointToDrawing])

  // Add wheel event listener with passive: false to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      handleWheel(e.deltaY, x, y)
    }

    canvas.addEventListener('wheel', handleWheelEvent, { passive: false })

    return () => {
      canvas.removeEventListener('wheel', handleWheelEvent)
    }
  }, [handleWheel])

  // Edit mode handlers
  const handlePointMouseDown = useCallback((regionId: string, pointIndex: number, event: React.MouseEvent) => {
    event.preventDefault()
    startDraggingPoint(regionId, pointIndex)
  }, [startDraggingPoint])

  const handlePointMouseMove = useCallback((regionId: string, pointIndex: number, x: number, z: number) => {
    updatePointPosition(regionId, pointIndex, x, z)
  }, [updatePointPosition])

  const handlePointMouseUp = useCallback(() => {
    stopDraggingPoint()
  }, [stopDraggingPoint])

  const handleInsertPointClick = useCallback((regionId: string, pointIndex: number, x: number, z: number) => {
    addPointToRegion(regionId, pointIndex, x, z)
  }, [addPointToRegion])

  const handlePointDoubleClick = useCallback((regionId: string, pointIndex: number) => {
    removePointFromRegion(regionId, pointIndex)
  }, [removePointFromRegion])



  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateCanvasSize = () => {
      // Get the available space by subtracting the sidebar width
      canvas.width = window.innerWidth - SIDEBAR_WIDTH
      canvas.height = window.innerHeight
    }

    // Set initial size
    updateCanvasSize()

    // Add resize listener
    window.addEventListener('resize', updateCanvasSize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [])

  return (
    <div className="flex-1 relative h-full">
      
      {worldName.worldName && (
        <div className="absolute top-4 left-4 z-10 bg-gray-900/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-lg font-semibold border border-gunmetal shadow-lg">
          {worldName.worldName}
        </div>
      )}
      
      {!effectiveImage && regions.regions.length > 0 && (
        <div className="absolute top-32 left-4 z-10 bg-yellow-600 text-white px-4 py-2 rounded text-sm shadow-lg max-w-md">
          <div className="font-semibold mb-1">Image Required</div>
          <div className="text-xs">
            Your regions have been saved, but the image needs to be reloaded. 
            Please select the same image file to continue working with your regions.
          </div>
        </div>
      )}
      
      {effectiveImage && !mapState.originSelected && (
        <div className="absolute top-16 left-4 z-10 bg-blue-600 text-white px-4 py-2 rounded text-sm shadow-lg">
          Choose the world center (0,0) - Click on the compass or known reference point
        </div>
      )}
      
      {isSpacePressed && (
        <div className="absolute bottom-4 right-4 z-10 bg-blue-600 text-white px-3 py-1 rounded text-sm">
          Pan Mode (Space)
        </div>
      )}

      {isolatedRegionId && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-saffron border-2 border-saffron rounded-lg px-4 py-2 shadow-lg">
          <p className="text-gray-900 font-semibold text-sm">
            Isolation mode
          </p>
        </div>
      )}
      
      {editMode.isEditing && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-saffron border-2 border-saffron rounded-lg px-4 py-2 shadow-lg">
          <p className="text-gray-900 font-semibold text-sm">
            Edit Mode
          </p>
        </div>
      )}
      
      {editMode.isMovingRegion && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-saffron border-2 border-saffron rounded-lg px-4 py-2 shadow-lg">
          <p className="text-gray-900 font-semibold text-sm">
            Move Mode
          </p>
        </div>
      )}
      
      {editMode.isSplittingRegion && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-saffron border-2 border-saffron rounded-lg px-4 py-2 shadow-lg">
          <p className="text-gray-900 font-semibold text-sm">
            Split Mode
          </p>
        </div>
      )}
      
      {isSettingCenterPoint && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-saffron border-2 border-saffron rounded-lg px-4 py-2 shadow-lg">
          <p className="text-gray-900 font-semibold text-sm">
            Set heart location
          </p>
        </div>
      )}
      
      {spawnState.isPlacing && (
        <div className="absolute top-4 right-4 z-10 bg-red-600 text-white px-3 py-1 rounded text-sm">
          Spawn Placement Mode
        </div>
      )}
      
      {mouseCoordinates && (
        <div className="absolute bottom-4 left-4 z-10 bg-eerie-back text-white px-3 py-1 pr-2 rounded text-sm border border-gunmetal font-mono flex items-center space-x-2">
            <span className="w-[140px]">
              <span className="text-gray-400">X:</span> <span className="text-white inline-block w-[30px]">{Math.round(mouseCoordinates.x)}</span>{' '}
              <span className="text-gray-400 ml-3">Z:</span> <span className="text-white inline-block w-[30px]">{Math.round(mouseCoordinates.z)}</span>
            </span>
            <button
              onClick={() => setIsCoordinateDialogOpen(true)}
              className="ml-4 p-1 hover:bg-gray-700 rounded transition-colors"
            title="Add custom marker"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      )}
      
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        <div className="bg-eerie-back text-white px-3 py-1 rounded text-sm border border-gunmetal">
          {Math.round(mapState.scale * 100)}%
        </div>
        <button
          onClick={() => {
            setScale(1)
            if (effectiveImage) {
              const canvasWidth = window.innerWidth - SIDEBAR_WIDTH
              const canvasHeight = window.innerHeight - 64
              const centerX = (canvasWidth - effectiveImage.width) / 2
              const centerY = (canvasHeight - effectiveImage.height) / 2
              setOffset(centerX, centerY)
            }
          }}
          className="bg-gray-700 hover:bg-gray-600 text-white p-1 rounded border border-gunmetal transition-colors flex items-center justify-center"
          title="Reset zoom to 100% and center image"
        >
          <Scan size={14} />
        </button>
      </div>
      
      <canvas
        ref={canvasRef}
        className={`border border-gunmetal ${getCursorStyle()}`}
        style={{ backgroundColor: '#121716' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={onMouseMove}
        onMouseEnter={() => setIsMouseOverCanvas(true)}
        onMouseLeave={() => setIsMouseOverCanvas(false)}
        onDoubleClick={handleDoubleClick}
      />
      
      {effectiveImage && (
        <>
          <GridOverlay
            canvas={canvasRef.current}
            mapState={mapState}
            isVisible={highlightMode.showGrid}
            clipRegion={isolatedRegionId ? regions.regions.find(r => r.id === isolatedRegionId) ?? null : null}
          />
          {highlightMode.showRegions && (
            <RegionOverlay
              canvas={canvasRef.current}
              mapState={mapState}
              drawingRegion={drawingRegion}
              selectedRegionId={selectedRegionId}
              hoveredRegionId={regions.hoveredRegionId}
              editMode={editMode}
              highlightMode={highlightMode}
              regions={isolatedRegionId ? (regions.regions.filter(r => r.id === isolatedRegionId)) : regions.regions}
              isolatedMode={!!isolatedRegionId}
              spawnCoordinates={(seedInfo.seedInfo.dimension === 'nether' || seedInfo.seedInfo.dimension === 'end') ? null : spawnState.coordinates}
              isSpacePressed={isSpacePressed}
              onPointMouseDown={handlePointMouseDown}
              onPointMouseMove={handlePointMouseMove}
              onPointMouseUp={handlePointMouseUp}
              onInsertPointClick={handleInsertPointClick}
              onPointDoubleClick={handlePointDoubleClick}
              isWarping={isWarping}
              warpRadius={warpRadius}
              mouseCoordinates={mouseCoordinates}
              isMouseOverCanvas={isMouseOverCanvas}
              hiddenBiomeLabels={biomeLabelVisibility.hiddenBiomes}
              showBiomeLabels={showAdvanced}
            />
          )}
          <CustomMarkerOverlay
            canvas={canvasRef.current}
            mapState={mapState}
            customMarker={customMarker}
            orphanedVillageMarkers={orphanedVillageMarkers}
            showOrphanedVillages={showOrphanedVillages}
          />
          {drawingRegion && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-saffron border-2 border-saffron rounded-lg px-4 py-2 shadow-lg">
              <p className="text-gray-900 font-semibold text-sm">
                Drawing Mode
              </p>
            </div>
          )}
          <div className="absolute bottom-4 left-[220px] z-10 flex items-end gap-3">
          <MapDisplayControls
            highlightMode={highlightMode}
            orphanedVillageMarkers={orphanedVillageMarkers}
            showOrphanedVillages={showOrphanedVillages}
            dimension={seedInfo.seedInfo.dimension}
            toggleHighlightAll={regions.toggleHighlightAll}
            toggleShowRegions={regions.toggleShowRegions}
            toggleShowVillages={regions.toggleShowVillages}
            toggleShowOrphanedVillages={customMarkers.toggleShowOrphanedVillages}
            toggleShowCenterPoints={regions.toggleShowCenterPoints}
            toggleShowChallengeLevels={regions.toggleShowChallengeLevels}
            toggleShowGrid={regions.toggleShowGrid}
            toggleShowNames={regions.toggleShowNames}
          />
            
            {mapState.terrainImage && mapState.biomeImage ? (
              <div className="bg-gray-900/90 backdrop-blur-sm border border-gunmetal rounded-lg px-3 py-2 shadow-lg space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTerrainVisible(!mapState.terrainVisible)}
                    className={`flex items-center gap-1.5 text-xs ${mapState.terrainVisible ? 'text-white' : 'text-gray-500'}`}
                  >
                    {mapState.terrainVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    Terrain
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={mapState.terrainOpacity}
                    onChange={(e) => setTerrainOpacity(parseFloat(e.target.value))}
                    className="w-14 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBiomeVisible(!mapState.biomeVisible)}
                    className={`flex items-center gap-1.5 text-xs ${mapState.biomeVisible ? 'text-white' : 'text-gray-500'}`}
                  >
                    {mapState.biomeVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    Biome
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={mapState.biomeOpacity}
                    onChange={(e) => setBiomeOpacity(parseFloat(e.target.value))}
                    className="w-14 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-900/90 backdrop-blur-sm border border-gunmetal rounded-lg px-3 py-2 shadow-lg">
                <div className="flex items-center gap-2 min-w-[140px]">
                  <label className="text-white text-xs font-medium whitespace-nowrap">Opacity:</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={mapState.imageOpacity}
                    onChange={(e) => setImageOpacity(parseFloat(e.target.value))}
                    className="w-16 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #4a5568 0%, #4a5568 ${mapState.imageOpacity * 100}%, #2d3748 ${mapState.imageOpacity * 100}%, #2d3748 100%)`
                    }}
                  />
                  <span className="text-white text-xs font-mono w-8 text-right">
                    {Math.round(mapState.imageOpacity * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      
      <CoordinateInputDialog
        isOpen={isCoordinateDialogOpen}
        onClose={() => setIsCoordinateDialogOpen(false)}
        onSubmit={handleCoordinateSubmit}
      />
    </div>
  )
}
