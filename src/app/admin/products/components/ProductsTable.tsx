'use client'

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { Button, LoadingSpinner } from '@/components/ui'
import { supabase } from '@/lib/supabase/auth'
import { createThumbnailUrl } from '@/lib/supabase/storage'
import { Database } from '@/types/supabase'
import { getMainBranchId } from '@/lib/constants/branch'

type Product = Database['public']['Tables']['products']['Row'] & {
  brands?: Database['public']['Tables']['brands']['Row']
  categories?: Database['public']['Tables']['categories']['Row']
  price_tiers?: Database['public']['Tables']['price_tiers']['Row'][]
  inventory_count?: number
  total_stock?: number
  low_stock_count?: number
}

interface ProductsTableProps {
  searchQuery?: string
  categoryFilter?: string
  brandFilter?: string
  statusFilter?: string
  onEdit?: (product: Product) => void
  onDelete?: (product: Product) => void
  onView?: (product: Product) => void
}

export default function ProductsTable({
  searchQuery = '',
  categoryFilter = '',
  brandFilter = '',
  statusFilter = '',
  onEdit,
  onDelete,
  onView
}: ProductsTableProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Product
    direction: 'asc' | 'desc'
  }>({ key: 'name', direction: 'asc' })

  // Dropdown state management (similar to super admin pattern)
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

  // Fetch products with related data
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('products')
        .select(`
          *,
          brands (
            id,
            name,
            logo_url
          ),
          categories (
            id,
            name,
            description
          ),
          price_tiers (
            id,
            tier_type,
            price,
            min_quantity,
            max_quantity,
            is_active
          )
        `)

      // Apply filters
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`)
      }

      if (categoryFilter) {
        query = query.eq('category_id', categoryFilter)
      }

      if (brandFilter) {
        query = query.eq('brand_id', brandFilter)
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      // Sort by name by default
      query = query.order(sortConfig.key as string, { ascending: sortConfig.direction === 'asc' })

      const { data: productsData, error: productsError } = await query

      if (productsError) throw productsError

      // Get inventory counts for each product (only from main branch)
      const mainBranchId = await getMainBranchId()
      const productsWithInventory = await Promise.all(
        (productsData || []).map(async (product) => {
          const { data: inventoryData } = await supabase
            .from('inventory')
            .select('quantity, branch_id, low_stock_threshold')
            .eq('product_id', product.id)
            .eq('branch_id', mainBranchId)

          const totalStock = inventoryData?.[0]?.quantity || 0
          const inventoryCount = inventoryData?.length || 0
          const lowStockCount = inventoryData?.filter(inv =>
            inv.quantity <= (inv.low_stock_threshold || 10)
          ).length || 0

          return {
            ...product,
            inventory_count: inventoryCount,
            total_stock: totalStock,
            low_stock_count: lowStockCount
          }
        })
      )

      setProducts(productsWithInventory)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, categoryFilter, brandFilter, statusFilter, sortConfig])

  // Enhanced dropdown positioning with precise coordinates (similar to super admin)
  const calculateDropdownPosition = (productId: string) => {
    const buttonRef = dropdownRefs.current[productId]
    if (!buttonRef) return

    const buttonRect = buttonRef.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Dropdown dimensions
    const dropdownWidth = 224 // w-56 = 14rem = 224px
    const dropdownMinHeight = 120
    const dropdownMaxHeight = 256

    // Calculate available space in all directions
    const spaceAbove = buttonRect.top
    const spaceBelow = viewportHeight - buttonRect.bottom
    const spaceLeft = buttonRect.left
    const spaceRight = viewportWidth - buttonRect.right

    // Determine vertical position
    let position: 'top' | 'bottom' = 'bottom'
    let y = buttonRect.bottom + 8 // 8px gap below button

    if (spaceBelow < dropdownMinHeight && spaceAbove > spaceBelow) {
      position = 'top'
      y = buttonRect.top - 8 // 8px gap above button
    }

    // Determine horizontal alignment
    let align: 'left' | 'right' = 'right'
    let x = buttonRect.right - dropdownWidth // Align right edge with button right edge

    // If dropdown would go off the left edge, align to the left
    if (x < 8) {
      align = 'left'
      x = buttonRect.left
    }

    // Ensure dropdown doesn't go off the right edge
    if (x + dropdownWidth > viewportWidth - 8) {
      x = viewportWidth - dropdownWidth - 8
    }

    // Ensure minimum margins from viewport edges
    x = Math.max(8, Math.min(x, viewportWidth - dropdownWidth - 8))

    if (position === 'top') {
      y = Math.max(8, y - dropdownMaxHeight)
    } else {
      y = Math.min(y, viewportHeight - dropdownMinHeight - 8)
    }

    setDropdownPosition({
      x,
      y,
      position,
      align
    })
  }

  // Calculate position when dropdown opens and after content renders
  useLayoutEffect(() => {
    if (openDropdown) {
      setTimeout(() => calculateDropdownPosition(openDropdown), 0)
    }
  }, [openDropdown])

  // Recalculate position after dropdown content is rendered
  useLayoutEffect(() => {
    if (dropdownPosition && dropdownContentRef.current) {
      const content = dropdownContentRef.current
      const actualHeight = content.scrollHeight

      const buttonRef = dropdownRefs.current[openDropdown!]
      if (buttonRef) {
        const buttonRect = buttonRef.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const spaceBelow = viewportHeight - buttonRect.bottom
        const spaceAbove = buttonRect.top

        let needsRepositioning = false

        if (dropdownPosition.position === 'bottom' && spaceBelow < actualHeight + 16) {
          if (spaceAbove > spaceBelow) {
            needsRepositioning = true
          }
        } else if (dropdownPosition.position === 'top' && spaceAbove < actualHeight + 16) {
          if (spaceBelow > spaceAbove) {
            needsRepositioning = true
          }
        }

        if (needsRepositioning) {
          calculateDropdownPosition(openDropdown!)
        }
      }
    }
  }, [dropdownPosition, openDropdown])

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

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSort = (key: keyof Product) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)))
    }
  }

  const handleSelectProduct = (productId: string) => {
    const newSelection = new Set(selectedProducts)
    if (newSelection.has(productId)) {
      newSelection.delete(productId)
    } else {
      newSelection.add(productId)
    }
    setSelectedProducts(newSelection)
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

  const getStockStatus = (product: Product) => {
    if (product.total_stock === 0) {
      return (
        <span className="text-red-600 font-medium">Out of Stock</span>
      )
    }
    if (product.low_stock_count && product.low_stock_count > 0) {
      return (
        <span className="text-yellow-600 font-medium">Low Stock</span>
      )
    }
    return (
      <span className="text-green-600 font-medium">In Stock</span>
    )
  }

  const getMainImage = (product: Product) => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0] as any
      return typeof firstImage === 'string' ? firstImage : firstImage?.url || null
    }
    return null
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(price)
  }

  const getLowestPrice = (priceTiers: Database['public']['Tables']['price_tiers']['Row'][]) => {
    if (!priceTiers || priceTiers.length === 0) return null
    const activeTiers = priceTiers.filter(tier => tier.is_active)
    if (activeTiers.length === 0) return null
    return Math.min(...activeTiers.map(tier => Number(tier.price)))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading products</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchProducts}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      {/* Table Header Actions */}
      {selectedProducts.size > 0 && (
        <div className="px-6 py-3 bg-blue-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedProducts.size} product(s) selected
            </span>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                Bulk Edit
              </Button>
              <Button size="sm" variant="outline">
                Export
              </Button>
              <Button size="sm" variant="outline">
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedProducts.size === products.length && products.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('category')}>
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('brand')}>
                Brand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price Range
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}>
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const mainImage = getMainImage(product)
              const lowestPrice = getLowestPrice(product.price_tiers || [])

              return (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </td>

                  {/* Product Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        {mainImage ? (
                          <img
                            className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                            src={createThumbnailUrl(mainImage, 50, 50)}
                            alt={product.name}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                            <PhotoIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {product.sku || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.categories?.name || 'Uncategorized'}
                  </td>

                  {/* Brand */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.brands?.name || 'No Brand'}
                  </td>

                  {/* Price Range */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lowestPrice ? (
                      <>
                        <span className="font-medium">
                          {formatPrice(lowestPrice)}
                        </span>
                        {product.price_tiers && product.price_tiers.length > 1 && (
                          <span className="text-xs text-gray-500 ml-1">+</span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-500">No pricing</span>
                    )}
                  </td>

                  {/* Stock Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      {getStockStatus(product)}
                      <span className="text-xs text-gray-500">
                        {product.total_stock || 0} units available
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(product.status)}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Actions Dropdown */}
                      <div className="relative">
                        <button
                          ref={(el) => { dropdownRefs.current[product.id] = el }}
                          onClick={(e) => {
                            e.stopPropagation()
                            const newState = openDropdown === product.id ? null : product.id
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
              )
            })}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="text-center py-12">
            <PhotoIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">
              {searchQuery || categoryFilter || brandFilter || statusFilter
                ? 'Try adjusting your filters to see more products.'
                : 'Start by adding your first product to the inventory.'
              }
            </p>
          </div>
        )}
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
            className="fixed w-56 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-64 overflow-y-auto transition-all duration-200 ease-out"
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
                const product = products.find(p => p.id === openDropdown)
                if (!product) return null

                return (
                  <>
                    {/* View Details - Always visible */}
                    <button
                      onClick={() => {
                        closeDropdownAndOpenModal(() => onView?.(product))
                      }}
                      disabled={isOpeningModal}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center transition-colors ${
                        isOpeningModal
                          ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <EyeIcon className="w-4 h-4 mr-2 text-gray-500" />
                      View Details
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    {/* Edit Product */}
                    <button
                      onClick={() => {
                        closeDropdownAndOpenModal(() => onEdit?.(product))
                      }}
                      disabled={isOpeningModal}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center transition-colors ${
                        isOpeningModal
                          ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <PencilIcon className="w-4 h-4 mr-2 text-gray-500" />
                      Edit Product
                    </button>

                    {/* Delete Product */}
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        closeDropdownAndOpenModal(() => onDelete?.(product))
                      }}
                      disabled={isOpeningModal}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center transition-colors ${
                        isOpeningModal
                          ? 'text-red-400 cursor-not-allowed bg-red-25'
                          : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                      }`}
                    >
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Delete Product
                    </button>
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