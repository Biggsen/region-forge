import { useState, useCallback, useEffect, useRef } from 'react'
import { useAppContext } from '../context/AppContext'
import { saveImageDetails, loadImageDetails, ImageDetails } from '../utils/persistenceUtils'
import { clearSavedData } from '../utils/persistenceUtils'
import { validateImageDimensions } from '../utils/imageValidation'
import { getImageProxyUrl } from '../utils/imageUtils'
import { SIDEBAR_WIDTH } from '../utils/constants'
import { Button } from './Button'
import { WorldNameHeading } from './WorldNameHeading'
import { SeedInfoHeading } from './SeedInfoHeading'
import { WorldSizeHeading } from './WorldSizeHeading'
import { ArrowLeft } from 'lucide-react'

interface MapLoaderControlsProps {
  onShowImportConfirmation: (callback: (deleteRegions: boolean) => void) => void
}

export function MapLoaderControls({ onShowImportConfirmation }: MapLoaderControlsProps) {
  const { mapState, regions, seedInfo, worldName, toast } = useAppContext()
  const [imageUrl, setImageUrl] = useState('')
  const [worldSize, setWorldSize] = useState(8)
  const [isLoading, setIsLoading] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [previewImageDimensions, setPreviewImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [seedError, setSeedError] = useState<string | null>(null)
  const [loadedMapDetails, setLoadedMapDetails] = useState<ImageDetails | null>(null)
  const [showLoadSection, setShowLoadSection] = useState(false)
  const isUpdatingDetailsRef = useRef(false)
  
  // Local state for import form inputs (not saved until import)
  const [importWorldName, setImportWorldName] = useState(worldName.worldName)
  const [importSeed, setImportSeed] = useState(seedInfo.seedInfo.seed || '')
  const [importDimension, setImportDimension] = useState(seedInfo.seedInfo.dimension || 'overworld')
  
  const { setImage, setOffset } = mapState
  
  const hasMapLoaded = !!mapState.mapState.image

  // Helper function to calculate world size from image dimensions
  const calculateWorldSize = (width: number, height: number): number => {
    return Math.round(Math.max(width, height) / 125)
  }

  // Initialize local state from context when load section is opened
  useEffect(() => {
    if (showLoadSection) {
      setImportWorldName(worldName.worldName)
      setImportSeed(seedInfo.seedInfo.seed || '')
      setImportDimension(seedInfo.seedInfo.dimension || 'overworld')
    }
  }, [showLoadSection, worldName.worldName, seedInfo.seedInfo.seed, seedInfo.seedInfo.dimension])

  // Load saved image details on mount and when map image changes
  // Skip loading if we're actively updating details to prevent race condition
  useEffect(() => {
    if (isUpdatingDetailsRef.current) {
      return
    }
    const savedDetails = loadImageDetails()
    if (savedDetails) {
      setLoadedMapDetails(savedDetails)
    }
  }, [mapState.mapState.image])

  // Save image details whenever they change
  useEffect(() => {
    if (loadedMapDetails) {
      saveImageDetails(loadedMapDetails)
    }
  }, [loadedMapDetails])

  // Listen for storage changes to update loadedMapDetails when child components update localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mc-region-maker-image-details') {
        const savedDetails = loadImageDetails()
        if (savedDetails) {
          setLoadedMapDetails(savedDetails)
        } else {
          setLoadedMapDetails(null)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events for same-tab updates
    const handleImageDetailsUpdate = () => {
      const savedDetails = loadImageDetails()
      if (savedDetails) {
        setLoadedMapDetails(savedDetails)
      } else {
        setLoadedMapDetails(null)
      }
    }
    
    window.addEventListener('imageDetailsUpdated', handleImageDetailsUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('imageDetailsUpdated', handleImageDetailsUpdate)
    }
  }, [])

  const loadImageToCanvas = useCallback((url: string) => {
    const img = new Image()
    
    // Use proxy for external URLs to avoid CORS issues
    const imageUrl = getImageProxyUrl(url)
    
    // Set crossOrigin to anonymous to allow canvas export
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // Validate image dimensions before proceeding
      const validation = validateImageDimensions(img.width, img.height)
      if (!validation.isValid) {
        toast.showToast(validation.error || 'Image validation failed', 'error')
        return
      }
      
      // Mark that we're updating details to prevent race condition with load useEffect
      isUpdatingDetailsRef.current = true
      
      setImage(img)
      // Center the image
      const canvasWidth = window.innerWidth - SIDEBAR_WIDTH // Account for sidebar
      const canvasHeight = window.innerHeight - 64 // Account for nav bar
      const centerX = (canvasWidth - img.width) / 2
      const centerY = (canvasHeight - img.height) / 2
      setOffset(centerX, centerY)
      
      // Auto-set origin to center for square images
      if (img.width === img.height) {
        const originX = Math.floor(img.width / 2)
        const originY = Math.floor(img.height / 2)
        mapState.setOrigin(originX, originY)
      }
      
      // Calculate world size from image dimensions (assuming square images)
      // Formula: image size / 125 = world size in k (e.g., 750x750 = 6k)
      const calculatedWorldSize = img.width === img.height 
        ? Math.round(img.width / 125)
        : Math.round(Math.max(img.width, img.height) / 125)
      
      // Create new image details
      const newImageDetails: ImageDetails = {
        seed: importSeed.trim() || seedInfo.seedInfo.seed,
        dimension: importDimension || seedInfo.seedInfo.dimension,
        imageSize: { width: img.width, height: img.height },
        worldSize: calculatedWorldSize
      }
      
      // Save to localStorage immediately
      saveImageDetails(newImageDetails)
      
      // Update loaded map details state
      setLoadedMapDetails(newImageDetails)
      
      // Reset flag after a short delay to allow state to update
      setTimeout(() => {
        isUpdatingDetailsRef.current = false
      }, 100)
    }
    img.onerror = (error) => {
      console.error('Failed to load image:', error)
      toast.showToast('Failed to load image from URL. Please check the URL and try again.', 'error')
    }
    img.src = imageUrl
  }, [setImage, setOffset, mapState, seedInfo, importSeed, importDimension])

  const handleGetMap = async () => {
    const seed = importSeed.trim()
    const dimension = importDimension || 'overworld'
    
    if (!seed) {
      setSeedError('Please enter a seed')
      return
    }

    setIsLoading(true)
    setError(null)
    setUrlError(null)
    setSeedError(null)
    setPreviewImageUrl(null)
    setPreviewImageDimensions(null)
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    
    try {
      // Step 1: Start generation job
      const generateResponse = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          seed: seed.trim(),
          dimension: dimension,
          size: worldSize
        })
      })
      
      if (!generateResponse.ok) {
        throw new Error('Failed to start map generation')
      }
      
      const generateResult = await generateResponse.json()
      
      if (!generateResult.success) {
        throw new Error(generateResult.error || 'Failed to start generation')
      }
      
      const jobId = generateResult.jobId
      // Start polling for job completion (async map generation)
      
      setIsPolling(true)
      
      // Step 2: Poll for status
      const maxAttempts = 20  // 100 seconds max (20 polls * 5 seconds)
      let attempts = 0
      
      const pollStatus = async (): Promise<string> => {
        const statusResponse = await fetch(`${API_URL}/api/status/${jobId}`)
        
        if (!statusResponse.ok) {
          throw new Error('Failed to check job status')
        }
        
        const statusResult = await statusResponse.json()
        
        if (statusResult.status === 'ready') {
          return statusResult.imageUrl
        }
        
        if (statusResult.status === 'failed') {
          const errorMsg = statusResult.message || 'Map generation failed'
          const retryable = statusResult.retryable
          throw new Error(`${errorMsg}${retryable ? ' (You can retry)' : ''}`)
        }
        
        // Still processing
        attempts++
        if (attempts >= maxAttempts) {
          throw new Error('Map generation timed out. Please try again.')
        }
        
        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000))
        return pollStatus()
      }
      
      let generatedImageUrl = await pollStatus()
      
      // Normalize image URL - handle relative URLs or localhost URLs
      if (generatedImageUrl.startsWith('/')) {
        // Relative URL - prepend API_URL
        generatedImageUrl = `${API_URL}${generatedImageUrl}`
      } else if (generatedImageUrl.includes('localhost:3000') || generatedImageUrl.includes('localhost:3001')) {
        // Replace localhost with API_URL - extract path from URL
        try {
          const urlPath = new URL(generatedImageUrl).pathname
          generatedImageUrl = `${API_URL}${urlPath}`
        } catch {
          // If URL parsing fails, try simple string replacement
          const match = generatedImageUrl.match(/\/generated-maps\/.+$/)
          if (match) {
            generatedImageUrl = `${API_URL}${match[0]}`
          }
        }
      }
      
      // Use proxy for external URLs to avoid CORS issues
      const proxiedImageUrl = getImageProxyUrl(generatedImageUrl)
      
      setPreviewImageUrl(proxiedImageUrl)
      // Calculate dimensions from world size (formula: worldSize * 125 = image size)
      const imageSize = worldSize * 125
      setPreviewImageDimensions({ width: imageSize, height: imageSize })
      
    } catch (error) {
      console.error('Error generating map:', error)
      if (error instanceof TypeError) {
        setError('Cannot connect to map generator service. Is it running?')
      } else {
        setError(error instanceof Error ? error.message : 'Failed to generate map. Make sure the API server is running.')
      }
    } finally {
      setIsLoading(false)
      setIsPolling(false)
    }
  }

  const handleLoadFromUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageUrl.trim()) return
    
    setIsLoadingUrl(true)
    setUrlError(null)
    
    try {
      // Just load to preview, not to canvas yet
      // Use proxy for external URLs to avoid CORS issues
      const proxiedUrl = getImageProxyUrl(imageUrl.trim())
      
      // Test if image loads
      const testImg = new Image()
      testImg.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        testImg.onload = () => {
          const validation = validateImageDimensions(testImg.width, testImg.height)
          if (!validation.isValid) {
            reject(new Error(validation.error || 'Image validation failed'))
            return
          }
          setPreviewImageUrl(proxiedUrl)
          setPreviewImageDimensions({ width: testImg.width, height: testImg.height })
          resolve(null)
        }
        testImg.onerror = () => {
          reject(new Error('Failed to load image from URL'))
        }
        testImg.src = proxiedUrl
      })
    } catch (error) {
      console.error('Error loading image from URL:', error)
      setUrlError(error instanceof Error ? error.message : 'Failed to load image from URL. Please check the URL and try again.')
    } finally {
      setIsLoadingUrl(false)
    }
  }

  const handleImportMap = () => {
    if (!previewImageUrl) return
    
    // Save seed/dimension to localStorage via useSeedInfo (already saved, but ensure it's current)
    // The seedInfo hook already auto-saves, so this is just ensuring consistency
    
    // Check if there's existing data that would be lost
    const hasExistingData = regions.regions.length > 0 || 
                           mapState.mapState.image || 
                           mapState.mapState.originSelected
    
    if (hasExistingData) {
      onShowImportConfirmation((deleteRegions: boolean) => performImport(deleteRegions))
    } else {
      // No existing data, proceed directly
      performImport(false)
    }
  }

  const performImport = (deleteRegions: boolean) => {
    if (!previewImageUrl) return
    
    // Clear regions if user chose to delete them
    if (deleteRegions) {
      regions.replaceRegions([])
      regions.setSelectedRegionId(null)
    }
    
    // Save world details to localStorage only when importing
    worldName.updateWorldName(importWorldName.trim() || 'world')
    seedInfo.updateSeedInfo({ 
      seed: importSeed.trim() || undefined,
      dimension: importDimension || undefined 
    })
    
    loadImageToCanvas(previewImageUrl)
    setPreviewImageUrl(null)
    setPreviewImageDimensions(null)
    setImageUrl('') // Clear URL input
    setShowLoadSection(false) // Hide load section after import
  }

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all saved data? This will remove the loaded image and all regions.')) {
      clearSavedData()
      setLoadedMapDetails(null)
      window.location.reload()
    }
  }

  // Render load section content (reusable component logic)
  const renderLoadSection = () => (
    <>
      {/* World Details Section */}
      <div className="border-b border-gunmetal pb-4">
        <h4 className="text-md font-medium text-gray-300 mb-3">World Details</h4>
        
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-300 mb-1">World Name:</label>
          <input
            type="text"
            value={importWorldName}
            onChange={(e) => setImportWorldName(e.target.value)}
            placeholder="Enter world name"
            className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-md focus:outline-none focus:border-lapis-lighter text-sm text-input-text placeholder:text-gray-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-300 mb-1">Minecraft Seed:</label>
          <input
            type="text"
            value={importSeed}
            onChange={(e) => {
              setImportSeed(e.target.value)
              if (seedError) setSeedError(null)
            }}
            placeholder="Enter seed number or text"
            className={`w-full px-3 py-2 bg-input-bg border rounded-md focus:outline-none focus:border-lapis-lighter text-sm text-input-text placeholder:text-gray-500 ${seedError ? 'border-red-500' : 'border-input-border'} disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50`}
            disabled={isLoading}
          />
          {seedError && (
            <p className="mt-1 text-sm text-red-400">{seedError}</p>
          )}
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-300 mb-1">Dimension:</label>
          <select
            value={importDimension}
            onChange={(e) => setImportDimension(e.target.value as 'overworld' | 'nether' | 'end')}
            className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-md focus:outline-none focus:border-lapis-lighter text-sm text-input-text placeholder:text-gray-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          >
            <option value="overworld">Overworld</option>
            <option value="nether">Nether</option>
            <option value="end" disabled>End (Coming soon)</option>
          </select>
        </div>
      </div>

      {/* Map Image Section */}
      <div className="border-b border-gunmetal pb-4">
        <h4 className="text-md font-medium text-gray-300 mb-3">Map Image</h4>
        
        {/* Generate from Seed */}
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-400 mb-2">Generate from Seed</h5>
          
          {(importDimension === 'overworld' || importDimension === 'nether') && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {importDimension === 'nether' ? 'Nether ' : ''}World Size: {worldSize}k ({worldSize * 125}x{worldSize * 125})
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="2"
                  max="16"
                  step="1"
                  value={worldSize}
                  onChange={(e) => setWorldSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                />
                <div className="relative -mt-1" style={{ marginLeft: '0.375rem', marginRight: '0.375rem' }}>
                  <div className="relative text-xs text-gray-400" style={{ height: '1rem' }}>
                    <span className="absolute left-0">2k</span>
                    <span className="absolute" style={{ left: '14.29%', transform: 'translateX(-50%)' }}>4k</span>
                    <span className="absolute" style={{ left: '28.57%', transform: 'translateX(-50%)' }}>6k</span>
                    <span className="absolute" style={{ left: '42.86%', transform: 'translateX(-50%)' }}>8k</span>
                    <span className="absolute" style={{ left: '57.14%', transform: 'translateX(-50%)' }}>10k</span>
                    <span className="absolute" style={{ left: '71.43%', transform: 'translateX(-50%)' }}>12k</span>
                    <span className="absolute" style={{ left: '85.71%', transform: 'translateX(-50%)' }}>14k</span>
                    <span className="absolute right-0">16k</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-3 p-2 bg-red-900 border border-red-700 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          <Button
            variant="secondary"
            onClick={handleGetMap}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isPolling ? 'Generating Map Image...' : 'Starting Generation...'}
              </div>
            ) : (
              'Generate Map Image'
            )}
          </Button>
        </div>

        {/* Divider */}
        <div className="my-4 relative flex items-center">
          <div className="flex-1 border-t border-gunmetal"></div>
          <span className="px-3 text-sm text-gray-400">or</span>
          <div className="flex-1 border-t border-gunmetal"></div>
        </div>

        {/* Load from URL */}
        <div>
          <h5 className="text-sm font-medium text-gray-400 mb-2">Load from URL</h5>
          <form onSubmit={handleLoadFromUrl} className="space-y-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value)
                if (urlError) setUrlError(null)
              }}
              placeholder="https://example.com/image.png"
              className="w-full bg-input-bg text-input-text px-3 py-2 rounded border border-input-border focus:border-lapis-lighter focus:outline-none text-sm placeholder:text-gray-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading || isLoadingUrl}
            />
            <p className="text-xs text-gray-500">
              Image must be square and between 250x250 and 2000x2000 pixels. World size is calculated as image size ÷ 125 (e.g., 1000x1000 = 8k world).
            </p>
            {urlError && (
              <div className="p-2 bg-red-900 border border-red-700 rounded text-red-300 text-sm">
                {urlError}
              </div>
            )}
            <Button
              variant="secondary"
              type="submit"
              className="w-full"
              disabled={isLoading || isLoadingUrl}
            >
              {isLoadingUrl ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </div>
              ) : (
                'Load'
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Unified Preview - only show when no map is loaded or when previewing */}
      {previewImageUrl && !hasMapLoaded && (
        <div className="border-b border-gunmetal pb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Map Image Preview</h3>
          {previewImageDimensions && (
            <p className="text-sm text-gray-300 mb-3">
              {calculateWorldSize(previewImageDimensions.width, previewImageDimensions.height)}k ({previewImageDimensions.width}x{previewImageDimensions.height})
            </p>
          )}
          <div className="bg-gray-700 rounded p-2 mb-2">
            <img 
              src={previewImageUrl} 
              alt="Map preview"
              className="w-full h-auto border border-gunmetal rounded"
            />
          </div>
          <Button
            variant="primary"
            onClick={handleImportMap}
            className="w-full"
          >
            Import Map
          </Button>
        </div>
      )}
    </>
  )

  return (
    <div className="space-y-4">
      {hasMapLoaded ? (
        // When map is loaded, show either World Details or Import Map Image section
        showLoadSection ? (
          // Import Map Image Section
          <>
            {/* Cancel button */}
            <Button
              variant="ghost"
              onClick={() => {
                setShowLoadSection(false)
                setPreviewImageUrl(null)
                setPreviewImageDimensions(null)
                setImageUrl('')
                setError(null)
                setUrlError(null)
                setSeedError(null)
                // Reset local state to context values when canceling
                setImportWorldName(worldName.worldName)
                setImportSeed(seedInfo.seedInfo.seed || '')
                setImportDimension(seedInfo.seedInfo.dimension || 'overworld')
              }}
              leftIcon={<ArrowLeft size={16} />}
              className="w-full"
            >
              Cancel
            </Button>
            
            <h3 className="text-lg font-semibold text-white">Import Map Image</h3>
            
            {renderLoadSection()}
            
            {/* Preview when changing map */}
            {previewImageUrl && (
              <div className="border-b border-gunmetal pb-4 mt-4">
                <h3 className="text-lg font-semibold text-white mb-2">Map Image Preview</h3>
                {previewImageDimensions && (
                  <p className="text-sm text-gray-300 mb-3">
                    {calculateWorldSize(previewImageDimensions.width, previewImageDimensions.height)}k ({previewImageDimensions.width}x{previewImageDimensions.height})
                  </p>
                )}
                <div className="bg-gray-700 rounded p-2 mb-2">
                  <img 
                    src={previewImageUrl} 
                    alt="Map preview"
                    className="w-full h-auto border border-gunmetal rounded"
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={handleImportMap}
                  className="w-full"
                >
                  Import Map
                </Button>
              </div>
            )}
          </>
        ) : (
          // World Details Section
          <>
            <h3 className="text-lg font-semibold text-white">World Details</h3>
            
            {/* World Name, Seed, Dimension, and World Size */}
            <div className="mb-4 space-y-2">
              <WorldNameHeading />
              <SeedInfoHeading />
              <WorldSizeHeading />
              {/* Image Size - inferred from world size (worldSize * 125) */}
              {loadedMapDetails?.worldSize && (
                <div className="text-sm text-gray-300 px-2 py-1 rounded flex items-center gap-2">
                  <span className="font-medium w-28">Image Size:</span>
                  <span>{loadedMapDetails.worldSize * 125} x {loadedMapDetails.worldSize * 125}</span>
                </div>
              )}
            </div>

            {/* Import new map image button */}
            <Button
              variant="secondary"
              onClick={() => setShowLoadSection(true)}
              className="w-full mb-4"
            >
              Import new map image
            </Button>
          </>
        )
      ) : (
        // Load Map Image State (when no map is loaded)
        <>
          <h3 className="text-lg font-semibold text-white">Import Map Image</h3>
          {renderLoadSection()}
        </>
      )}
    </div>
  )
}
