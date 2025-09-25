'use client'

import { useState, useEffect } from 'react'
import {
  PlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabase/auth'
import { getMainBranchId } from '@/lib/constants/branch'

// Component imports
import InventoryTable from './components/InventoryTable'
import InventoryFilters from './components/InventoryFilters'
import RestockModal from './components/RestockModal'
import InventoryAnalytics from './components/InventoryAnalytics'
import BatchDetailsModal from './components/BatchDetailsModal'

interface InventoryItem {
  id: string
  product_name: string
  sku: string
  brand_name: string
  category_name: string
  quantity: number
  available_quantity: number
  reserved_quantity: number
  low_stock_threshold: number
  cost_per_unit: number
}

interface InventoryStats {
  totalProducts: number
  lowStockItems: number
  expiringSoon: number
  totalValue: number
}

export default function InventoryPage() {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [stockStatusFilter, setStockStatusFilter] = useState('')
  const [expirationFilter, setExpirationFilter] = useState('')

  // Modal states
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false)
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false)
  const [isBatchDetailsModalOpen, setIsBatchDetailsModalOpen] = useState(false)
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null)

  // Table refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Statistics states
  const [inventoryStats, setInventoryStats] = useState<InventoryStats>({
    totalProducts: 0,
    lowStockItems: 0,
    expiringSoon: 0,
    totalValue: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  const { admin } = useAuth()
  const { addToast } = useToast()

  const handleRestock = () => {
    setSelectedInventoryItem(null)
    setIsRestockModalOpen(true)
  }

  const handleViewBatches = (inventoryItem: InventoryItem) => {
    setSelectedInventoryItem(inventoryItem)
    setIsBatchDetailsModalOpen(true)
  }

  const handleRestockSuccess = () => {
    addToast({
      type: 'success',
      title: 'Restock Completed',
      message: 'Inventory has been successfully updated with new stock.'
    })
    // Refresh the table
    setRefreshTrigger(prev => prev + 1)
  }

  const handleRefreshData = () => {
    setRefreshTrigger(prev => prev + 1)
    // loadInventoryStats() // Disabled for now
    addToast({
      type: 'info',
      title: 'Data Refreshed',
      message: 'Inventory data has been refreshed successfully.'
    })
  }

  const handleExportData = () => {
    addToast({
      type: 'info',
      title: 'Export Started',
      message: 'Inventory data export is being prepared. You will be notified when ready.'
    })
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setCategoryFilter('')
    setBrandFilter('')
    setStockStatusFilter('')
    setExpirationFilter('')
  }

  const loadInventoryStats = async () => {
    try {
      setIsLoadingStats(true)
      const branchId = await getMainBranchId()

      // Load inventory data with product and batch information
      const { data: inventoryData, error } = await supabase
        .from('inventory')
        .select(`
          id,
          quantity,
          available_quantity,
          low_stock_threshold,
          cost_per_unit,
          products!inner (
            id,
            name,
            sku
          ),
          product_batches (
            expiration_date,
            quantity
          )
        `)
        .eq('branch_id', branchId)

      if (error) throw error

      if (inventoryData) {
        const currentDate = new Date()
        const sevenDaysFromNow = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)

        const totalProducts = inventoryData.length
        let lowStockItems = 0
        let expiringSoon = 0
        let totalValue = 0

        inventoryData.forEach((item) => {
          // Calculate total value
          totalValue += (item.quantity || 0) * (item.cost_per_unit || 0)

          // Check for low stock
          const threshold = item.low_stock_threshold || 10
          if (item.available_quantity <= threshold) {
            lowStockItems++
          }

          // Check for expiring items
          item.product_batches?.forEach((batch) => {
            if (batch.expiration_date) {
              const expiryDate = new Date(batch.expiration_date)
              if (expiryDate <= sevenDaysFromNow && expiryDate > currentDate) {
                expiringSoon++
              }
            }
          })
        })

        setInventoryStats({
          totalProducts,
          lowStockItems,
          expiringSoon,
          totalValue
        })
      }
    } catch (error) {
      console.error('Failed to load inventory stats:', error)
      // Set stats to 0 when no data exists
      setInventoryStats({
        totalProducts: 0,
        lowStockItems: 0,
        expiringSoon: 0,
        totalValue: 0
      })
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Load statistics on component mount and when refresh trigger changes
  useEffect(() => {
    loadInventoryStats()
  }, [refreshTrigger])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">
            Monitor stock levels, batch expiration, and manage restocking across all products
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefreshData}
            className="flex items-center"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsAnalyticsModalOpen(true)}
            className="flex items-center"
          >
            <ChartBarIcon className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button
            variant="outline"
            onClick={handleExportData}
            className="flex items-center"
          >
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={handleRestock}
            className="flex items-center"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Stock
          </Button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <p className="text-lg font-semibold text-gray-900">
                {isLoadingStats ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  inventoryStats.totalProducts.toLocaleString()
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
              <p className="text-lg font-semibold text-gray-900">
                {isLoadingStats ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  inventoryStats.lowStockItems.toLocaleString()
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
              <p className="text-lg font-semibold text-gray-900">
                {isLoadingStats ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  inventoryStats.expiringSoon.toLocaleString()
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-lg font-semibold text-gray-900">
                {isLoadingStats ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  `₱${inventoryStats.totalValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <InventoryFilters
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        brandFilter={brandFilter}
        stockStatusFilter={stockStatusFilter}
        expirationFilter={expirationFilter}
        onSearchChange={setSearchQuery}
        onCategoryChange={setCategoryFilter}
        onBrandChange={setBrandFilter}
        onStockStatusChange={setStockStatusFilter}
        onExpirationChange={setExpirationFilter}
        onClearFilters={clearAllFilters}
      />

      {/* Inventory Table */}
      <InventoryTable
        key={refreshTrigger}
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        brandFilter={brandFilter}
        stockStatusFilter={stockStatusFilter}
        expirationFilter={expirationFilter}
        onViewBatches={handleViewBatches}
        onRestock={(item) => {
          setSelectedInventoryItem(item)
          setIsRestockModalOpen(true)
        }}
      />

      {/* Restock Modal */}
      <RestockModal
        item={selectedInventoryItem}
        isOpen={isRestockModalOpen}
        onClose={() => {
          setIsRestockModalOpen(false)
          setSelectedInventoryItem(null)
        }}
        onSuccess={handleRestockSuccess}
      />

      {/* Batch Details Modal */}
      <BatchDetailsModal
        inventoryItem={selectedInventoryItem}
        isOpen={isBatchDetailsModalOpen}
        onClose={() => {
          setIsBatchDetailsModalOpen(false)
          setSelectedInventoryItem(null)
        }}
      />

      {/* Analytics Modal */}
      <InventoryAnalytics
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
      />
    </div>
  )
}