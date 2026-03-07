export type Dimension = 'overworld' | 'nether' | 'end'

export function getValidDimension(value: string | undefined): Dimension {
  if (value === 'overworld' || value === 'nether' || value === 'end') {
    return value
  }
  return 'overworld'
}
