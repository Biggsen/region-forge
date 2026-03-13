import type { HighlightMode, StructureType } from '../types'
import { STRUCTURE_TYPES } from '../types'

const defaultVisibleStructures: Partial<Record<StructureType, boolean>> = (Object.values(STRUCTURE_TYPES) as StructureType[]).reduce(
  (acc, k) => ({ ...acc, [k]: false }),
  {} as Partial<Record<StructureType, boolean>>
)

export const DEFAULT_HIGHLIGHT_MODE: HighlightMode = {
  highlightAll: false,
  showRegions: true,
  showVillages: true,
  showCenterPoints: true,
  showChallengeLevels: false,
  showGrid: false,
  showNames: true,
  visibleStructureTypes: defaultVisibleStructures,
  highlightedStructureType: null,
}
