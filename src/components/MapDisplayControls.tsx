import { useState, useRef, useEffect } from 'react'
import { ChevronRight, ChevronUp, Eye, EyeOff } from 'lucide-react'
import { useAdvancedFeatures } from '../hooks/useAdvancedFeatures'

interface MapDisplayControlsProps {
  highlightMode: {
    highlightAll: boolean
    showRegions: boolean
    showVillages: boolean
    showCenterPoints: boolean
    showChallengeLevels: boolean
    showGrid: boolean
    showNames: boolean
  }
  orphanedVillageMarkers: any[]
  showOrphanedVillages: boolean
  dimension?: 'overworld' | 'nether' | 'end'
  toggleHighlightAll: () => void
  toggleShowRegions: () => void
  toggleShowVillages: () => void
  toggleShowOrphanedVillages: () => void
  toggleShowCenterPoints: () => void
  toggleShowChallengeLevels: () => void
  toggleShowGrid: () => void
  toggleShowNames: () => void
}

export function MapDisplayControls({
  highlightMode,
  orphanedVillageMarkers,
  showOrphanedVillages,
  dimension,
  toggleHighlightAll,
  toggleShowRegions,
  toggleShowVillages,
  toggleShowOrphanedVillages,
  toggleShowCenterPoints,
  toggleShowChallengeLevels,
  toggleShowGrid,
  toggleShowNames
}: MapDisplayControlsProps) {
  const showVillagesOption = dimension !== 'nether'
  const [isExpanded, setIsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isExpanded) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isExpanded])
  
  const showAdvanced = useAdvancedFeatures()

  const ToggleButton = ({ 
    isActive, 
    onClick, 
    title, 
    children 
  }: { 
    isActive: boolean
    onClick: () => void
    title: string
    children: React.ReactNode
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-1.5 py-0.5 rounded text-xs transition-colors ${
        isActive 
          ? 'text-white' 
          : 'text-gray-400 hover:text-white'
      }`}
      title={title}
    >
      {isActive ? <Eye size={12} /> : <EyeOff size={12} />}
      {children}
    </button>
  )

  return (
    <div ref={containerRef}>
      {isExpanded && (
        <div className="mb-2 bg-gray-900/90 backdrop-blur-sm border border-gunmetal rounded-lg px-1.5 py-1.5 space-y-1 w-[100px]">
          <ToggleButton
            isActive={highlightMode.highlightAll}
            onClick={toggleHighlightAll}
            title="Highlight all regions"
          >
            Highlight
          </ToggleButton>
          
          <ToggleButton
            isActive={highlightMode.showRegions}
            onClick={toggleShowRegions}
            title="Show/hide regions on map"
          >
            Regions
          </ToggleButton>
          
          <ToggleButton
            isActive={highlightMode.showNames}
            onClick={toggleShowNames}
            title="Show/hide region and village names on map"
          >
            Names
          </ToggleButton>
          
          {showAdvanced && showVillagesOption && (
            <ToggleButton
              isActive={highlightMode.showVillages}
              onClick={toggleShowVillages}
              title="Show/hide villages on map"
            >
              Villages
            </ToggleButton>
          )}
          
          {showVillagesOption && orphanedVillageMarkers.length > 0 && (
            <ToggleButton
              isActive={showOrphanedVillages}
              onClick={toggleShowOrphanedVillages}
              title="Show/hide orphaned village markers"
            >
              Orphaned ({orphanedVillageMarkers.length})
            </ToggleButton>
          )}
          
          {showAdvanced && (
            <ToggleButton
              isActive={highlightMode.showCenterPoints}
              onClick={toggleShowCenterPoints}
              title="Show/hide region hearts and nerves on map"
            >
              Hearts / Nerves
            </ToggleButton>
          )}
          
          {showAdvanced && (
            <ToggleButton
              isActive={highlightMode.showChallengeLevels}
              onClick={toggleShowChallengeLevels}
              title="Show/hide challenge levels on map"
            >
              Levels
            </ToggleButton>
          )}
          
          <ToggleButton
            isActive={highlightMode.showGrid}
            onClick={toggleShowGrid}
            title="Show/hide grid overlay on map"
          >
            Grid
          </ToggleButton>
        </div>
      )}
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-300 hover:text-white transition-colors bg-gray-900/90 backdrop-blur-sm border border-gunmetal rounded-lg w-[100px]"
      >
        {isExpanded ? <ChevronUp size={14} /> : <ChevronRight size={14} />}
        Display
      </button>
    </div>
  )
}