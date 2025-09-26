'use client'

import { useState } from 'react'
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline'
import { Button, ConfirmDialog } from '@/components/ui'
import { Database } from '@/types/supabase'
import { supabase } from '@/lib/supabase/auth'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

// Component imports
import ProductsTable from './components/ProductsTable'
import ProductFilters from './components/ProductFilters'
import ProductForm from './components/ProductForm'
import ProductDetailsModal from './components/ProductDetailsModal'

type Product = Database['public']['Tables']['products']['Row'] & {
  brands?: Database['public']['Tables']['brands']['Row']
  categories?: Database['public']['Tables']['categories']['Row']
  price_tiers?: Database['public']['Tables']['price_tiers']['Row'][]
  inventory_count?: number
  total_stock?: number
  low_stock_count?: number
}

export default function ProductsPage() {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')

  // Modal states
  const [isProductFormOpen, setIsProductFormOpen] = useState(false)
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null)

  // Delete confirmation
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Table refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { admin } = useAuth()
  const { addToast } = useToast()

  const handleAddProduct = () => {
    setSelectedProduct(null)
    setFormMode('create')
    setIsProductFormOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setFormMode('edit')
    setIsProductFormOpen(true)
  }

  const handleViewProduct = (product: Product) => {
    setSelectedProductForDetails(product)
    setIsProductDetailsOpen(true)
  }

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product)
  }

  const confirmDeleteProduct = async () => {
    if (!productToDelete || !admin) return

    try {
      setIsDeleting(true)

      // Use API endpoint for proper cascade handling
      const response = await fetch('/api/products/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productToDelete.id,
          reason: `Product deleted via admin interface by ${admin.fullName || 'admin'}`,
          currentAdminId: admin.id,
          currentAdminRole: admin.role
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete product')
      }

      // Show success message with cascade information
      let message = `${productToDelete.name} has been successfully deleted.`
      if (result.cascadeInfo) {
        const cascadeDetails = []
        if (result.cascadeInfo.inventory_records > 0) {
          cascadeDetails.push(`${result.cascadeInfo.inventory_records} inventory record(s)`)
        }
        if (result.cascadeInfo.price_tiers > 0) {
          cascadeDetails.push(`${result.cascadeInfo.price_tiers} price tier(s)`)
        }
        if (result.cascadeInfo.alerts > 0) {
          cascadeDetails.push(`${result.cascadeInfo.alerts} alert(s)`)
        }

        if (cascadeDetails.length > 0) {
          message += ` Related data removed: ${cascadeDetails.join(', ')}.`
        }
      }

      // Show warning if product had business history
      if (result.warningMessage) {
        addToast({
          type: 'warning',
          title: 'Product Deleted with History',
          message: result.warningMessage
        })
      }

      addToast({
        type: 'success',
        title: 'Product Deleted',
        message: message
      })

      // Refresh the table
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error deleting product:', error)
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: error instanceof Error ? error.message : 'Failed to delete product'
      })
    } finally {
      setIsDeleting(false)
      setProductToDelete(null)
    }
  }

  const handleFormSuccess = () => {
    addToast({
      type: 'success',
      title: formMode === 'create' ? 'Product Created' : 'Product Updated',
      message: `Product has been successfully ${formMode === 'create' ? 'created' : 'updated'}.`
    })

    // Refresh the table
    setRefreshTrigger(prev => prev + 1)
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setCategoryFilter('')
    setBrandFilter('')
    setStatusFilter('')
    setStockFilter('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your frozen food catalog with pricing tiers and inventory tracking
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            className="flex items-center"
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button
            onClick={handleAddProduct}
            className="flex items-center"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ProductFilters
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        brandFilter={brandFilter}
        statusFilter={statusFilter}
        stockFilter={stockFilter}
        onSearchChange={setSearchQuery}
        onCategoryChange={setCategoryFilter}
        onBrandChange={setBrandFilter}
        onStatusChange={setStatusFilter}
        onStockFilterChange={setStockFilter}
        onClearFilters={clearAllFilters}
      />

      {/* Products Table */}
      <ProductsTable
        key={refreshTrigger} // Force re-render when refreshTrigger changes
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        brandFilter={brandFilter}
        statusFilter={statusFilter}
        stockFilter={stockFilter}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onView={handleViewProduct}
      />

      {/* Product Form Modal */}
      <ProductForm
        product={selectedProduct}
        isOpen={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
        onSuccess={handleFormSuccess}
        mode={formMode}
      />

      {/* Product Details Modal */}
      <ProductDetailsModal
        isOpen={isProductDetailsOpen}
        onClose={() => {
          setIsProductDetailsOpen(false)
          setSelectedProductForDetails(null)
        }}
        product={selectedProductForDetails}
        onEdit={(product) => {
          setIsProductDetailsOpen(false)
          setSelectedProductForDetails(null)
          handleEditProduct(product)
        }}
        onDelete={(product) => {
          setIsProductDetailsOpen(false)
          setSelectedProductForDetails(null)
          handleDeleteProduct(product)
        }}
      />


      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDeleteProduct}
        title="Delete Product"
        message={
          productToDelete
            ? `Are you sure you want to delete "${productToDelete.name}"? This action cannot be undone and will cascade delete:

• All inventory records and stock levels
• All price tiers (wholesale, retail, box)
• All product-specific alerts and configurations
• All product batches and expiration data

Note: Order history and transfer records will be preserved for audit purposes.`
            : ''
        }
        confirmText="Delete Product"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}