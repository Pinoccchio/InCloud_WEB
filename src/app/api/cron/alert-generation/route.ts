import { NextRequest, NextResponse } from 'next/server'
import { AlertService } from '@/lib/services/alertService'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const routeLogger = logger.child({
    route: 'POST /api/cron/alert-generation',
    operation: 'scheduledAlertGeneration'
  })
  routeLogger.time('scheduledAlertGeneration')

  try {
    routeLogger.info('Starting cron job for scheduled alert generation')

    // Verify cron job authorization (optional security check)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'default-secret'

    if (authHeader !== `Bearer ${expectedToken}`) {
      routeLogger.warn('Unauthorized cron job attempt detected', {
        hasAuthHeader: !!authHeader
      })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    routeLogger.debug('Cron job authentication successful')

    // Run scheduled alert generation
    const result = await AlertService.scheduleAlertGeneration()

    const duration = routeLogger.timeEnd('scheduledAlertGeneration')
    routeLogger.success('Scheduled alert generation completed successfully', {
      duration,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Scheduled alert generation completed',
      timestamp: new Date().toISOString(),
      data: result
    })

  } catch (error) {
    routeLogger.error('Cron job failed', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check cron job status
export async function GET() {
  const routeLogger = logger.child({
    route: 'GET /api/cron/alert-generation',
    operation: 'cronStatus'
  })

  try {
    routeLogger.info('Cron job status check requested')
    routeLogger.success('Cron job endpoint is active')

    return NextResponse.json({
      success: true,
      message: 'Cron job endpoint is active',
      timestamp: new Date().toISOString(),
      endpoints: {
        generate: 'POST /api/cron/alert-generation',
        status: 'GET /api/cron/alert-generation'
      }
    })
  } catch (error) {
    routeLogger.error('Status check failed', error as Error)
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    )
  }
}