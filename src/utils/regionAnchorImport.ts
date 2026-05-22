export type RegionAnchorImportResult = {
  regionsUpdated: number
  orphaned: number
  heartRows?: number
  nerveRows?: number
}

type ToastType = 'success' | 'error' | 'warning'

export async function runRegionAnchorCsvImport(
  file: File,
  importFn: (text: string) => RegionAnchorImportResult,
  options: {
    rowKey: 'heartRows' | 'nerveRows'
    noRowsToast: string
    failureMessage: string
  },
  showToast: (message: string, type: ToastType) => void
): Promise<{ error: string | null }> {
  try {
    const text = await file.text()
    if (!text.trim()) {
      throw new Error('File is empty or contains no valid data')
    }
    const result = importFn(text)
    const rowCount = result[options.rowKey] ?? 0
    if (rowCount === 0) {
      showToast(options.noRowsToast, 'error')
    } else {
      const msg = [
        `Updated ${result.regionsUpdated} region${result.regionsUpdated === 1 ? '' : 's'}`,
        result.orphaned > 0
          ? `${result.orphaned} row${result.orphaned === 1 ? '' : 's'} not inside any region`
          : null
      ]
        .filter(Boolean)
        .join('. ')
      showToast(msg, result.orphaned > 0 ? 'warning' : 'success')
    }
    return { error: null }
  } catch (error) {
    console.error(`${options.failureMessage}:`, error)
    return {
      error: error instanceof Error ? error.message : options.failureMessage
    }
  }
}
