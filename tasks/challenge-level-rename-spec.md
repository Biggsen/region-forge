# Challenge Level Rename Specification

## Status: ON HOLD

**This work is blocked until the LevelledMobs generator is purged from the codebase.**

The LevelledMobs generator (`generateLevelledMobsRulesYAML` in `src/utils/exportUtils.ts`) currently references challenge level names (e.g., `challenge-vanilla`) in its output. This functionality is being moved to mc-plugin-manager, and the generator should be removed before renaming challenge levels to avoid breaking changes and unnecessary refactoring.

---

## Overview

This specification outlines the changes needed to replace all challenge level terminology from **Vanilla/Bronze/Silver/Gold/Platinum** to **easy/normal/hard/severe/deadly** throughout the codebase and UI.

The goal is to align the internal challenge level names with the difficulty band names used in the `regions-meta.yml` export schema, eliminating the need for a mapping layer.

---

## Current State

- **Challenge Level Type:** `'Vanilla' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum'`
- **Difficulty Band Mapping:** Vanilla→easy, Bronze→normal, Silver→hard, Gold→severe, Platinum→deadly
- **Usage:** Challenge levels are used in UI, exports, randomization, and visual overlays

---

## Target State

- **Challenge Level Type:** `'easy' | 'normal' | 'hard' | 'severe' | 'deadly'`
- **No Mapping Required:** Challenge levels are already difficulty bands
- **Consistent Terminology:** All references use difficulty band names

---

## Files Requiring Changes

### 1. Type Definition

**File:** `src/types.ts`
- **Line 1:** Change `ChallengeLevel` type from `'Vanilla' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum'` to `'easy' | 'normal' | 'hard' | 'severe' | 'deadly'`

**Impact:** This is a breaking change that affects all files importing `ChallengeLevel`.

---

### 2. Default Values (Multiple Files)

All instances of `'Vanilla'` as a default value must be changed to `'easy'`:

**File:** `src/hooks/useRegions.ts`
- **Line 45:** Migration default: `challengeLevel: region.challengeLevel || 'Vanilla'` → `'easy'`
- **Line 141:** New region default: `challengeLevel: 'Vanilla'` → `'easy'`
- **Line 745:** Randomization fallback: `shuffledLevels[index] || 'Vanilla'` → `'easy'`
- **Line 751:** Spawn region default: `challengeLevel: 'Vanilla'` → `'easy'`

**File:** `src/components/AdvancedPanel.tsx`
- **Line 446:** Dropdown default: `?.challengeLevel || 'Vanilla'` → `'easy'`

**File:** `src/components/RegionOverlay.tsx`
- **Line 159:** Visual overlay default: `region.challengeLevel || 'Vanilla'` → `'easy'`
- **Line 187:** Stroke color default: `region.challengeLevel || 'Vanilla'` → `'easy'`

**File:** `src/components/RegionActions.tsx`
- **Line 29:** Count calculation default: `region.challengeLevel || 'Vanilla'` → `'easy'`

---

### 3. UI Components

**File:** `src/components/AdvancedPanel.tsx`
- **Lines 450-454:** Update dropdown `<option>` values and display text:
  - `value="Vanilla"` → `value="easy"` (display: "Easy")
  - `value="Bronze"` → `value="normal"` (display: "Normal")
  - `value="Silver"` → `value="hard"` (display: "Hard")
  - `value="Gold"` → `value="severe"` (display: "Severe")
  - `value="Platinum"` → `value="deadly"` (display: "Deadly")

**File:** `src/components/RegionOverlay.tsx`
- **Lines 5-11:** Update `CHALLENGE_LEVEL_COLORS` object keys:
  - `Vanilla: { ... }` → `easy: { ... }`
  - `Bronze: { ... }` → `normal: { ... }`
  - `Silver: { ... }` → `hard: { ... }`
  - `Gold: { ... }` → `severe: { ... }`
  - `Platinum: { ... }` → `deadly: { ... }`
- **Note:** Color values may need adjustment to match new difficulty names (e.g., "easy" might be green, "deadly" might be dark red)

**File:** `src/components/RegionActions.tsx`
- **Lines 21-25:** Update count object keys in `getChallengeLevelCounts()`:
  - `Vanilla: 0` → `easy: 0`
  - `Bronze: 0` → `normal: 0`
  - `Silver: 0` → `hard: 0`
  - `Gold: 0` → `severe: 0`
  - `Platinum: 0` → `deadly: 0`
- **Line 41:** Update tooltip text: `"2 Platinum, 4 Gold, 6 Silver, 8 Bronze, rest Vanilla"` → `"2 deadly, 4 severe, 6 hard, 8 normal, rest easy"`

---

### 4. Utility Functions

**File:** `src/utils/polygonUtils.ts`
- **Lines 6-19:** Update `getChallengeLevelColor()` switch cases:
  - `case 'Vanilla':` → `case 'easy':`
  - `case 'Bronze':` → `case 'normal':`
  - `case 'Silver':` → `case 'hard':`
  - `case 'Gold':` → `case 'severe':`
  - `case 'Platinum':` → `case 'deadly':`
- **Note:** Update descriptions to match new difficulty names (e.g., "A safe haven" for easy, "extremely dangerous" for deadly)

**File:** `src/utils/exportUtils.ts`
- **Lines 207-213:** `CHALLENGE_TO_BAND` mapping can be removed or converted to identity function:
  ```ts
  // Option 1: Remove mapping entirely (challenge levels are already bands)
  // Option 2: Identity function for backwards compatibility
  const CHALLENGE_TO_BAND: Record<string, string> = {
    easy: 'easy',
    normal: 'normal',
    hard: 'hard',
    severe: 'severe',
    deadly: 'deadly'
  }
  ```
- **Line 332:** Update usage: `CHALLENGE_TO_BAND[r.challengeLevel]` → can use `r.challengeLevel` directly if mapping removed
- **Line 654:** Update preset name generation: `challenge-${region.challengeLevel.toLowerCase()}` (e.g., `challenge-easy`)
- **Line 657:** Update rule name: `${region.challengeLevel} Challenge` (e.g., "Easy Challenge" or "easy Challenge")

---

### 5. Randomization Logic

**File:** `src/hooks/useRegions.ts`
- **Lines 724-729:** Update `randomizeChallengeLevels()` distribution object:
  ```ts
  const distribution = {
    deadly: 2,    // was Platinum
    severe: 4,     // was Gold
    hard: 6,       // was Silver
    normal: 8,     // was Bronze
    easy: Math.max(0, regionsToRandomize.length - 20) // was Vanilla
  }
  ```

---

### 6. Documentation

**File:** `tasks/region-meta-export-spec.md`
- **Lines 131-135:** Already updated in previous commit
- **Note:** Verify all references to challenge levels use new names

**File:** `README.md`
- **Line 91:** Update if it mentions challenge levels by name

**File:** `tasks/completed/region_map_tool_spec.md`
- **Line 63:** Update if it references challenge level type

---

## Data Migration

### Existing Saved Data

Users may have saved data with old challenge level values. Add migration logic in `src/hooks/useRegions.ts` (around line 41-45 where existing regions are migrated):

```ts
// Migrate old challenge level names to new ones
const oldToNew: Record<string, ChallengeLevel> = {
  'Vanilla': 'easy',
  'Bronze': 'normal',
  'Silver': 'hard',
  'Gold': 'severe',
  'Platinum': 'deadly'
}

if (region.challengeLevel && oldToNew[region.challengeLevel]) {
  region.challengeLevel = oldToNew[region.challengeLevel] as ChallengeLevel
}
```

---

## Testing Requirements

After changes are implemented:

- [ ] All UI dropdowns show new difficulty names
- [ ] Challenge level selection works correctly
- [ ] Visual overlay colors display correctly for all difficulty levels
- [ ] Randomization distributes levels correctly
- [ ] Export functions use new names (regions-meta.yml, regions.yml greetings)
- [ ] Saved data with old names migrates correctly
- [ ] No console errors or TypeScript errors
- [ ] All references to old names are removed

---

## Dependencies

### Blocking

- **LevelledMobs Generator Removal:** The `generateLevelledMobsRulesYAML` function must be removed from `src/utils/exportUtils.ts` and its UI button removed from `src/components/AdvancedPanel.tsx` before this work begins.

### Related

- **regions-meta Export:** Already uses difficulty band names in its output; this change will align internal state with export format.

---

## Implementation Order

1. **Wait for LevelledMobs generator removal** (blocking)
2. Update type definition (`src/types.ts`)
3. Add data migration logic (`src/hooks/useRegions.ts`)
4. Update all default values
5. Update UI components (dropdowns, colors, tooltips)
6. Update utility functions (switch cases, mappings)
7. Update randomization logic
8. Update export functions
9. Update documentation
10. Test thoroughly
11. Commit changes

---

## Notes

- The term "challenge level" may still be used in UI labels (e.g., "Challenge Level" dropdown), but the values themselves will be difficulty band names.
- Consider renaming `challengeLevel` property to `difficulty` or `difficultyBand` in a future refactor, but that is out of scope for this change.
- Color schemes for difficulty levels may need adjustment to better match the new names (e.g., green for easy, red for deadly).

---

## Changelog

| Version | Date | Notes |
|--------|------|-------|
| 1.0 | 2026-01-26 | Initial spec created. Work on hold pending LevelledMobs generator removal. |
