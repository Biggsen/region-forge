import { useState, useEffect } from 'react'
import { BaseModal } from './BaseModal'
import { Button } from './Button'

interface RegionDescriptionModalProps {
  isOpen: boolean
  description: string
  onSave: (description: string) => void
  onClose: () => void
}

export function RegionDescriptionModal({
  isOpen,
  description,
  onSave,
  onClose
}: RegionDescriptionModalProps) {
  const [value, setValue] = useState(description)

  useEffect(() => {
    if (isOpen) {
      setValue(description)
    }
  }, [isOpen, description])

  const handleSave = () => {
    onSave(value.trim() || '')
    onClose()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Region Description / Lore"
      size="2xl"
    >
      <div className="space-y-4">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add lore or description for this region..."
          rows={16}
          className="w-full bg-input-bg text-input-text px-3 py-2 rounded border border-input-border focus:outline-none focus:border-lapis-lighter placeholder:text-gray-500 resize-y min-h-[24rem]"
        />
        <div className="flex space-x-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="flex-1"
          >
            Save
          </Button>
        </div>
      </div>
    </BaseModal>
  )
}
