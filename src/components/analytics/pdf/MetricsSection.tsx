import React from 'react'
import { Page, Text, View } from '@react-pdf/renderer'
import { ReportData } from '@/lib/services/pdfReportService'
import { styles, COLORS, formatCurrency } from '@/lib/services/pdfStyles'

interface MetricsSectionProps {
  data: ReportData
  pageNumber: number
}

export const MetricsSection: React.FC<MetricsSectionProps> = ({ data, pageNumber }) => {
  const { inventoryMetrics, salesMetrics, expirationMetrics } = data

  // Calculate stock distribution percentages
  const totalStockItems = inventoryMetrics.adequateStockItems + inventoryMetrics.lowStockItems + inventoryMetrics.outOfStockItems
  const adequatePercentage = totalStockItems > 0
    ? ((inventoryMetrics.adequateStockItems / totalStockItems) * 100).toFixed(1)
    : '0.0'
  const lowStockPercentage = totalStockItems > 0
    ? ((inventoryMetrics.lowStockItems / totalStockItems) * 100).toFixed(1)
    : '0.0'
  const outOfStockPercentage = totalStockItems > 0
    ? ((inventoryMetrics.outOfStockItems / totalStockItems) * 100).toFixed(1)
    : '0.0'

  return (
    <Page size="A4" style={styles.page}>
      {/* Page Header */}
      <Text style={styles.header}>Executive Summary</Text>

      {/* Key Metrics Grid */}
      <Text style={styles.subheader}>Key Performance Indicators</Text>

      <View style={styles.metricsContainer}>
        {/* Total Products */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Products</Text>
          <Text style={styles.metricValue}>{inventoryMetrics.totalProducts}</Text>
        </View>

        {/* Inventory Value (Retail) */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Inventory Value (Retail)</Text>
          <Text style={[styles.metricValue, { fontSize: 16 }]}>
            {formatCurrency(inventoryMetrics.totalInventoryValueRetail)}
          </Text>
        </View>

        {/* Total Orders */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Orders</Text>
          <Text style={styles.metricValue}>{salesMetrics.totalOrders}</Text>
        </View>

        {/* Total Revenue */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Revenue</Text>
          <Text style={[styles.metricValue, { fontSize: 16 }]}>
            {formatCurrency(salesMetrics.totalRevenue)}
          </Text>
        </View>

        {/* Average Order Value */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Average Order Value</Text>
          <Text style={[styles.metricValue, { fontSize: 16 }]}>
            {formatCurrency(salesMetrics.averageOrderValue)}
          </Text>
        </View>

        {/* Low Stock Items */}
        <View style={[styles.metricCard, { borderLeftWidth: 4, borderLeftColor: COLORS.warning }]}>
          <Text style={styles.metricLabel}>Low Stock Items</Text>
          <Text style={[styles.metricValue, { color: COLORS.warning }]}>
            {inventoryMetrics.lowStockItems}
          </Text>
        </View>

        {/* Out of Stock Items */}
        <View style={[styles.metricCard, { borderLeftWidth: 4, borderLeftColor: COLORS.danger }]}>
          <Text style={styles.metricLabel}>Out of Stock</Text>
          <Text style={[styles.metricValue, { color: COLORS.danger }]}>
            {inventoryMetrics.outOfStockItems}
          </Text>
        </View>

        {/* Expiring Soon (7 days) */}
        <View style={[styles.metricCard, { borderLeftWidth: 4, borderLeftColor: COLORS.danger }]}>
          <Text style={styles.metricLabel}>Expiring Soon (7 days)</Text>
          <Text style={[styles.metricValue, { color: COLORS.danger }]}>
            {expirationMetrics.expiringSoon7Days}
          </Text>
        </View>
      </View>

      {/* Stock Distribution Summary */}
      <Text style={[styles.subheader, { marginTop: 20 }]}>Stock Distribution</Text>
      <View style={{ marginTop: 10, marginBottom: 15 }}>
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <View style={{ width: 150 }}>
            <Text style={[styles.text, { fontWeight: 'bold' }]}>Adequate Stock:</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.text}>
              {inventoryMetrics.adequateStockItems} products ({adequatePercentage}%)
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <View style={{ width: 150 }}>
            <Text style={[styles.text, { fontWeight: 'bold', color: COLORS.warning }]}>Low Stock:</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.text}>
              {inventoryMetrics.lowStockItems} products ({lowStockPercentage}%)
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ width: 150 }}>
            <Text style={[styles.text, { fontWeight: 'bold', color: COLORS.danger }]}>Out of Stock:</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.text}>
              {inventoryMetrics.outOfStockItems} products ({outOfStockPercentage}%)
            </Text>
          </View>
        </View>
      </View>

      {/* Average Stock Level */}
      <View style={{ marginTop: 15, padding: 12, backgroundColor: COLORS.gray[50], borderRadius: 4 }}>
        <Text style={[styles.text, { marginBottom: 5, fontWeight: 'bold' }]}>
          Inventory Health
        </Text>
        <Text style={styles.text}>
          • Average Stock Level: {inventoryMetrics.averageStockLevel.toFixed(2)} units per product
        </Text>
        <Text style={styles.text}>
          • Total Available Quantity: {inventoryMetrics.totalAvailableQuantity} units
        </Text>
        <Text style={styles.text}>
          • Total Reserved Quantity: {inventoryMetrics.totalReservedQuantity} units
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>InCloud Analytics Report - Executive Summary</Text>
        <Text>Page {pageNumber}</Text>
      </View>
    </Page>
  )
}
