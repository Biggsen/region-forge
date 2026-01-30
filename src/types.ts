export type ChallengeLevel = 'easy' | 'normal' | 'hard' | 'severe' | 'deadly'

export type Region = {
  id: string
  name: string
  points: { x: number; z: number }[]
  originalPoints?: { x: number; z: number }[]
  scaleFactor?: number
  centerPoint?: { x: number; z: number } | null
  subregions?: Subregion[]
  challengeLevel?: ChallengeLevel
  hasSpawn?: boolean
  disabled?: boolean
}

export type Subregion = {
  id: string
  name: string
  x: number
  z: number
  radius: number
  type: 'village' | 'structure'
  details?: string
  parentRegionId?: string
}

export type WorldCoordinate = {
  x: number
  z: number
}

export type PixelCoordinate = {
  x: number
  y: number
}

export type SpawnState = {
  coordinates: WorldCoordinate | null
  isPlacing: boolean
  radius: number
}

export type MapState = {
  image: HTMLImageElement | null
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
}

export type CustomMarker = {
  id: string
  coordinates: WorldCoordinate
  type?: 'custom' | 'orphaned_village'
  details?: string
  villageType?: string
}