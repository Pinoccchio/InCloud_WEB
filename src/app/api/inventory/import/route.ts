import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface InventoryImportRow {
  'Product ID': string
  'Add Quantity': number
  'Cost Per Unit': number
  'Expiration Date': string
  'Supplier Name': string
  'Supplier Contact'?: string
  'Supplier Email'?: string
  'Batch Number'?: string
  'Purchase Order Ref'?: string
  'Received Date'?: string
  'Notes'?: string
}

interface ImportResult {
  success: boolean
  totalRows: number
  successCount: number
  errorCount: number
  errors: Array<{
    row: number
    field: string
    message: string
  }>
  updatedInventory?: string[]
  createdBatches?: string[]
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

// Helper function to parse Excel serial numbers and date strings
const parseExcelDate = (value: unknown): Date | null => {
  // Handle null/undefined/empty values
  if (value === null || value === undefined || value === '') return null

  // Handle Excel serial numbers (like 46022.33383101852)
  if (typeof value === 'number' && value > 25569) { // Excel epoch starts at 25569 (1970-01-01)
    // Convert Excel serial number to JavaScript Date
    // Excel counts days from 1900-01-01, but has a leap year bug (treats 1900 as leap year)
    // Serial number 1 = 1900-01-01, but we need to account for the leap year bug
    const excelEpoch = new Date(1900, 0, 1) // January 1, 1900
    const daysSinceEpoch = value - 1 // Subtract 1 to account for Excel's 1-based indexing
    const millisecondsPerDay = 24 * 60 * 60 * 1000

    // Account for Excel's leap year bug (Feb 29, 1900 doesn't exist)
    const adjustedDays = value > 59 ? daysSinceEpoch - 1 : daysSinceEpoch

    return new Date(excelEpoch.getTime() + (adjustedDays * millisecondsPerDay))
  }

  // Handle string dates
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null

    const date = new Date(trimmed)
    if (isNaN(date.getTime())) return null
    return date
  }

  return null
}

// Helper function to validate and format dates (enhanced version)
const validateDate = (value: unknown, fieldName: string): string | null => {
  if (value === null || value === undefined || value === '') return null

  try {
    const parsedDate = parseExcelDate(value)
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      throw new Error(`Invalid date format for ${fieldName}`)
    }
    return parsedDate.toISOString().split('T')[0] // Return YYYY-MM-DD format
  } catch {
    const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value)
    throw new Error(`Invalid date format for ${fieldName}: ${valueStr}`)
  }
}

// Helper function to get Philippine date
const getPhilippineDate = (): string => {
  const now = new Date()
  const philippineTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)) // UTC+8
  return philippineTime.toISOString().split('T')[0]
}

export async function POST(request: NextRequest) {
  const routeLogger = logger.child({
    route: 'POST /api/inventory/import',
    operation: 'importInventory'
  })
  routeLogger.time('importInventory')

  try {
    routeLogger.info('Starting inventory import request')

    const formData = await request.formData()
    const file = formData.get('file') as File
    const adminId = formData.get('adminId') as string

    routeLogger.debug('Request parameters', {
      fileName: file?.name,
      fileSize: file?.size,
      adminId
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
      // Parse CSV file - simplified options for compatibility
      routeLogger.debug('Parsing CSV file')
      const text = new TextDecoder('utf-8').decode(arrayBuffer)
      workbook = XLSX.read(text, {
        type: 'string',
        cellDates: false,   // Don't auto-convert dates (we handle this manually)
        defval: null        // Handle empty cells properly
      })
    } else {
      // Parse Excel files (XLSX/XLS) with minimal options
      routeLogger.debug('Parsing Excel file')
      workbook = XLSX.read(arrayBuffer, {
        type: 'buffer',
        cellDates: false    // Don't auto-convert dates (we handle this manually)
      })
    }

    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as InventoryImportRow[]

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
      errors: [],
      updatedInventory: [],
      createdBatches: []
    }

    // Get main branch ID
    routeLogger.info('Loading main branch information')
    routeLogger.db('SELECT', 'branches')
    const { data: branchData, error: branchError } = await supabase
      .from('branches')
      .select('id')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (branchError || !branchData) {
      routeLogger.error('Failed to get main branch', branchError)
      return NextResponse.json(
        { error: 'Failed to get main branch information' },
        { status: 500 }
      )
    }

    const branchId = branchData.id
    routeLogger.debug('Main branch found', { branchId })

    // Get all products for Product ID lookup
    routeLogger.info('Loading products for Product ID lookup')
    routeLogger.db('SELECT', 'products')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, product_id, name')
      .eq('status', 'available')

    if (productsError) {
      routeLogger.error('Failed to load products', productsError)
      return NextResponse.json(
        { error: 'Failed to load products' },
        { status: 500 }
      )
    }

    const productIdToProductMap = new Map(
      products?.filter(p => p.product_id).map(p => [p.product_id.toLowerCase(), p]) || []
    )
    routeLogger.debug('Products loaded for Product ID mapping', { count: products?.length || 0 })

    // Process each row
    routeLogger.info('Starting row processing', { totalRows: jsonData.length })
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      const rowNumber = i + 2 // Excel row number (accounting for header)

      // Log progress every 10 rows
      if (i > 0 && i % 10 === 0) {
        routeLogger.debug('Processing progress', {
          processed: i,
          total: jsonData.length,
          successCount: result.successCount,
          errorCount: result.errors.length
        })
      }

      try {
        // Convert and validate required fields using safe conversion
        const productId = safeStringField(row['Product ID'], 'Product ID')
        const supplierName = safeStringField(row['Supplier Name'], 'Supplier Name')
        const supplierContact = safeStringField(row['Supplier Contact'], 'Supplier Contact')
        const supplierEmail = safeStringField(row['Supplier Email'], 'Supplier Email')
        const batchNumber = safeStringField(row['Batch Number'], 'Batch Number')
        const purchaseOrderRef = safeStringField(row['Purchase Order Ref'], 'Purchase Order Ref')
        const notes = safeStringField(row['Notes'], 'Notes')
        // Keep raw date values for enhanced parsing (don't convert to string first)
        const expirationDateRaw = row['Expiration Date']
        const receivedDateRaw = row['Received Date']

        // Convert numeric fields
        const addQuantity = safeNumericField(row['Add Quantity'], 'Add Quantity')
        const costPerUnit = safeNumericField(row['Cost Per Unit'], 'Cost Per Unit')

        // Validate required fields
        if (!productId) {
          result.errors.push({
            row: rowNumber,
            field: 'Product ID',
            message: 'Product ID is required'
          })
          continue
        }

        if (addQuantity <= 0) {
          result.errors.push({
            row: rowNumber,
            field: 'Add Quantity',
            message: 'Add quantity must be greater than 0'
          })
          continue
        }

        if (costPerUnit <= 0) {
          result.errors.push({
            row: rowNumber,
            field: 'Cost Per Unit',
            message: 'Cost per unit must be greater than 0'
          })
          continue
        }

        if (!supplierName) {
          result.errors.push({
            row: rowNumber,
            field: 'Supplier Name',
            message: 'Supplier name is required'
          })
          continue
        }

        // Find product by Product ID
        const product = productIdToProductMap.get(productId.toLowerCase())
        if (!product) {
          result.errors.push({
            row: rowNumber,
            field: 'Product ID',
            message: `Product with Product ID "${productId}" not found`
          })
          continue
        }

        // Validate dates
        let expirationDate: string | null = null
        let receivedDate: string

        try {
          if (expirationDateRaw) {
            expirationDate = validateDate(expirationDateRaw, 'Expiration Date')
          }

          receivedDate = receivedDateRaw
            ? validateDate(receivedDateRaw, 'Received Date')!
            : getPhilippineDate()

          // Validate date logic
          if (expirationDate && receivedDate && expirationDate <= receivedDate) {
            result.errors.push({
              row: rowNumber,
              field: 'Expiration Date',
              message: 'Expiration date must be after received date'
            })
            continue
          }

          // Check if received date is not in the future
          const today = getPhilippineDate()
          if (receivedDate > today) {
            result.errors.push({
              row: rowNumber,
              field: 'Received Date',
              message: 'Received date cannot be in the future'
            })
            continue
          }

        } catch (dateError) {
          // Enhanced error reporting with original values for debugging
          const expirationValue = typeof expirationDateRaw === 'object' ? JSON.stringify(expirationDateRaw) : String(expirationDateRaw)
          const receivedValue = typeof receivedDateRaw === 'object' ? JSON.stringify(receivedDateRaw) : String(receivedDateRaw)

          result.errors.push({
            row: rowNumber,
            field: 'date_validation',
            message: `${dateError instanceof Error ? dateError.message : 'Invalid date format'} (Expiration: ${expirationValue}, Received: ${receivedValue})`
          })
          continue
        }

        // Generate batch number if not provided with improved uniqueness
        let finalBatchNumber = batchNumber
        if (!finalBatchNumber) {
          const timestamp = Date.now()
          const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase()
          finalBatchNumber = `${productId}-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}-${randomSuffix}`
        }

        // Check if batch number already exists with retry logic
        let attempts = 0
        const maxAttempts = 5
        let batchExists = true

        while (batchExists && attempts < maxAttempts) {
          const { data: existingBatch, error: batchCheckError } = await supabase
            .from('product_batches')
            .select('id')
            .eq('batch_number', finalBatchNumber)
            .limit(1)

          if (batchCheckError) {
            result.errors.push({
              row: rowNumber,
              field: 'batch_check',
              message: 'Failed to validate batch number uniqueness'
            })
            break
          }

          if (existingBatch && existingBatch.length > 0) {
            // Batch number exists, generate a new one
            attempts++
            if (attempts < maxAttempts) {
              const timestamp = Date.now() + attempts // Add attempts to ensure uniqueness
              const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase()
              finalBatchNumber = `${productId}-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}-${randomSuffix}-${attempts}`
            } else {
              // Max attempts reached
              result.errors.push({
                row: rowNumber,
                field: 'Batch Number',
                message: `Unable to generate unique batch number after ${maxAttempts} attempts. Original: "${batchNumber}"`
              })
              batchExists = true // Keep the loop condition true to exit
              break
            }
          } else {
            batchExists = false // Unique batch number found
          }
        }

        if (batchExists) {
          continue // Skip this row due to batch number issues
        }

        // Find or create inventory record
        const { data: inventory, error: inventoryError } = await supabase
          .from('inventory')
          .select('id, quantity, cost_per_unit')
          .eq('product_id', product.id)
          .eq('branch_id', branchId)
          .single()

        let inventoryId: string
        let currentQuantity = 0

        if (inventoryError && inventoryError.code === 'PGRST116') {
          // No inventory record exists, create one
          const { data: newInventory, error: createInventoryError } = await supabase
            .from('inventory')
            .insert({
              product_id: product.id,
              branch_id: branchId,
              quantity: 0,
              reserved_quantity: 0,
              min_stock_level: 10,
              low_stock_threshold: 10,
              cost_per_unit: 0,
              location: 'Main Storage',
              created_by: adminId
            })
            .select()
            .single()

          if (createInventoryError) {
            result.errors.push({
              row: rowNumber,
              field: 'inventory_creation',
              message: `Failed to create inventory record: ${createInventoryError.message}`
            })
            continue
          }

          inventoryId = newInventory.id
          currentQuantity = 0
        } else if (inventoryError) {
          result.errors.push({
            row: rowNumber,
            field: 'inventory_lookup',
            message: `Failed to find inventory record: ${inventoryError.message}`
          })
          continue
        } else {
          inventoryId = inventory.id
          currentQuantity = inventory.quantity || 0
        }

        // Create batch record
        const batchData = {
          inventory_id: inventoryId,
          batch_number: finalBatchNumber,
          quantity: addQuantity,
          received_date: receivedDate,
          expiration_date: expirationDate,
          cost_per_unit: costPerUnit,
          supplier_name: supplierName,
          supplier_info: {
            contact: supplierContact || null,
            email: supplierEmail || null,
            purchase_order_ref: purchaseOrderRef || null
          },
          status: 'active',
          is_active: true,
          created_by: adminId
        }

        routeLogger.db('INSERT', 'product_batches')
        const { data: batchResult, error: batchError } = await supabase
          .from('product_batches')
          .insert(batchData)
          .select()
          .single()

        if (batchError) {
          result.errors.push({
            row: rowNumber,
            field: 'batch_creation',
            message: `Failed to create batch: ${batchError.message}`
          })
          continue
        }

        result.createdBatches?.push(batchResult.id)

        // Update inventory quantities
        const newQuantity = currentQuantity + addQuantity
        routeLogger.db('UPDATE', 'inventory')
        const { error: updateInventoryError } = await supabase
          .from('inventory')
          .update({
            quantity: newQuantity,
            cost_per_unit: costPerUnit,
            last_restock_date: receivedDate,
            updated_at: new Date().toISOString(),
            updated_by: adminId
          })
          .eq('id', inventoryId)

        if (updateInventoryError) {
          result.errors.push({
            row: rowNumber,
            field: 'inventory_update',
            message: `Failed to update inventory: ${updateInventoryError.message}`
          })
          continue
        }

        result.updatedInventory?.push(inventoryId)

        // Create inventory movement record
        routeLogger.db('INSERT', 'inventory_movements')
        const { error: movementError } = await supabase
          .from('inventory_movements')
          .insert({
            inventory_id: inventoryId,
            movement_type: 'restock',
            quantity_change: addQuantity,
            quantity_before: currentQuantity,
            quantity_after: newQuantity,
            reference_id: batchResult.id,
            reference_type: 'batch',
            notes: notes || `Bulk import restock from ${supplierName}`,
            performed_by: adminId
          })

        if (movementError) {
          routeLogger.warn('Failed to create movement record', { error: movementError.message })
          // Don't fail the entire operation for movement record errors
        }

        result.successCount++

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
    result.success = result.successCount > 0

    const duration = routeLogger.timeEnd('importInventory')
    routeLogger.success('Inventory import completed', {
      duration,
      totalRows: result.totalRows,
      successCount: result.successCount,
      errorCount: result.errorCount,
      createdBatches: result.createdBatches?.length || 0,
      updatedInventory: result.updatedInventory?.length || 0
    })

    return NextResponse.json(result)

  } catch (error) {
    routeLogger.error('Unexpected error in inventory import', error as Error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to import inventory',
        success: false
      },
      { status: 500 }
    )
  }
}