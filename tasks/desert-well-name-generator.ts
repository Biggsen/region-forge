export const desertWellWordPools = {
  heat: [
    'Sun',
    'Dune',
    'Sand',
    'Ember',
    'Scorch',
    'Sirocco',
    'Dust',
    'Arid',
    'Blaze',
    'Noon',
    'Drift',
    'Grit'
  ],
  relief: [
    'Rest',
    'Refuge',
    'Respite',
    'Haven',
    'Shelter',
    'Pause',
    'Mercy',
    'Relief',
    'Sanctuary'
  ],
  structures: [
    'Well',
    'Cistern',
    'Basin',
    'Spring',
    'Reservoir',
    'Hollow'
  ],
  adjectives: [
    'Quiet',
    'Hidden',
    'Last',
    'Fading',
    'Still',
    'Deep',
    'Shaded',
    'Silent',
    'Forgotten',
    'Waiting',
    'Cool'
  ],
  abstract: [
    'Silence',
    'Heat',
    'Thirst',
    'Mirage',
    'Horizon',
    'Dust',
    'Shade',
    'Stillness',
    'Drywind',
    'Noon'
  ]
} as const;

export const desertWellPatterns = [
  '{heat} {relief}',
  '{heat} {structure}',
  '{adjective} {structure}',
  '{structure} of {abstract}',
  '{relief} of the {heat}'
] as const;

export const desertWellCurated = [
  'Sun Refuge',
  'Dune Respite',
  'Ember Haven',
  'Quiet Well',
  'Hidden Basin',
  'Last Cistern',
  'Deep Spring',
  'Basin of Silence',
  'Well of Dust',
  'Cistern of Noon',
  'Spring of Mirage',
  'Hollow of Thirst',
  'Silent Reservoir',
  'Shaded Well',
  'Fading Basin',
  'Still Cistern',
  'Dust Mercy',
  'Arid Haven',
  'Waiting Well',
  'Refuge of the Dune'
] as const;

export type DesertWellPatternToken =
  | 'heat'
  | 'relief'
  | 'structure'
  | 'adjective'
  | 'abstract';

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function fillPattern(pattern: string): string {
  return pattern
    .replace('{heat}', pick(desertWellWordPools.heat))
    .replace('{relief}', pick(desertWellWordPools.relief))
    .replace('{structure}', pick(desertWellWordPools.structures))
    .replace('{adjective}', pick(desertWellWordPools.adjectives))
    .replace('{abstract}', pick(desertWellWordPools.abstract));
}

export function generateDesertWellName(): string {
  return fillPattern(pick(desertWellPatterns));
}

export function generateDesertWellNames(count = 20): string[] {
  const names = new Set<string>();

  while (names.size < count) {
    names.add(generateDesertWellName());
  }

  return [...names];
}
