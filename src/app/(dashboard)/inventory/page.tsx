'use client'

import { BuildingStorefrontIcon } from '@heroicons/react/24/outline'

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-1">
          Monitor stock levels, transfers, and batch tracking across all branches
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <BuildingStorefrontIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Inventory Management Coming Soon
          </h3>
          <p className="text-gray-500">
            Real-time inventory tracking with multi-branch coordination and batch management
          </p>
        </div>
      </div>
    </div>
  )
}