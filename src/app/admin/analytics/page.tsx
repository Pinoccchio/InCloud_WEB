'use client'

import { ChartBarIcon } from '@heroicons/react/24/outline'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-600 mt-1">
          Descriptive and prescriptive analytics for data-driven decision making
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <ChartBarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Analytics Dashboard Coming Soon
          </h3>
          <p className="text-gray-500">
            Advanced analytics with AI-powered insights and recommendations
          </p>
        </div>
      </div>
    </div>
  )
}