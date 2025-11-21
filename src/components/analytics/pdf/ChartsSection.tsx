import React from 'react'
import { Page, Text, View } from '@react-pdf/renderer'
import { ReportData } from '@/lib/services/pdfReportService'
import { styles, COLORS, formatCurrency, formatMonth } from '@/lib/services/pdfStyles'

interface ChartsSectionProps {
  data: ReportData
  pageNumber: number
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({ data, pageNumber }) => {
  const { salesMetrics, brandPerformance } = data

  // Calculate max values for bar chart scaling
  const maxRevenue = Math.max(...salesMetrics.monthlySales.map(m => m.totalRevenue), 1)
  const maxOrders = Math.max(...salesMetrics.monthlySales.map(m => m.totalOrders), 1)
  const maxBrandInventory = Math.max(...brandPerformance.map(b => b.totalInventory), 1)

  return (
    <>
      {/* Sales Overview Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Sales Performance</Text>

        {/* Monthly Sales Chart */}
        <Text style={styles.chartTitle}>Monthly Sales Trend</Text>

        {salesMetrics.monthlySales.length > 0 ? (
          <View style={styles.chart}>
            {salesMetrics.monthlySales.slice(0, 12).map((month, index) => (
              <View key={`${month.year}-${month.month}`} style={{ marginBottom: 15 }}>
                {/* Month Label */}
                <Text style={[styles.text, { fontSize: 10, fontWeight: 'bold', marginBottom: 5 }]}>
                  {formatMonth(month.month)} {month.year}
                </Text>

                {/* Revenue Bar */}
                <View style={styles.barRow}>
                  <Text style={[styles.barLabel, { fontSize: 9 }]}>Revenue</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${(month.totalRevenue / maxRevenue) * 100}%`,
                          backgroundColor: '#10B981', // Green gradient
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barValue, { fontSize: 9 }]}>
                    {formatCurrency(month.totalRevenue)}
                  </Text>
                </View>

                {/* Orders Bar */}
                <View style={[styles.barRow, { marginTop: 3 }]}>
                  <Text style={[styles.barLabel, { fontSize: 9 }]}>Orders</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${(month.totalOrders / maxOrders) * 100}%`,
                          backgroundColor: '#3B82F6', // Blue
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barValue, { fontSize: 9 }]}>
                    {month.totalOrders}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ padding: 20, backgroundColor: COLORS.gray[50], textAlign: 'center' }}>
            <Text style={styles.text}>No sales data available for the selected period</Text>
          </View>
        )}

        {/* Sales Summary */}
        {salesMetrics.monthlySales.length > 0 && (
          <View style={{ marginTop: 20, padding: 12, backgroundColor: COLORS.gray[50], borderRadius: 4 }}>
            <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 8 }]}>
              Sales Summary
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.text, { fontSize: 10, color: COLORS.gray[600] }]}>
                  Total Orders
                </Text>
                <Text style={[styles.text, { fontSize: 14, fontWeight: 'bold' }]}>
                  {salesMetrics.totalOrders}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.text, { fontSize: 10, color: COLORS.gray[600] }]}>
                  Total Revenue
                </Text>
                <Text style={[styles.text, { fontSize: 14, fontWeight: 'bold' }]}>
                  {formatCurrency(salesMetrics.totalRevenue)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.text, { fontSize: 10, color: COLORS.gray[600] }]}>
                  Avg Order Value
                </Text>
                <Text style={[styles.text, { fontSize: 14, fontWeight: 'bold' }]}>
                  {formatCurrency(salesMetrics.averageOrderValue)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>InCloud Analytics Report - Sales Performance</Text>
          <Text>Page {pageNumber}</Text>
        </View>
      </Page>

      {/* Brand Performance Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Brand Performance</Text>

        <Text style={styles.chartTitle}>Inventory by Brand</Text>

        {brandPerformance.length > 0 ? (
          <View style={styles.chart}>
            {brandPerformance.slice(0, 15).map((brand, index) => {
              // Generate color based on index
              const hue = (index * 360) / brandPerformance.length
              const barColor = `hsl(${hue}, 70%, 50%)`

              return (
                <View key={brand.brandName} style={styles.barRow}>
                  <Text style={[styles.barLabel, { width: 140 }]}>
                    {brand.brandName}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${(brand.totalInventory / maxBrandInventory) * 100}%`,
                          backgroundColor: barColor,
                        },
                      ]}
                    />
                  </View>
                  <View style={{ width: 150, marginLeft: 10 }}>
                    <Text style={[styles.text, { fontSize: 9 }]}>
                      {brand.totalInventory} units ({brand.percentageOfTotal.toFixed(1)}%)
                    </Text>
                    <Text style={[styles.text, { fontSize: 8, color: COLORS.gray[500] }]}>
                      {brand.productCount} products • {brand.availableInventory} available
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        ) : (
          <View style={{ padding: 20, backgroundColor: COLORS.gray[50], textAlign: 'center' }}>
            <Text style={styles.text}>No brand performance data available</Text>
          </View>
        )}

        {/* Brand Summary */}
        {brandPerformance.length > 0 && (
          <View style={{ marginTop: 20, padding: 12, backgroundColor: COLORS.gray[50], borderRadius: 4 }}>
            <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 5 }]}>
              Brand Insights
            </Text>
            <Text style={styles.text}>
              • Total Brands: {brandPerformance.length}
            </Text>
            <Text style={styles.text}>
              • Top Brand: {brandPerformance[0]?.brandName} ({brandPerformance[0]?.totalInventory} units)
            </Text>
            <Text style={styles.text}>
              • Average Products per Brand: {(brandPerformance.reduce((sum, b) => sum + b.productCount, 0) / brandPerformance.length).toFixed(1)}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>InCloud Analytics Report - Brand Performance</Text>
          <Text>Page {pageNumber + 1}</Text>
        </View>
      </Page>
    </>
  )
}
