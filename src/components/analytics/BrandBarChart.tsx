'use client'

interface BrandData {
  brandName: string
  productCount: number
  totalInventory: number
  availableInventory: number
  percentageOfTotal: number
}

interface BrandBarChartProps {
  data: BrandData[]
}

export default function BrandBarChart({ data }: BrandBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No brand performance data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.totalInventory), 1)

  return (
    <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
      {data.map((brand, index) => (
        <div key={brand.brandName} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">{brand.brandName}</span>
              <span className="text-xs text-gray-500">({brand.productCount} products)</span>
            </div>
            <div className="flex gap-3 text-xs text-gray-600">
              <span>Total: {brand.totalInventory}</span>
              <span>Available: {brand.availableInventory}</span>
              <span className="font-medium">{brand.percentageOfTotal.toFixed(1)}%</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full transition-all duration-500"
              style={{
                width: `${(brand.totalInventory / maxValue) * 100}%`,
                backgroundColor: `hsl(${(index * 360) / data.length}, 70%, 50%)`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
