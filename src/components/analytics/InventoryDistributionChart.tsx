'use client'

interface InventoryDistributionChartProps {
  lowStock: number
  outOfStock: number
  adequate: number
}

export default function InventoryDistributionChart({
  lowStock,
  outOfStock,
  adequate,
}: InventoryDistributionChartProps) {
  const total = lowStock + outOfStock + adequate
  if (total === 0) return <div className="text-center text-gray-500">No data available</div>

  const lowStockPercentage = (lowStock / total) * 100
  const outOfStockPercentage = (outOfStock / total) * 100
  const adequatePercentage = (adequate / total) * 100

  const segments = [
    {
      label: 'Adequate Stock',
      value: adequate,
      percentage: adequatePercentage,
      color: '#10B981', // green
    },
    {
      label: 'Low Stock',
      value: lowStock,
      percentage: lowStockPercentage,
      color: '#F59E0B', // yellow
    },
    {
      label: 'Out of Stock',
      value: outOfStock,
      percentage: outOfStockPercentage,
      color: '#EF4444', // red
    },
  ]

  return (
    <div className="space-y-6">
      {/* Donut Chart Visualization */}
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="20"
            />
            {(() => {
              let offset = 0
              return segments.map((segment, index) => {
                const circumference = 2 * Math.PI * 40
                const segmentLength = (segment.percentage / 100) * circumference
                const currentOffset = offset
                offset += segmentLength

                return segment.value > 0 ? (
                  <circle
                    key={index}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="20"
                    strokeDasharray={`${segmentLength} ${circumference}`}
                    strokeDashoffset={-currentOffset}
                    className="transition-all duration-500"
                  />
                ) : null
              })
            })()}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{total}</div>
              <div className="text-xs text-gray-500">Products</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-sm text-gray-700">{segment.label}</span>
            </div>
            <div className="text-sm font-medium text-gray-900">
              {segment.value} ({segment.percentage.toFixed(1)}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}