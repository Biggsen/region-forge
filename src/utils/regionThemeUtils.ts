import regionThemeTable from '../../reference/region-theme-table.json'

type ThemeRow = { roll: number; a: string; b: string }
const rows = regionThemeTable as ThemeRow[]

export type ThemePair = { a: string; b: string }

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function pickRandomThemePairs(): ThemePair[] {
  const picked = shuffle(rows).slice(0, 3)
  return picked.map(({ a, b }) => ({ a, b }))
}

export function getAllPairs(): ThemePair[] {
  return rows.map(({ a, b }) => ({ a, b }))
}

export function getAValues(): string[] {
  return [...new Set(rows.map(r => r.a))].sort()
}

export function getBValues(): string[] {
  return [...new Set(rows.map(r => r.b))].sort()
}
