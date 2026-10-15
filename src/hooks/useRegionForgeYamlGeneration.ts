import { useCallback, useEffect, useState } from 'react'
import { ensureYamlReleaseState, maxYamlGeneration, readReleaseState, writeReleaseState, type YamlRelease, type YamlReleaseState } from '../utils/yamlRelease'

function currentReleaseDescription(releases: YamlRelease[]): string {
  const generation = maxYamlGeneration(releases)
  if (generation < 1) return ''
  for (let index = releases.length - 1; index >= 0; index -= 1) {
    if (releases[index].generation === generation) return releases[index].description
  }
  return ''
}

export function useRegionForgeYamlGeneration() {
  const [regionForgeYamlGeneration, setRegionForgeYamlGeneration] = useState(0)
  const [regionForgeYamlDescription, setRegionForgeYamlDescription] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)

  const applyState = useCallback((state: YamlReleaseState) => {
    setProjectId(state.projectId)
    setRegionForgeYamlGeneration(maxYamlGeneration(state.releases))
    setRegionForgeYamlDescription(currentReleaseDescription(state.releases))
  }, [])

  useEffect(() => {
    try {
      applyState(ensureYamlReleaseState())
    } catch (error) {
      console.warn('Failed to prepare release history:', error)
    }
  }, [applyState])

  const syncFromStorage = useCallback(() => {
    const state = readReleaseState()
    if (!state) {
      setProjectId(null)
      setRegionForgeYamlGeneration(0)
      setRegionForgeYamlDescription('')
      return
    }
    applyState(state)
  }, [applyState])

  const replaceReleaseState = useCallback((state: YamlReleaseState) => {
    writeReleaseState(state)
    applyState(state)
  }, [applyState])

  return {
    regionForgeYamlGeneration,
    regionForgeYamlDescription,
    projectId,
    syncFromStorage,
    replaceReleaseState,
  }
}
