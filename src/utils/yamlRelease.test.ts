import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Region } from '../types'
import { useRegionForgeYamlGeneration } from '../hooks/useRegionForgeYamlGeneration'
import {
  buildRegionsYamlBody,
  exportRegionsYAML,
  REGION_FORGE_APP_VERSION,
} from './exportUtils'
import { clearSavedData, YAML_RELEASES_STORAGE_KEY } from './persistenceUtils'
import {
  buildRegionForgeYamlPreamble,
  currentProjectReleaseSnapshot,
  detectReleaseImportConflict,
  publishRegionsYaml,
  readReleaseState,
  releaseStateFromProjectFile,
  sha256Hex,
  writeReleaseState,
  type RegionsYamlPreambleStats,
  type YamlRelease,
} from './yamlRelease'

const stats: RegionsYamlPreambleStats = {
  regionCount: 1,
  villageCount: 0,
  structureCount: 0,
  heartCount: 0,
  nerveCount: 0,
  spawn: false,
}

const region = (overrides: Partial<Region> = {}): Region => ({
  id: 'r1',
  name: 'Dradacliff',
  points: [
    { x: 0, z: 0 },
    { x: 10, z: 0 },
    { x: 10, z: 10 },
  ],
  ...overrides,
})

function bodyFor(regions: Region[], includeVillages = false): string {
  return buildRegionsYamlBody(
    regions,
    includeVillages,
    false,
    false,
    false,
    false,
    null,
    'overworld',
    true,
    false,
    'large',
    false
  )
}

function verifiedRelease(generation: number, checksum: string | null, verified = true): YamlRelease {
  return {
    generation,
    createdAt: '2026-01-01T00:00:00.000Z',
    description: '',
    dimension: 'overworld',
    checksum,
    verified,
  }
}

async function publishBody(
  body: string,
  description: string | null,
  prompt: () => string | null = () => description
) {
  return publishRegionsYaml({
    body,
    worldName: 'Charidh',
    dimension: 'overworld',
    stats,
    appVersion: REGION_FORGE_APP_VERSION,
    promptDescription: prompt,
  })
}

let releaseWrites = 0

function installStorage(transform?: (key: string, value: string) => string): void {
  const items = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => (items.has(key) ? items.get(key)! : null),
    setItem: (key: string, value: string) => {
      const stored = transform ? transform(key, value) : value
      if (key === YAML_RELEASES_STORAGE_KEY) releaseWrites += 1
      items.set(key, stored)
    },
    removeItem: (key: string) => {
      items.delete(key)
    },
    clear: () => {
      items.clear()
    },
    key: (index: number) => [...items.keys()][index] ?? null,
    get length() {
      return items.size
    },
  })
}

beforeEach(() => {
  releaseWrites = 0
  installStorage()
  if (typeof URL.createObjectURL !== 'function') {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: () => 'blob:mock' })
  }
  if (typeof URL.revokeObjectURL !== 'function') {
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: () => {} })
  }
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('yaml release history', () => {
  it('restores an unverified legacy baseline and does not reuse that generation', async () => {
    const imported = releaseStateFromProjectFile({
      regionForgeYamlGeneration: 27,
      exportDate: '2026-01-02T00:00:00.000Z',
      dimension: 'overworld',
    }, () => 'legacy-project')
    expect(imported.releases).toEqual([{
      generation: 27,
      createdAt: '2026-01-02T00:00:00.000Z',
      description: '',
      dimension: 'overworld',
      checksum: null,
      verified: false,
    }])

    writeReleaseState(imported)
    const result = await publishBody('regions:\n  same:\n', 'after legacy')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.generation).toBe(28)

    const stored = readReleaseState()
    expect(stored?.releases[0]).toMatchObject({ generation: 27, checksum: null, verified: false })
    expect(stored?.releases[1].generation).toBe(28)
    expect(stored?.releases[1].checksum).not.toBeNull()
  })

  it('downloads an unchanged body as the same file without writing again', async () => {
    const prompt = vi.fn(() => 'line\nbreak')
    const body = 'regions:\n  keep:\n'
    const first = await publishBody(body, null, prompt)
    const writesAfterFirst = releaseWrites
    const second = await publishBody(body, null, prompt)

    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    if (!first.ok || !second.ok) return
    expect(second.yaml).toBe(first.yaml)
    expect(releaseWrites).toBe(writesAfterFirst)
    expect(writesAfterFirst).toBe(1)
    expect(prompt).toHaveBeenCalledTimes(2)
    expect(first.yaml).toContain('# Description: line break')
    expect(first.yaml).toContain(`build-id=${first.release.checksum}`)
    expect(readReleaseState()?.releases).toHaveLength(1)
    expect(currentProjectReleaseSnapshot().yamlReleases).toEqual(readReleaseState()?.releases)
  })

  it('edits or clears the description of the current release without a new generation', async () => {
    const answers = ['kept', 'rewritten', '']
    let index = 0
    const body = 'regions:\n  keep:\n'
    const first = await publishBody(body, null, () => answers[index++])
    const edited = await publishBody(body, null, () => answers[index++])
    const cleared = await publishBody(body, null, () => answers[index++])

    expect(first.ok && edited.ok && cleared.ok).toBe(true)
    if (!first.ok || !edited.ok || !cleared.ok) return
    expect(edited.generation).toBe(first.generation)
    expect(cleared.generation).toBe(first.generation)
    expect(edited.yaml).toContain('# Description: rewritten')
    expect(edited.yaml).toContain(`# Released: ${first.release.createdAt}`)
    expect(edited.yaml).toContain(`build-id=${first.release.checksum}`)
    expect(cleared.yaml).toContain('# Description: \n')
    expect(cleared.yaml).toContain(`build-id=${first.release.checksum}`)
    expect(readReleaseState()?.releases).toEqual([
      expect.objectContaining({
        generation: 1,
        description: '',
        createdAt: first.release.createdAt,
        checksum: first.release.checksum,
      }),
    ])
  })

  it('warns before replacing another project and leaves history alone when cancelled', async () => {
    const localRelease = verifiedRelease(4, 'a'.repeat(64))
    writeReleaseState({ projectId: 'local-id', releases: [localRelease] })
    const incoming = releaseStateFromProjectFile({
      projectId: 'other-id',
      yamlReleases: [verifiedRelease(1, 'b'.repeat(64))],
    }, () => {
      throw new Error('should keep the file id')
    })

    expect(detectReleaseImportConflict(readReleaseState(), incoming)?.differentProject).toBe(true)

    const { result } = renderHook(() => useRegionForgeYamlGeneration())
    await waitFor(() => expect(result.current.projectId).toBe('local-id'))

    localStorage.setItem('mc-region-maker-world-name', 'Renamed World')
    expect(readReleaseState()?.projectId).toBe('local-id')
    expect(readReleaseState()?.releases).toEqual([localRelease])

    act(() => {
      result.current.replaceReleaseState(incoming)
    })
    expect(readReleaseState()).toEqual(incoming)
    expect(result.current.projectId).toBe('other-id')
  })

  it('warns when the same generation has a different checksum and replaces only after confirm', () => {
    const local = {
      projectId: 'same-project',
      releases: [verifiedRelease(3, 'a'.repeat(64))],
    }
    writeReleaseState(local)
    const incoming = releaseStateFromProjectFile({
      projectId: 'same-project',
      regionForgeYamlGeneration: 99,
      yamlReleases: [verifiedRelease(3, 'b'.repeat(64))],
    }, () => 'unused')

    expect(detectReleaseImportConflict(readReleaseState(), incoming)?.checksumMismatch).toBe(true)
    expect(readReleaseState()?.releases[0].checksum).toBe('a'.repeat(64))

    writeReleaseState(incoming)
    expect(readReleaseState()?.releases).toEqual([verifiedRelease(3, 'b'.repeat(64))])
    expect(readReleaseState()?.releases.some((release) => release.generation === 99)).toBe(false)
  })

  it('does not download or advance when saving the release throws', async () => {
    installStorage(() => {
      throw new Error('quota')
    })
    const createObjectURL = vi.spyOn(URL, 'createObjectURL')
    let memory = 4
    const result = await exportRegionsYAML(
      [region()],
      () => {},
      false,
      false,
      false,
      false,
      false,
      null,
      'overworld',
      'Charidh',
      true,
      false,
      'large',
      false,
      { promptDescription: () => 'note' }
    )
    if (result.status === 'downloaded') memory = result.generation

    expect(result.status).toBe('storage')
    expect(memory).toBe(4)
    expect(createObjectURL).not.toHaveBeenCalled()
    expect(readReleaseState()).toBeNull()
  })

  it('allocates from the persisted maximum when memory is behind', async () => {
    writeReleaseState({
      projectId: 'project',
      releases: [verifiedRelease(30, 'c'.repeat(64))],
    })
    let memory = 27
    const result = await publishBody('regions:\n  changed:\n', 'newer')
    if (result.ok) memory = result.generation
    expect(memory).toBe(31)
  })

  it('hashes the regions body as stored and ignores preamble fields', async () => {
    const forward = bodyFor([region({
      points: [
        { x: 1, z: 0 },
        { x: 2, z: 0 },
        { x: 2, z: 2 },
      ],
    })])
    const moved = bodyFor([region({
      points: [
        { x: 8, z: 0 },
        { x: 2, z: 0 },
        { x: 2, z: 2 },
      ],
    })])
    const reversedPoints = bodyFor([region({
      points: [
        { x: 2, z: 2 },
        { x: 2, z: 0 },
        { x: 1, z: 0 },
      ],
    })])
    const bramble = region({ id: 'r2', name: 'Bramble', points: [{ x: 3, z: 3 }, { x: 4, z: 3 }, { x: 4, z: 4 }] })
    const cliff = region()
    const originalOrder = bodyFor([cliff, bramble])
    const swappedOrder = bodyFor([bramble, cliff])
    const withVillage = bodyFor([region({
      subregions: [{ id: 'v1', name: 'Acornbrook', x: 1, z: 2, radius: 4, type: 'village' }],
    })], true)
    const withoutVillage = bodyFor([region({
      subregions: [{ id: 'v1', name: 'Acornbrook', x: 1, z: 2, radius: 4, type: 'village' }],
    })], false)

    expect(await sha256Hex(forward)).not.toBe(await sha256Hex(moved))
    expect(await sha256Hex(forward)).not.toBe(await sha256Hex(reversedPoints))
    expect(forward.indexOf('x: 1')).toBeLessThan(forward.indexOf('x: 2'))
    expect(await sha256Hex(originalOrder)).not.toBe(await sha256Hex(swappedOrder))
    expect(await sha256Hex(withVillage)).not.toBe(await sha256Hex(withoutVillage))

    const hash = await sha256Hex(forward)
    const published = await publishBody(forward, 'boundaries')
    expect(published.ok).toBe(true)
    if (!published.ok) return
    expect(published.release.checksum).toBe(hash)
    expect(published.yaml).toContain(`checksum=${hash}`)
    expect(published.yaml).toContain(`build-id=${hash}`)
    expect(published.yaml.slice(published.yaml.indexOf('regions:'))).toBe(forward)
    expect(await sha256Hex(published.yaml)).not.toBe(hash)

    const otherPreamble = buildRegionForgeYamlPreamble({
      generation: published.generation + 9,
      createdAt: '1999-01-01T00:00:00.000Z',
      description: 'a different note',
      worldName: 'Somewhere Else',
      projectId: 'other',
      dimension: 'nether',
      checksum: hash,
      appVersion: REGION_FORGE_APP_VERSION,
      stats,
    })
    expect(otherPreamble).not.toBe(published.yaml.slice(0, published.yaml.indexOf('regions:')))
    expect(await sha256Hex(forward)).toBe(hash)
  })

  it('does not download when the stored checksum disagrees with the one just written', async () => {
    installStorage((key, value) => {
      if (key !== YAML_RELEASES_STORAGE_KEY) return value
      const parsed = JSON.parse(value)
      parsed.releases[parsed.releases.length - 1].checksum = 'd'.repeat(64)
      return JSON.stringify(parsed)
    })
    const createObjectURL = vi.spyOn(URL, 'createObjectURL')
    const result = await exportRegionsYAML(
      [region()],
      () => {},
      false,
      false,
      false,
      false,
      false,
      null,
      'overworld',
      'Charidh',
      true,
      false,
      'large',
      false,
      { promptDescription: () => 'note' }
    )

    expect(result.status).toBe('conflict')
    expect(createObjectURL).not.toHaveBeenCalled()
    expect(readReleaseState()?.releases[0].checksum).toBe('d'.repeat(64))
  })

  it('keeps the app version fixed while the generation increases', async () => {
    const first = await publishBody('regions:\n  one:\n', 'first')
    const second = await publishBody('regions:\n  two:\n', 'second')
    expect(first.ok && second.ok).toBe(true)
    if (!first.ok || !second.ok) return
    expect(REGION_FORGE_APP_VERSION).toBe('1.0.0')
    expect(first.yaml).toContain('app-version=1.0.0')
    expect(second.yaml).toContain('app-version=1.0.0')
    expect(first.yaml).toContain('# Generation: 1')
    expect(second.yaml).toContain('# Generation: 2')
    expect(first.yaml).toContain('generator-version=001')
    expect(second.yaml).toContain('generator-version=002')
    expect(first.generation).not.toBe(second.generation)
  })

  it('drops release history when saved data is cleared', () => {
    writeReleaseState({ projectId: 'local-id', releases: [verifiedRelease(2, 'e'.repeat(64))] })
    clearSavedData()
    expect(readReleaseState()).toBeNull()
  })

  it('does not write or download when the description prompt is cancelled', async () => {
    const result = await publishBody('regions:\n  nope:\n', null)
    expect(result).toEqual({ ok: false, reason: 'cancelled' })
    expect(releaseWrites).toBe(0)
    expect(readReleaseState()).toBeNull()
  })
})
