'use client'

import { useState, useEffect } from 'react'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { Button, Input } from '@/components/ui'

interface AlertFiltersProps {
  searchQuery: string
  typeFilter: string
  severityFilter: string
  statusFilter: string
  dateFilter: string
  onSearchChange: (value: string) => void
  onTypeChange: (value: string) => void
  onSeverityChange: (value: string) => void
  onStatusChange: (value: string) => void
  onDateChange: (value: string) => void
  onClearFilters: () => void
}

export default function AlertFilters({
  searchQuery,
  typeFilter,
  severityFilter,
  statusFilter,
  dateFilter,
  onSearchChange,
  onTypeChange,
  onSeverityChange,
  onStatusChange,
  onDateChange,
  onClearFilters
}: AlertFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  // Auto-show filters if any are active
  useEffect(() => {
    if (typeFilter || severityFilter || statusFilter || dateFilter) {
      setShowFilters(true)
    }
  }, [typeFilter, severityFilter, statusFilter, dateFilter])

  const activeFiltersCount = [typeFilter, severityFilter, statusFilter, dateFilter].filter(Boolean).length

  const alertTypes = [
    { value: '', label: 'All Types' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'alert', label: 'Alert' },
    { value: 'order', label: 'Order' },
    { value: 'system', label: 'System' }
  ]

  const severityLevels = [
    { value: '', label: 'All Severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ]

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
    { value: 'unacknowledged', label: 'Unacknowledged' },
    { value: 'acknowledged', label: 'Acknowledged' }
  ]

  const dateOptions = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Past Week' },
    { value: 'month', label: 'Past Month' }
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Search and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search alerts by title or message..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <FunnelIcon className="w-4 h-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="flex items-center space-x-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-700"
            >
              <XMarkIcon className="w-4 h-4" />
              <span>Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          {/* Alert Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => onTypeChange(e.target.value)}
              className="w-full rounded-md border border-gray-400 bg-white py-2 px-3 text-sm text-gray-900 font-medium hover:border-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
            >
              {alertTypes.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="text-gray-900 font-medium"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity Level
            </label>
            <select
              value={severityFilter}
              onChange={(e) => onSeverityChange(e.target.value)}
              className="w-full rounded-md border border-gray-400 bg-white py-2 px-3 text-sm text-gray-900 font-medium hover:border-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
            >
              {severityLevels.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="text-gray-900 font-medium"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full rounded-md border border-gray-400 bg-white py-2 px-3 text-sm text-gray-900 font-medium hover:border-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
            >
              {statusOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="text-gray-900 font-medium"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              Date Range
            </label>
            <select
              value={dateFilter}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full rounded-md border border-gray-400 bg-white py-2 px-3 text-sm text-gray-900 font-medium hover:border-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
            >
              {dateOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="text-gray-900 font-medium"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
          {typeFilter && (
            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Type: {alertTypes.find(t => t.value === typeFilter)?.label}
              <button
                onClick={() => onTypeChange('')}
                className="ml-1 hover:text-blue-900"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}

          {severityFilter && (
            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
              Severity: {severityLevels.find(s => s.value === severityFilter)?.label}
              <button
                onClick={() => onSeverityChange('')}
                className="ml-1 hover:text-orange-900"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}

          {statusFilter && (
            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Status: {statusOptions.find(s => s.value === statusFilter)?.label}
              <button
                onClick={() => onStatusChange('')}
                className="ml-1 hover:text-green-900"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}

          {dateFilter && (
            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
              Date: {dateOptions.find(d => d.value === dateFilter)?.label}
              <button
                onClick={() => onDateChange('')}
                className="ml-1 hover:text-purple-900"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}