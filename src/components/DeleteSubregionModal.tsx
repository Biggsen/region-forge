import { BaseModal } from './BaseModal'
import { Button } from './Button'

interface DeleteSubregionModalProps {
  isOpen: boolean
  targetLabel: string
  targetName: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteSubregionModal({
  isOpen,
  targetLabel,
  targetName,
  onConfirm,
  onCancel
}: DeleteSubregionModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={`Delete ${targetLabel}`}
      size="md"
    >
      <div className="mb-6">
        <p className="text-gray-300">
          Delete <span className="text-white font-medium">{targetName}</span>? This action cannot be undone.
        </p>
      </div>

      <div className="flex space-x-3">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="secondary"
          onClick={onConfirm}
          className="flex-1"
        >
          Delete
        </Button>
      </div>
    </BaseModal>
  )
}
