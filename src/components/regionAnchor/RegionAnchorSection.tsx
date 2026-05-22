import React, { useMemo, useRef, useState } from 'react'
import { ClipboardCopy } from 'lucide-react'
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
import type { Region } from '../../types'
import type { RegionAnchorConfig } from './regionAnchorConfig'
import { getRegionAnchorApi } from './regionAnchorApi'

type RegionAnchorSectionProps = {
  config: RegionAnchorConfig
  expanded: boolean
  onToggleExpanded: () => void
  availableRegions: Region[]
}

export function RegionAnchorSection({
  config,
  expanded,
  onToggleExpanded,
  availableRegions
}: RegionAnchorSectionProps) {
  const { regions, seedInfo, mapCanvas, toast, worldName } = useAppContext()
  const api = useMemo(() => getRegionAnchorApi(config.kind, regions, mapCanvas), [config.kind, regions, mapCanvas])
  const { Icon } = config

  const csvFileInputRef = useRef<HTMLInputElement>(null)
  const listItemRefs = useRef<Partial<Record<string, HTMLLIElement | null>>>({})
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [editingY, setEditingY] = useState<YEditState>(null)
  const [editingX, setEditingX] = useState<XZEditState>(null)
  const [editingZ, setEditingZ] = useState<XZEditState>(null)
  const [expandedPlacedList, setExpandedPlacedList] = useState(true)
  const [pendingDelete, setPendingDelete] = useState<{ regionId: string; name: string } | null>(null)

  useScrollAnchorRowIntoView({
    selectedRegionId: regions.selectedRegionId,
    regions: regions.regions,
    sectionExpanded: expanded,
    listExpanded: expandedPlacedList,
    listItemRefs,
    anchorField: config.anchorField
  })

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    setImportError(null)
    const { error } = await runRegionAnchorCsvImport(
      file,
      api.importFromCsv,
      {
        rowKey: config.importRowKey,
        noRowsToast: config.noRowsToast,
        failureMessage: config.importFailureMessage
      },
      toast.showToast
    )
    if (error) setImportError(error)
    if (csvFileInputRef.current) csvFileInputRef.current.value = ''
    setIsImporting(false)
  }

  const placedRegions = availableRegions
    .filter(r => r[config.anchorField] != null)
    .sort((a, b) => a.name.localeCompare(b.name))

  const getAnchor = (region: Region) => region[config.anchorField]

  return (
    <>
      <div>
        <button
          type="button"
          onClick={onToggleExpanded}
          className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
        >
          <span className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {config.title}
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
                <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">{config.importHeading}</h5>
                <p className="text-sm text-gray-300">{config.importDescription}</p>
                <button
                  type="button"
                  onClick={() => csvFileInputRef.current?.click()}
                  disabled={availableRegions.length === 0 || isImporting}
                  className="w-full bg-viridian hover:bg-viridian/80 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {isImporting ? 'Importing…' : config.importButtonLabel}
                </button>
                <input
                  ref={csvFileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  className="hidden"
                />
                {importError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-md text-sm">
                    {importError}
                  </div>
                )}
              </div>

              {placedRegions.length > 0 && (
                <div className="space-y-1">
                  <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">{config.placedListHeading}</h5>
                  <div className="border border-gray-600 rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedPlacedList(prev => !prev)}
                      className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 hover:text-white border-0"
                    >
                      <span>{config.listAccordionLabel(placedRegions.length)}</span>
                      <svg
                        className={`w-4 h-4 shrink-0 transition-transform ${expandedPlacedList ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {expandedPlacedList && (
                      <div className="bg-gray-800/50 px-3 py-2 border-t border-gray-600 max-h-48 overflow-y-auto">
                        <ul className="space-y-1.5 text-sm">
                          {placedRegions.map(region => {
                            const anchor = getAnchor(region)!
                            const item: SubregionListItem = {
                              regionId: region.id,
                              subregionId: region.id,
                              name: region.name,
                              x: Math.round(anchor.x),
                              z: Math.round(anchor.z),
                              y: anchor.y
                            }
                            const isSelectedRow = regions.selectedRegionId === region.id
                            return (
                              <SubregionListRow
                                key={config.listItemKey(region.id)}
                                item={item}
                                editingY={editingY}
                                setEditingY={setEditingY}
                                updateY={api.updateY}
                                editingX={editingX}
                                setEditingX={setEditingX}
                                updateX={api.updateX}
                                editingZ={editingZ}
                                setEditingZ={setEditingZ}
                                updateZ={api.updateZ}
                                onCopyTp={target => {
                                  copySubregionTpToClipboard(target)
                                  toast.showToast('Teleport command copied', 'success')
                                }}
                                deleteLabel={config.deleteRowLabel}
                                onDelete={target => {
                                  setPendingDelete({ regionId: target.regionId, name: target.name })
                                }}
                                listItemRef={el => {
                                  if (el) listItemRefs.current[region.id] = el
                                  else delete listItemRefs.current[region.id]
                                }}
                                listItemClassName={
                                  isSelectedRow
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
                              const names = placedRegions.map(r => r.name).join(', ')
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
                              const csv = api.buildExportCsv(regions.regions, seedInfo.seedInfo.seed)
                              if (!csv) {
                                toast.showToast(config.exportEmptyToast, 'error')
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
                              link.download = `${slug}-${config.exportFilenameSuffix}-${date}.csv`
                              link.click()
                              URL.revokeObjectURL(url)
                              toast.showToast(config.exportSuccessToast, 'success')
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
              {placedRegions.length === 0 && availableRegions.length > 0 && (
                <p className="text-sm text-gray-500">{config.emptyPlacedMessage}</p>
              )}

              {regions.selectedRegionId ? (
                <div className="space-y-2">
                  {(() => {
                    const selectedRegion = regions.regions.find(r => r.id === regions.selectedRegionId)
                    const hasAnchor =
                      selectedRegion != null && getAnchor(selectedRegion) != null
                    const selId = regions.selectedRegionId!
                    const { mapPlacement } = api
                    return (
                      <div className="space-y-2">
                        {!hasAnchor ? (
                          mapPlacement.isPlacing && mapPlacement.placingRegionId === selId ? (
                            <div className="mb-4 p-3 bg-saffron border border-saffron rounded space-y-2 w-full">
                              <div className="flex items-center gap-2">
                                <p className="text-gray-900 text-base">
                                  <strong>{config.setLocationTitle}</strong>
                                </p>
                              </div>
                              <p className="text-gray-900 text-sm">{config.setLocationBody}</p>
                              <Button
                                onClick={() => mapPlacement.stopPlacing()}
                                variant="primary"
                                className="w-full mt-2"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => mapPlacement.startPlacing(selId)}
                              variant="secondary"
                              title={config.setLocationButtonTitle}
                            >
                              {config.setLocationButtonLabel}
                            </Button>
                          )
                        ) : null}
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div className="text-sm text-gray-400 pt-3 pr-3 pb-3 bg-eerie-back/50 rounded-md">
                  {config.selectRegionPrompt}
                </div>
              )}
              {regions.regions.some(r => getAnchor(r) != null) && (
                <button
                  type="button"
                  onClick={async () => {
                    const text = buildBulkAnchorTpText(regions.regions, getAnchor)
                    await copyToClipboard(text)
                    toast.showToast(config.bulkTpCopiedToast, 'success')
                  }}
                  className="text-sm text-lapis-lazuli hover:text-lapis-lighter hover:underline transition-colors flex items-center gap-1"
                >
                  <ClipboardCopy className="w-4 h-4" />
                  {config.bulkTpButtonLabel}
                </button>
              )}
              <div className="text-sm text-white mt-2">
                {(() => {
                  const customCount = regions.regions.filter(r => getAnchor(r) != null).length
                  const totalRegions = regions.regions.length
                  return customCount === totalRegions && totalRegions > 0
                    ? config.summaryAllSet
                    : config.summaryPartial(customCount, totalRegions)
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      <DeleteSubregionModal
        isOpen={pendingDelete != null}
        targetLabel={config.deleteModalLabel}
        targetName={pendingDelete?.name ?? ''}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return
          const { regionId } = pendingDelete
          api.clearAnchor(regionId)
          setEditingX(prev => (prev?.regionId === regionId ? null : prev))
          setEditingY(prev => (prev?.regionId === regionId ? null : prev))
          setEditingZ(prev => (prev?.regionId === regionId ? null : prev))
          toast.showToast(config.removedToast, 'success')
          setPendingDelete(null)
        }}
      />
    </>
  )
}
