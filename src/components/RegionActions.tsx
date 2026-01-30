import { useState } from 'react'
import { ChallengeLevel } from '../types'

interface Region {
  id: string
  name: string
  challengeLevel?: ChallengeLevel
  hasSpawn?: boolean
}

interface RegionActionsProps {
  regions: Region[]
  onRandomizeChallengeLevels: () => void
}

export function RegionActions({ regions, onRandomizeChallengeLevels }: RegionActionsProps) {
  const [showChallengeCounts, setShowChallengeCounts] = useState(false)

  const getChallengeLevelCounts = () => {
    const counts: Record<string, number> = {
      easy: 0,
      normal: 0,
      hard: 0,
      severe: 0,
      deadly: 0
    }
    
    regions.forEach(region => {
      const key = region.challengeLevel || 'easy'
      if (key in counts) {
        counts[key]++
      }
    })
    
    return counts
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
              const counts = getChallengeLevelCounts()
              // Display in the correct order: Easy, Normal, Hard, Severe, Deadly
              const orderedLevels: Array<{key: string, displayName: string}> = [
                { key: 'easy', displayName: 'Easy' },
                { key: 'normal', displayName: 'Normal' },
                { key: 'hard', displayName: 'Hard' },
                { key: 'severe', displayName: 'Severe' },
                { key: 'deadly', displayName: 'Deadly' }
              ]
              return (
                <div className="space-y-1">
                  {orderedLevels.map(({ key, displayName }) => (
                    <div key={key} className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">{displayName}:</span>
                      <span className="text-white font-medium">{counts[key] ?? 0}</span>
                    </div>
                  ))}
                  <div className="border-t border-gunmetal pt-1 mt-2">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-gray-300">Total:</span>
                      <span className="text-white">{regions.length}</span>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
