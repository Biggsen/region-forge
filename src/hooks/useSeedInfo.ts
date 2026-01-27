import { useState, useCallback, useEffect } from 'react'

const WORLD_SEED_STORAGE_KEY = 'mc-region-maker-world-seed'
const WORLD_TYPE_STORAGE_KEY = 'mc-region-maker-world-type'

export interface SeedInfo {
  seed?: string
  dimension?: 'overworld' | 'nether' | 'end'
}

export function useSeedInfo() {
  const [seedInfo, setSeedInfo] = useState<SeedInfo>({})

  // Load seed info from localStorage on mount and migrate worldType if needed
  useEffect(() => {
    try {
      const saved = localStorage.getItem(WORLD_SEED_STORAGE_KEY)
      let parsed: SeedInfo = {}
      if (saved) {
        parsed = JSON.parse(saved) || {}
      }
      
      // Migration: if dimension doesn't exist but worldType does, copy it
      if (!parsed.dimension) {
        const oldWorldType = localStorage.getItem(WORLD_TYPE_STORAGE_KEY)
        if (oldWorldType === 'overworld' || oldWorldType === 'nether') {
          parsed.dimension = oldWorldType as 'overworld' | 'nether'
          // Save the migrated data
          localStorage.setItem(WORLD_SEED_STORAGE_KEY, JSON.stringify(parsed))
          // Clear the old worldType from localStorage
          localStorage.removeItem(WORLD_TYPE_STORAGE_KEY)
        }
      }
      
      setSeedInfo(parsed)
    } catch (error) {
      console.warn('Failed to load seed info from localStorage:', error)
    }
  }, [])

  const updateSeedInfo = useCallback((info: Partial<SeedInfo>) => {
    setSeedInfo(prev => {
      const updated = { ...prev, ...info }
      
      // Save to localStorage
      try {
        localStorage.setItem(WORLD_SEED_STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        console.warn('Failed to save seed info to localStorage:', error)
      }
      
      return updated
    })
  }, [])

  return {
    seedInfo,
    updateSeedInfo
  }
}

