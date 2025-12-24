import { useState, useEffect, useCallback } from 'react'
import { useAppContext } from '../context/AppContext'
import { exportRegionsYAML } from '../utils/exportUtils'
import { loadExportSettings, saveExportSettings } from '../utils/persistenceUtils'
import { BaseModal } from './BaseModal'
import { Button } from './Button'

export function ExportPanel() {
  const { regions, spawn, worldType, toast } = useAppContext()
  const [includeVillages, setIncludeVillages] = useState(false)
  const [randomMobSpawn, setRandomMobSpawn] = useState(false)
  const [includeHeartRegions, setIncludeHeartRegions] = useState(false)
  const [includeSpawnRegion, setIncludeSpawnRegion] = useState(true)
  const [useModernWorldHeight, setUseModernWorldHeight] = useState(true)
  const [useGreetingsAndFarewells, setUseGreetingsAndFarewells] = useState(false)
  const [greetingSize, setGreetingSize] = useState<'large' | 'small' | 'chat'>('large')
  const [includeChallengeLevelSubheading, setIncludeChallengeLevelSubheading] = useState(false)
  const [viewingImage, setViewingImage] = useState<{ type: 'greeting' | 'farewell', size: 'large' | 'small' | 'chat' } | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load saved export settings on mount
  useEffect(() => {
    const savedSettings = loadExportSettings()
    if (savedSettings) {
      setIncludeVillages(savedSettings.includeVillages)
      setRandomMobSpawn(savedSettings.randomMobSpawn)
      setIncludeHeartRegions(savedSettings.includeHeartRegions)
      setIncludeSpawnRegion(savedSettings.includeSpawnRegion)
      setUseModernWorldHeight(savedSettings.useModernWorldHeight)
      setUseGreetingsAndFarewells(savedSettings.useGreetingsAndFarewells)
      setGreetingSize(savedSettings.greetingSize)
      setIncludeChallengeLevelSubheading(savedSettings.includeChallengeLevelSubheading)
    }
    setIsInitialized(true)
  }, [])

  // Load saved export settings when they're updated externally (e.g., from project load)
  const loadSettings = useCallback(() => {
    const savedSettings = loadExportSettings()
    if (savedSettings) {
      setIncludeVillages(savedSettings.includeVillages)
      setRandomMobSpawn(savedSettings.randomMobSpawn)
      setIncludeHeartRegions(savedSettings.includeHeartRegions)
      setIncludeSpawnRegion(savedSettings.includeSpawnRegion)
      setUseModernWorldHeight(savedSettings.useModernWorldHeight)
      setUseGreetingsAndFarewells(savedSettings.useGreetingsAndFarewells)
      setGreetingSize(savedSettings.greetingSize)
      setIncludeChallengeLevelSubheading(savedSettings.includeChallengeLevelSubheading)
    }
  }, [])

  // Listen for export settings updates (from project load or other sources)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mc-region-maker-export-settings') {
        loadSettings()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events for same-tab updates
    const handleExportSettingsUpdate = () => {
      loadSettings()
    }
    
    window.addEventListener('exportSettingsUpdated', handleExportSettingsUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('exportSettingsUpdated', handleExportSettingsUpdate)
    }
  }, [loadSettings])

  // Save export settings whenever they change (but not during initial load)
  useEffect(() => {
    if (isInitialized) {
      saveExportSettings({
        includeVillages,
        randomMobSpawn,
        includeHeartRegions,
        includeSpawnRegion,
        useModernWorldHeight,
        useGreetingsAndFarewells,
        greetingSize,
        includeChallengeLevelSubheading
      })
    }
  }, [
    isInitialized,
    includeVillages,
    randomMobSpawn,
    includeHeartRegions,
    includeSpawnRegion,
    useModernWorldHeight,
    useGreetingsAndFarewells,
    greetingSize,
    includeChallengeLevelSubheading
  ])

  const handleExportYAML = () => {
    const spawnData = spawn.spawnState.coordinates ? {
      x: spawn.spawnState.coordinates.x,
      z: spawn.spawnState.coordinates.z,
      radius: spawn.spawnState.radius
    } : null
    // Force spawn region to false for nether since it doesn't exist
    const finalIncludeSpawnRegion = worldType.worldType === 'nether' ? false : includeSpawnRegion
    exportRegionsYAML(regions.regions, includeVillages, randomMobSpawn, includeHeartRegions, finalIncludeSpawnRegion, spawnData, worldType.worldType, useModernWorldHeight, useGreetingsAndFarewells, greetingSize, includeChallengeLevelSubheading, toast.showToast)
  }

  const computedHasVillages = regions.regions.some(region => region.subregions && region.subregions.length > 0)
  const hasSpawn = !!spawn.spawnState.coordinates

  // Check URL parameter for advanced features
  const urlParams = new URLSearchParams(window.location.search)
  const showAdvanced = urlParams.get('advanced') === 'true'

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Export Region Data</h3>
      <p className="text-gray-400 text-sm mb-4">
        Export all region data as a regions.yml file ready to be used in the WorldGuard plugin.
      </p>
      <p className="text-gray-400 text-sm mb-4">
        All exported regions will have <code className="text-gray-300 bg-gray-700 px-1.5 py-0.5 rounded">priority: 0</code> and a <code className="text-gray-300 bg-gray-700 px-1.5 py-0.5 rounded">passthrough: allow</code> flag.
      </p>
      
      <div className="space-y-4">
        {/* Settings Section */}
        <div className="border-t border-gunmetal pt-4">
          <h4 className="text-md font-medium text-white mb-3">Settings</h4>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="useModernWorldHeight"
              checked={useModernWorldHeight}
              onChange={(e) => setUseModernWorldHeight(e.target.checked)}
              className="w-4 h-4 text-lapis-lazuli bg-gray-700 border-gunmetal rounded focus:ring-lapis-lazuli focus:ring-2"
            />
            <label htmlFor="useModernWorldHeight" className="ml-2 text-white">
              Use modern world height (1.18+)
            </label>
          </div>
          <p className="text-gray-400 text-xs mt-1 ml-6">
            {useModernWorldHeight ? 'Y: -64 to 320' : 'Y: 0 to 255 (legacy)'}
          </p>
          <div className="flex items-center mt-3">
            <input
              type="checkbox"
              id="useGreetingsAndFarewells"
              checked={useGreetingsAndFarewells}
              onChange={(e) => setUseGreetingsAndFarewells(e.target.checked)}
              className="w-4 h-4 text-lapis-lazuli bg-gray-700 border-gunmetal rounded focus:ring-lapis-lazuli focus:ring-2"
            />
            <label htmlFor="useGreetingsAndFarewells" className="ml-2 text-white">
              Use greetings and farewells
            </label>
          </div>
          
          {useGreetingsAndFarewells && (
            <div className="ml-6 mt-3 space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="greetingLarge"
                  name="greetingSize"
                  value="large"
                  checked={greetingSize === 'large'}
                  onChange={(e) => setGreetingSize(e.target.value as 'large' | 'small' | 'chat')}
                  className="w-4 h-4 text-lapis-lazuli bg-gray-700 border-gunmetal focus:ring-lapis-lazuli focus:ring-2"
                />
                <label htmlFor="greetingLarge" className="flex items-center space-x-2 text-white cursor-pointer">
                  <span>Large</span>
                  <div className="flex items-center space-x-2">
                    <img 
                      src="/greeting-large.png" 
                      alt="Large greeting" 
                      className="h-24 w-auto cursor-pointer hover:opacity-80 transition-opacity" 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setViewingImage({ type: 'greeting', size: 'large' })
                      }}
                    />
                    <img 
                      src="/farewell-large.png" 
                      alt="Large farewell" 
                      className="h-24 w-auto cursor-pointer hover:opacity-80 transition-opacity" 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setViewingImage({ type: 'farewell', size: 'large' })
                      }}
                    />
                  </div>
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="greetingSmall"
                  name="greetingSize"
                  value="small"
                  checked={greetingSize === 'small'}
                  onChange={(e) => {
                    const newSize = e.target.value as 'large' | 'small' | 'chat'
                    setGreetingSize(newSize)
                    if (newSize === 'small') {
                      setIncludeChallengeLevelSubheading(false)
                    }
                  }}
                  className="w-4 h-4 text-lapis-lazuli bg-gray-700 border-gunmetal focus:ring-lapis-lazuli focus:ring-2"
                />
                <label htmlFor="greetingSmall" className="flex items-center space-x-2 text-white cursor-pointer">
                  <span>Small</span>
                  <div className="flex items-center space-x-2">
                    <img 
                      src="/greeting-small.png" 
                      alt="Small greeting" 
                      className="h-24 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setViewingImage({ type: 'greeting', size: 'small' })
                      }}
                    />
                    <img 
                      src="/farewell-small.png" 
                      alt="Small farewell" 
                      className="h-24 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setViewingImage({ type: 'farewell', size: 'small' })
                      }}
                    />
                  </div>
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="greetingChat"
                  name="greetingSize"
                  value="chat"
                  checked={greetingSize === 'chat'}
                  onChange={(e) => setGreetingSize(e.target.value as 'large' | 'small' | 'chat')}
                  className="w-4 h-4 text-lapis-lazuli bg-gray-700 border-gunmetal focus:ring-lapis-lazuli focus:ring-2"
                />
                <label htmlFor="greetingChat" className="flex items-center space-x-2 text-white cursor-pointer">
                  <span>Chat</span>
                  <div className="flex items-center space-x-2">
                    <img 
                      src="/greeting-chat.png" 
                      alt="Chat greeting" 
                      className="h-24 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setViewingImage({ type: 'greeting', size: 'chat' })
                      }}
                    />
                    <img 
                      src="/farewell-chat.png" 
                      alt="Chat farewell" 
                      className="h-24 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setViewingImage({ type: 'farewell', size: 'chat' })
                      }}
                    />
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Export Options */}
        {showAdvanced && (
          <div className="border-t border-gunmetal pt-4">
            <h4 className="text-md font-medium text-white mb-3">Export Options</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeVillages"
                  checked={includeVillages}
                  onChange={(e) => setIncludeVillages(e.target.checked)}
                  disabled={!computedHasVillages}
                  className="w-4 h-4 text-lapis-lazuli bg-gray-700 border-gunmetal rounded focus:ring-lapis-lazuli focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="includeVillages" className="ml-2 text-white">
                  Include Villages
                  {!computedHasVillages && <span className="text-gray-400 ml-1">(No villages available)</span>}
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeHeartRegions"
                  checked={includeHeartRegions}
                  onChange={(e) => setIncludeHeartRegions(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gunmetal rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="includeHeartRegions" className="ml-2 text-white">
                  Include Heart of Regions (7x7 centered subregions)
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="randomMobSpawn"
                  checked={randomMobSpawn}
                  onChange={(e) => setRandomMobSpawn(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gunmetal rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="randomMobSpawn" className="ml-2 text-white">
                  Random mob spawn
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeChallengeLevelSubheading"
                  checked={includeChallengeLevelSubheading}
                  onChange={(e) => setIncludeChallengeLevelSubheading(e.target.checked)}
                  disabled={!useGreetingsAndFarewells || greetingSize === 'small' || greetingSize === 'chat'}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gunmetal rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="includeChallengeLevelSubheading" className="ml-2 text-white">
                  Include challenge level subheading in greetings
                  {!useGreetingsAndFarewells && (
                    <span className="text-gray-400 ml-1">(enable greetings first)</span>
                  )}
                  {useGreetingsAndFarewells && greetingSize === 'small' && (
                    <span className="text-gray-400 ml-1">(small greetings use subheading space)</span>
                  )}
                  {useGreetingsAndFarewells && greetingSize === 'chat' && (
                    <span className="text-gray-400 ml-1">(chat greetings use subheading space)</span>
                  )}
                </label>
              </div>
              
              {worldType.worldType !== 'nether' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeSpawnRegion"
                    checked={includeSpawnRegion}
                    onChange={(e) => setIncludeSpawnRegion(e.target.checked)}
                    disabled={!hasSpawn}
                    className="w-4 h-4 text-lapis-lazuli bg-gray-700 border-gunmetal rounded focus:ring-lapis-lazuli focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <label htmlFor="includeSpawnRegion" className="ml-2 text-white">
                    Include Spawn Region
                    {!hasSpawn && <span className="text-gray-400 ml-1">(No spawn point set)</span>}
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2 pt-4">
          <Button
            onClick={handleExportYAML}
            disabled={regions.regions.length === 0}
            variant="primary"
            className="w-full"
          >
            Generate regions.yml
          </Button>
        </div>
      </div>

      <BaseModal
        isOpen={viewingImage !== null}
        onClose={() => setViewingImage(null)}
        size="4xl"
        title={viewingImage ? `${viewingImage.size.charAt(0).toUpperCase() + viewingImage.size.slice(1)} ${viewingImage.type.charAt(0).toUpperCase() + viewingImage.type.slice(1)} Preview` : ''}
      >
        <div className="flex justify-center">
          {viewingImage && (
            <img 
              src={`/${viewingImage.type}-${viewingImage.size}.png`}
              alt={`${viewingImage.size} ${viewingImage.type}`}
              className="max-w-full h-auto"
            />
          )}
        </div>
      </BaseModal>
    </div>
  )
}
