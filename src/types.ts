export type ChallengeLevel = 'easy' | 'normal' | 'hard' | 'severe' | 'deadly'

export const STRUCTURE_TYPES = {
  JUNGLE_PYRAMID: 'jungle_pyramid',
  IGLOO: 'igloo',
  DESERT_PYRAMID: 'desert_pyramid',
  BURIED_TREASURE: 'buried_treasure',
} as const

export type StructureType = typeof STRUCTURE_TYPES[keyof typeof STRUCTURE_TYPES]

export type Region = {
  id: string
  name: string
  description?: string
  points: { x: number; z: number }[]
  originalPoints?: { x: number; z: number }[]
  scaleFactor?: number
  centerPoint?: { x: number; z: number } | null
  labelPosition?: { x: number; z: number } | null
  subregions?: Subregion[]
  challengeLevel?: ChallengeLevel
  hasSpawn?: boolean
  disabled?: boolean
  minecraftCategory?: string
  minecraftItems?: { id: string; name: string }[]
  regionTheme?: { a: string; b: string }[]
}

export type Subregion = {
  id: string
  name: string
  x: number
  z: number
  radius: number
  type: 'village' | 'structure'
  /** Specific structure kind for type === 'structure'. Used for display and future icon key. */
  structureType?: StructureType
  details?: string
  parentRegionId?: string
}

export type WorldCoordinate = {
  x: number
  z: number
}

/** Spawn position: x/z from map or manual, y manual only (default 0). */
export type SpawnCoordinate = {
  x: number
  z: number
  y: number
}

export type PixelCoordinate = {
  x: number
  y: number
}

export type SpawnState = {
  coordinates: SpawnCoordinate | null
  isPlacing: boolean
  radius: number
}

export type MapState = {
  image: HTMLImageElement | null
  terrainImage: HTMLImageElement | null
  biomeImage: HTMLImageElement | null
  terrainVisible: boolean
  terrainOpacity: number
  biomeVisible: boolean
  biomeOpacity: number
  scale: number
  offsetX: number
  offsetY: number
  isDragging: boolean
  lastMousePos: { x: number; y: number } | null
  originSelected: boolean
  originOffset: { x: number; y: number } | null
  imageOpacity: number
}

export type EditMode = {
  isEditing: boolean
  editingRegionId: string | null
  draggingPointIndex: number | null
  isMovingRegion: boolean
  movingRegionId: string | null
  moveStartPosition: { x: number; z: number } | null
  originalRegionPoints: { x: number; z: number }[] | null
  isSplittingRegion: boolean
  splittingRegionId: string | null
  splitPoints: { x: number; z: number }[]
}

export type HighlightMode = {
  highlightAll: boolean
  showRegions: boolean
  showVillages: boolean
  showCenterPoints: boolean
  showChallengeLevels: boolean
  showGrid: boolean
  showNames: boolean
  /** Per-structure-type visibility on the map. Undefined or true = show, false = hide. */
  visibleStructureTypes?: Partial<Record<StructureType, boolean>>
  /** When set, this structure type is highlighted on the map (e.g. ring around markers). */
  highlightedStructureType?: StructureType | null
}

export type CustomMarker = {
  id: string
  coordinates: WorldCoordinate
  type?: 'custom' | 'orphaned_village'
  details?: string
  villageType?: string
}