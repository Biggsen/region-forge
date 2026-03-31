import { useState, useEffect } from 'react'
import { AppProvider, useAppContext } from '../context/AppContext'
import { MapCanvas } from './MapCanvas'
import { RegionPanel } from './RegionPanel'
import { ExportPanel } from './ExportPanel'
import { AdvancedPanel } from './AdvancedPanel'
import { LoadingOverlay } from './LoadingOverlay'
import { ImageImportHandler } from './ImageImportHandler'
import { MapLoaderControls } from './MapLoaderControls'
import { ToastContainer } from './ToastContainer'
import { AppHeader, type TabType } from './AppHeader'
import { exportCompleteMap } from '../utils/exportUtils'
import { loadActiveTab, saveActiveTab, loadImageDetails } from '../utils/persistenceUtils'
import { Map, Edit3, Download, Settings } from 'lucide-react'
import { useDataChanged } from '../hooks/useDataChanged'
import { useAdvancedFeatures } from '../hooks/useAdvancedFeatures'
import { useProjectImport } from '../hooks/useProjectImport'
import { getSpawnExportData } from '../utils/spawnUtils'
import { ImportConfirmationModal } from './ImportConfirmationModal'

function MainAppContent() {
  const { regions, mapState, worldName, spawn, seedInfo, dimension, toast, regionForgeYaml } = useAppContext()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>(loadActiveTab())
  const [showImportModal, setShowImportModal] = useState(false)
  const [importCallback, setImportCallback] = useState<((deleteRegions: boolean) => void) | null>(null)

  const spawnData = getSpawnExportData(spawn.spawnState)
  const { hasChanged, markAsSaved } = useDataChanged(
    regions.regions,
    mapState.mapState,
    worldName.worldName,
    spawnData,
    dimension
  )

  const { fileInputRef, handleFileImport } = useProjectImport({
    markAsSaved,
    setRegionForgeYamlGenerationFromImport: regionForgeYaml.setRegionForgeYamlGenerationFromImport,
  })

  const showAdvancedTab = useAdvancedFeatures()
  const tabs = [
    { id: 'map' as const, label: 'Map', icon: Map },
    { id: 'regions' as const, label: 'Regions', icon: Edit3 },
    { id: 'export' as const, label: 'Export', icon: Download },
    ...(showAdvancedTab ? [{ id: 'advanced' as const, label: 'Advanced', icon: Settings }] : [])
  ]

  const hasExistingData =
    regions.regions.length > 0 ||
    (mapState.mapState.terrainImage ?? mapState.mapState.biomeImage ?? mapState.mapState.image) !== null ||
    worldName.worldName !== 'world' ||
    spawn.spawnState.coordinates !== null

  const handleSave = async () => {
    const imageDetails = loadImageDetails()
    await exportCompleteMap(
      regions.regions,
      mapState.mapState,
      worldName.worldName,
      toast.showToast,
      regionForgeYaml.regionForgeYamlGeneration,
      spawnData,
      dimension,
      seedInfo.seedInfo.seed,
      imageDetails?.worldSize,
      imageDetails?.imageSize
    )
    markAsSaved()
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    saveActiveTab(tab)
  }

  const showImportConfirmation = (callback: (deleteRegions: boolean) => void) => {
    setImportCallback(() => callback)
    setShowImportModal(true)
  }

  const confirmImport = (deleteRegions: boolean) => {
    if (importCallback) {
      importCallback(deleteRegions)
    }
    setShowImportModal(false)
    setImportCallback(null)
  }

  const cancelImport = () => {
    setShowImportModal(false)
    setImportCallback(null)
  }

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <ImageImportHandler />
      <div className="h-screen bg-gray-900 text-white flex flex-col relative">
        <AppHeader
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onSave={handleSave}
          hasChanged={hasChanged}
          hasExistingData={hasExistingData}
          fileInputRef={fileInputRef}
          onFileImport={handleFileImport}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="w-96 bg-eerie-back p-4 overflow-y-auto border-r border-gunmetal">
            {activeTab === 'map' && (
              <MapLoaderControls onShowImportConfirmation={showImportConfirmation} />
            )}
            {activeTab === 'regions' && <RegionPanel />}
            {activeTab === 'export' && <ExportPanel />}
            {activeTab === 'advanced' && <AdvancedPanel />}
          </div>

          <div className="flex-1 h-full">
            <MapCanvas onNavigateToRegions={() => handleTabChange('regions')} />
          </div>
        </div>

        {isLoading && <LoadingOverlay />}

        <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />

        <ImportConfirmationModal
          isOpen={showImportModal}
          onConfirm={confirmImport}
          onCancel={cancelImport}
        />
      </div>
    </>
  )
}

function MainApp() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  )
}

export default MainApp
