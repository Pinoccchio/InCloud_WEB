'use client'

import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">
            This is orders page
          </p>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col items-center justify-center py-12">
          <ClipboardDocumentListIcon className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Orders Module</h3>
          <p className="text-gray-500 text-center max-w-md">
            This is orders page. Order management functionality will be implemented here.
          </p>
        </div>
      </div>
    </div>
  )
}