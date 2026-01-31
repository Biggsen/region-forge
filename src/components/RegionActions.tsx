import { useState } from 'react'
import { ChallengeLevel } from '../types'
import { calculatePolygonArea } from '../utils/polygonUtils'

interface Region {
  id: string
  name: string
  points: { x: number; z: number }[]
  challengeLevel?: ChallengeLevel
  hasSpawn?: boolean
  disabled?: boolean
}

interface RegionActionsProps {
  regions: Region[]
  onRandomizeChallengeLevels: () => void
}

export function RegionActions({ regions, onRandomizeChallengeLevels }: RegionActionsProps) {
  const [showChallengeCounts, setShowChallengeCounts] = useState(false)

  const getChallengeLevelStats = () => {
    const stats: Record<string, { count: number; area: number }> = {
      easy: { count: 0, area: 0 },
      normal: { count: 0, area: 0 },
      hard: { count: 0, area: 0 },
      severe: { count: 0, area: 0 },
      deadly: { count: 0, area: 0 }
    }
    
    // Only count enabled regions
    regions.filter(r => !r.disabled).forEach(region => {
      const key = region.challengeLevel || 'easy'
      if (key in stats) {
        stats[key].count++
        stats[key].area += calculatePolygonArea(region.points)
      }
    })
    
    return stats
  }

  return (
    <div className="mb-4">
      <button
        onClick={onRandomizeChallengeLevels}
        className="text-viridian/80 hover:text-viridian text-sm px-3 py-2 rounded border border-viridian/80 hover:border-viridian hover:bg-viridian/20 transition-colors"
        title="Randomize challenge levels with balanced distribution (2 deadly, 4 severe, 6 hard, 8 normal, rest easy)"
        disabled={regions.length === 0}
      >
        🎲 Randomize Challenge Levels
      </button>
      
      {/* Challenge Level Counts */}
      <div className="mt-3">
        <span
          onClick={() => setShowChallengeCounts(!showChallengeCounts)}
          className="text-white text-xs cursor-pointer hover:text-gray-300 transition-colors"
          title="Show/hide challenge level counts"
        >
          {showChallengeCounts ? '▼' : '▶'} Show Counts
        </span>
        
        {showChallengeCounts && (
          <div className="mt-2 p-3 bg-eerie-back rounded border border-gunmetal">
            <h5 className="text-sm font-medium text-gray-300 mb-2">Challenge Level Distribution</h5>
            {(() => {
              const stats = getChallengeLevelStats()
              const total = regions.filter(r => !r.disabled).length
              const totalArea = Object.values(stats).reduce((sum, s) => sum + s.area, 0)
              const getPercentage = (count: number) => total > 0 ? Math.round((count / total) * 100) : 0
              const getAreaPercentage = (area: number) => totalArea > 0 ? Math.round((area / totalArea) * 100) : 0
              const toHectares = (area: number) => Math.round(area / 10000)
              // Display in the correct order: Easy, Normal, Hard, Severe, Deadly
              const orderedLevels: Array<{key: string, displayName: string}> = [
                { key: 'easy', displayName: 'Easy' },
                { key: 'normal', displayName: 'Normal' },
                { key: 'hard', displayName: 'Hard' },
                { key: 'severe', displayName: 'Severe' },
                { key: 'deadly', displayName: 'Deadly' }
              ]
              return (
                <div className="text-sm grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-x-2 text-right">
                  {/* Header row */}
                  <div className="text-left text-gray-500 text-xs pb-1"></div>
                  <div className="text-gray-500 text-xs pb-1">#</div>
                  <div className="text-gray-500 text-xs pb-1">%</div>
                  <div className="text-gray-500 text-xs pb-1">ha</div>
                  <div className="text-gray-500 text-xs pb-1">%</div>
                  
                  {orderedLevels.map(({ key, displayName }) => {
                    const { count, area } = stats[key]
                    const pct = getPercentage(count)
                    const hectares = toHectares(area)
                    const areaPct = getAreaPercentage(area)
                    return (
                      <>
                        <div key={`${key}-name`} className="text-left text-gray-300">{displayName}</div>
                        <div key={`${key}-count`} className="text-white font-medium">{count}</div>
                        <div key={`${key}-pct`} className="text-gray-500">{pct}%</div>
                        <div key={`${key}-ha`} className="text-gray-500">{hectares.toLocaleString()}</div>
                        <div key={`${key}-areapct`} className="text-gray-500">{areaPct}%</div>
                      </>
                    )
                  })}
                  
                  {/* Totals row with top border spanning all columns */}
                  <div className="col-span-5 border-t border-gunmetal mt-1 pt-1"></div>
                  <div className="text-left text-gray-300 font-medium">Total</div>
                  <div className="text-white font-medium">{total}</div>
                  <div></div>
                  <div className="text-gray-500 font-medium">{toHectares(totalArea).toLocaleString()}</div>
                  <div></div>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
