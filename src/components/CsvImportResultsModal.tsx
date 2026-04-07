import { BaseModal } from './BaseModal'
import { Button } from './Button'

export interface CsvImportResultsModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  added: number
  orphaned: number
  /** e.g. "village" / "Jungle Temple" for count === 1 */
  singularLabel: string
  /** e.g. "villages" / "jungle temples" for count !== 1 */
  pluralLabel: string
}

export function CsvImportResultsModal({
  isOpen,
  onClose,
  title,
  added,
  orphaned,
  singularLabel,
  pluralLabel,
}: CsvImportResultsModalProps) {
  const itemWord = (n: number) => (n === 1 ? singularLabel : pluralLabel)

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4 text-sm text-gray-300">
        {added === 0 && orphaned === 0 ? (
          <p className="text-gray-400">
            No rows were imported. Check that the file uses the expected header (e.g.{' '}
            <code className="text-gray-500 text-xs">seed;structure;x;y;z;details</code>
            {' '}for structures and villages) and contains data rows below it.
          </p>
        ) : (
          <div className="space-y-3">
            <p>
              <span className="font-semibold text-white">{added}</span> {itemWord(added)} placed inside regions.
            </p>
            {orphaned > 0 ? (
              <p className="text-amber-200/95 rounded-md border border-amber-700/50 bg-amber-950/30 px-3 py-2">
                <span className="font-semibold text-amber-100">{orphaned}</span> {itemWord(orphaned)} did not fall
                inside any region polygon. They are shown as <span className="text-amber-50">red dots</span> on the map.
              </p>
            ) : (
              <p className="text-gray-500 text-xs">Every row from the file matched a containing region.</p>
            )}
          </div>
        )}
        <Button type="button" variant="secondary" className="w-full" onClick={onClose}>
          OK
        </Button>
      </div>
    </BaseModal>
  )
}
