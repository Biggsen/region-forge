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

interface AppContextType {
  regions: ReturnType<typeof useRegions>
  mapState: ReturnType<typeof useMapState>
  worldName: ReturnType<typeof useWorldName>
  spawn: ReturnType<typeof useSpawn>
  mapCanvas: ReturnType<typeof useMapCanvas>
  customMarkers: ReturnType<typeof useCustomMarkers>
  seedInfo: ReturnType<typeof useSeedInfo>
  toast: ReturnType<typeof useToast>
  biomeLabelVisibility: ReturnType<typeof useBiomeLabelVisibility>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const seedInfo = useSeedInfo()
  const dimension = seedInfo.seedInfo.dimension === 'overworld' || seedInfo.seedInfo.dimension === 'nether' 
    ? seedInfo.seedInfo.dimension 
    : 'overworld'
  const regions = useRegions(dimension)
  const mapState = useMapState()
  const worldName = useWorldName()
  const spawn = useSpawn()
  const mapCanvas = useMapCanvas()
  const customMarkers = useCustomMarkers()
  const toast = useToast()
  const biomeLabelVisibility = useBiomeLabelVisibility()

  return (
    <AppContext.Provider value={{ regions, mapState, worldName, spawn, mapCanvas, customMarkers, seedInfo, toast, biomeLabelVisibility }}>
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
