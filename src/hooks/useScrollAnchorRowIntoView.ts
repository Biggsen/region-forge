import { useEffect, type RefObject } from 'react'
import type { Region } from '../types'

export function useScrollAnchorRowIntoView(params: {
  selectedRegionId: string | null
  regions: Region[]
  sectionExpanded: boolean
  listExpanded: boolean
  listItemRefs: RefObject<Partial<Record<string, HTMLLIElement | null>>>
  anchorField: 'centerPoint' | 'nervePoint'
}): void {
  const { selectedRegionId, regions, sectionExpanded, listExpanded, listItemRefs, anchorField } = params

  useEffect(() => {
    const id = selectedRegionId
    if (!id || !sectionExpanded) return
    const selected = regions.find(r => r.id === id)
    if (!selected || selected[anchorField] == null || !listExpanded) return
    const el = listItemRefs.current[id]
    if (!el) return
    let innerRaf = 0
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      })
    })
    return () => {
      cancelAnimationFrame(outerRaf)
      cancelAnimationFrame(innerRaf)
    }
  }, [selectedRegionId, regions, sectionExpanded, listExpanded, listItemRefs, anchorField])
}
