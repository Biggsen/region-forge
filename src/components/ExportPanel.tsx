import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppContext } from '../context/AppContext'
import { useAdvancedFeatures } from '../hooks/useAdvancedFeatures'
import { exportRegionsYAML, exportRegionsMetaYAML, buildRegionsYamlBody } from '../utils/exportUtils'
import { loadExportSettings, saveExportSettings } from '../utils/persistenceUtils'
import { getSpawnExportData } from '../utils/spawnUtils'
import { latestVerifiedRelease, readReleaseState, sha256Hex, type ReleaseDescriptionContext } from '../utils/yamlRelease'
import { BaseModal } from './BaseModal'
import { Button } from './Button'
import { AlertCircle, Pencil } from 'lucide-react'

export function ExportPanel() {
  const { regions, spawn, worldName, dimension, toast, mapState, regionForgeYaml } = useAppContext()
  const [includeVillages, setIncludeVillages] = useState(false)
  const [includeStructures, setIncludeStructures] = useState(true)
  const [includeHeartRegions, setIncludeHeartRegions] = useState(false)
  const [includeNerveRegions, setIncludeNerveRegions] = useState(false)
  const [includeSpawnRegion, setIncludeSpawnRegion] = useState(true)
  const [useModernWorldHeight, setUseModernWorldHeight] = useState(true)
  const [useGreetingsAndFarewells, setUseGreetingsAndFarewells] = useState(false)
  const [greetingSize, setGreetingSize] = useState<'large' | 'small' | 'chat'>('large')
  const [includeChallengeLevelSubheading, setIncludeChallengeLevelSubheading] = useState(false)
  const [excludeDescriptionsFromRegionsMeta, setExcludeDescriptionsFromRegionsMeta] = useState(false)
  const [viewingImage, setViewingImage] = useState<{ type: 'greeting' | 'farewell', size: 'large' | 'small' | 'chat' } | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [releasePromptOpen, setReleasePromptOpen] = useState(false)
  const [releaseDescription, setReleaseDescription] = useState('')
  const [releasePromptExisting, setReleasePromptExisting] = useState(false)
  const [releasePromptGeneration, setReleasePromptGeneration] = useState(0)
  const [releasePromptPreviousGeneration, setReleasePromptPreviousGeneration] = useState(0)
  const [editingReleaseNote, setEditingReleaseNote] = useState(false)
  const [unexportedChanges, setUnexportedChanges] = useState(false)
  const releasePrompt = useRef<((value: string | null) => void) | null>(null)
  const exportInFlight = useRef(false)

  const askReleaseDescription = useCallback((context: ReleaseDescriptionContext) => {
    return new Promise<string | null>((resolve) => {
      releasePrompt.current = resolve
      setReleaseDescription(context.description)
      setReleasePromptExisting(context.existing)
      setReleasePromptGeneration(context.generation)
      setReleasePromptPreviousGeneration(context.previousGeneration)
      setEditingReleaseNote(false)
      setReleasePromptOpen(true)
    })
  }, [])

  const finishReleasePrompt = (value: string | null) => {
    setReleasePromptOpen(false)
    const resolve = releasePrompt.current
    releasePrompt.current = null
    resolve?.(value)
  }

  useEffect(() => {
    return () => {
      releasePrompt.current?.(null)
      releasePrompt.current = null
    }
  }, [])

  const applyExportSettingsFromStorage = useCallback(() => {
    const saved = loadExportSettings()
    if (!saved) return
    setIncludeVillages(saved.includeVillages)
    setIncludeStructures(saved.includeStructures ?? true)
    setIncludeHeartRegions(saved.includeHeartRegions)
    setIncludeNerveRegions(saved.includeNerveRegions ?? false)
    setIncludeSpawnRegion(saved.includeSpawnRegion)
    setUseModernWorldHeight(saved.useModernWorldHeight)
    setUseGreetingsAndFarewells(saved.useGreetingsAndFarewells)
    setGreetingSize(saved.greetingSize)
    setIncludeChallengeLevelSubheading(saved.includeChallengeLevelSubheading)
    setExcludeDescriptionsFromRegionsMeta(saved.excludeDescriptionsFromRegionsMeta ?? false)
  }, [])

  useEffect(() => {
    applyExportSettingsFromStorage()
    setIsInitialized(true)
  }, [applyExportSettingsFromStorage])

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mc-region-maker-export-settings') {
        applyExportSettingsFromStorage()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    const handleExportSettingsUpdate = () => {
      applyExportSettingsFromStorage()
    }
    window.addEventListener('exportSettingsUpdated', handleExportSettingsUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('exportSettingsUpdated', handleExportSettingsUpdate)
    }
  }, [applyExportSettingsFromStorage])

  // Save export settings whenever they change (but not during initial load)
  useEffect(() => {
    if (isInitialized) {
      saveExportSettings({
        includeVillages,
        includeStructures,
        includeHeartRegions,
        includeNerveRegions,
        includeSpawnRegion,
        useModernWorldHeight,
        useGreetingsAndFarewells,
        greetingSize,
        includeChallengeLevelSubheading,
        excludeDescriptionsFromRegionsMeta
      })
    }
  }, [
    isInitialized,
    includeVillages,
    includeStructures,
    includeHeartRegions,
    includeNerveRegions,
    includeSpawnRegion,
    useModernWorldHeight,
    useGreetingsAndFarewells,
    greetingSize,
    includeChallengeLevelSubheading,
    excludeDescriptionsFromRegionsMeta
  ])

  useEffect(() => {
    if (!isInitialized) return
    let cancelled = false
    const spawnData = getSpawnExportData(spawn.spawnState)
    const finalIncludeSpawnRegion = dimension === 'nether' || dimension === 'end' ? false : includeSpawnRegion
    const enabledRegions = regions.regions.filter((region) => !region.disabled)
    const nothingToExport = enabledRegions.length === 0 && (!finalIncludeSpawnRegion || dimension === 'nether' || dimension === 'end')
    if (nothingToExport) {
      setUnexportedChanges(false)
      return
    }

    const body = buildRegionsYamlBody(
      regions.regions,
      includeVillages,
      includeStructures,
      includeHeartRegions,
      includeNerveRegions,
      finalIncludeSpawnRegion,
      spawnData,
      dimension,
      useModernWorldHeight,
      useGreetingsAndFarewells,
      greetingSize,
      includeChallengeLevelSubheading
    )
    sha256Hex(body).then((checksum) => {
      if (cancelled) return
      const latest = latestVerifiedRelease(readReleaseState()?.releases ?? [])
      setUnexportedChanges(latest?.checksum !== checksum)
    })

    return () => {
      cancelled = true
    }
  }, [
    regions.regions,
    includeVillages,
    includeStructures,
    includeHeartRegions,
    includeNerveRegions,
    includeSpawnRegion,
    spawn.spawnState,
    dimension,
    useModernWorldHeight,
    useGreetingsAndFarewells,
    greetingSize,
    includeChallengeLevelSubheading,
    regionForgeYaml.regionForgeYamlGeneration,
    isInitialized,
  ])

  const handleExportYAML = async () => {
    if (exportInFlight.current) return
    exportInFlight.current = true
    try {
      const spawnData = getSpawnExportData(spawn.spawnState)
      // Force spawn region to false for nether and end since they don't have spawn
      const finalIncludeSpawnRegion = (dimension === 'nether' || dimension === 'end') ? false : includeSpawnRegion
      const result = await exportRegionsYAML(
        regions.regions,
        toast.showToast,
        includeVillages,
        includeStructures,
        includeHeartRegions,
        includeNerveRegions,
        finalIncludeSpawnRegion,
        spawnData,
        dimension,
        worldName.worldName,
        useModernWorldHeight,
        useGreetingsAndFarewells,
        greetingSize,
        includeChallengeLevelSubheading,
        { promptDescription: askReleaseDescription }
      )
      if (result.status === 'downloaded') {
        regionForgeYaml.syncFromStorage()
      }
    } finally {
      exportInFlight.current = false
    }
  }

  const handleExportRegionsMeta = () => {
    const finalIncludeSpawnRegion = dimension === 'nether' ? false : includeSpawnRegion
    exportRegionsMetaYAML(
      regions.regions,
      dimension,
      worldName.worldName,
      spawn.spawnState,
      includeVillages,
      includeStructures,
      includeHeartRegions,
      includeNerveRegions,
      finalIncludeSpawnRegion,
      toast.showToast,
      mapState.mapState,
      excludeDescriptionsFromRegionsMeta
    )
  }

  const computedHasVillages = regions.regions.some(region => region.subregions?.some(s => s.type === 'village'))
  const computedHasStructures = regions.regions.some(region => region.subregions?.some(s => s.type === 'structure'))
  const hasSpawn = !!spawn.spawnState.coordinates

  const canExportSpawnForMeta = dimension === 'overworld' && includeSpawnRegion && hasSpawn && !!spawn.spawnState.radius
  const hasAnythingForRegionsMeta = regions.regions.length > 0 || canExportSpawnForMeta
  const showAdvanced = useAdvancedFeatures()

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
                  id="includeStructures"
                  checked={includeStructures}
                  onChange={(e) => setIncludeStructures(e.target.checked)}
                  disabled={!computedHasStructures}
                  className="w-4 h-4 text-lapis-lazuli bg-gray-700 border-gunmetal rounded focus:ring-lapis-lazuli focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="includeStructures" className="ml-2 text-white">
                  Include Structures
                  {!computedHasStructures && <span className="text-gray-400 ml-1">(No structures available)</span>}
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
                  Include Heart of Regions
                </label>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeNerveRegions"
                    checked={includeNerveRegions}
                    onChange={(e) => setIncludeNerveRegions(e.target.checked)}
                    title="Nerve cuboids and regions-meta nerve rows are emitted only for overworld exports."
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gunmetal rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="includeNerveRegions" className="ml-2 text-white">
                    Include Nerve of Regions
                  </label>
                </div>
                {dimension !== 'overworld' && (
                  <p className="text-xs text-gray-400 ml-7">
                    Nerves are overworld-only; this dimension’s export will not include nerve regions.
                  </p>
                )}
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeChallengeLevelSubheading"
                  checked={includeChallengeLevelSubheading}
                  onChange={(e) => setIncludeChallengeLevelSubheading(e.target.checked)}
                  disabled={!useGreetingsAndFarewells}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gunmetal rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="includeChallengeLevelSubheading" className="ml-2 text-white">
                  Include challenge level in greetings
                  {!useGreetingsAndFarewells && (
                    <span className="text-gray-400 ml-1">(enable greetings first)</span>
                  )}
                </label>
              </div>
              
              {dimension !== 'nether' && dimension !== 'end' && (
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
          <p className="text-gray-200 text-lg font-medium">
            {regionForgeYaml.regionForgeYamlGeneration > 0 ? `Release ${regionForgeYaml.regionForgeYamlGeneration}` : 'No release'}
          </p>
          {regionForgeYaml.regionForgeYamlGeneration > 0 && (
            <div>
              <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Description</h5>
              {regionForgeYaml.regionForgeYamlDescription && (
                <p className="text-gray-300 text-sm mt-1">{regionForgeYaml.regionForgeYamlDescription}</p>
              )}
            </div>
          )}
          {unexportedChanges && (
            <p className="text-amber-400 text-sm flex items-center gap-1.5">
              <AlertCircle size={14} />
              Unexported changes
            </p>
          )}
          <Button
            onClick={handleExportYAML}
            disabled={regions.regions.length === 0}
            variant="primary"
            className="w-full"
          >
            Generate regions.yml
          </Button>

          {showAdvanced && (
            <div className="border-t border-gunmetal pt-4 mt-4 space-y-4">
              <p className="text-gray-400 text-sm">
                For mc-plugin-manager: discovery metadata, onboarding, spawn center, and LevelledMobs bands.
              </p>
              <div>
                <h4 className="text-md font-medium text-white mb-2">Export Options</h4>
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="excludeDescriptionsFromRegionsMeta"
                    checked={excludeDescriptionsFromRegionsMeta}
                    onChange={(e) => setExcludeDescriptionsFromRegionsMeta(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-lapis-lazuli bg-gray-700 border-gunmetal rounded focus:ring-lapis-lazuli focus:ring-2 shrink-0"
                  />
                  <label htmlFor="excludeDescriptionsFromRegionsMeta" className="ml-2 text-white">
                    Exclude Descriptions
                  </label>
                </div>
                <p className="text-gray-400 text-xs mt-1 ml-6">
                  Omit the <code className="text-gray-300 bg-gray-700 px-1 rounded">description</code> field from every region in regions-meta.yml (e.g. draft or partial lore you do not want imported yet).
                </p>
              </div>
              <Button
                onClick={handleExportRegionsMeta}
                disabled={!hasAnythingForRegionsMeta}
                variant="secondary"
                className="w-full"
              >
                Generate regions-meta.yml
              </Button>
            </div>
          )}
        </div>
      </div>

      <BaseModal
        isOpen={releasePromptOpen}
        onClose={() => finishReleasePrompt(null)}
        title={releasePromptExisting ? `Release ${releasePromptGeneration}` : `Create Release ${releasePromptGeneration}`}
        size="md"
      >
        <div className="space-y-4">
          {releasePromptExisting ? (
            <>
              <p className="text-gray-300 text-sm">
                This configuration matches the latest release. Downloading it will not create a new release.
              </p>
              <div>
                <p className="text-gray-400 text-sm mb-1">Release note</p>
                {editingReleaseNote ? (
                  <input
                    type="text"
                    value={releaseDescription}
                    onChange={(e) => setReleaseDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') finishReleasePrompt(releaseDescription)
                    }}
                    autoFocus
                    placeholder="Optional note for this release"
                    className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-md focus:outline-none focus:border-lapis-lighter text-sm text-input-text placeholder:text-gray-500"
                  />
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-white">
                      {releaseDescription || <span className="text-gray-500">No note</span>}
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditingReleaseNote(true)}
                      className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white shrink-0"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-300 text-sm">
                {releasePromptPreviousGeneration > 0
                  ? `Your configuration has changed since Release ${releasePromptPreviousGeneration}. A new release will be created when you download.`
                  : 'A new release will be created when you download.'}
              </p>
              <div>
                <p className="text-gray-400 text-sm mb-1">Release note (optional)</p>
                <input
                  type="text"
                  value={releaseDescription}
                  onChange={(e) => setReleaseDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishReleasePrompt(releaseDescription)
                  }}
                  autoFocus
                  placeholder="Describe what changed..."
                  className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-md focus:outline-none focus:border-lapis-lighter text-sm text-input-text placeholder:text-gray-500"
                />
              </div>
            </>
          )}
          <div className="flex space-x-3">
            <Button variant="ghost" onClick={() => finishReleasePrompt(null)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={() => finishReleasePrompt(releaseDescription)} className="flex-1">
              {releasePromptExisting ? 'Download release' : 'Create & Download'}
            </Button>
          </div>
        </div>
      </BaseModal>

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
