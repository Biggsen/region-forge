import React, { useState, useRef, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { Pencil } from 'lucide-react'

export function SeedInfoHeading() {
  const { seedInfo } = useAppContext()
  const [editingSeed, setEditingSeed] = useState(false)
  const [editingDimension, setEditingDimension] = useState(false)
  const [seedValue, setSeedValue] = useState(seedInfo.seedInfo.seed || '')
  const seedInputRef = useRef<HTMLInputElement>(null)
  const dimensionSelectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    setSeedValue(seedInfo.seedInfo.seed || '')
  }, [seedInfo.seedInfo.seed])

  useEffect(() => {
    if (editingSeed && seedInputRef.current) {
      seedInputRef.current.focus()
      seedInputRef.current.select()
    }
  }, [editingSeed])

  useEffect(() => {
    if (editingDimension && dimensionSelectRef.current) {
      dimensionSelectRef.current.focus()
    }
  }, [editingDimension])

  const handleSeedClick = () => {
    setEditingSeed(true)
    setSeedValue(seedInfo.seedInfo.seed || '')
  }

  const handleSeedBlur = () => {
    setEditingSeed(false)
    seedInfo.updateSeedInfo({ seed: seedValue.trim() || undefined })
  }

  const handleSeedKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSeedBlur()
    } else if (e.key === 'Escape') {
      setEditingSeed(false)
      setSeedValue(seedInfo.seedInfo.seed || '')
    }
  }

  const handleDimensionClick = () => {
    setEditingDimension(true)
  }

  const handleDimensionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'overworld' | 'nether' | 'end'
    seedInfo.updateSeedInfo({ dimension: value })
    setEditingDimension(false)
  }

  const handleDimensionBlur = () => {
    setEditingDimension(false)
  }

  const handleDimensionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditingDimension(false)
    }
  }

  const displaySeed = seedInfo.seedInfo.seed || 'Not set'
  const displayDimension = seedInfo.seedInfo.dimension || 'Not set'

  return (
    <div className="space-y-2">
      {/* Seed Display */}
      <div>
        <div className="text-sm text-gray-300 px-2 py-1 rounded flex items-center gap-2">
          <span className="font-medium w-28">Seed:</span>
          {editingSeed ? (
            <input
              ref={seedInputRef}
              type="text"
              value={seedValue}
              onChange={(e) => setSeedValue(e.target.value)}
              onBlur={handleSeedBlur}
              onKeyDown={handleSeedKeyDown}
              className="flex-1 text-sm text-input-text bg-transparent border-b-2 border-lapis-lazuli focus:outline-none focus:border-lapis-lighter px-2 py-1"
              placeholder="Enter seed"
            />
          ) : (
            <>
              <span>{displaySeed}</span>
              <Pencil 
                className="w-3 h-3 text-gray-400 hover:text-lapis-lazuli/80 transition-colors cursor-pointer" 
                onClick={handleSeedClick}
              />
            </>
          )}
        </div>
      </div>

      {/* Dimension Display */}
      <div>
        <div className="text-sm text-gray-300 px-2 py-1 rounded flex items-center gap-2">
          <span className="font-medium w-28">Dimension:</span>
          {editingDimension ? (
            <select
              ref={dimensionSelectRef}
              value={seedInfo.seedInfo.dimension || 'overworld'}
              onChange={handleDimensionChange}
              onBlur={handleDimensionBlur}
              onKeyDown={handleDimensionKeyDown}
              className="flex-1 text-sm text-input-text bg-input-bg border-b-2 border-lapis-lazuli focus:outline-none focus:border-lapis-lighter px-2 py-1 rounded"
            >
              <option value="overworld">Overworld</option>
              <option value="nether">Nether</option>
              <option value="end">End</option>
            </select>
          ) : (
            <>
              <span>{displayDimension}</span>
              <Pencil 
                className="w-3 h-3 text-gray-400 hover:text-lapis-lazuli/80 transition-colors cursor-pointer" 
                onClick={handleDimensionClick}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

