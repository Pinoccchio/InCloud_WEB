import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsService } from '@/lib/services/analyticsService'
import { GeminiService } from '@/lib/services/geminiService'

// Cache for analytics data (1 hour)
let cachedAnalytics: any = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

// Cache for AI insights (1 hour)
let cachedAIInsights: any = null
let aiCacheTimestamp: number = 0

export async function GET(request: NextRequest) {
  console.log('\n🔵 [Analytics API] GET request received')
  try {
    const searchParams = request.nextUrl.searchParams
    const forceRefresh = searchParams.get('refresh') === 'true'
    const includeAI = searchParams.get('includeAI') !== 'false' // Default true

    console.log('⚙️ [Analytics API] Request params:', { forceRefresh, includeAI })

    const now = Date.now()

    // Check cache
    if (!forceRefresh && cachedAnalytics && now - cacheTimestamp < CACHE_DURATION) {
      const cacheAge = Math.floor((now - cacheTimestamp) / 1000)
      console.log(`💾 [Analytics API] Returning cached data (${cacheAge}s old)`)
      return NextResponse.json({
        ...cachedAnalytics,
        cached: true,
        cacheAge,
      })
    }

    console.log('🔄 [Analytics API] Fetching fresh analytics data...')
    // Fetch fresh analytics data
    const analyticsSnapshot = await AnalyticsService.getAnalyticsSnapshot()
    console.log('✅ [Analytics API] Analytics snapshot retrieved')

    // Get AI insights if requested
    let aiInsights = null
    if (includeAI) {
      console.log('🤖 [Analytics API] AI insights requested')
      // Check AI cache
      if (!forceRefresh && cachedAIInsights && now - aiCacheTimestamp < CACHE_DURATION) {
        const aiCacheAge = Math.floor((now - aiCacheTimestamp) / 1000)
        console.log(`💾 [Analytics API] Using cached AI insights (${aiCacheAge}s old)`)
        aiInsights = cachedAIInsights
      } else {
        try {
          console.log('🚀 [Analytics API] Generating new AI insights...')
          const startTime = Date.now()
          aiInsights = await GeminiService.generatePrescriptiveInsights(analyticsSnapshot)
          const duration = Date.now() - startTime
          console.log(`✅ [Analytics API] AI insights generated in ${duration}ms`)
          cachedAIInsights = aiInsights
          aiCacheTimestamp = now
        } catch (error) {
          console.error('❌ [Analytics API] AI insights generation failed:', error)
          console.error('📋 [Analytics API] Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            type: error instanceof Error ? error.constructor.name : typeof error,
          })
          // Continue without AI insights
        }
      }
    } else {
      console.log('⏭️ [Analytics API] AI insights not requested')
    }

    const response = {
      ...analyticsSnapshot,
      aiInsights,
      cached: false,
    }

    // Update cache
    cachedAnalytics = response
    cacheTimestamp = now

    console.log('📤 [Analytics API] Sending response with:', {
      hasAI: !!aiInsights,
      inventoryProducts: analyticsSnapshot.inventoryMetrics.totalProducts,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ [Analytics API] Fatal error:', error)
    console.error('📋 [Analytics API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
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
  console.log('\n🟢 [Analytics API] POST request received')
  try {
    const body = await request.json()
    const { action } = body
    console.log('⚙️ [Analytics API] Action requested:', action)

    if (action === 'regenerateAI') {
      console.log('🔄 [Analytics API] Force regenerating AI insights...')
      // Force regenerate AI insights
      const analyticsSnapshot = await AnalyticsService.getAnalyticsSnapshot()
      console.log('✅ [Analytics API] Analytics snapshot retrieved')

      console.log('🚀 [Analytics API] Calling Gemini service...')
      const startTime = Date.now()
      const aiInsights = await GeminiService.generatePrescriptiveInsights(analyticsSnapshot)
      const duration = Date.now() - startTime
      console.log(`✅ [Analytics API] AI insights regenerated in ${duration}ms`)

      // Update cache
      cachedAIInsights = aiInsights
      aiCacheTimestamp = Date.now()
      console.log('💾 [Analytics API] AI cache updated')

      return NextResponse.json({
        success: true,
        aiInsights,
      })
    }

    if (action === 'quickInsights') {
      console.log('⚡ [Analytics API] Generating quick insights...')
      const analyticsSnapshot = await AnalyticsService.getAnalyticsSnapshot()
      const quickInsights = await GeminiService.generateQuickInsights(analyticsSnapshot)
      console.log('✅ [Analytics API] Quick insights generated:', quickInsights.length)

      return NextResponse.json({
        success: true,
        insights: quickInsights,
      })
    }

    console.log('⚠️ [Analytics API] Invalid action requested:', action)
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('❌ [Analytics API] POST Error:', error)
    console.error('📋 [Analytics API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
    })
    return NextResponse.json(
      {
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}