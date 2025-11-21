import React from 'react'
import { Document } from '@react-pdf/renderer'
import { CoverPage } from '@/components/analytics/pdf/CoverPage'
import { MetricsSection } from '@/components/analytics/pdf/MetricsSection'
import { ChartsSection } from '@/components/analytics/pdf/ChartsSection'
import { TablesSection } from '@/components/analytics/pdf/TablesSection'
import { AIInsightsSection } from '@/components/analytics/pdf/AIInsightsSection'

interface ReportData {
  inventoryMetrics: {
    totalProducts: number
    totalInventoryValue: number
    totalInventoryValueRetail: number
    lowStockItems: number
    outOfStockItems: number
    adequateStockItems: number
    averageStockLevel: number
    totalAvailableQuantity: number
    totalReservedQuantity: number
  }
  salesMetrics: {
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
    ordersByStatus: Array<{
      status: string
      count: number
      percentage: number
    }>
    monthlySales: Array<{
      month: string
      year: number
      totalOrders: number
      totalRevenue: number
      averageOrderValue: number
    }>
  }
  brandPerformance: Array<{
    brandName: string
    productCount: number
    totalInventory: number
    availableInventory: number
    percentageOfTotal: number
  }>
  expirationMetrics: {
    expiringSoon7Days: number
    expiringSoon14Days: number
    expiringSoon30Days: number
    expired: number
    criticalBatches: Array<{
      productName: string
      batchNumber: string
      expirationDate: string
      quantity: number
      daysUntilExpiry: number
    }>
  }
  pricingTierAnalysis: Array<{
    tierType: string
    productsCount: number
    avgPrice: number
    minPrice: number
    maxPrice: number
  }>
  productStockStatus: Array<{
    productName: string
    categoryName: string
    brandName: string
    currentQuantity: number
    availableQuantity: number
    lowStockThreshold: number
    status: 'critical' | 'low' | 'adequate' | 'overstocked'
    daysOfStock: number
  }>
  timestamp: string
}

interface ReportOptions {
  dateRange?: {
    startDate?: string
    endDate?: string
  }
  includeAI?: boolean
  aiInsights?: any
  generatedBy?: string
}

// Export the service
export const PDFReportService = {
  generateDocument: (data: ReportData, options: ReportOptions = {}) => {
    let currentPage = 1

    return (
      <Document>
        {/* Cover Page */}
        <CoverPage options={options} timestamp={data.timestamp} />

        {/* Metrics Section - Page 1 */}
        <MetricsSection data={data} pageNumber={currentPage++} />

        {/* Charts Section - Pages 2-3 */}
        <ChartsSection data={data} pageNumber={currentPage} />
        {/* Charts section renders 2 pages */}
        {(currentPage += 2)}

        {/* Tables Section - Pages 4-6 */}
        <TablesSection data={data} pageNumber={currentPage} />
        {/* Tables section renders 3 pages */}
        {(currentPage += 3)}

        {/* AI Insights Section (Optional) */}
        {options.includeAI && options.aiInsights && (
          <AIInsightsSection aiInsights={options.aiInsights} pageNumber={currentPage} />
        )}
      </Document>
    )
  },
}

export type { ReportData, ReportOptions }
