import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { logger } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  const routeLogger = logger.child({
    route: 'GET /api/products/export',
    operation: 'exportProducts'
  })
  routeLogger.time('exportProducts')

  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'xlsx'
    const includeInactive = searchParams.get('includeInactive') === 'true'

    routeLogger.info('Starting product export', { format, includeInactive })

    // Fetch products with related data
    routeLogger.info('Fetching products from database')
    routeLogger.db('SELECT', 'products')
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        sku,
        unit_of_measure,
        status,
        created_at,
        categories!inner (
          name
        ),
        brands!inner (
          name
        ),
        price_tiers (
          pricing_type,
          price,
          min_quantity,
          max_quantity,
          is_active
        )
      `)
      .order('name')

    if (!includeInactive) {
      query = query.eq('status', 'available')
    }

    const { data: products, error } = await query

    if (error) {
      routeLogger.error('Failed to fetch products', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    if (!products || products.length === 0) {
      routeLogger.warn('No products found for export')
      return NextResponse.json(
        { error: 'No products found' },
        { status: 404 }
      )
    }

    routeLogger.debug('Products fetched successfully', { count: products.length })

    // Transform data for Excel export
    routeLogger.info('Transforming data for export', { format })
    const excelData = products.map(product => {
      // Get pricing tiers
      const priceTiers = product.price_tiers || []
      const srpTier = priceTiers.find(p => p.pricing_type === 'retail')
      const wspTier = priceTiers.find(p => p.pricing_type === 'wholesale')
      const dsrpTier = priceTiers.find(p => p.pricing_type === 'distributor')
      const asrpTier = priceTiers.find(p => p.pricing_type === 'agent')

      return {
        'Product Name': product.name,
        'Description': product.description || '',
        'SKU': product.sku || '',
        'Category': product.categories?.name || '',
        'Brand': product.brands?.name || '',
        'Unit of Measure': product.unit_of_measure,
        'Status': product.status,
        'SRP Price': srpTier?.price || 0,
        'SRP Min Qty': srpTier?.min_quantity || 1,
        'WSP Price': wspTier?.price || 0,
        'WSP Min Qty': wspTier?.min_quantity || 10,
        'DSRP Price': dsrpTier?.price || 0,
        'DSRP Min Qty': dsrpTier?.min_quantity || 20,
        'ASRP Price': asrpTier?.price || 0,
        'ASRP Min Qty': asrpTier?.min_quantity || 5,
        'Created Date': product.created_at ? new Date(product.created_at).toLocaleDateString() : ''
      }
    })

    routeLogger.debug('Data transformation completed', { rows: excelData.length })

    if (format === 'json') {
      const duration = routeLogger.timeEnd('exportProducts')
      routeLogger.success('JSON export completed', { duration, count: products.length })
      return NextResponse.json({
        products: excelData,
        totalCount: products.length,
        exportedAt: new Date().toISOString()
      })
    }

    // Create Excel workbook
    routeLogger.info('Generating Excel file')
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const columnWidths = [
      { wch: 25 }, // Product Name
      { wch: 40 }, // Description
      { wch: 15 }, // SKU
      { wch: 15 }, // Category
      { wch: 15 }, // Brand
      { wch: 15 }, // Unit of Measure
      { wch: 10 }, // Status
      { wch: 12 }, // SRP Price
      { wch: 12 }, // SRP Min Qty
      { wch: 12 }, // WSP Price
      { wch: 12 }, // WSP Min Qty
      { wch: 12 }, // DSRP Price
      { wch: 12 }, // DSRP Min Qty
      { wch: 12 }, // ASRP Price
      { wch: 12 }, // ASRP Min Qty
      { wch: 15 }  // Created Date
    ]
    worksheet['!cols'] = columnWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `InCloud_Products_Export_${timestamp}.xlsx`

    const duration = routeLogger.timeEnd('exportProducts')
    routeLogger.success('Excel export completed', {
      duration,
      filename,
      productCount: products.length,
      fileSize: excelBuffer.length
    })

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString()
      }
    })

  } catch (error) {
    routeLogger.error('Product export error', error as Error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to export products'
      },
      { status: 500 }
    )
  }
}