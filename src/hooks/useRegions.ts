import { useState, useCallback, useEffect } from 'react'
import { Region, EditMode, HighlightMode, ChallengeLevel } from '../types'
import { DEFAULT_EDIT_MODE, editModeForEditing, editModeForMove, editModeForSplit } from '../utils/editModeUtils'
import { generateId, generateRegionYAML, moveRegionPoints, calculateRegionCenter, warpRegionPoints, resizeRegionPoints, doublePolygonVertices, halvePolygonVertices, simplifyPolygonVertices, splitPolygon, findClosestPointOnPolygonEdge } from '../utils/polygonUtils'
import { saveRegions, loadRegions, saveSelectedRegion, loadSelectedRegion } from '../utils/persistenceUtils'
import { parseVillageCSV, createVillageSubregion, findParentRegion } from '../utils/villageUtils'
import { generateVillageNameByWorldType } from '../utils/nameGenerator'

export function useRegions(dimension: 'overworld' | 'nether' | 'end' = 'overworld') {
  const [regions, setRegions] = useState<Region[]>([])
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null)
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null)
  const [drawingRegion, setDrawingRegion] = useState<Region | null>(null)
  const [freehandEnabled, setFreehandEnabled] = useState<boolean>(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [editMode, setEditMode] = useState<EditMode>(DEFAULT_EDIT_MODE)
  const [highlightMode, setHighlightMode] = useState<HighlightMode>({
    highlightAll: false,
    showRegions: true,
    showVillages: true,
    showCenterPoints: true,
    showChallengeLevels: false,
    showGrid: false,
    showNames: true
  })
  const [isolatedRegionId, setIsolatedRegionId] = useState<string | null>(null)

  // Load saved data on mount
  useEffect(() => {
    const savedRegions = loadRegions()
    const savedSelectedRegion = loadSelectedRegion()
    
    // Migrate old challenge level names to new difficulty band names
    const migrateChallengLevel = (level?: string): ChallengeLevel => {
      const oldToNew: Record<string, ChallengeLevel> = {
        'Vanilla': 'easy',
        'Bronze': 'normal',
        'Silver': 'hard',
        'Gold': 'severe',
        'Platinum': 'deadly'
      }
      if (!level) return 'easy'
      return oldToNew[level] || (level as ChallengeLevel)
    }

    // Migrate existing regions to include centerPoint, challengeLevel, hasSpawn, originalPoints, scaleFactor, and labelPosition
    const migratedRegions = savedRegions.map(region => ({
      ...region,
      centerPoint: region.centerPoint || null,
      challengeLevel: migrateChallengLevel(region.challengeLevel),
      hasSpawn: region.hasSpawn || false,
      originalPoints: region.originalPoints || region.points, // Use current points as original if not set
      scaleFactor: region.scaleFactor || 1.0, // Default to 100% scale
      labelPosition: region.labelPosition ?? null
    }))
    
    setRegions(migratedRegions)
    setSelectedRegionId(savedSelectedRegion)
    setIsInitialized(true)
  }, [])

  // Save regions whenever they change (but not during initial load)
  useEffect(() => {
    if (isInitialized) {
      saveRegions(regions)
    }
  }, [regions, isInitialized])

  // Save selected region whenever it changes (but not during initial load)
  useEffect(() => {
    if (isInitialized) {
      saveSelectedRegion(selectedRegionId)
    }
  }, [selectedRegionId, isInitialized])

  const addRegion = useCallback((region: Omit<Region, 'id'>) => {
    // Check for duplicate names (case-insensitive)
    const trimmedName = region.name.trim()
    const isDuplicate = regions.some(r => r.name.trim().toLowerCase() === trimmedName.toLowerCase())
    
    if (isDuplicate) {
      return false // Return false if duplicate name exists
    }
    
    const newRegion: Region = {
      ...region,
      name: trimmedName,
      id: generateId(),
      originalPoints: region.points, // Store original points for resizing
      scaleFactor: region.scaleFactor || 1.0 // Default to 100% scale
    }
    setRegions(prev => [...prev, newRegion])
    setSelectedRegionId(newRegion.id)
    setDrawingRegion(null)
    return true // Return true on success
  }, [regions])

  const updateRegion = useCallback((id: string, updates: Partial<Region>) => {
    // Check for duplicate names if name is being updated (case-insensitive)
    if (updates.name !== undefined) {
      const trimmedName = updates.name.trim()
      const isDuplicate = regions.some(r => 
        r.id !== id && r.name.trim().toLowerCase() === trimmedName.toLowerCase()
      )
      
      if (isDuplicate) {
        return false // Return false if duplicate name exists
      }
      
      updates.name = trimmedName
    }
    
    setRegions(prev => prev.map(region => 
      region.id === id ? { ...region, ...updates } : region
    ))
    return true // Return true on success
  }, [regions])

  const deleteRegion = useCallback((id: string) => {
    setRegions(prev => prev.filter(region => region.id !== id))
    if (selectedRegionId === id) {
      setSelectedRegionId(null)
    }
    if (isolatedRegionId === id) {
      setIsolatedRegionId(null)
    }
    if (editMode.editingRegionId === id) {
      setEditMode(DEFAULT_EDIT_MODE)
    }
  }, [selectedRegionId, editMode.editingRegionId, isolatedRegionId])

  const startDrawingRegion = useCallback((name: string) => {
    const newRegion: Region = {
      id: generateId(),
      name,
      points: [],
      centerPoint: null,
      challengeLevel: 'easy',
      hasSpawn: false
    }
    setDrawingRegion(newRegion)
    setEditMode(DEFAULT_EDIT_MODE)
  }, [])

  const addPointToDrawing = useCallback((x: number, z: number) => {
    if (!drawingRegion) return
    
    setDrawingRegion(prev => prev ? {
      ...prev,
      points: [...prev.points, { x, z }]
    } : null)
  }, [drawingRegion])

  const finishDrawingRegion = useCallback(() => {
    if (drawingRegion && drawingRegion.points.length >= 3) {
      // If freehand, lightly simplify before saving to reduce noise
      const points = freehandEnabled
        ? simplifyPolygonVertices(drawingRegion.points, 3)
        : drawingRegion.points

      const success = addRegion({
        ...drawingRegion,
        points
      })
      
      if (!success) {
        // Duplicate name detected - this shouldn't happen if validation in RegionCreationForm works,
        // but we'll keep the drawing region so user can fix the name
        console.warn('Cannot add region: duplicate name detected')
        return false
      }
      return true
    }
    return false
  }, [drawingRegion, freehandEnabled, addRegion])

  const cancelDrawingRegion = useCallback(() => {
    setDrawingRegion(null)
  }, [])

  const getSelectedRegion = useCallback(() => {
    return regions.find(region => region.id === selectedRegionId) || null
  }, [regions, selectedRegionId])

  const getRegionYAML = useCallback((regionId: string, includeVillages: boolean = true) => {
    const region = regions.find(r => r.id === regionId)
    return region ? generateRegionYAML(region, includeVillages) : ''
  }, [regions])

  const replaceRegions = useCallback((newRegions: Region[]) => {
    setRegions(newRegions)
  }, [])

  // Edit mode functions
  const startEditMode = useCallback((regionId: string) => {
    setEditMode(editModeForEditing(regionId))
    setSelectedRegionId(regionId)
  }, [])

  const stopEditMode = useCallback(() => {
    setEditMode(DEFAULT_EDIT_MODE)
  }, [])

  const startDraggingPoint = useCallback((regionId: string, pointIndex: number) => {
    setEditMode(prev => ({
      ...prev,
      editingRegionId: regionId,
      draggingPointIndex: pointIndex
    }))
  }, [])

  const stopDraggingPoint = useCallback(() => {
    setEditMode(prev => ({
      ...prev,
      draggingPointIndex: null
    }))
  }, [])

  const updatePointPosition = useCallback((regionId: string, pointIndex: number, x: number, z: number) => {
    setRegions(prev => prev.map(region => {
      if (region.id === regionId) {
        const newPoints = [...region.points]
        newPoints[pointIndex] = { x, z }
        return { ...region, points: newPoints }
      }
      return region
    }))
  }, [])

  const addPointToRegion = useCallback((regionId: string, pointIndex: number, x: number, z: number) => {
    setRegions(prev => prev.map(region => {
      if (region.id === regionId) {
        const newPoints = [...region.points]
        newPoints.splice(pointIndex, 0, { x, z })
        return { ...region, points: newPoints }
      }
      return region
    }))
  }, [])

  const removePointFromRegion = useCallback((regionId: string, pointIndex: number) => {
    setRegions(prev => prev.map(region => {
      if (region.id === regionId) {
        const newPoints = [...region.points]
        newPoints.splice(pointIndex, 1)
        // Ensure we have at least 3 points for a valid polygon
        if (newPoints.length >= 3) {
          return { ...region, points: newPoints }
        }
        // If less than 3 points, don't update (prevent invalid polygon)
        return region
      }
      return region
    }))
  }, [])

  const warpRegion = useCallback((regionId: string, centerX: number, centerZ: number, radius: number, strength: number) => {
    setRegions(prev => prev.map(region => {
      if (region.id === regionId) {
        const newPoints = warpRegionPoints(region.points, centerX, centerZ, radius, strength)
        return { ...region, points: newPoints }
      }
      return region
    }))
  }, [])

  const resizeRegion = useCallback((regionId: string, scaleFactor: number) => {
    setRegions(prev => prev.map(region => {
      if (region.id === regionId) {
        // Calculate relative scale change from current scale factor
        const currentScaleFactor = region.scaleFactor || 1.0
        const relativeScaleFactor = scaleFactor / currentScaleFactor
        
        // Use current points for scaling to maintain current position
        const pointsToScale = region.points
        // Use the region's center point if available, otherwise calculate it from current points
        const center = region.centerPoint || calculateRegionCenter(region)
        const newPoints = resizeRegionPoints(pointsToScale, center.x, center.z, relativeScaleFactor)
        return { ...region, points: newPoints, scaleFactor }
      }
      return region
    }))
  }, [])

  const doubleRegionVertices = useCallback((regionId: string) => {
    setRegions(prev => prev.map(region => {
      if (region.id === regionId) {
        return { ...region, points: doublePolygonVertices(region.points) }
      }
      return region
    }))
  }, [])

  const halveRegionVertices = useCallback((regionId: string) => {
    setRegions(prev => prev.map(region => {
      if (region.id === regionId) {
        return { ...region, points: halvePolygonVertices(region.points) }
      }
      return region
    }))
  }, [])

  const simplifyRegionVertices = useCallback((regionId: string, tolerance: number) => {
    setRegions(prev => prev.map(region => {
      if (region.id === regionId) {
        return { ...region, points: simplifyPolygonVertices(region.points, tolerance) }
      }
      return region
    }))
  }, [])

  // Move region functions
  const startMoveRegion = useCallback((regionId: string, startX: number, startZ: number) => {
    const region = regions.find(r => r.id === regionId)
    if (!region) return
    setEditMode(editModeForMove(regionId, startX, startZ, [...region.points]))
    setSelectedRegionId(regionId)
  }, [regions])

  const updateMoveRegion = useCallback((currentX: number, currentZ: number) => {
    if (!editMode.isMovingRegion || !editMode.movingRegionId || !editMode.moveStartPosition || !editMode.originalRegionPoints) return

    const offsetX = currentX - editMode.moveStartPosition.x
    const offsetZ = currentZ - editMode.moveStartPosition.z

    setRegions(prev => prev.map(region => {
      if (region.id === editMode.movingRegionId) {
        // Use original points for preview, not the current modified points
        const newPoints = moveRegionPoints(editMode.originalRegionPoints!, offsetX, offsetZ)
        return { ...region, points: newPoints }
      }
      return region
    }))
  }, [editMode.isMovingRegion, editMode.movingRegionId, editMode.moveStartPosition, editMode.originalRegionPoints])

  const moveRegionToPosition = useCallback((regionId: string, targetX: number, targetZ: number) => {
    const region = regions.find(r => r.id === regionId)
    if (!region) return

    // Calculate the current center of the region
    const currentCenter = calculateRegionCenter(region)
    
    // Calculate the offset needed to move the center to the target position
    const offsetX = targetX - currentCenter.x
    const offsetZ = targetZ - currentCenter.z

    setRegions(prev => prev.map(r => {
      if (r.id === regionId) {
        const newPoints = moveRegionPoints(r.points, offsetX, offsetZ)
        return { ...r, points: newPoints }
      }
      return r
    }))
  }, [regions])

  const finishMoveRegion = useCallback(() => {
    setEditMode(prev => ({
      ...prev,
      isMovingRegion: false,
      movingRegionId: null,
      moveStartPosition: null,
      originalRegionPoints: null
    }))
  }, [])

  const cancelMoveRegion = useCallback(() => {
    if (!editMode.movingRegionId || !editMode.originalRegionPoints) return

    // Restore original points
    setRegions(prev => prev.map(region => {
      if (region.id === editMode.movingRegionId) {
        return { ...region, points: [...editMode.originalRegionPoints!] }
      }
      return region
    }))

    setEditMode(prev => ({
      ...prev,
      isMovingRegion: false,
      movingRegionId: null,
      moveStartPosition: null,
      originalRegionPoints: null
    }))
  }, [editMode.movingRegionId, editMode.originalRegionPoints])

  const toggleHighlightAll = useCallback(() => {
    setHighlightMode(prev => ({ ...prev, highlightAll: !prev.highlightAll }))
  }, [])

  const toggleShowRegions = useCallback(() => {
    setHighlightMode(prev => ({ ...prev, showRegions: !prev.showRegions }))
  }, [])

  const toggleShowVillages = useCallback(() => {
    setHighlightMode(prev => ({ ...prev, showVillages: !prev.showVillages }))
  }, [])

  const toggleShowCenterPoints = useCallback(() => {
    setHighlightMode(prev => ({ ...prev, showCenterPoints: !prev.showCenterPoints }))
  }, [])

  const toggleShowChallengeLevels = useCallback(() => {
    setHighlightMode(prev => ({ ...prev, showChallengeLevels: !prev.showChallengeLevels }))
  }, [])

  const toggleShowGrid = useCallback(() => {
    setHighlightMode(prev => ({ ...prev, showGrid: !prev.showGrid }))
  }, [])

  const toggleShowNames = useCallback(() => {
    setHighlightMode(prev => ({ ...prev, showNames: !prev.showNames }))
  }, [])

  const importVillagesFromCSV = useCallback((csvContent: string) => {
    try {
      const villages = parseVillageCSV(csvContent)
      const results = {
        added: 0,
        skipped: 0,
        orphaned: 0,
        orphanedVillages: [] as { x: number; z: number; details: string; type: string }[]
      }
      
      // Track existing village names to ensure uniqueness
      const existingVillageNames = new Set<string>()
      
      // Clear existing villages first
      setRegions(prev => prev.map(region => ({
        ...region,
        subregions: (region.subregions || []).filter(sub => sub.type !== 'village')
      })))
      
      villages.forEach((village, index) => {
        const parentRegion = findParentRegion(village, regions)
        
        if (parentRegion) {
          const subregion = createVillageSubregion(village, index, parentRegion.id, existingVillageNames, dimension)
          
          // Add the new village name to our tracking set
          existingVillageNames.add(subregion.name)
          
          setRegions(prev => prev.map(region => 
            region.id === parentRegion.id 
              ? { 
                  ...region, 
                  subregions: [...(region.subregions || []), subregion] 
                }
              : region
          ))
          results.added++
        } else {
          results.orphaned++
          results.orphanedVillages.push({
            x: village.x,
            z: village.z,
            details: village.details,
            type: village.type
          })
        }
      })
      
      return results
    } catch (error) {
      console.error('Failed to import villages:', error)
      throw new Error('Failed to parse village CSV data')
    }
  }, [regions])

  const removeSubregionFromRegion = useCallback((regionId: string, subregionId: string) => {
    setRegions(prev => prev.map(region => 
      region.id === regionId 
        ? { 
            ...region, 
            subregions: (region.subregions || []).filter(sub => sub.id !== subregionId) 
          }
        : region
    ))
  }, [])

  const updateSubregionName = useCallback((regionId: string, subregionId: string, newName: string) => {
    // Check if the new name is unique among all villages
    const existingVillageNames = new Set<string>()
    
    // Collect all existing village names except the one being renamed
    regions.forEach(region => {
      if (region.subregions) {
        region.subregions.forEach(subregion => {
          if (subregion.type === 'village' && subregion.id !== subregionId) {
            existingVillageNames.add(subregion.name)
          }
        })
      }
    })
    
    // If the new name already exists, append a number to make it unique
    let finalName = newName
    if (existingVillageNames.has(newName)) {
      let counter = 1
      let baseName = newName
      while (existingVillageNames.has(finalName) && counter < 1000) {
        finalName = `${baseName} ${counter}`
        counter++
      }
    }
    
    setRegions(prev => prev.map(region => 
      region.id === regionId 
        ? { 
            ...region, 
            subregions: (region.subregions || []).map(sub => 
              sub.id === subregionId 
                ? { ...sub, name: finalName }
                : sub
            )
          }
        : region
    ))
  }, [regions])

  const regenerateVillageNames = useCallback(() => {
    setRegions(prev => {
      // Track existing village names to ensure uniqueness
      const existingVillageNames = new Set<string>()
      
      return prev.map(region => {
        if (region.subregions && region.subregions.length > 0) {
          return {
            ...region,
            subregions: region.subregions.map(subregion => {
              if (subregion.type === 'village') {
                // Generate a unique name for this village
                let newName = generateVillageNameByWorldType(dimension)
                let attempts = 0
                const maxAttempts = 100
                
                // Keep generating names until we find a unique one
                while (existingVillageNames.has(newName) && attempts < maxAttempts) {
                  newName = generateVillageNameByWorldType(dimension)
                  attempts++
                }
                
                // If we still have a duplicate after max attempts, append a number
                if (existingVillageNames.has(newName)) {
                  let counter = 1
                  let baseName = newName
                  while (existingVillageNames.has(newName) && counter < 1000) {
                    newName = `${baseName} ${counter}`
                    counter++
                  }
                }
                
                // Add the new name to our tracking set
                existingVillageNames.add(newName)
                
                return {
                  ...subregion,
                  name: newName
                }
              }
              return subregion
            })
          }
        }
        return region
      })
    })
  }, [])

  const setCustomCenterPoint = useCallback((regionId: string, centerPoint: { x: number; z: number } | null) => {
    setRegions(prev => prev.map(region => 
      region.id === regionId ? { ...region, centerPoint } : region
    ))
  }, [])

  // Split region functions
  const startSplitRegion = useCallback((regionId: string) => {
    setEditMode(editModeForSplit(regionId))
    setSelectedRegionId(regionId)
  }, [])

  const addSplitPoint = useCallback((x: number, z: number) => {
    if (!editMode.isSplittingRegion || !editMode.splittingRegionId) return

    const region = regions.find(r => r.id === editMode.splittingRegionId)
    if (!region) return

    // Find the closest point on the polygon edge
    const closestPoint = findClosestPointOnPolygonEdge({ x, z }, region.points)
    
    setEditMode(prev => ({
      ...prev,
      splitPoints: [...prev.splitPoints, closestPoint]
    }))
  }, [editMode.isSplittingRegion, editMode.splittingRegionId, regions])

  const finishSplitRegion = useCallback(() => {
    if (!editMode.isSplittingRegion || !editMode.splittingRegionId || editMode.splitPoints.length !== 2) return

    const region = regions.find(r => r.id === editMode.splittingRegionId)
    if (!region) return

    const [leftPoints, rightPoints] = splitPolygon(region.points, editMode.splitPoints[0], editMode.splitPoints[1])
    
    if (leftPoints.length >= 3 && rightPoints.length >= 3) {
      // Create two new regions
      const leftRegion: Region = {
        ...region,
        id: generateId(),
        name: `${region.name} (Left)`,
        points: leftPoints,
        originalPoints: leftPoints,
        scaleFactor: 1.0
      }
      
      const rightRegion: Region = {
        ...region,
        id: generateId(),
        name: `${region.name} (Right)`,
        points: rightPoints,
        originalPoints: rightPoints,
        scaleFactor: 1.0
      }

      // Replace the original region with the two new ones
      setRegions(prev => prev.map(r => 
        r.id === editMode.splittingRegionId ? leftRegion : r
      ).concat(rightRegion))
      
      setSelectedRegionId(leftRegion.id)
    }

    setEditMode(DEFAULT_EDIT_MODE)
  }, [editMode, regions])

  const cancelSplitRegion = useCallback(() => {
    setEditMode(DEFAULT_EDIT_MODE)
  }, [])

  const randomizeChallengeLevels = useCallback(() => {
    // Find regions with spawn and exclude them from randomization
    // Also exclude disabled regions - they keep their current level
    const spawnRegions = regions.filter(region => region.hasSpawn && !region.disabled)
    const regionsToRandomize = regions.filter(region => !region.hasSpawn && !region.disabled)
    
    // Define the balanced distribution
    const distribution = {
      deadly: 2,
      severe: 4,
      hard: 6,
      normal: 8,
      easy: Math.max(0, regionsToRandomize.length - 20) // Rest go to easy
    }
    
    // Create array of challenge levels based on distribution
    const challengeLevels: ChallengeLevel[] = []
    Object.entries(distribution).forEach(([level, count]) => {
      for (let i = 0; i < count; i++) {
        challengeLevels.push(level as ChallengeLevel)
      }
    })
    
    // Shuffle the array
    const shuffledLevels = [...challengeLevels].sort(() => Math.random() - 0.5)
    
    // Apply challenge levels to non-spawn regions
    regionsToRandomize.forEach((region, index) => {
      const challengeLevel = shuffledLevels[index] || 'easy'
      updateRegion(region.id, { challengeLevel })
    })
    
    // Ensure spawn regions are always easy
    spawnRegions.forEach(region => {
      updateRegion(region.id, { challengeLevel: 'easy' })
    })
  }, [regions, updateRegion])

  return {
    regions,
    selectedRegionId,
    hoveredRegionId,
    drawingRegion,
    freehandEnabled,
    editMode,
    highlightMode,
    isolatedRegionId,
    setIsolatedRegionId,
    addRegion,
    updateRegion,
    deleteRegion,
    setSelectedRegionId,
    setHoveredRegionId,
    replaceRegions,
    startDrawingRegion,
    addPointToDrawing,
    finishDrawingRegion,
    cancelDrawingRegion,
    setFreehandEnabled,
    getSelectedRegion,
    getRegionYAML,
    startEditMode,
    stopEditMode,
    startDraggingPoint,
    stopDraggingPoint,
    updatePointPosition,
    addPointToRegion,
    removePointFromRegion,
    startMoveRegion,
    updateMoveRegion,
    moveRegionToPosition,
    finishMoveRegion,
    cancelMoveRegion,
    toggleHighlightAll,
    toggleShowRegions,
    toggleShowVillages,
    toggleShowCenterPoints,
    toggleShowChallengeLevels,
    toggleShowGrid,
    toggleShowNames,
    importVillagesFromCSV,
    removeSubregionFromRegion,
    updateSubregionName,
    regenerateVillageNames,
    setCustomCenterPoint,
    warpRegion,
    resizeRegion,
    doubleRegionVertices,
    halveRegionVertices,
    simplifyRegionVertices,
    startSplitRegion,
    addSplitPoint,
    finishSplitRegion,
    cancelSplitRegion,
    randomizeChallengeLevels
  }
}
