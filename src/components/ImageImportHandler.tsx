import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { saveImageDetails } from '../utils/persistenceUtils'
import { validateImageDimensions } from '../utils/imageValidation'
import { getImageProxyUrl } from '../utils/imageUtils'

export function ImageImportHandler() {
  const location = useLocation()
  const { mapState, regions, worldName, spawn, seedInfo, toast } = useAppContext()
  const hasProcessedRef = useRef(false)

  useEffect(() => {
    const dualUrls = location.state?.importTerrainImage && location.state?.importBiomeImage
    const singleUrl = location.state?.importImage
    const hasImport = dualUrls || singleUrl

    if (hasImport && !hasProcessedRef.current) {
      hasProcessedRef.current = true

      if (dualUrls) {
        loadDualImages()
      } else {
        loadSingleImage(location.state.importImage)
      }
    }

    function clearAndApplyDual(terrainImg: HTMLImageElement, biomeImg: HTMLImageElement) {
      regions.replaceRegions([])
      regions.setSelectedRegionId(null)
      mapState.setScale(1)
      mapState.setOffset(0, 0)
      mapState.setOriginSelected(false)
      mapState.setOriginOffset(null)
      mapState.setTerrainImage(terrainImg)
      mapState.setBiomeImage(biomeImg)
      if (terrainImg.width === terrainImg.height) {
        const centerX = Math.floor(terrainImg.width / 2)
        const centerY = Math.floor(terrainImg.height / 2)
        mapState.setOrigin(centerX, centerY)
      }
      const calculatedWorldSize = terrainImg.width === terrainImg.height
        ? Math.round(terrainImg.width / 125)
        : Math.round(Math.max(terrainImg.width, terrainImg.height) / 125)
      saveImageDetails({
        imageSize: { width: terrainImg.width, height: terrainImg.height },
        worldSize: calculatedWorldSize
      })
      if (location.state?.seed !== undefined || location.state?.dimension !== undefined) {
        seedInfo.updateSeedInfo({
          seed: location.state.seed,
          dimension: location.state.dimension
        })
      }
      worldName.updateWorldName('World')
      spawn.setSpawnCoordinates(null)
      window.history.replaceState({}, document.title)
    }

    function loadDualImages() {
      const terrainUrl = location.state.importTerrainImage
      const biomeUrl = location.state.importBiomeImage
      const proxiedTerrain = getImageProxyUrl(terrainUrl)
      const proxiedBiome = getImageProxyUrl(biomeUrl)

      const terrainImg = new Image()
      const biomeImg = new Image()
      terrainImg.crossOrigin = 'anonymous'
      biomeImg.crossOrigin = 'anonymous'

      let terrainLoaded = false
      let biomeLoaded = false

      function maybeApply() {
        if (!terrainLoaded || !biomeLoaded) return
        if (terrainImg.width !== biomeImg.width || terrainImg.height !== biomeImg.height) {
          toast.showToast('Terrain and biome images must have the same dimensions.', 'error')
          return
        }
        const validation = validateImageDimensions(terrainImg.width, terrainImg.height)
        if (!validation.isValid) {
          toast.showToast(validation.error || 'Image validation failed', 'error')
          return
        }
        clearAndApplyDual(terrainImg, biomeImg)
      }

      terrainImg.onload = () => {
        terrainLoaded = true
        maybeApply()
      }
      biomeImg.onload = () => {
        biomeLoaded = true
        maybeApply()
      }

      terrainImg.onerror = () => {
        toast.showToast('Failed to load terrain image.', 'error')
      }
      biomeImg.onerror = () => {
        toast.showToast('Failed to load biome image.', 'error')
      }

      terrainImg.src = proxiedTerrain
      biomeImg.src = proxiedBiome
    }

    function loadSingleImage(imageUrl: string) {
      const img = new Image()
      const proxiedImageUrl = getImageProxyUrl(imageUrl)
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        // Validate image dimensions before proceeding
        const validation = validateImageDimensions(img.width, img.height)
        if (!validation.isValid) {
          toast.showToast(validation.error || 'Image validation failed', 'error')
          return
        }
        
        // Clear all existing data for fresh start
        // Clear all regions
        regions.replaceRegions([])
        regions.setSelectedRegionId(null)
        
        // Reset map state to defaults
        mapState.setScale(1)
        mapState.setOffset(0, 0)
        mapState.setOriginSelected(false)
        mapState.setOriginOffset(null)
        
        // Set the new image
        mapState.setImage(img)
        
        // Auto-set origin to center for square images
        if (img.width === img.height) {
          const centerX = Math.floor(img.width / 2)
          const centerY = Math.floor(img.height / 2)
          mapState.setOrigin(centerX, centerY)
        }
        
        // Calculate world size from image dimensions (assuming square images)
        const calculatedWorldSize = img.width === img.height 
          ? Math.round(img.width / 125)
          : Math.round(Math.max(img.width, img.height) / 125)
        
        // Save image details for imported image
        saveImageDetails({
          imageSize: { width: img.width, height: img.height },
          worldSize: calculatedWorldSize
        })
        
        // Update seed/dimension from router state if provided
        if (location.state?.seed !== undefined || location.state?.dimension !== undefined) {
          seedInfo.updateSeedInfo({
            seed: location.state.seed,
            dimension: location.state.dimension
          })
        }
        // If not provided, leave World Details as-is (don't clear)
        
        // Reset world name to 'World'
        worldName.updateWorldName('World')
        
        // Clear spawn coordinates
        spawn.setSpawnCoordinates(null)
        
        // Clear the location state to prevent re-importing on refresh
        window.history.replaceState({}, document.title)
      }
      
      img.onerror = (error) => {
        console.error('Failed to load image:', error)
        
        // Try without crossOrigin as fallback
        if (img.crossOrigin === 'anonymous') {
          img.crossOrigin = null
          img.src = proxiedImageUrl
          return
        }
        
        toast.showToast('Failed to load image. Make sure the API server is running and accessible.', 'error')
      }
      
      img.src = proxiedImageUrl
    }
  }, [location.state, mapState, regions, worldName, spawn, seedInfo, toast])

  // Reset the processed flag when location changes
  useEffect(() => {
    hasProcessedRef.current = false
  }, [location.pathname])

  // This component doesn't render anything
  return null
}
