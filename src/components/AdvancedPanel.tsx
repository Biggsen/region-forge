import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { importMapData } from '../utils/exportUtils'
import { clearSavedData, loadStructureTableSort, saveStructureTableSort, loadAdvancedPanelSectionsState, saveAdvancedPanelSectionsState } from '../utils/persistenceUtils'
import { scanBiomes, scanBiomesFullImage, getGroupedLandVsSea } from '../utils/biomeScanner'
import { ChallengeLevel, StructureType, STRUCTURE_TYPES } from '../types'
import { RegionActions } from './RegionActions'
import { SpawnButton } from './SpawnButton'
import { Button } from './Button'
import { Trash2, Heart, ClipboardCopy, LocateFixed, Skull, Home, FolderOpen, FileText, TreePine, Globe, Sparkles, BookOpen, ScrollText, Eye, EyeOff, ChevronRight, ChevronUp, ChevronDown, Highlighter, Droplets } from 'lucide-react'
import { pickRandomMinecraftData, MINECRAFT_CATEGORIES, getAllItems } from '../utils/minecraftUtils'
import { pickRandomThemePairs, getAValues, getBValues } from '../utils/regionThemeUtils'
import { copyToClipboard, calculateRegionCenter } from '../utils/polygonUtils'
import { findParentRegion, buildRegionHeartsVillageFormatCSV } from '../utils/villageUtils'
import { formatRegionLore } from '../utils/loreInstructionsUtils'
import { MinecraftItemPicker } from './MinecraftItemPicker'
import { ClearDataModal } from './ClearDataModal'
import { RegionDescriptionModal } from './RegionDescriptionModal'
import { DeleteSubregionModal } from './DeleteSubregionModal'
import { BaseModal } from './BaseModal'
import { CsvImportResultsModal } from './CsvImportResultsModal'

const STRUCTURE_DISPLAY: Record<StructureType, { countLabel: string; pluralLabel: string; buttonLabel: string }> = {
  [STRUCTURE_TYPES.JUNGLE_TEMPLE]: { countLabel: 'Jungle Temple', pluralLabel: 'jungle temples', buttonLabel: 'Import Jungle Temples (CSV)' },
  [STRUCTURE_TYPES.IGLOO]: { countLabel: 'Igloo', pluralLabel: 'igloos', buttonLabel: 'Import Igloos (CSV)' },
  [STRUCTURE_TYPES.DESERT_PYRAMID]: { countLabel: 'Desert Pyramid', pluralLabel: 'desert pyramids', buttonLabel: 'Import Desert Pyramids (CSV)' },
  [STRUCTURE_TYPES.DESERT_WELL]: { countLabel: 'Desert Well', pluralLabel: 'desert wells', buttonLabel: 'Import Desert Wells (CSV)' },
  [STRUCTURE_TYPES.PILLAGER_OUTPOST]: { countLabel: 'Pillager Outpost', pluralLabel: 'pillager outposts', buttonLabel: 'Import Pillager Outposts (CSV)' },
  [STRUCTURE_TYPES.ANCIENT_CITY]: { countLabel: 'Ancient City', pluralLabel: 'ancient cities', buttonLabel: 'Import Ancient Cities (CSV)' },
  [STRUCTURE_TYPES.TRAIL_RUINS]: { countLabel: 'Trail Ruins', pluralLabel: 'trail ruins', buttonLabel: 'Import Trail Ruins (CSV)' },
  [STRUCTURE_TYPES.BURIED_TREASURE]: { countLabel: 'Buried Treasure', pluralLabel: 'buried treasures', buttonLabel: 'Import Buried Treasure (CSV)' },
  [STRUCTURE_TYPES.WOODLAND_MANSION]: { countLabel: 'Woodland Mansion', pluralLabel: 'woodland mansions', buttonLabel: 'Import Woodland Mansions (CSV)' },
  [STRUCTURE_TYPES.SWAMP_HUT]: { countLabel: 'Swamp Hut', pluralLabel: 'swamp huts', buttonLabel: 'Import Swamp Huts (CSV)' },
  [STRUCTURE_TYPES.SHIPWRECK]: { countLabel: 'Shipwreck', pluralLabel: 'shipwrecks', buttonLabel: 'Import Shipwrecks (CSV)' },
}

type YEditState = { regionId: string; subregionId: string; value: string } | null
type XZEditState = YEditState
type HeightEditState = { regionId: string; subregionId: string; value: string } | null

const DEFAULT_ADVANCED_PANEL_SECTIONS = {
  isOtherRegionTypesExpanded: false,
  isWaterExpanded: false,
  isPluginsExpanded: false,
  isVillagesExpanded: false,
  isStructuresExpanded: false,
  isImportExpanded: false,
  isRegionSpecificExpanded: false,
  isRegionDescriptionExpanded: false,
  isBiomeDataExpanded: false,
  isWorldBiomeDataExpanded: false,
  isMinecraftDataExpanded: false,
  isRegionThemeExpanded: false,
  isLoreInstructionsExpanded: false,
}

type SubregionListItem = {
  regionId: string
  subregionId: string
  name: string
  x: number
  y?: number
  height?: number
  z: number
  regionName?: string
}

function SubregionListRow({
  item,
  editingY,
  setEditingY,
  updateY,
  editingX,
  setEditingX,
  updateX,
  editingZ,
  setEditingZ,
  updateZ,
  editingHeight,
  setEditingHeight,
  updateHeight,
  showVillageHeight,
  onDelete,
  deleteLabel,
  onCopyTp,
  listItemRef,
  listItemClassName
}: {
  item: SubregionListItem
  editingY: YEditState
  setEditingY: React.Dispatch<React.SetStateAction<YEditState>>
  updateY: (regionId: string, subregionId: string, y: number | undefined) => void
  editingX?: XZEditState
  setEditingX?: React.Dispatch<React.SetStateAction<XZEditState>>
  updateX?: (regionId: string, subregionId: string, x: number) => void
  editingZ?: XZEditState
  setEditingZ?: React.Dispatch<React.SetStateAction<XZEditState>>
  updateZ?: (regionId: string, subregionId: string, z: number) => void
  editingHeight?: HeightEditState
  setEditingHeight?: React.Dispatch<React.SetStateAction<HeightEditState>>
  updateHeight?: (regionId: string, subregionId: string, height: number | undefined) => void
  showVillageHeight?: boolean
  onDelete: (item: SubregionListItem) => void
  deleteLabel: string
  onCopyTp: (item: SubregionListItem) => void
  listItemRef?: React.Ref<HTMLLIElement>
  listItemClassName?: string
}) {
  const saveY = () => {
    if (!editingY) return
    const v = editingY.value.trim()
    const n = v === '' ? undefined : parseInt(v, 10)
    if (v === '' || !Number.isNaN(n)) {
      updateY(editingY.regionId, editingY.subregionId, v === '' ? undefined : n)
    }
    setEditingY(null)
  }

  const saveX = () => {
    if (!editingX || !setEditingX || !updateX) return
    const v = editingX.value.trim()
    const n = parseInt(v, 10)
    if (v !== '' && !Number.isNaN(n)) {
      updateX(editingX.regionId, editingX.subregionId, n)
    }
    setEditingX(null)
  }

  const saveZ = () => {
    if (!editingZ || !setEditingZ || !updateZ) return
    const v = editingZ.value.trim()
    const n = parseInt(v, 10)
    if (v !== '' && !Number.isNaN(n)) {
      updateZ(editingZ.regionId, editingZ.subregionId, n)
    }
    setEditingZ(null)
  }

  const saveHeight = () => {
    if (!editingHeight || !setEditingHeight || !updateHeight) return
    const v = editingHeight.value.trim()
    const n = v === '' ? null : parseInt(v, 10)
    if (v === '' || (n !== null && !Number.isNaN(n) && n > 0)) {
      updateHeight(editingHeight.regionId, editingHeight.subregionId, v === '' ? undefined : (n ?? undefined))
    }
    setEditingHeight(null)
  }

  return (
    <li
      ref={listItemRef}
      className={`flex flex-col gap-y-0.5${listItemClassName ? ` ${listItemClassName}` : ''}`}
    >
      <div className="flex items-start gap-x-2">
        <span className="text-white font-medium flex-1 min-w-0">{item.name}</span>
        <button
          type="button"
          onClick={() => onCopyTp(item)}
          className="text-gray-400 p-0.5 rounded transition-colors hover:bg-gray-600 hover:text-white shrink-0"
          title="Copy /tp command to clipboard"
        >
          <ClipboardCopy className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="text-gray-400 p-0.5 rounded transition-colors hover:bg-red-600/30 hover:text-red-300 shrink-0"
          title={deleteLabel}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-x-1 text-gray-400">
        {updateX && setEditingX ? (
          editingX?.subregionId === item.subregionId ? (
            <input
              type="text"
              inputMode="numeric"
              className="appearance-none m-0 bg-transparent border-0 border-b-2 border-lapis-lazuli text-gray-400 focus:outline-none focus:border-lapis-lighter px-0.5 pt-px pb-0 leading-none"
              style={{ width: `${Math.max(2, (editingX.value.length || 0) + 1)}ch` }}
              placeholder="x"
              autoFocus
              value={editingX.value}
              onChange={e => setEditingX(prev => (prev ? { ...prev, value: e.target.value } : null))}
              onBlur={saveX}
              onKeyDown={e => {
                if (e.key === 'Enter') saveX()
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() =>
                setEditingX({
                  regionId: item.regionId,
                  subregionId: item.subregionId,
                  value: String(item.x)
                })
              }
              className="text-gray-400 border-b-2 border-gray-500 hover:border-gray-400 w-fit min-w-[2ch] text-left px-0.5 pt-px pb-0 leading-none cursor-pointer focus:outline-none"
              title="Set X coordinate"
            >
              {item.x}
            </button>
          )
        ) : (
          <span>{item.x}</span>
        )}
        <span>,</span>
        {editingY?.subregionId === item.subregionId ? (
          <input
            type="text"
            inputMode="numeric"
            className="appearance-none m-0 bg-transparent border-0 border-b-2 border-lapis-lazuli text-gray-400 focus:outline-none focus:border-lapis-lighter px-0.5 pt-px pb-0 leading-none"
            style={{ width: `${Math.max(2, (editingY.value.length || 0) + 1)}ch` }}
            placeholder="y"
            autoFocus
            value={editingY.value}
            onChange={e => setEditingY(prev => (prev ? { ...prev, value: e.target.value } : null))}
            onBlur={saveY}
            onKeyDown={e => {
              if (e.key === 'Enter') saveY()
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() =>
              setEditingY({
                regionId: item.regionId,
                subregionId: item.subregionId,
                value: String(item.y ?? '')
              })
            }
            className="text-gray-400 border-b-2 border-gray-500 hover:border-gray-400 w-fit min-w-[2ch] text-left px-0.5 pt-px pb-0 leading-none cursor-pointer focus:outline-none"
            title="Set Y coordinate"
          >
            {item.y != null ? item.y : '\u00a0'}
          </button>
        )}
        <span>,</span>
        {updateZ && setEditingZ ? (
          editingZ?.subregionId === item.subregionId ? (
            <input
              type="text"
              inputMode="numeric"
              className="appearance-none m-0 bg-transparent border-0 border-b-2 border-lapis-lazuli text-gray-400 focus:outline-none focus:border-lapis-lighter px-0.5 pt-px pb-0 leading-none"
              style={{ width: `${Math.max(2, (editingZ.value.length || 0) + 1)}ch` }}
              placeholder="z"
              autoFocus
              value={editingZ.value}
              onChange={e => setEditingZ(prev => (prev ? { ...prev, value: e.target.value } : null))}
              onBlur={saveZ}
              onKeyDown={e => {
                if (e.key === 'Enter') saveZ()
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() =>
                setEditingZ({
                  regionId: item.regionId,
                  subregionId: item.subregionId,
                  value: String(item.z)
                })
              }
              className="text-gray-400 border-b-2 border-gray-500 hover:border-gray-400 w-fit min-w-[2ch] text-left px-0.5 pt-px pb-0 leading-none cursor-pointer focus:outline-none"
              title="Set Z coordinate"
            >
              {item.z}
            </button>
          )
        ) : (
          <span>{item.z}</span>
        )}
        {showVillageHeight && (
          <>
            <span className="ml-2">Height:</span>
            {editingHeight?.subregionId === item.subregionId && setEditingHeight ? (
              <input
                type="text"
                inputMode="numeric"
                className="appearance-none m-0 bg-transparent border-0 border-b-2 border-lapis-lazuli text-gray-400 focus:outline-none focus:border-lapis-lighter px-0.5 pt-px pb-0 leading-none"
                style={{ width: `${Math.max(4, (editingHeight.value.length || 0) + 1)}ch` }}
                placeholder="auto"
                autoFocus
                value={editingHeight.value}
                onChange={e => setEditingHeight(prev => (prev ? { ...prev, value: e.target.value } : null))}
                onBlur={saveHeight}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveHeight()
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() =>
                  setEditingHeight?.({
                    regionId: item.regionId,
                    subregionId: item.subregionId,
                    value: String(item.height ?? '')
                  })
                }
                className="text-gray-400 border-b-2 border-gray-500 hover:border-gray-400 w-fit min-w-[4ch] text-left px-0.5 pt-px pb-0 leading-none cursor-pointer focus:outline-none"
                title="Set village export height"
              >
                {item.height != null ? item.height : 'auto'}
              </button>
            )}
          </>
        )}
      </div>
      {item.regionName && <span className="text-gray-500 text-xs pl-0">— {item.regionName}</span>}
    </li>
  )
}

export function AdvancedPanel() {
  const { regions, seedInfo, mapCanvas, toast, mapState, worldName, biomeLabelVisibility, customMarkers } = useAppContext()
  const villageFileInputRef = useRef<HTMLInputElement>(null)
  const structureFileInputRef = useRef<HTMLInputElement>(null)
  const heartCsvFileInputRef = useRef<HTMLInputElement>(null)
  const heartListItemRefs = useRef<Partial<Record<string, HTMLLIElement | null>>>({})
  const pendingStructureTypeRef = useRef<StructureType | null>(null)
  const importFileInputRef = useRef<HTMLInputElement>(null)
  const [isImportingVillages, setIsImportingVillages] = useState(false)
  const [importVillageCoordsOnly, setImportVillageCoordsOnly] = useState(false)
  const [isImportingStructures, setIsImportingStructures] = useState(false)
  const [selectedStructureTypeForImport, setSelectedStructureTypeForImport] = useState<StructureType>(
    (Object.values(STRUCTURE_TYPES) as StructureType[])[0]
  )
  const [isImporting, setIsImporting] = useState(false)
  const [villageImportError, setVillageImportError] = useState<string | null>(null)
  const [structureImportError, setStructureImportError] = useState<string | null>(null)
  const [isImportingHearts, setIsImportingHearts] = useState(false)
  const [heartImportError, setHeartImportError] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [manualStructureModalOpen, setManualStructureModalOpen] = useState(false)
  const [manualStructureForm, setManualStructureForm] = useState({
    structureType: (Object.values(STRUCTURE_TYPES) as StructureType[])[0],
    x: '',
    y: '',
    z: '',
    name: '',
  })
  const savedSectionState = useMemo(
    () => loadAdvancedPanelSectionsState(DEFAULT_ADVANCED_PANEL_SECTIONS),
    []
  )
  const [isOtherRegionTypesExpanded, setIsOtherRegionTypesExpanded] = useState(savedSectionState.isOtherRegionTypesExpanded)
  const [isWaterExpanded, setIsWaterExpanded] = useState(savedSectionState.isWaterExpanded)
  const [isPluginsExpanded, setIsPluginsExpanded] = useState(savedSectionState.isPluginsExpanded)
  const [isVillagesExpanded, setIsVillagesExpanded] = useState(savedSectionState.isVillagesExpanded)
  const [isStructuresExpanded, setIsStructuresExpanded] = useState(savedSectionState.isStructuresExpanded)
  const [structureTableSort, setStructureTableSort] = useState<{ column: 'type' | 'count' | 'regions'; dir: 'asc' | 'desc' }>(() => loadStructureTableSort())
  const [expandedStructureAccordion, setExpandedStructureAccordion] = useState<StructureType | null>(null)
  const [isImportExpanded, setIsImportExpanded] = useState(savedSectionState.isImportExpanded)
  const [isRegionSpecificExpanded, setIsRegionSpecificExpanded] = useState(savedSectionState.isRegionSpecificExpanded)
  const [isRegionDescriptionExpanded, setIsRegionDescriptionExpanded] = useState(savedSectionState.isRegionDescriptionExpanded)
  const [isBiomeDataExpanded, setIsBiomeDataExpanded] = useState(savedSectionState.isBiomeDataExpanded)
  const [isWorldBiomeDataExpanded, setIsWorldBiomeDataExpanded] = useState(savedSectionState.isWorldBiomeDataExpanded)
  const [isMinecraftDataExpanded, setIsMinecraftDataExpanded] = useState(savedSectionState.isMinecraftDataExpanded)
  const [isRegionThemeExpanded, setIsRegionThemeExpanded] = useState(savedSectionState.isRegionThemeExpanded)
  const [isLoreInstructionsExpanded, setIsLoreInstructionsExpanded] = useState(savedSectionState.isLoreInstructionsExpanded)
  const [loreSimplerMode, setLoreSimplerMode] = useState(false)
  const [expandedRegionCategories, setExpandedRegionCategories] = useState<Set<string>>(new Set())
  const [expandedWorldCategories, setExpandedWorldCategories] = useState<Set<string>>(new Set())
  const [editingStructureY, setEditingStructureY] = useState<YEditState>(null)
  const [editingStructureX, setEditingStructureX] = useState<XZEditState>(null)
  const [editingStructureZ, setEditingStructureZ] = useState<XZEditState>(null)
  const [editingHeartY, setEditingHeartY] = useState<YEditState>(null)
  const [editingHeartX, setEditingHeartX] = useState<XZEditState>(null)
  const [editingHeartZ, setEditingHeartZ] = useState<XZEditState>(null)
  const [expandedRegionHeartsList, setExpandedRegionHeartsList] = useState(true)
  const [editingVillageY, setEditingVillageY] = useState<YEditState>(null)
  const [editingVillageHeight, setEditingVillageHeight] = useState<HeightEditState>(null)

  useEffect(() => {
    saveStructureTableSort(structureTableSort)
  }, [structureTableSort])

  useEffect(() => {
    saveAdvancedPanelSectionsState({
      isOtherRegionTypesExpanded,
      isWaterExpanded,
      isPluginsExpanded,
      isVillagesExpanded,
      isStructuresExpanded,
      isImportExpanded,
      isRegionSpecificExpanded,
      isRegionDescriptionExpanded,
      isBiomeDataExpanded,
      isWorldBiomeDataExpanded,
      isMinecraftDataExpanded,
      isRegionThemeExpanded,
      isLoreInstructionsExpanded,
    })
  }, [
    isOtherRegionTypesExpanded,
    isWaterExpanded,
    isPluginsExpanded,
    isVillagesExpanded,
    isStructuresExpanded,
    isImportExpanded,
    isRegionSpecificExpanded,
    isRegionDescriptionExpanded,
    isBiomeDataExpanded,
    isWorldBiomeDataExpanded,
    isMinecraftDataExpanded,
    isRegionThemeExpanded,
    isLoreInstructionsExpanded,
  ])

  const toggleRegionCategory = (key: string) => {
    setExpandedRegionCategories(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }
  const toggleWorldCategory = (key: string) => {
    setExpandedWorldCategories(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const [csvImportResults, setCsvImportResults] = useState<{
    title: string
    added: number
    orphaned: number
    singularLabel: string
    pluralLabel: string
  } | null>(null)
  const [showClearDataModal, setShowClearDataModal] = useState(false)
  const [showDescriptionModal, setShowDescriptionModal] = useState(false)
  const [pendingSubregionDelete, setPendingSubregionDelete] = useState<{
    type: 'village' | 'structure'
    item: { regionId: string; subregionId: string; name: string }
  } | null>(null)
  const [pendingHeartDelete, setPendingHeartDelete] = useState<{ regionId: string; name: string } | null>(null)
  const [editCategory, setEditCategory] = useState('')
  const [editItems, setEditItems] = useState<({ id: string; name: string } | null)[]>([null, null, null])
  const [editThemePairs, setEditThemePairs] = useState<{ a: string; b: string }[]>([{ a: '', b: '' }, { a: '', b: '' }, { a: '', b: '' }])

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

      const results = regions.importVillagesFromCSV(text, {
        preserveExistingNames: importVillageCoordsOnly
      })
      customMarkers.addOrphanedVillageMarkers(results.orphanedVillages)

      setCsvImportResults({
        title: 'Village CSV import',
        added: results.added,
        orphaned: results.orphaned,
        singularLabel: 'village',
        pluralLabel: 'villages',
      })

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

  const handleStructureImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    const structureType = pendingStructureTypeRef.current
    pendingStructureTypeRef.current = null
    if (!file || !structureType) return
    setIsImportingStructures(true)
    setStructureImportError(null)
    try {
      const text = await file.text()
      if (!text.trim()) throw new Error('File is empty or contains no valid data')
      const results = regions.importStructuresFromCSV(text, structureType)
      customMarkers.addOrphanedVillageMarkers(results.orphanedVillages)
      const display = STRUCTURE_DISPLAY[structureType]
      setCsvImportResults({
        title: `${display.countLabel} CSV import`,
        added: results.added,
        orphaned: results.orphaned,
        singularLabel: display.countLabel,
        pluralLabel: display.pluralLabel,
      })
      if (structureFileInputRef.current) structureFileInputRef.current.value = ''
    } catch (error) {
      console.error('Structure import error:', error)
      setStructureImportError(error instanceof Error ? error.message : 'Failed to import structures')
    } finally {
      setIsImportingStructures(false)
    }
  }

  const handleHeartImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsImportingHearts(true)
    setHeartImportError(null)
    try {
      const text = await file.text()
      if (!text.trim()) {
        throw new Error('File is empty or contains no valid data')
      }
      const result = regions.importHeartsFromCSV(text)
      if (result.heartRows === 0) {
        toast.showToast('No region_heart rows found in CSV', 'error')
      } else {
        const msg = [
          `Updated ${result.regionsUpdated} region${result.regionsUpdated === 1 ? '' : 's'}`,
          result.orphaned > 0
            ? `${result.orphaned} row${result.orphaned === 1 ? '' : 's'} not inside any region`
            : null
        ]
          .filter(Boolean)
          .join('. ')
        toast.showToast(msg, result.orphaned > 0 ? 'warning' : 'success')
      }
      if (heartCsvFileInputRef.current) {
        heartCsvFileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Heart import error:', error)
      setHeartImportError(error instanceof Error ? error.message : 'Failed to import hearts')
    } finally {
      setIsImportingHearts(false)
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

  const triggerStructureFileInput = (structureType: StructureType) => {
    pendingStructureTypeRef.current = structureType
    structureFileInputRef.current?.click()
  }

  const availableRegions = regions.regions.filter(r => r.points.length >= 3)

  useEffect(() => {
    const id = regions.selectedRegionId
    if (!id) return
    const selected = regions.regions.find(r => r.id === id)
    if (!selected?.centerPoint) return
    setIsRegionSpecificExpanded(true)
    setExpandedRegionHeartsList(true)
    let innerRaf = 0
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        heartListItemRefs.current[id]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      })
    })
    return () => {
      cancelAnimationFrame(outerRaf)
      cancelAnimationFrame(innerRaf)
    }
    // Only when the selected region changes — avoids re-scrolling on unrelated region edits
  }, [regions.selectedRegionId])

  const manualStructureParsedXZ = useMemo(() => {
    const x = parseInt(manualStructureForm.x, 10)
    const z = parseInt(manualStructureForm.z, 10)
    const valid = !Number.isNaN(x) && !Number.isNaN(z)
    return { x, z, valid }
  }, [manualStructureForm.x, manualStructureForm.z])

  const manualStructureParentRegion = useMemo(() => {
    if (!manualStructureParsedXZ.valid) return null
    return findParentRegion(
      { x: manualStructureParsedXZ.x, z: manualStructureParsedXZ.z, details: '', type: '' },
      regions.regions
    )
  }, [manualStructureParsedXZ, regions.regions])

  const manualStructureNoContainingRegion =
    manualStructureParsedXZ.valid && manualStructureParentRegion === null

  const openManualStructureModal = () => {
    setManualStructureForm({
      structureType: (Object.values(STRUCTURE_TYPES) as StructureType[])[0],
      x: '',
      y: '',
      z: '',
      name: '',
    })
    setManualStructureModalOpen(true)
  }

  const submitManualStructure = (e: React.FormEvent) => {
    e.preventDefault()
    const x = parseInt(manualStructureForm.x, 10)
    const y = parseInt(manualStructureForm.y, 10)
    const z = parseInt(manualStructureForm.z, 10)
    if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
      toast.showToast('Enter valid X, Y, and Z', 'error')
      return
    }
    const parent = findParentRegion({ x, z, details: '', type: '' }, regions.regions)
    if (!parent) {
      toast.showToast('No region contains these X/Z coordinates (need a closed region over that point)', 'error')
      return
    }
    const ok = regions.addManualStructureSubregion(parent.id, {
      structureType: manualStructureForm.structureType,
      x,
      z,
      y,
      name: manualStructureForm.name.trim() || undefined,
    })
    if (!ok) {
      toast.showToast('Region not found', 'error')
      return
    }
    toast.showToast('Structure added', 'success')
    setManualStructureModalOpen(false)
  }

  const selectedRegion = regions.selectedRegionId
    ? regions.regions.find(r => r.id === regions.selectedRegionId) ?? null
    : null
  const biomeImage = mapState?.mapState?.biomeImage ?? mapState?.mapState?.terrainImage ?? mapState?.mapState?.image ?? null
  const originOffset = mapState?.mapState?.originOffset ?? null

  const biomeBreakdown = useMemo(() => {
    if (!selectedRegion || !biomeImage || selectedRegion.points.length < 3) return null
    return scanBiomes(selectedRegion, biomeImage, originOffset)
  }, [selectedRegion, biomeImage, originOffset])

  const worldBiomeBreakdown = useMemo(() => {
    if (!biomeImage) return null
    return scanBiomesFullImage(biomeImage)
  }, [biomeImage])

  const allItems = useMemo(() => getAllItems(), [])
  const themeAValues = useMemo(() => getAValues(), [])
  const themeBValues = useMemo(() => getBValues(), [])
  const selectedRegionData = regions.selectedRegionId
    ? regions.regions.find(r => r.id === regions.selectedRegionId)
    : null

  useEffect(() => {
    if (selectedRegionData) {
      setEditCategory(selectedRegionData.minecraftCategory ?? '')
      setEditItems([
        selectedRegionData.minecraftItems?.[0] ?? null,
        selectedRegionData.minecraftItems?.[1] ?? null,
        selectedRegionData.minecraftItems?.[2] ?? null
      ])
      const theme = selectedRegionData.regionTheme ?? []
      setEditThemePairs([
        theme[0] ?? { a: '', b: '' },
        theme[1] ?? { a: '', b: '' },
        theme[2] ?? { a: '', b: '' }
      ])
    } else {
      setEditCategory('')
      setEditItems([null, null, null])
      setEditThemePairs([{ a: '', b: '' }, { a: '', b: '' }, { a: '', b: '' }])
    }
  }, [regions.selectedRegionId])

  const handleSaveMinecraftData = () => {
    if (!regions.selectedRegionId) return
    const items = editItems.filter((i): i is { id: string; name: string } => i != null)
    const category = editCategory.trim() || undefined
    regions.updateRegion(regions.selectedRegionId, {
      minecraftCategory: category,
      minecraftItems: items.length > 0 ? items : undefined
    })
    toast.showToast('Minecraft data saved', 'success')
  }

  const handleAssignMinecraftToSelected = () => {
    if (!regions.selectedRegionId) return
    const { category, items } = pickRandomMinecraftData()
    regions.updateRegion(regions.selectedRegionId, { minecraftCategory: category, minecraftItems: items })
    setEditCategory(category)
    setEditItems([items[0] ?? null, items[1] ?? null, items[2] ?? null])
    toast.showToast(`Assigned ${category}: ${items.map(i => i.name).join(', ')}`, 'success')
  }

  const handleSaveRegionTheme = () => {
    if (!regions.selectedRegionId) return
    const pairs = editThemePairs.filter(p => p.a.trim() || p.b.trim()).map(p => ({ a: p.a.trim(), b: p.b.trim() }))
    regions.updateRegion(regions.selectedRegionId, {
      regionTheme: pairs.length > 0 ? pairs : undefined
    })
    toast.showToast('Region theme saved', 'success')
  }

  const handleAssignThemeToSelected = () => {
    if (!regions.selectedRegionId) return
    const pairs = pickRandomThemePairs()
    regions.updateRegion(regions.selectedRegionId, { regionTheme: pairs })
    setEditThemePairs([
      pairs[0] ?? { a: '', b: '' },
      pairs[1] ?? { a: '', b: '' },
      pairs[2] ?? { a: '', b: '' }
    ])
    toast.showToast(`Assigned: ${pairs.map(p => `${p.a} + ${p.b}`).join('; ')}`, 'success')
  }

  const handleCopyLoreToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.showToast('Lore copied to clipboard', 'success')
  }

  const loreForSelectedRegion = useMemo(() => {
    if (!selectedRegion || !worldName?.worldName) return null
    return formatRegionLore(selectedRegion, worldName.worldName, biomeBreakdown, loreSimplerMode)
  }, [selectedRegion, worldName?.worldName, biomeBreakdown, loreSimplerMode])

  const handleCopyAllLore = () => {
    const w = worldName?.worldName ?? 'world'
    const targets = regions.regions
      .filter(r => !r.disabled && r.points.length >= 3)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    const blocks: string[] = []
    for (const region of targets) {
      const breakdown = biomeImage && region.points.length >= 3
        ? scanBiomes(region, biomeImage, originOffset)
        : null
      blocks.push(formatRegionLore(region, w, breakdown, loreSimplerMode))
    }
    handleCopyLoreToClipboard(blocks.join('\n\n'))
  }

  const handleCopyAllDescriptions = () => {
    const targets = regions.regions
      .filter(r => r.description?.trim())
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    const blocks = targets.map(r => `=== ${r.name} ===\n${r.description!.trim()}`)
    navigator.clipboard.writeText(blocks.join('\n\n'))
    toast.showToast('Descriptions copied to clipboard', 'success')
  }

  const regionsWithDescriptions = regions.regions.filter(r => r.description?.trim())

  const handleAssignThemeToAll = () => {
    const targets = regions.regions.filter(r => !r.disabled && r.points.length >= 3)
    targets.forEach(region => {
      const pairs = pickRandomThemePairs()
      regions.updateRegion(region.id, { regionTheme: pairs })
    })
    toast.showToast(`Assigned theme to ${targets.length} region(s)`, 'success')
  }

  const handleAssignMinecraftToAll = () => {
    const targets = regions.regions.filter(r => !r.disabled && r.points.length >= 3)
    targets.forEach(region => {
      const { category, items } = pickRandomMinecraftData()
      regions.updateRegion(region.id, { minecraftCategory: category, minecraftItems: items })
    })
    toast.showToast(`Assigned Minecraft data to ${targets.length} region(s)`, 'success')
  }

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
        {seedInfo.seedInfo.dimension !== 'nether' && seedInfo.seedInfo.dimension !== 'end' && (
          <div>
            <button
              onClick={() => setIsOtherRegionTypesExpanded(!isOtherRegionTypesExpanded)}
              className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
            >
              <span className="flex items-center gap-2">
                <LocateFixed className="w-4 h-4" />
                Spawn
              </span>
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
              <div className="space-y-4 ml-4">
                <div className="space-y-2">
                  <SpawnButton />
                </div>
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Spawn Region</h5>
                  
                  {regions.selectedRegionId ? (
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={regions.regions.find(r => r.id === regions.selectedRegionId)?.hasSpawn || false}
                          onChange={(e) => {
                            const regionId = regions.selectedRegionId!
                            if (e.target.checked) {
                              regions.regions.forEach(region => {
                                if (region.id !== regionId && region.hasSpawn) {
                                  regions.updateRegion(region.id, { hasSpawn: false })
                                }
                              })
                              regions.updateRegion(regionId, { hasSpawn: true, isWater: false })
                            } else {
                              regions.updateRegion(regionId, { hasSpawn: false })
                            }
                          }}
                          className="w-4 h-4 text-lapis-lazuli bg-gray-700 border-gunmetal rounded focus:ring-lapis-lazuli focus:ring-2"
                        />
                        <span className="text-sm text-gray-300">Has Spawn</span>
                      </label>
                      {!regions.regions.find(r => r.id === regions.selectedRegionId)?.hasSpawn && (
                        <div className="text-sm text-gray-400">
                          {(() => {
                            const spawnRegion = regions.regions.find(r => r.hasSpawn)
                            return spawnRegion ? (
                              <>
                                <span className="text-white">{spawnRegion.name}</span>
                                {' has spawn'}
                              </>
                            ) : (
                              'Spawn has not been set'
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 pb-3 bg-eerie-back/50 rounded-md">
                      {(() => {
                        const spawnRegion = regions.regions.find(r => r.hasSpawn)
                        return spawnRegion ? (
                          <>
                            <span className="text-white">{spawnRegion.name}</span>
                            {' has spawn'}
                          </>
                        ) : (
                          'Spawn has not been set'
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {seedInfo.seedInfo.dimension !== 'nether' && (
          <div>
            <button
              type="button"
              onClick={() => setIsWaterExpanded(!isWaterExpanded)}
              className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
            >
              <span className="flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                Water
              </span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  isWaterExpanded ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {isWaterExpanded && (
              <div className="space-y-3 ml-4">
                <p className="text-xs text-gray-400">
                  Exports as <code className="text-gray-300">kind: water</code> with{' '}
                  <code className="text-gray-300">discover.method: passive</code>. WorldGuard and LevelledMobs bands still apply; no main discovery flow in mc-plugin-manager.
                </p>
                {regions.selectedRegionId ? (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={regions.regions.find(r => r.id === regions.selectedRegionId)?.isWater || false}
                      onChange={(e) => {
                        const regionId = regions.selectedRegionId!
                        if (e.target.checked) {
                          regions.updateRegion(regionId, { isWater: true, hasSpawn: false })
                        } else {
                          regions.updateRegion(regionId, { isWater: false })
                        }
                      }}
                      className="w-4 h-4 text-lapis-lazuli bg-gray-700 border-gunmetal rounded focus:ring-lapis-lazuli focus:ring-2"
                    />
                    <span className="text-sm text-gray-300">Set as water region</span>
                  </label>
                ) : (
                  <div className="text-sm text-gray-400 p-3 bg-eerie-back/50 rounded-md">Select a region to mark it as water</div>
                )}
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
            <span className="flex items-center gap-2">
              <Skull className="w-4 h-4" />
              Levelled Mobs
            </span>
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
                <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Region Challenge Level</h5>

                {regions.selectedRegionId ? (
                  <div className="space-y-2">
                    <select
                      value={regions.regions.find(r => r.id === regions.selectedRegionId)?.challengeLevel || 'easy'}
                      onChange={(e) => regions.updateRegion(regions.selectedRegionId!, { challengeLevel: e.target.value as ChallengeLevel })}
                      className="w-full bg-input-bg text-input-text px-3 py-2 rounded border border-input-border focus:border-lapis-lighter focus:outline-none placeholder:text-gray-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                      <option value="severe">Severe</option>
                      <option value="deadly">Deadly</option>
                    </select>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 p-3 bg-eerie-back/50 rounded-md">
                    No region selected
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <RegionActions
                  regions={availableRegions}
                  onRandomizeChallengeLevels={handleRandomizeChallengeLevels}
                />
              </div>
            </div>
          )}
        </div>

        {/* Region Biome Data */}
        <div>
          <button
            onClick={() => setIsBiomeDataExpanded(!isBiomeDataExpanded)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
          >
            <span className="flex items-center gap-2">
              <TreePine className="w-4 h-4" />
              Region Biome Data
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isBiomeDataExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {isBiomeDataExpanded && (
            <div className="ml-4 space-y-4">
              {!selectedRegion ? (
                <div className="text-sm text-gray-400 p-3 bg-eerie-back/50 rounded-md">
                  Select a region to view its region biome data
                </div>
              ) : !biomeImage ? (
                <div className="text-sm text-gray-400 p-3 bg-eerie-back/50 rounded-md">
                  Load a biome map to view region biome data
                </div>
              ) : biomeBreakdown === null ? (
                <p className="text-gray-400 text-sm">No pixels sampled. Set map origin and ensure the region overlaps the map.</p>
              ) : biomeBreakdown.length === 0 ? (
                <p className="text-gray-400 text-sm">No biomes detected.</p>
              ) : (
                (() => {
                  const grouped = getGroupedLandVsSea(biomeBreakdown)
                  return (
                    <div className="space-y-3 text-sm">
                      <p className="text-gray-400 text-xs">Biome breakdown for {selectedRegion.name}. Toggle to hide/show labels on map.</p>
                      {grouped.land.total > 0 && (
                        <div>
                          <div className="font-medium text-gray-300 mb-1.5">Land {grouped.land.total}%</div>
                          <div className="ml-3 space-y-1">
                            {grouped.land.groups.map(({ category, percentage, biomes }) => {
                              const key = `land-${category}`
                              const isExpanded = expandedRegionCategories.has(key)
                              return (
                                <div key={key}>
                                  <button
                                    type="button"
                                    onClick={() => toggleRegionCategory(key)}
                                    className="flex items-center gap-1.5 w-full text-left text-gray-400 font-medium hover:text-gray-300 py-0.5 rounded"
                                  >
                                    <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                    {category} {percentage}%
                                  </button>
                                  {isExpanded && (
                                    <div className="ml-5 mt-1 space-y-0.5">
                                      {biomes.map(({ biome, percentage: pct }) => {
                                        const isHidden = biomeLabelVisibility.isBiomeLabelHidden(biome)
                                        return (
                                          <div key={biome} className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              onClick={() => biomeLabelVisibility.toggleBiomeLabel(biome)}
                                              className="p-0.5 rounded hover:bg-gray-600 text-gray-400 hover:text-white transition-colors"
                                              title={isHidden ? 'Show label on map' : 'Hide label on map'}
                                            >
                                              {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <span className={`flex-1 ${isHidden ? 'text-gray-500' : 'text-gray-300'}`}>{biome}</span>
                                            <span className="text-gray-400 font-medium">{pct}%</span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {grouped.sea.total > 0 && (
                        <div>
                          <div className="font-medium text-gray-300 mb-1.5">Sea {grouped.sea.total}%</div>
                          <div className="ml-3 space-y-1">
                            {grouped.sea.groups.map(({ category, percentage, biomes }) => {
                              const key = `sea-${category}`
                              const isExpanded = expandedRegionCategories.has(key)
                              return (
                                <div key={key}>
                                  <button
                                    type="button"
                                    onClick={() => toggleRegionCategory(key)}
                                    className="flex items-center gap-1.5 w-full text-left text-gray-400 font-medium hover:text-gray-300 py-0.5 rounded"
                                  >
                                    <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                    {category} {percentage}%
                                  </button>
                                  {isExpanded && (
                                    <div className="ml-5 mt-1 space-y-0.5">
                                      {biomes.map(({ biome, percentage: pct }) => {
                                        const isHidden = biomeLabelVisibility.isBiomeLabelHidden(biome)
                                        return (
                                          <div key={biome} className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              onClick={() => biomeLabelVisibility.toggleBiomeLabel(biome)}
                                              className="p-0.5 rounded hover:bg-gray-600 text-gray-400 hover:text-white transition-colors"
                                              title={isHidden ? 'Show label on map' : 'Hide label on map'}
                                            >
                                              {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <span className={`flex-1 ${isHidden ? 'text-gray-500' : 'text-gray-300'}`}>{biome}</span>
                                            <span className="text-gray-400 font-medium">{pct}%</span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()
              )}
            </div>
          )}
        </div>

        {/* World Biome Data */}
        <div>
          <button
            onClick={() => setIsWorldBiomeDataExpanded(!isWorldBiomeDataExpanded)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              World Biome Data
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isWorldBiomeDataExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {isWorldBiomeDataExpanded && (
            <div className="ml-4 space-y-4">
              {!biomeImage ? (
                <div className="text-sm text-gray-400 p-3 bg-eerie-back/50 rounded-md">
                  Load a biome map to view world biome data
                </div>
              ) : worldBiomeBreakdown === null ? (
                <p className="text-gray-400 text-sm">No pixels sampled.</p>
              ) : worldBiomeBreakdown.length === 0 ? (
                <p className="text-gray-400 text-sm">No biomes detected.</p>
              ) : (
                (() => {
                  const grouped = getGroupedLandVsSea(worldBiomeBreakdown)
                  return (
                    <div className="space-y-3 text-sm">
                      <p className="text-gray-400 text-xs">Biome breakdown for the entire loaded map.</p>
                      {grouped.land.total > 0 && (
                        <div>
                          <div className="font-medium text-gray-300 mb-1.5">Land {grouped.land.total}%</div>
                          <div className="ml-3 space-y-1">
                            {grouped.land.groups.map(({ category, percentage, biomes }) => {
                              const key = `land-${category}`
                              const isExpanded = expandedWorldCategories.has(key)
                              return (
                                <div key={key}>
                                  <button
                                    type="button"
                                    onClick={() => toggleWorldCategory(key)}
                                    className="flex items-center gap-1.5 w-full text-left text-gray-400 font-medium hover:text-gray-300 py-0.5 rounded"
                                  >
                                    <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                    {category} {percentage}%
                                  </button>
                                  {isExpanded && (
                                    <div className="ml-5 mt-1 space-y-0.5">
                                      {biomes.map(({ biome, percentage: pct }) => (
                                        <div key={biome} className="flex items-center gap-2">
                                          <span className="flex-1 text-gray-300">{biome}</span>
                                          <span className="text-gray-400 font-medium">{pct}%</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {grouped.sea.total > 0 && (
                        <div>
                          <div className="font-medium text-gray-300 mb-1.5">Sea {grouped.sea.total}%</div>
                          <div className="ml-3 space-y-1">
                            {grouped.sea.groups.map(({ category, percentage, biomes }) => {
                              const key = `sea-${category}`
                              const isExpanded = expandedWorldCategories.has(key)
                              return (
                                <div key={key}>
                                  <button
                                    type="button"
                                    onClick={() => toggleWorldCategory(key)}
                                    className="flex items-center gap-1.5 w-full text-left text-gray-400 font-medium hover:text-gray-300 py-0.5 rounded"
                                  >
                                    <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                    {category} {percentage}%
                                  </button>
                                  {isExpanded && (
                                    <div className="ml-5 mt-1 space-y-0.5">
                                      {biomes.map(({ biome, percentage: pct }) => (
                                        <div key={biome} className="flex items-center gap-2">
                                          <span className="flex-1 text-gray-300">{biome}</span>
                                          <span className="text-gray-400 font-medium">{pct}%</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()
              )}
            </div>
          )}
        </div>

        {seedInfo.seedInfo.dimension !== 'nether' && (
          <>
            <div>
              {/* Villages */}
              <button
                onClick={() => setIsVillagesExpanded(!isVillagesExpanded)}
                className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
              >
                <span className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Villages
                </span>
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
                    const hasVillages = availableRegions.some(region => (region.subregions || []).some(s => s.type === 'village'))
                    const totalVillages = availableRegions.reduce((total, region) => total + (region.subregions || []).filter(s => s.type === 'village').length, 0)
                    
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
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={importVillageCoordsOnly}
                        onChange={(e) => setImportVillageCoordsOnly(e.target.checked)}
                        className="w-4 h-4 text-lapis-light bg-input-bg border-input-border rounded focus:ring-lapis-lighter focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-gray-300">
                        Import coordinates only (keep existing village names)
                      </span>
                    </label>
                    
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

                    {(() => {
                      const items = availableRegions.flatMap(region =>
                        (region.subregions || [])
                          .filter(s => s.type === 'village')
                          .map(s => ({
                            regionId: region.id,
                            subregionId: s.id,
                            name: s.name,
                            x: s.x,
                            z: s.z,
                            y: s.y,
                            height: s.height,
                            regionName: region.name
                          }))
                      )
                      if (items.length === 0) return null
                      const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name))
                      return (
                        <div className="space-y-1 pt-2">
                          <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Villages</h5>
                          <div className="bg-gray-800/50 px-3 py-2 border border-gray-600 rounded-md max-h-48 overflow-y-auto">
                            <ul className="space-y-1.5 text-sm">
                              {sorted.map(item => (
                                <SubregionListRow
                                  key={item.subregionId}
                                  item={item}
                                  editingY={editingVillageY}
                                  setEditingY={setEditingVillageY}
                                  updateY={regions.updateVillageSubregionY}
                                  editingHeight={editingVillageHeight}
                                  setEditingHeight={setEditingVillageHeight}
                                  updateHeight={regions.updateVillageSubregionHeight}
                                  showVillageHeight
                                  onCopyTp={target => {
                                    const y = target.y != null ? target.y : '~'
                                    const tpCommand = `/tp @s ${target.x} ${y} ${target.z}`
                                    navigator.clipboard.writeText(tpCommand)
                                    toast.showToast('Teleport command copied', 'success')
                                  }}
                                  deleteLabel="Delete village"
                                  onDelete={target => {
                                    setPendingSubregionDelete({
                                      type: 'village',
                                      item: {
                                        regionId: target.regionId,
                                        subregionId: target.subregionId,
                                        name: target.name
                                      }
                                    })
                                  }}
                                />
                              ))}
                            </ul>
                            <button
                              type="button"
                              onClick={() => {
                                const names = sorted.map(i => i.name).join(', ')
                                navigator.clipboard.writeText(names)
                                toast.showToast('Names copied to clipboard', 'success')
                              }}
                              className="mt-2 text-xs text-gray-400 hover:text-gray-300 underline cursor-pointer focus:outline-none"
                            >
                              Copy names
                            </button>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div>
              {/* Structures */}
              <button
              onClick={() => setIsStructuresExpanded(!isStructuresExpanded)}
              className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
            >
              <span className="flex items-center gap-2">
                <TreePine className="w-4 h-4" />
                Structures
              </span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${isStructuresExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {isStructuresExpanded && (
              <div className="ml-4 space-y-4">
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Import structures</h5>
                  <div className="flex gap-2 items-center">
                    <select
                      value={selectedStructureTypeForImport}
                      onChange={e => setSelectedStructureTypeForImport(e.target.value as StructureType)}
                      className="flex-1 rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2 text-sm focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
                    >
                      {(Object.values(STRUCTURE_TYPES) as StructureType[]).map(type => (
                        <option key={type} value={type}>
                          {STRUCTURE_DISPLAY[type].countLabel}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => triggerStructureFileInput(selectedStructureTypeForImport)}
                      disabled={isImportingStructures}
                      className="bg-viridian hover:bg-viridian/80 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors whitespace-nowrap"
                    >
                      {isImportingStructures ? 'Importing...' : 'Import (CSV)'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Re-importing CSV for a structure type removes all existing markers of that type project-wide, then adds from the file. Use{' '}
                    <span className="text-gray-400">Add structure manually</span> to append a single locator without editing the CSV.
                  </p>
                  <button
                    type="button"
                    onClick={openManualStructureModal}
                    disabled={availableRegions.length === 0}
                    className="text-sm font-medium py-2 px-3 rounded-md border border-gray-600 bg-gray-700/80 text-gray-200 hover:bg-gray-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add structure manually
                  </button>
                </div>
                <BaseModal
                  isOpen={manualStructureModalOpen}
                  onClose={() => setManualStructureModalOpen(false)}
                  title="Add structure manually"
                  size="md"
                  contentClassName="max-w-md"
                >
                  <form onSubmit={submitManualStructure} className="space-y-3 text-sm">
                    <p className="text-xs text-gray-500">
                      Parent region is chosen automatically from X and Z: the first region whose polygon contains that point (same rule as CSV import).
                    </p>
                    {manualStructureParentRegion && (
                      <p className="text-sm text-gray-300">
                        <span className="text-gray-500">Parent region:</span> {manualStructureParentRegion.name}
                      </p>
                    )}
                    <div>
                      <label className="block text-gray-300 mb-1">Structure type</label>
                      <select
                        value={manualStructureForm.structureType}
                        onChange={e =>
                          setManualStructureForm(f => ({ ...f, structureType: e.target.value as StructureType }))
                        }
                        className="w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2 focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
                      >
                        {(Object.values(STRUCTURE_TYPES) as StructureType[]).map(type => (
                          <option key={type} value={type}>
                            {STRUCTURE_DISPLAY[type].countLabel}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-gray-300 mb-1">X</label>
                        <input
                          type="number"
                          value={manualStructureForm.x}
                          onChange={e => setManualStructureForm(f => ({ ...f, x: e.target.value }))}
                          className="w-full rounded-md border border-gray-600 bg-gray-700 text-white px-2 py-2 focus:ring-2 focus:ring-lapis-lazuli"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Y</label>
                        <input
                          type="number"
                          value={manualStructureForm.y}
                          onChange={e => setManualStructureForm(f => ({ ...f, y: e.target.value }))}
                          className="w-full rounded-md border border-gray-600 bg-gray-700 text-white px-2 py-2 focus:ring-2 focus:ring-lapis-lazuli"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Z</label>
                        <input
                          type="number"
                          value={manualStructureForm.z}
                          onChange={e => setManualStructureForm(f => ({ ...f, z: e.target.value }))}
                          className="w-full rounded-md border border-gray-600 bg-gray-700 text-white px-2 py-2 focus:ring-2 focus:ring-lapis-lazuli"
                          required
                        />
                      </div>
                    </div>
                    {manualStructureNoContainingRegion && (
                      <p className="text-amber-400/90 text-xs">
                        These X/Z are not inside any region — fix coordinates or adjust the region boundary.
                      </p>
                    )}
                    <div>
                      <label className="block text-gray-300 mb-1">Name (optional)</label>
                      <input
                        type="text"
                        value={manualStructureForm.name}
                        onChange={e => setManualStructureForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Auto-generated if empty"
                        className="w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-2 focus:ring-2 focus:ring-lapis-lazuli"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setManualStructureModalOpen(false)}
                        className="flex-1 py-2 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 rounded-md bg-viridian text-white font-medium hover:bg-viridian/80"
                      >
                        Add
                      </button>
                    </div>
                  </form>
                </BaseModal>
                <input
                  ref={structureFileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleStructureImport}
                  className="hidden"
                />
                {structureImportError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-md text-sm">
                    {structureImportError}
                  </div>
                )}
                {(() => {
                  const structureSubregionsByType = (r: { subregions?: { type: string; structureType?: StructureType }[] }, type: StructureType) =>
                    (r.subregions || []).filter(s => s.type === 'structure' && s.structureType === type)
                  const structureTypes = Object.values(STRUCTURE_TYPES) as StructureType[]
                  const rows = structureTypes.map(structureType => {
                    const subs = (region: typeof availableRegions[0]) => structureSubregionsByType(region, structureType)
                    const total = availableRegions.reduce((sum, r) => sum + subs(r).length, 0)
                    const regionCount = availableRegions.filter(r => subs(r).length > 0).length
                    const display = STRUCTURE_DISPLAY[structureType]
                    const visible = regions.highlightMode.visibleStructureTypes?.[structureType] !== false
                    const highlighted = regions.highlightMode.highlightedStructureType === structureType
                    return { structureType, total, regionCount, display, visible, highlighted }
                  })
                  const sortedRows = [...rows].sort((a, b) => {
                    const { column, dir } = structureTableSort
                    const mult = dir === 'asc' ? 1 : -1
                    if (column === 'type') {
                      return mult * a.display.countLabel.localeCompare(b.display.countLabel)
                    }
                    if (column === 'count') return mult * (a.total - b.total)
                    return mult * (a.regionCount - b.regionCount)
                  })
                  const SortHeader = ({ col, label, align = 'left' }: { col: 'type' | 'count' | 'regions'; label: string; align?: 'left' | 'right' }) => {
                    const isActive = structureTableSort.column === col
                    return (
                      <th className={`${align === 'right' ? 'text-right' : 'text-left'} text-gray-300 font-medium px-2 py-1.5 border border-gray-600`}>
                        <button
                          type="button"
                          onClick={() => setStructureTableSort(prev => ({
                            column: col,
                            dir: prev.column === col && prev.dir === 'asc' ? 'desc' : 'asc'
                          }))}
                          className="flex items-center gap-1 w-full hover:text-white focus:outline-none focus:ring-2 focus:ring-lapis-lazuli rounded -m-1 p-1"
                          style={align === 'right' ? { justifyContent: 'flex-end' } : undefined}
                        >
                          {label}
                          {isActive && (structureTableSort.dir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                        </button>
                      </th>
                    )
                  }
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-gray-600 border-collapse">
                        <thead>
                          <tr className="bg-gray-700/70">
                            <SortHeader col="type" label="Structure type" />
                            <SortHeader col="count" label="Count" align="right" />
                            <SortHeader col="regions" label="Regions" align="right" />
                            <th className="text-center text-gray-300 font-medium px-2 py-1.5 border border-gray-600 w-0" />
                          </tr>
                        </thead>
                        <tbody>
                          {sortedRows.map(({ structureType, total, regionCount, display, visible, highlighted }) => (
                            <tr key={structureType} className="border-b border-gray-600 hover:bg-gray-700/30">
                              <td className="px-2 py-1.5 border border-gray-600 text-white">{display.countLabel}</td>
                              <td className="px-2 py-1.5 border border-gray-600 text-right text-white">{total}</td>
                              <td className="px-2 py-1.5 border border-gray-600 text-right text-white">{regionCount}</td>
                              <td className="px-2 py-1.5 border border-gray-600">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => regions.setStructureTypeVisible(structureType, !visible)}
                                    title={visible ? 'Hide on map' : 'Show on map'}
                                    className={`p-1 rounded ${visible ? 'bg-viridian/80 hover:bg-viridian text-white' : 'bg-gray-500 hover:bg-gray-600 text-gray-200'}`}
                                  >
                                    {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => regions.setHighlightedStructureType(highlighted ? null : structureType)}
                                    title={highlighted ? 'Clear highlight' : 'Highlight on map'}
                                    className={`p-1 rounded ${highlighted ? 'bg-amber-500/80 hover:bg-amber-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`}
                                  >
                                    <Highlighter className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })()}
                <div className="space-y-1">
                  <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">By structure type</h5>
                  {[...(Object.values(STRUCTURE_TYPES) as StructureType[])]
                    .sort((a, b) => STRUCTURE_DISPLAY[a].countLabel.localeCompare(STRUCTURE_DISPLAY[b].countLabel))
                    .map(structureType => {
                    const items = availableRegions
                      .flatMap(region =>
                        (region.subregions || [])
                          .filter((s): s is typeof s & { structureType: StructureType } => s.type === 'structure' && s.structureType === structureType)
                          .map(s => ({ regionId: region.id, subregionId: s.id, name: s.name, x: s.x, z: s.z, y: s.y, regionName: region.name }))
                      )
                      .sort((a, b) => a.x - b.x || a.z - b.z || a.name.localeCompare(b.name))
                    if (items.length === 0) return null
                    const display = STRUCTURE_DISPLAY[structureType]
                    const isExpanded = expandedStructureAccordion === structureType
                    return (
                      <div key={structureType} className="border border-gray-600 rounded-md overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedStructureAccordion(prev => prev === structureType ? null : structureType)}
                          className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 hover:text-white border-0"
                        >
                          <span>{display.countLabel}</span>
                          <svg className={`w-4 h-4 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        {isExpanded && (
                          <div className="bg-gray-800/50 px-3 py-2 border-t border-gray-600 max-h-48 overflow-y-auto">
                            <ul className="space-y-1.5 text-sm">
                              {items.map(item => (
                                <SubregionListRow
                                  key={item.subregionId}
                                  item={item}
                                  editingY={editingStructureY}
                                  setEditingY={setEditingStructureY}
                                  updateY={regions.updateStructureSubregionY}
                                  editingX={editingStructureX}
                                  setEditingX={setEditingStructureX}
                                  updateX={regions.updateStructureSubregionX}
                                  editingZ={editingStructureZ}
                                  setEditingZ={setEditingStructureZ}
                                  updateZ={regions.updateStructureSubregionZ}
                                  onCopyTp={target => {
                                    const y = target.y != null ? target.y : '~'
                                    const tpCommand = `/tp @s ${target.x} ${y} ${target.z}`
                                    navigator.clipboard.writeText(tpCommand)
                                    toast.showToast('Teleport command copied', 'success')
                                  }}
                                  deleteLabel="Delete structure"
                                  onDelete={target => {
                                    setPendingSubregionDelete({
                                      type: 'structure',
                                      item: {
                                        regionId: target.regionId,
                                        subregionId: target.subregionId,
                                        name: target.name
                                      }
                                    })
                                  }}
                                />
                              ))}
                            </ul>
                            <button
                              type="button"
                              onClick={() => {
                                const names = items.map(i => i.name).join(', ')
                                navigator.clipboard.writeText(names)
                                toast.showToast('Names copied to clipboard', 'success')
                              }}
                              className="mt-2 text-xs text-gray-400 hover:text-gray-300 underline cursor-pointer focus:outline-none"
                            >
                              Copy names
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            </div>
          </>
        )}

        {/* Import regions */}
        <div>
          <button
            onClick={() => setIsImportExpanded(!isImportExpanded)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
          >
            <span className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Import regions
            </span>
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

        {/* Region Description */}
        <div>
          <button
            onClick={() => setIsRegionDescriptionExpanded(!isRegionDescriptionExpanded)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Region Description
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isRegionDescriptionExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {isRegionDescriptionExpanded && (
            <div className="ml-4 space-y-4">
              {regions.selectedRegionId ? (
                <div className="space-y-2">
                  {(() => {
                    const selectedRegion = regions.regions.find(r => r.id === regions.selectedRegionId)
                    if (!selectedRegion) return null
                    return (
                      <>
                        {selectedRegion.description ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Region Description</label>
                            <p className="text-sm text-white px-3 py-2 bg-black rounded border border-gunmetal whitespace-pre-wrap">
                              {selectedRegion.description}
                            </p>
                          </div>
                        ) : null}
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => setShowDescriptionModal(true)}
                            leftIcon={<FileText size={16} />}
                            className="flex-1 justify-start"
                          >
                            {selectedRegion.description ? 'Edit Region Description' : 'Add Region Description'}
                          </Button>
                          {selectedRegion.description && (
                            <Button
                              variant="secondary-outline"
                              onClick={() => regions.updateRegion(regions.selectedRegionId!, { description: undefined })}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </>
                    )
                  })()}
                </div>
              ) : (
                <div className="text-sm text-gray-400 pb-3 bg-eerie-back/50 rounded-md">
                  No region selected
                </div>
              )}
                <Button
                  variant="secondary"
                  onClick={handleCopyAllDescriptions}
                  disabled={regionsWithDescriptions.length === 0}
                  className="w-full"
                  leftIcon={<ClipboardCopy size={16} />}
                >
                  Copy all descriptions
                </Button>
            </div>
          )}
        </div>

        {/* Minecraft Data */}
        <div>
          <button
            onClick={() => setIsMinecraftDataExpanded(!isMinecraftDataExpanded)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Minecraft Data
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isMinecraftDataExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {isMinecraftDataExpanded && (
            <div className="ml-4 space-y-4">
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">VZ Price Guide Items</h5>
                <p className="text-sm text-gray-300">
                  Assign a random category and 3 items to regions for economy plugins or discovery rewards.
                </p>
                {regions.selectedRegionId ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Category</label>
                      <select
                        value={editCategory}
                        onChange={e => setEditCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-input-border bg-input-bg text-input-text text-sm focus:border-lapis-lazuli focus:outline-none"
                      >
                        <option value="">— None —</option>
                        {MINECRAFT_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>
                            {cat.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Items (up to 3)</label>
                      <div className="space-y-2">
                        {[0, 1, 2].map(i => (
                          <MinecraftItemPicker
                            key={i}
                            value={editItems[i]}
                            options={allItems}
                            onChange={item => {
                              const next = [...editItems]
                              next[i] = item
                              setEditItems(next)
                            }}
                            placeholder="Select item..."
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="primary" onClick={handleSaveMinecraftData}>
                        Save
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleAssignMinecraftToSelected}
                        leftIcon={<Sparkles size={16} />}
                      >
                        Random
                      </Button>
                      <Button
                        variant="secondary-outline"
                        onClick={() => {
                          regions.updateRegion(regions.selectedRegionId!, { minecraftCategory: undefined, minecraftItems: undefined })
                          setEditCategory('')
                          setEditItems([null, null, null])
                        }}
                        disabled={!editCategory && !editItems.some(Boolean)}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 p-3 bg-eerie-back/50 rounded-md">
                    Select a region to assign Minecraft data, or assign to all below.
                  </div>
                )}
                <Button
                  variant="secondary"
                  onClick={handleAssignMinecraftToAll}
                  disabled={availableRegions.length === 0}
                  className="w-full"
                  leftIcon={<Sparkles size={16} />}
                >
                  Assign random to all regions
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Region Theme */}
        <div>
          <button
            onClick={() => setIsRegionThemeExpanded(!isRegionThemeExpanded)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Region Theme
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isRegionThemeExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {isRegionThemeExpanded && (
            <div className="ml-4 space-y-4">
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wide">Storyteller&apos;s Automaton</h5>
                <p className="text-sm text-gray-300">
                  Assign 3 theme pairs (A + B) to regions for narrative flavor. Roll on the table or edit manually.
                </p>
                {regions.selectedRegionId ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Theme pairs (up to 3)</label>
                      <div className="space-y-2">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="flex gap-2 items-center">
                            <select
                              value={editThemePairs[i].a}
                              onChange={e => {
                                const next = [...editThemePairs]
                                next[i] = { ...next[i], a: e.target.value }
                                setEditThemePairs(next)
                              }}
                              className="flex-1 px-3 py-2 rounded border border-input-border bg-input-bg text-input-text text-sm focus:border-lapis-lazuli focus:outline-none"
                            >
                              <option value="">— A —</option>
                              {themeAValues.map(v => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </select>
                            <span className="text-gray-500">+</span>
                            <select
                              value={editThemePairs[i].b}
                              onChange={e => {
                                const next = [...editThemePairs]
                                next[i] = { ...next[i], b: e.target.value }
                                setEditThemePairs(next)
                              }}
                              className="flex-1 px-3 py-2 rounded border border-input-border bg-input-bg text-input-text text-sm focus:border-lapis-lazuli focus:outline-none"
                            >
                              <option value="">— B —</option>
                              {themeBValues.map(v => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="primary" onClick={handleSaveRegionTheme}>
                        Save
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleAssignThemeToSelected}
                        leftIcon={<BookOpen size={16} />}
                      >
                        Random
                      </Button>
                      <Button
                        variant="secondary-outline"
                        onClick={() => {
                          regions.updateRegion(regions.selectedRegionId!, { regionTheme: undefined })
                          setEditThemePairs([{ a: '', b: '' }, { a: '', b: '' }, { a: '', b: '' }])
                        }}
                        disabled={!editThemePairs.some(p => p.a || p.b)}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 p-3 bg-eerie-back/50 rounded-md">
                    Select a region to assign theme pairs, or assign to all below.
                  </div>
                )}
                <Button
                  variant="secondary"
                  onClick={handleAssignThemeToAll}
                  disabled={availableRegions.length === 0}
                  className="w-full"
                  leftIcon={<BookOpen size={16} />}
                >
                  Assign random to all regions
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Lore Instructions */}
        <div>
          <button
            onClick={() => setIsLoreInstructionsExpanded(!isLoreInstructionsExpanded)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
          >
            <span className="flex items-center gap-2">
              <ScrollText className="w-4 h-4" />
              Lore Instructions
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isLoreInstructionsExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {isLoreInstructionsExpanded && (
            <div className="ml-4 space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-300">
                  Generate lore instructions for AI or documentation. Includes world, region, difficulty, biomes, category, items, theme hints, and villages.
                </p>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={loreSimplerMode}
                    onChange={(e) => setLoreSimplerMode(e.target.checked)}
                    className="w-4 h-4 text-lapis-lazuli bg-gray-700 border-gunmetal rounded focus:ring-lapis-lazuli focus:ring-2"
                  />
                  <span className="text-sm text-gray-300">Simpler</span>
                </label>
                {selectedRegion && loreForSelectedRegion ? (
                  <div className="space-y-2">
                    <pre className="p-3 bg-eerie-back rounded border border-gunmetal text-sm text-gray-300 whitespace-pre-wrap font-sans">
                      {loreForSelectedRegion}
                    </pre>
                    <Button
                      variant="secondary"
                      onClick={() => handleCopyLoreToClipboard(loreForSelectedRegion!)}
                      leftIcon={<ClipboardCopy size={16} />}
                    >
                      Copy selected region
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 p-3 bg-eerie-back/50 rounded-md">
                    Select a region to view its lore instructions.
                  </div>
                )}
                <Button
                  variant="secondary"
                  onClick={handleCopyAllLore}
                  disabled={availableRegions.length === 0}
                  className="w-full"
                  leftIcon={<ClipboardCopy size={16} />}
                >
                  Copy all regions
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Region Hearts */}
        <div>
          <button
            onClick={() => setIsRegionSpecificExpanded(!isRegionSpecificExpanded)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 mb-2 px-3 py-2 rounded-md border border-gunmetal bg-gray-700/50 hover:bg-gray-600/50 hover:text-white hover:border-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lapis-lazuli focus:border-lapis-lazuli"
          >
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Region Hearts
            </span>
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

                {(() => {
                  const heartRegions = availableRegions
                    .filter(r => r.centerPoint != null)
                    .sort((a, b) => a.name.localeCompare(b.name))
                  return (
                    <>
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
                                          const y = target.y != null ? target.y : '~'
                                          const tpCommand = `/tp @s ${target.x} ${y} ${target.z}`
                                          navigator.clipboard.writeText(tpCommand)
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
                    </>
                  )
                })()}

                {regions.selectedRegionId ? (
                  <div className="space-y-2">
                    {(() => {
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
                  <div className="text-sm text-gray-400 pt-3 pr-3 pb-3 bg-eerie-back/50 rounded-md">
                    Select a region to set its heart on the map
                  </div>
                )}
                {regions.regions.length > 0 && (
                  <button
                    onClick={async () => {
                      const lines = [...regions.regions]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(region => {
                        const center = calculateRegionCenter(region)
                        return `${region.name}:\n/tp @s ${Math.round(center.x)} ~ ${Math.round(center.z)}`
                      })
                      const text = lines.join('\n\n')
                      await copyToClipboard(text)
                      toast.showToast('All teleport commands copied', 'success')
                    }}
                    className="text-sm text-lapis-lazuli hover:text-lapis-lighter hover:underline transition-colors flex items-center gap-1"
                  >
                    <ClipboardCopy className="w-4 h-4" />
                    Copy all TPs
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

      <CsvImportResultsModal
        isOpen={csvImportResults != null}
        onClose={() => setCsvImportResults(null)}
        title={csvImportResults?.title ?? ''}
        added={csvImportResults?.added ?? 0}
        orphaned={csvImportResults?.orphaned ?? 0}
        singularLabel={csvImportResults?.singularLabel ?? ''}
        pluralLabel={csvImportResults?.pluralLabel ?? ''}
      />

      <ClearDataModal
        isOpen={showClearDataModal}
        onConfirm={handleConfirmClearData}
        onCancel={() => setShowClearDataModal(false)}
      />

      <DeleteSubregionModal
        isOpen={pendingSubregionDelete != null}
        targetLabel={pendingSubregionDelete?.type ?? 'subregion'}
        targetName={pendingSubregionDelete?.item.name ?? ''}
        onCancel={() => setPendingSubregionDelete(null)}
        onConfirm={() => {
          if (!pendingSubregionDelete) return
          const { type, item } = pendingSubregionDelete
          regions.removeSubregionFromRegion(item.regionId, item.subregionId)
          setEditingVillageY(prev => (prev?.subregionId === item.subregionId ? null : prev))
          setEditingStructureY(prev => (prev?.subregionId === item.subregionId ? null : prev))
          setEditingStructureX(prev => (prev?.subregionId === item.subregionId ? null : prev))
          setEditingStructureZ(prev => (prev?.subregionId === item.subregionId ? null : prev))
          toast.showToast(type === 'village' ? 'Village deleted' : 'Structure deleted', 'success')
          setPendingSubregionDelete(null)
        }}
      />

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

      {regions.selectedRegionId && (
        <RegionDescriptionModal
          isOpen={showDescriptionModal}
          description={regions.regions.find(r => r.id === regions.selectedRegionId)?.description ?? ''}
          onSave={(description) => regions.updateRegion(regions.selectedRegionId!, { description: description || undefined })}
          onClose={() => setShowDescriptionModal(false)}
        />
      )}
    </div>
  )
}
