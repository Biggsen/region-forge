import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'

export function SpawnButton() {
  const { spawn } = useAppContext()
  const { spawnState, startPlacingSpawn, cancelPlacingSpawn, setSpawnCoordinates, setSpawnRadius } = spawn
  const [editingX, setEditingX] = useState(false)
  const [editingZ, setEditingZ] = useState(false)
  const [editingY, setEditingY] = useState(false)
  const [editingRadius, setEditingRadius] = useState(false)
  const [tempX, setTempX] = useState('')
  const [tempZ, setTempZ] = useState('')
  const [tempY, setTempY] = useState('')
  const [tempRadius, setTempRadius] = useState('')

  const handleSpawnClick = () => {
    if (spawnState.isPlacing) {
      cancelPlacingSpawn()
    } else {
      startPlacingSpawn()
    }
  }

  const handleClearSpawn = () => {
    setSpawnCoordinates(null)
  }

  const handleXEdit = () => {
    if (spawnState.coordinates) {
      setTempX(spawnState.coordinates.x.toString())
      setEditingX(true)
    }
  }

  const handleZEdit = () => {
    if (spawnState.coordinates) {
      setTempZ(spawnState.coordinates.z.toString())
      setEditingZ(true)
    }
  }

  const handleYEdit = () => {
    if (spawnState.coordinates) {
      setTempY(spawnState.coordinates.y.toString())
      setEditingY(true)
    }
  }

  const handleRadiusEdit = () => {
    setTempRadius(spawnState.radius.toString())
    setEditingRadius(true)
  }

  const handleXSave = () => {
    if (spawnState.coordinates && tempX !== '') {
      const newX = parseInt(tempX)
      if (!isNaN(newX)) {
        setSpawnCoordinates({ x: newX, z: spawnState.coordinates.z, y: spawnState.coordinates.y })
      }
    }
    setEditingX(false)
  }

  const handleZSave = () => {
    if (spawnState.coordinates && tempZ !== '') {
      const newZ = parseInt(tempZ)
      if (!isNaN(newZ)) {
        setSpawnCoordinates({ x: spawnState.coordinates.x, z: newZ, y: spawnState.coordinates.y })
      }
    }
    setEditingZ(false)
  }

  const handleYSave = () => {
    if (spawnState.coordinates && tempY !== '') {
      const newY = parseInt(tempY)
      if (!isNaN(newY)) {
        setSpawnCoordinates({ x: spawnState.coordinates.x, z: spawnState.coordinates.z, y: newY })
      }
    }
    setEditingY(false)
  }

  const handleRadiusSave = () => {
    if (tempRadius !== '') {
      const newRadius = parseInt(tempRadius)
      if (!isNaN(newRadius) && newRadius > 0) {
        setSpawnRadius(newRadius)
      }
    }
    setEditingRadius(false)
  }

  const handleXKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleXSave()
    } else if (e.key === 'Escape') {
      setEditingX(false)
    }
  }

  const handleZKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleZSave()
    } else if (e.key === 'Escape') {
      setEditingZ(false)
    }
  }

  const handleYKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleYSave()
    } else if (e.key === 'Escape') {
      setEditingY(false)
    }
  }

  const handleRadiusKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRadiusSave()
    } else if (e.key === 'Escape') {
      setEditingRadius(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium text-white">Spawn Point</h5>
        {spawnState.coordinates && (
          <button
            onClick={handleClearSpawn}
            className="text-red-400 hover:text-red-300 text-xs"
            title="Clear spawn point"
          >
            Clear
          </button>
        )}
      </div>
      
      {!spawnState.coordinates && (
        <button
          onClick={handleSpawnClick}
          className={`w-full py-2 px-4 rounded font-medium transition-colors ${
            spawnState.isPlacing
              ? 'bg-orange-600 hover:bg-orange-700 text-white'
              : 'bg-lapis-lazuli hover:bg-lapis-lazuli/80 text-white'
          }`}
        >
          {spawnState.isPlacing
            ? 'Click on map to place spawn'
            : 'Set Spawn Point'
          }
        </button>
      )}
      
      {spawnState.isPlacing && (
        <div className="text-xs text-yellow-300 bg-yellow-900/20 p-2 rounded">
          Click anywhere on the map to set the spawn point
        </div>
      )}
      
      {spawnState.coordinates && !spawnState.isPlacing && (
        <>
          <div className="text-xs text-gray-300 bg-gray-700 p-2 rounded font-mono">
            <div className="flex items-center space-x-2">
              <span>X:</span>
              {editingX ? (
                <input
                  type="number"
                  value={tempX}
                  onChange={(e) => setTempX(e.target.value)}
                  onBlur={handleXSave}
                  onKeyDown={handleXKeyPress}
                  className="bg-input-bg text-input-text px-2 py-1 rounded text-xs w-20 border border-input-border focus:border-lapis-lighter focus:outline-none"
                  autoFocus
                />
              ) : (
                <span 
                  className="cursor-pointer hover:text-white transition-colors px-1 rounded hover:bg-gray-600"
                  onClick={handleXEdit}
                  title="Click to edit X coordinate"
                >
                  {Math.round(spawnState.coordinates.x)}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span>Y:</span>
              {editingY ? (
                <input
                  type="number"
                  value={tempY}
                  onChange={(e) => setTempY(e.target.value)}
                  onBlur={handleYSave}
                  onKeyDown={handleYKeyPress}
                  className="bg-input-bg text-input-text px-2 py-1 rounded text-xs w-20 border border-input-border focus:border-lapis-lighter focus:outline-none"
                  autoFocus
                />
              ) : (
                <span 
                  className="cursor-pointer hover:text-white transition-colors px-1 rounded hover:bg-gray-600"
                  onClick={handleYEdit}
                  title="Click to edit Y coordinate (manual)"
                >
                  {Math.round(spawnState.coordinates.y)}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span>Z:</span>
              {editingZ ? (
                <input
                  type="number"
                  value={tempZ}
                  onChange={(e) => setTempZ(e.target.value)}
                  onBlur={handleZSave}
                  onKeyDown={handleZKeyPress}
                  className="bg-input-bg text-input-text px-2 py-1 rounded text-xs w-20 border border-input-border focus:border-lapis-lighter focus:outline-none"
                  autoFocus
                />
              ) : (
                <span 
                  className="cursor-pointer hover:text-white transition-colors px-1 rounded hover:bg-gray-600"
                  onClick={handleZEdit}
                  title="Click to edit Z coordinate"
                >
                  {Math.round(spawnState.coordinates.z)}
                </span>
              )}
            </div>
          </div>
          
          <div className="text-xs text-gray-300 bg-gray-700 p-2 rounded font-mono">
            <div className="flex items-center space-x-2">
              <span>Radius:</span>
              {editingRadius ? (
                <input
                  type="number"
                  value={tempRadius}
                  onChange={(e) => setTempRadius(e.target.value)}
                  onBlur={handleRadiusSave}
                  onKeyDown={handleRadiusKeyPress}
                  className="bg-input-bg text-input-text px-2 py-1 rounded text-xs w-20 border border-input-border focus:border-lapis-lighter focus:outline-none"
                  autoFocus
                  min="1"
                />
              ) : (
                <span 
                  className="cursor-pointer hover:text-white transition-colors px-1 rounded hover:bg-gray-600"
                  onClick={handleRadiusEdit}
                  title="Click to edit spawn radius"
                >
                  {spawnState.radius}
                </span>
              )}
              <span className="text-gray-400">blocks</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
