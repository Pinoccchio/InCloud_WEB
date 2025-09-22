'use client'

import { BellIcon } from '@heroicons/react/24/outline'

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
        <p className="text-gray-600 mt-1">
          Manage system alerts for low stock, expiring products, and order updates
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <BellIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Alert Management Coming Soon
          </h3>
          <p className="text-gray-500">
            Comprehensive alert system with custom rules and real-time notifications
          </p>
        </div>
      </div>
    </div>
  )
}