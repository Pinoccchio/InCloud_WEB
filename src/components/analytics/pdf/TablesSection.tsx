import React from 'react'
import { Page, Text, View } from '@react-pdf/renderer'
import { ReportData } from '@/lib/services/pdfReportService'
import { styles, COLORS, formatCurrency, formatDate } from '@/lib/services/pdfStyles'

interface TablesSectionProps {
  data: ReportData
  pageNumber: number
}

export const TablesSection: React.FC<TablesSectionProps> = ({ data, pageNumber }) => {
  const { expirationMetrics, productStockStatus, pricingTierAnalysis, salesMetrics } = data

  // Get urgency color for expiration
  const getExpirationColor = (days: number): string => {
    if (days < 0) return COLORS.danger // Expired
    if (days <= 7) return COLORS.danger // Critical
    if (days <= 14) return COLORS.warning // Warning
    return COLORS.gray[600] // Watch
  }

  // Get status color
  const getStockStatusColor = (status: string): string => {
    if (status === 'critical') return COLORS.danger
    if (status === 'low') return COLORS.warning
    if (status === 'adequate') return COLORS.success
    return COLORS.gray[600]
  }

  return (
    <>
      {/* Expiration Alerts Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Expiration Alerts</Text>

        {/* Summary Cards */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <View style={[styles.metricCard, { flex: 1, borderLeftWidth: 3, borderLeftColor: COLORS.danger }]}>
            <Text style={styles.metricLabel}>Expired</Text>
            <Text style={[styles.metricValue, { fontSize: 18, color: COLORS.danger }]}>
              {expirationMetrics.expired}
            </Text>
          </View>
          <View style={[styles.metricCard, { flex: 1, borderLeftWidth: 3, borderLeftColor: COLORS.danger }]}>
            <Text style={styles.metricLabel}>Expiring in 7 days</Text>
            <Text style={[styles.metricValue, { fontSize: 18, color: COLORS.danger }]}>
              {expirationMetrics.expiringSoon7Days}
            </Text>
          </View>
          <View style={[styles.metricCard, { flex: 1, borderLeftWidth: 3, borderLeftColor: COLORS.warning }]}>
            <Text style={styles.metricLabel}>Expiring in 14 days</Text>
            <Text style={[styles.metricValue, { fontSize: 18, color: COLORS.warning }]}>
              {expirationMetrics.expiringSoon14Days}
            </Text>
          </View>
        </View>

        <Text style={styles.subheader}>Critical Batches (Top 10)</Text>

        {expirationMetrics.criticalBatches.length > 0 ? (
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, { flex: 2 }]}>Product Name</Text>
              <Text style={[styles.tableCellHeader, { flex: 1 }]}>Batch #</Text>
              <Text style={[styles.tableCellHeader, { flex: 1 }]}>Quantity</Text>
              <Text style={[styles.tableCellHeader, { flex: 1.5 }]}>Expiration Date</Text>
              <Text style={[styles.tableCellHeader, { flex: 0.8 }]}>Days</Text>
            </View>

            {/* Table Rows */}
            {expirationMetrics.criticalBatches.slice(0, 10).map((batch, index) => (
              <View
                key={`${batch.batchNumber}-${index}`}
                style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={[styles.tableCell, { flex: 2 }]}>{batch.productName}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{batch.batchNumber}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{batch.quantity}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>
                  {formatDate(batch.expirationDate)}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    { flex: 0.8, fontWeight: 'bold', color: getExpirationColor(batch.daysUntilExpiry) },
                  ]}
                >
                  {batch.daysUntilExpiry < 0 ? 'EXPIRED' : batch.daysUntilExpiry}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ padding: 20, backgroundColor: COLORS.gray[50], textAlign: 'center' }}>
            <Text style={styles.text}>No critical batches at this time</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>InCloud Analytics Report - Expiration Alerts</Text>
          <Text>Page {pageNumber}</Text>
        </View>
      </Page>

      {/* Low Stock Products Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Low Stock Products</Text>

        <Text style={styles.subheader}>Products Requiring Attention (Top 20)</Text>

        {productStockStatus.length > 0 ? (
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, { flex: 2 }]}>Product Name</Text>
              <Text style={[styles.tableCellHeader, { flex: 1.2 }]}>Brand</Text>
              <Text style={[styles.tableCellHeader, { flex: 0.8 }]}>Stock</Text>
              <Text style={[styles.tableCellHeader, { flex: 0.8 }]}>Available</Text>
              <Text style={[styles.tableCellHeader, { flex: 0.8 }]}>Status</Text>
            </View>

            {/* Table Rows */}
            {productStockStatus.slice(0, 20).map((product, index) => (
              <View
                key={`${product.productName}-${index}`}
                style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={[styles.tableCell, { flex: 2 }]}>{product.productName}</Text>
                <Text style={[styles.tableCell, { flex: 1.2 }]}>{product.brandName}</Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>{product.currentQuantity}</Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>{product.availableQuantity}</Text>
                <Text
                  style={[
                    styles.tableCell,
                    { flex: 0.8, fontWeight: 'bold', color: getStockStatusColor(product.status) },
                  ]}
                >
                  {product.status.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ padding: 20, backgroundColor: COLORS.gray[50], textAlign: 'center' }}>
            <Text style={styles.text}>All products have adequate stock levels</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>InCloud Analytics Report - Low Stock Products</Text>
          <Text>Page {pageNumber + 1}</Text>
        </View>
      </Page>

      {/* Pricing Analysis Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Pricing Analysis</Text>

        <Text style={styles.subheader}>Pricing Tier Breakdown</Text>

        {pricingTierAnalysis.length > 0 ? (
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, { flex: 1.5 }]}>Tier Type</Text>
              <Text style={[styles.tableCellHeader, { flex: 1 }]}>Products</Text>
              <Text style={[styles.tableCellHeader, { flex: 1.2 }]}>Avg Price</Text>
              <Text style={[styles.tableCellHeader, { flex: 1.2 }]}>Min Price</Text>
              <Text style={[styles.tableCellHeader, { flex: 1.2 }]}>Max Price</Text>
            </View>

            {/* Table Rows */}
            {pricingTierAnalysis.map((tier, index) => (
              <View
                key={tier.tierType}
                style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={[styles.tableCell, { flex: 1.5, fontWeight: 'bold', textTransform: 'capitalize' }]}>
                  {tier.tierType}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{tier.productsCount}</Text>
                <Text style={[styles.tableCell, { flex: 1.2 }]}>{formatCurrency(tier.avgPrice)}</Text>
                <Text style={[styles.tableCell, { flex: 1.2 }]}>{formatCurrency(tier.minPrice)}</Text>
                <Text style={[styles.tableCell, { flex: 1.2 }]}>{formatCurrency(tier.maxPrice)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ padding: 20, backgroundColor: COLORS.gray[50], textAlign: 'center' }}>
            <Text style={styles.text}>No pricing tier data available</Text>
          </View>
        )}

        {/* Orders by Status */}
        <Text style={[styles.subheader, { marginTop: 30 }]}>Orders by Status</Text>

        {salesMetrics.ordersByStatus.length > 0 ? (
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, { flex: 2 }]}>Status</Text>
              <Text style={[styles.tableCellHeader, { flex: 1 }]}>Count</Text>
              <Text style={[styles.tableCellHeader, { flex: 1 }]}>Percentage</Text>
            </View>

            {/* Table Rows */}
            {salesMetrics.ordersByStatus.map((status, index) => (
              <View
                key={status.status}
                style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={[styles.tableCell, { flex: 2, textTransform: 'capitalize' }]}>
                  {status.status.replace(/_/g, ' ')}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{status.count}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{status.percentage.toFixed(1)}%</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ padding: 20, backgroundColor: COLORS.gray[50], textAlign: 'center' }}>
            <Text style={styles.text}>No order status data available</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>InCloud Analytics Report - Pricing Analysis</Text>
          <Text>Page {pageNumber + 2}</Text>
        </View>
      </Page>
    </>
  )
}
