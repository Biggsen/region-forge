# Region Heart & Nerve Anchors — Move and Split Behavior

## Overview

Region **hearts** (`centerPoint`) and **nerves** (`nervePoint`) are optional world-space anchors on a region. Polygon edits that **translate** or **partition** the region must keep those anchors consistent with the resulting geometry.

This spec covers two related bugs from [PR #12 review](https://github.com/Biggsen/region-forge/pull/12) (items **2** and **3**). They share the same domain model and should be implemented together with shared helpers.

**Status:** Open  
**Priority:** Medium (non-blocking for nerve feature merge; correctness issue for maps with placed hearts/nerves)  
**Prerequisites:** Region nerve feature (`nervePoint` on `Region`) merged or present on branch.

---

## Problem Statement

Today, only `region.points` are updated when a region is **moved** or **split**. Hearts and nerves stay at their original world coordinates. After these operations, anchors can sit outside the polygon, or both split children can claim the same anchor even though only one polygon contains it.

This predates nerves for hearts-only workflows but is **more visible** now that regions can have two independent anchors.

### Current behavior (buggy)

| Operation | What changes | What does not change |
|-----------|--------------|----------------------|
| **Move** (`updateMoveRegion`, `moveRegionToPosition`) | `points` shifted by `(offsetX, offsetZ)` | `centerPoint`, `nervePoint` |
| **Cancel move** (`cancelMoveRegion`) | `points` restored from `originalRegionPoints` | Anchors never moved during drag, so no restore needed — but user may have expected anchors to move with preview |
| **Split** (`finishSplitRegion`) | Two new regions with new `points`; spread `...region` | Both children copy **identical** `centerPoint` and `nervePoint` from parent |

### Additional nuance (move offset calculation)

`moveRegionToPosition` computes the translation using `calculateRegionCenter(region)`, which prefers **nerve → heart → polygon centroid**. That center may not match the visual drag anchor when only a heart is set, and it does not reflect “move the polygon as drawn” when anchors exist. Fixing anchor translation (below) does not fully resolve this; see **§ Move offset reference**.

---

## Goals

1. **Move:** When a region’s polygon is translated by `(Δx, Δz)`, every **set** heart and nerve on that region moves by the same delta (X and Z; Y unchanged unless explicitly specified later).
2. **Split:** Each child region receives at most one heart and one nerve, and only if that anchor’s **(x, z)** lies inside **that child’s** polygon (same containment rule as CSV import / `findParentRegion`).
3. **Cancel move:** Restores polygon **and** anchors to their pre-move state.
4. **No overlap after split:** At most one child owns a given anchor; the other child gets `null` for that field.
5. **Tests:** Unit tests for anchor offset and split assignment; manual checklist for map drag/split UX.

### Non-goals (this spec)

- **Resize / scale** (`resizeRegion`) — anchors are not scaled with the polygon; tracked separately in [`tasks/buglist.md`](../buglist.md) (“Region Scale Then Move — Center Point Off”). May reuse helpers later.
- **Vertex edit / warp** — editing `points` without a global translate does not auto-clear or slide anchors.
- **Subregions** (villages, structures) — unchanged; only `centerPoint` / `nervePoint` on `Region`.

---

## Solution

### Shared utilities (`src/utils/polygonUtils.ts` or `src/utils/regionAnchorUtils.ts`)

```ts
type XZ = { x: number; z: number }

/** Apply the same world translation used for polygon points. */
function offsetAnchor(
  anchor: { x: number; z: number; y?: number } | null | undefined,
  offsetX: number,
  offsetZ: number
): { x: number; z: number; y?: number } | null

/** Assign heart/nerve to a child polygon; null if outside or missing. */
function assignAnchorsForSplitChild(
  parent: Region,
  childPoints: { x: number; z: number }[]
): Pick<Region, 'centerPoint' | 'nervePoint'>
```

- `offsetAnchor`: if anchor is `null`/`undefined`, return `null`; else `{ x: anchor.x + offsetX, z: anchor.z + offsetZ, y?: anchor.y }`.
- `assignAnchorsForSplitChild`: for each of `centerPoint` and `nervePoint` on parent, if set and `isPointInPolygon({ x, z }, childPoints)`, copy to child (preserve `y`); otherwise `null`.

**Boundary:** Use existing `isPointInPolygon` (inclusive edge behavior as today). Anchors exactly on the split chord may be inside neither child; both get `null` for that anchor — acceptable.

**Tie-break:** If an anchor were inside both children (degenerate geometry), prefer the child with **larger polygon area**; if equal, **left** child (`leftRegion`). Document in tests; expect rare.

---

### 1. Move region

**Files:** [`src/hooks/useRegions.ts`](../../src/hooks/useRegions.ts), optionally [`src/utils/editModeUtils.ts`](../../src/utils/editModeUtils.ts), [`src/types.ts`](../../src/types.ts) (`EditMode`).

#### 1a. Apply offset to anchors whenever points move

In `updateMoveRegion` and `moveRegionToPosition`, when computing `newPoints` from an offset:

- Also set `centerPoint: offsetAnchor(r.centerPoint, offsetX, offsetZ)` (or keep `null`).
- Also set `nervePoint: offsetAnchor(r.nervePoint, offsetX, offsetZ)`.

Use the **same** `offsetX` / `offsetZ` applied to `moveRegionPoints(...)`.

#### 1b. Cancel move restores anchors

At `startMoveRegion`, snapshot anchors on the region (or extend `editModeForMove`):

- `originalCenterPoint: region.centerPoint` (clone)
- `originalNervePoint: region.nervePoint` (clone)

In `cancelMoveRegion`, restore `points`, `centerPoint`, and `nervePoint` from snapshots.

`finishMoveRegion` only clears edit mode; final region state already has moved anchors from the last `updateMoveRegion` call.

#### 1c. Move offset reference (optional improvement)

For `moveRegionToPosition` only, consider using **polygon centroid** (`calculatePolygonCenter(points)`) to compute the translation target, **not** `calculateRegionCenter`, so “move region here” moves the drawn shape even when nerves/hearts exist. Anchors still offset with the polygon per §1a.

**Out of scope if contentious:** ship §1a + §1b first; file follow-up if UX still feels wrong.

---

### 2. Split region

**File:** [`src/hooks/useRegions.ts`](../../src/hooks/useRegions.ts) — `finishSplitRegion`.

When building `leftRegion` and `rightRegion`, **do not** spread parent `centerPoint` / `nervePoint` blindly. Instead:

```ts
const leftRegion: Region = {
  ...region,
  id: generateId(),
  name: `${region.name} (Left)`,
  points: leftPoints,
  originalPoints: leftPoints,
  scaleFactor: 1.0,
  ...assignAnchorsForSplitChild(region, leftPoints),
}

const rightRegion: Region = {
  ...region,
  id: generateId(),
  name: `${region.name} (Right)`,
  points: rightPoints,
  originalPoints: rightPoints,
  scaleFactor: 1.0,
  ...assignAnchorsForSplitChild(region, rightPoints),
}
```

Clear other fields that must not duplicate (already handled: new `id`, `points`, `originalPoints`, `scaleFactor` reset).

**Parent removal:** Original region is replaced by left child in the map list; right child is appended. Selection moves to left child (current behavior).

---

## Acceptance criteria

### Move

- [ ] Region with heart only: after drag-move, heart X/Z match pre-move + polygon delta; heart still inside polygon when it started inside.
- [ ] Region with nerve only: same for nerve.
- [ ] Region with **both**: both translate together; neither stays at old world position.
- [ ] Cancel move: polygon and both anchors return to exact pre-move values.
- [ ] `moveRegionToPosition`: anchors move with polygon.

### Split

- [ ] Heart inside left polygon only → left has heart, right `centerPoint: null`.
- [ ] Nerve inside right polygon only → right has nerve, left `nervePoint: null`.
- [ ] Both anchors in same child → only that child retains them.
- [ ] Neither anchor inside either child → both children have `null` for both fields.
- [ ] Parent had no anchors → children have no anchors.

### Regression

- [ ] Split still requires two split points and valid polygons (≥3 vertices each).
- [ ] Export YAML/meta for children reflects assigned anchors only on the owning child.

---

## Test plan

### Unit tests (Vitest)

Add `src/utils/regionAnchorUtils.test.ts` (or extend `polygonUtils.test.ts`):

| Case | Assert |
|------|--------|
| `offsetAnchor(null, 10, 5)` | `null` |
| `offsetAnchor({ x: 1, z: 2, y: 64 }, 10, -3)` | `{ x: 11, z: -1, y: 64 }` |
| Split: heart at (5,5) inside left square, not right | left `centerPoint` set, right `null` |
| Split: nerve outside both | both `nervePoint` null |

Hook-level tests optional; prefer pure functions.

### Manual (Region Forge UI)

1. Place heart and nerve on one overworld region (different positions).
2. Move region via map drag → confirm markers and Advanced panel coords move with polygon.
3. Cancel move → everything reverts.
4. Split region so chord separates heart and nerve → each child keeps only the anchor in its half.
5. Export regions.yml → `heart_of_*` / `nerve_of_*` only on children that retained anchors.

---

## Implementation checklist

- [ ] Add `offsetAnchor` + `assignAnchorsForSplitChild` (+ tests)
- [ ] Update `updateMoveRegion` and `moveRegionToPosition` to offset anchors
- [ ] Extend move edit mode snapshot + `cancelMoveRegion` restore
- [ ] Update `finishSplitRegion` to use split assignment
- [ ] (Optional) `moveRegionToPosition` uses polygon centroid for offset baseline
- [ ] Run `npm run test:run` and `npm run build`

---

## References

- PR review items 2 & 3: [region-forge#12](https://github.com/Biggsen/region-forge/pull/12)
- Move: `startMoveRegion`, `updateMoveRegion`, `moveRegionToPosition`, `cancelMoveRegion` in [`useRegions.ts`](../../src/hooks/useRegions.ts)
- Split: `finishSplitRegion` in [`useRegions.ts`](../../src/hooks/useRegions.ts)
- Containment: `isPointInPolygon` in [`polygonUtils.ts`](../../src/utils/polygonUtils.ts); CSV parent rule in [`findParentRegion`](../../src/utils/villageUtils.ts)
- Related bug (scale): [`tasks/buglist.md`](../buglist.md) — Region Scale Then Move
