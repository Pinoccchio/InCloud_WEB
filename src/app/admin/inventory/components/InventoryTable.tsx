'use client'

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  EllipsisHorizontalIcon,
  EyeIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui'
import { supabase } from '@/lib/supabase/auth'
import { getMainBranchId } from '@/lib/constants/branch'

interface InventoryItem {
  id: string
  product_id: string // UUID foreign key to products table
  quantity: number
  available_quantity: number
  reserved_quantity: number
  low_stock_threshold: number
  min_stock_level: number
  max_stock_level: number
  location: string
  cost_per_unit: number
  last_restock_date: string
  updated_at: string
  product_name: string
  product_code: string // Human-readable product ID (e.g., "SF-TP-1KG")
  brand_name: string
  category_name: string
  batch_count: number
  next_expiration: string
  stock_status: 'healthy' | 'low' | 'critical' | 'out'
  expiration_status: 'fresh' | 'expiring' | 'expired'
}

interface InventoryTableProps {
  searchQuery: string
  categoryFilter: string
  brandFilter: string
  stockStatusFilter: string
  expirationFilter: string
  onViewBatches: (item: InventoryItem) => void
  onRestock: (item: InventoryItem) => void
  onReorder?: (item: InventoryItem) => void
}

export default function InventoryTable({
  searchQuery,
  categoryFilter,
  brandFilter,
  stockStatusFilter,
  expirationFilter,
  onViewBatches,
  onRestock,
  onReorder
}: InventoryTableProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Advanced dropdown state management (copied from ProductsTable)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{
    x: number
    y: number
    position: 'top' | 'bottom'
    align: 'left' | 'right'
  } | null>(null)
  const [isOpeningModal, setIsOpeningModal] = useState(false)

  // Refs for dropdown positioning
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const dropdownContentRef = useRef<HTMLDivElement | null>(null)

  // Simplified dropdown positioning to fix "jump to top" issue
  const calculateDropdownPosition = (itemId: string) => {
    const buttonRef = dropdownRefs.current[itemId]
    if (!buttonRef) return

    const buttonRect = buttonRef.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    // Simple positioning logic
    const dropdownWidth = 192 // w-48
    const spaceBelow = viewportHeight - buttonRect.bottom

    // Default to bottom positioning with small gap
    let position: 'top' | 'bottom' = 'bottom'
    let y = buttonRect.bottom + 4

    // Only flip to top if clearly insufficient space below (less than 150px)
    if (spaceBelow < 150) {
      position = 'top'
      y = buttonRect.top - 4
    }

    // Simple horizontal positioning - align dropdown right edge with button right edge
    let x = buttonRect.right - dropdownWidth

    // Ensure dropdown stays within viewport
    if (x < 8) {
      x = 8 // Minimum left margin
    }
    if (x + dropdownWidth > viewportWidth - 8) {
      x = viewportWidth - dropdownWidth - 8 // Minimum right margin
    }

    setDropdownPosition({
      x,
      y,
      position,
      align: 'right'
    })
  }

  // Calculate position when dropdown opens (simplified)
  useLayoutEffect(() => {
    if (openDropdown) {
      calculateDropdownPosition(openDropdown)
    }
  }, [openDropdown])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdown) {
        setOpenDropdown(null)
        setDropdownPosition(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openDropdown])

  // Helper function to safely close dropdown and open modal
  const closeDropdownAndOpenModal = async (modalAction: () => void) => {
    if (isOpeningModal) return

    setIsOpeningModal(true)

    // Close dropdown immediately
    setOpenDropdown(null)
    setDropdownPosition(null)

    // Wait for dropdown to fully close and cleanup
    await new Promise(resolve => setTimeout(resolve, 100))

    // Execute modal action
    modalAction()

    setIsOpeningModal(false)
  }

  // Load inventory data
  const loadInventoryData = useCallback(async () => {
    console.log('📦 [InventoryTable] Starting inventory data load')
    const startTime = performance.now()

    try {
      setLoading(true)
      setError(null)

      console.log('🏢 [InventoryTable] Fetching main branch ID...')
      const mainBranchId = await getMainBranchId()
      console.log('✅ [InventoryTable] Branch ID retrieved:', mainBranchId)

      console.log('💾 [InventoryTable] Fetching inventory data from database...')
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          products!inner(
            name,
            product_id,
            brands!inner(name),
            categories!inner(name)
          ),
          product_batches(
            id,
            expiration_date,
            quantity,
            is_active
          )
        `)
        .eq('branch_id', mainBranchId)
        .order('updated_at', { ascending: false })

      if (error) throw error

      console.log('✅ [InventoryTable] Inventory data fetched from database:', {
        count: data?.length || 0,
        duration: `${(performance.now() - startTime).toFixed(0)}ms`
      })

      // Process and enrich inventory data
      console.log('🔄 [InventoryTable] Processing and enriching inventory data...')
      const processedInventory = data.map(item => {
        const product = item.products
        const activeBatches = item.product_batches?.filter(batch => batch.is_active) || []
        const nextExpiration = activeBatches.length > 0
          ? activeBatches.sort((a, b) => new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime())[0]?.expiration_date
          : null

        // Determine stock status
        let stockStatus: 'healthy' | 'low' | 'critical' | 'out' = 'healthy'
        if (item.available_quantity === 0) {
          stockStatus = 'out'
        } else if (item.available_quantity <= (item.low_stock_threshold / 2)) {
          stockStatus = 'critical'
        } else if (item.available_quantity <= item.low_stock_threshold) {
          stockStatus = 'low'
        }

        // Determine expiration status
        let expirationStatus: 'fresh' | 'expiring' | 'expired' = 'fresh'
        if (nextExpiration) {
          const today = new Date()
          const expirationDate = new Date(nextExpiration)
          const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          if (daysUntilExpiration < 0) {
            expirationStatus = 'expired'
          } else if (daysUntilExpiration <= 7) {
            expirationStatus = 'expiring'
          }
        }

        return {
          ...item,
          product_name: product.name,
          product_code: product.product_id, // Human-readable product ID
          // Note: item.product_id (UUID) is preserved from spread operator
          brand_name: product.brands?.name || 'Unknown',
          category_name: product.categories?.name || 'Unknown',
          batch_count: activeBatches.length,
          next_expiration: nextExpiration,
          stock_status: stockStatus,
          expiration_status: expirationStatus
        }
      })

      const totalDuration = (performance.now() - startTime).toFixed(0)

      console.log('🎉 [InventoryTable] Inventory data load completed successfully:', {
        totalItems: processedInventory.length,
        totalDuration: `${totalDuration}ms`,
        stockStatusBreakdown: {
          healthy: processedInventory.filter(i => i.stock_status === 'healthy').length,
          low: processedInventory.filter(i => i.stock_status === 'low').length,
          critical: processedInventory.filter(i => i.stock_status === 'critical').length,
          out: processedInventory.filter(i => i.stock_status === 'out').length
        },
        expirationBreakdown: {
          fresh: processedInventory.filter(i => i.expiration_status === 'fresh').length,
          expiring: processedInventory.filter(i => i.expiration_status === 'expiring').length,
          expired: processedInventory.filter(i => i.expiration_status === 'expired').length
        },
        totalBatches: processedInventory.reduce((sum, i) => sum + i.batch_count, 0)
      })

      setInventory(processedInventory)
    } catch (err) {
      console.error('❌ [InventoryTable] Error loading inventory data:', err)
      console.error('📋 [InventoryTable] Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        duration: `${(performance.now() - startTime).toFixed(0)}ms`
      })
      setError(err instanceof Error ? err.message : 'Failed to load inventory data')
    } finally {
      setLoading(false)
      console.log('🏁 [InventoryTable] Load operation completed')
    }
  }, [])

  useEffect(() => {
    console.log('🔄 [InventoryTable] Component mounted - initializing inventory data load')
    loadInventoryData()
  }, [loadInventoryData])

  // Filter inventory based on current filters
  const filteredInventory = inventory.filter(item => {
    if (searchQuery && !item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.product_code.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (categoryFilter && item.category_name !== categoryFilter) {
      return false
    }
    if (brandFilter && item.brand_name !== brandFilter) {
      return false
    }
    if (stockStatusFilter && item.stock_status !== stockStatusFilter) {
      return false
    }
    if (expirationFilter && item.expiration_status !== expirationFilter) {
      return false
    }
    return true
  })


  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out': return 'text-red-600 bg-red-50 border-red-200'
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getExpirationStatusColor = (status: string) => {
    switch (status) {
      case 'expired': return 'text-red-600 bg-red-50 border-red-200'
      case 'expiring': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case 'out': return <ExclamationTriangleIcon className="w-4 h-4" />
      case 'critical': return <ExclamationTriangleIcon className="w-4 h-4" />
      case 'low': return <ClockIcon className="w-4 h-4" />
      default: return <CheckCircleIcon className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Inventory</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (filteredInventory.length === 0) {
    return (
      <div className="text-center py-12">
        <ArchiveBoxIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Inventory Items Found</h3>
        <p className="text-gray-500">
          {inventory.length === 0
            ? "No inventory items in the system yet."
            : "No items match your current filters. Try adjusting your search criteria."
          }
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Batches
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expiration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInventory.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.product_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Product ID: {item.product_code} • {item.brand_name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.category_name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStockStatusColor(item.stock_status)}`}>
                      {getStockStatusIcon(item.stock_status)}
                      <span className="ml-1">
                        {item.stock_status === 'out' ? 'Out of Stock' :
                         item.stock_status === 'healthy' ? 'Adequate Stock' :
                         item.stock_status === 'low' ? 'Low Stock' :
                         item.stock_status === 'critical' ? 'Critical Stock' : item.stock_status}
                      </span>
                    </span>
                    <div className="text-xs text-gray-500">
                      Available: <span className="font-medium">{item.available_quantity}</span>
                      {item.reserved_quantity > 0 && (
                        <span className="text-yellow-600"> ({item.reserved_quantity} reserved)</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      Total: {item.quantity} • Threshold: {item.low_stock_threshold}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {item.batch_count} batch{item.batch_count !== 1 ? 'es' : ''}
                  </div>
                  <div className="text-xs text-gray-500">
                    Active inventory batches
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.next_expiration ? (
                    <div className="space-y-1">
                      {(item.expiration_status === 'expired' || item.expiration_status === 'expiring') && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getExpirationStatusColor(item.expiration_status)}`}>
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {item.expiration_status === 'expired' ? 'Expired' : 'Expiring Soon'}
                        </span>
                      )}
                      <div className="text-xs text-gray-500">
                        {formatDate(item.next_expiration)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No batches</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatPrice(item.quantity * Number(item.cost_per_unit))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatPrice(Number(item.cost_per_unit))} per unit
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(item.updated_at)}
                </td>
                <td className="relative px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {/* Actions Dropdown */}
                    <div className="relative">
                      <button
                        ref={(el) => { dropdownRefs.current[item.id] = el }}
                        onClick={(e) => {
                          e.stopPropagation()
                          const newState = openDropdown === item.id ? null : item.id
                          setOpenDropdown(newState)
                          if (!newState) {
                            setDropdownPosition(null)
                          }
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                      >
                        <span className="text-lg font-bold">⋮</span>
                      </button>
                    </div>
                  </div>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Portal-based Dropdown - Render outside table hierarchy */}
      {openDropdown && dropdownPosition && typeof window !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpenDropdown(null)
              setDropdownPosition(null)
            }}
          />

          {/* Dropdown Content */}
          <div
            ref={dropdownContentRef}
            className="fixed w-48 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-64 overflow-y-auto transition-all duration-200 ease-out"
            style={{
              left: `${dropdownPosition.x}px`,
              [dropdownPosition.position === 'top' ? 'bottom' : 'top']:
                dropdownPosition.position === 'top'
                  ? `${window.innerHeight - dropdownPosition.y}px`
                  : `${dropdownPosition.y}px`,
              filter: 'drop-shadow(0 20px 25px rgb(0 0 0 / 0.15))',
            }}
          >
            <div className="py-1">
              {(() => {
                const item = inventory.find(i => i.id === openDropdown)
                if (!item) return null

                return (
                  <>
                    {/* View Batches */}
                    <button
                      onClick={() => {
                        closeDropdownAndOpenModal(() => onViewBatches(item))
                      }}
                      disabled={isOpeningModal}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center transition-colors ${
                        isOpeningModal
                          ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <EyeIcon className="w-4 h-4 mr-2 text-gray-500" />
                      View Batches
                    </button>

                    {/* Add Stock */}
                    <button
                      onClick={() => {
                        closeDropdownAndOpenModal(() => onRestock(item))
                      }}
                      disabled={isOpeningModal}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center transition-colors ${
                        isOpeningModal
                          ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <PlusIcon className="w-4 h-4 mr-2 text-gray-500" />
                      Add Stock
                    </button>

                    {/* Reorder from Supplier (show for low/critical/out stock) */}
                    {onReorder && (item.stock_status === 'low' || item.stock_status === 'critical' || item.stock_status === 'out') && (
                      <button
                        onClick={() => {
                          closeDropdownAndOpenModal(() => onReorder(item))
                        }}
                        disabled={isOpeningModal}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center transition-colors ${
                          isOpeningModal
                            ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                            : 'text-blue-700 hover:bg-blue-50'
                        }`}
                      >
                        <ShoppingCartIcon className="w-4 h-4 mr-2 text-blue-500" />
                        Reorder from Supplier
                      </button>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}