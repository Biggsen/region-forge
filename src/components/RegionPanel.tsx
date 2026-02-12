import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { copyToClipboard, calculatePolygonArea, formatArea } from '../utils/polygonUtils'
import { calculateZoomToFitRegion } from '../utils/zoomUtils'
import { RegionCreationForm } from './RegionCreationForm'
import { RegionDetailsView } from './RegionDetailsView'
import { Button } from './Button'
import { DeleteAllRegionsModal } from './DeleteAllRegionsModal'
import { DeleteRegionModal } from './DeleteRegionModal'
import { SortButton } from './SortButton'
import { Trash2, Search, LineSquiggle, ZoomIn } from 'lucide-react'

export function RegionPanel() {
  const { regions, seedInfo, mapState: mapStateHook, toast } = useAppContext()
  const {
    regions: regionsList,
    selectedRegionId,
    hoveredRegionId,
    drawingRegion,
    editMode,
    setSelectedRegionId,
    setHoveredRegionId,
    startDrawingRegion,
    deleteRegion,
    updateRegion,
    getRegionYAML,
    startEditMode,
    stopEditMode,
    removeSubregionFromRegion,
    updateSubregionName,
    setCustomCenterPoint,
    startMoveRegion,
    cancelMoveRegion,
    finishMoveRegion,
    doubleRegionVertices,
    halveRegionVertices,
    simplifyRegionVertices,
    resizeRegion,
    startSplitRegion,
    finishSplitRegion,
    cancelSplitRegion,
    isolatedRegionId,
    setIsolatedRegionId
  } = regions

  const { startSettingCenterPoint, stopSettingCenterPoint } = useAppContext().mapCanvas
  const { isWarping, setIsWarping, warpRadius, setWarpRadius, warpStrength, setWarpStrength } = useAppContext().mapCanvas
  const { mapState, setScale, setOffset } = mapStateHook

  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [regionToDelete, setRegionToDelete] = useState<{ id: string; name: string } | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'newest'>('newest')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')


  const handleCopyYAML = async (regionId: string) => {
    const yaml = getRegionYAML(regionId)
    try {
      await copyToClipboard(yaml)
      toast.showToast('YAML copied to clipboard!', 'success')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      toast.showToast('Failed to copy YAML to clipboard', 'error')
    }
  }


  const handleZoomToRegion = (region: { id: string; name: string; points: { x: number; z: number }[] }) => {
    if (!mapState.image) {
      console.warn('Cannot zoom: No image loaded')
      toast.showToast('Cannot zoom to region: No map image is loaded. Please load a map image first from the Map tab.', 'error')
      return
    }

    try {
      const zoomResult = calculateZoomToFitRegion(
        region.points,
        mapState.image.width,
        mapState.image.height,
        mapState.originOffset
      )

      if (!zoomResult) {
        console.warn('Cannot zoom: Invalid region or calculation failed')
        return
      }

      setScale(zoomResult.scale)
      setOffset(zoomResult.offsetX, zoomResult.offsetY)
    } catch (error) {
      console.error('Error zooming to region:', error)
    }
  }



  const handleSpawnCheckboxChange = (regionId: string, checked: boolean) => {
    if (checked) {
      // If checking this region, uncheck all other regions first
      regionsList.forEach(region => {
        if (region.id !== regionId && region.hasSpawn) {
          updateRegion(region.id, { hasSpawn: false })
        }
      })
    }
    // Then update the selected region
    updateRegion(regionId, { hasSpawn: checked })
  }




  const selectedRegion = regionsList.find(r => r.id === selectedRegionId)

  

  
  // Filter regions based on search query
  const filteredRegions = regionsList.filter(region =>
    region.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Sort filtered regions
  const sortedRegions = [...filteredRegions].sort((a, b) => {
    let comparison = 0
    
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name)
    } else if (sortBy === 'size') {
      const areaA = calculatePolygonArea(a.points)
      const areaB = calculatePolygonArea(b.points)
      comparison = areaA - areaB
    } else if (sortBy === 'newest') {
      // Find index in original regionsList to determine creation order
      const indexA = regionsList.findIndex(r => r.id === a.id)
      const indexB = regionsList.findIndex(r => r.id === b.id)
      comparison = indexA - indexB // Positive means a was created after b
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  return (
    <div className="w-full h-full flex flex-col">
      {!selectedRegion ? (
        // Region List View
        <>
          {!drawingRegion && (
            <div className="flex-shrink-0 mb-2">
              <RegionCreationForm
                existingRegions={regionsList}
                dimension={seedInfo.seedInfo.dimension === 'overworld' || seedInfo.seedInfo.dimension === 'nether' 
                  ? seedInfo.seedInfo.dimension 
                  : 'overworld'}
                onStartDrawing={(name, freehand) => {
                  regions.setFreehandEnabled(freehand)
                  startDrawingRegion(name)
                }}
                onCancelDrawing={() => regions.cancelDrawingRegion()}
                isDrawing={!!drawingRegion}
                hasMap={!!mapState.image}
              />
            </div>
          )}

          {drawingRegion && (
            <>
              <h4 className="text-xl font-bold text-white mb-2">New region</h4>
              <div className="flex-shrink-0 mb-4 p-3 bg-saffron border border-saffron rounded space-y-2">
              <div className="flex items-center gap-2">
                <LineSquiggle className="text-gray-900" size={18} />
                <p className="text-gray-900 text-base">
                  Drawing: <strong>{drawingRegion.name}</strong>
                </p>
              </div>
              <p className="text-gray-900 text-sm">
                Click to place points or click and hold to draw
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => regions.cancelDrawingRegion()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => regions.finishDrawingRegion()}
                  disabled={drawingRegion.points.length < 3}
                  className="flex-1"
                >
                  Finish
                </Button>
              </div>
              </div>
            </>
          )}

          {/* Region Counter */}
          <div className="flex-shrink-0 mb-4 mt-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Regions ({regionsList.length})</h2>
            {regionsList.length > 0 && (
              <button
                onClick={() => setShowDeleteAllModal(true)}
                className="text-red-400 hover:text-red-300 text-sm underline hover:no-underline transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete all
              </button>
            )}
          </div>

          <DeleteAllRegionsModal
            isOpen={showDeleteAllModal}
            regionCount={regionsList.length}
            onConfirm={() => {
              regions.replaceRegions([])
              regions.setSelectedRegionId(null)
              setShowDeleteAllModal(false)
            }}
            onCancel={() => setShowDeleteAllModal(false)}
          />

          {regionToDelete && (
            <DeleteRegionModal
              isOpen={!!regionToDelete}
              regionName={regionToDelete.name}
              onConfirm={() => {
                deleteRegion(regionToDelete.id)
                setRegionToDelete(null)
              }}
              onCancel={() => setRegionToDelete(null)}
            />
          )}

          {/* Search Input */}
          <div className="flex-shrink-0 mb-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search regions..."
              className="w-full bg-input-bg text-input-text pl-10 pr-3 py-2 rounded border border-input-border focus:border-lapis-lighter focus:outline-none placeholder:text-gray-500"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex-shrink-0 mb-4 flex items-center gap-2">
            <span className="text-gray-400 text-sm">Sort by:</span>
            <div className="flex gap-1">
              <SortButton
                sortKey="newest"
                currentSort={sortBy}
                sortOrder={sortOrder}
                label="Newest"
                onClick={() => {
                  if (sortBy === 'newest') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortBy('newest')
                    setSortOrder('desc')
                  }
                }}
              />
              <SortButton
                sortKey="name"
                currentSort={sortBy}
                sortOrder={sortOrder}
                label="Name"
                onClick={() => {
                  if (sortBy === 'name') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortBy('name')
                    setSortOrder('asc')
                  }
                }}
              />
              <SortButton
                sortKey="size"
                currentSort={sortBy}
                sortOrder={sortOrder}
                label="Size"
                onClick={() => {
                  if (sortBy === 'size') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortBy('size')
                    setSortOrder('asc')
                  }
                }}
              />
            </div>
          </div>

          {/* Scrollable Region List - Takes remaining space */}
          <div className="flex-1 overflow-y-auto space-y-2" style={{ maxHeight: 'calc(100vh - 400px)' }}>
            {sortedRegions.map(region => {
              const area = calculatePolygonArea(region.points)
              const isDisabled = region.disabled === true
              return (
                <div
                  key={region.id}
                  className={`p-2 rounded cursor-pointer border-2 bg-gunmetal hover:bg-brunswick-green hover:border-viridian ${
                    isDisabled ? 'border-dashed border-gray-500 opacity-60' : 'border-gunmetal'
                  }`}
                  onClick={() => {
                    setHoveredRegionId(null)
                    setSelectedRegionId(region.id)
                  }}
                  onMouseEnter={() => setHoveredRegionId(region.id)}
                  onMouseLeave={() => setHoveredRegionId(null)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className={`font-medium ${isDisabled ? 'text-gray-400' : 'text-white'}`}>
                        {region.name}
                        {isDisabled && <span className="text-xs text-gray-500 ml-2">(disabled)</span>}
                      </span>
                      <div className="text-gray-400 text-xs">
                        Size: {formatArea(area)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleZoomToRegion(region)
                        }}
                        className="text-gray-300 text-sm p-1 rounded transition-colors hover:bg-viridian hover:text-white"
                        title="Zoom to region"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setRegionToDelete({ id: region.id, name: region.name })
                        }}
                        className="text-gray-300 text-sm p-1 rounded transition-colors hover:bg-viridian"
                        title="Delete region"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {sortedRegions.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-lg mb-2">No regions</p>
                <p className="text-sm">Create your first region to get started</p>
              </div>
            )}
          </div>

        </>
      ) : (
        <RegionDetailsView
          selectedRegion={selectedRegion}
          editMode={editMode}
          dimension={seedInfo.seedInfo.dimension === 'overworld' || seedInfo.seedInfo.dimension === 'nether' 
            ? seedInfo.seedInfo.dimension 
            : 'overworld'}
          isWarping={isWarping}
          warpRadius={warpRadius}
          warpStrength={warpStrength}
          onBack={() => {
            setHoveredRegionId(null)
            setSelectedRegionId(null)
            setIsolatedRegionId(null)
            setIsWarping(false)
            stopSettingCenterPoint()
          }}
          onUpdateRegion={updateRegion}
          existingRegions={regionsList}
          onStartEditMode={startEditMode}
          onStopEditMode={stopEditMode}
          onStartMoveRegion={startMoveRegion}
          onCancelMoveRegion={cancelMoveRegion}
          onFinishMoveRegion={finishMoveRegion}
          onStartSplitRegion={startSplitRegion}
          onFinishSplitRegion={finishSplitRegion}
          onCancelSplitRegion={cancelSplitRegion}
          onDoubleRegionVertices={doubleRegionVertices}
          onHalveRegionVertices={halveRegionVertices}
          onSimplifyRegionVertices={simplifyRegionVertices}
          onResizeRegion={resizeRegion}
          onRemoveSubregionFromRegion={removeSubregionFromRegion}
          onUpdateSubregionName={updateSubregionName}
          onCopyYAML={handleCopyYAML}
          onSetWarping={setIsWarping}
          onSetWarpRadius={setWarpRadius}
          onSetWarpStrength={setWarpStrength}
          onDeleteRegion={deleteRegion}
          isolatedRegionId={isolatedRegionId}
          onIsolateRegion={setIsolatedRegionId}
          onClearIsolate={() => setIsolatedRegionId(null)}
          mapState={mapState}
        />
      )}
    </div>
  )
}
