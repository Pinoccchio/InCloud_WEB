import { NextRequest, NextResponse } from 'next/server'
import { AlertService } from '@/lib/services/alertService'

export async function POST(request: NextRequest) {
  try {
    // Verify cron job authorization (optional security check)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'default-secret'

    if (authHeader !== `Bearer ${expectedToken}`) {
      console.warn('⚠️  Unauthorized cron job attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('⏰ Starting scheduled alert generation...')

    // Run scheduled alert generation
    const result = await AlertService.scheduleAlertGeneration()

    console.log('✅ Scheduled alert generation completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Scheduled alert generation completed',
      timestamp: new Date().toISOString(),
      data: result
    })

  } catch (error) {
    console.error('❌ Cron job error:', error)
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
  try {
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
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    )
  }
}