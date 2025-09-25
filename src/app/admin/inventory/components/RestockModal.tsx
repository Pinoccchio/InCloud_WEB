'use client'

import { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { Button, Input, LoadingSpinner } from '@/components/ui'
import { supabase } from '@/lib/supabase/auth'
import { useAuth } from '@/contexts/AuthContext'
import { getMainBranchId } from '@/lib/constants/branch'
import { getPhilippineDate, isFutureDate, getMinDate, getMaxExpirationDate, toPhilippineDate } from '@/lib/utils/philippine-date'

interface InventoryItem {
  id: string
  product_id?: string
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

interface RestockModalProps {
  item: InventoryItem | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface Product {
  id: string
  name: string
  sku: string
  brand_name: string
  category_name: string
  inventory_id?: string
  current_stock?: number
  cost_per_unit?: number
}

interface RestockFormData {
  selectedProductId: string
  quantity: string
  costPerUnit: string
  expirationDate: string
  supplierName: string
  supplierContact: string
  supplierEmail: string
  batchNumber: string
  purchaseOrderRef: string
  receivedDate: string
  notes: string
}

export default function RestockModal({
  item,
  isOpen,
  onClose,
  onSuccess
}: RestockModalProps) {
  const steps = [
    { number: 1, name: 'Stock Details', icon: TruckIcon, description: 'Quantity and cost information' },
    { number: 2, name: 'Supplier Info', icon: DocumentTextIcon, description: 'Supplier and batch details' },
    { number: 3, name: 'Review & Submit', icon: CheckIcon, description: 'Confirm restock operation' }
  ] as const
  const [formData, setFormData] = useState<RestockFormData>({
    selectedProductId: '',
    quantity: '',
    costPerUnit: '',
    expirationDate: '',
    supplierName: '',
    supplierContact: '',
    supplierEmail: '',
    batchNumber: '',
    purchaseOrderRef: '',
    receivedDate: getPhilippineDate(),
    notes: ''
  })

  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loadingProducts, setLoadingProducts] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1) // Multi-step form

  const { admin } = useAuth()

  // Load available products for general restocking
  const loadAvailableProducts = async () => {
    try {
      setLoadingProducts(true)
      console.log('🔄 RestockModal: Loading available products')

      // Get all active products (not just those with existing inventory)
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          status,
          brands!inner (
            name
          ),
          categories!inner (
            name
          )
        `)
        .eq('status', 'active')
        .order('name')

      if (productsError) throw productsError

      console.log('📦 Found active products:', productsData?.length || 0)

      // Get existing inventory records to show current stock levels
      const branchId = await getMainBranchId()
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          product_id,
          id,
          quantity,
          cost_per_unit
        `)
        .eq('branch_id', branchId)

      if (inventoryError) {
        console.warn('⚠️ Could not load inventory data:', inventoryError)
      }

      // Create inventory lookup map
      const inventoryMap = new Map()
      inventoryData?.forEach(inv => {
        inventoryMap.set(inv.product_id, {
          inventory_id: inv.id,
          current_stock: inv.quantity,
          cost_per_unit: inv.cost_per_unit
        })
      })

      // Map products with optional inventory data
      const products: Product[] = productsData?.map(product => {
        const inventoryInfo = inventoryMap.get(product.id)
        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          brand_name: product.brands?.name || 'Unknown',
          category_name: product.categories?.name || 'Unknown',
          inventory_id: inventoryInfo?.inventory_id,
          current_stock: inventoryInfo?.current_stock || 0,
          cost_per_unit: inventoryInfo?.cost_per_unit || 0
        }
      }) || []

      console.log('✅ Processed products for dropdown:', products)
      setAvailableProducts(products)
    } catch (error) {
      console.error('❌ Error loading products:', error)
      setError(error instanceof Error ? `Failed to load products: ${error.message}` : 'Failed to load available products. Please try again.')
      setAvailableProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (item) {
        // Specific item restocking - pre-fill data
        const product: Product = {
          id: item.product_id || item.id,
          name: item.product_name,
          sku: item.sku,
          brand_name: item.brand_name,
          category_name: item.category_name,
          inventory_id: item.id,
          current_stock: item.quantity,
          cost_per_unit: item.cost_per_unit
        }
        setSelectedProduct(product)
        setFormData({
          selectedProductId: item.product_id || item.id,
          quantity: '',
          costPerUnit: item.cost_per_unit ? item.cost_per_unit.toString() : '',
          expirationDate: '',
          supplierName: '',
          supplierContact: '',
          supplierEmail: '',
          batchNumber: `${item.sku || 'BATCH'}-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
          purchaseOrderRef: '',
          receivedDate: getPhilippineDate(),
          notes: ''
        })
      } else {
        // General restocking - load available products
        setSelectedProduct(null)
        setFormData({
          selectedProductId: '',
          quantity: '',
          costPerUnit: '',
          expirationDate: '',
          supplierName: '',
          supplierContact: '',
          supplierEmail: '',
          batchNumber: `BATCH-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
          purchaseOrderRef: '',
          receivedDate: getPhilippineDate(),
          notes: ''
        })
        loadAvailableProducts()
      }
      setStep(1)
      setError(null)
    }
  }, [isOpen, item])

  const handleInputChange = (field: keyof RestockFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleProductSelect = (productId: string) => {
    const product = availableProducts.find(p => p.id === productId)
    if (product) {
      setSelectedProduct(product)
      setFormData(prev => ({
        ...prev,
        selectedProductId: productId,
        costPerUnit: product.cost_per_unit ? product.cost_per_unit.toString() : '',
        batchNumber: `${product.sku || 'BATCH'}-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`
      }))
    }
  }

  const validateStep = (stepNumber: number): string | null => {
    switch (stepNumber) {
      case 1:
        if (!item && !formData.selectedProductId) return 'Please select a product to restock'

        const quantity = Number(formData.quantity)
        if (!formData.quantity || isNaN(quantity) || quantity <= 0) {
          return 'Quantity must be greater than 0. Please enter a valid amount to add.'
        }

        const costPerUnit = Number(formData.costPerUnit)
        if (!formData.costPerUnit || isNaN(costPerUnit) || costPerUnit <= 0) {
          return 'Cost per unit must be greater than ₱0.00. Please enter a valid cost.'
        }
        if (!formData.expirationDate) return 'Expiration date is required for inventory tracking'
        if (!isFutureDate(formData.expirationDate) && formData.expirationDate !== getPhilippineDate()) {
          return 'Expiration date must be today or in the future. Please select a valid date.'
        }
        // Check if expiration date is too far in the future (optional business rule)
        const maxExpirationDate = getMaxExpirationDate()
        if (formData.expirationDate > maxExpirationDate) {
          return 'Expiration date seems unusually far in the future. Please verify the date.'
        }
        break
      case 2:
        if (!formData.supplierName.trim()) return 'Supplier name is required for record keeping'
        if (!formData.batchNumber.trim()) return 'Batch number is required for traceability'
        if (!formData.receivedDate) return 'Received date is required'
        // Validate received date is not in the future (using Philippine timezone)
        if (isFutureDate(formData.receivedDate)) {
          return 'Received date cannot be in the future'
        }
        break
    }
    return null
  }

  const nextStep = () => {
    const validation = validateStep(step)
    if (validation) {
      setError(validation)
      return
    }
    setError(null)
    setStep(prev => prev + 1)
  }

  const prevStep = () => {
    setStep(prev => prev - 1)
    setError(null)
  }

  const handleSubmit = async () => {
    // Track operations for better error reporting (declare at function scope)
    const operationLog: string[] = []
    let createdInventoryId: string | null = null
    let createdBatchId: string | null = null

    // Validate all steps
    for (let i = 1; i <= 2; i++) {
      const validation = validateStep(i)
      if (validation) {
        setError(validation)
        setStep(i)
        return
      }
    }

    if (!admin) {
      setError('Authentication required. Please log in again.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Additional pre-flight validations
      console.log('🔄 Starting restock operation with validations...')

      // Validate admin permissions
      if (!admin.id) {
        throw new Error('Invalid admin session. Please log in again.')
      }

      // Validate branch access
      const branchId = await getMainBranchId()
      if (!branchId) {
        throw new Error('Unable to determine target branch. Please contact system administrator.')
      }

      // Validate the selected product still exists and is active
      const productId = item?.product_id || selectedProduct?.id
      if (!productId) {
        throw new Error('No valid product selected for restocking.')
      }

      const { data: productCheck, error: productError } = await supabase
        .from('products')
        .select('id, name, status')
        .eq('id', productId)
        .eq('status', 'active')
        .single()

      if (productError || !productCheck) {
        console.error('Product validation failed:', productError)
        throw new Error('Selected product is no longer available or has been deactivated.')
      }

      console.log('✅ Pre-flight validations passed for product:', productCheck.name)

      // Validate batch number uniqueness
      const { data: existingBatch, error: batchCheckError } = await supabase
        .from('product_batches')
        .select('id, batch_number')
        .eq('batch_number', formData.batchNumber.trim())
        .limit(1)

      if (batchCheckError) {
        console.warn('Could not check batch uniqueness:', batchCheckError)
        // Continue with operation but log the warning
      } else if (existingBatch && existingBatch.length > 0) {
        throw new Error(`Batch number "${formData.batchNumber}" already exists. Please use a unique batch number.`)
      }

      // Additional form data validation
      const quantity = Number(formData.quantity)
      const costPerUnit = Number(formData.costPerUnit)

      if (quantity <= 0 || quantity > 1000000) {
        throw new Error('Quantity must be between 1 and 1,000,000 units.')
      }

      if (costPerUnit < 0 || costPerUnit > 1000000) {
        throw new Error('Cost per unit must be between ₱0.00 and ₱1,000,000.00.')
      }

      if (!formData.supplierName.trim()) {
        throw new Error('Supplier name is required and cannot be empty.')
      }

      if (formData.supplierName.trim().length > 255) {
        throw new Error('Supplier name is too long (maximum 255 characters).')
      }

      // Validate dates using Philippine timezone
      operationLog.push('🗓️ Validating dates with Philippine timezone')

      // Use Philippine timezone-aware date validation
      if (isFutureDate(formData.receivedDate)) {
        throw new Error('Received date cannot be in the future.')
      }

      // Convert to Date objects for expiration comparison
      const receivedDate = toPhilippineDate(formData.receivedDate)
      const expirationDate = toPhilippineDate(formData.expirationDate)

      if (expirationDate <= receivedDate) {
        throw new Error('Expiration date must be after the received date.')
      }

      operationLog.push('✅ Date validation passed')

      // Check if dates are too far in the past or future (business rule)
      const now = new Date()
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      const fiveYearsFromNow = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate())

      if (receivedDate < oneYearAgo) {
        throw new Error('Received date cannot be more than 1 year in the past.')
      }

      if (expirationDate > fiveYearsFromNow) {
        throw new Error('Expiration date seems unusually far in the future (more than 5 years).')
      }

      console.log('✅ All validations passed, proceeding with restock...')

      // All validations passed, proceeding with restock
      operationLog.push('✅ All validations passed, proceeding with restock')

      // Handle case where we need to create inventory record for new products
      let targetInventoryId: string
      let currentQuantity = 0

      if (item) {
        // Restocking existing inventory item
        targetInventoryId = item.id
        currentQuantity = item.quantity
        operationLog.push('Using existing inventory record')
      } else if (selectedProduct) {
        // General restocking - check if inventory exists
        if (selectedProduct.inventory_id) {
          // Inventory exists
          targetInventoryId = selectedProduct.inventory_id
          currentQuantity = selectedProduct.current_stock || 0
          operationLog.push('Using existing inventory record')
        } else {
          // No inventory record exists - create one
          console.log('🔄 Creating new inventory record for product:', selectedProduct.name)
          operationLog.push('Creating new inventory record')

          const newInventoryData = {
            product_id: selectedProduct.id,
            branch_id: branchId,
            quantity: 0,
            reserved_quantity: 0,
            min_stock_level: 10,
            low_stock_threshold: 10,
            cost_per_unit: 0,
            location: 'Main Storage'
          }

          const { data: newInventory, error: createInventoryError } = await supabase
            .from('inventory')
            .insert(newInventoryData)
            .select()
            .single()

          if (createInventoryError) {
            console.error('Failed to create inventory record:', createInventoryError)
            operationLog.push(`❌ Failed to create inventory record: ${createInventoryError.message}`)
            throw new Error(`Failed to create inventory record: ${createInventoryError.message}`)
          }

          console.log('✅ Created new inventory record:', newInventory.id)
          operationLog.push(`✅ Created inventory record: ${newInventory.id}`)
          createdInventoryId = newInventory.id
          targetInventoryId = newInventory.id
          currentQuantity = 0
        }
      } else {
        throw new Error('No product selected for restocking')
      }

      // Create batch record
      const batchData = {
        inventory_id: targetInventoryId,
        batch_number: formData.batchNumber,
        quantity: Number(formData.quantity),
        received_date: formData.receivedDate,
        expiration_date: formData.expirationDate,
        cost_per_unit: Number(formData.costPerUnit),
        supplier_name: formData.supplierName,
        supplier_info: {
          contact: formData.supplierContact,
          email: formData.supplierEmail,
          purchase_order_ref: formData.purchaseOrderRef
        },
        status: 'active',
        is_active: true
      }

      console.log('🔄 Creating product batch...', batchData)
      operationLog.push('Creating product batch')
      const { data: batchResult, error: batchError } = await supabase
        .from('product_batches')
        .insert(batchData)
        .select()
        .single()

      if (batchError) {
        console.error('Batch creation error:', batchError)
        operationLog.push(`❌ Failed to create batch: ${batchError.message}`)
        throw new Error(`Failed to create product batch: ${batchError.message}`)
      }

      console.log('✅ Created product batch:', batchResult.id)
      operationLog.push(`✅ Created batch: ${batchResult.id}`)
      createdBatchId = batchResult.id

      // Update inventory quantities
      const newQuantity = currentQuantity + Number(formData.quantity)
      const inventoryUpdateData = {
        quantity: newQuantity,
        cost_per_unit: Number(formData.costPerUnit),
        last_restock_date: formData.receivedDate,
        updated_at: new Date().toISOString()
      }

      console.log('🔄 Updating inventory quantities...', inventoryUpdateData)
      operationLog.push('Updating inventory quantities')
      const { error: inventoryError } = await supabase
        .from('inventory')
        .update(inventoryUpdateData)
        .eq('id', targetInventoryId)

      if (inventoryError) {
        console.error('Inventory update error:', inventoryError)
        operationLog.push(`❌ Failed to update inventory: ${inventoryError.message}`)
        throw new Error(`Failed to update inventory: ${inventoryError.message}`)
      }

      console.log('✅ Updated inventory quantities')
      operationLog.push('✅ Updated inventory quantities')

      // Create inventory movement record
      const movementData = {
        inventory_id: targetInventoryId,
        movement_type: 'restock',
        quantity_change: Number(formData.quantity),
        quantity_before: currentQuantity,
        quantity_after: newQuantity,
        reference_id: batchResult.id,
        reference_type: 'batch',
        notes: formData.notes || `Restock from ${formData.supplierName}`,
        performed_by: admin.id
      }

      console.log('🔄 Creating inventory movement record...', movementData)
      operationLog.push('Creating inventory movement record')
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert(movementData)

      if (movementError) {
        console.error('Movement record error:', movementError)
        operationLog.push(`❌ Failed to create movement record: ${movementError.message}`)
        throw new Error(`Failed to create inventory movement record: ${movementError.message}`)
      }

      console.log('✅ Created inventory movement record')
      operationLog.push('✅ Created inventory movement record')

      // Create restock history record
      const restockHistoryData = {
        inventory_id: targetInventoryId,
        batch_id: batchResult.id,
        quantity: Number(formData.quantity),
        cost_per_unit: Number(formData.costPerUnit),
        supplier_info: {
          name: formData.supplierName,
          contact: formData.supplierContact,
          email: formData.supplierEmail
        },
        purchase_order_ref: formData.purchaseOrderRef,
        received_date: formData.receivedDate,
        performed_by: admin.id,
        notes: formData.notes
      }

      console.log('🔄 Creating restock history record...', restockHistoryData)
      operationLog.push('Creating restock history record')
      const { error: historyError } = await supabase
        .from('restock_history')
        .insert(restockHistoryData)

      if (historyError) {
        console.error('Restock history error:', historyError)
        operationLog.push(`❌ Failed to create restock history: ${historyError.message}`)
        throw new Error(`Failed to create restock history: ${historyError.message}`)
      }

      console.log('✅ Restock operation completed successfully!')
      operationLog.push('✅ Restock operation completed successfully')
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error processing restock:', err)
      console.error('Operation log:', operationLog)

      // Extract meaningful error message
      let errorMessage = 'Failed to process restock operation'

      if (err instanceof Error) {
        // Use the actual error message from our structured errors
        errorMessage = err.message
      } else if (err && typeof err === 'object') {
        // Handle Supabase error objects
        const supabaseError = err as Record<string, unknown>
        if (typeof supabaseError.message === 'string') {
          errorMessage = `Database error: ${supabaseError.message}`
        } else if (typeof supabaseError.error_description === 'string') {
          errorMessage = `API error: ${supabaseError.error_description}`
        } else if (typeof supabaseError.details === 'string') {
          errorMessage = `Error details: ${supabaseError.details}`
        }
      }

      // Add specific error handling for common issues
      if (errorMessage.includes('duplicate key')) {
        errorMessage = 'A batch with this number already exists. Please use a different batch number.'
      } else if (errorMessage.includes('foreign key')) {
        errorMessage = 'Invalid product or inventory reference. Please refresh the page and try again.'
      } else if (errorMessage.includes('permission') || errorMessage.includes('RLS')) {
        errorMessage = 'You do not have permission to perform this operation.'
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      }

      // Add operation context if anything was created (for debugging)
      if (createdInventoryId || createdBatchId) {
        const debugInfo = []
        if (createdInventoryId) debugInfo.push(`Inventory: ${createdInventoryId}`)
        if (createdBatchId) debugInfo.push(`Batch: ${createdBatchId}`)
        console.warn('Partial operations completed:', debugInfo.join(', '))

        // Add helpful context for admins
        if (debugInfo.length > 0) {
          errorMessage += ` (Note: Some records may have been created - contact administrator if needed: ${debugInfo.join(', ')})`
        }
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalCost = () => {
    const quantity = Number(formData.quantity) || 0
    const costPerUnit = Number(formData.costPerUnit) || 0
    return quantity * costPerUnit
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price)
  }

  const displayItem = item || selectedProduct
  const currentStock = item?.quantity || selectedProduct?.current_stock || 0

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
          <div className="fixed inset-0 bg-black/60" />
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-white">
                  <div>
                    <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                      {item ? `Add Stock - ${item.product_name}` : 'Add Stock'}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-500">
                      Step {step} of 3: {step === 1 ? 'Stock Details' : step === 2 ? 'Supplier Information' : 'Review & Submit'}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Step Progress Navigation */}
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {steps.find(s => s.number === step)?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Step {step} of 3: {steps.find(s => s.number === step)?.description}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {steps.map((stepItem, index) => {
                      const Icon = stepItem.icon
                      return (
                        <div key={stepItem.number} className="flex items-center">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                            step > stepItem.number
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : step === stepItem.number
                              ? 'border-blue-600 text-blue-600 bg-blue-50'
                              : 'border-gray-300 text-gray-400 bg-gray-50'
                          }`}>
                            {step > stepItem.number ? (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <Icon className="w-4 h-4" />
                            )}
                          </div>
                          {index < steps.length - 1 && (
                            <div className={`w-12 h-0.5 mx-2 ${
                              step > stepItem.number ? 'bg-blue-600' : 'bg-gray-300'
                            }`} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6 max-h-96 overflow-y-auto">
                  {/* Step 1: Stock Details */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Stock Details</h4>

                        {/* Product Selection (only for general restocking) */}
                        {!item && (
                          <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Select Product *
                            </label>
                            {loadingProducts ? (
                              <div className="flex items-center justify-center py-4">
                                <LoadingSpinner size="sm" />
                                <span className="ml-2 text-sm text-gray-500">Loading products...</span>
                              </div>
                            ) : (
                              <div className="relative">
                                <select
                                  value={formData.selectedProductId}
                                  onChange={(e) => handleProductSelect(e.target.value)}
                                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 appearance-none"
                                >
                                  <option value="">Choose a product...</option>
                                  {availableProducts.map((product) => (
                                    <option key={product.id} value={product.id}>
                                      {product.name} ({product.sku}) - {product.brand_name}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                              </div>
                            )}
                            {selectedProduct && (
                              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                                <div className="text-sm text-blue-900">
                                  <p><span className="font-semibold">Product:</span> {selectedProduct.name}</p>
                                  <p><span className="font-semibold">SKU:</span> {selectedProduct.sku}</p>
                                  <p><span className="font-semibold">Current Stock:</span> {selectedProduct.current_stock} units</p>
                                  <p><span className="font-semibold">Category:</span> {selectedProduct.category_name}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Quantity to Add *
                            </label>
                            <Input
                              type="number"
                              value={formData.quantity}
                              onChange={(e) => handleInputChange('quantity', e.target.value)}
                              placeholder="Enter quantity"
                              min="1"
                              className="w-full"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Current stock: {currentStock} units
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Cost per Unit *
                            </label>
                            <div className="relative">
                              <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <Input
                                type="number"
                                value={formData.costPerUnit}
                                onChange={(e) => handleInputChange('costPerUnit', e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="pl-10 w-full"
                              />
                            </div>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Expiration Date *
                            </label>
                            <div className="relative">
                              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <Input
                                type="date"
                                value={formData.expirationDate}
                                onChange={(e) => handleInputChange('expirationDate', e.target.value)}
                                className="pl-10 w-full"
                                min={formData.receivedDate || getMinDate()}
                                max={getMaxExpirationDate()}
                                title="Expiration date must be after received date"
                              />
                            </div>
                          </div>
                        </div>

                        {Number(formData.quantity) > 0 && Number(formData.costPerUnit) > 0 && (
                          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h5 className="text-sm font-semibold text-blue-900 mb-2">Restock Summary</h5>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-blue-700">Total Cost:</span>
                                <span className="font-semibold text-blue-900 ml-2">
                                  {formatPrice(calculateTotalCost())}
                                </span>
                              </div>
                              <div>
                                <span className="text-blue-700">New Total Stock:</span>
                                <span className="font-semibold text-blue-900 ml-2">
                                  {currentStock + (Number(formData.quantity) || 0)} units
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Supplier Information */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2 mt-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Supplier Name *
                            </label>
                            <div className="relative">
                              <TruckIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <Input
                                type="text"
                                value={formData.supplierName}
                                onChange={(e) => handleInputChange('supplierName', e.target.value)}
                                placeholder="Enter supplier name"
                                className="pl-10 w-full"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Supplier Contact
                            </label>
                            <Input
                              type="text"
                              value={formData.supplierContact}
                              onChange={(e) => handleInputChange('supplierContact', e.target.value)}
                              placeholder="Phone number"
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Supplier Email
                            </label>
                            <Input
                              type="email"
                              value={formData.supplierEmail}
                              onChange={(e) => handleInputChange('supplierEmail', e.target.value)}
                              placeholder="supplier@example.com"
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Batch Number *
                            </label>
                            <Input
                              type="text"
                              value={formData.batchNumber}
                              onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                              placeholder="Batch identifier"
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Received Date *
                            </label>
                            <Input
                              type="date"
                              value={formData.receivedDate}
                              onChange={(e) => handleInputChange('receivedDate', e.target.value)}
                              className="w-full"
                              max={getPhilippineDate()}
                              title="Received date cannot be in the future"
                            />
                          </div>

                          <div className="md:col-span-2 mt-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Purchase Order Reference
                            </label>
                            <div className="relative">
                              <DocumentTextIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <Input
                                type="text"
                                value={formData.purchaseOrderRef}
                                onChange={(e) => handleInputChange('purchaseOrderRef', e.target.value)}
                                placeholder="PO number or reference"
                                className="pl-10 w-full"
                              />
                            </div>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Notes
                            </label>
                            <textarea
                              value={formData.notes}
                              onChange={(e) => handleInputChange('notes', e.target.value)}
                              placeholder="Additional notes about this restock..."
                              rows={3}
                              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white placeholder:text-gray-600 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Review */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Review Restock Details</h4>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm font-semibold text-gray-500">Product:</span>
                              <p className="text-sm text-gray-900 font-semibold">{displayItem?.product_name || displayItem?.name}</p>
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-gray-500">SKU:</span>
                              <p className="text-sm text-gray-900">{displayItem?.sku}</p>
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-gray-500">Quantity to Add:</span>
                              <p className="text-sm text-gray-900 font-semibold">{formData.quantity || 0} units</p>
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-gray-500">Cost per Unit:</span>
                              <p className="text-sm text-gray-900">{formatPrice(Number(formData.costPerUnit) || 0)}</p>
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-gray-500">Total Cost:</span>
                              <p className="text-sm text-gray-900 font-bold text-blue-600">
                                {formatPrice(calculateTotalCost())}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-gray-500">Expiration Date:</span>
                              <p className="text-sm text-gray-900">{new Date(formData.expirationDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-gray-500">Supplier:</span>
                              <p className="text-sm text-gray-900">{formData.supplierName}</p>
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-gray-500">Batch Number:</span>
                              <p className="text-sm text-gray-900">{formData.batchNumber}</p>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm font-semibold text-gray-500">Current Stock:</span>
                                <p className="text-sm text-gray-900">{currentStock} units</p>
                              </div>
                              <div>
                                <span className="text-sm font-semibold text-gray-500">New Total Stock:</span>
                                <p className="text-sm text-gray-900 font-bold text-green-600">
                                  {currentStock + (Number(formData.quantity) || 0)} units
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Display */}
                  {error && (
                    <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                      <div className="flex">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mt-0.5" />
                        <div className="ml-3">
                          <p className="text-sm font-semibold text-red-800">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex space-x-3">
                    {step > 1 && (
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        disabled={loading}
                      >
                        Previous
                      </Button>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      disabled={loading}
                    >
                      Cancel
                    </Button>

                    {step < 3 ? (
                      <Button
                        onClick={nextStep}
                        disabled={loading}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        isLoading={loading}
                      >
                        Add Stock
                      </Button>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}