'use client'

import { useEffect, useRef } from 'react'

interface CategoryData {
  categoryName: string
  totalInventory: number
  percentageOfTotal: number
}

interface CategoryBarChartProps {
  data: CategoryData[]
}

export default function CategoryBarChart({ data }: CategoryBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.totalInventory), 1)

  return (
    <div className="space-y-3">
      {data.map((category, index) => (
        <div key={category.categoryName} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">{category.categoryName}</span>
            <span className="text-gray-600">
              {category.totalInventory} units ({category.percentageOfTotal.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full transition-all duration-500"
              style={{
                width: `${(category.totalInventory / maxValue) * 100}%`,
                backgroundColor: `hsl(${(index * 360) / data.length}, 70%, 50%)`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}