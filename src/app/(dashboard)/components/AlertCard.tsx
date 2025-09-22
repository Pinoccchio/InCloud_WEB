import { clsx } from 'clsx'
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface AlertCardProps {
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp?: string
  onDismiss?: () => void
  onAcknowledge?: () => void
  isAcknowledged?: boolean
}

export default function AlertCard({
  title,
  message,
  type,
  timestamp,
  onDismiss,
  onAcknowledge,
  isAcknowledged = false
}: AlertCardProps) {
  const typeConfig = {
    info: {
      icon: InformationCircleIcon,
      colors: 'bg-blue-50 border-blue-200 text-blue-800',
      iconColors: 'text-blue-500'
    },
    success: {
      icon: CheckCircleIcon,
      colors: 'bg-green-50 border-green-200 text-green-800',
      iconColors: 'text-green-500'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      colors: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      iconColors: 'text-yellow-500'
    },
    error: {
      icon: XCircleIcon,
      colors: 'bg-red-50 border-red-200 text-red-800',
      iconColors: 'text-red-500'
    }
  }

  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div className={clsx(
      'border rounded-lg p-4 transition-all duration-200',
      config.colors,
      isAcknowledged && 'opacity-60'
    )}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={clsx('h-5 w-5', config.iconColors)} />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold">
                {title}
                {isAcknowledged && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    Acknowledged
                  </span>
                )}
              </h3>
              <div className="mt-1 text-sm">
                {message}
              </div>
              {timestamp && (
                <div className="mt-2 text-xs opacity-75">
                  {timestamp}
                </div>
              )}
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="ml-4 text-sm opacity-60 hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            )}
          </div>

          {onAcknowledge && !isAcknowledged && (
            <div className="mt-3">
              <button
                onClick={onAcknowledge}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 transition-colors"
              >
                Acknowledge
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}