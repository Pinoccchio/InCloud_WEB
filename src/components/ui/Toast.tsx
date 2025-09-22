'use client'

import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useToast } from '@/contexts/ToastContext'
import type { Toast as ToastType } from '@/contexts/ToastContext'

interface ToastProps {
  toast: ToastType
}

export function Toast({ toast }: ToastProps) {
  const { removeToast } = useToast()
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => removeToast(toast.id), 300) // Match exit animation duration
  }

  const getToastStyles = () => {
    const baseStyles = "relative flex w-full max-w-sm mx-auto mt-4 overflow-hidden bg-white rounded-lg shadow-lg border border-gray-200"

    switch (toast.type) {
      case 'success':
        return clsx(baseStyles, "border-l-4 border-l-green-500")
      case 'error':
        return clsx(baseStyles, "border-l-4 border-l-red-500")
      case 'warning':
        return clsx(baseStyles, "border-l-4 border-l-orange-500")
      case 'info':
        return clsx(baseStyles, "border-l-4 border-l-blue-500")
      default:
        return baseStyles
    }
  }

  const getIconAndColors = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: CheckCircleIcon,
          iconColor: 'text-green-500',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        }
      case 'error':
        return {
          icon: XCircleIcon,
          iconColor: 'text-red-500',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700'
        }
      case 'warning':
        return {
          icon: ExclamationTriangleIcon,
          iconColor: 'text-orange-500',
          titleColor: 'text-orange-800',
          messageColor: 'text-orange-700'
        }
      case 'info':
        return {
          icon: InformationCircleIcon,
          iconColor: 'text-blue-500',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        }
      default:
        return {
          icon: InformationCircleIcon,
          iconColor: 'text-gray-500',
          titleColor: 'text-gray-800',
          messageColor: 'text-gray-700'
        }
    }
  }

  const { icon: Icon, iconColor, titleColor, messageColor } = getIconAndColors()

  return (
    <div
      className={clsx(
        getToastStyles(),
        "transform transition-all duration-300 ease-in-out",
        isVisible && !isExiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      {/* Content */}
      <div className="flex items-start p-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon className={clsx("w-6 h-6", iconColor)} />
        </div>

        {/* Text Content */}
        <div className="ml-3 flex-1">
          <div className={clsx("text-sm font-semibold", titleColor)}>
            {toast.title}
          </div>
          {toast.message && (
            <div className={clsx("text-sm mt-1", messageColor)}>
              {toast.message}
            </div>
          )}
          {toast.action && (
            <div className="mt-2">
              <button
                onClick={toast.action.onClick}
                className={clsx(
                  "text-sm font-medium underline hover:no-underline transition-all duration-200",
                  toast.type === 'success' && "text-green-600 hover:text-green-800",
                  toast.type === 'error' && "text-red-600 hover:text-red-800",
                  toast.type === 'warning' && "text-orange-600 hover:text-orange-800",
                  toast.type === 'info' && "text-blue-600 hover:text-blue-800"
                )}
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleClose}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-md p-1 transition-colors duration-200"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar (for timed toasts) */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
          <div
            className={clsx(
              "h-full transition-all ease-linear",
              toast.type === 'success' && "bg-green-500",
              toast.type === 'error' && "bg-red-500",
              toast.type === 'warning' && "bg-orange-500",
              toast.type === 'info' && "bg-blue-500"
            )}
            style={{
              animation: `shrink ${toast.duration}ms linear forwards`
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}