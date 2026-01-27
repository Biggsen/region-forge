import { useState, useEffect } from 'react'
import { generateRegionName } from '../utils/nameGenerator'
import { Button } from './Button'
import { Region } from '../types'

interface RegionCreationFormProps {
  dimension: 'overworld' | 'nether' | 'end'
  onStartDrawing: (name: string, freehand: boolean) => void
  onCancelDrawing: () => void
  isDrawing: boolean
  existingRegions: Region[]
  hasMap: boolean
}

export function RegionCreationForm({ 
  dimension, 
  onStartDrawing,
  onCancelDrawing,
  isDrawing,
  existingRegions,
  hasMap
}: RegionCreationFormProps) {
  const [newRegionName, setNewRegionName] = useState('')
  const [showNewRegionForm, setShowNewRegionForm] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  // Generate a random name when the form is shown
  useEffect(() => {
    if (showNewRegionForm && !newRegionName) {
      const effectiveDimension = dimension === 'end' ? 'overworld' : dimension
      setNewRegionName(generateRegionName(effectiveDimension))
    }
  }, [showNewRegionForm, newRegionName, dimension])

  // Clear error when name changes
  useEffect(() => {
    if (nameError) {
      setNameError(null)
    }
  }, [newRegionName])

  const handleGenerateNewName = () => {
    const effectiveDimension = dimension === 'end' ? 'overworld' : dimension
    setNewRegionName(generateRegionName(effectiveDimension))
    setNameError(null)
  }

  const handleStartDrawing = () => {
    const trimmedName = newRegionName.trim()
    if (!trimmedName) {
      return
    }
    
    // Check for duplicate names (case-insensitive)
    const isDuplicate = existingRegions.some(r => 
      r.name.trim().toLowerCase() === trimmedName.toLowerCase()
    )
    
    if (isDuplicate) {
      setNameError('A region with this name already exists')
      return
    }
    
    onStartDrawing(trimmedName, true)
    setNewRegionName('')
    setShowNewRegionForm(false)
    setNameError(null)
  }

  return (
    <div className="space-y-2">
      {!showNewRegionForm && !isDrawing ? (
        <>
          {!hasMap && (
            <p className="text-sm text-gray-400 mb-2">
              To create regions, you need to import a map first.
            </p>
          )}
          <Button
            variant="primary"
            onClick={() => setShowNewRegionForm(true)}
            className="w-full"
            disabled={!hasMap}
            title={!hasMap ? 'Please import a map first from the Map tab' : undefined}
          >
            Create New Region
          </Button>
        </>
      ) : null}
      
      {showNewRegionForm && (
        <div className="space-y-2">
          <h4 className="text-xl font-bold text-white">New region</h4>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Region Name
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
                placeholder="Enter region name"
                className={`flex-1 bg-input-bg text-input-text px-3 py-2 rounded border focus:outline-none placeholder:text-gray-500 ${
                  nameError ? 'border-red-500 focus:border-red-500' : 'border-input-border focus:border-lapis-lighter'
                }`}
                onKeyPress={(e) => e.key === 'Enter' && handleStartDrawing()}
              />
              <Button
                variant="ghost"
                onClick={handleGenerateNewName}
                className="px-3 py-2"
                title="Generate random medieval name"
              >
                🎲
              </Button>
            </div>
            {nameError && (
              <p className="text-sm text-red-400 mt-1">{nameError}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              onClick={() => setShowNewRegionForm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleStartDrawing}
              className="flex-1"
            >
              Draw region
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
