'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { Button, Input, LoadingSpinner } from '@/components/ui'
import { supabase } from '@/lib/supabase/auth'
import { Database } from '@/types/supabase'
import { useAuth } from '@/contexts/AuthContext'
import ImageUploader from './ImageUploader'
import PricingTiers from './PricingTiers'
import CategoryManagementModal from './CategoryManagementModal'
import BrandManagementModal from './BrandManagementModal'
import { getErrorReport, logSupabaseError } from '@/lib/utils/supabase-errors'

type Product = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']
type ProductStatus = Database['public']['Enums']['product_status']
type Category = Database['public']['Tables']['categories']['Row']
type Brand = Database['public']['Tables']['brands']['Row']

interface PriceTier {
  id?: string
  pricing_type: Database['public']['Enums']['pricing_tier']
  price: number
  min_quantity: number
  max_quantity?: number
  is_active: boolean
}

interface ProductFormProps {
  product?: Product
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mode: 'create' | 'edit'
}

interface FormData {
  name: string
  description: string
  product_id: string
  category_id: string
  brand_id: string
  unit_of_measure: string
  status: ProductStatus
  low_stock_threshold: number | string
  images: Array<{ id: string; url: string; path: string }>
  pricingTiers: PriceTier[]
}

export default function ProductForm({
  product,
  isOpen,
  onClose,
  onSuccess,
  mode
}: ProductFormProps) {
  const { admin } = useAuth()

  // Generate temporary product ID for new products to enable image upload
  const [tempProductId] = useState(() => {
    if (mode === 'create') {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      console.log('🆔 Generated temporary product ID:', tempId)
      return tempId
    }
    return null
  })

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    product_id: '',
    category_id: '',
    brand_id: '',
    unit_of_measure: 'pieces',
    status: 'available',
    low_stock_threshold: 10,
    images: [],
    pricingTiers: []
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [step, setStep] = useState(1)

  // Modal states for category and brand management
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)

  const steps = [
    { number: 1, name: 'Basic Info', icon: CubeIcon, description: 'Product details and classification' },
    { number: 2, name: 'Images', icon: PhotoIcon, description: 'Product photos and gallery' },
    { number: 3, name: 'Pricing', icon: CurrencyDollarIcon, description: 'Set pricing types and rules' },
    { number: 4, name: 'Review', icon: DocumentCheckIcon, description: 'Review and save product' }
  ] as const

  // Initialize form when product changes
  useEffect(() => {
    if (product && mode === 'edit') {
      initializeFormFromProduct(product)
    } else if (mode === 'create') {
      resetForm()
    }
  }, [product, mode])

  // Reset form when modal opens in create mode to ensure fresh start
  useEffect(() => {
    if (isOpen && mode === 'create') {
      resetForm()
    }
  }, [isOpen, mode])

  const loadFormData = useCallback(async () => {
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

      // Pricing tiers are now loaded directly in initializeFormFromProduct()
      // This prevents race conditions and ensures proper data loading
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load form data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load categories and brands when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFormData()
    }
  }, [isOpen, loadFormData])

  const initializeFormFromProduct = async (product: Product) => {
    console.log('🔄 Initializing form from product:', product.id)

    // Load inventory data to get low stock threshold
    let lowStockThreshold = 10 // default
    try {
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('low_stock_threshold')
        .eq('product_id', product.id)
        .limit(1)
        .single()

      if (!inventoryError && inventoryData) {
        lowStockThreshold = inventoryData.low_stock_threshold || 10
      }
    } catch (err) {
      console.warn('Could not load inventory threshold, using default:', err)
    }

    // Set basic form data first
    setFormData({
      name: product.name,
      description: product.description || '',
      product_id: product.product_id || '',
      category_id: product.category_id || '',
      brand_id: product.brand_id || '',
      unit_of_measure: product.unit_of_measure || 'pieces',
      status: product.status || 'available',
      low_stock_threshold: lowStockThreshold,
      images: Array.isArray(product.images) ? product.images.map((img: string | { url: string; path?: string }, index) => ({
        id: `existing-${index}`,
        url: typeof img === 'string' ? img : img.url,
        path: typeof img === 'string' ? img : img.path || img.url
      })) : [],
      pricingTiers: [] // Will be loaded below
    })

    // Load pricing tiers for this product
    try {
      console.log('📊 Loading pricing tiers for product:', product.id)
      const { data: priceTiersData, error } = await supabase
        .from('price_tiers')
        .select('*')
        .eq('product_id', product.id)

      if (error) {
        console.error('❌ Error loading pricing tiers:', error)
        setError('Failed to load pricing types')
        return
      }

      const tiers = (priceTiersData || []).map(tier => ({
        id: tier.id,
        pricing_type: tier.pricing_type,
        price: Number(tier.price),
        min_quantity: tier.min_quantity || 1,
        max_quantity: tier.max_quantity || undefined,
        is_active: tier.is_active || false
      }))

      console.log('✅ Loaded pricing tiers:', tiers.length, 'tiers')

      // Update form data with pricing tiers
      setFormData(prev => ({
        ...prev,
        pricingTiers: tiers
      }))
    } catch (err) {
      console.error('💥 Failed to load pricing tiers:', err)
      setError('Failed to load pricing types')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      product_id: '',
      category_id: '',
      brand_id: '',
      unit_of_measure: 'pieces',
      status: 'available',
      low_stock_threshold: 10,
      images: [],
      pricingTiers: []
    })
    setStep(1)
    setError(null)
    setErrorDetails(null)
  }

  const validateStep = (currentStep: number): string | null => {
    switch (currentStep) {
      case 1:
        if (!formData.name.trim()) return 'Product name is required'
        if (!formData.category_id) return 'Category is required'
        if (!formData.brand_id) return 'Brand is required'
        return null
      case 2:
        // Images are optional, but we could warn if none uploaded
        return null
      case 3:
        if (formData.pricingTiers.length === 0) return 'At least one pricing type is required'
        const hasActiveTiers = formData.pricingTiers.some(tier => tier.is_active)
        if (!hasActiveTiers) return 'At least one pricing type must be active'
        return null
      case 4:
        // Final validation - same as current validateForm()
        return validateForm()
      default:
        return null
    }
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

  const handleInputChange = (field: keyof FormData, value: string | boolean | Array<{ id: string; url: string; path: string }> | PriceTier[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleCategoryChange = (categoryId: string) => {
    // Update category
    setFormData(prev => ({
      ...prev,
      category_id: categoryId
    }))
    setError(null)
  }

  const handleCategoryCreated = (newCategory: Category) => {
    // Add new category to the list and sort
    const updatedCategories = [...categories, newCategory].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    setCategories(updatedCategories)

    // Auto-select the newly created category
    handleCategoryChange(newCategory.id)
  }

  const handleBrandCreated = (newBrand: Brand) => {
    // Add new brand to the list and sort
    const updatedBrands = [...brands, newBrand].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    setBrands(updatedBrands)

    // Auto-select the newly created brand
    setFormData(prev => ({
      ...prev,
      brand_id: newBrand.id
    }))
    setError(null)
  }

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Product name is required'
    if (!formData.category_id) return 'Category is required'
    if (!formData.brand_id) return 'Brand is required'
    if (formData.pricingTiers.length === 0) return 'At least one pricing type is required'

    const hasActiveTiers = formData.pricingTiers.some(tier => tier.is_active)
    if (!hasActiveTiers) return 'At least one pricing type must be active'

    return null
  }

  const handleSubmit = async () => {
    // Validate the form
    const validation = validateForm()
    if (validation) {
      setError(validation)
      setErrorDetails(null)
      return
    }

    // Validate admin context for audit tracking
    if (!admin?.id) {
      setError('Admin session required for this operation. Please refresh and try again.')
      setErrorDetails('No admin ID found in session context. Please log out and log back in.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setErrorDetails(null)

      if (mode === 'create') {
        await createProduct()
      } else {
        await updateProduct()
      }

      onSuccess()
      onClose()
    } catch (err) {
      // Use enhanced error reporting
      const errorReport = getErrorReport(err, `Product ${mode === 'create' ? 'Creation' : 'Update'}`)

      // Log detailed error to console for debugging
      console.error(errorReport.consoleLog)

      // Set user-friendly error message
      setError(errorReport.userMessage)

      // Set technical details for expandable view
      setErrorDetails(errorReport.parsed.fullError)
    } finally {
      setSaving(false)
    }
  }

  const createProduct = async () => {
    console.log('🔄 Creating product with automatic inventory integration...')
    console.log('📋 Form data:', {
      name: formData.name,
      category_id: formData.category_id,
      brand_id: formData.brand_id,
      pricing_tiers_count: formData.pricingTiers.length,
      admin_id: admin?.id
    })

    // Try using the enhanced database function first for better integration
    try {
      const pricingTiersForFunction = formData.pricingTiers.map(tier => ({
        pricing_type: tier.pricing_type,
        price: typeof tier.price === 'string' ? parseFloat(tier.price) || 0 : tier.price,
        min_quantity: typeof tier.min_quantity === 'string' ? parseInt(tier.min_quantity) || 1 : tier.min_quantity,
        max_quantity: typeof tier.max_quantity === 'string' ? (tier.max_quantity === '' ? undefined : parseInt(tier.max_quantity)) : tier.max_quantity,
        is_active: tier.is_active
      }))

      console.log('📊 Calling create_product_with_inventory with:', {
        p_name: formData.name.trim(),
        p_category_id: formData.category_id,
        p_brand_id: formData.brand_id,
        p_pricing_tiers: pricingTiersForFunction,
        p_admin_id: admin?.id
      })

      const { data: functionResult, error: functionError } = await supabase.rpc(
        'create_product_with_inventory',
        {
          p_name: formData.name.trim(),
          p_description: formData.description.trim() || null,
          p_product_id: formData.product_id.trim() || null,
          p_category_id: formData.category_id || null,
          p_brand_id: formData.brand_id || null,
          p_unit_of_measure: formData.unit_of_measure,
          p_pricing_tiers: pricingTiersForFunction,
          p_admin_id: admin?.id || null
        }
      )

      if (functionError) {
        console.error('❌ Database function failed:', functionError)
        logSupabaseError(functionError, 'create_product_with_inventory RPC call')
        throw functionError
      }

      const productId = functionResult
      console.log('✅ Product created with inventory via database function:', productId)

      // Update product with images if any (function doesn't handle images yet)
      if (formData.images.length > 0) {
        const { error: imageError } = await supabase
          .from('products')
          .update({
            images: formData.images.map(img => ({
              url: img.url,
              path: img.path
            }))
          })
          .eq('id', productId)

        if (imageError) {
          console.warn('Failed to update product images:', imageError)
          // Don't throw here as the product was created successfully
        }
      }

      return productId

    } catch (functionError) {
      // Fallback to original method with manual inventory creation
      console.warn('⚠️ Database function failed, using fallback direct insert method')
      logSupabaseError(functionError, 'Database function fallback')

      const productData: ProductInsert = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        product_id: formData.product_id.trim() || null,
        category_id: formData.category_id || null,
        brand_id: formData.brand_id || null,
        unit_of_measure: formData.unit_of_measure,
        status: formData.status,
        created_by: admin?.id || null,
        images: formData.images.map(img => ({
          url: img.url,
          path: img.path
        }))
      }

      console.log('📝 Inserting product directly:', productData)

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()

      if (productError) {
        console.error('❌ Product insert failed:', productError)
        logSupabaseError(productError, 'Direct product insert')
        throw productError
      }

      console.log('✅ Product inserted:', product.id)

      // Create pricing tiers
      if (formData.pricingTiers.length > 0) {
        const pricingData = formData.pricingTiers.map(tier => ({
          product_id: product.id,
          pricing_type: tier.pricing_type,
          price: typeof tier.price === 'string' ? parseFloat(tier.price) || 0 : tier.price,
          min_quantity: typeof tier.min_quantity === 'string' ? parseInt(tier.min_quantity) || 1 : tier.min_quantity,
          max_quantity: typeof tier.max_quantity === 'string' ? (tier.max_quantity === '' ? undefined : parseInt(tier.max_quantity)) : tier.max_quantity,
          is_active: tier.is_active,
          created_by: admin?.id
        }))

        console.log('📊 Creating pricing tiers:', pricingData.length, 'tiers')

        const { error: pricingError } = await supabase
          .from('price_tiers')
          .insert(pricingData)

        if (pricingError) {
          console.error('❌ Pricing tiers insert failed:', pricingError)
          logSupabaseError(pricingError, 'Pricing types insert')
          throw pricingError
        }

        console.log('✅ Pricing tiers created')
      }

      // Manually create inventory record (fallback)
      console.log('🔄 Creating inventory record manually (fallback)...')

      // Get main branch ID
      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (branchError || !branchData) {
        console.warn('Could not get branch for inventory creation:', branchError)
        // Don't throw here as the product was created successfully
        return product.id
      }

      // Parse threshold to number for database
      const threshold = typeof formData.low_stock_threshold === 'string'
        ? (parseInt(formData.low_stock_threshold) || 10)
        : formData.low_stock_threshold

      const { error: inventoryError } = await supabase
        .from('inventory')
        .insert({
          product_id: product.id,
          branch_id: branchData.id,
          quantity: 0,
          reserved_quantity: 0,
          min_stock_level: threshold,
          low_stock_threshold: threshold,
          cost_per_unit: 0,
          location: 'Main Storage',
          created_by: admin?.id
        })

      if (inventoryError) {
        console.warn('Failed to create inventory record (fallback):', inventoryError)
        // Don't throw here as the product was created successfully
      } else {
        console.log('✅ Inventory record created via fallback method')
      }

      return product.id
    }
  }

  const updateProduct = async () => {
    if (!product) return

    console.log('🔄 Updating product:', product.id)

    const productData: ProductUpdate = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      product_id: formData.product_id.trim() || null,
      category_id: formData.category_id || null,
      brand_id: formData.brand_id || null,
      unit_of_measure: formData.unit_of_measure,
      status: formData.status,
      images: formData.images.map(img => ({
        url: img.url,
        path: img.path
      }))
    }

    console.log('📝 Updating product data:', productData)

    const { error: productError } = await supabase
      .from('products')
      .update(productData)
      .eq('id', product.id)

    if (productError) {
      console.error('❌ Product update failed:', productError)
      logSupabaseError(productError, 'Product update')
      throw productError
    }

    console.log('✅ Product updated')

    // Delete existing pricing tiers
    console.log('🗑️ Deleting existing pricing tiers')
    const { error: deleteError } = await supabase
      .from('price_tiers')
      .delete()
      .eq('product_id', product.id)

    if (deleteError) {
      console.error('❌ Failed to delete existing pricing tiers:', deleteError)
      logSupabaseError(deleteError, 'Delete existing pricing types')
      throw deleteError
    }

    console.log('✅ Existing pricing tiers deleted')

    // Create new pricing tiers
    if (formData.pricingTiers.length > 0) {
      const pricingData = formData.pricingTiers.map(tier => ({
        product_id: product.id,
        pricing_type: tier.pricing_type,
        price: typeof tier.price === 'string' ? parseFloat(tier.price) || 0 : tier.price,
        min_quantity: typeof tier.min_quantity === 'string' ? parseInt(tier.min_quantity) || 1 : tier.min_quantity,
        max_quantity: typeof tier.max_quantity === 'string' ? (tier.max_quantity === '' ? undefined : parseInt(tier.max_quantity)) : tier.max_quantity,
        is_active: tier.is_active,
        created_by: admin?.id
      }))

      console.log('📊 Creating new pricing tiers:', pricingData.length, 'tiers')

      const { error: pricingError } = await supabase
        .from('price_tiers')
        .insert(pricingData)

      if (pricingError) {
        console.error('❌ Failed to create new pricing tiers:', pricingError)
        logSupabaseError(pricingError, 'Insert new pricing types')
        throw pricingError
      }

      console.log('✅ New pricing tiers created')
    }

    // Update inventory low stock threshold
    console.log('🔄 Updating inventory low stock threshold')
    // Parse threshold to number for database
    const threshold = typeof formData.low_stock_threshold === 'string'
      ? (parseInt(formData.low_stock_threshold) || 10)
      : formData.low_stock_threshold

    const { error: inventoryUpdateError } = await supabase
      .from('inventory')
      .update({
        low_stock_threshold: threshold,
        min_stock_level: threshold
      })
      .eq('product_id', product.id)

    if (inventoryUpdateError) {
      console.warn('Failed to update inventory threshold:', inventoryUpdateError)
      // Don't throw here as the product was updated successfully
    } else {
      console.log('✅ Inventory threshold updated')
    }

    console.log('✅ Product update complete')
  }

  const getMainImage = () => {
    if (formData.images && formData.images.length > 0) {
      return formData.images[0].url
    }
    return null
  }

  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case 'available':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Available</span>
      case 'unavailable':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Unavailable</span>
      case 'discontinued':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Discontinued</span>
      default:
        return <span className="text-gray-600">-</span>
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getMainImage() ? (
                    <img
                      className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                      src={getMainImage()!}
                      alt={formData.name || 'Product'}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                      <CubeIcon className="h-6 w-6 text-gray-600" />
                    </div>
                  )}
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-gray-900">
                    {mode === 'create' ? 'Add New Product' : formData.name || 'Edit Product'}
                  </DialogTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    {formData.product_id && (
                      <span className="text-sm text-gray-600">Product ID: {formData.product_id}</span>
                    )}
                    {mode === 'edit' && getStatusBadge(formData.status)}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 transition-colors p-1 rounded-md hover:bg-gray-100"
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
                  Step {step} of 4: {steps.find(s => s.number === step)?.description}
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

            {/* Form Content */}
            <div className="px-6 py-6 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <>
                  {/* Step 1: Basic Info */}
                  {step === 1 && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Product Information</h4>
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Product Name *
                              </label>
                              <Input
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Enter product name"
                                className="w-full"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Product ID
                              </label>
                              <Input
                                value={formData.product_id}
                                onChange={(e) => handleInputChange('product_id', e.target.value)}
                                placeholder="Product ID (e.g., PF-TJH-1KG)"
                                className="w-full"
                              />
                              <p className="text-xs text-gray-500 mt-1">Use a simple, short identifier</p>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                  Category *
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setIsCategoryModalOpen(true)}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                >
                                  <PlusIcon className="w-3 h-3 mr-1" />
                                  New
                                </button>
                              </div>
                              <select
                                value={formData.category_id}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="">Select a category</option>
                                {categories.map(category => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="block text-sm font-semibold text-gray-700">
                                    Brand *
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => setIsBrandModalOpen(true)}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                                  >
                                    <PlusIcon className="w-3 h-3 mr-1" />
                                    New
                                  </button>
                                </div>
                                <select
                                  value={formData.brand_id}
                                  onChange={(e) => handleInputChange('brand_id', e.target.value)}
                                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <option value="">Select a brand</option>
                                  {brands.map(brand => (
                                    <option key={brand.id} value={brand.id}>
                                      {brand.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Unit of Measure
                                </label>
                                <select
                                  value={formData.unit_of_measure}
                                  onChange={(e) => handleInputChange('unit_of_measure', e.target.value)}
                                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <option value="pieces">Pieces</option>
                                  <option value="boxes">Boxes</option>
                                  <option value="kilograms">Kilograms</option>
                                  <option value="grams">Grams</option>
                                  <option value="liters">Liters</option>
                                  <option value="packs">Packs</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Status
                                </label>
                                <select
                                  value={formData.status}
                                  onChange={(e) => handleInputChange('status', e.target.value as ProductStatus)}
                                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <option value="available">Available</option>
                                  <option value="unavailable">Unavailable</option>
                                  <option value="discontinued">Discontinued</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Low Stock Threshold
                                </label>
                                <Input
                                  type="number"
                                  value={formData.low_stock_threshold}
                                  onChange={(e) => handleInputChange('low_stock_threshold', e.target.value)}
                                  placeholder="10"
                                  min="1"
                                  max="1000"
                                  className="w-full"
                                />
                                <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this level</p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Description
                            </label>
                            <textarea
                              value={formData.description}
                              onChange={(e) => handleInputChange('description', e.target.value)}
                              placeholder="Product description"
                              rows={4}
                              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white placeholder:text-gray-600 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Step 2: Images */}
                  {step === 2 && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Product Images</h4>
                          <p className="text-sm text-gray-600 mb-6">Upload up to 10 images to showcase your product</p>
                          <ImageUploader
                            productId={mode === 'edit' ? product?.id : tempProductId}
                            onImagesChange={(images) => handleInputChange('images', images)}
                            initialImages={formData.images}
                            maxImages={10}
                          />
                        </div>
                      </div>
                    )}

                  {/* Step 3: Pricing */}
                  {step === 3 && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Pricing Configuration</h4>
                          <p className="text-sm text-gray-600 mb-6">Set up pricing types for different customer segments</p>
                          <PricingTiers
                            value={formData.pricingTiers}
                            onChange={(tiers) => handleInputChange('pricingTiers', tiers)}
                          />
                        </div>
                      </div>
                    )}

                  {/* Step 4: Review */}
                  {step === 4 && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Review Product Details</h4>
                          <p className="text-sm text-gray-600 mb-6">Please review all product information before saving</p>
                        </div>

                        <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Product Name</span>
                              <p className="text-base text-gray-900 font-medium">{formData.name}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Category</span>
                              <p className="text-base text-gray-900 font-medium">
                                {categories.find(c => c.id === formData.category_id)?.name || 'Not selected'}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Brand</span>
                              <p className="text-base text-gray-900 font-medium">
                                {brands.find(b => b.id === formData.brand_id)?.name || 'Not selected'}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Status</span>
                              <div>
                                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium capitalize ${
                                  formData.status === 'available' ? 'bg-green-100 text-green-800' :
                                  formData.status === 'unavailable' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {formData.status}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Images</span>
                              <p className="text-base text-gray-900 font-medium">{formData.images.length} uploaded</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pricing Types</span>
                              <p className="text-base text-gray-900 font-medium">
                                {formData.pricingTiers.filter(t => t.is_active).length} active types
                              </p>
                            </div>
                          </div>

                          {formData.description && (
                            <div className="space-y-2 pt-3 border-t border-gray-200">
                              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Description</span>
                              <p className="text-sm text-gray-700 leading-relaxed">{formData.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Error Display */}
                  {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-red-800 mb-2">{error}</p>
                          {errorDetails && (
                            <details className="mt-3">
                              <summary className="text-xs font-semibold text-red-700 cursor-pointer hover:text-red-900">
                                View Technical Details
                              </summary>
                              <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono text-red-900 overflow-x-auto max-h-48 overflow-y-auto">
                                <pre className="whitespace-pre-wrap break-words">{errorDetails}</pre>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(errorDetails)
                                    // Optional: show a toast notification
                                  }}
                                  className="mt-2 px-2 py-1 bg-red-200 hover:bg-red-300 rounded text-xs font-sans"
                                >
                                  Copy to Clipboard
                                </button>
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex space-x-3">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={saving}
                  >
                    Previous
                  </Button>
                )}
              </div>
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </Button>
                {step < 4 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={saving}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving}
                    isLoading={saving}
                    className="min-w-[140px]"
                  >
                    {mode === 'create' ? 'Create Product' : 'Update Product'}
                  </Button>
                )}
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={handleCategoryCreated}
      />

      {/* Brand Management Modal */}
      <BrandManagementModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onSuccess={handleBrandCreated}
      />
    </Dialog>
  )
}