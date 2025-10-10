import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface ProductImportRow {
  'Product Name': string
  'Description'?: string
  'SKU'?: string
  'Category': string
  'Brand': string
  'Unit of Measure': string
  'Is Frozen': boolean
  'Status': 'active' | 'inactive' | 'discontinued'
  'SRP Price': number
  'WSP Price': number
  'DSRP Price': number
  'ASRP Price': number
  'SRP Min Qty'?: number
  'WSP Min Qty'?: number
  'DSRP Min Qty'?: number
  'ASRP Min Qty'?: number
}

interface ImportResult {
  success: boolean
  totalRows: number
  successCount: number
  errorCount: number
  duplicateCount: number
  updatedCount: number
  skippedCount: number
  errors: Array<{
    row: number
    field: string
    message: string
  }>
  createdProducts?: string[]
  updatedProducts?: string[]
  skippedProducts?: Array<{
    row: number
    name: string
    reason: string
  }>
}

// Utility functions for data type conversion and validation
const safeStringField = (value: unknown, fieldName?: string): string => {
  if (value === null || value === undefined || value === '') return '';
  try {
    return String(value).trim();
  } catch (_error) {
    console.warn(`Failed to convert ${fieldName || 'field'} to string:`, value);
    return '';
  }
};

const safeNumericField = (value: unknown, fieldName?: string): number => {
  if (value === null || value === undefined || value === '') return 0;
  const numValue = Number(value);
  if (isNaN(numValue)) {
    throw new Error(`Invalid numeric value for ${fieldName || 'field'}: ${value}`);
  }
  return numValue;
};

const safeBooleanField = (value: unknown): boolean => {
  if (value === null || value === undefined || value === '') return false;
  if (typeof value === 'boolean') return value;
  const stringValue = String(value).toLowerCase().trim();
  return stringValue === 'true' || stringValue === '1' || stringValue === 'yes';
};

export async function POST(request: NextRequest) {
  const routeLogger = logger.child({
    route: 'POST /api/products/import',
    operation: 'importProducts'
  })
  routeLogger.time('importProducts')

  try {
    routeLogger.info('Starting product import request')

    const formData = await request.formData()
    const file = formData.get('file') as File
    const adminId = formData.get('adminId') as string
    const duplicateStrategy = formData.get('duplicateStrategy') as string || 'skip' // 'skip', 'update', 'fail'

    routeLogger.debug('Request parameters', {
      fileName: file?.name,
      fileSize: file?.size,
      adminId,
      duplicateStrategy
    })

    if (!file) {
      routeLogger.warn('No file provided in request')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!adminId) {
      routeLogger.warn('Admin ID required but not provided')
      return NextResponse.json(
        { error: 'Admin ID required' },
        { status: 400 }
      )
    }

    // Validate file type by extension
    const fileName = file.name.toLowerCase()
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const isValidFile = validExtensions.some(ext => fileName.endsWith(ext))

    if (!isValidFile) {
      routeLogger.warn('Invalid file type', { fileName })
      return NextResponse.json(
        { error: 'File must be Excel (.xlsx, .xls) or CSV (.csv) format' },
        { status: 400 }
      )
    }

    routeLogger.info('File validated', { fileName, size: file.size })

    // Read and parse file based on format
    routeLogger.info('Parsing file', { fileName })
    const arrayBuffer = await file.arrayBuffer()
    let workbook

    if (fileName.endsWith('.csv')) {
      // Parse CSV file - convert to text first with enhanced options
      routeLogger.debug('Parsing CSV file')
      const text = new TextDecoder('utf-8').decode(arrayBuffer)
      workbook = XLSX.read(text, {
        type: 'string',
        raw: false,
        cellText: true,     // Preserve text formatting
        cellDates: false,   // Don't auto-convert dates
        cellNF: false,      // Don't use number format
        cellStyles: false   // Ignore styles
      })
    } else {
      // Parse Excel files (XLSX/XLS)
      routeLogger.debug('Parsing Excel file')
      workbook = XLSX.read(arrayBuffer, { type: 'buffer' })
    }

    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as ProductImportRow[]

    routeLogger.info('File parsed successfully', { rowCount: jsonData.length })

    if (jsonData.length === 0) {
      routeLogger.warn('File is empty or has no valid data')
      return NextResponse.json(
        { error: 'File is empty or has no valid data' },
        { status: 400 }
      )
    }

    const result: ImportResult = {
      success: false,
      totalRows: jsonData.length,
      successCount: 0,
      errorCount: 0,
      duplicateCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errors: [],
      createdProducts: [],
      updatedProducts: [],
      skippedProducts: []
    }

    // Load categories and brands for validation
    routeLogger.info('Loading reference data for validation')
    routeLogger.db('SELECT', 'categories, brands')
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)

    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id, name')
      .eq('is_active', true)

    if (categoriesError || brandsError) {
      routeLogger.error('Failed to load categories and brands', categoriesError || brandsError)
      return NextResponse.json(
        { error: 'Failed to load categories and brands' },
        { status: 500 }
      )
    }

    const categoryMap = new Map(categories?.map(c => [c.name.toLowerCase(), c.id]))
    const brandMap = new Map(brands?.map(b => [b.name.toLowerCase(), b.id]))

    routeLogger.debug('Reference data loaded', {
      categoryCount: categories?.length || 0,
      brandCount: brands?.length || 0
    })

    // Load existing products for duplicate detection
    routeLogger.info('Loading existing products for duplicate detection')
    routeLogger.db('SELECT', 'products')
    const { data: existingProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, sku, category_id, brand_id')
      .eq('status', 'active')

    if (productsError) {
      routeLogger.error('Failed to load existing products', productsError)
      return NextResponse.json(
        { error: 'Failed to load existing products for duplicate detection' },
        { status: 500 }
      )
    }

    // Create maps for quick duplicate detection
    const skuMap = new Map(existingProducts?.filter(p => p.sku).map(p => [p.sku.toLowerCase(), p]) || [])
    const nameMap = new Map(existingProducts?.map(p => [p.name.toLowerCase(), p]) || [])

    routeLogger.debug('Existing products loaded', { count: existingProducts?.length || 0 })

    // Process each row
    routeLogger.info('Starting product processing', { totalRows: jsonData.length, duplicateStrategy })
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      const rowNumber = i + 2 // Excel row number (accounting for header)

      try {
        // Convert and validate required fields using safe conversion
        const productName = safeStringField(row['Product Name'], 'Product Name')
        const categoryName = safeStringField(row['Category'], 'Category')
        const brandName = safeStringField(row['Brand'], 'Brand')
        const sku = safeStringField(row['SKU'], 'SKU')
        const description = safeStringField(row['Description'], 'Description')
        const unitOfMeasure = safeStringField(row['Unit of Measure'], 'Unit of Measure') || 'pieces'
        const status = safeStringField(row['Status'], 'Status') || 'active'

        // Validate required fields
        if (!productName) {
          result.errors.push({
            row: rowNumber,
            field: 'Product Name',
            message: 'Product name is required'
          })
          continue
        }

        if (!categoryName) {
          result.errors.push({
            row: rowNumber,
            field: 'Category',
            message: 'Category name is required'
          })
          continue
        }

        if (!brandName) {
          result.errors.push({
            row: rowNumber,
            field: 'Brand',
            message: 'Brand name is required'
          })
          continue
        }

        // Validate category and brand exist
        const categoryId = categoryMap.get(categoryName.toLowerCase())
        if (!categoryId) {
          result.errors.push({
            row: rowNumber,
            field: 'Category',
            message: `Category "${categoryName}" not found`
          })
          continue
        }

        const brandId = brandMap.get(brandName.toLowerCase())
        if (!brandId) {
          result.errors.push({
            row: rowNumber,
            field: 'Brand',
            message: `Brand "${brandName}" not found`
          })
          continue
        }

        // Validate pricing using safe conversion
        const srpPrice = safeNumericField(row['SRP Price'], 'SRP Price')
        if (srpPrice <= 0) {
          result.errors.push({
            row: rowNumber,
            field: 'SRP Price',
            message: 'SRP price must be greater than 0'
          })
          continue
        }

        // Convert other pricing fields
        const wspPrice = safeNumericField(row['WSP Price'], 'WSP Price')
        const dsrpPrice = safeNumericField(row['DSRP Price'], 'DSRP Price')
        const asrpPrice = safeNumericField(row['ASRP Price'], 'ASRP Price')
        const srpMinQty = safeNumericField(row['SRP Min Qty'], 'SRP Min Qty') || 1
        const wspMinQty = safeNumericField(row['WSP Min Qty'], 'WSP Min Qty') || 10
        const dsrpMinQty = safeNumericField(row['DSRP Min Qty'], 'DSRP Min Qty') || 20
        const asrpMinQty = safeNumericField(row['ASRP Min Qty'], 'ASRP Min Qty') || 5

        // Auto-detect frozen status from category name
        const isFrozen = categoryName.toLowerCase().includes('frozen') || safeBooleanField(row['Is Frozen'])

        // Check for duplicates
        let existingProduct = null
        let duplicateType = ''

        // Check by SKU first (most specific)
        if (sku) {
          existingProduct = skuMap.get(sku.toLowerCase())
          if (existingProduct) duplicateType = 'SKU'
        }

        // Check by name if no SKU duplicate found
        if (!existingProduct) {
          existingProduct = nameMap.get(productName.toLowerCase())
          if (existingProduct) duplicateType = 'Name'
        }

        // Handle duplicates based on strategy
        if (existingProduct) {
          result.duplicateCount++

          if (duplicateStrategy === 'fail') {
            result.errors.push({
              row: rowNumber,
              field: duplicateType,
              message: `Duplicate product found by ${duplicateType}: "${productName}" already exists`
            })
            continue
          } else if (duplicateStrategy === 'skip') {
            result.skippedCount++
            result.skippedProducts?.push({
              row: rowNumber,
              name: productName,
              reason: `Duplicate ${duplicateType}: ${duplicateType === 'SKU' ? sku : 'Same name'}`
            })
            continue
          } else if (duplicateStrategy === 'update') {
            // Update existing product logic will be handled below
            // Continue to update section
          }
        }

        // Create product using the enhanced database function
        const pricingTiers = []

        if (srpPrice > 0) {
          pricingTiers.push({
            tier_type: 'retail',
            price: srpPrice,
            min_quantity: srpMinQty,
            is_active: true
          })
        }

        if (wspPrice > 0) {
          pricingTiers.push({
            tier_type: 'wholesale',
            price: wspPrice,
            min_quantity: wspMinQty,
            is_active: true
          })
        }

        if (dsrpPrice > 0) {
          pricingTiers.push({
            tier_type: 'box',
            price: dsrpPrice,
            min_quantity: dsrpMinQty,
            is_active: true
          })
        }

        if (pricingTiers.length === 0) {
          result.errors.push({
            row: rowNumber,
            field: 'pricing',
            message: 'At least one pricing tier is required'
          })
          continue
        }

        if (existingProduct && duplicateStrategy === 'update') {
          // Update existing product
          const { error: updateError } = await supabase
            .from('products')
            .update({
              name: productName,
              description: description || null,
              sku: sku || null,
              category_id: categoryId,
              brand_id: brandId,
              unit_of_measure: unitOfMeasure,
              status: status,
              updated_by: adminId,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingProduct.id)
            .select()
            .single()

          if (updateError) {
            result.errors.push({
              row: rowNumber,
              field: 'product_update',
              message: `Failed to update product: ${updateError.message}`
            })
            continue
          }

          // Update pricing tiers - delete existing and create new ones
          if (pricingTiers.length > 0) {
            // Delete existing pricing tiers
            await supabase
              .from('price_tiers')
              .delete()
              .eq('product_id', existingProduct.id)

            // Create new pricing tiers
            const pricingData = pricingTiers.map(tier => ({
              product_id: existingProduct.id,
              tier_type: tier.tier_type,
              price: tier.price,
              min_quantity: tier.min_quantity,
              is_active: tier.is_active,
              created_by: adminId
            }))

            const { error: pricingError } = await supabase
              .from('price_tiers')
              .insert(pricingData)

            if (pricingError) {
              console.warn('Failed to update pricing tiers for product:', existingProduct.id, pricingError.message)
              result.errors.push({
                row: rowNumber,
                field: 'pricing_tiers_update',
                message: `Failed to update pricing tiers: ${pricingError.message}`
              })
            }
          }

          result.updatedProducts?.push(existingProduct.id)
          result.updatedCount++
          result.successCount++

        } else {
          // Create new product
          try {
            // Try using the enhanced database function first
            const { data: productId, error: functionError } = await supabase.rpc(
              'create_product_with_inventory',
              {
                p_name: productName,
                p_description: description || null,
                p_sku: sku || null,
                p_category_id: categoryId,
                p_brand_id: brandId,
                p_unit_of_measure: unitOfMeasure,
                p_pricing_tiers: JSON.stringify(pricingTiers),
                p_admin_id: adminId
              }
            )

            if (functionError) {
              // Fallback to manual creation
              const { data: product, error: productError } = await supabase
                .from('products')
                .insert({
                  name: productName,
                  description: description || null,
                  sku: sku || null,
                  category_id: categoryId,
                  brand_id: brandId,
                  unit_of_measure: unitOfMeasure,
                  status: status,
                  created_by: adminId
                })
                .select()
                .single()

              if (productError) {
                // Handle constraint violations gracefully
                if (productError.code === '23505') { // Unique constraint violation
                  if (duplicateStrategy === 'fail') {
                    result.errors.push({
                      row: rowNumber,
                      field: 'constraint_violation',
                      message: `Duplicate constraint violation: ${productError.message}`
                    })
                  } else {
                    result.skippedCount++
                    result.skippedProducts?.push({
                      row: rowNumber,
                      name: productName,
                      reason: 'Constraint violation - duplicate detected during creation'
                    })
                  }
                } else {
                  result.errors.push({
                    row: rowNumber,
                    field: 'product',
                    message: `Failed to create product: ${productError.message}`
                  })
                }
                continue
              }

              // Create pricing tiers manually
              if (pricingTiers.length > 0) {
                const pricingData = pricingTiers.map(tier => ({
                  product_id: product.id,
                  tier_type: tier.tier_type,
                  price: tier.price,
                  min_quantity: tier.min_quantity,
                  is_active: tier.is_active,
                  created_by: adminId
                }))

                const { error: pricingError } = await supabase
                  .from('price_tiers')
                  .insert(pricingData)

                if (pricingError) {
                  console.warn('Failed to create pricing tiers for product:', product.id, pricingError.message)
                  result.errors.push({
                    row: rowNumber,
                    field: 'pricing_tiers_creation',
                    message: `Failed to create pricing tiers: ${pricingError.message}`
                  })
                }
              }

              result.createdProducts?.push(product.id)
            } else {
              result.createdProducts?.push(productId)
            }

            result.successCount++

          } catch (error) {
            result.errors.push({
              row: rowNumber,
              field: 'general',
              message: error instanceof Error ? error.message : 'Unexpected error occurred during product creation'
            })
            continue
          }
        }

      } catch (error) {
        result.errors.push({
          row: rowNumber,
          field: 'general',
          message: error instanceof Error ? error.message : 'Unexpected error occurred'
        })
        result.errorCount++
      }
    }

    result.errorCount = result.errors.length
    result.success = result.successCount > 0 || result.skippedCount > 0

    const duration = routeLogger.timeEnd('importProducts')
    routeLogger.success('Product import completed', {
      duration,
      totalRows: result.totalRows,
      successCount: result.successCount,
      errorCount: result.errorCount,
      duplicateCount: result.duplicateCount,
      updatedCount: result.updatedCount,
      skippedCount: result.skippedCount,
      createdProducts: result.createdProducts?.length || 0,
      success: result.success
    })

    return NextResponse.json(result)

  } catch (error) {
    routeLogger.error('Product import error', error as Error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to import products',
        success: false
      },
      { status: 500 }
    )
  }
}