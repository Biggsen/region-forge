import React, { useRef, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { generateAchievementsYAML, generateEventConditionsYAML, generateLevelledMobsRulesYAML, importMapData } from '../utils/exportUtils'
import { clearSavedData } from '../utils/persistenceUtils'
import { ChallengeLevel } from '../types'
import { RegionActions } from './RegionActions'
import { SpawnButton } from './SpawnButton'
import { Button } from './Button'
import { Trash2 } from 'lucide-react'
import { ClearDataModal } from './ClearDataModal'

export function AdvancedPanel() {
  const { regions, worldType, mapCanvas, toast, worldName, spawn } = useAppContext()
  const villageFileInputRef = useRef<HTMLInputElement>(null)
  const importFileInputRef = useRef<HTMLInputElement>(null)
  const [isImportingVillages, setIsImportingVillages] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [villageImportError, setVillageImportError] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [isOtherRegionTypesExpanded, setIsOtherRegionTypesExpanded] = useState(false)
  const [isPluginsExpanded, setIsPluginsExpanded] = useState(false)
  const [isWorldTypeExpanded, setIsWorldTypeExpanded] = useState(false)
  const [isVillagesExpanded, setIsVillagesExpanded] = useState(false)
  const [isImportExpanded, setIsImportExpanded] = useState(false)
  const [isRegionSpecificExpanded, setIsRegionSpecificExpanded] = useState(false)
  const [customCenterX, setCustomCenterX] = useState('')
  const [customCenterZ, setCustomCenterZ] = useState('')
  const [showCustomCenterForm, setShowCustomCenterForm] = useState(false)
  const [showClearDataModal, setShowClearDataModal] = useState(false)

  const handleGenerateAchievements = () => {
    generateAchievementsYAML(regions.regions, worldType.worldType, toast.showToast)
  }

  const handleGenerateEventConditions = () => {
    generateEventConditionsYAML(regions.regions, worldType.worldType, toast.showToast)
  }

  const handleGenerateLevelledMobsRules = () => {
    generateLevelledMobsRulesYAML(regions.regions, worldName.worldName, spawn.spawnState.coordinates, worldType.worldType, toast.showToast)
  }

  const handleRandomizeChallengeLevels = () => {
    regions.randomizeChallengeLevels()
  }

  const handleVillageImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImportingVillages(true)
    setVillageImportError(null)

    try {
      const text = await file.text()
      
      if (!text.trim()) {
        throw new Error('File is empty or contains no valid data')
      }

      // Use the existing CSV parser which handles the semicolon-separated format
      regions.importVillagesFromCSV(text)
      
      // Clear the file input
      if (villageFileInputRef.current) {
        villageFileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Village import error:', error)
      setVillageImportError(error instanceof Error ? error.message : 'Failed to import villages')
    } finally {
      setIsImportingVillages(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportError(null)

    try {
      const importData = await importMapData(file)
      
      // Import only regions from the export file, ignoring map state/image/settings
      // This allows merging regions from another project without replacing current map
      regions.replaceRegions(importData.regions)
      regions.setSelectedRegionId(null)
      
      // Clear the file input
      if (importFileInputRef.current) {
        importFileInputRef.current.value = ''
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  const triggerFileInput = () => {
    importFileInputRef.current?.click()
  }

  const triggerVillageFileInput = () => {
    villageFileInputRef.current?.click()
  }

  const handleSetCustomCenter = () => {
    if (regions.selectedRegionId && customCenterX && customCenterZ) {
      const x = parseInt(customCenterX)
      const z = parseInt(customCenterZ)
      if (!isNaN(x) && !isNaN(z)) {
        regions.setCustomCenterPoint(regions.selectedRegionId, { x, z })
        setCustomCenterX('')
        setCustomCenterZ('')
        setShowCustomCenterForm(false)
      }
    }
  }

  const handleUseCalculatedCenter = () => {
    if (regions.selectedRegionId) {
      regions.setCustomCenterPoint(regions.selectedRegionId, null)
      setCustomCenterX('')
      setCustomCenterZ('')
      setShowCustomCenterForm(false)
    }
  }

  const handleShowCustomCenterForm = () => {
    if (regions.selectedRegionId) {
      const selectedRegion = regions.regions.find(r => r.id === regions.selectedRegionId)
      if (selectedRegion?.centerPoint) {
        setCustomCenterX(selectedRegion.centerPoint.x.toString())
        setCustomCenterZ(selectedRegion.centerPoint.z.toString())
      } else {
        setCustomCenterX('')
        setCustomCenterZ('')
      }
      setShowCustomCenterForm(true)
    }
  }

  const availableRegions = regions.regions.filter(r => r.points.length >= 3)

  const handleClearData = () => {
    setShowClearDataModal(true)
  }

  const handleConfirmClearData = () => {
    clearSavedData()
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Advanced Tools</h3>
      
      <div className="space-y-4">
        {/* World Type Toggle */}
        <div>
          <button
            onClick={() => setIsWorldTypeExpanded(!isWorldTypeExpanded)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
          >
            <span>World Type</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isWorldTypeExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {isWorldTypeExpanded && (
            <div className="ml-4">
              <div className="flex gap-2">
                <button
                  onClick={() => worldType.setWorldType('overworld')}
                  className={`text-sm px-3 py-1 rounded border ${
                    worldType.worldType === 'overworld'
                      ? 'bg-viridian text-white border-viridian'
                      : 'text-zomp/80 hover:text-zomp border-zomp/80 hover:border-zomp'
                  }`}
                  title="Generate overworld-style names"
                >
                  Overworld
                </button>
                <button
                  onClick={() => worldType.setWorldType('nether')}
                  className={`text-sm px-3 py-1 rounded border ${
                    worldType.worldType === 'nether'
                      ? 'bg-red-600 text-white border-red-500'
                      : 'text-red-400 hover:text-red-300 border-red-400 hover:border-red-300'
                  }`}
                  title="Generate nether-style names"
                >
                  Nether
                </button>
              </div>
            </div>
          )}
        </div>


        {/* Other region types */}
        <div>
          <button
            onClick={() => setIsOtherRegionTypesExpanded(!isOtherRegionTypesExpanded)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
          >
            <span>Spawn</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isOtherRegionTypesExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {isOtherRegionTypesExpanded && (
            <div className="space-y-2 ml-4">
              {worldType.worldType !== 'nether' && <SpawnButton />}
            </div>
          )}
        </div>

        {/* Plugins */}
        <div>
          <button
            onClick={() => setIsPluginsExpanded(!isPluginsExpanded)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
          >
            <span>Plugins</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isPluginsExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {isPluginsExpanded && (
            <div className="space-y-4 ml-4">
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">AdvancedAchievements</h5>
                <button
                  onClick={handleGenerateAchievements}
                  disabled={availableRegions.length === 0}
                  className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Generate Achievements
                </button>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">ConditionalEvents</h5>
                <button
                  onClick={handleGenerateEventConditions}
                  disabled={availableRegions.length === 0}
                  className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Generate Event Conditions
                </button>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">LevelledMobs</h5>
                <button
                  onClick={handleGenerateLevelledMobsRules}
                  disabled={availableRegions.length === 0}
                  className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Generate LevelledMobs Rules
                </button>
                <RegionActions
                  regions={availableRegions}
                  onRandomizeChallengeLevels={handleRandomizeChallengeLevels}
                />
              </div>
            </div>
          )}
        </div>

        {/* Villages */}
        <div>
          <button
            onClick={() => setIsVillagesExpanded(!isVillagesExpanded)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
          >
            <span>Villages</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isVillagesExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {isVillagesExpanded && (
            <div className="ml-4 space-y-4">
              {/* Villages Counter */}
              {(() => {
                const hasVillages = availableRegions.some(region => region.subregions && region.subregions.length > 0)
                const totalVillages = availableRegions.reduce((total, region) => total + (region.subregions?.length || 0), 0)
                
                if (hasVillages) {
                  return (
                    <div>
                      <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Village Count</h5>
                      <div className="text-lg font-semibold text-white">
                        {totalVillages} villages across {availableRegions.length} regions
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              {/* Village Import */}
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Import Villages</h5>
                <div className="text-sm text-gray-300">
                  Import villages from CSV files generated by seed map tools
                </div>
                
                <button
                  onClick={triggerVillageFileInput}
                  disabled={isImportingVillages}
                  className="w-full bg-viridian hover:bg-viridian/80 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {isImportingVillages ? 'Importing...' : 'Import Villages (CSV)'}
                </button>

                <input
                  ref={villageFileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleVillageImport}
                  className="hidden"
                />

                {villageImportError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-md text-sm">
                    {villageImportError}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Import */}
        <div>
          <button
            onClick={() => setIsImportExpanded(!isImportExpanded)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
          >
            <span>Import</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isImportExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {isImportExpanded && (
            <div className="ml-4 space-y-4">
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Import Regions</h5>
                <div className="text-sm text-gray-300">
                  Import regions from JSON project files
                </div>
                
                <button
                  onClick={triggerFileInput}
                  disabled={isImporting}
                  className="w-full bg-viridian hover:bg-viridian/80 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {isImporting ? 'Importing...' : 'Import regions'}
                </button>

                <input
                  ref={importFileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />

                {importError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-md text-sm">
                    {importError}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Region Specific */}
        <div>
          <button
            onClick={() => setIsRegionSpecificExpanded(!isRegionSpecificExpanded)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
          >
            <span>Region Specific</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isRegionSpecificExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {isRegionSpecificExpanded && (
            <div className="ml-4 space-y-4">
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Challenge Level</h5>
                <div className="text-sm text-gray-300">
                  Set the difficulty level for the selected region
                </div>
                
                {regions.selectedRegionId ? (
                  <div className="space-y-2">
                    <select
                      value={regions.regions.find(r => r.id === regions.selectedRegionId)?.challengeLevel || 'Vanilla'}
                      onChange={(e) => regions.updateRegion(regions.selectedRegionId!, { challengeLevel: e.target.value as ChallengeLevel })}
                      className="w-full bg-input-bg text-input-text px-3 py-2 rounded border border-input-border focus:border-lapis-lighter focus:outline-none placeholder:text-gray-500"
                    >
                      <option value="Vanilla">Vanilla</option>
                      <option value="Bronze">Bronze</option>
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                      <option value="Platinum">Platinum</option>
                    </select>
                    <p className="text-gray-400 text-xs">
                      Sets the difficulty level for LevelledMobs plugin
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 p-3 bg-eerie-back/50 rounded-md">
                    Select a region to set its challenge level
                  </div>
                )}
              </div>

              {worldType.worldType !== 'nether' && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Spawn Region</h5>
                  <div className="text-sm text-gray-300">
                    Mark this region as containing the world spawn point
                  </div>
                  
                  {regions.selectedRegionId ? (
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={regions.regions.find(r => r.id === regions.selectedRegionId)?.hasSpawn || false}
                          onChange={(e) => {
                            const regionId = regions.selectedRegionId!
                            if (e.target.checked) {
                              // If checking this region, uncheck all other regions first
                              regions.regions.forEach(region => {
                                if (region.id !== regionId && region.hasSpawn) {
                                  regions.updateRegion(region.id, { hasSpawn: false })
                                }
                              })
                            }
                            // Then update the selected region
                            regions.updateRegion(regionId, { hasSpawn: e.target.checked })
                          }}
                          className="w-4 h-4 text-lapis-lazuli bg-gray-700 border-gunmetal rounded focus:ring-lapis-lazuli focus:ring-2"
                        />
                        <span className="text-sm text-gray-300">Has Spawn</span>
                      </label>
                      <p className="text-gray-400 text-xs">
                        Only one region can have spawn (only one region can have spawn)
                      </p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 p-3 bg-eerie-back/50 rounded-md">
                      Select a region to set its spawn status
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Region Heart</h5>
                <div className="text-sm text-gray-300">
                  Set the center point (heart) of the selected region
                </div>
                
                {regions.selectedRegionId ? (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          if (showCustomCenterForm) {
                            setShowCustomCenterForm(false)
                          } else {
                            mapCanvas.startSettingCenterPoint(regions.selectedRegionId!)
                          }
                        }}
                        className="text-lapis-lazuli/80 hover:text-lapis-lazuli text-sm px-2 py-1 rounded hover:bg-gray-700 transition-colors"
                        title="Click on map to set region heart"
                      >
                        Click Map
                      </button>
                      <button
                        onClick={handleShowCustomCenterForm}
                        className="text-gray-400 hover:text-gray-300 text-sm px-2 py-1 rounded hover:bg-gray-700 transition-colors"
                        title="Manually enter coordinates"
                      >
                        Manual
                      </button>
                    </div>
                    
                    {!showCustomCenterForm ? (
                      <div className="bg-gray-700 p-3 rounded border border-gunmetal">
                        <div className="flex justify-between items-center">
                          <div className="text-sm">
                            <span className="text-gray-400">Current: </span>
                            <span className="text-white">
                              X: {Math.round(regions.regions.find(r => r.id === regions.selectedRegionId)?.centerPoint?.x ?? 
                                (() => {
                                  const region = regions.regions.find(r => r.id === regions.selectedRegionId)
                                  if (!region) return 0
                                  const center = region.points.reduce((acc, point) => ({ x: acc.x + point.x, z: acc.z + point.z }), { x: 0, z: 0 })
                                  return center.x / region.points.length
                                })())}, Z: {Math.round(regions.regions.find(r => r.id === regions.selectedRegionId)?.centerPoint?.z ?? 
                                (() => {
                                  const region = regions.regions.find(r => r.id === regions.selectedRegionId)
                                  if (!region) return 0
                                  const center = region.points.reduce((acc, point) => ({ x: acc.x + point.x, z: acc.z + point.z }), { x: 0, z: 0 })
                                  return center.z / region.points.length
                                })())}
                            </span>
                            {regions.regions.find(r => r.id === regions.selectedRegionId)?.centerPoint && (
                              <span className="text-lapis-lazuli/80 text-xs ml-2">(Custom)</span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const region = regions.regions.find(r => r.id === regions.selectedRegionId)
                              if (region) {
                                const center = region.centerPoint || region.points.reduce((acc, point) => ({ x: acc.x + point.x, z: acc.z + point.z }), { x: 0, z: 0 })
                                const centerX = region.centerPoint ? center.x : center.x / region.points.length
                                const centerZ = region.centerPoint ? center.z : center.z / region.points.length
                                const tpCommand = `/tp @s ${Math.round(centerX)} ~ ${Math.round(centerZ)}`
                                navigator.clipboard.writeText(tpCommand)
                              }
                            }}
                            className="text-lapis-lazuli/80 hover:text-lapis-lazuli text-xs px-2 py-1 rounded hover:bg-gray-700 transition-colors"
                            title="Copy /tp command to clipboard"
                          >
                            Copy /tp
                          </button>
                        </div>
                        {mapCanvas.isSettingCenterPoint && mapCanvas.centerPointRegionId === regions.selectedRegionId && (
                          <div className="mt-2 p-2 bg-violet-blue/20 border border-violet-blue/50 rounded text-xs text-violet-blue/80">
                            Click anywhere on the map to set the region heart for this region
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-700 p-3 rounded border border-gray-600 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">X Coordinate</label>
                            <input
                              type="number"
                              value={customCenterX}
                              onChange={(e) => setCustomCenterX(e.target.value)}
                              placeholder="X"
                              className="w-full bg-input-bg text-input-text px-2 py-1 rounded border border-input-border focus:border-lapis-lighter focus:outline-none text-sm placeholder:text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Z Coordinate</label>
                            <input
                              type="number"
                              value={customCenterZ}
                              onChange={(e) => setCustomCenterZ(e.target.value)}
                              placeholder="Z"
                              className="w-full bg-input-bg text-input-text px-2 py-1 rounded border border-input-border focus:border-lapis-lighter focus:outline-none text-sm placeholder:text-gray-500"
                            />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSetCustomCenter}
                            disabled={!customCenterX || !customCenterZ}
                            className="flex-1 bg-viridian hover:bg-viridian/80 disabled:bg-gray-600 disabled:text-gray-400 text-white text-sm px-2 py-1 rounded"
                          >
                            Set Region Heart
                          </button>
                          <button
                            onClick={handleUseCalculatedCenter}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm px-2 py-1 rounded"
                          >
                            Use Calculated
                          </button>
                          <button
                            onClick={() => setShowCustomCenterForm(false)}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm px-2 py-1 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 p-3 bg-eerie-back/50 rounded-md">
                    Select a region to set its heart
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {availableRegions.length === 0 && (
          <div className="text-orange-400 text-sm">
            No regions available. Create at least one region first.
          </div>
        )}

        {/* Clear Data Button - Bottom of panel */}
        <div className="mt-6 pt-4 border-t border-gunmetal">
          <Button
            variant="secondary-outline"
            onClick={handleClearData}
            className="w-full"
            leftIcon={<Trash2 className="w-4 h-4" />}
            title="Clear all saved data"
          >
            Clear All Data
          </Button>
        </div>
      </div>

      <ClearDataModal
        isOpen={showClearDataModal}
        onConfirm={handleConfirmClearData}
        onCancel={() => setShowClearDataModal(false)}
      />
    </div>
  )
}
