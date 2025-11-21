import { NextRequest, NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { AnalyticsService } from '@/lib/services/analyticsService'
import { PDFReportService } from '@/lib/services/pdfReportService'
import { logger } from '@/lib/logger'

const routeLogger = logger.child({ route: '/api/analytics/generate-report' })

export async function POST(request: NextRequest) {
  try {
    routeLogger.info('PDF report generation request received')

    // Parse request body
    const body = await request.json()
    const { startDate, endDate, includeAI, generatedBy } = body

    routeLogger.info('Report parameters', {
      startDate: startDate || 'all',
      endDate: endDate || 'all',
      includeAI: includeAI || false,
      generatedBy: generatedBy || 'Unknown',
    })

    // Fetch analytics data
    routeLogger.time('fetchAnalyticsData')
    const analyticsData = await AnalyticsService.getAnalyticsSnapshot(startDate, endDate)
    routeLogger.timeEnd('fetchAnalyticsData')

    // Fetch AI insights if requested
    let aiInsights = null
    if (includeAI) {
      try {
        routeLogger.time('fetchAIInsights')
        // Fetch from the analytics API with AI included
        const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/analytics?includeAI=true`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          aiInsights = aiData.aiInsights
          routeLogger.success('AI insights fetched successfully')
        } else {
          routeLogger.warn('Failed to fetch AI insights, continuing without')
        }
        routeLogger.timeEnd('fetchAIInsights')
      } catch (aiError) {
        routeLogger.error('Error fetching AI insights', aiError as Error)
        // Continue without AI insights
      }
    }

    // Prepare report options
    const reportOptions = {
      dateRange: {
        startDate,
        endDate,
      },
      includeAI,
      aiInsights,
      generatedBy,
    }

    // Generate PDF document
    routeLogger.time('generatePDF')
    const document = PDFReportService.generateDocument(analyticsData, reportOptions)
    routeLogger.timeEnd('generatePDF')

    // Render to stream
    routeLogger.time('renderToStream')
    const stream = await renderToStream(document)
    routeLogger.timeEnd('renderToStream')

    // Generate filename with date
    const currentDate = new Date().toISOString().split('T')[0]
    const dateRangeSuffix = startDate && endDate
      ? `_${startDate}_to_${endDate}`
      : startDate
      ? `_from_${startDate}`
      : endDate
      ? `_until_${endDate}`
      : '_All_Time'

    const filename = `InCloud_Analytics_Report${dateRangeSuffix}_${currentDate}.pdf`

    routeLogger.success('PDF report generated successfully', {
      filename,
      includeAI,
    })

    // Return PDF as downloadable file
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    routeLogger.error('Error generating PDF report', error as Error)

    return NextResponse.json(
      {
        error: 'Failed to generate PDF report',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
