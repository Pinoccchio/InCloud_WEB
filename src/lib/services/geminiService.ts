import { GoogleGenerativeAI } from '@google/generative-ai'

export interface PrescriptiveInsight {
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  action: string
  expectedImpact: string
  timeframe: string
}

export interface AIAnalysisResponse {
  insights: PrescriptiveInsight[]
  summary: string
  keyRecommendations: string[]
  generatedAt: string
}

export class GeminiService {
  private static genAI: GoogleGenerativeAI | null = null

  /**
   * Initialize the Gemini AI client
   */
  private static getClient(): GoogleGenerativeAI {
    if (!this.genAI) {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
      if (!apiKey) {
        throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not configured')
      }
      this.genAI = new GoogleGenerativeAI(apiKey)
    }
    return this.genAI
  }

  /**
   * Generate prescriptive analytics insights using Gemini AI
   */
  static async generatePrescriptiveInsights(
    analyticsData: any
  ): Promise<AIAnalysisResponse> {
    console.log('🤖 [Gemini Service] Starting AI insights generation...')
    console.log('📊 [Gemini Service] Analytics data received:', {
      totalProducts: analyticsData.inventoryMetrics?.totalProducts,
      lowStock: analyticsData.inventoryMetrics?.lowStockItems,
      expiringSoon: analyticsData.expirationMetrics?.expiringSoon7Days,
    })

    try {
      console.log('🔑 [Gemini Service] Initializing Gemini client...')
      const genAI = this.getClient()
      console.log('✅ [Gemini Service] Client initialized successfully')

      console.log('🎯 [Gemini Service] Using model: gemini-2.0-flash-lite')
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

      console.log('📝 [Gemini Service] Building analysis prompt...')
      const prompt = this.buildAnalysisPrompt(analyticsData)
      console.log('📏 [Gemini Service] Prompt length:', prompt.length, 'characters')

      console.log('🚀 [Gemini Service] Sending request to Gemini API...')
      const startTime = Date.now()
      const result = await model.generateContent(prompt)
      const duration = Date.now() - startTime
      console.log(`⏱️ [Gemini Service] API response received in ${duration}ms`)

      const response = result.response
      const text = response.text()
      console.log('📤 [Gemini Service] Response text length:', text.length, 'characters')
      console.log('📄 [Gemini Service] Raw response preview:', text.substring(0, 200) + '...')

      // Parse the AI response
      console.log('🔍 [Gemini Service] Parsing AI response...')
      const parsed = this.parseAIResponse(text)
      console.log('✅ [Gemini Service] Successfully parsed AI response')
      console.log('📊 [Gemini Service] Generated insights:', {
        insightCount: parsed.insights.length,
        recommendationCount: parsed.keyRecommendations.length,
        summaryLength: parsed.summary.length,
      })

      return parsed
    } catch (error) {
      console.error('❌ [Gemini Service] Error occurred:', error)
      console.error('📋 [Gemini Service] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
      console.log('🔄 [Gemini Service] Falling back to static insights...')

      // Return fallback insights if AI fails
      const fallback = this.getFallbackInsights(analyticsData)
      console.log('✅ [Gemini Service] Fallback insights generated')
      return fallback
    }
  }

  /**
   * Build comprehensive prompt for Gemini AI
   */
  private static buildAnalysisPrompt(data: any): string {
    const {
      inventoryMetrics,
      categoryPerformance,
      expirationMetrics,
      salesMetrics,
      pricingTierAnalysis,
      productStockStatus,
    } = data

    return `You are an expert inventory management consultant for J.A's Food Trading, a frozen food distribution business with 3 branches in Sampaloc, Manila, Philippines.

Analyze the following business data and provide specific, actionable recommendations:

## INVENTORY METRICS
- Total Products: ${inventoryMetrics.totalProducts}
- Total Inventory Value: ₱${inventoryMetrics.totalInventoryValue.toFixed(2)} (cost)
- Total Inventory Value: ₱${inventoryMetrics.totalInventoryValueRetail.toFixed(2)} (retail)
- Low Stock Items: ${inventoryMetrics.lowStockItems}
- Out of Stock Items: ${inventoryMetrics.outOfStockItems}
- Adequate Stock Items: ${inventoryMetrics.adequateStockItems}
- Average Stock Level: ${inventoryMetrics.averageStockLevel.toFixed(1)} units

## CATEGORY PERFORMANCE
${categoryPerformance.map((cat: any) => `- ${cat.categoryName}: ${cat.productCount} products, ${cat.totalInventory} units (${cat.percentageOfTotal.toFixed(1)}% of total)`).join('\n')}

## EXPIRATION METRICS
- Expiring in 7 days: ${expirationMetrics.expiringSoon7Days} batches
- Expiring in 14 days: ${expirationMetrics.expiringSoon14Days} batches
- Expiring in 30 days: ${expirationMetrics.expiringSoon30Days} batches
- Already expired: ${expirationMetrics.expired} batches
- Critical batches: ${expirationMetrics.criticalBatches.length} items requiring immediate attention

## SALES METRICS
- Total Orders: ${salesMetrics.totalOrders}
- Total Revenue: ₱${salesMetrics.totalRevenue.toFixed(2)}
- Average Order Value: ₱${salesMetrics.averageOrderValue.toFixed(2)}
- Orders by Status: ${salesMetrics.ordersByStatus.map((s: any) => `${s.status} (${s.count})`).join(', ')}

## PRICING TIER ANALYSIS
${pricingTierAnalysis.map((tier: any) => `- ${tier.tierType}: ${tier.productsCount} products, Avg ₱${tier.avgPrice.toFixed(2)}`).join('\n')}

## CRITICAL STOCK STATUS
${productStockStatus.filter((p: any) => p.status === 'critical' || p.status === 'low').slice(0, 10).map((p: any) => `- ${p.productName} (${p.categoryName}): ${p.currentQuantity} units, Threshold: ${p.lowStockThreshold}, Status: ${p.status}`).join('\n')}

## INSTRUCTIONS
Provide your analysis in the following JSON format ONLY (no additional text):

{
  "summary": "A concise 2-3 sentence executive summary of the current business situation",
  "keyRecommendations": [
    "Top 5 most important actions to take immediately (as bullet points)"
  ],
  "insights": [
    {
      "priority": "critical|high|medium|low",
      "category": "Inventory|Sales|Expiration|Pricing|Operations",
      "title": "Short descriptive title",
      "description": "Detailed explanation of the issue or opportunity",
      "action": "Specific action to take",
      "expectedImpact": "Expected business outcome",
      "timeframe": "When to implement (immediate/this week/this month)"
    }
  ]
}

Focus on:
1. **Immediate restocking priorities** - Which products need urgent reordering
2. **Expiration risk mitigation** - Strategies to minimize waste from expiring products
3. **Pricing optimization** - Opportunities to improve margins or move slow inventory
4. **Category-specific strategies** - Tailored recommendations per product category
5. **Sales improvement** - Ways to increase order volume and average order value

Provide 5-8 specific, actionable insights. Be concrete with numbers and deadlines. Consider Philippine business context and frozen food industry best practices.`
  }

  /**
   * Parse AI response into structured format
   */
  private static parseAIResponse(text: string): AIAnalysisResponse {
    console.log('🔧 [Parser] Starting to parse AI response...')
    try {
      // Remove markdown code blocks if present
      console.log('🧹 [Parser] Cleaning markdown formatting...')
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      console.log('📏 [Parser] Clean text length:', cleanText.length)

      console.log('🔍 [Parser] Attempting JSON parse...')
      const parsed = JSON.parse(cleanText)
      console.log('✅ [Parser] JSON parsed successfully')
      console.log('📊 [Parser] Parsed structure:', {
        hasInsights: !!parsed.insights,
        hasSummary: !!parsed.summary,
        hasRecommendations: !!parsed.keyRecommendations,
        insightsCount: parsed.insights?.length || 0,
      })

      const result = {
        insights: parsed.insights || [],
        summary: parsed.summary || 'Analysis completed successfully.',
        keyRecommendations: parsed.keyRecommendations || [],
        generatedAt: new Date().toISOString(),
      }

      console.log('✅ [Parser] Response formatted successfully')
      return result
    } catch (error) {
      console.error('❌ [Parser] Failed to parse AI response:', error)
      console.error('📄 [Parser] Raw text that failed:', text.substring(0, 500))
      throw new Error('Invalid AI response format')
    }
  }

  /**
   * Generate fallback insights if AI fails
   */
  private static getFallbackInsights(data: any): AIAnalysisResponse {
    const insights: PrescriptiveInsight[] = []
    const { inventoryMetrics, expirationMetrics, productStockStatus } = data

    // Critical stock items
    if (inventoryMetrics.outOfStockItems > 0) {
      insights.push({
        priority: 'critical',
        category: 'Inventory',
        title: 'Out of Stock Items Detected',
        description: `You have ${inventoryMetrics.outOfStockItems} products that are completely out of stock. This may result in lost sales and disappointed customers.`,
        action: 'Immediately review and reorder out-of-stock items from suppliers.',
        expectedImpact: 'Prevent lost sales and maintain customer satisfaction',
        timeframe: 'immediate',
      })
    }

    // Low stock warning
    if (inventoryMetrics.lowStockItems > 0) {
      insights.push({
        priority: 'high',
        category: 'Inventory',
        title: 'Low Stock Alert',
        description: `${inventoryMetrics.lowStockItems} products are running low and need restocking soon to avoid stock-outs.`,
        action: 'Create purchase orders for low stock items based on sales velocity.',
        expectedImpact: 'Maintain adequate inventory levels and avoid emergency orders',
        timeframe: 'this week',
      })
    }

    // Expiration warnings
    if (expirationMetrics.expiringSoon7Days > 0) {
      insights.push({
        priority: 'critical',
        category: 'Expiration',
        title: 'Products Expiring Within 7 Days',
        description: `${expirationMetrics.expiringSoon7Days} batches are expiring within the next 7 days. Immediate action required to minimize waste.`,
        action: 'Implement promotional pricing or prioritize these items in sales orders. Consider FIFO enforcement.',
        expectedImpact: 'Reduce inventory waste and recover costs through sales',
        timeframe: 'immediate',
      })
    }

    // Inventory value insight
    insights.push({
      priority: 'medium',
      category: 'Operations',
      title: 'Inventory Value Analysis',
      description: `Total inventory value is ₱${inventoryMetrics.totalInventoryValueRetail.toFixed(2)} at retail pricing with potential profit of ₱${(inventoryMetrics.totalInventoryValueRetail - inventoryMetrics.totalInventoryValue).toFixed(2)}.`,
      action: 'Review pricing strategy and ensure optimal markup across all tiers.',
      expectedImpact: 'Maximize profitability while remaining competitive',
      timeframe: 'this month',
    })

    return {
      insights,
      summary: `Your inventory currently has ${inventoryMetrics.totalProducts} active products with ${inventoryMetrics.lowStockItems + inventoryMetrics.outOfStockItems} items requiring attention. Focus on restocking and managing ${expirationMetrics.expiringSoon7Days} products expiring soon.`,
      keyRecommendations: [
        `Reorder ${inventoryMetrics.outOfStockItems + inventoryMetrics.lowStockItems} low/out-of-stock products immediately`,
        `Address ${expirationMetrics.expiringSoon7Days} batches expiring within 7 days`,
        'Review and optimize pricing tiers for better profit margins',
        'Implement automated reorder points to prevent future stock-outs',
        'Conduct weekly inventory reviews to maintain optimal stock levels',
      ],
      generatedAt: new Date().toISOString(),
    }
  }

  /**
   * Generate quick insights for dashboard
   */
  static async generateQuickInsights(data: any): Promise<string[]> {
    const insights: string[] = []
    const { inventoryMetrics, expirationMetrics, salesMetrics } = data

    if (inventoryMetrics.outOfStockItems > 0) {
      insights.push(`⚠️ ${inventoryMetrics.outOfStockItems} products are out of stock`)
    }

    if (inventoryMetrics.lowStockItems > 5) {
      insights.push(`📦 ${inventoryMetrics.lowStockItems} products need restocking`)
    }

    if (expirationMetrics.expiringSoon7Days > 0) {
      insights.push(`⏰ ${expirationMetrics.expiringSoon7Days} batches expiring within 7 days`)
    }

    if (salesMetrics.totalOrders > 0) {
      insights.push(`💰 Average order value: ₱${salesMetrics.averageOrderValue.toFixed(2)}`)
    }

    if (insights.length === 0) {
      insights.push('✅ All systems operating normally')
    }

    return insights
  }
}