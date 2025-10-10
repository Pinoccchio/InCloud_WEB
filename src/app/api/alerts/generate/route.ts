import { NextRequest, NextResponse } from 'next/server'
import { AlertService } from '@/lib/services/alertService'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const routeLogger = logger.child({
    route: 'POST /api/alerts/generate',
    operation: 'generateAlerts'
  })
  routeLogger.time('generateAlerts')

  try {
    // Optional: Add authentication check here
    // const session = await getServerSession()
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    routeLogger.info('Starting alert generation')

    // Generate all alerts
    const result = await AlertService.generateAllAlerts()

    const duration = routeLogger.timeEnd('generateAlerts')
    routeLogger.success('Alerts generated successfully', {
      duration,
      totalGenerated: result.totalGenerated,
      lowStockCount: result.lowStockAlerts.length,
      expirationCount: result.expirationAlerts.length
    })

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
    routeLogger.error('Error generating alerts', error as Error)
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
  const routeLogger = logger.child({
    route: 'GET /api/alerts/generate',
    operation: 'getAlertStatus'
  })
  routeLogger.time('getAlertStatus')

  try {
    routeLogger.info('Checking alert generation status')

    // Get current alert counts
    const rules = await AlertService.getActiveAlertRules()

    const duration = routeLogger.timeEnd('getAlertStatus')
    routeLogger.success('Alert status retrieved', {
      duration,
      activeRules: rules.length
    })

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
    routeLogger.error('Error checking alert status', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check alert status'
      },
      { status: 500 }
    )
  }
}