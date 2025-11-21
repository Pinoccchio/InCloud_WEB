import { StyleSheet } from '@react-pdf/renderer'

// Brand colors from J.A's Food Trading
export const COLORS = {
  primary: '#DC2626', // Deep red
  secondary: '#1E40AF', // Deep blue
  success: '#059669', // Green
  warning: '#D97706', // Orange
  danger: '#DC2626', // Red
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  white: '#FFFFFF',
  black: '#000000',
}

// PDF styles
export const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: COLORS.white,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    padding: 60,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 18,
    color: COLORS.gray[600],
    marginBottom: 10,
    textAlign: 'center',
  },
  coverInfo: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 40,
    textAlign: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 20,
    borderBottom: `2 solid ${COLORS.primary}`,
    paddingBottom: 10,
  },
  subheader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[800],
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 11,
    color: COLORS.gray[700],
    lineHeight: 1.6,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 9,
    color: COLORS.gray[400],
    borderTop: `1 solid ${COLORS.gray[200]}`,
    paddingTop: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricsContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    padding: 15,
    backgroundColor: COLORS.gray[50],
    border: `1 solid ${COLORS.gray[200]}`,
    borderRadius: 8,
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.gray[600],
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  table: {
    marginTop: 15,
    marginBottom: 20,
  },
  tableHeader: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: COLORS.gray[100],
    padding: 8,
    borderBottom: `2 solid ${COLORS.gray[300]}`,
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    padding: 8,
    borderBottom: `1 solid ${COLORS.gray[200]}`,
  },
  tableRowAlt: {
    display: 'flex',
    flexDirection: 'row',
    padding: 8,
    backgroundColor: COLORS.gray[50],
    borderBottom: `1 solid ${COLORS.gray[200]}`,
  },
  tableCell: {
    fontSize: 10,
    color: COLORS.gray[700],
    flex: 1,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    flex: 1,
  },
  chart: {
    marginTop: 15,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.gray[800],
    marginBottom: 10,
  },
  barContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  barRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  barLabel: {
    width: 120,
    fontSize: 10,
    color: COLORS.gray[700],
  },
  barTrack: {
    flex: 1,
    height: 20,
    backgroundColor: COLORS.gray[200],
    position: 'relative',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
  },
  barValue: {
    width: 80,
    fontSize: 10,
    color: COLORS.gray[700],
    textAlign: 'right',
    marginLeft: 10,
  },
  aiInsight: {
    padding: 12,
    marginBottom: 10,
    borderLeft: `4 solid`,
    backgroundColor: COLORS.gray[50],
  },
  aiInsightCritical: {
    borderLeftColor: COLORS.danger,
  },
  aiInsightHigh: {
    borderLeftColor: COLORS.warning,
  },
  aiInsightMedium: {
    borderLeftColor: COLORS.secondary,
  },
  aiInsightLow: {
    borderLeftColor: COLORS.gray[400],
  },
  aiInsightTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  aiInsightText: {
    fontSize: 10,
    color: COLORS.gray[700],
    lineHeight: 1.5,
  },
  badge: {
    display: 'inline-block',
    padding: '4 8',
    fontSize: 8,
    fontWeight: 'bold',
    borderRadius: 4,
    color: COLORS.white,
  },
  badgeSuccess: {
    backgroundColor: COLORS.success,
  },
  badgeWarning: {
    backgroundColor: COLORS.warning,
  },
  badgeDanger: {
    backgroundColor: COLORS.danger,
  },
  badgeInfo: {
    backgroundColor: COLORS.secondary,
  },
})

// Format currency in PHP pesos
export const formatCurrency = (amount: number): string => {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Format month from "11" to "Nov"
export const formatMonth = (month: string): string => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return monthNames[parseInt(month) - 1] || month
}

// Get status badge color
export const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase()
  if (statusLower.includes('delivered') || statusLower.includes('adequate')) return COLORS.success
  if (statusLower.includes('pending') || statusLower.includes('low')) return COLORS.warning
  if (statusLower.includes('cancelled') || statusLower.includes('critical') || statusLower.includes('expired')) return COLORS.danger
  return COLORS.secondary
}
