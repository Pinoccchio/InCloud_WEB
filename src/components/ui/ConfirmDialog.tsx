'use client'

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { ExclamationTriangleIcon, InformationCircleIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Button } from './Button'
import { clsx } from 'clsx'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'danger' | 'info'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false
}: ConfirmDialogProps) {

  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: TrashIcon,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmVariant: 'primary' as const,
          confirmClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        }
      case 'warning':
        return {
          icon: ExclamationTriangleIcon,
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          confirmVariant: 'primary' as const,
          confirmClass: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
        }
      case 'info':
      default:
        return {
          icon: InformationCircleIcon,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          confirmVariant: 'primary' as const,
          confirmClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        }
    }
  }

  const { icon: Icon, iconBg, iconColor, confirmVariant, confirmClass } = getTypeConfig()

  const handleConfirm = () => {
    onConfirm()
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            <div className="flex items-start">
              {/* Icon */}
              <div className={clsx("flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mr-4", iconBg)}>
                <Icon className={clsx("w-6 h-6", iconColor)} />
              </div>

              {/* Content */}
              <div className="flex-1">
                <DialogTitle className="text-lg font-semibold text-gray-900 mb-2">
                  {title}
                </DialogTitle>
                <p className="text-sm text-gray-600 mb-6">
                  {message}
                </p>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    {cancelText}
                  </Button>
                  <Button
                    type="button"
                    variant={confirmVariant}
                    onClick={handleConfirm}
                    isLoading={isLoading}
                    disabled={isLoading}
                    className={confirmClass}
                  >
                    {isLoading ? 'Processing...' : confirmText}
                  </Button>
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}