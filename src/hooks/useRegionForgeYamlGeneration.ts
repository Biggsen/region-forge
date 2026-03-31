import { useState, useCallback } from 'react'

export function useRegionForgeYamlGeneration() {
  const [regionForgeYamlGeneration, setRegionForgeYamlGeneration] = useState(0)

  const setRegionForgeYamlGenerationFromImport = useCallback((value: number) => {
    setRegionForgeYamlGeneration(Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0)
  }, [])

  const bumpRegionForgeYamlGeneration = useCallback((): number => {
    let next = 0
    setRegionForgeYamlGeneration((g) => {
      next = g + 1
      return next
    })
    return next
  }, [])

  return {
    regionForgeYamlGeneration,
    setRegionForgeYamlGenerationFromImport,
    bumpRegionForgeYamlGeneration,
  }
}
