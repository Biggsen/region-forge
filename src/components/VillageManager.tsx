import { useState } from 'react'

interface Subregion {
  id: string
  name: string
  x: number
  z: number
  y?: number
  details?: string
}

interface VillageManagerProps {
  subregions: Subregion[]
  regionId: string
  onRemoveSubregion: (regionId: string, subregionId: string) => void
  onUpdateSubregionName: (regionId: string, subregionId: string, newName: string) => void
}

export function VillageManager({ 
  subregions, 
  regionId, 
  onRemoveSubregion, 
  onUpdateSubregionName 
}: VillageManagerProps) {
  const [editingVillageId, setEditingVillageId] = useState<string | null>(null)
  const [editingVillageName, setEditingVillageName] = useState('')

  const handleStartVillageRename = (villageId: string, currentName: string) => {
    setEditingVillageId(villageId)
    setEditingVillageName(currentName)
  }

  const handleSaveVillageRename = () => {
    if (editingVillageId && editingVillageName.trim()) {
      onUpdateSubregionName(regionId, editingVillageId, editingVillageName.trim())
      setEditingVillageId(null)
      setEditingVillageName('')
    }
  }

  const handleCancelVillageRename = () => {
    setEditingVillageId(null)
    setEditingVillageName('')
  }

  if (!subregions || subregions.length === 0) {
    return null
  }

  return (
    <div>
      <h4 className="text-sm font-medium mb-2">Villages ({subregions.length})</h4>
      <div className="space-y-2">
        {subregions.map(subregion => (
          <div key={subregion.id} className="bg-gray-600 rounded p-2 text-sm">
            {editingVillageId === subregion.id ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-1">
                  <input
                    type="text"
                    value={editingVillageName}
                    onChange={(e) => setEditingVillageName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveVillageRename()
                      } else if (e.key === 'Escape') {
                        handleCancelVillageRename()
                      }
                    }}
                    className="flex-1 bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-500 focus:outline-none focus:border-lapis-lazuli/80"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveVillageRename}
                    className="text-zomp/80 hover:text-zomp text-xs px-1"
                    title="Save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleCancelVillageRename}
                    className="text-gray-400 hover:text-gray-300 text-xs px-1"
                    title="Cancel"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-gray-400 text-xs">
                  ({subregion.x}, {subregion.y != null ? subregion.y : '—'}, {subregion.z}){subregion.details ? ` - ${subregion.details}` : ''}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center">
                  <span 
                    className="cursor-pointer hover:text-lapis-lazuli/80 transition-colors"
                    onClick={() => handleStartVillageRename(subregion.id, subregion.name)}
                    title="Click to rename"
                  >
                    {subregion.name}
                  </span>
                  <button
                    onClick={() => onRemoveSubregion(regionId, subregion.id)}
                    className="text-red-400 hover:text-red-300 text-xs"
                    title="Remove village"
                  >
                    ×
                  </button>
                </div>
                <div className="text-gray-400 text-xs">
                  ({subregion.x}, {subregion.y != null ? subregion.y : '—'}, {subregion.z}){subregion.details ? ` - ${subregion.details}` : ''}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
