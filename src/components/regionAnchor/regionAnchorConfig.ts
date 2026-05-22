import { Heart, Activity, type LucideIcon } from 'lucide-react'
import { REGION_HEART_CSV_STRUCTURE, REGION_NERVE_CSV_STRUCTURE } from '../../utils/villageUtils'

export type RegionAnchorKind = 'heart' | 'nerve'

export type RegionAnchorConfig = {
  kind: RegionAnchorKind
  anchorField: 'centerPoint' | 'nervePoint'
  csvStructure: string
  title: string
  Icon: LucideIcon
  importHeading: string
  importDescription: string
  importButtonLabel: string
  importRowKey: 'heartRows' | 'nerveRows'
  noRowsToast: string
  importFailureMessage: string
  placedListHeading: string
  listAccordionLabel: (count: number) => string
  emptyPlacedMessage: string
  deleteRowLabel: string
  deleteModalLabel: string
  removedToast: string
  setLocationTitle: string
  setLocationBody: string
  setLocationButtonLabel: string
  setLocationButtonTitle: string
  selectRegionPrompt: string
  bulkTpButtonLabel: string
  bulkTpCopiedToast: string
  exportEmptyToast: string
  exportSuccessToast: string
  exportFilenameSuffix: string
  summaryAllSet: string
  summaryPartial: (set: number, total: number) => string
  listItemKey: (regionId: string) => string
}

export const HEART_ANCHOR_CONFIG: RegionAnchorConfig = {
  kind: 'heart',
  anchorField: 'centerPoint',
  csvStructure: REGION_HEART_CSV_STRUCTURE,
  title: 'Region Hearts',
  Icon: Heart,
  importHeading: 'Import hearts',
  importDescription:
    'Uses rows where structure is region_heart (same CSV as export). Only X, Y, and Z are applied; the details column is ignored. Each point is assigned to the region whose polygon contains it.',
  importButtonLabel: 'Import hearts (CSV)',
  importRowKey: 'heartRows',
  noRowsToast: 'No region_heart rows found in CSV',
  importFailureMessage: 'Failed to import hearts',
  placedListHeading: 'Placed hearts',
  listAccordionLabel: count => `Region hearts (${count})`,
  emptyPlacedMessage: 'No region hearts yet. Select a region and use Set heart location on the map.',
  deleteRowLabel: 'Remove region heart',
  deleteModalLabel: 'region heart',
  removedToast: 'Region heart removed',
  setLocationTitle: 'Set Heart Location',
  setLocationBody: 'Click on the map to set the heart location',
  setLocationButtonLabel: 'Set heart location',
  setLocationButtonTitle: 'Click on map to set region heart',
  selectRegionPrompt: 'Select a region to set its heart on the map',
  bulkTpButtonLabel: 'Copy all heart TPs',
  bulkTpCopiedToast: 'All heart teleport commands copied',
  exportEmptyToast: 'No region hearts to export',
  exportSuccessToast: 'Region hearts CSV downloaded',
  exportFilenameSuffix: 'region-hearts',
  summaryAllSet: 'All regions have hearts',
  summaryPartial: (set, total) => `${set} region hearts set out of ${total} regions`,
  listItemKey: regionId => regionId
}

export const NERVE_ANCHOR_CONFIG: RegionAnchorConfig = {
  kind: 'nerve',
  anchorField: 'nervePoint',
  csvStructure: REGION_NERVE_CSV_STRUCTURE,
  title: 'Region Nerves',
  Icon: Activity,
  importHeading: 'Import nerves',
  importDescription:
    'Uses rows where structure is region_nerve (same CSV layout as hearts). Only X, Y, and Z are applied; the details column is ignored. Each point is assigned to the region whose polygon contains it.',
  importButtonLabel: 'Import nerves (CSV)',
  importRowKey: 'nerveRows',
  noRowsToast: 'No region_nerve rows found in CSV',
  importFailureMessage: 'Failed to import nerves',
  placedListHeading: 'Placed nerves',
  listAccordionLabel: count => `Region nerves (${count})`,
  emptyPlacedMessage: 'No region nerves yet. Select a region and use Set nerve location on the map.',
  deleteRowLabel: 'Remove region nerve',
  deleteModalLabel: 'region nerve',
  removedToast: 'Region nerve removed',
  setLocationTitle: 'Set Nerve Location',
  setLocationBody: 'Click on the map to set the nerve location',
  setLocationButtonLabel: 'Set nerve location',
  setLocationButtonTitle: 'Click on map to set region nerve',
  selectRegionPrompt: 'Select a region to set its nerve on the map',
  bulkTpButtonLabel: 'Copy all nerve TPs',
  bulkTpCopiedToast: 'All nerve teleport commands copied',
  exportEmptyToast: 'No region nerves to export',
  exportSuccessToast: 'Region nerves CSV downloaded',
  exportFilenameSuffix: 'region-nerves',
  summaryAllSet: 'All regions have nerves',
  summaryPartial: (set, total) => `${set} region nerves set out of ${total} regions`,
  listItemKey: regionId => `nerve-${regionId}`
}
