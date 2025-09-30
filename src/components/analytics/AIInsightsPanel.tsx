'use client'

import {
  ExclamationTriangleIcon,
  LightBulbIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

interface PrescriptiveInsight {
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  action: string
  expectedImpact: string
  timeframe: string
}

interface AIInsightsPanelProps {
  summary: string
  keyRecommendations: string[]
  insights: PrescriptiveInsight[]
  isLoading?: boolean
}

export default function AIInsightsPanel({
  summary,
  keyRecommendations,
  insights,
  isLoading = false,
}: AIInsightsPanelProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-red-200 bg-red-50'
      case 'high':
        return 'border-orange-200 bg-orange-50'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50'
      case 'low':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <SparklesIcon className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI Analysis Summary
            </h3>
            <p className="text-gray-700">{summary}</p>
          </div>
        </div>
      </div>

      {/* Key Recommendations */}
      {keyRecommendations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <LightBulbIcon className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Top Recommendations
            </h3>
          </div>
          <ul className="space-y-2">
            {keyRecommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary-600 font-bold">{index + 1}.</span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Insights */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Detailed Insights</h3>
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`border rounded-lg p-5 ${getPriorityColor(insight.priority)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${getPriorityBadgeColor(insight.priority)}`}
                  >
                    {insight.priority}
                  </span>
                  <span className="text-xs font-medium text-gray-600">
                    {insight.category}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-gray-900">
                  {insight.title}
                </h4>
              </div>
              {insight.priority === 'critical' && (
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
              )}
            </div>

            <p className="text-sm text-gray-700 mb-3">{insight.description}</p>

            <div className="space-y-2">
              <div className="bg-white bg-opacity-50 rounded p-3">
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Recommended Action:
                </p>
                <p className="text-sm text-gray-900">{insight.action}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white bg-opacity-50 rounded p-2">
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    Expected Impact:
                  </p>
                  <p className="text-xs text-gray-900">{insight.expectedImpact}</p>
                </div>
                <div className="bg-white bg-opacity-50 rounded p-2">
                  <p className="text-xs font-medium text-gray-600 mb-1">Timeframe:</p>
                  <p className="text-xs text-gray-900 capitalize">
                    {insight.timeframe}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}