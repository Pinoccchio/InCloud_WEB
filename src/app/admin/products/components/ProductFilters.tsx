'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Input, Button } from '@/components/ui'
import { supabase } from '@/lib/supabase/auth'
import { Database } from '@/types/supabase'

type Category = Database['public']['Tables']['categories']['Row']
type Brand = Database['public']['Tables']['brands']['Row']

interface ProductFiltersProps {
  searchQuery: string
  categoryFilter: string
  brandFilter: string
  statusFilter: string
  stockFilter: string
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onBrandChange: (value: string) => void
  onStatusChange: (value: string) => void
  onStockFilterChange: (value: string) => void
  onClearFilters: () => void
}

export default function ProductFilters({
  searchQuery,
  categoryFilter,
  brandFilter,
  statusFilter,
  stockFilter,
  onSearchChange,
  onCategoryChange,
  onBrandChange,
  onStatusChange,
  onStockFilterChange,
  onClearFilters
}: ProductFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFilterOptions()
  }, [])

  const loadFilterOptions = async () => {
    try {
      setLoading(true)

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (categoriesError) throw categoriesError

      // Load brands
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (brandsError) throw brandsError

      setCategories(categoriesData || [])
      setBrands(brandsData || [])
    } catch (error) {
      console.error('Failed to load filter options:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasActiveFilters = !!(
    searchQuery ||
    categoryFilter ||
    brandFilter ||
    statusFilter ||
    stockFilter
  )

  const activeFilterCount = [
    categoryFilter,
    brandFilter,
    statusFilter,
    stockFilter
  ].filter(Boolean).length

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      {/* Search Bar */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search products by name, SKU, or description..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center"
        >
          <FunnelIcon className="w-4 h-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 bg-primary-100 text-primary-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={onClearFilters}
            className="flex items-center text-gray-600"
          >
            <XMarkIcon className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => onCategoryChange(e.target.value)}
                disabled={loading}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand
              </label>
              <select
                value={brandFilter}
                onChange={(e) => onBrandChange(e.target.value)}
                disabled={loading}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>

            {/* Stock Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Level
              </label>
              <select
                value={stockFilter}
                onChange={(e) => onStockFilterChange(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              >
                <option value="">All Stock Levels</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="no-inventory">No Inventory Setup</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Quick filters:</span>

              <Button
                type="button"
                size="sm"
                variant={stockFilter === 'low-stock' ? 'primary' : 'outline'}
                onClick={() => onStockFilterChange(stockFilter === 'low-stock' ? '' : 'low-stock')}
                className="text-xs"
              >
                Low Stock
              </Button>

              <Button
                type="button"
                size="sm"
                variant={stockFilter === 'out-of-stock' ? 'primary' : 'outline'}
                onClick={() => onStockFilterChange(stockFilter === 'out-of-stock' ? '' : 'out-of-stock')}
                className="text-xs"
              >
                Out of Stock
              </Button>

              <Button
                type="button"
                size="sm"
                variant={statusFilter === 'active' ? 'primary' : 'outline'}
                onClick={() => onStatusChange(statusFilter === 'active' ? '' : 'active')}
                className="text-xs"
              >
                Active Products
              </Button>

              <Button
                type="button"
                size="sm"
                variant={statusFilter === 'inactive' ? 'primary' : 'outline'}
                onClick={() => onStatusChange(statusFilter === 'inactive' ? '' : 'inactive')}
                className="text-xs"
              >
                Inactive Products
              </Button>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>

                {searchQuery && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    Search: &ldquo;{searchQuery}&rdquo;
                    <button
                      type="button"
                      onClick={() => onSearchChange('')}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {categoryFilter && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Category: {categories.find(c => c.id === categoryFilter)?.name}
                    <button
                      type="button"
                      onClick={() => onCategoryChange('')}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {brandFilter && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Brand: {brands.find(b => b.id === brandFilter)?.name}
                    <button
                      type="button"
                      onClick={() => onBrandChange('')}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {statusFilter && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Status: {statusFilter}
                    <button
                      type="button"
                      onClick={() => onStatusChange('')}
                      className="ml-2 text-yellow-600 hover:text-yellow-800"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {stockFilter && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Stock: {stockFilter.replace('-', ' ')}
                    <button
                      type="button"
                      onClick={() => onStockFilterChange('')}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}