import { useState, useEffect, useRef } from 'react'
import { AppProvider, useAppContext } from '../context/AppContext'
import { MapCanvas } from './MapCanvas'
import { RegionPanel } from './RegionPanel'
import { ExportPanel } from './ExportPanel'
import { AdvancedPanel } from './AdvancedPanel'
import { LoadingOverlay } from './LoadingOverlay'
import { ImageImportHandler } from './ImageImportHandler'
import { MapLoaderControls } from './MapLoaderControls'
import { ToastContainer } from './ToastContainer'
import { exportCompleteMap, importMapData, loadImageFromSrc, loadImageFromBase64 } from '../utils/exportUtils'
import { saveActiveTab, loadActiveTab, loadImageDetails, saveImageDetails, saveExportSettings, ImageDetails, ExportSettings } from '../utils/persistenceUtils'
import { validateImageDimensions } from '../utils/imageValidation'
import { Map, Edit3, Download, FolderOpen, Save, Settings } from 'lucide-react'
import { ImportConfirmationModal } from './ImportConfirmationModal'
import { Button } from './Button'
import { useDataChanged } from '../hooks/useDataChanged'

type TabType = 'map' | 'regions' | 'export' | 'advanced'

function TabNavigation({ activeTab, onTabChange }: { activeTab: TabType; onTabChange: (tab: TabType) => void }) {
  const { regions, mapState, worldName, spawn, seedInfo, toast } = useAppContext()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showLoadModal, setShowLoadModal] = useState(false)
  
  // Check URL parameter for advanced features
  const urlParams = new URLSearchParams(window.location.search)
  const showAdvancedTab = urlParams.get('advanced') === 'true'
  
  const tabs = [
    { id: 'map', label: 'Map', icon: Map },
    { id: 'regions', label: 'Regions', icon: Edit3 },
    { id: 'export', label: 'Export', icon: Download },
    ...(showAdvancedTab ? [{ id: 'advanced', label: 'Advanced', icon: Settings }] : [])
  ] as const

  const spawnData = spawn.spawnState.coordinates ? {
    x: spawn.spawnState.coordinates.x,
    z: spawn.spawnState.coordinates.z,
    radius: spawn.spawnState.radius
  } : null

  const dimension = seedInfo.seedInfo.dimension === 'overworld' || seedInfo.seedInfo.dimension === 'nether' 
    ? seedInfo.seedInfo.dimension 
    : 'overworld'
  const { hasChanged, markAsSaved } = useDataChanged(
    regions.regions,
    mapState.mapState,
    worldName.worldName,
    spawnData,
    dimension
  )

  const handleSave = async () => {
    // Load image details for export
    const imageDetails = loadImageDetails()
    const dimension = seedInfo.seedInfo.dimension === 'overworld' || seedInfo.seedInfo.dimension === 'nether' 
      ? seedInfo.seedInfo.dimension 
      : 'overworld'
    
    await exportCompleteMap(
      regions.regions, 
      mapState.mapState, 
      worldName.worldName, 
      spawnData, 
      dimension,
      seedInfo.seedInfo.seed,
      imageDetails?.worldSize,
      imageDetails?.imageSize,
      toast.showToast
    )
    markAsSaved()
  }

  const hasExistingData = () => {
    return (
      regions.regions.length > 0 ||
      (mapState.mapState.terrainImage ?? mapState.mapState.biomeImage ?? mapState.mapState.image) !== null ||
      worldName.worldName !== 'world' ||
      spawn.spawnState.coordinates !== null
    )
  }

  const handleLoadClick = () => {
    if (hasExistingData()) {
      // Show confirmation modal first
      setShowLoadModal(true)
    } else {
      // No data exists, proceed directly to file selection
      fileInputRef.current?.click()
    }
  }
  
  const confirmLoad = (deleteRegions: boolean) => {
    setShowLoadModal(false)
    // Now trigger file input after confirmation
    // Note: deleteRegions is ignored for project file loading as it replaces everything
    fileInputRef.current?.click()
  }
  
  const cancelLoad = () => {
    setShowLoadModal(false)
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const importData = await importMapData(file)
      
      if (importData.terrainImageData && importData.biomeImageData) {
        try {
          const [terrainImg, biomeImg] = await Promise.all([
            loadImageFromBase64(importData.terrainImageData),
            loadImageFromBase64(importData.biomeImageData)
          ])
          const tVal = validateImageDimensions(terrainImg.width, terrainImg.height)
          const bVal = validateImageDimensions(biomeImg.width, biomeImg.height)
          if (!tVal.isValid || !bVal.isValid) {
            toast.showToast(tVal.error || bVal.error || 'Image validation failed', 'error')
          } else if (terrainImg.width !== biomeImg.width || terrainImg.height !== biomeImg.height) {
            toast.showToast('Terrain and biome layers have mismatched dimensions', 'error')
          } else {
            mapState.setTerrainImage(terrainImg)
            mapState.setBiomeImage(biomeImg)
          }
        } catch (error) {
          console.warn('Failed to load dual layers, continuing without images')
        }
      } else if (importData.terrainImageData) {
        try {
          const image = await loadImageFromBase64(importData.terrainImageData)
          const validation = validateImageDimensions(image.width, image.height)
          if (!validation.isValid) {
            toast.showToast(validation.error || 'Image validation failed', 'error')
          } else {
            mapState.setTerrainImage(image)
            mapState.setBiomeImage(null)
          }
        } catch (error) {
          console.warn('Failed to load terrain image, continuing without image')
        }
      } else if ('imageData' in importData && importData.imageData) {
        try {
          const image = await loadImageFromBase64(importData.imageData)
          const validation = validateImageDimensions(image.width, image.height)
          if (!validation.isValid) {
            toast.showToast(validation.error || 'Image validation failed', 'error')
          } else {
            mapState.setImage(image)
          }
        } catch (error) {
          console.warn('Failed to load embedded image, continuing without image')
        }
      } else if (importData.mapState.imageSrc) {
        // Legacy format with image source URL
        try {
          const image = await loadImageFromSrc(importData.mapState.imageSrc)
          const validation = validateImageDimensions(image.width, image.height)
          if (!validation.isValid) {
            toast.showToast(validation.error || 'Image validation failed', 'error')
          } else {
            mapState.setImage(image)
          }
        } catch (error) {
          console.warn('Failed to load image from import, continuing without image')
        }
      }

      // Update map state
      mapState.setScale(importData.mapState.scale)
      mapState.setOffset(importData.mapState.offsetX, importData.mapState.offsetY)
      mapState.setOriginSelected(importData.mapState.originSelected)
      if (importData.mapState.originOffset) {
        mapState.setOriginOffset(importData.mapState.originOffset)
      }

      // Replace all regions
      regions.replaceRegions(importData.regions)
      regions.setSelectedRegionId(null)

      // Always update world name - use import data or default to 'world'
      worldName.updateWorldName(importData.worldName || 'world')

      // Update spawn coordinates if they exist in import data
      if (importData.spawnCoordinates) {
        spawn.setSpawnCoordinates(importData.spawnCoordinates)
        // Update radius if it exists in import data
        if (importData.spawnCoordinates.radius) {
          spawn.setSpawnRadius(importData.spawnCoordinates.radius)
        }
      }

      // Always update seed/dimension - clear if missing from import data
      // Migration: if old export has worldType but no dimension, copy it
      let dimensionToUse = importData.dimension
      if (!dimensionToUse && importData.worldType) {
        // Migrate from old worldType field
        if (importData.worldType === 'overworld' || importData.worldType === 'nether') {
          dimensionToUse = importData.worldType
        } else {
          // If worldType is 'end' or invalid, default to 'overworld'
          dimensionToUse = 'overworld'
        }
      }
      // Pass undefined explicitly to clear values (JSON.stringify will omit them when saving)
      seedInfo.updateSeedInfo({
        seed: importData.seed,
        dimension: dimensionToUse
      })

      // Always update world size and image size - clear if missing from import data
      const currentDetails = loadImageDetails() || {}
      const updatedDetails: ImageDetails = { ...currentDetails }
      
      // Set or remove worldSize based on import data
      if (importData.worldSize !== undefined) {
        updatedDetails.worldSize = importData.worldSize
      } else {
        delete updatedDetails.worldSize
      }
      
      // Set or remove imageSize based on import data
      if (importData.imageSize !== undefined) {
        updatedDetails.imageSize = importData.imageSize
      } else {
        delete updatedDetails.imageSize
      }
      
      saveImageDetails(updatedDetails)

      // Restore export settings if they exist in import data
      if (importData.exportSettings) {
        const { randomMobSpawn: _rm, ...sanitized } = importData.exportSettings as ExportSettings & { randomMobSpawn?: boolean }
        saveExportSettings(sanitized as ExportSettings)
        // Dispatch custom event to notify ExportPanel to reload settings
        window.dispatchEvent(new Event('exportSettingsUpdated'))
      }

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Mark as saved since we just loaded from a saved file
      markAsSaved()
      toast.showToast('Project file loaded successfully', 'success')
    } catch (error) {
      toast.showToast('Failed to load project file. Please make sure it\'s a valid project file.', 'error')
      console.error('Import error:', error)
    }
  }

  return (
    <div className="flex items-center justify-between bg-eerie-back border-b border-gunmetal px-4 py-3">
      <div className="flex space-x-8">
        {tabs.map((tab) => {
          const IconComponent = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as TabType)}
              className={`text-lg py-2 font-medium transition-colors flex items-center space-x-2 relative border-b-4 ${
                activeTab === tab.id
                  ? 'text-vista-blue border-vista-blue'
                  : 'text-gray-300 hover:text-white border-transparent'
              }`}
            >
              <IconComponent size={20} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
      
      <div className="flex items-center">
        <img src="/map-on-anvil-3.png" alt="" className="h-14 mr-3" style={{ filter: 'drop-shadow(0 0 10px rgba(255, 140, 50, 0.15)) drop-shadow(0 0 20px rgba(255, 140, 50, 0.1))' }} />
        <span className="text-4xl font-bold catamaran-extrabold" style={{ 
          background: 'linear-gradient(to bottom, #B0C8CB, #6A7D80)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 12px rgba(255, 140, 50, 0.3)) drop-shadow(0 0 24px rgba(255, 140, 50, 0.2))'
        }}>Region Forge</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <a
          href="https://discord.gg/jhWemrA2xH"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mr-4"
        >
          <img src="/discord-symbol.svg" alt="Discord" className="w-6 h-6" />
          <span>Discord</span>
        </a>
        <Button 
          variant="secondary-outline"
          onClick={handleLoadClick}
          leftIcon={<FolderOpen size={16} />}
        >
          Load
        </Button>
        <Button 
          variant={hasChanged ? "primary" : "ghost"}
          onClick={handleSave}
          leftIcon={<Save size={16} />}
        >
          Save
        </Button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />
      
      <ImportConfirmationModal
        isOpen={showLoadModal}
        onConfirm={confirmLoad}
        onCancel={cancelLoad}
        title="Load Project File"
        message="Loading a project file will replace all current data, including regions, map, and settings."
        showRegionOption={false}
        confirmLabel="Load Project"
      />
    </div>
  )
}

// Component to handle image import within AppProvider context
function MainAppContent() {
  const { toast } = useAppContext()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>(loadActiveTab())
  const [showImportModal, setShowImportModal] = useState(false)
  const [importCallback, setImportCallback] = useState<((deleteRegions: boolean) => void) | null>(null)

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
    // Hide loading after a short delay to allow data to load
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <ImageImportHandler />
      <div className="h-screen bg-gray-900 text-white flex flex-col relative">
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        
        <div className="flex-1 flex overflow-hidden">
          <div className="w-96 bg-eerie-back p-4 overflow-y-auto border-r border-gunmetal">
            {activeTab === 'map' && (
              <MapLoaderControls onShowImportConfirmation={showImportConfirmation} />
            )}
            
            {activeTab === 'regions' && (
              <RegionPanel />
            )}
            
            {activeTab === 'export' && (
              <ExportPanel />
            )}
            
            {activeTab === 'advanced' && (
              <AdvancedPanel />
            )}
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
