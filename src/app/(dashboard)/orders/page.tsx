'use client'

import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600 mt-1">
          Process customer orders, track fulfillment, and manage deliveries
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <ClipboardDocumentListIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Order Management Coming Soon
          </h3>
          <p className="text-gray-500">
            Comprehensive order processing with status tracking and fulfillment coordination
          </p>
        </div>
      </div>
    </div>
  )
}