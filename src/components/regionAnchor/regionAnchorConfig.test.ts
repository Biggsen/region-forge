import { describe, it, expect } from 'vitest'
import { HEART_ANCHOR_CONFIG, NERVE_ANCHOR_CONFIG } from './regionAnchorConfig'
import { REGION_HEART_CSV_STRUCTURE, REGION_NERVE_CSV_STRUCTURE } from '../../utils/villageUtils'
import type { Region } from '../../types'

const REQUIRED_STRING_KEYS = [
  'title',
  'importHeading',
  'importButtonLabel',
  'noRowsToast',
  'importFailureMessage',
  'placedListHeading',
  'emptyPlacedMessage',
  'deleteRowLabel',
  'deleteModalLabel',
  'removedToast',
  'setLocationTitle',
  'setLocationButtonLabel',
  'selectRegionPrompt',
  'bulkTpButtonLabel',
  'bulkTpCopiedToast',
  'exportEmptyToast',
  'exportSuccessToast',
  'exportFilenameSuffix',
  'summaryAllSet'
] as const

function assertConfigShape(config: typeof HEART_ANCHOR_CONFIG) {
  for (const key of REQUIRED_STRING_KEYS) {
    expect(typeof config[key]).toBe('string')
    expect((config[key] as string).length).toBeGreaterThan(0)
  }
  expect(typeof config.listAccordionLabel(3)).toBe('string')
  expect(typeof config.summaryPartial(1, 5)).toBe('string')
  expect(typeof config.listItemKey('id-1')).toBe('string')
}

describe('regionAnchorConfig', () => {
  it('heart config uses centerPoint and region_heart CSV structure', () => {
    assertConfigShape(HEART_ANCHOR_CONFIG)
    expect(HEART_ANCHOR_CONFIG.kind).toBe('heart')
    expect(HEART_ANCHOR_CONFIG.anchorField).toBe('centerPoint')
    expect(HEART_ANCHOR_CONFIG.csvStructure).toBe(REGION_HEART_CSV_STRUCTURE)
    expect(HEART_ANCHOR_CONFIG.importRowKey).toBe('heartRows')
    expect(HEART_ANCHOR_CONFIG.importDescription).toContain(REGION_HEART_CSV_STRUCTURE)
  })

  it('nerve config uses nervePoint and region_nerve CSV structure', () => {
    assertConfigShape(NERVE_ANCHOR_CONFIG)
    expect(NERVE_ANCHOR_CONFIG.kind).toBe('nerve')
    expect(NERVE_ANCHOR_CONFIG.anchorField).toBe('nervePoint')
    expect(NERVE_ANCHOR_CONFIG.csvStructure).toBe(REGION_NERVE_CSV_STRUCTURE)
    expect(NERVE_ANCHOR_CONFIG.importRowKey).toBe('nerveRows')
    expect(NERVE_ANCHOR_CONFIG.importDescription).toContain(REGION_NERVE_CSV_STRUCTURE)
  })

  it('getAnchor field matches Region type keys', () => {
    const region = {
      id: 'r1',
      name: 'Test',
      points: [],
      centerPoint: { x: 1, z: 2 },
      nervePoint: { x: 3, z: 4 }
    } as Region
    expect(region[HEART_ANCHOR_CONFIG.anchorField]).toEqual({ x: 1, z: 2 })
    expect(region[NERVE_ANCHOR_CONFIG.anchorField]).toEqual({ x: 3, z: 4 })
  })
})
