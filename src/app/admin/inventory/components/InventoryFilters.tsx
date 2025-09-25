'use client'

import { useState, useEffect } from 'react'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { Button, Input } from '@/components/ui'
import { supabase } from '@/lib/supabase/auth'

interface InventoryFiltersProps {
  searchQuery: string
  categoryFilter: string
  brandFilter: string
  stockStatusFilter: string
  expirationFilter: string
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onBrandChange: (value: string) => void
  onStockStatusChange: (value: string) => void
  onExpirationChange: (value: string) => void
  onClearFilters: () => void
}

interface Category {
  id: string
  name: string
}

interface Brand {
  id: string
  name: string
}

export default function InventoryFilters({
  searchQuery,
  categoryFilter,
  brandFilter,
  stockStatusFilter,
  expirationFilter,
  onSearchChange,
  onCategoryChange,
  onBrandChange,
  onStockStatusChange,
  onExpirationChange,
  onClearFilters
}: InventoryFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setLoading(true)

        // Load categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .eq('is_active', true)
          .order('name')

        if (categoriesError) throw categoriesError

        // Load brands
        const { data: brandsData, error: brandsError } = await supabase
          .from('brands')
          .select('id, name')
          .eq('is_active', true)
          .order('name')

        if (brandsError) throw brandsError

        setCategories(categoriesData || [])
        setBrands(brandsData || [])
      } catch (error) {
        console.error('Error loading filter options:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFilterOptions()
  }, [])

  const hasActiveFilters = categoryFilter || brandFilter || stockStatusFilter || expirationFilter || searchQuery

  const stockStatusOptions = [
    { value: 'healthy', label: 'Healthy Stock', color: 'text-green-600' },
    { value: 'low', label: 'Low Stock', color: 'text-yellow-600' },
    { value: 'critical', label: 'Critical Stock', color: 'text-orange-600' },
    { value: 'out', label: 'Out of Stock', color: 'text-red-600' }
  ]

  const expirationOptions = [
    { value: 'fresh', label: 'Fresh Products', color: 'text-green-600' },
    { value: 'expiring', label: 'Expiring Soon', color: 'text-yellow-600' },
    { value: 'expired', label: 'Expired Products', color: 'text-red-600' }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by product name, SKU, or brand..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="flex items-center whitespace-nowrap"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Active
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={onClearFilters}
                className="flex items-center text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {isAdvancedOpen && (
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
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
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.name}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Status
                </label>
                <select
                  value={stockStatusFilter}
                  onChange={(e) => onStockStatusChange(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  {stockStatusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expiration Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiration Status
                </label>
                <select
                  value={expirationFilter}
                  onChange={(e) => onExpirationChange(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Products</option>
                  {expirationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-500">Active filters:</span>

                  {searchQuery && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Search: &ldquo;{searchQuery}&rdquo;
                      <button
                        onClick={() => onSearchChange('')}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {categoryFilter && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Category: {categoryFilter}
                      <button
                        onClick={() => onCategoryChange('')}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-500"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {brandFilter && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      Brand: {brandFilter}
                      <button
                        onClick={() => onBrandChange('')}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {stockStatusFilter && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Stock: {stockStatusOptions.find(opt => opt.value === stockStatusFilter)?.label}
                      <button
                        onClick={() => onStockStatusChange('')}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-500"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {expirationFilter && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Expiration: {expirationOptions.find(opt => opt.value === expirationFilter)?.label}
                      <button
                        onClick={() => onExpirationChange('')}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-yellow-400 hover:bg-yellow-200 hover:text-yellow-500"
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
    </div>
  )
}