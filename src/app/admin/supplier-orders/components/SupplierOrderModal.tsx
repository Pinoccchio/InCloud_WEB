'use client'

import { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Button, Input, LoadingSpinner } from '@/components/ui'
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

interface Product {
  id: string
  product_name: string
  sku: string
  unit_of_measure: string
}

interface Branch {
  id: string
  name: string
}

interface OrderItem {
  product_id: string
  quantity: number
  unit_cost: number
  expected_expiration_date?: string
}

interface SupplierOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function SupplierOrderModal({ isOpen, onClose, onSuccess }: SupplierOrderModalProps) {
  const { session } = useAuth()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Form state
  const [supplierName, setSupplierName] = useState('')
  const [supplierContact, setSupplierContact] = useState('')
  const [supplierEmail, setSupplierEmail] = useState('')
  const [branchId, setBranchId] = useState('')
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<OrderItem[]>([{
    product_id: '',
    quantity: 1,
    unit_cost: 0,
    expected_expiration_date: ''
  }])

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      fetchInitialData()
    }
  }, [isOpen])

  // Auto-select branch if only one exists
  useEffect(() => {
    if (branches.length === 1 && !branchId) {
      setBranchId(branches[0].id)
    }
  }, [branches, branchId])

  const fetchInitialData = async () => {
    setLoadingData(true)
    const errors: string[] = []

    try {
      const headers = {
        'Authorization': `Bearer ${session?.access_token}`
      }

      // Fetch products
      const productsRes = await fetch('/api/products', { headers })
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.data || [])
      } else {
        errors.push('products')
      }

      // Fetch branches
      const branchesRes = await fetch('/api/branches', { headers })
      if (branchesRes.ok) {
        const branchesData = await branchesRes.json()
        setBranches(branchesData.data || [])
      } else {
        errors.push('branches')
      }

      // Show single combined error toast if any failures occurred
      if (errors.length > 0) {
        const failedItems = errors.join(' and ')
        addToast({
          type: 'error',
          title: 'Failed to Load Data',
          message: `Could not load ${failedItems}. Please close and reopen the modal to try again.`
        })
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
      addToast({
        type: 'error',
        title: 'Failed to Load Data',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setLoadingData(false)
    }
  }

  const addItem = () => {
    setItems([...items, {
      product_id: '',
      quantity: 1,
      unit_cost: 0,
      expected_expiration_date: ''
    }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!supplierName.trim()) {
      newErrors.supplierName = 'Supplier name is required'
    }

    if (!branchId) {
      newErrors.branchId = 'Branch is required'
    }

    if (supplierEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplierEmail)) {
      newErrors.supplierEmail = 'Invalid email format'
    }

    items.forEach((item, index) => {
      if (!item.product_id) {
        newErrors[`item_${index}_product`] = 'Product is required'
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0'
      }
      if (item.unit_cost <= 0) {
        newErrors[`item_${index}_cost`] = 'Unit cost must be greater than 0'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/supplier-orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          supplier_name: supplierName,
          supplier_contact: supplierContact || undefined,
          supplier_email: supplierEmail || undefined,
          branch_id: branchId,
          expected_delivery_date: expectedDeliveryDate || undefined,
          payment_terms: paymentTerms || undefined,
          notes: notes || undefined,
          items: items.map(item => ({
            product_id: item.product_id,
            quantity: parseInt(item.quantity.toString()),
            unit_cost: parseFloat(item.unit_cost.toString()),
            expected_expiration_date: item.expected_expiration_date || undefined
          }))
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create supplier order')
      }

      addToast({
        type: 'success',
        title: 'Supplier Order Created',
        message: `Order ${data.data.order_number} created successfully with ${data.data.items_count} item(s)`
      })

      onSuccess()
      resetForm()
      onClose()
    } catch (error) {
      console.error('Error creating supplier order:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create supplier order'
      addToast({
        type: 'error',
        title: 'Failed to Create Order',
        message: errorMessage
      })
      setErrors({ submit: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSupplierName('')
    setSupplierContact('')
    setSupplierEmail('')
    setBranchId('')
    setExpectedDeliveryDate('')
    setPaymentTerms('')
    setNotes('')
    setItems([{ product_id: '', quantity: 1, unit_cost: 0, expected_expiration_date: '' }])
    setErrors({})
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0)
  }

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId)
    return product ? `${product.product_name} (${product.sku})` : 'Select product'
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    Create Supplier Order
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                  {loadingData ? (
                    <div className="flex items-center justify-center py-12">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : (
                    <div className="space-y-6">
          {/* Supplier Information */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-medium text-gray-900">Supplier Information</h3>

            <div>
              <Input
                label="Supplier Name"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                error={errors.supplierName}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Contact Number"
                type="tel"
                value={supplierContact}
                onChange={(e) => setSupplierContact(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={supplierEmail}
                onChange={(e) => setSupplierEmail(e.target.value)}
                error={errors.supplierEmail}
              />
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-medium text-gray-900">Order Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Branch <span className="text-red-500">*</span>
                </label>
                {branches.length === 1 ? (
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {branches[0].name}
                  </div>
                ) : (
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select branch</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.branchId && (
                  <p className="mt-1 text-sm text-red-600">{errors.branchId}</p>
                )}
              </div>

              <Input
                label="Expected Delivery Date"
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              />
            </div>

            <Input
              label="Payment Terms"
              placeholder="e.g., Net 30, COD, etc."
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes or instructions..."
              />
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Order Items</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={addItem}
                className="flex items-center gap-1"
              >
                <PlusIcon className="h-4 w-4" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-gray-900">Item {index + 1}</span>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Product <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={item.product_id}
                      onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.product_name} ({product.sku}) - {product.unit_of_measure}
                        </option>
                      ))}
                    </select>
                    {errors[`item_${index}_product`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_product`]}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Input
                        label="Quantity"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        error={errors[`item_${index}_quantity`]}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        label="Unit Cost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_cost}
                        onChange={(e) => updateItem(index, 'unit_cost', e.target.value)}
                        error={errors[`item_${index}_cost`]}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        label="Expiration Date"
                        type="date"
                        value={item.expected_expiration_date || ''}
                        onChange={(e) => updateItem(index, 'expected_expiration_date', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-gray-900">
                    Subtotal: ₱{(item.quantity * item.unit_cost).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between text-lg font-semibold text-blue-900">
              <span>Total Amount:</span>
              <span>₱{calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}
                    </div>
                  )}
                </div>

                {/* Actions - Fixed Footer */}
                <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Supplier Order'}
                  </Button>
                </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
  )
}
