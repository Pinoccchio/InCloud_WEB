import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '@/lib/logger'

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
    const serviceLogger = logger.child({
      service: 'GeminiService',
      operation: 'generatePrescriptiveInsights'
    })
    serviceLogger.time('generatePrescriptiveInsights')

    serviceLogger.info('Starting AI insights generation')
    serviceLogger.debug('Analytics data received', {
      totalProducts: analyticsData.inventoryMetrics?.totalProducts,
      lowStock: analyticsData.inventoryMetrics?.lowStockItems,
      expiringSoon: analyticsData.expirationMetrics?.expiringSoon7Days,
    })

    try {
      serviceLogger.info('Initializing Gemini client')
      const genAI = this.getClient()
      serviceLogger.success('Client initialized successfully')

      serviceLogger.info('Using model: gemini-2.5-flash-lite')
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

      serviceLogger.info('Building analysis prompt')
      const prompt = this.buildAnalysisPrompt(analyticsData)
      serviceLogger.debug('Prompt built', { length: prompt.length })

      serviceLogger.info('Sending request to Gemini API')
      const apiTimer = serviceLogger.time('gemini-api-call')
      const result = await model.generateContent(prompt)
      const apiDuration = serviceLogger.timeEnd('gemini-api-call')

      const response = result.response
      const text = response.text()
      serviceLogger.debug('API response received', {
        apiDuration,
        responseLength: text.length,
        preview: text.substring(0, 200) + '...'
      })

      // Parse the AI response
      serviceLogger.info('Parsing AI response')
      const parsed = this.parseAIResponse(text)
      serviceLogger.success('Successfully parsed AI response', {
        insightCount: parsed.insights.length,
        recommendationCount: parsed.keyRecommendations.length,
        summaryLength: parsed.summary.length,
      })

      const totalDuration = serviceLogger.timeEnd('generatePrescriptiveInsights')
      serviceLogger.success('AI insights generation complete', {
        totalDuration,
        insights: parsed.insights.length
      })

      return parsed
    } catch (error) {
      serviceLogger.error('Error in AI insights generation', error as Error)
      serviceLogger.warn('Falling back to static insights')

      // Return fallback insights if AI fails
      const fallback = this.getFallbackInsights(analyticsData)
      serviceLogger.success('Fallback insights generated', {
        insightCount: fallback.insights.length
      })
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
      productTrafficMetrics,
    } = data

    // Separate low-traffic and high-traffic products
    const lowTrafficProducts = productTrafficMetrics?.filter((p: any) => p.isLowTraffic) || []
    const highTrafficProducts = productTrafficMetrics?.filter((p: any) => !p.isLowTraffic) || []

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

## ⚠️ CRITICAL EXPIRATION ALERTS (FROZEN FOOD - URGENT!)
- **EXPIRED**: ${expirationMetrics.expired} batches (PAST expiration - health hazard!)
- **URGENT (< 7 days)**: ${expirationMetrics.expiringSoon7Days} batches (Immediate action required)
- **WARNING (7-14 days)**: ${expirationMetrics.expiringSoon14Days} batches (Plan discount/promotion)
- **WATCH (14-30 days)**: ${expirationMetrics.expiringSoon30Days} batches (Monitor closely)
- **Total Active Batches**: ${expirationMetrics.totalBatches} batches tracked

${expirationMetrics.criticalBatches.length > 0 ? `
### Top Critical Batches Requiring IMMEDIATE Action:
${expirationMetrics.criticalBatches.slice(0, 5).map((b: any) =>
  `- **${b.productName}** (Batch: ${b.batchNumber}): ${b.quantity} units, expires in ${b.daysUntilExpiry} days (${new Date(b.expirationDate).toLocaleDateString()})`
).join('\n')}

**EXPIRATION STRATEGY REQUIRED:**
- Batches expiring < 3 days: Emergency discount (40-50% off) or donate
- Batches expiring 3-7 days: Promotional pricing (25-35% off)
- Batches expiring 7-14 days: Feature in marketing, bundle deals
- Batches expiring 14-30 days: Normal operations, monitor daily
` : '- No critical batches at this time'}

## PRODUCT TRAFFIC ANALYSIS (Last 30 Days)
**Low-Traffic Products** (< 10 orders): ${lowTrafficProducts.length} products
${lowTrafficProducts.length > 0 ? lowTrafficProducts.slice(0, 5).map((p: any) =>
  `- ${p.productName}: ${p.orderCount} orders, ${p.totalQuantity} units sold`
).join('\n') : '- None'}

**High-Traffic Products** (≥ 10 orders): ${highTrafficProducts.length} products
${highTrafficProducts.length > 0 ? highTrafficProducts.slice(0, 5).map((p: any) =>
  `- ${p.productName}: ${p.orderCount} orders, ${p.totalQuantity} units sold`
).join('\n') : '- None'}

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

## CRITICAL RESTRICTIONS & RULES:

**PRICING OPTIMIZATION RULES:**
1. ❌ DO NOT recommend price changes for LOW-TRAFFIC products (< 10 orders in 30 days)
2. ✅ ONLY recommend pricing adjustments for HIGH-TRAFFIC products (≥ 10 orders)
3. For low-traffic items, recommend: inventory reduction, product discontinuation, or marketing campaigns
4. Focus pricing optimization on products with proven customer demand

**PRIORITY RANKING (MUST FOLLOW):**
1. **CRITICAL** - Expired batches, products expiring < 7 days, zero stock on high-demand items
2. **HIGH** - Products expiring 7-14 days, low stock (< threshold), negative profit margins
3. **MEDIUM** - Products expiring 14-30 days, pricing optimization (high-traffic only), operational improvements
4. **LOW** - General operational suggestions, long-term strategic planning

**FOCUS AREAS (In Order of Importance):**
1. **Expiration Risk Mitigation (TOP PRIORITY)** - Frozen food safety is critical
   - Address ALL expired batches immediately (health hazard)
   - Urgent action on batches expiring < 7 days (promotional pricing)
   - Plan ahead for batches expiring 7-30 days

2. **Critical Stock Management** - Prevent lost sales
   - Restock out-of-stock items immediately (especially high-traffic)
   - Address low stock before reaching zero

3. **Traffic-Based Inventory Optimization** - Data-driven decisions
   - Reduce/discontinue low-traffic products to free up capital
   - Increase stock for high-traffic products

4. **Pricing Optimization (High-Traffic Products Only)** - Maximize margins
   - Adjust prices on products with ≥10 orders/month
   - Test price increases on popular items
   - Bundle slow-moving items with best-sellers

5. **Sales Growth Strategies** - Increase revenue
   - Marketing campaigns for specific categories
   - Cross-selling and upselling opportunities

Provide 5-8 specific, actionable insights. Be concrete with numbers, specific products, and deadlines. Consider Philippine business context and frozen food industry best practices (FIFO, cold chain, health regulations).`
  }

  /**
   * Parse AI response into structured format
   */
  private static parseAIResponse(text: string): AIAnalysisResponse {
    const serviceLogger = logger.child({
      service: 'GeminiService',
      operation: 'parseAIResponse'
    })

    serviceLogger.debug('Starting to parse AI response')
    try {
      // Remove markdown code blocks if present
      serviceLogger.debug('Cleaning markdown formatting')
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      serviceLogger.debug('Text cleaned', { length: cleanText.length })

      serviceLogger.debug('Attempting JSON parse')
      const parsed = JSON.parse(cleanText)
      serviceLogger.debug('JSON parsed successfully', {
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

      serviceLogger.success('Response formatted successfully')
      return result
    } catch (error) {
      serviceLogger.error('Failed to parse AI response', error as Error, {
        preview: text.substring(0, 500)
      })
      throw new Error('Invalid AI response format')
    }
  }

  /**
   * Generate fallback insights if AI fails
   */
  private static getFallbackInsights(data: any): AIAnalysisResponse {
    const insights: PrescriptiveInsight[] = []
    const { inventoryMetrics, expirationMetrics, productStockStatus, productTrafficMetrics } = data

    // Separate low-traffic and high-traffic products
    const lowTrafficProducts = productTrafficMetrics?.filter((p: any) => p.isLowTraffic) || []
    const highTrafficProducts = productTrafficMetrics?.filter((p: any) => !p.isLowTraffic) || []

    // CRITICAL: Expired batches (highest priority)
    if (expirationMetrics.expired > 0) {
      insights.push({
        priority: 'critical',
        category: 'Expiration',
        title: 'Expired Batches Detected - Health Hazard',
        description: `${expirationMetrics.expired} batches have ALREADY EXPIRED. These products pose a health and safety risk and must be removed from inventory immediately.`,
        action: 'Remove all expired batches from inventory TODAY. Dispose properly and update inventory records. Review expiration monitoring procedures.',
        expectedImpact: 'Eliminate health risks, comply with food safety regulations, avoid potential legal issues',
        timeframe: 'immediate',
      })
    }

    // CRITICAL: Products expiring within 7 days
    if (expirationMetrics.expiringSoon7Days > 0) {
      insights.push({
        priority: 'critical',
        category: 'Expiration',
        title: 'Urgent: Products Expiring Within 7 Days',
        description: `${expirationMetrics.expiringSoon7Days} batches are expiring within the next 7 days. Without immediate action, these will become waste.`,
        action: 'Apply 25-35% promotional discount on expiring items. Feature these products prominently. Prioritize FIFO in all order fulfillment.',
        expectedImpact: 'Recover costs through sales, reduce waste, maintain cash flow',
        timeframe: 'immediate',
      })
    }

    // HIGH: Products expiring 7-14 days
    if (expirationMetrics.expiringSoon14Days > 0) {
      insights.push({
        priority: 'high',
        category: 'Expiration',
        title: 'Products Expiring in 7-14 Days',
        description: `${expirationMetrics.expiringSoon14Days} batches will expire in 1-2 weeks. Plan promotional campaigns to move this inventory.`,
        action: 'Create bundle deals with expiring products. Feature in weekly promotions. Monitor daily and adjust pricing as needed.',
        expectedImpact: 'Prevent future waste, maintain healthy inventory turnover',
        timeframe: 'this week',
      })
    }

    // Critical stock items
    if (inventoryMetrics.outOfStockItems > 0) {
      insights.push({
        priority: 'critical',
        category: 'Inventory',
        title: 'Out of Stock Items - Lost Sales',
        description: `${inventoryMetrics.outOfStockItems} products are completely out of stock. This results in lost sales and may drive customers to competitors.`,
        action: 'Immediately review out-of-stock items. Prioritize restocking high-traffic products (≥10 orders/month). Place emergency supplier orders.',
        expectedImpact: 'Recover lost revenue, maintain customer satisfaction and loyalty',
        timeframe: 'immediate',
      })
    }

    // Low stock warning
    if (inventoryMetrics.lowStockItems > 0) {
      insights.push({
        priority: 'high',
        category: 'Inventory',
        title: 'Low Stock Alert - Reorder Needed',
        description: `${inventoryMetrics.lowStockItems} products are running low. Stock-outs are imminent without reordering.`,
        action: 'Create purchase orders for low stock items. Focus on high-traffic products first. Implement reorder point alerts for automation.',
        expectedImpact: 'Maintain adequate inventory levels, avoid emergency rush orders',
        timeframe: 'this week',
      })
    }

    // Low-traffic product optimization (only if we have traffic data)
    if (lowTrafficProducts.length > 0) {
      insights.push({
        priority: 'medium',
        category: 'Operations',
        title: 'Low-Traffic Product Optimization',
        description: `${lowTrafficProducts.length} products have less than 10 orders in the past 30 days. These tie up capital and storage space.`,
        action: 'Review low-traffic products for discontinuation or reduction. Consider marketing campaigns to boost sales. Avoid price changes on these items without demand validation.',
        expectedImpact: 'Free up working capital, optimize storage space, focus on profitable products',
        timeframe: 'this month',
      })
    }

    // High-traffic pricing optimization (only if we have high-traffic products)
    if (highTrafficProducts.length > 0) {
      insights.push({
        priority: 'medium',
        category: 'Pricing',
        title: 'Pricing Optimization for Popular Products',
        description: `${highTrafficProducts.length} products have strong demand (≥10 orders in 30 days). These are candidates for margin improvement.`,
        action: 'Test small price increases (5-10%) on high-demand products. Monitor sales velocity. Bundle popular items with slower-moving stock.',
        expectedImpact: 'Increase profit margins while maintaining sales volume',
        timeframe: 'this month',
      })
    }

    // Summary based on most critical issues
    let summary = `Your inventory has ${inventoryMetrics.totalProducts} active products. `
    if (expirationMetrics.expired > 0 || expirationMetrics.expiringSoon7Days > 0) {
      summary += `URGENT: ${expirationMetrics.expired + expirationMetrics.expiringSoon7Days} batches require immediate attention for expiration. `
    }
    if (inventoryMetrics.outOfStockItems + inventoryMetrics.lowStockItems > 0) {
      summary += `${inventoryMetrics.outOfStockItems + inventoryMetrics.lowStockItems} products need restocking. `
    }
    summary += 'Focus on expiration management and critical stock replenishment.'

    // Key recommendations prioritizing expiration and stock issues
    const recommendations: string[] = []

    if (expirationMetrics.expired > 0) {
      recommendations.push(`URGENT: Remove ${expirationMetrics.expired} expired batches immediately (health hazard)`)
    }
    if (expirationMetrics.expiringSoon7Days > 0) {
      recommendations.push(`Apply discounts to ${expirationMetrics.expiringSoon7Days} batches expiring within 7 days`)
    }
    if (inventoryMetrics.outOfStockItems > 0) {
      recommendations.push(`Restock ${inventoryMetrics.outOfStockItems} out-of-stock items (prioritize high-traffic products)`)
    }
    if (inventoryMetrics.lowStockItems > 0) {
      recommendations.push(`Place orders for ${inventoryMetrics.lowStockItems} low-stock products before stock-out`)
    }
    if (lowTrafficProducts.length > 0) {
      recommendations.push(`Review ${lowTrafficProducts.length} low-traffic products for reduction/discontinuation`)
    }

    // Ensure we have at least 3 recommendations
    if (recommendations.length < 3) {
      recommendations.push('Implement automated reorder point system for critical products')
      recommendations.push('Conduct weekly inventory reviews to prevent future issues')
    }

    return {
      insights,
      summary,
      keyRecommendations: recommendations.slice(0, 5), // Top 5
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