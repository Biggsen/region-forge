import React, { useRef, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { importMapData } from '../utils/exportUtils'
import { clearSavedData } from '../utils/persistenceUtils'
import { ChallengeLevel } from '../types'
import { RegionActions } from './RegionActions'
import { SpawnButton } from './SpawnButton'
import { Button } from './Button'
import { Trash2, Heart, ClipboardCopy, MapPin, Pencil } from 'lucide-react'
import { ClearDataModal } from './ClearDataModal'

export function AdvancedPanel() {
  const { regions, seedInfo, mapCanvas, toast, worldName, spawn } = useAppContext()
  const villageFileInputRef = useRef<HTMLInputElement>(null)
  const importFileInputRef = useRef<HTMLInputElement>(null)
  const [isImportingVillages, setIsImportingVillages] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [villageImportError, setVillageImportError] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [isOtherRegionTypesExpanded, setIsOtherRegionTypesExpanded] = useState(false)
  const [isPluginsExpanded, setIsPluginsExpanded] = useState(false)
  const [isVillagesExpanded, setIsVillagesExpanded] = useState(false)
  const [isImportExpanded, setIsImportExpanded] = useState(false)
  const [isRegionSpecificExpanded, setIsRegionSpecificExpanded] = useState(false)
  const [customCenterX, setCustomCenterX] = useState('')
  const [customCenterZ, setCustomCenterZ] = useState('')
  const [showCustomCenterForm, setShowCustomCenterForm] = useState(false)
  const [showClearDataModal, setShowClearDataModal] = useState(false)

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

  const handleRemoveCenterPoint = () => {
    if (regions.selectedRegionId) {
      regions.setCustomCenterPoint(regions.selectedRegionId, null)
      toast.showToast('Region heart removed', 'success')
    }
  }

  const handleShowCustomCenterForm = () => {
    if (regions.selectedRegionId) {
      const selectedRegion = regions.regions.find(r => r.id === regions.selectedRegionId)
      if (selectedRegion?.centerPoint) {
        setCustomCenterX(Math.round(selectedRegion.centerPoint.x).toString())
        setCustomCenterZ(Math.round(selectedRegion.centerPoint.z).toString())
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
        {seedInfo.seedInfo.dimension !== 'nether' && (
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
                <SpawnButton />
              </div>
            )}
          </div>
        )}

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
                <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">LevelledMobs</h5>
                <RegionActions
                  regions={availableRegions}
                  onRandomizeChallengeLevels={handleRandomizeChallengeLevels}
                />
              </div>
            </div>
          )}
        </div>

        {seedInfo.seedInfo.dimension !== 'nether' && (
          <div>
            {/* Villages */}
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
        )}

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

              {seedInfo.seedInfo.dimension !== 'nether' && (
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
                <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Region Heart
                </h5>
                
                {regions.selectedRegionId ? (
                  <div className="space-y-2">
                    {!showCustomCenterForm ? (
                      (() => {
                        const selectedRegion = regions.regions.find(r => r.id === regions.selectedRegionId)
                        const hasCenterPoint = selectedRegion?.centerPoint != null
                        if (!hasCenterPoint) {
                          return null
                        }
                        return (
                          <div className="p-4 border border-gunmetal rounded">
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-mono">
                                <span className="text-gray-400">X:</span> <span className="text-white inline-block w-[30px]">{Math.round(selectedRegion!.centerPoint!.x)}</span>{' '}
                                <span className="text-gray-400 ml-3">Z:</span> <span className="text-white inline-block w-[30px]">{Math.round(selectedRegion!.centerPoint!.z)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => {
                                    const tpCommand = `/tp @s ${Math.round(selectedRegion!.centerPoint!.x)} ~ ${Math.round(selectedRegion!.centerPoint!.z)}`
                                    navigator.clipboard.writeText(tpCommand)
                                    toast.showToast('Teleport command copied', 'success')
                                  }}
                                  className="text-gray-300 text-sm p-1 rounded transition-colors hover:bg-viridian"
                                  title="Copy /tp command to clipboard"
                                >
                                  <ClipboardCopy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleShowCustomCenterForm}
                                  className="text-gray-300 text-sm p-1 rounded transition-colors hover:bg-viridian"
                                  title="Edit coordinates"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleRemoveCenterPoint}
                                  className="text-gray-300 text-sm p-1 rounded transition-colors hover:bg-viridian"
                                  title="Remove region heart"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })()
                    ) : (
                      <div className="mb-4 p-3 bg-saffron border border-saffron rounded space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="text-gray-900" size={18} />
                          <p className="text-gray-900 text-base">
                            <strong>Edit heart location</strong>
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-700 mb-1 font-medium">X Coordinate</label>
                            <input
                              type="number"
                              value={customCenterX}
                              onChange={(e) => setCustomCenterX(e.target.value)}
                              placeholder="X"
                              className="w-full bg-white text-gray-900 px-2 py-1 rounded border border-gray-300 focus:border-gray-500 focus:outline-none text-sm placeholder:text-gray-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-700 mb-1 font-medium">Z Coordinate</label>
                            <input
                              type="number"
                              value={customCenterZ}
                              onChange={(e) => setCustomCenterZ(e.target.value)}
                              placeholder="Z"
                              className="w-full bg-white text-gray-900 px-2 py-1 rounded border border-gray-300 focus:border-gray-500 focus:outline-none text-sm placeholder:text-gray-400"
                            />
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <Button
                            variant="ghost"
                            onClick={() => setShowCustomCenterForm(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            onClick={handleSetCustomCenter}
                            disabled={!customCenterX || !customCenterZ}
                            className="flex-1"
                          >
                            Update
                          </Button>
                        </div>
                      </div>
                    )}

                    {!showCustomCenterForm && (() => {
                      const selectedRegion = regions.regions.find(r => r.id === regions.selectedRegionId)
                      const hasCenterPoint = selectedRegion?.centerPoint != null
                      return (
                        <div className="flex space-x-2">
                          {!hasCenterPoint ? (
                            mapCanvas.isSettingCenterPoint && mapCanvas.centerPointRegionId === regions.selectedRegionId ? (
                              <div className="mb-4 p-3 bg-saffron border border-saffron rounded space-y-2 w-full">
                                <div className="flex items-center gap-2">
                                  <p className="text-gray-900 text-base">
                                    <strong>Set Heart Location</strong>
                                  </p>
                                </div>
                                <p className="text-gray-900 text-sm">
                                  Click on the map to set the heart location
                                </p>
                                <Button
                                  onClick={() => {
                                    mapCanvas.stopSettingCenterPoint()
                                  }}
                                  variant="primary"
                                  className="w-full mt-2"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={() => {
                                  mapCanvas.startSettingCenterPoint(regions.selectedRegionId!)
                                }}
                                variant="secondary"
                                title="Click on map to set region heart"
                              >
                                Set heart location
                              </Button>
                            )
                          ) : null}
                        </div>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 p-3 bg-eerie-back/50 rounded-md">
                    Select a region to set its heart
                  </div>
                )}
                <div className="text-sm text-white mt-2">
                  {(() => {
                    const customHearts = regions.regions.filter(r => r.centerPoint != null).length
                    const totalRegions = regions.regions.length
                    return `${customHearts} region hearts set out of ${totalRegions} regions`
                  })()}
                </div>
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
