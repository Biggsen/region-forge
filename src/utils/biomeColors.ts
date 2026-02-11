/**
 * Biome color palette for region biome scanning.
 * Maps biome names to hex colors used by Minecraft biome maps (e.g. mcseedmap.net).
 */

export const BIOME_COLORS: Record<string, Record<string, string>> = {
  BEACH: {
    'Beach': '#FADE55',
    'Snowy Beach': '#FAF0C0',
    'Stony Shore': '#A2A284'
  },
  CAVE: {
    'Deep Dark': '#031F29',
    'Dripstone Caves': '#4E3012',
    'Lush Caves': '#283C00'
  },
  DESERT: {
    'Desert': '#FA9418'
  },
  FOREST: {
    'Birch Forest': '#307444',
    'Cherry Grove': '#FF91C8',
    'Dark Forest': '#40511A',
    'Flower Forest': '#2D8E49',
    'Forest': '#056621',
    'Grove': '#47726C',
    'Old Growth Birch Forest': '#589C6C',
    'Pale Garden': '#696D95',
    'Windswept Forest': '#5B7352'
  },
  ICE: {
    'Frozen Peaks': '#B0B3CE',
    'Frozen River': '#A0A0FF',
    'Ice Spikes': '#B4DCDC'
  },
  JUNGLE: {
    'Bamboo Jungle': '#849500',
    'Jungle': '#507B0A',
    'Sparse Jungle': '#60930F'
  },
  MESA: {
    'Badlands': '#D94515',
    'Eroded Badlands': '#FF6D3D',
    'Wooded Badlands': '#CA8C65'
  },
  MOUNTAINS: {
    'Jagged Peaks': '#DCDCC8',
    'Meadow': '#60A445',
    'Snowy Slopes': '#C4C4C4',
    'Stony Peaks': '#7B8F74',
    'Windswept Gravelly Hills': '#888888',
    'Windswept Hills': '#606060'
  },
  MUSHROOM: {
    'Mushroom Fields': '#FF00FF'
  },
  OCEAN: {
    'Cold Ocean': '#202070',
    'Deep Cold Ocean': '#202038',
    'Deep Frozen Ocean': '#404090',
    'Deep Lukewarm Ocean': '#000040',
    'Deep Ocean': '#000030',
    'Frozen Ocean': '#7070D6',
    'Lukewarm Ocean': '#000090',
    'Ocean': '#000070',
    'Warm Ocean': '#0000AC'
  },
  PLAINS: {
    'Plains': '#8DB360',
    'Snowy Plains': '#FFFFFF',
    'Sunflower Plains': '#B5DB88'
  },
  RIVER: {
    'River': '#0000FF'
  },
  SAVANNA: {
    'Savanna': '#BDB25F',
    'Savanna Plateau': '#A79D64',
    'Windswept Savanna': '#E5DA87'
  },
  SWAMP: {
    'Mangrove Swamp': '#2CCC8E',
    'Swamp': '#07F9B2'
  },
  TAIGA: {
    'Old Growth Pine Taiga': '#596651',
    'Old Growth Spruce Taiga': '#818E79',
    'Snowy Taiga': '#31554A',
    'Taiga': '#0B6A5F'
  }
}

export type BiomeEntry = { name: string; r: number; g: number; b: number }

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0]
}

function flattenBiomes(): BiomeEntry[] {
  const entries: BiomeEntry[] = []
  for (const category of Object.values(BIOME_COLORS)) {
    for (const [name, hex] of Object.entries(category)) {
      const [r, g, b] = hexToRgb(hex)
      entries.push({ name, r, g, b })
    }
  }
  return entries
}

const BIOME_LOOKUP = flattenBiomes()

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

export function findNearestBiome(r: number, g: number, b: number): string {
  let minDist = Infinity
  let nearest = 'Unknown'
  for (const entry of BIOME_LOOKUP) {
    const dist = colorDistance(r, g, b, entry.r, entry.g, entry.b)
    if (dist < minDist) {
      minDist = dist
      nearest = entry.name
    }
  }
  return nearest
}
