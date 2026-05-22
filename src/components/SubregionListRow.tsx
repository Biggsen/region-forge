import React from 'react'
import { ClipboardCopy, Trash2 } from 'lucide-react'

export type YEditState = { regionId: string; subregionId: string; value: string } | null
export type XZEditState = YEditState
export type HeightEditState = { regionId: string; subregionId: string; value: string } | null

export type SubregionListItem = {
  regionId: string
  subregionId: string
  name: string
  x: number
  y?: number
  height?: number
  z: number
  regionName?: string
}

export type SubregionListRowProps = {
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
}

export function SubregionListRow({
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
}: SubregionListRowProps) {
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
          title="Copy /minecraft:tp command to clipboard"
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
