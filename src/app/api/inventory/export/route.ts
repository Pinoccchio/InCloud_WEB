import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'xlsx'
    const includeExpired = searchParams.get('includeExpired') === 'true'
    const includeBatches = searchParams.get('includeBatches') === 'true'

    // Get main branch ID
    const { data: branchData, error: branchError } = await supabase
      .from('branches')
      .select('id')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (branchError || !branchData) {
      return NextResponse.json(
        { error: 'Failed to get main branch information' },
        { status: 500 }
      )
    }

    const branchId = branchData.id

    // Fetch inventory with related data
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select(`
        id,
        quantity,
        available_quantity,
        reserved_quantity,
        min_stock_level,
        low_stock_threshold,
        cost_per_unit,
        last_restock_date,
        location,
        created_at,
        products!inner (
          id,
          name,
          sku,
          description,
          unit_of_measure,
          status,
          categories (name),
          brands (name)
        ),
        product_batches (
          id,
          batch_number,
          quantity,
          received_date,
          expiration_date,
          cost_per_unit,
          supplier_name,
          supplier_info,
          status,
          is_active
        )
      `)
      .eq('branch_id', branchId)
      .order('products(name)')

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch inventory' },
        { status: 500 }
      )
    }

    if (!inventory || inventory.length === 0) {
      return NextResponse.json(
        { error: 'No inventory found' },
        { status: 404 }
      )
    }

    const currentDate = new Date()

    // Transform data for Excel export
    const excelData = inventory.map(item => {
      const product = item.products
      const batches = item.product_batches || []

      // Calculate stock status
      let stockStatus = 'Good'
      if (item.available_quantity <= item.low_stock_threshold) {
        stockStatus = 'Low Stock'
      } else if (item.available_quantity <= item.min_stock_level) {
        stockStatus = 'Below Minimum'
      }

      // Check for expiring batches (within 30 days)
      const expiringBatches = batches.filter(batch => {
        if (!batch.expiration_date) return false
        const expiryDate = new Date(batch.expiration_date)
        const thirtyDaysFromNow = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        return expiryDate <= thirtyDaysFromNow && expiryDate > currentDate
      })

      // Check for expired batches
      const expiredBatches = batches.filter(batch => {
        if (!batch.expiration_date) return false
        const expiryDate = new Date(batch.expiration_date)
        return expiryDate <= currentDate
      })

      // Calculate total value
      const totalValue = item.quantity * item.cost_per_unit

      return {
        'Product Name': product?.name || '',
        'SKU': product?.sku || '',
        'Description': product?.description || '',
        'Category': product?.categories?.name || '',
        'Brand': product?.brands?.name || '',
        'Unit of Measure': product?.unit_of_measure || '',
        'Current Quantity': item.quantity || 0,
        'Available Quantity': item.available_quantity || 0,
        'Reserved Quantity': item.reserved_quantity || 0,
        'Stock Status': stockStatus,
        'Low Stock Threshold': item.low_stock_threshold || 0,
        'Min Stock Level': item.min_stock_level || 0,
        'Cost Per Unit': item.cost_per_unit || 0,
        'Total Value': totalValue,
        'Location': item.location || '',
        'Last Restock Date': item.last_restock_date ? new Date(item.last_restock_date).toLocaleDateString() : '',
        'Total Batches': batches.length,
        'Expiring Soon (30 days)': expiringBatches.length,
        'Expired Batches': expiredBatches.length,
        'Product Status': product?.status || '',
        'Created Date': item.created_at ? new Date(item.created_at).toLocaleDateString() : ''
      }
    })

    if (format === 'json') {
      const response: {
        inventory: Record<string, any>[];
        totalCount: number;
        exportedAt: string;
        summary: {
          totalProducts: number;
          lowStockItems: number;
          totalValue: number;
        };
        batches?: Record<string, any>[];
      } = {
        inventory: excelData,
        totalCount: inventory.length,
        exportedAt: new Date().toISOString(),
        summary: {
          totalProducts: inventory.length,
          lowStockItems: excelData.filter(item => item['Stock Status'] === 'Low Stock').length,
          totalValue: excelData.reduce((sum, item) => sum + item['Total Value'], 0)
        }
      }

      if (includeBatches) {
        response.batches = inventory.flatMap(item =>
          (item.product_batches || []).map(batch => ({
            'Product Name': item.products?.name || '',
            'SKU': item.products?.sku || '',
            'Batch Number': batch.batch_number,
            'Batch Quantity': batch.quantity,
            'Received Date': batch.received_date ? new Date(batch.received_date).toLocaleDateString() : '',
            'Expiration Date': batch.expiration_date ? new Date(batch.expiration_date).toLocaleDateString() : '',
            'Cost Per Unit': batch.cost_per_unit,
            'Supplier Name': batch.supplier_name,
            'Supplier Contact': batch.supplier_info?.contact || '',
            'Supplier Email': batch.supplier_info?.email || '',
            'Purchase Order': batch.supplier_info?.purchase_order_ref || '',
            'Status': batch.status,
            'Is Active': batch.is_active ? 'Yes' : 'No'
          }))
        )
      }

      return NextResponse.json(response)
    }

    // Create Excel workbook
    const workbook = XLSX.utils.book_new()

    // Main inventory sheet
    const mainWorksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths for main sheet
    const mainColumnWidths = [
      { wch: 25 }, // Product Name
      { wch: 15 }, // SKU
      { wch: 30 }, // Description
      { wch: 15 }, // Category
      { wch: 15 }, // Brand
      { wch: 15 }, // Unit of Measure
      { wch: 12 }, // Current Quantity
      { wch: 12 }, // Available Quantity
      { wch: 12 }, // Reserved Quantity
      { wch: 12 }, // Stock Status
      { wch: 12 }, // Low Stock Threshold
      { wch: 12 }, // Min Stock Level
      { wch: 12 }, // Cost Per Unit
      { wch: 15 }, // Total Value
      { wch: 15 }, // Location
      { wch: 15 }, // Last Restock Date
      { wch: 12 }, // Total Batches
      { wch: 15 }, // Expiring Soon
      { wch: 12 }, // Expired Batches
      { wch: 12 }, // Product Status
      { wch: 15 }  // Created Date
    ]
    mainWorksheet['!cols'] = mainColumnWidths

    XLSX.utils.book_append_sheet(workbook, mainWorksheet, 'Inventory')

    // Add batches sheet if requested
    if (includeBatches) {
      const batchData = inventory.flatMap(item =>
        (item.product_batches || [])
          .filter(batch => includeExpired || !batch.expiration_date || new Date(batch.expiration_date) > currentDate)
          .map(batch => ({
            'Product Name': item.products?.name || '',
            'SKU': item.products?.sku || '',
            'Batch Number': batch.batch_number,
            'Batch Quantity': batch.quantity,
            'Received Date': batch.received_date ? new Date(batch.received_date).toLocaleDateString() : '',
            'Expiration Date': batch.expiration_date ? new Date(batch.expiration_date).toLocaleDateString() : '',
            'Days Until Expiry': batch.expiration_date ?
              Math.ceil((new Date(batch.expiration_date).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) : '',
            'Cost Per Unit': batch.cost_per_unit,
            'Total Batch Value': batch.quantity * batch.cost_per_unit,
            'Supplier Name': batch.supplier_name,
            'Supplier Contact': batch.supplier_info?.contact || '',
            'Supplier Email': batch.supplier_info?.email || '',
            'Purchase Order': batch.supplier_info?.purchase_order_ref || '',
            'Status': batch.status,
            'Is Active': batch.is_active ? 'Yes' : 'No'
          }))
      )

      if (batchData.length > 0) {
        const batchWorksheet = XLSX.utils.json_to_sheet(batchData)

        const batchColumnWidths = [
          { wch: 25 }, // Product Name
          { wch: 15 }, // SKU
          { wch: 20 }, // Batch Number
          { wch: 12 }, // Batch Quantity
          { wch: 15 }, // Received Date
          { wch: 15 }, // Expiration Date
          { wch: 15 }, // Days Until Expiry
          { wch: 12 }, // Cost Per Unit
          { wch: 15 }, // Total Batch Value
          { wch: 20 }, // Supplier Name
          { wch: 15 }, // Supplier Contact
          { wch: 20 }, // Supplier Email
          { wch: 15 }, // Purchase Order
          { wch: 10 }, // Status
          { wch: 10 }  // Is Active
        ]
        batchWorksheet['!cols'] = batchColumnWidths

        XLSX.utils.book_append_sheet(workbook, batchWorksheet, 'Batches')
      }
    }

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `InCloud_Inventory_Export_${timestamp}.xlsx`

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
    console.error('Inventory export error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to export inventory'
      },
      { status: 500 }
    )
  }
}