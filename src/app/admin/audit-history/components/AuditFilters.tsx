'use client'

import { Card, Input } from '@/components/ui'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { FilterState } from '../page'

interface AuditFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

export function AuditFilters({ filters, onFiltersChange }: AuditFiltersProps) {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => updateFilter('dateRange', e.target.value)}
            className="w-full rounded-md border border-gray-400 bg-white py-2 px-3 text-sm text-gray-900 font-medium hover:border-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="all">All time</option>
            <option value="custom">Custom range</option>
          </select>
        </div>

        {/* Custom Date Range */}
        {filters.dateRange === 'custom' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => updateFilter('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => updateFilter('endDate', e.target.value)}
              />
            </div>
          </>
        )}

        {/* Action Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Action Type
          </label>
          <select
            value={filters.actionType}
            onChange={(e) => updateFilter('actionType', e.target.value)}
            className="w-full rounded-md border border-gray-400 bg-white py-2 px-3 text-sm text-gray-900 font-medium hover:border-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
          >
            <option value="all">All Actions</option>
            <option value="create">CREATE</option>
            <option value="update">UPDATE</option>
            <option value="delete">DELETE</option>
            <option value="read">READ</option>
            <option value="login">LOGIN</option>
            <option value="logout">LOGOUT</option>
            <option value="password_change">PASSWORD CHANGE</option>
            <option value="permission_grant">PERMISSION GRANT</option>
            <option value="permission_revoke">PERMISSION REVOKE</option>
          </select>
        </div>

        {/* Table Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Table
          </label>
          <select
            value={filters.tableName}
            onChange={(e) => updateFilter('tableName', e.target.value)}
            className="w-full rounded-md border border-gray-400 bg-white py-2 px-3 text-sm text-gray-900 font-medium hover:border-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
          >
            <option value="all">All Tables</option>
            <option value="orders">Orders</option>
            <option value="products">Products</option>
            <option value="inventory">Inventory</option>
            <option value="product_batches">Product Batches</option>
            <option value="price_tiers">Price Tiers</option>
            <option value="customers">Customers</option>
            <option value="order_items">Order Items</option>
            <option value="stock_transfers">Stock Transfers</option>
            <option value="restock_history">Restock History</option>
          </select>
        </div>

        {/* Search */}
        <div className={filters.dateRange === 'custom' ? 'lg:col-span-2' : ''}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              placeholder="Search in summary or reason..."
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(filters.actionType !== 'all' || filters.tableName !== 'all' || filters.searchQuery) && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Active filters:</span>
          {filters.actionType !== 'all' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Action: {filters.actionType.toUpperCase()}
            </span>
          )}
          {filters.tableName !== 'all' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Table: {filters.tableName}
            </span>
          )}
          {filters.searchQuery && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Search: {filters.searchQuery}
            </span>
          )}
          <button
            onClick={() => onFiltersChange({
              ...filters,
              actionType: 'all',
              tableName: 'all',
              searchQuery: ''
            })}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </Card>
  )
}
