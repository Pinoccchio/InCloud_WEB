'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline'
import { Button, Input, LoadingSpinner } from '@/components/ui'
import { supabase } from '@/lib/supabase/auth'
import { Database } from '@/types/supabase'
import ImageUploader from './ImageUploader'
import PricingTiers from './PricingTiers'

type Product = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']
type ProductStatus = Database['public']['Enums']['product_status']
type Category = Database['public']['Tables']['categories']['Row']
type Brand = Database['public']['Tables']['brands']['Row']

interface PriceTier {
  id?: string
  tier_type: Database['public']['Enums']['pricing_tier']
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
  sku: string
  barcode: string
  category_id: string
  brand_id: string
  unit_of_measure: string
  is_frozen: boolean
  status: ProductStatus
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
    sku: '',
    barcode: '',
    category_id: '',
    brand_id: '',
    unit_of_measure: 'pieces',
    is_frozen: true,
    status: 'active',
    images: [],
    pricingTiers: []
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)

  const steps = [
    { number: 1, name: 'Basic Info', icon: CubeIcon, description: 'Product details and classification' },
    { number: 2, name: 'Images', icon: PhotoIcon, description: 'Product photos and gallery' },
    { number: 3, name: 'Pricing', icon: CurrencyDollarIcon, description: 'Set pricing tiers and rules' },
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

    // Set basic form data first
    setFormData({
      name: product.name,
      description: product.description || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      category_id: product.category_id || '',
      brand_id: product.brand_id || '',
      unit_of_measure: product.unit_of_measure || 'pieces',
      is_frozen: product.is_frozen || true,
      status: product.status || 'active',
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
        setError('Failed to load pricing tiers')
        return
      }

      const tiers = (priceTiersData || []).map(tier => ({
        id: tier.id,
        tier_type: tier.tier_type,
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
      setError('Failed to load pricing tiers')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      barcode: '',
      category_id: '',
      brand_id: '',
      unit_of_measure: 'pieces',
      is_frozen: true,
      status: 'active',
      images: [],
      pricingTiers: []
    })
    setStep(1)
    setError(null)
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
        if (formData.pricingTiers.length === 0) return 'At least one pricing tier is required'
        const hasActiveTiers = formData.pricingTiers.some(tier => tier.is_active)
        if (!hasActiveTiers) return 'At least one pricing tier must be active'
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
    // Find the selected category
    const selectedCategory = categories.find(cat => cat.id === categoryId)

    // Auto-detect frozen status from category name
    const isFrozen = selectedCategory?.name?.toLowerCase().includes('frozen') || false

    // Update both category and frozen status
    setFormData(prev => ({
      ...prev,
      category_id: categoryId,
      is_frozen: isFrozen
    }))
    setError(null)
  }

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Product name is required'
    if (!formData.category_id) return 'Category is required'
    if (!formData.brand_id) return 'Brand is required'
    if (formData.pricingTiers.length === 0) return 'At least one pricing tier is required'

    const hasActiveTiers = formData.pricingTiers.some(tier => tier.is_active)
    if (!hasActiveTiers) return 'At least one pricing tier must be active'

    return null
  }

  const handleSubmit = async () => {
    // Validate the form
    const validation = validateForm()
    if (validation) {
      setError(validation)
      return
    }

    try {
      setSaving(true)
      setError(null)

      if (mode === 'create') {
        await createProduct()
      } else {
        await updateProduct()
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const createProduct = async () => {
    console.log('🔄 Creating product with automatic inventory integration...')

    // Try using the enhanced database function first for better integration
    try {
      const pricingTiersForFunction = formData.pricingTiers.map(tier => ({
        tier_type: tier.tier_type,
        price: typeof tier.price === 'string' ? parseFloat(tier.price) || 0 : tier.price,
        min_quantity: typeof tier.min_quantity === 'string' ? parseInt(tier.min_quantity) || 1 : tier.min_quantity,
        max_quantity: typeof tier.max_quantity === 'string' ? (tier.max_quantity === '' ? undefined : parseInt(tier.max_quantity)) : tier.max_quantity,
        is_active: tier.is_active
      }))

      const { data: functionResult, error: functionError } = await supabase.rpc(
        'create_product_with_inventory',
        {
          p_name: formData.name.trim(),
          p_description: formData.description.trim() || null,
          p_sku: formData.sku.trim() || null,
          p_barcode: formData.barcode.trim() || null,
          p_category_id: formData.category_id || null,
          p_brand_id: formData.brand_id || null,
          p_unit_of_measure: formData.unit_of_measure,
          p_is_frozen: formData.is_frozen,
          p_pricing_tiers: JSON.stringify(pricingTiersForFunction)
        }
      )

      if (functionError) {
        console.warn('Database function failed, falling back to direct insert:', functionError)
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
      console.warn('Using fallback method for product creation:', functionError)

      const productData: ProductInsert = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        sku: formData.sku.trim() || null,
        barcode: formData.barcode.trim() || null,
        category_id: formData.category_id || null,
        brand_id: formData.brand_id || null,
        unit_of_measure: formData.unit_of_measure,
        is_frozen: formData.is_frozen,
        status: formData.status,
        images: formData.images.map(img => ({
          url: img.url,
          path: img.path
        }))
      }

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()

      if (productError) throw productError

      // Create pricing tiers
      if (formData.pricingTiers.length > 0) {
        const pricingData = formData.pricingTiers.map(tier => ({
          product_id: product.id,
          tier_type: tier.tier_type,
          price: typeof tier.price === 'string' ? parseFloat(tier.price) || 0 : tier.price,
          min_quantity: typeof tier.min_quantity === 'string' ? parseInt(tier.min_quantity) || 1 : tier.min_quantity,
          max_quantity: typeof tier.max_quantity === 'string' ? (tier.max_quantity === '' ? undefined : parseInt(tier.max_quantity)) : tier.max_quantity,
          is_active: tier.is_active
        }))

        const { error: pricingError } = await supabase
          .from('price_tiers')
          .insert(pricingData)

        if (pricingError) throw pricingError
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

      const { error: inventoryError } = await supabase
        .from('inventory')
        .insert({
          product_id: product.id,
          branch_id: branchData.id,
          quantity: 0,
          reserved_quantity: 0,
          min_stock_level: 10,
          low_stock_threshold: 10,
          cost_per_unit: 0,
          location: 'Main Storage'
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

    const productData: ProductUpdate = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      sku: formData.sku.trim() || null,
      barcode: formData.barcode.trim() || null,
      category_id: formData.category_id || null,
      brand_id: formData.brand_id || null,
      unit_of_measure: formData.unit_of_measure,
      is_frozen: formData.is_frozen,
      status: formData.status,
      images: formData.images.map(img => ({
        url: img.url,
        path: img.path
      }))
    }

    const { error: productError } = await supabase
      .from('products')
      .update(productData)
      .eq('id', product.id)

    if (productError) throw productError

    // Delete existing pricing tiers
    await supabase
      .from('price_tiers')
      .delete()
      .eq('product_id', product.id)

    // Create new pricing tiers
    if (formData.pricingTiers.length > 0) {
      const pricingData = formData.pricingTiers.map(tier => ({
        product_id: product.id,
        tier_type: tier.tier_type,
        price: typeof tier.price === 'string' ? parseFloat(tier.price) || 0 : tier.price,
        min_quantity: typeof tier.min_quantity === 'string' ? parseInt(tier.min_quantity) || 1 : tier.min_quantity,
        max_quantity: typeof tier.max_quantity === 'string' ? (tier.max_quantity === '' ? undefined : parseInt(tier.max_quantity)) : tier.max_quantity,
        is_active: tier.is_active
      }))

      const { error: pricingError } = await supabase
        .from('price_tiers')
        .insert(pricingData)

      if (pricingError) throw pricingError
    }
  }

  const getMainImage = () => {
    if (formData.images && formData.images.length > 0) {
      return formData.images[0].url
    }
    return null
  }

  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
      case 'inactive':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Inactive</span>
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
                    {formData.sku && (
                      <span className="text-sm text-gray-600">SKU: {formData.sku}</span>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  SKU
                                </label>
                                <Input
                                  value={formData.sku}
                                  onChange={(e) => handleInputChange('sku', e.target.value)}
                                  placeholder="Product SKU"
                                  className="w-full"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Barcode
                                </label>
                                <Input
                                  value={formData.barcode}
                                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                                  placeholder="Product barcode"
                                  className="w-full"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Category *
                              </label>
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Brand *
                                </label>
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

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Status
                              </label>
                              <select
                                value={formData.status}
                                onChange={(e) => handleInputChange('status', e.target.value as ProductStatus)}
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="discontinued">Discontinued</option>
                              </select>
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
                          <p className="text-sm text-gray-600 mb-6">Set up pricing tiers for different customer segments</p>
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
                                  formData.status === 'active' ? 'bg-green-100 text-green-800' :
                                  formData.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
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
                              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pricing Tiers</span>
                              <p className="text-base text-gray-900 font-medium">
                                {formData.pricingTiers.filter(t => t.is_active).length} active tiers
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
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">{error}</p>
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
    </Dialog>
  )
}