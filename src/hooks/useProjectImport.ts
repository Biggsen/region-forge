import { useRef, useCallback } from 'react'
import { useAppContext } from '../context/AppContext'
import { importMapData, loadImageFromSrc, loadImageFromBase64 } from '../utils/exportUtils'
import { loadImageDetails, saveImageDetails, saveExportSettings, type ImageDetails, type ExportSettings } from '../utils/persistenceUtils'
import { validateImageDimensions } from '../utils/imageValidation'
import { getValidDimension } from '../utils/dimensionUtils'

export interface UseProjectImportOptions {
  markAsSaved: () => void
}

export function useProjectImport({ markAsSaved }: UseProjectImportOptions) {
  const { regions, mapState, worldName, spawn, seedInfo, toast } = useAppContext()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const importData = await importMapData(file)

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

      let dimensionToUse = importData.dimension
      if (!dimensionToUse && importData.worldType) {
        dimensionToUse = getValidDimension(importData.worldType)
      } else {
        dimensionToUse = getValidDimension(dimensionToUse)
      }
      seedInfo.updateSeedInfo({
        seed: importData.seed,
        dimension: dimensionToUse
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
        saveExportSettings(sanitized as ExportSettings)
        window.dispatchEvent(new Event('exportSettingsUpdated'))
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      markAsSaved()
      toast.showToast('Project file loaded successfully', 'success')
    } catch (error) {
      toast.showToast('Failed to load project file. Please make sure it\'s a valid project file.', 'error')
      console.error('Import error:', error)
    }
  }, [regions, mapState, worldName, spawn, seedInfo, toast, markAsSaved])

  return { fileInputRef, handleFileImport }
}
