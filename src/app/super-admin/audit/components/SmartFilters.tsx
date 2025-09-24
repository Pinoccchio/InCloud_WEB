'use client'

import React, { useState, memo } from 'react'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CalendarDaysIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'
import { AuditFilters } from '../hooks/useAuditLogs'

interface SmartFiltersProps {
  filters: AuditFilters
  admins: Array<{
    id: string
    full_name: string
    role: string
  }>
  onFiltersChange: (filters: Partial<AuditFilters>) => void
  onClearFilters: () => void
  isLoading?: boolean
}

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'permission_grant', label: 'Permission Grant' },
  { value: 'permission_revoke', label: 'Permission Revoke' }
]

const TABLE_OPTIONS = [
  { value: '', label: 'All Tables' },
  { value: 'admins', label: 'Admins' },
  { value: 'products', label: 'Products' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'orders', label: 'Orders' },
  { value: 'customers', label: 'Customers' },
  { value: 'system_settings', label: 'System Settings' },
  { value: 'branches', label: 'Branches' },
  { value: 'categories', label: 'Categories' },
  { value: 'brands', label: 'Brands' }
]

const SmartFilters = memo(function SmartFilters({
  filters,
  admins,
  onFiltersChange,
  onClearFilters,
  isLoading = false
}: SmartFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  // Get date helpers
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const handleQuickDateRange = (fromDate: string, toDate: string) => {
    onFiltersChange({ dateFrom: fromDate, dateTo: toDate })
  }

  const clearDateRange = () => {
    onFiltersChange({ dateFrom: '', dateTo: '' })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Audit Filters</h3>
          </div>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              {Object.values(filters).filter(v => v !== '').length} Active
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-700 flex items-center"
          >
            <ChevronDownIcon className={`w-4 h-4 mr-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <XMarkIcon className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by admin name, action, table, or summary..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* Quick Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Type
            </label>
            <select
              value={filters.action}
              onChange={(e) => onFiltersChange({ action: e.target.value })}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {ACTION_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Admin Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin User
            </label>
            <select
              value={filters.adminId}
              onChange={(e) => onFiltersChange({ adminId: e.target.value })}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Admins</option>
              {admins.map(admin => (
                <option key={admin.id} value={admin.id}>
                  {admin.full_name} ({admin.role === 'super_admin' ? 'Super Admin' : 'Admin'})
                </option>
              ))}
            </select>
          </div>

          {/* Table Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Table Name
            </label>
            <select
              value={filters.tableName}
              onChange={(e) => onFiltersChange({ tableName: e.target.value })}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {TABLE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t border-gray-200 pt-6 space-y-6">
            {/* Date Range Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                <CalendarDaysIcon className="w-4 h-4 mr-2 text-gray-500" />
                Date Range
              </h4>

              {/* Date Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => onFiltersChange({ dateFrom: e.target.value })}
                    max={today}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => onFiltersChange({ dateTo: e.target.value })}
                    max={today}
                    min={filters.dateFrom || undefined}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Quick Date Range Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateRange(today, today)}
                  className="text-xs"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateRange(yesterday.toISOString().split('T')[0], yesterday.toISOString().split('T')[0])}
                  className="text-xs"
                >
                  Yesterday
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateRange(weekAgo.toISOString().split('T')[0], today)}
                  className="text-xs"
                >
                  Last 7 Days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateRange(thirtyDaysAgo.toISOString().split('T')[0], today)}
                  className="text-xs"
                >
                  Last 30 Days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearDateRange}
                  className="text-xs"
                >
                  All Time
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FunnelIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Active Filters:</h4>
                <div className="flex flex-wrap gap-2">
                  {filters.search && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      Search: &quot;{filters.search}&quot;
                    </span>
                  )}
                  {filters.action && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      Action: {ACTION_OPTIONS.find(a => a.value === filters.action)?.label}
                    </span>
                  )}
                  {filters.adminId && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      Admin: {admins.find(a => a.id === filters.adminId)?.full_name}
                    </span>
                  )}
                  {filters.tableName && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      Table: {TABLE_OPTIONS.find(t => t.value === filters.tableName)?.label}
                    </span>
                  )}
                  {filters.dateFrom && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      From: {filters.dateFrom}
                    </span>
                  )}
                  {filters.dateTo && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      To: {filters.dateTo}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default SmartFilters