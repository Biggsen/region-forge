# regions.yml Release History Specification

## Status: ✅ IMPLEMENTED

**Completed:** October 2026
**Archived:** `tasks/completed/`

**Scope:** Region Forge only. MCPM is not changed by this work.

**Primary code:** `src/utils/yamlRelease.ts`, `src/utils/yamlRelease.test.ts`, `src/utils/exportUtils.ts`, `src/utils/persistenceUtils.ts`, `src/hooks/useRegionForgeYamlGeneration.ts`, `src/hooks/useProjectImport.ts`, `src/components/ExportPanel.tsx`, `src/components/MainApp.tsx`

**Shipped beyond the first draft:**

- A matching download still opens a dialog so the note can be edited or cleared. An unchanged note does not write. Generation, timestamp, checksum, and dimension stay fixed.
- The export panel shows the current release, its description, and **Unexported changes** when the current `regions:` body no longer matches the latest verified checksum.
- The new-release dialog names the next generation (persisted max + 1) before the write. The write still re-reads storage after confirm.
- Project JSON downloads are named `{world}-{dimension}-{date}-project.json`. YAML names are unchanged (`-regions.yml`, `-regions-meta.yml`).

---

## Overview

`regions.yml` export used to bump `regionForgeYamlGeneration` in React state and write that number into the file preamble. The counter was not stored in `localStorage`. It was written into the project JSON only when the user saved the project, and a reload started it at `0` again. The preamble also stamped `generated-at` and `build-id` from the current time, so two downloads of the same regions were different files.

This spec replaces that counter with a persisted release history for the one working project already stored in `localStorage`.

---

## Problem Statement

- A `regions.yml` download can advance the generation number without anything surviving a refresh.
- Saving the project file is a separate step, so the number in the YAML and the number in the project JSON can diverge.
- Opening an older project JSON overwrites the in-memory counter (`regionForgeYamlGeneration ?? 0`) with no check against a newer local history.
- `build-id` is `rf-${Date.now()}`, so a repeated download is a new artifact even when the WorldGuard body is unchanged.
- `localStorage` holds one project per origin. Release history keyed only by world name would mix Charidh, Teledosi, and Lowothra, and a rename would split one project's history.

---

## Goals

1. A new release is created only when the generated `regions:` body changes.
2. Downloading that release again leaves generation, timestamp, checksum, and dimension unchanged. An unchanged note produces the same file bytes. Editing or clearing the note updates that field only.
3. Release history survives refresh without a manual project save.
4. The project JSON contains the project id and the full release history, and loading a file restores them.
5. An old project file that has only `regionForgeYamlGeneration` stays compatible and does not reuse that generation.
6. A failed `localStorage` write does not publish a download.
7. `REGION_FORGE_APP_VERSION` stays independent of the generation number.

---

## Model

| Concept | Role |
|---------|------|
| Project id | Identifies the project independently of its world name. |
| Generation | Monotonically increasing release number within that project. |
| Checksum | Identifies the exact generated `regions:` body. |
| Release metadata | Generation, timestamp, dimension, and checksum are fixed at creation. The description can be edited or cleared on a later download of the same body. |
| Application version | `REGION_FORGE_APP_VERSION` (`1.0.0`). Not a release number. |

```ts
type YamlDimension = 'overworld' | 'nether' | 'end'

interface YamlRelease {
  generation: number
  createdAt: string
  description: string
  dimension: YamlDimension
  /** SHA-256 hex of the regions: body. Null only for an unverified legacy baseline. */
  checksum: string | null
  /** False only for a legacy baseline synthesized from regionForgeYamlGeneration. */
  verified: boolean
}

interface YamlReleaseState {
  projectId: string
  releases: YamlRelease[]
}
```

One history per project id. Each record stores its dimension because dimension changes the body. A project file has a single dimension; this spec does not split history by dimension.

The checksum is the authoritative artifact identity. The generation number is the human-readable version. Two files can claim the same generation and still differ; MCPM should prefer the checksum when it later compares artifacts. This spec does not implement that MCPM behaviour.

---

## Persistence

Store `YamlReleaseState` in `localStorage` through `src/utils/persistenceUtils.ts`, alongside the existing project keys.

- Add a storage key (for example `mc-region-maker-yaml-releases`).
- `clearSavedData()` removes it with the other project keys.
- After a clear, the next session mints a new project id. It does not keep the previous history.

There is no IndexedDB and no other database.

### Project id

- Mint a UUID when no id is stored and no import has supplied one.
- Keep it across world renames.
- Write it into the project JSON and restore it on import.
- Copying a project file copies the id. This spec does not add a "save as new project" action. A later feature that starts a new world from an existing file must mint a new id.

### Allocation

Before allocating a generation, read the latest persisted `YamlReleaseState`. Do not trust React state alone.

```
next = max(generation in persisted releases, treating a missing history as 0) + 1
```

If React state is behind `localStorage`, the persisted maximum wins. This is a safeguard for two open tabs. It is not a cross-tab transaction.

After a successful `setItem` of a new release, read the stored record back. If that generation's checksum is not the checksum just written, do not download. Show an error and leave the other tab's record in place.

---

## Checksum

Hash the exact `regions:` string `exportRegionsYAML` already concatenates after the preamble, from the `regions:` line through the last region block. UTF-8, SHA-256, lowercase hex.

Included in the hash:

- Region array order, as stored (enabled regions only, current filter).
- Polygon point order, as stored.
- Numeric text already produced by `Math.round` and the existing cuboid templates.
- Export toggles, because they change that string (villages, structures, hearts, nerves, spawn, world height, greetings).

Excluded from the hash:

- The preamble, including generation, timestamp, description, app version, world name, project id, dimension label, stats comment, and `build-id`.

Do not sort regions, reorder polygon points, or normalize geometry. A reorder that changes the file WorldGuard receives is a new checksum.

The current generator is already deterministic for a given editor state and export settings: it walks the region array, walks each point array, and prints rounded integers. Hash that string. Do not build a second serializer.

Compare the checksum only to the latest **verified** release. A match downloads that release again. A match against an older generation, while a later verified release exists, is a new release (the deployable body changed back).

---

## Export flow

`exportRegionsYAML` in `src/utils/exportUtils.ts`.

1. Build the `regions:` body with the current export settings. Keep the existing empty-export error before any release work. That path does not allocate a generation.
2. Checksum the body.
3. Read persisted release state.
4. If the latest verified release has the same checksum, prompt with that release's generation and current description. Cancel aborts: no write, no download. If the sanitized description is unchanged, rebuild the file from the stored metadata and download it. Do not call `setItem`. Do not change `createdAt`, generation, checksum, dimension, or `build-id`. If the description changed, including when it was cleared, update that field on the matching release, read it back, then download. Generation stays the same.
5. Otherwise prompt for a new release. The dialog shows `Create Release N`, where `N` is the persisted maximum plus one from this pre-prompt read. When a previous release exists, the body says the configuration changed since that release. The description may be empty. Cancelling the prompt cancels the export: no write, no download.
6. Read persisted state again. Allocate `next` from that second read, so the number shown in the dialog is a preview and can differ if another tab wrote during the prompt. Build the release record (`verified: true`, `checksum` set, `createdAt` set once, dimension from the export).
7. `localStorage.setItem`. If it throws (unavailable storage, quota, or private-mode failure), show an error, do not advance React state, and do not download.
8. Read back. On conflict, show an error and do not download.
9. Download only after the write has been confirmed.

A repeated download of an already persisted release does not need a new write. A new release is not treated as published if the write or the read-back fails.

`useRegionForgeYamlGeneration` stops being a memory-only counter. React state may mirror storage for the save path; allocation reads storage.

---

## Preamble

Keep the existing machine-readable `generator-version` line so current readers still see it. Add human-readable lines above it. Freeze every identifying field at release creation.

```
# Generated by Region Forge 1.0.0
# Project: Charidh
# Project-Id: <uuid>
# Generation: 27
# Released: 2026-10-14T12:34:56.000Z
# Description: Updated Demtory boundaries
# region-forge: generator-version=027; generated-at=<createdAt>; app-version=1.0.0; project=<world name>; project-id=<uuid>; dimension=<dimension>; checksum=<sha256>; plugin=worldguard; export-type=regions-yml; build-id=<sha256>
# region-forge: regions=...; villages=...; structures=...; hearts=...; nerves=...; spawn=...
```

- `app-version` is `REGION_FORGE_APP_VERSION`.
- `generated-at` is the release `createdAt`, not `new Date()` at download time.
- `build-id` is the release checksum. Two downloads of the same generation are byte-identical, including the stats line, because the stats are a function of the same body and the same toggles.
- `project` remains the world name (cosmetic). `project-id` is the identity.
- Description text is sanitized with the existing `sanitizeRegionForgeField` rules so a newline cannot break the comment.

---

## Project JSON

`MapExportData` (`exportCompleteMap`) gains:

- `projectId: string`
- `yamlReleases: YamlRelease[]`

Keep writing `regionForgeYamlGeneration` as the high-water mark (`max` generation, or `0` when there are no releases) so older files and any reader of that field still see a number.

On save, write the history currently persisted in `localStorage`, not a separate in-memory copy that might be behind.

The downloaded project file is `{world}-{dimension}-{date}-project.json`. `regions.yml` stays `{world}-{dimension}-{date}-regions.yml`.

### Import

`importMapData` / `useProjectImport`:

| File contents | Restored state |
|---------------|----------------|
| `yamlReleases` present | Use `projectId` and `yamlReleases`. Ignore `regionForgeYamlGeneration` for history. |
| No `yamlReleases`, `regionForgeYamlGeneration` is `N > 0` | Unverified baseline: `{ generation: N, checksum: null, verified: false, description: '', createdAt: '' or the file exportDate, dimension from the file }`. |
| No `yamlReleases`, missing or `0` generation | No releases. Keep or mint `projectId` from the file when present. |
| `projectId` missing | Mint a new id for the imported project. Do not attach it to the previous local id. |

The next export after an unverified baseline of 27 creates generation 28. Generation 27 is never reused and never given a guessed checksum, even if the current body might have been that export.

Parse the file before replacing local release state. If any of the following is true, warn and wait for confirmation before applying the import:

- The file's `projectId` differs from the local `projectId` and the local history is non-empty.
- The file's maximum generation is lower than the local maximum.
- The same generation appears in both histories with different checksums (either side `null` counts as different).

Confirmation replaces local release state with the file's state. There is no merge. The existing "Load Project File" modal may stay; this comparison happens after the file is parsed and before regions, map, and release state are written.

Cancelling leaves `localStorage` and the open session unchanged.

---

## Description prompt

Both paths ask before the download. Cancel aborts either path: no write, no download. An empty description is valid.

**New release.** Title `Create Release N`. When `N` is 1, the body does not mention a previous release. Label: "Release note (optional)". Placeholder: "Describe what changed...". Confirm button: "Create & Download".

**Matching release.** Title `Release N`. Body: this configuration matches the latest release and downloading it will not create a new release. The stored note is shown as text until the user chooses Edit. Confirm button: "Download release". An unchanged note does not call `setItem`.

There is no release-history browser or list. History is persisted, embedded in the project file, and restored on load.

## Export panel

Above **Generate regions.yml**:

- `Release N` when a release exists, otherwise "No release". `N` is the maximum stored generation.
- A **DESCRIPTION** subheading, with the current release's note on the line below when one is set.
- **Unexported changes** only when the panel has finished loading and the current `regions:` body checksum differs from the latest verified release. An empty export (no enabled regions, and spawn not applicable) does not show the warning.

The warning follows the regions.yml body only. Region description, theme, Minecraft category, items, and biomes are regions-meta fields and do not trip it. Polygon edits and added structures are the same kind of change when they alter that body: one new generation, with no separate change type.

---

## Failure handling

`localStorage.setItem` can throw. A new release is published only when the write succeeds and the read-back matches.

| Failure | Result |
|---------|--------|
| `setItem` throws | Error toast. No download. No generation consumed in React state. Storage unchanged if the throw happened before a write. |
| Read-back checksum mismatch | Error toast. No download. Do not overwrite the stored record. |
| User cancels either description prompt | No write. No download. |
| Matching download, description unchanged | Download the frozen release. No `setItem`. |
| Matching download, description changed or cleared | Update that release's description, read it back, then download. Generation unchanged. A failed write or a mismatched read-back does not download. |

---

## Architectural boundary

**Region Forge**

- Owns project identity, release history, and generation.
- Produces reproducible `regions.yml` files.
- Does not track what a server has installed.

**MCPM** (out of scope here)

- Reads generation, project id, and checksum from the preamble.
- Tracks the installed release per server.
- Detects mismatches and supports rollback using artifacts it retained.
- Treats the checksum as the artifact identity and the generation number as the human-readable version.

MCPM keeps consuming the `regions:` map as it does today. This spec does not move polygon generation into MCPM.

---

## Out of scope

- IndexedDB or any server-side store.
- Changes to MCPM.
- A release-history browser or list. The export panel shows only the current release, its description, and the unexported-changes warning.
- Geometric or key-order normalization.
- Cross-tab locks beyond read-before-allocate and read-back.
- A "save as new project" control. Duplicated JSON files share a project id until such a control exists.
- `regions-meta.yml` and the other Advanced exports. They do not create YAML releases.
- Changing `REGION_FORGE_APP_VERSION`.

---

## Tests

Tests live in `src/utils/yamlRelease.test.ts`. Cover at least:

1. **Legacy import.** File with `regionForgeYamlGeneration: 27` and no `yamlReleases` restores an unverified baseline. The next changed export is generation 28. Generation 27 is not reused when the current body happens to match what the user might have exported before.
2. **Repeated download.** Two exports of the same body and the same note produce one release, identical file text, and no second `setItem`. `createdAt`, description, and `build-id` stay as stored. Editing or clearing the note updates that release only and does not allocate a new generation.
3. **Project switching.** Importing a file with a different `projectId` while local history exists warns. Confirming replaces local history. Cancelling leaves local history in place. A world rename does not change `projectId`.
4. **Divergent histories.** Same `projectId`, same generation, different checksums warns and does not silently keep either side without confirmation. After confirm, the file's history is the stored history.
5. **Persistence failure.** `setItem` throws. No download is returned, and the in-memory generation does not advance.
6. **Stale React generation.** Persisted max is 30 while memory says 27. The next new release is 31.
7. **Checksum boundary.** The hash changes when a coordinate or an export toggle changes the body. It does not change when only preamble fields would have changed. Point order and region order are left as stored.
8. **Read-back conflict.** Storage returns a different checksum for the generation just allocated. No download.
9. **App version.** Preamble `app-version` remains `1.0.0` while generation increments.

---

## Implementation notes

- `bumpRegionForgeYamlGeneration` was removed. `publishRegionsYaml` in `src/utils/yamlRelease.ts` allocates and writes. `useRegionForgeYamlGeneration` mirrors storage for the panel and the project save.
- `exportCompleteMap` already copies `regionForgeYamlGeneration` onto the project JSON. Extend that object; do not start a second save format.
- `buildRegionForgeYamlPreamble` is the function that currently calls `Date.now()` for `build-id`.
- `clearSavedData` is used from `MapLoaderControls` and `AdvancedPanel`. New keys must be in `STORAGE_KEYS` or be removed there explicitly, or a data clear will leave release history behind.
