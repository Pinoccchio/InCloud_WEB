'use client'

import { ChartBarSquareIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

interface EmptyStateChartProps {
  selectedFilter?: string
}

export default function EmptyStateChart({ selectedFilter }: EmptyStateChartProps) {
  const getFilterLabel = () => {
    if (!selectedFilter) return 'the selected period'

    const filterDate = new Date(selectedFilter)
    const year = filterDate.getFullYear()
    const currentYear = new Date().getFullYear()

    if (year === currentYear - 1) {
      return `Last Year (${year})`
    }
    if (year === currentYear) {
      return `Current Year (${year})`
    }

    return 'the selected period'
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Icon */}
      <div className="relative mb-4">
        <ChartBarSquareIcon className="w-20 h-20 text-gray-300" />
        <div className="absolute -top-1 -right-1 bg-blue-100 rounded-full p-1">
          <InformationCircleIcon className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {/* Message */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No Sales Data Found
      </h3>
      <p className="text-gray-600 text-center max-w-md mb-4">
        There are no orders recorded for {getFilterLabel()}.
      </p>

      {/* Context Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
        <div className="flex items-start gap-2">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Sales data available from October 2025</p>
            <p className="text-blue-700">
              Try selecting <span className="font-semibold">"Current Year"</span> or{' '}
              <span className="font-semibold">"All Time"</span> to view available sales data.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
