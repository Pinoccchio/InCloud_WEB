'use client'

import { ReactNode } from 'react'

interface MetricsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: {
    value: number
    label: string
  }
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

export default function MetricsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary',
}: MetricsCardProps) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    secondary: 'bg-blue-50 text-blue-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    danger: 'bg-red-50 text-red-600',
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span
                className={`ml-2 text-sm font-medium ${
                  trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.value >= 0 ? '+' : ''}
                {trend.value}%
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <p className="mt-1 text-xs text-gray-500">{trend.label}</p>
          )}
        </div>
        {icon && (
          <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}