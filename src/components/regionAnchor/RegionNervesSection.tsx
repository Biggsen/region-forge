import React, { useRef, useState } from 'react'
import { Activity, ClipboardCopy } from 'lucide-react'
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
import { buildRegionNervesVillageFormatCSV } from '../../utils/villageUtils'
import type { Region } from '../../types'

type RegionNervesSectionProps = {
  expanded: boolean
  onToggleExpanded: () => void
  availableRegions: Region[]
}

export function RegionNervesSection({ expanded, onToggleExpanded, availableRegions }: RegionNervesSectionProps) {
  const { regions, seedInfo, mapCanvas, toast, worldName } = useAppContext()
  const nerveCsvFileInputRef = useRef<HTMLInputElement>(null)
  const nerveListItemRefs = useRef<Partial<Record<string, HTMLLIElement | null>>>({})
  const [isImportingNerves, setIsImportingNerves] = useState(false)
  const [nerveImportError, setNerveImportError] = useState<string | null>(null)
  const [editingNerveY, setEditingNerveY] = useState<YEditState>(null)
  const [editingNerveX, setEditingNerveX] = useState<XZEditState>(null)
  const [editingNerveZ, setEditingNerveZ] = useState<XZEditState>(null)
  const [expandedRegionNervesList, setExpandedRegionNervesList] = useState(true)
  const [pendingNerveDelete, setPendingNerveDelete] = useState<{ regionId: string; name: string } | null>(null)

  useScrollAnchorRowIntoView({
    selectedRegionId: regions.selectedRegionId,
    regions: regions.regions,
    sectionExpanded: expanded,
    listExpanded: expandedRegionNervesList,
    listItemRefs: nerveListItemRefs,
    anchorField: 'nervePoint'
  })

  const handleNerveImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsImportingNerves(true)
    setNerveImportError(null)
    const { error } = await runRegionAnchorCsvImport(
      file,
      regions.importNervesFromCSV,
      {
        rowKey: 'nerveRows',
        noRowsToast: 'No region_nerve rows found in CSV',
        failureMessage: 'Failed to import nerves'
      },
      toast.showToast
    )
    if (error) setNerveImportError(error)
    if (nerveCsvFileInputRef.current) nerveCsvFileInputRef.current.value = ''
    setIsImportingNerves(false)
  }

  const nerveRegions = availableRegions
    .filter(r => r.nervePoint != null)
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
            <Activity className="w-4 h-4" />
            Region Nerves
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
                <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Import nerves</h5>
                <p className="text-sm text-gray-300">
                  Uses rows where structure is region_nerve (same CSV layout as hearts). Only X, Y, and Z are applied;
                  the details column is ignored. Each point is assigned to the region whose polygon contains it.
                </p>
                <button
                  type="button"
                  onClick={() => nerveCsvFileInputRef.current?.click()}
                  disabled={availableRegions.length === 0 || isImportingNerves}
                  className="w-full bg-viridian hover:bg-viridian/80 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {isImportingNerves ? 'Importing…' : 'Import nerves (CSV)'}
                </button>
                <input
                  ref={nerveCsvFileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleNerveImport}
                  className="hidden"
                />
                {nerveImportError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-md text-sm">
                    {nerveImportError}
                  </div>
                )}
              </div>

              {nerveRegions.length > 0 && (
                <div className="space-y-1">
                  <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Placed nerves</h5>
                  <div className="border border-gray-600 rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedRegionNervesList(prev => !prev)}
                      className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 hover:text-white border-0"
                    >
                      <span>Region nerves ({nerveRegions.length})</span>
                      <svg
                        className={`w-4 h-4 shrink-0 transition-transform ${expandedRegionNervesList ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {expandedRegionNervesList && (
                      <div className="bg-gray-800/50 px-3 py-2 border-t border-gray-600 max-h-48 overflow-y-auto">
                        <ul className="space-y-1.5 text-sm">
                          {nerveRegions.map(region => {
                            const np = region.nervePoint!
                            const item: SubregionListItem = {
                              regionId: region.id,
                              subregionId: region.id,
                              name: region.name,
                              x: Math.round(np.x),
                              z: Math.round(np.z),
                              y: np.y
                            }
                            const isSelectedNerveRow = regions.selectedRegionId === region.id
                            return (
                              <SubregionListRow
                                key={`nerve-${region.id}`}
                                item={item}
                                editingY={editingNerveY}
                                setEditingY={setEditingNerveY}
                                updateY={regions.updateRegionNerveY}
                                editingX={editingNerveX}
                                setEditingX={setEditingNerveX}
                                updateX={regions.updateRegionNerveX}
                                editingZ={editingNerveZ}
                                setEditingZ={setEditingNerveZ}
                                updateZ={regions.updateRegionNerveZ}
                                onCopyTp={target => {
                                  copySubregionTpToClipboard(target)
                                  toast.showToast('Teleport command copied', 'success')
                                }}
                                deleteLabel="Remove region nerve"
                                onDelete={target => {
                                  setPendingNerveDelete({ regionId: target.regionId, name: target.name })
                                }}
                                listItemRef={el => {
                                  if (el) nerveListItemRefs.current[region.id] = el
                                  else delete nerveListItemRefs.current[region.id]
                                }}
                                listItemClassName={
                                  isSelectedNerveRow
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
                              const names = nerveRegions.map(r => r.name).join(', ')
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
                              const csv = buildRegionNervesVillageFormatCSV(
                                regions.regions,
                                seedInfo.seedInfo.seed
                              )
                              if (!csv) {
                                toast.showToast('No region nerves to export', 'error')
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
                              link.download = `${slug}-region-nerves-${date}.csv`
                              link.click()
                              URL.revokeObjectURL(url)
                              toast.showToast('Region nerves CSV downloaded', 'success')
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
              {nerveRegions.length === 0 && availableRegions.length > 0 && (
                <p className="text-sm text-gray-500">
                  No region nerves yet. Select a region and use Set nerve location on the map.
                </p>
              )}

              {regions.selectedRegionId ? (
                <div className="space-y-2">
                  {(() => {
                    const selectedRegion = regions.regions.find(r => r.id === regions.selectedRegionId)
                    const hasNervePoint = selectedRegion?.nervePoint != null
                    const selId = regions.selectedRegionId!
                    return (
                      <div className="space-y-2">
                        {!hasNervePoint ? (
                          mapCanvas.isSettingNervePoint && mapCanvas.nervePointRegionId === selId ? (
                            <div className="mb-4 p-3 bg-saffron border border-saffron rounded space-y-2 w-full">
                              <div className="flex items-center gap-2">
                                <p className="text-gray-900 text-base">
                                  <strong>Set Nerve Location</strong>
                                </p>
                              </div>
                              <p className="text-gray-900 text-sm">
                                Click on the map to set the nerve location
                              </p>
                              <Button
                                onClick={() => {
                                  mapCanvas.stopSettingNervePoint()
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
                                mapCanvas.startSettingNervePoint(selId)
                              }}
                              variant="secondary"
                              title="Click on map to set region nerve"
                            >
                              Set nerve location
                            </Button>
                          )
                        ) : null}
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div className="text-sm text-gray-400 pt-3 pr-3 pb-3 bg-eerie-back/50 rounded-md">
                  Select a region to set its nerve on the map
                </div>
              )}
              {regions.regions.some(r => r.nervePoint != null) && (
                <button
                  type="button"
                  onClick={async () => {
                    const text = buildBulkAnchorTpText(regions.regions, r => r.nervePoint)
                    await copyToClipboard(text)
                    toast.showToast('All nerve teleport commands copied', 'success')
                  }}
                  className="text-sm text-lapis-lazuli hover:text-lapis-lighter hover:underline transition-colors flex items-center gap-1"
                >
                  <ClipboardCopy className="w-4 h-4" />
                  Copy all nerve TPs
                </button>
              )}
              <div className="text-sm text-white mt-2">
                {(() => {
                  const customNerves = regions.regions.filter(r => r.nervePoint != null).length
                  const totalRegions = regions.regions.length
                  return customNerves === totalRegions && totalRegions > 0
                    ? 'All regions have nerves'
                    : `${customNerves} region nerves set out of ${totalRegions} regions`
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      <DeleteSubregionModal
        isOpen={pendingNerveDelete != null}
        targetLabel="region nerve"
        targetName={pendingNerveDelete?.name ?? ''}
        onCancel={() => setPendingNerveDelete(null)}
        onConfirm={() => {
          if (!pendingNerveDelete) return
          const { regionId } = pendingNerveDelete
          regions.setCustomNervePoint(regionId, null)
          setEditingNerveX(prev => (prev?.regionId === regionId ? null : prev))
          setEditingNerveY(prev => (prev?.regionId === regionId ? null : prev))
          setEditingNerveZ(prev => (prev?.regionId === regionId ? null : prev))
          toast.showToast('Region nerve removed', 'success')
          setPendingNerveDelete(null)
        }}
      />
    </>
  )
}
