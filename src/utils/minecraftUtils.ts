import minecraftItemsData from '../../reference/minecraft-items.json'

export const MINECRAFT_CATEGORIES = [
  'ores', 'stone', 'brick', 'copper', 'earth', 'sand', 'wood', 'drops',
  'food', 'utility', 'transport', 'light', 'plants', 'redstone', 'tools',
  'weapons', 'armor', 'enchantments', 'brewing', 'ocean', 'nether', 'end',
  'deep dark', 'archaeology', 'ice', 'dyed', 'discs'
] as const

type MinecraftItemEntry = { name: string; category: string; stack: number }
type MinecraftItemsRecord = Record<string, MinecraftItemEntry>

const items = minecraftItemsData as MinecraftItemsRecord

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function getItemsByCategory(): Map<string, { id: string; name: string }[]> {
  const byCategory = new Map<string, { id: string; name: string }[]>()
  for (const [id, entry] of Object.entries(items)) {
    if (!entry?.category || !entry?.name) continue
    const cat = entry.category
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push({ id, name: entry.name })
  }
  return byCategory
}

const itemsByCategory = getItemsByCategory()

function getCategoriesWithEnoughItems(minItems: number = 3): string[] {
  return MINECRAFT_CATEGORIES.filter(
    cat => (itemsByCategory.get(cat)?.length ?? 0) >= minItems
  )
}

export type MinecraftRegionData = {
  category: string
  items: { id: string; name: string }[]
}

const allItemsList = (() => {
  const list: { id: string; name: string }[] = []
  for (const [id, entry] of Object.entries(items)) {
    if (entry?.name) list.push({ id, name: entry.name })
  }
  return list.sort((a, b) => a.name.localeCompare(b.name))
})()

export function getAllItems(): { id: string; name: string }[] {
  return allItemsList
}

export function pickRandomMinecraftData(): MinecraftRegionData {
  const validCategories = getCategoriesWithEnoughItems(1)
  const category = validCategories.length > 0
    ? validCategories[Math.floor(Math.random() * validCategories.length)]
    : 'ores'
  const picked = shuffle(allItemsList).slice(0, 3)
  return { category, items: picked }
}
