import React, { useRef, useState } from 'react'
import { Heart, ClipboardCopy } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { Button } from '../Button'
import { DeleteSubregionModal } from '../DeleteSubregionModal'
import {
  SubregionListRow,
  type SubregionListItem,
  type YEditState,
  type XZEditState
} from '../SubregionListRow'
import { copyToClipboard } from '../../utils/polygonUtils'
import { buildBulkAnchorTpText, copySubregionTpToClipboard } from '../../utils/anchorClipboardUtils'
import { runRegionAnchorCsvImport } from '../../utils/regionAnchorImport'
import { useScrollAnchorRowIntoView } from '../../hooks/useScrollAnchorRowIntoView'
import { buildRegionHeartsVillageFormatCSV } from '../../utils/villageUtils'
import type { Region } from '../../types'

type RegionHeartsSectionProps = {
  expanded: boolean
  onToggleExpanded: () => void
  availableRegions: Region[]
}

export function RegionHeartsSection({ expanded, onToggleExpanded, availableRegions }: RegionHeartsSectionProps) {
  const { regions, seedInfo, mapCanvas, toast, worldName } = useAppContext()
  const heartCsvFileInputRef = useRef<HTMLInputElement>(null)
  const heartListItemRefs = useRef<Partial<Record<string, HTMLLIElement | null>>>({})
  const [isImportingHearts, setIsImportingHearts] = useState(false)
  const [heartImportError, setHeartImportError] = useState<string | null>(null)
  const [editingHeartY, setEditingHeartY] = useState<YEditState>(null)
  const [editingHeartX, setEditingHeartX] = useState<XZEditState>(null)
  const [editingHeartZ, setEditingHeartZ] = useState<XZEditState>(null)
  const [expandedRegionHeartsList, setExpandedRegionHeartsList] = useState(true)
  const [pendingHeartDelete, setPendingHeartDelete] = useState<{ regionId: string; name: string } | null>(null)

  useScrollAnchorRowIntoView({
    selectedRegionId: regions.selectedRegionId,
    regions: regions.regions,
    sectionExpanded: expanded,
    listExpanded: expandedRegionHeartsList,
    listItemRefs: heartListItemRefs,
    anchorField: 'centerPoint'
  })

  const handleHeartImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsImportingHearts(true)
    setHeartImportError(null)
    const { error } = await runRegionAnchorCsvImport(
      file,
      regions.importHeartsFromCSV,
      {
        rowKey: 'heartRows',
        noRowsToast: 'No region_heart rows found in CSV',
        failureMessage: 'Failed to import hearts'
      },
      toast.showToast
    )
    if (error) setHeartImportError(error)
    if (heartCsvFileInputRef.current) heartCsvFileInputRef.current.value = ''
    setIsImportingHearts(false)
  }

  const heartRegions = availableRegions
    .filter(r => r.centerPoint != null)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <div>
        <button
          type="button"
          onClick={onToggleExpanded}
          className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
        >
          <span className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Region Hearts
          </span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {expanded && (
          <div className="ml-4 space-y-4">
            <div className="space-y-2">
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Import hearts</h5>
                <p className="text-sm text-gray-300">
                  Uses rows where structure is region_heart (same CSV as export). Only X, Y, and Z are applied;
                  the details column is ignored. Each point is assigned to the region whose polygon contains it.
                </p>
                <button
                  type="button"
                  onClick={() => heartCsvFileInputRef.current?.click()}
                  disabled={availableRegions.length === 0 || isImportingHearts}
                  className="w-full bg-viridian hover:bg-viridian/80 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {isImportingHearts ? 'Importing…' : 'Import hearts (CSV)'}
                </button>
                <input
                  ref={heartCsvFileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleHeartImport}
                  className="hidden"
                />
                {heartImportError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-md text-sm">
                    {heartImportError}
                  </div>
                )}
              </div>

              {heartRegions.length > 0 && (
                <div className="space-y-1">
                  <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Placed hearts</h5>
                  <div className="border border-gray-600 rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedRegionHeartsList(prev => !prev)}
                      className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 hover:text-white border-0"
                    >
                      <span>Region hearts ({heartRegions.length})</span>
                      <svg
                        className={`w-4 h-4 shrink-0 transition-transform ${expandedRegionHeartsList ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {expandedRegionHeartsList && (
                      <div className="bg-gray-800/50 px-3 py-2 border-t border-gray-600 max-h-48 overflow-y-auto">
                        <ul className="space-y-1.5 text-sm">
                          {heartRegions.map(region => {
                            const cp = region.centerPoint!
                            const item: SubregionListItem = {
                              regionId: region.id,
                              subregionId: region.id,
                              name: region.name,
                              x: Math.round(cp.x),
                              z: Math.round(cp.z),
                              y: cp.y
                            }
                            const isSelectedHeartRow = regions.selectedRegionId === region.id
                            return (
                              <SubregionListRow
                                key={region.id}
                                item={item}
                                editingY={editingHeartY}
                                setEditingY={setEditingHeartY}
                                updateY={regions.updateRegionHeartY}
                                editingX={editingHeartX}
                                setEditingX={setEditingHeartX}
                                updateX={regions.updateRegionHeartX}
                                editingZ={editingHeartZ}
                                setEditingZ={setEditingHeartZ}
                                updateZ={regions.updateRegionHeartZ}
                                onCopyTp={target => {
                                  copySubregionTpToClipboard(target)
                                  toast.showToast('Teleport command copied', 'success')
                                }}
                                deleteLabel="Remove region heart"
                                onDelete={target => {
                                  setPendingHeartDelete({ regionId: target.regionId, name: target.name })
                                }}
                                listItemRef={el => {
                                  if (el) heartListItemRefs.current[region.id] = el
                                  else delete heartListItemRefs.current[region.id]
                                }}
                                listItemClassName={
                                  isSelectedHeartRow
                                    ? 'rounded-md -mx-1 px-1 ring-2 ring-lapis-lazuli/90 bg-lapis-lazuli/15'
                                    : undefined
                                }
                              />
                            )
                          })}
                        </ul>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              const names = heartRegions.map(r => r.name).join(', ')
                              navigator.clipboard.writeText(names)
                              toast.showToast('Names copied to clipboard', 'success')
                            }}
                            className="text-xs text-gray-400 hover:text-gray-300 underline cursor-pointer focus:outline-none"
                          >
                            Copy names
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const csv = buildRegionHeartsVillageFormatCSV(
                                regions.regions,
                                seedInfo.seedInfo.seed
                              )
                              if (!csv) {
                                toast.showToast('No region hearts to export', 'error')
                                return
                              }
                              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
                              const link = document.createElement('a')
                              const url = URL.createObjectURL(blob)
                              link.href = url
                              const slug = (worldName.worldName || 'world')
                                .replace(/[^a-zA-Z0-9]/g, '-')
                                .toLowerCase()
                              const date = new Date().toISOString().split('T')[0]
                              link.download = `${slug}-region-hearts-${date}.csv`
                              link.click()
                              URL.revokeObjectURL(url)
                              toast.showToast('Region hearts CSV downloaded', 'success')
                            }}
                            className="text-xs text-gray-400 hover:text-gray-300 underline cursor-pointer focus:outline-none"
                          >
                            Export CSV
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {heartRegions.length === 0 && availableRegions.length > 0 && (
                <p className="text-sm text-gray-500">
                  No region hearts yet. Select a region and use Set heart location on the map.
                </p>
              )}

              {regions.selectedRegionId ? (
                <div className="space-y-2">
                  {(() => {
                    const selectedRegion = regions.regions.find(r => r.id === regions.selectedRegionId)
                    const hasCenterPoint = selectedRegion?.centerPoint != null
                    const selId = regions.selectedRegionId!
                    return (
                      <div className="space-y-2">
                        {!hasCenterPoint ? (
                          mapCanvas.isSettingCenterPoint && mapCanvas.centerPointRegionId === selId ? (
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
                                mapCanvas.startSettingCenterPoint(selId)
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
                <div className="text-sm text-gray-400 pt-3 pr-3 pb-3 bg-eerie-back/50 rounded-md">
                  Select a region to set its heart on the map
                </div>
              )}
              {regions.regions.some(r => r.centerPoint != null) && (
                <button
                  type="button"
                  onClick={async () => {
                    const text = buildBulkAnchorTpText(regions.regions, r => r.centerPoint)
                    await copyToClipboard(text)
                    toast.showToast('All heart teleport commands copied', 'success')
                  }}
                  className="text-sm text-lapis-lazuli hover:text-lapis-lighter hover:underline transition-colors flex items-center gap-1"
                >
                  <ClipboardCopy className="w-4 h-4" />
                  Copy all heart TPs
                </button>
              )}
              <div className="text-sm text-white mt-2">
                {(() => {
                  const customHearts = regions.regions.filter(r => r.centerPoint != null).length
                  const totalRegions = regions.regions.length
                  return customHearts === totalRegions && totalRegions > 0
                    ? 'All regions have hearts'
                    : `${customHearts} region hearts set out of ${totalRegions} regions`
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      <DeleteSubregionModal
        isOpen={pendingHeartDelete != null}
        targetLabel="region heart"
        targetName={pendingHeartDelete?.name ?? ''}
        onCancel={() => setPendingHeartDelete(null)}
        onConfirm={() => {
          if (!pendingHeartDelete) return
          const { regionId } = pendingHeartDelete
          regions.setCustomCenterPoint(regionId, null)
          setEditingHeartX(prev => (prev?.regionId === regionId ? null : prev))
          setEditingHeartY(prev => (prev?.regionId === regionId ? null : prev))
          setEditingHeartZ(prev => (prev?.regionId === regionId ? null : prev))
          toast.showToast('Region heart removed', 'success')
          setPendingHeartDelete(null)
        }}
      />
    </>
  )
}
