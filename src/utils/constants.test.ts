import { describe, it, expect } from 'vitest'
import {
  IMAGE_MIN_SIZE,
  IMAGE_MAX_SIZE,
  SIDEBAR_WIDTH,
  ZOOM_PADDING,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_SCALE,
} from './constants'

describe('constants', () => {
  it('exports image validation constants', () => {
    expect(IMAGE_MIN_SIZE).toBe(250)
    expect(IMAGE_MAX_SIZE).toBe(2000)
  })

  it('exports UI layout constants', () => {
    expect(SIDEBAR_WIDTH).toBe(384)
  })

  it('exports zoom constants', () => {
    expect(ZOOM_PADDING).toBe(0.2)
    expect(MIN_ZOOM).toBe(0.1)
    expect(MAX_ZOOM).toBe(5)
  })

  it('exports canvas constants', () => {
    expect(DEFAULT_SCALE).toBe(1)
  })
})
