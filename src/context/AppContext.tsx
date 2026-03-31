import { createContext, useContext, ReactNode } from 'react'
import { useRegions } from '../hooks/useRegions'
import { useMapState } from '../hooks/useMapState'
import { useWorldName } from '../hooks/useWorldName'
import { useSpawn } from '../hooks/useSpawn'
import { useMapCanvas } from '../hooks/useMapCanvas'
import { useCustomMarkers } from '../hooks/useCustomMarkers'
import { useSeedInfo } from '../hooks/useSeedInfo'
import { useToast } from '../hooks/useToast'
import { useBiomeLabelVisibility } from '../hooks/useBiomeLabelVisibility'
import { useRegionFillOpacity } from '../hooks/useRegionFillOpacity'
import { getValidDimension, type Dimension } from '../utils/dimensionUtils'
import { useRegionForgeYamlGeneration } from '../hooks/useRegionForgeYamlGeneration'

interface AppContextType {
  regions: ReturnType<typeof useRegions>
  mapState: ReturnType<typeof useMapState>
  worldName: ReturnType<typeof useWorldName>
  spawn: ReturnType<typeof useSpawn>
  mapCanvas: ReturnType<typeof useMapCanvas>
  customMarkers: ReturnType<typeof useCustomMarkers>
  seedInfo: ReturnType<typeof useSeedInfo>
  dimension: Dimension
  toast: ReturnType<typeof useToast>
  biomeLabelVisibility: ReturnType<typeof useBiomeLabelVisibility>
  regionFillOpacity: ReturnType<typeof useRegionFillOpacity>
  regionForgeYaml: ReturnType<typeof useRegionForgeYamlGeneration>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const seedInfo = useSeedInfo()
  const dimension = getValidDimension(seedInfo.seedInfo.dimension)
  const regions = useRegions(dimension)
  const mapState = useMapState()
  const worldName = useWorldName()
  const spawn = useSpawn()
  const mapCanvas = useMapCanvas()
  const customMarkers = useCustomMarkers()
  const toast = useToast()
  const biomeLabelVisibility = useBiomeLabelVisibility()
  const regionFillOpacity = useRegionFillOpacity()
  const regionForgeYaml = useRegionForgeYamlGeneration()

  return (
    <AppContext.Provider value={{ regions, mapState, worldName, spawn, mapCanvas, customMarkers, seedInfo, dimension, toast, biomeLabelVisibility, regionFillOpacity, regionForgeYaml }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}
