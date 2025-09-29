import { NextRequest, NextResponse } from 'next/server'
import { AlertService } from '@/lib/services/alertService'

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check here
    // const session = await getServerSession()
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    console.log('🚀 API: Starting alert generation...')

    // Generate all alerts
    const result = await AlertService.generateAllAlerts()

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${result.totalGenerated} alerts`,
      data: {
        lowStockAlerts: result.lowStockAlerts.length,
        expirationAlerts: result.expirationAlerts.length,
        totalGenerated: result.totalGenerated,
        breakdown: {
          lowStock: result.lowStockAlerts.map(a => ({
            type: a.type,
            severity: a.severity,
            title: a.title,
            product: a.metadata.product_name
          })),
          expiration: result.expirationAlerts.map(a => ({
            type: a.type,
            severity: a.severity,
            title: a.title,
            product: a.metadata.product_name,
            daysUntilExpiry: a.metadata.days_until_expiry
          }))
        }
      }
    })
  } catch (error) {
    console.error('❌ API: Error generating alerts:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate alerts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check alert generation status
export async function GET() {
  try {
    // Get current alert counts
    const rules = await AlertService.getActiveAlertRules()

    return NextResponse.json({
      success: true,
      data: {
        activeRules: rules.length,
        lastGenerated: new Date().toISOString(),
        availableTypes: [
          'low_stock',
          'out_of_stock',
          'expiring_soon',
          'expired',
          'overstock'
        ]
      }
    })
  } catch (error) {
    console.error('❌ API: Error checking alert status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check alert status'
      },
      { status: 500 }
    )
  }
}