'use client'

interface MonthlySalesData {
  month: string
  year: number
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
}

interface SalesBarChartProps {
  data: MonthlySalesData[]
}

export default function SalesBarChart({ data }: SalesBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No sales data available for the selected period
      </div>
    )
  }

  const maxRevenue = Math.max(...data.map((d) => d.totalRevenue), 1)
  const maxOrders = Math.max(...data.map((d) => d.totalOrders), 1)

  // Format month display (e.g., "Jan 2025")
  const formatMonthYear = (month: string, year: number) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthIndex = parseInt(month) - 1
    return `${monthNames[monthIndex]} ${year}`
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {data.map((monthData, index) => (
        <div key={`${monthData.year}-${monthData.month}`} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-800">
              {formatMonthYear(monthData.month, monthData.year)}
            </span>
            <div className="flex gap-4 text-xs text-gray-600">
              <span>Orders: {monthData.totalOrders}</span>
              <span>Revenue: {formatCurrency(monthData.totalRevenue)}</span>
            </div>
          </div>

          {/* Revenue Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Revenue</span>
              <span className="font-medium">{formatCurrency(monthData.totalRevenue)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-green-500 to-green-600"
                style={{
                  width: `${(monthData.totalRevenue / maxRevenue) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Orders Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Orders</span>
              <span className="font-medium">{monthData.totalOrders}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-blue-600"
                style={{
                  width: `${(monthData.totalOrders / maxOrders) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Average Order Value */}
          <div className="text-xs text-gray-500 text-right">
            Avg Order: {formatCurrency(monthData.averageOrderValue)}
          </div>

          {index < data.length - 1 && <div className="border-t border-gray-200 mt-4" />}
        </div>
      ))}

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t-2 border-gray-300">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-800">
              {data.reduce((sum, m) => sum + m.totalOrders, 0)}
            </div>
            <div className="text-xs text-gray-600">Total Orders</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.reduce((sum, m) => sum + m.totalRevenue, 0))}
            </div>
            <div className="text-xs text-gray-600">Total Revenue</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(
                data.reduce((sum, m) => sum + m.totalRevenue, 0) /
                  data.reduce((sum, m) => sum + m.totalOrders, 0) || 0
              )}
            </div>
            <div className="text-xs text-gray-600">Avg Order Value</div>
          </div>
        </div>
      </div>
    </div>
  )
}
