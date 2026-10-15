import { useRef, useCallback, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { importMapData, loadImageFromSrc, loadImageFromBase64, type MapExportData } from '../utils/exportUtils'
import { loadImageDetails, saveImageDetails, saveExportSettings, type ImageDetails, type ExportSettings } from '../utils/persistenceUtils'
import { validateImageDimensions } from '../utils/imageValidation'
import { getValidDimension } from '../utils/dimensionUtils'
import {
  describeReleaseImportConflict,
  detectReleaseImportConflict,
  readReleaseState,
  releaseStateFromProjectFile,
  type YamlReleaseState,
} from '../utils/yamlRelease'

export interface UseProjectImportOptions {
  markAsSaved: () => void
  replaceReleaseState: (state: YamlReleaseState) => void
}

export function useProjectImport({
  markAsSaved,
  replaceReleaseState,
}: UseProjectImportOptions) {
  const { regions, mapState, worldName, spawn, seedInfo, toast } = useAppContext()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<{
    data: MapExportData
    releaseState: YamlReleaseState
    message: string
  } | null>(null)

  const applyImportedProject = useCallback(async (importData: MapExportData, releaseState: YamlReleaseState) => {
    try {
      replaceReleaseState(releaseState)
    } catch (error) {
      toast.showToast('Could not save release history, so the project was not loaded.', 'error')
      console.error('Import error:', error)
      return
    }

    try {
      if (importData.terrainImageData && importData.biomeImageData) {
        try {
          const [terrainImg, biomeImg] = await Promise.all([
            loadImageFromBase64(importData.terrainImageData),
            loadImageFromBase64(importData.biomeImageData)
          ])
          const tVal = validateImageDimensions(terrainImg.width, terrainImg.height)
          const bVal = validateImageDimensions(biomeImg.width, biomeImg.height)
          if (!tVal.isValid || !bVal.isValid) {
            toast.showToast(tVal.error || bVal.error || 'Image validation failed', 'error')
          } else if (terrainImg.width !== biomeImg.width || terrainImg.height !== biomeImg.height) {
            toast.showToast('Terrain and biome layers have mismatched dimensions', 'error')
          } else {
            mapState.setTerrainImage(terrainImg)
            mapState.setBiomeImage(biomeImg)
          }
        } catch {
          console.warn('Failed to load dual layers, continuing without images')
        }
      } else if (importData.terrainImageData) {
        try {
          const image = await loadImageFromBase64(importData.terrainImageData)
          const validation = validateImageDimensions(image.width, image.height)
          if (!validation.isValid) {
            toast.showToast(validation.error || 'Image validation failed', 'error')
          } else {
            mapState.setTerrainImage(image)
            mapState.setBiomeImage(null)
          }
        } catch {
          console.warn('Failed to load terrain image, continuing without image')
        }
      } else if ('imageData' in importData && importData.imageData) {
        try {
          const image = await loadImageFromBase64(importData.imageData)
          const validation = validateImageDimensions(image.width, image.height)
          if (!validation.isValid) {
            toast.showToast(validation.error || 'Image validation failed', 'error')
          } else {
            mapState.setImage(image)
          }
        } catch {
          console.warn('Failed to load embedded image, continuing without image')
        }
      } else if (importData.mapState.imageSrc) {
        try {
          const image = await loadImageFromSrc(importData.mapState.imageSrc)
          const validation = validateImageDimensions(image.width, image.height)
          if (!validation.isValid) {
            toast.showToast(validation.error || 'Image validation failed', 'error')
          } else {
            mapState.setImage(image)
          }
        } catch {
          console.warn('Failed to load image from import, continuing without image')
        }
      }

      mapState.setScale(importData.mapState.scale)
      mapState.setOffset(importData.mapState.offsetX, importData.mapState.offsetY)
      mapState.setOriginSelected(importData.mapState.originSelected)
      if (importData.mapState.originOffset) {
        mapState.setOriginOffset(importData.mapState.originOffset)
      }

      regions.replaceRegions(importData.regions)
      regions.setSelectedRegionId(null)
      worldName.updateWorldName(importData.worldName || 'world')

      if (importData.spawnCoordinates) {
        spawn.setSpawnCoordinates(importData.spawnCoordinates)
        if (importData.spawnCoordinates.radius) {
          spawn.setSpawnRadius(importData.spawnCoordinates.radius)
        }
      }

      seedInfo.updateSeedInfo({
        seed: importData.seed,
        dimension: getValidDimension(importData.dimension || importData.worldType)
      })

      const currentDetails = loadImageDetails() || {}
      const updatedDetails: ImageDetails = { ...currentDetails }
      if (importData.worldSize !== undefined) {
        updatedDetails.worldSize = importData.worldSize
      } else {
        delete updatedDetails.worldSize
      }
      if (importData.imageSize !== undefined) {
        updatedDetails.imageSize = importData.imageSize
      } else {
        delete updatedDetails.imageSize
      }
      saveImageDetails(updatedDetails)

      if (importData.exportSettings) {
        const { randomMobSpawn: _rm, ...sanitized } = importData.exportSettings as ExportSettings & { randomMobSpawn?: boolean }
        const s = sanitized as Partial<ExportSettings>
        saveExportSettings({
          ...(sanitized as ExportSettings),
          excludeDescriptionsFromRegionsMeta: s.excludeDescriptionsFromRegionsMeta ?? false,
          includeNerveRegions: s.includeNerveRegions ?? false
        })
        window.dispatchEvent(new Event('exportSettingsUpdated'))
      }

      markAsSaved()
      toast.showToast('Project file loaded successfully', 'success')
    } catch (error) {
      toast.showToast('Failed to load project file. Please make sure it\'s a valid project file.', 'error')
      console.error('Import error:', error)
    }
  }, [regions, mapState, worldName, spawn, seedInfo, toast, markAsSaved, replaceReleaseState])

  const handleFileImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''

    try {
      const importData = await importMapData(file)
      const releaseState = releaseStateFromProjectFile(importData, () => crypto.randomUUID())
      const conflict = detectReleaseImportConflict(readReleaseState(), releaseState)
      if (conflict) {
        setPendingImport({
          data: importData,
          releaseState,
          message: describeReleaseImportConflict(conflict),
        })
        return
      }
      await applyImportedProject(importData, releaseState)
    } catch (error) {
      toast.showToast('Failed to load project file. Please make sure it\'s a valid project file.', 'error')
      console.error('Import error:', error)
    }
  }, [applyImportedProject, toast])

  const confirmReleaseConflict = useCallback(() => {
    if (!pendingImport) return
    const { data, releaseState } = pendingImport
    setPendingImport(null)
    void applyImportedProject(data, releaseState)
  }, [pendingImport, applyImportedProject])

  const cancelReleaseConflict = useCallback(() => {
    setPendingImport(null)
  }, [])

  return {
    fileInputRef,
    handleFileImport,
    releaseConflict: pendingImport ? { message: pendingImport.message } : null,
    confirmReleaseConflict,
    cancelReleaseConflict,
  }
}
