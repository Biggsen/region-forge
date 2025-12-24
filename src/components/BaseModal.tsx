import { ReactNode } from 'react'
import { X } from 'lucide-react'

interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  closeOnBackdropClick?: boolean
  className?: string
  contentClassName?: string
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdropClick = true,
  className = '',
  contentClassName = '',
}: BaseModalProps) {
  if (!isOpen) return null

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      onClose()
    }
  }

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] ${className}`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-eerie-back border border-gunmetal rounded-lg p-6 ${sizeClasses[size]} w-full mx-4 ${contentClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || closeOnBackdropClick) && (
          <div className="flex items-center justify-between mb-4">
            {title && (
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            )}
            {closeOnBackdropClick && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors ml-auto"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

