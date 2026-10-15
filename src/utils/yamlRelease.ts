import { getValidDimension, type Dimension } from './dimensionUtils'
import { loadYamlReleaseState, saveYamlReleaseState } from './persistenceUtils'

export type YamlDimension = Dimension

export interface YamlRelease {
  generation: number
  createdAt: string
  description: string
  dimension: YamlDimension
  /** SHA-256 hex of the regions: body. Null only for an unverified legacy baseline. */
  checksum: string | null
  /** False only for a legacy baseline synthesized from regionForgeYamlGeneration. */
  verified: boolean
}

export interface YamlReleaseState {
  projectId: string
  releases: YamlRelease[]
}

export interface RegionsYamlPreambleStats {
  regionCount: number
  villageCount: number
  structureCount: number
  heartCount: number
  nerveCount: number
  spawn: boolean
}

export type ReleaseDescriptionContext = {
  existing: boolean
  generation: number
  /** Highest release already saved. Zero when this will be the first release. */
  previousGeneration: number
  description: string
}

export type PublishRegionsYamlResult =
  | { ok: true; yaml: string; generation: number; reused: boolean; release: YamlRelease }
  | { ok: false; reason: 'cancelled' | 'storage' | 'conflict' }

export interface ReleaseImportConflict {
  differentProject: boolean
  olderGeneration: boolean
  localMaxGeneration: number
  incomingMaxGeneration: number
  checksumMismatch: boolean
}

export interface ProjectReleaseFile {
  projectId?: string
  yamlReleases?: unknown
  regionForgeYamlGeneration?: number
  exportDate?: string
  dimension?: string
}

function sanitizeRegionForgeField(value: string): string {
  return value.replace(/[\n\r;]/g, ' ').trim()
}

function parseYamlRelease(raw: unknown): YamlRelease | null {
  if (!raw || typeof raw !== 'object') return null
  const entry = raw as Partial<YamlRelease>
  if (typeof entry.generation !== 'number' || !Number.isInteger(entry.generation) || entry.generation < 1) return null
  if (entry.dimension !== 'overworld' && entry.dimension !== 'nether' && entry.dimension !== 'end') return null
  const checksum = entry.checksum === null ? null : typeof entry.checksum === 'string' ? entry.checksum : null
  if (entry.checksum !== null && typeof entry.checksum !== 'string') return null
  const verified = typeof entry.verified === 'boolean' ? entry.verified : checksum !== null
  return {
    generation: entry.generation,
    createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : '',
    description: typeof entry.description === 'string' ? entry.description : '',
    dimension: entry.dimension,
    checksum,
    verified,
  }
}

export function readReleaseState(): YamlReleaseState | null {
  const stored = loadYamlReleaseState()
  if (!stored) return null
  return {
    projectId: stored.projectId,
    releases: stored.releases.map(parseYamlRelease).filter((release): release is YamlRelease => release !== null),
  }
}

export function writeReleaseState(state: YamlReleaseState): void {
  saveYamlReleaseState(state)
}

export function maxYamlGeneration(releases: YamlRelease[]): number {
  return releases.reduce((max, release) => Math.max(max, release.generation), 0)
}

export function ensureYamlReleaseState(): YamlReleaseState {
  const existing = readReleaseState()
  if (existing) return existing
  const created: YamlReleaseState = { projectId: crypto.randomUUID(), releases: [] }
  writeReleaseState(created)
  return created
}

export function currentProjectReleaseSnapshot(): {
  projectId: string
  yamlReleases: YamlRelease[]
  regionForgeYamlGeneration: number
} {
  const state = ensureYamlReleaseState()
  return {
    projectId: state.projectId,
    yamlReleases: state.releases,
    regionForgeYamlGeneration: maxYamlGeneration(state.releases),
  }
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function latestVerifiedRelease(releases: YamlRelease[]): YamlRelease | null {
  let latest: YamlRelease | null = null
  for (const release of releases) {
    if (!release.verified || release.checksum == null) continue
    if (!latest || release.generation > latest.generation) latest = release
  }
  return latest
}

export function buildRegionForgeYamlPreamble(input: {
  generation: number
  createdAt: string
  description: string
  worldName: string
  projectId: string
  dimension: YamlDimension
  checksum: string
  appVersion: string
  stats: RegionsYamlPreambleStats
}): string {
  const gen = String(input.generation).padStart(3, '0')
  const project = sanitizeRegionForgeField(input.worldName)
  const projectId = sanitizeRegionForgeField(input.projectId)
  const description = sanitizeRegionForgeField(input.description)
  const identity =
    `# region-forge: generator-version=${gen}; generated-at=${input.createdAt}; app-version=${input.appVersion}; ` +
    `project=${project}; project-id=${projectId}; dimension=${input.dimension}; checksum=${input.checksum}; plugin=worldguard; export-type=regions-yml; build-id=${input.checksum}`
  const counts =
    `# region-forge: regions=${input.stats.regionCount}; villages=${input.stats.villageCount}; structures=${input.stats.structureCount}; ` +
    `hearts=${input.stats.heartCount}; nerves=${input.stats.nerveCount}; spawn=${input.stats.spawn}`
  return [
    `# Generated by Region Forge ${input.appVersion}`,
    `# Project: ${project}`,
    `# Project-Id: ${projectId}`,
    `# Generation: ${input.generation}`,
    `# Released: ${input.createdAt}`,
    `# Description: ${description}`,
    identity,
    counts,
  ].join('\n') + '\n'
}

export async function publishRegionsYaml(input: {
  body: string
  worldName: string
  dimension: YamlDimension
  stats: RegionsYamlPreambleStats
  appVersion: string
  promptDescription: (context: ReleaseDescriptionContext) => string | null | Promise<string | null>
  now?: () => string
}): Promise<PublishRegionsYamlResult> {
  const checksum = await sha256Hex(input.body)
  const initial = readReleaseState()
  const fallbackProjectId = initial?.projectId ?? crypto.randomUUID()
  const state = initial ?? { projectId: fallbackProjectId, releases: [] }
  const latest = latestVerifiedRelease(state.releases)

  if (latest?.checksum === checksum) {
    const rawDescription = await input.promptDescription({
      existing: true,
      generation: latest.generation,
      previousGeneration: maxYamlGeneration(state.releases),
      description: latest.description,
    })
    if (rawDescription == null) return { ok: false, reason: 'cancelled' }
    const description = sanitizeRegionForgeField(String(rawDescription))
    const persisted = readReleaseState() ?? state
    const current = persisted.releases.find(
      (entry) => entry.generation === latest.generation && entry.checksum === checksum && entry.verified
    )
    if (!current) return { ok: false, reason: 'conflict' }

    let release = current
    if (description !== current.description) {
      release = { ...current, description }
      try {
        writeReleaseState({
          projectId: persisted.projectId,
          releases: persisted.releases.map((entry) =>
            entry.generation === current.generation && entry.checksum === current.checksum ? release : entry
          ),
        })
      } catch (error) {
        console.error('Failed to save YAML release history:', error)
        return { ok: false, reason: 'storage' }
      }
      const stored = readReleaseState()
      const storedRelease = stored?.releases.find(
        (entry) => entry.generation === current.generation && entry.checksum === checksum
      )
      if (!stored || storedRelease?.description !== description) {
        return { ok: false, reason: 'conflict' }
      }
      release = storedRelease
    }

    const yaml = buildRegionForgeYamlPreamble({
      generation: release.generation,
      createdAt: release.createdAt,
      description: release.description,
      worldName: input.worldName,
      projectId: persisted.projectId,
      dimension: release.dimension,
      checksum,
      appVersion: input.appVersion,
      stats: input.stats,
    }) + input.body
    return { ok: true, yaml, generation: release.generation, reused: description === latest.description, release }
  }

  const previousGeneration = maxYamlGeneration(state.releases)
  const rawDescription = await input.promptDescription({
    existing: false,
    generation: previousGeneration + 1,
    previousGeneration,
    description: '',
  })
  if (rawDescription == null) return { ok: false, reason: 'cancelled' }
  const description = sanitizeRegionForgeField(String(rawDescription))

  const persisted = readReleaseState() ?? { projectId: fallbackProjectId, releases: [] }
  const generation = maxYamlGeneration(persisted.releases) + 1
  const release: YamlRelease = {
    generation,
    createdAt: (input.now ?? (() => new Date().toISOString()))(),
    description,
    dimension: input.dimension,
    checksum,
    verified: true,
  }
  const nextState: YamlReleaseState = {
    projectId: persisted.projectId,
    releases: [...persisted.releases, release],
  }

  try {
    writeReleaseState(nextState)
  } catch (error) {
    console.error('Failed to save YAML release history:', error)
    return { ok: false, reason: 'storage' }
  }

  const stored = readReleaseState()
  const storedRelease = stored?.releases.find((entry) => entry.generation === generation)
  if (!stored || storedRelease?.checksum !== checksum) {
    return { ok: false, reason: 'conflict' }
  }

  const yaml = buildRegionForgeYamlPreamble({
    generation: release.generation,
    createdAt: release.createdAt,
    description: release.description,
    worldName: input.worldName,
    projectId: stored.projectId,
    dimension: release.dimension,
    checksum,
    appVersion: input.appVersion,
    stats: input.stats,
  }) + input.body
  return { ok: true, yaml, generation, reused: false, release }
}

export function releaseStateFromProjectFile(
  file: ProjectReleaseFile,
  mintProjectId: () => string
): YamlReleaseState {
  const projectId = typeof file.projectId === 'string' && file.projectId.trim() !== ''
    ? file.projectId.trim()
    : mintProjectId()

  if (Array.isArray(file.yamlReleases)) {
    return {
      projectId,
      releases: file.yamlReleases
        .map(parseYamlRelease)
        .filter((release): release is YamlRelease => release !== null),
    }
  }

  const generation = file.regionForgeYamlGeneration
  if (typeof generation === 'number' && Number.isFinite(generation) && generation > 0) {
    return {
      projectId,
      releases: [{
        generation: Math.floor(generation),
        createdAt: typeof file.exportDate === 'string' ? file.exportDate : '',
        description: '',
        dimension: getValidDimension(file.dimension),
        checksum: null,
        verified: false,
      }],
    }
  }

  return { projectId, releases: [] }
}

function checksumsConflict(left: YamlRelease[], right: YamlRelease[]): boolean {
  const generations = new Set([...left, ...right].map((release) => release.generation))
  for (const generation of generations) {
    const fromLeft = left.filter((release) => release.generation === generation)
    const fromRight = right.filter((release) => release.generation === generation)
    if (fromLeft.length === 0 || fromRight.length === 0) continue
    for (const a of fromLeft) {
      for (const b of fromRight) {
        if (a.checksum === null || b.checksum === null || a.checksum !== b.checksum) return true
      }
    }
  }
  return false
}

export function detectReleaseImportConflict(
  local: YamlReleaseState | null,
  incoming: YamlReleaseState
): ReleaseImportConflict | null {
  const localMaxGeneration = local ? maxYamlGeneration(local.releases) : 0
  const incomingMaxGeneration = maxYamlGeneration(incoming.releases)
  const differentProject = !!(local && local.releases.length > 0 && local.projectId !== incoming.projectId)
  const olderGeneration = incomingMaxGeneration < localMaxGeneration
  const checksumMismatch = local ? checksumsConflict(local.releases, incoming.releases) : false
  if (!differentProject && !olderGeneration && !checksumMismatch) return null
  return { differentProject, olderGeneration, localMaxGeneration, incomingMaxGeneration, checksumMismatch }
}

export function describeReleaseImportConflict(conflict: ReleaseImportConflict): string {
  const parts: string[] = []
  if (conflict.differentProject) {
    parts.push('This file is a different project from the release history stored in this browser.')
  }
  if (conflict.olderGeneration) {
    parts.push(`This file stops at release ${conflict.incomingMaxGeneration}, and this browser is already at release ${conflict.localMaxGeneration}.`)
  }
  if (conflict.checksumMismatch) {
    parts.push('The same release number does not match the stored region fingerprint.')
  }
  parts.push('Loading it replaces the release history in this browser.')
  return parts.join(' ')
}
