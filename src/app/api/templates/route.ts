import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  const routeLogger = logger.child({
    route: 'GET /api/templates',
    operation: 'generateTemplate'
  })
  routeLogger.time('generateTemplate')

  try {
    routeLogger.info('Starting template generation request')

    const { searchParams } = new URL(request.url)
    const templateType = searchParams.get('type') || 'products'

    routeLogger.debug('Template type requested', { templateType })

    if (templateType === 'products') {
      return generateProductsTemplate(routeLogger)
    } else if (templateType === 'inventory') {
      return generateInventoryTemplate(routeLogger)
    } else {
      routeLogger.warn('Invalid template type requested', { templateType })
      return NextResponse.json(
        { error: 'Invalid template type. Use "products" or "inventory"' },
        { status: 400 }
      )
    }

  } catch (error) {
    routeLogger.error('Unexpected error in template generation', error as Error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate template'
      },
      { status: 500 }
    )
  }
}

async function generateProductsTemplate(routeLogger: ReturnType<typeof logger.child>) {
  try {
    routeLogger.info('Generating products template')

    // Get active categories and brands for reference
    routeLogger.debug('Fetching categories and brands for reference')
    routeLogger.db('SELECT', 'categories, brands')
    const [categoriesResult, brandsResult] = await Promise.all([
      supabase.from('categories').select('name').eq('is_active', true).order('name'),
      supabase.from('brands').select('name').eq('is_active', true).order('name')
    ])

    const categories = categoriesResult.data || []
    const brands = brandsResult.data || []

    routeLogger.debug('Reference data fetched', {
      categoriesCount: categories.length,
      brandsCount: brands.length
    })

    // Create workbook
    routeLogger.info('Creating Excel workbook for products template')
    const workbook = XLSX.utils.book_new()

    // Products template data with headers and sample rows
    const productsData = [
      {
        'Product Name': 'PF TJ Hotdog Regular 1KG',
        'Description': 'Premium quality hotdog, 1 kilogram pack, frozen food item',
        'Product ID': 'PF-TJ-1KG-001',
        'Barcode': '1234567890123',
        'Category': 'Frozen Foods',
        'Brand': 'Purefoods',
        'Unit of Measure': 'pieces',
        'Is Frozen': true,
        'Status': 'active',
        'SRP Price': 200.00,
        'WSP Price': 193.00,
        'DSRP Price': 185.84,
        'ASRP Price': 197.00,
        'SRP Min Qty': 1,
        'WSP Min Qty': 10,
        'DSRP Min Qty': 20,
        'ASRP Min Qty': 5
      },
      {
        'Product Name': 'Sample Product 2',
        'Description': 'Description for sample product 2',
        'Product ID': 'PRODUCT-ID-002',
        'Barcode': '9876543210987',
        'Category': 'Beverages',
        'Brand': 'Brand Name',
        'Unit of Measure': 'boxes',
        'Is Frozen': false,
        'Status': 'active',
        'SRP Price': 150.00,
        'WSP Price': 140.00,
        'DSRP Price': 130.00,
        'ASRP Price': 145.00,
        'SRP Min Qty': 1,
        'WSP Min Qty': 12,
        'DSRP Min Qty': 24,
        'ASRP Min Qty': 6
      }
    ]

    const productsWorksheet = XLSX.utils.json_to_sheet(productsData)

    // Set column widths
    const columnWidths = [
      { wch: 30 }, // Product Name
      { wch: 50 }, // Description
      { wch: 15 }, // Product ID
      { wch: 15 }, // Barcode
      { wch: 20 }, // Category
      { wch: 20 }, // Brand
      { wch: 15 }, // Unit of Measure
      { wch: 10 }, // Is Frozen
      { wch: 10 }, // Status
      { wch: 12 }, // SRP Price
      { wch: 12 }, // WSP Price
      { wch: 12 }, // DSRP Price
      { wch: 12 }, // ASRP Price
      { wch: 12 }, // SRP Min Qty
      { wch: 12 }, // WSP Min Qty
      { wch: 12 }, // DSRP Min Qty
      { wch: 12 }  // ASRP Min Qty
    ]
    productsWorksheet['!cols'] = columnWidths

    // Add products sheet
    XLSX.utils.book_append_sheet(workbook, productsWorksheet, 'Products')

    // Add instructions sheet
    const instructionsData = [
      { 'Field': 'Product Name', 'Required': 'YES', 'Type': 'Text', 'Description': 'Product name (e.g., "PF TJ Hotdog Regular 1KG")', 'Example': 'PF TJ Hotdog Regular 1KG' },
      { 'Field': 'Description', 'Required': 'NO', 'Type': 'Text', 'Description': 'Detailed product description', 'Example': 'Premium quality hotdog, 1 kilogram pack' },
      { 'Field': 'Product ID', 'Required': 'NO', 'Type': 'Text', 'Description': 'Unique product identifier code', 'Example': 'PF-TJ-1KG-001' },
      { 'Field': 'Barcode', 'Required': 'NO', 'Type': 'Text', 'Description': 'Product barcode number', 'Example': '1234567890123' },
      { 'Field': 'Category', 'Required': 'YES', 'Type': 'Text', 'Description': 'Must match existing category name exactly', 'Example': 'Frozen Foods' },
      { 'Field': 'Brand', 'Required': 'YES', 'Type': 'Text', 'Description': 'Must match existing brand name exactly', 'Example': 'Purefoods' },
      { 'Field': 'Unit of Measure', 'Required': 'NO', 'Type': 'Text', 'Description': 'pieces, boxes, kilograms, grams, liters, packs', 'Example': 'pieces' },
      { 'Field': 'Is Frozen', 'Required': 'NO', 'Type': 'Boolean', 'Description': 'true/false or YES/NO', 'Example': 'true' },
      { 'Field': 'Status', 'Required': 'NO', 'Type': 'Text', 'Description': 'active, inactive, discontinued', 'Example': 'active' },
      { 'Field': 'SRP Price', 'Required': 'YES', 'Type': 'Number', 'Description': 'Suggested Retail Price (₱)', 'Example': '200.00' },
      { 'Field': 'WSP Price', 'Required': 'NO', 'Type': 'Number', 'Description': 'Wholesale Price (₱)', 'Example': '193.00' },
      { 'Field': 'DSRP Price', 'Required': 'NO', 'Type': 'Number', 'Description': 'Distributor Price (₱)', 'Example': '185.84' },
      { 'Field': 'ASRP Price', 'Required': 'NO', 'Type': 'Number', 'Description': 'Agent Price (₱)', 'Example': '197.00' },
      { 'Field': 'SRP Min Qty', 'Required': 'NO', 'Type': 'Number', 'Description': 'Minimum quantity for SRP pricing', 'Example': '1' },
      { 'Field': 'WSP Min Qty', 'Required': 'NO', 'Type': 'Number', 'Description': 'Minimum quantity for WSP pricing', 'Example': '10' },
      { 'Field': 'DSRP Min Qty', 'Required': 'NO', 'Type': 'Number', 'Description': 'Minimum quantity for DSRP pricing', 'Example': '20' },
      { 'Field': 'ASRP Min Qty', 'Required': 'NO', 'Type': 'Number', 'Description': 'Minimum quantity for ASRP pricing', 'Example': '5' }
    ]

    const instructionsWorksheet = XLSX.utils.json_to_sheet(instructionsData)
    instructionsWorksheet['!cols'] = [
      { wch: 15 }, // Field
      { wch: 10 }, // Required
      { wch: 10 }, // Type
      { wch: 50 }, // Description
      { wch: 25 }  // Example
    ]
    XLSX.utils.book_append_sheet(workbook, instructionsWorksheet, 'Instructions')

    // Add categories reference sheet
    if (categories.length > 0) {
      const categoriesWorksheet = XLSX.utils.json_to_sheet(categories)
      categoriesWorksheet['!cols'] = [{ wch: 30 }]
      XLSX.utils.book_append_sheet(workbook, categoriesWorksheet, 'Available Categories')
    }

    // Add brands reference sheet
    if (brands.length > 0) {
      const brandsWorksheet = XLSX.utils.json_to_sheet(brands)
      brandsWorksheet['!cols'] = [{ wch: 30 }]
      XLSX.utils.book_append_sheet(workbook, brandsWorksheet, 'Available Brands')
    }

    // Generate Excel buffer
    routeLogger.info('Generating Excel file buffer')
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const filename = 'InCloud_Products_Import_Template.xlsx'

    const duration = routeLogger.timeEnd('generateTemplate')
    routeLogger.success('Products template generated successfully', {
      duration,
      filename,
      fileSize: excelBuffer.length,
      categoriesCount: categories.length,
      brandsCount: brands.length
    })

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString()
      }
    })

  } catch (error) {
    routeLogger.error('Error generating products template', error as Error)
    throw error
  }
}

async function generateInventoryTemplate(routeLogger: ReturnType<typeof logger.child>) {
  try {
    routeLogger.info('Generating inventory template')

    // Get sample products for reference
    routeLogger.debug('Fetching sample products for reference')
    routeLogger.db('SELECT', 'products')
    const { data: products } = await supabase
      .from('products')
      .select('product_id, name')
      .eq('status', 'available')
      .order('name')
      .limit(10)

    routeLogger.debug('Sample products fetched', { count: products?.length || 0 })

    // Create workbook
    routeLogger.info('Creating Excel workbook for inventory template')
    const workbook = XLSX.utils.book_new()

    // Inventory template data with headers and sample rows
    const inventoryData = [
      {
        'Product ID': 'PF-TJ-1KG-001',
        'Add Quantity': 50,
        'Cost Per Unit': 185.84,
        'Expiration Date': '2025-12-31',
        'Supplier Name': 'Purefoods Supplier Inc.',
        'Supplier Contact': '+63 912 345 6789',
        'Supplier Email': 'orders@purefoods.com',
        'Batch Number': 'PF-TJ-1KG-001-2025-001',
        'Purchase Order Ref': 'PO-2025-001',
        'Received Date': '2025-01-15',
        'Notes': 'Regular monthly restock delivery'
      },
      {
        'Product ID': 'SAMPLE-ID-002',
        'Add Quantity': 100,
        'Cost Per Unit': 150.00,
        'Expiration Date': '2025-06-30',
        'Supplier Name': 'Sample Supplier Co.',
        'Supplier Contact': '+63 998 765 4321',
        'Supplier Email': 'supply@sample.com',
        'Batch Number': 'SAMPLE-2025-002',
        'Purchase Order Ref': 'PO-2025-002',
        'Received Date': '2025-01-15',
        'Notes': 'Promotional stock for Q1'
      }
    ]

    const inventoryWorksheet = XLSX.utils.json_to_sheet(inventoryData)

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // Product ID
      { wch: 15 }, // Add Quantity
      { wch: 15 }, // Cost Per Unit
      { wch: 15 }, // Expiration Date
      { wch: 25 }, // Supplier Name
      { wch: 18 }, // Supplier Contact
      { wch: 25 }, // Supplier Email
      { wch: 25 }, // Batch Number
      { wch: 20 }, // Purchase Order Ref
      { wch: 15 }, // Received Date
      { wch: 30 }  // Notes
    ]
    inventoryWorksheet['!cols'] = columnWidths

    // Add inventory sheet
    XLSX.utils.book_append_sheet(workbook, inventoryWorksheet, 'Inventory')

    // Add instructions sheet
    const instructionsData = [
      { 'Field': 'Product ID', 'Required': 'YES', 'Type': 'Text', 'Description': 'Product ID - must match existing product exactly', 'Example': 'PF-TJ-1KG-001' },
      { 'Field': 'Add Quantity', 'Required': 'YES', 'Type': 'Number', 'Description': 'Quantity to add to current stock', 'Example': '50' },
      { 'Field': 'Cost Per Unit', 'Required': 'YES', 'Type': 'Number', 'Description': 'Cost per unit in Philippine Pesos (₱)', 'Example': '185.84' },
      { 'Field': 'Expiration Date', 'Required': 'NO', 'Type': 'Date', 'Description': 'Format: YYYY-MM-DD (e.g., 2025-12-31)', 'Example': '2025-12-31' },
      { 'Field': 'Supplier Name', 'Required': 'YES', 'Type': 'Text', 'Description': 'Name of the supplier company', 'Example': 'Purefoods Supplier Inc.' },
      { 'Field': 'Supplier Contact', 'Required': 'NO', 'Type': 'Text', 'Description': 'Supplier phone number', 'Example': '+63 912 345 6789' },
      { 'Field': 'Supplier Email', 'Required': 'NO', 'Type': 'Text', 'Description': 'Supplier email address', 'Example': 'orders@purefoods.com' },
      { 'Field': 'Batch Number', 'Required': 'NO', 'Type': 'Text', 'Description': 'Batch tracking number (auto-generated if empty)', 'Example': 'PF-TJ-1KG-001-2025-001' },
      { 'Field': 'Purchase Order Ref', 'Required': 'NO', 'Type': 'Text', 'Description': 'Purchase order reference number', 'Example': 'PO-2025-001' },
      { 'Field': 'Received Date', 'Required': 'NO', 'Type': 'Date', 'Description': 'Date received (defaults to today if empty)', 'Example': '2025-01-15' },
      { 'Field': 'Notes', 'Required': 'NO', 'Type': 'Text', 'Description': 'Additional notes about this restock', 'Example': 'Regular monthly restock delivery' }
    ]

    const instructionsWorksheet = XLSX.utils.json_to_sheet(instructionsData)
    instructionsWorksheet['!cols'] = [
      { wch: 18 }, // Field
      { wch: 10 }, // Required
      { wch: 10 }, // Type
      { wch: 50 }, // Description
      { wch: 25 }  // Example
    ]
    XLSX.utils.book_append_sheet(workbook, instructionsWorksheet, 'Instructions')

    // Add products reference sheet
    if (products && products.length > 0) {
      const productsWorksheet = XLSX.utils.json_to_sheet(products)
      productsWorksheet['!cols'] = [
        { wch: 20 }, // product_id
        { wch: 30 }  // name
      ]
      XLSX.utils.book_append_sheet(workbook, productsWorksheet, 'Available Products')
    }

    // Generate Excel buffer
    routeLogger.info('Generating Excel file buffer')
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const filename = 'InCloud_Inventory_Import_Template.xlsx'

    const duration = routeLogger.timeEnd('generateTemplate')
    routeLogger.success('Inventory template generated successfully', {
      duration,
      filename,
      fileSize: excelBuffer.length,
      sampleProductsCount: products?.length || 0
    })

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString()
      }
    })

  } catch (error) {
    routeLogger.error('Error generating inventory template', error as Error)
    throw error
  }
}