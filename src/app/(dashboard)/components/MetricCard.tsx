import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface MetricCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    period: string
  }
  icon: ReactNode
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  isLoading?: boolean
}

export default function MetricCard({
  title,
  value,
  change,
  icon,
  color = 'primary',
  isLoading = false
}: MetricCardProps) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    secondary: 'bg-blue-50 text-blue-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    danger: 'bg-red-50 text-red-600'
  }

  const changeColorClasses = change && change.value >= 0
    ? 'text-green-600 bg-green-50'
    : 'text-red-600 bg-red-50'

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="ml-4 flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', colorClasses[color])}>
            {icon}
          </div>
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600 truncate">{title}</h3>
            {change && (
              <span className={clsx(
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                changeColorClasses
              )}>
                {change.value >= 0 ? '+' : ''}{change.value}% {change.period}
              </span>
            )}
          </div>
          <div className="mt-2">
            <div className="text-2xl font-semibold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}