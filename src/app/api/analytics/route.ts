import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsService } from '@/lib/services/analyticsService'
import { GeminiService } from '@/lib/services/geminiService'
import { logger } from '@/lib/logger'

// Cache for analytics data (1 hour)
let cachedAnalytics: any = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

// Cache for AI insights (1 hour)
let cachedAIInsights: any = null
let aiCacheTimestamp: number = 0

export async function GET(request: NextRequest) {
  const routeLogger = logger.child({
    route: 'GET /api/analytics',
    operation: 'getAnalytics'
  })
  routeLogger.time('getAnalytics')

  try {
    routeLogger.info('Starting analytics request')

    const searchParams = request.nextUrl.searchParams
    const forceRefresh = searchParams.get('refresh') === 'true'
    const includeAI = searchParams.get('includeAI') !== 'false' // Default true

    routeLogger.debug('Request parameters', { forceRefresh, includeAI })

    const now = Date.now()

    // Check cache
    if (!forceRefresh && cachedAnalytics && now - cacheTimestamp < CACHE_DURATION) {
      const cacheAge = Math.floor((now - cacheTimestamp) / 1000)
      routeLogger.info('Returning cached analytics data', { cacheAge })
      const duration = routeLogger.timeEnd('getAnalytics')
      routeLogger.success('Analytics request completed (cached)', { duration, cacheAge })
      return NextResponse.json({
        ...cachedAnalytics,
        cached: true,
        cacheAge,
      })
    }

    routeLogger.info('Fetching fresh analytics data')
    // Fetch fresh analytics data
    const analyticsSnapshot = await AnalyticsService.getAnalyticsSnapshot()
    routeLogger.debug('Analytics snapshot retrieved', {
      inventoryProducts: analyticsSnapshot.inventoryMetrics.totalProducts
    })

    // Get AI insights if requested
    let aiInsights = null
    if (includeAI) {
      routeLogger.info('AI insights requested')
      // Check AI cache
      if (!forceRefresh && cachedAIInsights && now - aiCacheTimestamp < CACHE_DURATION) {
        const aiCacheAge = Math.floor((now - aiCacheTimestamp) / 1000)
        routeLogger.debug('Using cached AI insights', { aiCacheAge })
        aiInsights = cachedAIInsights
      } else {
        try {
          routeLogger.info('Generating new AI insights via Gemini')
          routeLogger.time('aiInsightsGeneration')
          aiInsights = await GeminiService.generatePrescriptiveInsights(analyticsSnapshot)
          const aiDuration = routeLogger.timeEnd('aiInsightsGeneration')
          routeLogger.success('AI insights generated', { duration: aiDuration })
          cachedAIInsights = aiInsights
          aiCacheTimestamp = now
        } catch (error) {
          routeLogger.error('AI insights generation failed', error as Error, {
            willContinueWithoutAI: true
          })
          // Continue without AI insights
        }
      }
    } else {
      routeLogger.debug('AI insights not requested')
    }

    const response = {
      ...analyticsSnapshot,
      aiInsights,
      cached: false,
    }

    // Update cache
    cachedAnalytics = response
    cacheTimestamp = now

    const duration = routeLogger.timeEnd('getAnalytics')
    routeLogger.success('Analytics request completed', {
      duration,
      hasAI: !!aiInsights,
      inventoryProducts: analyticsSnapshot.inventoryMetrics.totalProducts,
      cached: false
    })

    return NextResponse.json(response)
  } catch (error) {
    routeLogger.error('Unexpected error in analytics API', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const routeLogger = logger.child({
    route: 'POST /api/analytics',
    operation: 'analyticsAction'
  })
  routeLogger.time('analyticsAction')

  try {
    routeLogger.info('Starting analytics action request')

    const body = await request.json()
    const { action } = body
    routeLogger.debug('Action requested', { action })

    if (action === 'regenerateAI') {
      routeLogger.info('Force regenerating AI insights')
      // Force regenerate AI insights
      const analyticsSnapshot = await AnalyticsService.getAnalyticsSnapshot()
      routeLogger.debug('Analytics snapshot retrieved')

      routeLogger.info('Calling Gemini service for AI insights')
      routeLogger.time('aiRegeneration')
      const aiInsights = await GeminiService.generatePrescriptiveInsights(analyticsSnapshot)
      const aiDuration = routeLogger.timeEnd('aiRegeneration')
      routeLogger.success('AI insights regenerated', { duration: aiDuration })

      // Update cache
      cachedAIInsights = aiInsights
      aiCacheTimestamp = Date.now()
      routeLogger.debug('AI cache updated')

      const duration = routeLogger.timeEnd('analyticsAction')
      routeLogger.success('AI regeneration completed', { duration })

      return NextResponse.json({
        success: true,
        aiInsights,
      })
    }

    if (action === 'quickInsights') {
      routeLogger.info('Generating quick insights')
      const analyticsSnapshot = await AnalyticsService.getAnalyticsSnapshot()
      routeLogger.time('quickInsights')
      const quickInsights = await GeminiService.generateQuickInsights(analyticsSnapshot)
      const qiDuration = routeLogger.timeEnd('quickInsights')

      const duration = routeLogger.timeEnd('analyticsAction')
      routeLogger.success('Quick insights generated', {
        duration,
        quickInsightsDuration: qiDuration,
        insightCount: quickInsights.length
      })

      return NextResponse.json({
        success: true,
        insights: quickInsights,
      })
    }

    routeLogger.warn('Invalid action requested', { action })
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    routeLogger.error('Unexpected error in analytics action', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}