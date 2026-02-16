import React, { useState, useRef, useEffect } from 'react'

interface MinecraftItemPickerProps {
  value: { id: string; name: string } | null
  options: { id: string; name: string }[]
  onChange: (item: { id: string; name: string } | null) => void
  placeholder?: string
  disabled?: boolean
}

const MAX_VISIBLE = 12

export function MinecraftItemPicker({ value, options, onChange, placeholder = 'Search...', disabled }: MinecraftItemPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = query.trim()
    ? options.filter(
        o =>
          o.name.toLowerCase().includes(query.toLowerCase()) ||
          o.id.toLowerCase().includes(query.toLowerCase())
      )
    : options
  const visible = filtered.slice(0, MAX_VISIBLE)

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="w-full text-left px-3 py-2 rounded border border-input-border bg-input-bg text-input-text placeholder:text-gray-500 text-sm focus:border-lapis-lazuli focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {value ? value.name : placeholder}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full rounded border border-gunmetal bg-eerie-back shadow-lg max-h-56 flex flex-col">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type to search..."
            className="px-3 py-2 text-sm bg-gray-800 text-white border-b border-gunmetal focus:outline-none focus:border-lapis-lazuli sticky top-0"
            autoFocus
          />
          <div className="overflow-auto max-h-44">
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-700"
            >
              — Clear —
            </button>
            {visible.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item)
                  setOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                {item.name}
              </button>
            ))}
            {filtered.length > MAX_VISIBLE && (
              <div className="px-3 py-2 text-xs text-gray-500">
                +{filtered.length - MAX_VISIBLE} more — refine search
              </div>
            )}
            {filtered.length === 0 && query && (
              <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
