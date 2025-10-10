'use client'

import { useState } from 'react'
import { PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { Button, ConfirmDialog } from '@/components/ui'
import { Database } from '@/types/supabase'
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

  // Bulk actions
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [productsToDelete, setProductsToDelete] = useState<string[] | null>(null)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Table refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { admin } = useAuth()
  const { addToast } = useToast()

  const handleAddProduct = () => {
    setSelectedProduct(null)
    setFormMode('create')
    setIsProductFormOpen(true)
  }

  const handleExportProducts = async () => {
    try {
      const response = await fetch('/api/products/export')
      if (!response.ok) {
        throw new Error('Failed to export products')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `InCloud_Products_Export_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      addToast({
        type: 'success',
        title: 'Export Successful',
        message: 'Products have been exported to Excel successfully.'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: error instanceof Error ? error.message : 'Failed to export products'
      })
    }
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
          cascadeDetails.push(`${result.cascadeInfo.price_tiers} pricing type(s)`)
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

  // Bulk action handlers
  const handleBulkExport = async (productIds: string[]) => {
    try {
      const response = await fetch('/api/products/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds }),
      })

      if (!response.ok) {
        throw new Error('Failed to export selected products')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Selected_Products_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      addToast({
        type: 'success',
        title: 'Export Successful',
        message: `${productIds.length} product(s) exported successfully.`
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: error instanceof Error ? error.message : 'Failed to export selected products'
      })
    }
  }

  const handleBulkDelete = (productIds: string[]) => {
    if (productIds.length === 0) return
    setProductsToDelete(productIds)
  }

  const confirmBulkDelete = async () => {
    if (!productsToDelete || productsToDelete.length === 0 || !admin) return

    try {
      setIsBulkDeleting(true)

      const response = await fetch('/api/products/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productIds: productsToDelete,
          currentAdminId: admin.id,
          currentAdminRole: admin.role
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Bulk delete failed')
      }

      addToast({
        type: 'success',
        title: 'Products Deleted',
        message: `${productsToDelete.length} product(s) deleted successfully.`
      })

      setSelectedProducts(new Set()) // Clear selection
      setRefreshTrigger(prev => prev + 1) // Refresh table
    } catch (error) {
      console.error('Error bulk deleting products:', error)
      addToast({
        type: 'error',
        title: 'Bulk Delete Failed',
        message: error instanceof Error ? error.message : 'Failed to delete products'
      })
    } finally {
      setIsBulkDeleting(false)
      setProductsToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your frozen food catalog with pricing types and inventory tracking
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExportProducts}
            className="flex items-center"
          >
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export Products
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
        selectedProducts={selectedProducts}
        onSelectionChange={setSelectedProducts}
        onBulkExport={handleBulkExport}
        onBulkDelete={handleBulkDelete}
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
            ? `Are you sure you want to delete "${productToDelete.name}"? This action cannot be undone and will permanently delete:

• The product and all its data
• All inventory records and stock levels
• All pricing tiers (wholesale, retail, bulk)
• All product-specific alerts and configurations
• All product batches and expiration data
• All order items associated with this product
• All stock transfer records for this product

This will completely remove the product from the system.`
            : ''
        }
        confirmText="Delete Product"
        type="danger"
        isLoading={isDeleting}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!productsToDelete}
        onClose={() => setProductsToDelete(null)}
        onConfirm={confirmBulkDelete}
        title="Delete Multiple Products"
        message={
          productsToDelete
            ? `Are you sure you want to delete ${productsToDelete.length} product(s)? This action cannot be undone and will permanently delete for each product:

• The product and all its data
• All inventory records and stock levels
• All pricing tiers (wholesale, retail, bulk)
• All product-specific alerts and configurations
• All product batches and expiration data
• All order items associated with these products
• All stock transfer records for these products

This will completely remove ${productsToDelete.length} product(s) from the system.`
            : ''
        }
        confirmText={`Delete ${productsToDelete?.length || 0} Product(s)`}
        type="danger"
        isLoading={isBulkDeleting}
      />
    </div>
  )
}