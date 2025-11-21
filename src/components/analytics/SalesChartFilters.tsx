'use client'

import { useState } from 'react'

export type DateRangeOption = 'last3months' | 'currentYear' | 'lastYear' | 'allTime' | 'custom'

interface SalesChartFiltersProps {
  onFilterChange: (startDate?: string, endDate?: string) => void
}

export default function SalesChartFilters({ onFilterChange }: SalesChartFiltersProps) {
  const [selectedOption, setSelectedOption] = useState<DateRangeOption>('allTime')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const handleOptionChange = (option: DateRangeOption) => {
    setSelectedOption(option)

    const now = new Date()
    let startDate: string | undefined
    let endDate: string | undefined

    switch (option) {
      case 'last3months':
        const threeMonthsAgo = new Date(now)
        threeMonthsAgo.setMonth(now.getMonth() - 3)
        startDate = threeMonthsAgo.toISOString().split('T')[0]
        endDate = now.toISOString().split('T')[0]
        break

      case 'currentYear':
        startDate = `${now.getFullYear()}-01-01`
        endDate = now.toISOString().split('T')[0]
        break

      case 'lastYear':
        startDate = `${now.getFullYear() - 1}-01-01`
        endDate = `${now.getFullYear() - 1}-12-31`
        break

      case 'allTime':
        startDate = undefined
        endDate = undefined
        break

      case 'custom':
        // Don't trigger onChange yet, wait for user to select dates
        return
    }

    onFilterChange(startDate, endDate)
  }

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      onFilterChange(customStartDate, customEndDate)
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleOptionChange('last3months')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedOption === 'last3months'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          Last 3 Months
        </button>
        <button
          onClick={() => handleOptionChange('currentYear')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedOption === 'currentYear'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          Current Year
        </button>
        <button
          onClick={() => handleOptionChange('lastYear')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedOption === 'lastYear'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          Last Year
        </button>
        <button
          onClick={() => handleOptionChange('allTime')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedOption === 'allTime'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          All Time
        </button>
        <button
          onClick={() => handleOptionChange('custom')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedOption === 'custom'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          Custom Range
        </button>
      </div>

      {selectedOption === 'custom' && (
        <div className="flex flex-wrap gap-4 items-end pt-2 border-t border-gray-200">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-900 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-900 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
          <button
            onClick={handleCustomDateApply}
            disabled={!customStartDate || !customEndDate}
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}
