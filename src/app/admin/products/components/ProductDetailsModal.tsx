'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  XMarkIcon,
  CubeIcon,
  TagIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingStorefrontIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase/auth'
import { Database } from '@/types/supabase'
import { Button, LoadingSpinner } from '@/components/ui'
import { createThumbnailUrl } from '@/lib/supabase/storage'
import { getMainBranchId } from '@/lib/constants/branch'

type Product = Database['public']['Tables']['products']['Row'] & {
  brands?: Database['public']['Tables']['brands']['Row']
  categories?: Database['public']['Tables']['categories']['Row']
  price_tiers?: Database['public']['Tables']['price_tiers']['Row'][]
}

interface InventoryData {
  id: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  low_stock_threshold: number
  min_stock_level: number
  max_stock_level: number
  location?: string
  cost_per_unit?: number
  last_restock_date?: string
  last_counted_date?: string
}

interface ProductBatch {
  id: string
  batch_number: string
  quantity: number
  received_date: string
  expiration_date: string
  supplier_name?: string
  cost_per_unit?: number
  status: string
  is_active: boolean
}

interface ProductDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onEdit?: (product: Product) => void
  onDelete?: (product: Product) => void
}

export default function ProductDetailsModal({
  isOpen,
  onClose,
  product,
  onEdit,
  onDelete
}: ProductDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'analytics'>('overview')
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null)
  const [productBatches, setProductBatches] = useState<ProductBatch[]>([])
  const [isLoadingInventory, setIsLoadingInventory] = useState(false)
  const [isLoadingBatches, setIsLoadingBatches] = useState(false)

  // Load inventory data
  const loadInventoryData = useCallback(async () => {
    if (!product) return

    try {
      setIsLoadingInventory(true)
      const mainBranchId = await getMainBranchId()

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', product.id)
        .eq('branch_id', mainBranchId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setInventoryData(data)
    } catch (error) {
      console.error('Error loading inventory data:', error)
      setInventoryData(null)
    } finally {
      setIsLoadingInventory(false)
    }
  }, [product])

  // Load product batches
  const loadProductBatches = useCallback(async () => {
    if (!product || !inventoryData) return

    try {
      setIsLoadingBatches(true)

      const { data, error } = await supabase
        .from('product_batches')
        .select('*')
        .eq('inventory_id', inventoryData.id)
        .order('expiration_date', { ascending: true })

      if (error) throw error
      setProductBatches(data || [])
    } catch (error) {
      console.error('Error loading product batches:', error)
      setProductBatches([])
    } finally {
      setIsLoadingBatches(false)
    }
  }, [product, inventoryData])

  useEffect(() => {
    if (isOpen && product) {
      loadInventoryData()
    }
  }, [isOpen, product, loadInventoryData])

  useEffect(() => {
    if (activeTab === 'inventory' && inventoryData) {
      loadProductBatches()
    }
  }, [activeTab, inventoryData, loadProductBatches])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(price)
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Active
          </span>
        )
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
            Inactive
          </span>
        )
      case 'discontinued':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Discontinued
          </span>
        )
      default:
        return <span className="text-gray-500">-</span>
    }
  }

  const getStockStatusColor = (quantity: number, threshold: number) => {
    if (quantity === 0) return 'text-red-600'
    if (quantity <= threshold) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getMainImage = () => {
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0] as any
      return typeof firstImage === 'string' ? firstImage : firstImage?.url || null
    }
    return null
  }

  if (!isOpen || !product) return null

  const mainImage = getMainImage()

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {mainImage ? (
                    <img
                      className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                      src={createThumbnailUrl(mainImage, 50, 50)}
                      alt={product.name}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                      <CubeIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-gray-900">
                    {product.name}
                  </DialogTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    {product.sku && (
                      <span className="text-sm text-gray-500">SKU: {product.sku}</span>
                    )}
                    {getStatusBadge(product.status)}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="px-6 -mb-px flex space-x-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <CubeIcon className="w-4 h-4 inline mr-2" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'inventory'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <ArchiveBoxIcon className="w-4 h-4 inline mr-2" />
                  Inventory
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'analytics'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <ChartBarIcon className="w-4 h-4 inline mr-2" />
                  Analytics
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="px-6 py-6 max-h-96 overflow-y-auto">

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Product Images */}
                  {product.images && Array.isArray(product.images) && product.images.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Product Images</h4>
                      <div className="grid grid-cols-4 gap-3">
                        {(product.images as any[]).slice(0, 8).map((image, index) => {
                          const imageUrl = typeof image === 'string' ? image : image?.url
                          return imageUrl ? (
                            <img
                              key={index}
                              className="h-20 w-20 rounded-lg object-cover border border-gray-200 hover:scale-105 transition-transform cursor-pointer"
                              src={createThumbnailUrl(imageUrl, 80, 80)}
                              alt={`${product.name} ${index + 1}`}
                            />
                          ) : (
                            <div key={index} className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                              <PhotoIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Product Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <CubeIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Product Name</p>
                          <p className="text-sm text-gray-900">{product.name}</p>
                        </div>
                      </div>

                      {product.description && (
                        <div className="flex items-start space-x-3">
                          <TagIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Description</p>
                            <p className="text-sm text-gray-900">{product.description}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-3">
                        <BuildingStorefrontIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Category</p>
                          <p className="text-sm text-gray-900">{product.categories?.name || 'Uncategorized'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <TagIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Brand</p>
                          <p className="text-sm text-gray-900">{product.brands?.name || 'No Brand'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {product.sku && (
                        <div className="flex items-center space-x-3">
                          <TagIcon className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">SKU</p>
                            <p className="text-sm text-gray-900 font-mono">{product.sku}</p>
                          </div>
                        </div>
                      )}

                      {product.barcode && (
                        <div className="flex items-center space-x-3">
                          <TagIcon className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Barcode</p>
                            <p className="text-sm text-gray-900 font-mono">{product.barcode}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-3">
                        <ArchiveBoxIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Unit of Measure</p>
                          <p className="text-sm text-gray-900 capitalize">{product.unit_of_measure || 'pieces'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <ClockIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Status</p>
                          <div className="mt-1">
                            {getStatusBadge(product.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Tiers */}
                  {product.price_tiers && product.price_tiers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Pricing Tiers</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {product.price_tiers.filter(tier => tier.is_active).map(tier => (
                          <div key={tier.id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900 capitalize">
                                {tier.tier_type}
                              </span>
                              <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="mt-1">
                              <span className="text-lg font-semibold text-gray-900">
                                {formatPrice(Number(tier.price))}
                              </span>
                              {tier.min_quantity && (
                                <span className="text-xs text-gray-500 ml-1">
                                  (min: {tier.min_quantity})
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Inventory Tab */}
              {activeTab === 'inventory' && (
                <div className="space-y-6">
                  {isLoadingInventory ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : inventoryData ? (
                    <>
                      {/* Current Stock Levels */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <ArchiveBoxIcon className="w-5 h-5 text-blue-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-blue-900">Total Quantity</p>
                              <p className="text-2xl font-bold text-blue-900">{inventoryData.quantity}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <CheckCircleIcon className="w-5 h-5 text-green-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-green-900">Available</p>
                              <p className="text-2xl font-bold text-green-900">{inventoryData.available_quantity}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-yellow-900">Reserved</p>
                              <p className="text-2xl font-bold text-yellow-900">{inventoryData.reserved_quantity || 0}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Inventory Details */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Inventory Details</h4>
                        <dl className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <dt className="font-medium text-gray-700">Low Stock Threshold</dt>
                            <dd className="text-gray-900">{inventoryData.low_stock_threshold} units</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-700">Min Stock Level</dt>
                            <dd className="text-gray-900">{inventoryData.min_stock_level || 'Not set'}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-700">Max Stock Level</dt>
                            <dd className="text-gray-900">{inventoryData.max_stock_level || 'Not set'}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-700">Location</dt>
                            <dd className="text-gray-900">{inventoryData.location || 'Not specified'}</dd>
                          </div>
                          {inventoryData.cost_per_unit && (
                            <div>
                              <dt className="font-medium text-gray-700">Cost per Unit</dt>
                              <dd className="text-gray-900">{formatPrice(Number(inventoryData.cost_per_unit))}</dd>
                            </div>
                          )}
                          <div>
                            <dt className="font-medium text-gray-700">Last Restock</dt>
                            <dd className="text-gray-900">
                              {inventoryData.last_restock_date
                                ? new Date(inventoryData.last_restock_date).toLocaleDateString()
                                : 'No restock recorded'
                              }
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {/* Product Batches */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Product Batches (FIFO)</h4>
                        {isLoadingBatches ? (
                          <div className="flex justify-center py-4">
                            <LoadingSpinner size="sm" />
                          </div>
                        ) : productBatches.length > 0 ? (
                          <div className="space-y-3">
                            {productBatches.filter(batch => batch.is_active && batch.quantity > 0).map(batch => (
                              <div key={batch.id} className="border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">Batch #{batch.batch_number}</p>
                                    <p className="text-sm text-gray-600">
                                      Quantity: {batch.quantity} •
                                      Expires: {new Date(batch.expiration_date).toLocaleDateString()}
                                      {batch.supplier_name && ` • Supplier: ${batch.supplier_name}`}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    {batch.cost_per_unit && (
                                      <p className="text-sm text-gray-900">
                                        {formatPrice(Number(batch.cost_per_unit))} per unit
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-500">
                                      Received: {new Date(batch.received_date).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No active batches found</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <ArchiveBoxIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No inventory data available</p>
                    </div>
                  )}
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <ChartBarIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Analytics coming soon</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Sales data, demand trends, and performance metrics will be available here.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ClockIcon className="w-4 h-4" />
                <span>Created: {new Date(product.created_at).toLocaleDateString()}</span>
                {product.updated_at && product.updated_at !== product.created_at && (
                  <>
                    <span>•</span>
                    <span>Updated: {new Date(product.updated_at).toLocaleDateString()}</span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                {onEdit && (
                  <Button onClick={() => onEdit(product)}>
                    Edit Product
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    onClick={() => onDelete(product)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}