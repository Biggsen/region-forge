import type { useMapCanvas } from '../../hooks/useMapCanvas'
import type { useRegions } from '../../hooks/useRegions'
import type { Region } from '../../types'
import {
  buildRegionHeartsVillageFormatCSV,
  buildRegionNervesVillageFormatCSV
} from '../../utils/villageUtils'
import type { RegionAnchorImportResult } from '../../utils/regionAnchorImport'
import type { RegionAnchorKind } from './regionAnchorConfig'

export type RegionAnchorApi = {
  importFromCsv: (text: string) => RegionAnchorImportResult
  updateY: (regionId: string, subregionId: string, y: number | undefined) => void
  updateX: (regionId: string, subregionId: string, x: number) => void
  updateZ: (regionId: string, subregionId: string, z: number) => void
  clearAnchor: (regionId: string) => void
  buildExportCsv: (regions: Region[], seed: string | number | undefined) => string | null
  mapPlacement: {
    isPlacing: boolean
    placingRegionId: string | null
    startPlacing: (regionId: string) => void
    stopPlacing: () => void
  }
}

export function getRegionAnchorApi(
  kind: RegionAnchorKind,
  regions: ReturnType<typeof useRegions>,
  mapCanvas: ReturnType<typeof useMapCanvas>
): RegionAnchorApi {
  if (kind === 'heart') {
    return {
      importFromCsv: regions.importHeartsFromCSV,
      updateY: regions.updateRegionHeartY,
      updateX: regions.updateRegionHeartX,
      updateZ: regions.updateRegionHeartZ,
      clearAnchor: regionId => regions.setCustomCenterPoint(regionId, null),
      buildExportCsv: buildRegionHeartsVillageFormatCSV,
      mapPlacement: {
        isPlacing: mapCanvas.isSettingCenterPoint,
        placingRegionId: mapCanvas.centerPointRegionId,
        startPlacing: mapCanvas.startSettingCenterPoint,
        stopPlacing: mapCanvas.stopSettingCenterPoint
      }
    }
  }
  return {
    importFromCsv: regions.importNervesFromCSV,
    updateY: regions.updateRegionNerveY,
    updateX: regions.updateRegionNerveX,
    updateZ: regions.updateRegionNerveZ,
    clearAnchor: regionId => regions.setCustomNervePoint(regionId, null),
    buildExportCsv: buildRegionNervesVillageFormatCSV,
    mapPlacement: {
      isPlacing: mapCanvas.isSettingNervePoint,
      placingRegionId: mapCanvas.nervePointRegionId,
      startPlacing: mapCanvas.startSettingNervePoint,
      stopPlacing: mapCanvas.stopSettingNervePoint
    }
  }
}
