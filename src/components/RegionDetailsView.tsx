import { useState, useEffect } from 'react'
import { calculatePolygonArea, formatArea, calculateRegionCenter, calculatePolygonCenter } from '../utils/polygonUtils'
import { generateRegionName } from '../utils/nameGenerator'
import { Region, EditMode } from '../types'
import { YAMLDisplay } from './YAMLDisplay'
import { VillageManager } from './VillageManager'
import { Button } from './Button'
import { DeleteRegionModal } from './DeleteRegionModal'
import { ArrowLeft, VectorSquare, Plus, Minus, BrushCleaning, Move, Scissors, CircleDotDashed, Trash2, Eye, EyeOff, Focus, Layers, Wrench } from 'lucide-react'

interface RegionDetailsViewProps {
  selectedRegion: Region
  editMode: EditMode
  dimension: 'overworld' | 'nether' | 'end'
  isWarping: boolean
  warpRadius: number
  warpStrength: number
  onBack: () => void
  onUpdateRegion: (regionId: string, updates: any) => boolean | void
  existingRegions: Region[]
  onStartEditMode: (regionId: string) => void
  onStopEditMode: () => void
  onStartMoveRegion: (regionId: string, x: number, z: number) => void
  onCancelMoveRegion: () => void
  onFinishMoveRegion: () => void
  onStartSplitRegion: (regionId: string) => void
  onFinishSplitRegion: () => void
  onCancelSplitRegion: () => void
  onDoubleRegionVertices: (regionId: string) => void
  onHalveRegionVertices: (regionId: string) => void
  onSimplifyRegionVertices: (regionId: string, tolerance: number) => void
  onResizeRegion: (regionId: string, scaleFactor: number) => void
  onRemoveSubregionFromRegion: (regionId: string, subregionId: string) => void
  onUpdateSubregionName: (regionId: string, subregionId: string, newName: string) => void
  onCopyYAML: (regionId: string) => void
  onSetWarping: (warping: boolean) => void
  onSetWarpRadius: (radius: number) => void
  onSetWarpStrength: (strength: number) => void
  onDeleteRegion: (regionId: string) => void
  isolatedRegionId: string | null
  onIsolateRegion: (regionId: string) => void
  onClearIsolate: () => void
  onStartPlacingLabel?: (regionId: string) => void
  onStopPlacingLabel?: () => void
  isPlacingLabel?: boolean
}

export function RegionDetailsView({
  selectedRegion,
  editMode,
  dimension,
  isWarping,
  warpRadius,
  warpStrength,
  onBack,
  onUpdateRegion,
  onStartEditMode,
  onStopEditMode,
  onStartMoveRegion,
  onCancelMoveRegion,
  onFinishMoveRegion,
  onStartSplitRegion,
  onFinishSplitRegion,
  onCancelSplitRegion,
  onDoubleRegionVertices,
  onHalveRegionVertices,
  onSimplifyRegionVertices,
  onResizeRegion,
  onRemoveSubregionFromRegion,
  onUpdateSubregionName,
  onCopyYAML,
  onSetWarping,
  onSetWarpRadius,
  onSetWarpStrength,
  onDeleteRegion,
  existingRegions,
  isolatedRegionId,
  onIsolateRegion,
  onClearIsolate,
  onStartPlacingLabel,
  onStopPlacingLabel,
  isPlacingLabel = false
}: RegionDetailsViewProps) {
  const [resizePercentage, setResizePercentage] = useState('100')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [tempName, setTempName] = useState(selectedRegion.name)
  const [isToolsExpanded, setIsToolsExpanded] = useState(true)
  const isEditing = editMode.isEditing && editMode.editingRegionId === selectedRegion.id
  const modeIsActive = isEditing || editMode.isMovingRegion || editMode.isSplittingRegion
  const editingDisabled = isolatedRegionId === selectedRegion.id
  
  // Update tempName when selectedRegion changes
  useEffect(() => {
    setTempName(selectedRegion.name)
    setNameError(null)
  }, [selectedRegion.id])
  
  // Check URL parameter for advanced features
  const urlParams = new URLSearchParams(window.location.search)
  const showAdvanced = urlParams.get('advanced') === 'true'

  // Update resize percentage when selected region changes
  useEffect(() => {
    if (selectedRegion) {
      const percentage = Math.round((selectedRegion.scaleFactor || 1.0) * 100)
      setResizePercentage(percentage.toString())
    } else {
      setResizePercentage('100')
    }
  }, [selectedRegion])


  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={onBack}
          leftIcon={<ArrowLeft size={16} />}
          className="w-full"
        >
          Back
        </Button>
        <h1 className="text-4xl font-bold text-white catamaran-medium">{selectedRegion.name}</h1>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Region name</label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={tempName}
            onChange={(e) => {
              const newName = e.target.value
              setTempName(newName)
              setNameError(null)
            }}
            onBlur={() => {
              const trimmedName = tempName.trim()
              if (trimmedName === selectedRegion.name) {
                // Name hasn't changed, reset to original
                setTempName(selectedRegion.name)
                setNameError(null)
                return
              }
              
              if (!trimmedName) {
                setTempName(selectedRegion.name)
                setNameError(null)
                return
              }
              
              // Check for duplicate names (case-insensitive)
              const isDuplicate = existingRegions.some(r => 
                r.id !== selectedRegion.id && r.name.trim().toLowerCase() === trimmedName.toLowerCase()
              )
              
              if (isDuplicate) {
                setNameError('A region with this name already exists')
                setTempName(selectedRegion.name)
                return
              }
              
              // Update the region name
              const success = onUpdateRegion(selectedRegion.id, { name: trimmedName })
              if (success === false) {
                setNameError('A region with this name already exists')
                setTempName(selectedRegion.name)
              } else {
                setTempName(trimmedName)
              }
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur()
              }
            }}
            className={`flex-1 bg-input-bg text-input-text px-3 py-2 rounded border focus:outline-none placeholder:text-gray-500 ${
              nameError ? 'border-red-500 focus:border-red-500' : 'border-input-border focus:border-lapis-lighter'
            }`}
          />
          <Button
            variant="ghost"
            onClick={() => {
              const generatedName = generateRegionName(dimension)
              // Check for duplicates before applying
              const isDuplicate = existingRegions.some(r => 
                r.id !== selectedRegion.id && r.name.trim().toLowerCase() === generatedName.toLowerCase()
              )
              
              if (isDuplicate) {
                setNameError('Generated name already exists, please try again')
                return
              }
              
              const success = onUpdateRegion(selectedRegion.id, { name: generatedName })
              if (success === false) {
                setNameError('A region with this name already exists')
              } else {
                setTempName(generatedName)
                setNameError(null)
              }
            }}
            className="px-3 py-2"
            title="Generate random medieval name"
          >
            🎲
          </Button>
        </div>
        {nameError && (
          <p className="text-sm text-red-400 mt-1">{nameError}</p>
        )}
        <div className="flex justify-between items-center mt-1">
          <p className="text-gray-400 text-xs">
            {selectedRegion.points.length} points
          </p>
          <p className="text-lapis-lazuli/80 text-xs">
            {formatArea(calculatePolygonArea(selectedRegion.points))}
          </p>
        </div>
      </div>

      {showAdvanced && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Label position</label>
          <p className="text-gray-400 text-xs mb-2">
            World coordinates where the region name appears on the map. Leave blank to use the centroid.
          </p>
          <div className="flex gap-2 items-center flex-wrap">
            <input
              type="number"
              placeholder="X"
              className="w-20 bg-input-bg text-input-text px-3 py-2 rounded border border-input-border focus:outline-none focus:border-lapis-lighter placeholder:text-gray-500"
              value={selectedRegion.labelPosition?.x ?? ''}
              onChange={(e) => {
                const centroid = calculatePolygonCenter(selectedRegion.points)
                const xVal = e.target.value
                const zVal = selectedRegion.labelPosition?.z ?? centroid.z
                if (xVal === '') {
                  onUpdateRegion(selectedRegion.id, { labelPosition: { x: centroid.x, z: zVal } })
                } else {
                  const x = parseFloat(xVal)
                  if (!isNaN(x)) {
                    onUpdateRegion(selectedRegion.id, { labelPosition: { x, z: zVal } })
                  }
                }
              }}
            />
            <input
              type="number"
              placeholder="Z"
              className="w-20 bg-input-bg text-input-text px-3 py-2 rounded border border-input-border focus:outline-none focus:border-lapis-lighter placeholder:text-gray-500"
              value={selectedRegion.labelPosition?.z ?? ''}
              onChange={(e) => {
                const centroid = calculatePolygonCenter(selectedRegion.points)
                const zVal = e.target.value
                const xVal = selectedRegion.labelPosition?.x ?? centroid.x
                if (zVal === '') {
                  onUpdateRegion(selectedRegion.id, { labelPosition: { x: xVal, z: centroid.z } })
                } else {
                  const z = parseFloat(zVal)
                  if (!isNaN(z)) {
                    onUpdateRegion(selectedRegion.id, { labelPosition: { x: xVal, z } })
                  }
                }
              }}
            />
            <Button
              variant="ghost"
              onClick={() => onUpdateRegion(selectedRegion.id, { labelPosition: null })}
              title="Use centroid (center of region)"
              disabled={!selectedRegion.labelPosition}
            >
              Centroid
            </Button>
          </div>
          {!isPlacingLabel && onStartPlacingLabel && (
            <Button
              variant="ghost"
              className="mt-2 text-xs"
              onClick={() => onStartPlacingLabel(selectedRegion.id)}
              title="Click on the map to place the label"
            >
              {selectedRegion.labelPosition ? 'Move label' : 'Set custom position'}
            </Button>
          )}
          {isPlacingLabel && onStopPlacingLabel && (
            <Button
              variant="ghost"
              className="mt-2 text-xs"
              onClick={onStopPlacingLabel}
              title="Cancel label placement"
            >
              Cancel
            </Button>
          )}
        </div>
      )}

            {!isEditing && (
              <div className="flex space-x-2">
                <Button
                  variant="primary"
                  onClick={() => onStartEditMode(selectedRegion.id)}
                  leftIcon={<VectorSquare size={16} />}
                  className="flex-1"
                  disabled={editingDisabled}
                  title={editingDisabled ? 'Show all regions to edit the shape' : undefined}
                >
                  Edit Shape
                </Button>
              </div>
            )}

      {isEditing && (
        <div className="mb-4 p-3 bg-saffron border border-saffron rounded space-y-2">
          <div className="flex items-center gap-2">
            <VectorSquare className="text-gray-900" size={18} />
            <p className="text-gray-900 text-base">
              <strong>Edit Mode</strong>
            </p>
          </div>
          <p className="text-gray-900 text-sm">
            Drag green points to move them. Click cyan dots between points to add new points. Double-click green points to delete them.
          </p>
          <Button
            variant="primary"
            onClick={onStopEditMode}
            className="w-full mt-2"
          >
            Done
          </Button>
        </div>
      )}

      <div>
        <button
          onClick={() => setIsToolsExpanded(!isToolsExpanded)}
          className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
        >
          <span className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Tools
          </span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isToolsExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {isToolsExpanded && (
        <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">Brushes</h4>
        <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            if (isWarping && warpRadius === 200 && warpStrength === 40) {
              onSetWarping(false)
            } else {
              onSetWarpRadius(200)
              onSetWarpStrength(40)
              onSetWarping(true)
            }
          }}
          disabled={modeIsActive || editingDisabled}
          className={`w-full font-medium py-2 px-4 rounded-full transition-all border-2 flex items-center justify-center gap-2 ${
            modeIsActive || editingDisabled
              ? 'bg-transparent text-gray-500 border-persimmon/50 cursor-not-allowed opacity-50'
              : isWarping && warpRadius === 200 && warpStrength === 40
              ? 'bg-orange-600 text-white border-persimmon'
              : 'bg-transparent text-orange-100 border-persimmon'
          }`}
        >
          <CircleDotDashed className="w-4 h-4" />
          Push Large
        </button>
        
        <button
          onClick={() => {
            if (isWarping && warpRadius === 80 && warpStrength === 40) {
              onSetWarping(false)
            } else {
              onSetWarpRadius(80)
              onSetWarpStrength(40)
              onSetWarping(true)
            }
          }}
          disabled={modeIsActive || editingDisabled}
          className={`w-full font-medium py-2 px-4 rounded-full transition-all border-2 flex items-center justify-center gap-2 ${
            modeIsActive || editingDisabled
              ? 'bg-transparent text-gray-500 border-persimmon/50 cursor-not-allowed opacity-50'
              : isWarping && warpRadius === 80 && warpStrength === 40
              ? 'bg-orange-600 text-white border-persimmon'
              : 'bg-transparent text-orange-100 border-persimmon'
          }`}
        >
          <CircleDotDashed className="w-4 h-4" />
          Push Small
        </button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">Vertices</h4>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={() => onSimplifyRegionVertices(selectedRegion.id, 10)}
            leftIcon={<BrushCleaning className="w-4 h-4" />}
            className="flex-1"
            disabled={editingDisabled}
          >
            Simplify
          </Button>
          <Button
            variant="secondary"
            onClick={() => onDoubleRegionVertices(selectedRegion.id)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="flex-1"
            disabled={editingDisabled}
          >
            Double
          </Button>
          <Button
            variant="secondary"
            onClick={() => onHalveRegionVertices(selectedRegion.id)}
            leftIcon={<Minus className="w-4 h-4" />}
            className="flex-1"
            disabled={editingDisabled}
          >
            Halve
          </Button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">Transform</h4>
      </div>

      {!editMode.isMovingRegion && (
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={() => {
              const center = calculateRegionCenter(selectedRegion)
              onStartMoveRegion(selectedRegion.id, center.x, center.z)
            }}
            leftIcon={<Move className="w-4 h-4" />}
            className="flex-1"
            disabled={editingDisabled}
          >
            Move Region
          </Button>
        </div>
      )}

      {editMode.isMovingRegion && (
        <div className="mb-4 p-3 bg-saffron border border-saffron rounded space-y-2">
          <div className="flex items-center gap-2">
            <Move className="text-gray-900" size={18} />
            <p className="text-gray-900 text-base">
              <strong>Move Mode</strong>
            </p>
          </div>
          <p className="text-gray-900 text-sm">
            Click and drag the region to move it. Release to drop it in the new location.
          </p>
          <div className="flex space-x-2 mt-2">
            <Button
              variant="ghost"
              onClick={onCancelMoveRegion}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={onFinishMoveRegion}
              className="flex-1"
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {!editMode.isSplittingRegion && (
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={() => onStartSplitRegion(selectedRegion.id)}
            leftIcon={<Scissors className="w-4 h-4" />}
            className="flex-1"
            disabled={editingDisabled}
          >
            Split Region
          </Button>
        </div>
      )}

      {editMode.isSplittingRegion && (
        <div className="mb-4 p-3 bg-saffron border border-saffron rounded space-y-2">
          <div className="flex items-center gap-2">
            <Scissors className="text-gray-900" size={18} />
            <p className="text-gray-900 text-base">
              <strong>Split Mode</strong>
            </p>
          </div>
          <p className="text-gray-900 text-sm">
            Click 2 points on the region edge to define where to split it. ({editMode.splitPoints.length}/2 points selected)
          </p>
          <div className="flex space-x-2 mt-2">
            <Button
              variant="ghost"
              onClick={onCancelSplitRegion}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={onFinishSplitRegion}
              disabled={editMode.splitPoints.length < 2}
              className="flex-1"
            >
              Split Region
            </Button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-300">Scale: {resizePercentage}%</div>
        </div>
        <div className="mb-2">
          <input
            type="range"
            value={resizePercentage}
            onChange={(e) => {
              const percentage = parseFloat(e.target.value)
              setResizePercentage(percentage.toString())
              
              // Apply resize in real-time
              if (!isNaN(percentage) && percentage > 0 && selectedRegion) {
                const scaleFactor = percentage / 100
                onResizeRegion(selectedRegion.id, scaleFactor)
              }
            }}
            min="10"
            max="200"
            step="1"
            disabled={editMode.isMovingRegion || editingDisabled}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>10%</span>
          <span className="font-medium text-gray-400">100%</span>
          <span>200%</span>
        </div>
      </div>
        </div>
        )}
      </div>

      {showAdvanced && (
        <>
        <YAMLDisplay
          yamlContent={selectedRegion.id} // This will need to be passed from parent
          onCopyYAML={onCopyYAML}
        />

      <VillageManager
        subregions={selectedRegion.subregions || []}
        regionId={selectedRegion.id}
        onRemoveSubregion={onRemoveSubregionFromRegion}
        onUpdateSubregionName={onUpdateSubregionName}
      />
        </>
      )}

      <div className="mt-6 pt-4 border-t border-gunmetal space-y-2">
        {editingDisabled ? (
          <div className="p-3 bg-saffron border border-saffron rounded space-y-2">
            <div className="flex items-center gap-2">
              <Focus className="text-gray-900" size={18} />
              <p className="text-gray-900 text-base">
                <strong>Isolation Mode</strong>
              </p>
            </div>
            <p className="text-gray-900 text-sm">
              Viewing this region only. Show all regions to edit the shape.
            </p>
            <Button
              variant="primary"
              onClick={onClearIsolate}
              leftIcon={<Layers size={16} />}
              className="w-full mt-2"
            >
              Exit isolation mode
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            onClick={() => {
              onStopEditMode()
              onCancelMoveRegion()
              onCancelSplitRegion()
              onSetWarping(false)
              onIsolateRegion(selectedRegion.id)
            }}
            leftIcon={<Focus size={16} />}
            className="w-full"
          >
            Isolate Region
          </Button>
        )}
        <Button
          variant="secondary-outline"
          onClick={() => {
            onUpdateRegion(selectedRegion.id, { disabled: !selectedRegion.disabled })
          }}
          leftIcon={selectedRegion.disabled ? <Eye size={16} /> : <EyeOff size={16} />}
          className="w-full"
        >
          {selectedRegion.disabled ? 'Enable Region' : 'Disable Region'}
        </Button>
        <Button
          variant="secondary-outline"
          onClick={() => setShowDeleteModal(true)}
          leftIcon={<Trash2 size={16} />}
          className="w-full"
        >
          Delete Region
        </Button>
      </div>

      <DeleteRegionModal
        isOpen={showDeleteModal}
        regionName={selectedRegion.name}
        onConfirm={() => {
          onDeleteRegion(selectedRegion.id)
          setShowDeleteModal(false)
          onBack()
        }}
        onCancel={() => setShowDeleteModal(false)}
      />

    </div>
  )
}
