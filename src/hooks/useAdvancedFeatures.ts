export function getShowAdvancedFromSearch(search: string): boolean {
  return new URLSearchParams(search).get('advanced') === 'true'
}

export function useAdvancedFeatures(): boolean {
  if (typeof window === 'undefined') return false
  return getShowAdvancedFromSearch(window.location.search)
}
