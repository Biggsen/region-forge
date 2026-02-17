import { useState, useCallback } from 'react'

export function useBiomeLabelVisibility() {
  const [hiddenBiomes, setHiddenBiomes] = useState<Set<string>>(new Set())

  const toggleBiomeLabel = useCallback((biome: string) => {
    setHiddenBiomes(prev => {
      const next = new Set(prev)
      if (next.has(biome)) {
        next.delete(biome)
      } else {
        next.add(biome)
      }
      return next
    })
  }, [])

  const isBiomeLabelHidden = useCallback(
    (biome: string) => hiddenBiomes.has(biome),
    [hiddenBiomes]
  )

  return { hiddenBiomes, toggleBiomeLabel, isBiomeLabelHidden }
}
