'use client'

import { CubeIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your product catalog, pricing, and inventory across all branches
          </p>
        </div>
        <Button className="flex items-center">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <CubeIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Product Management Coming Soon
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            This comprehensive product management interface will allow you to manage your entire
            frozen food catalog with pricing tiers, stock tracking, and multi-branch coordination.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Product Catalog</h4>
              <p className="text-sm text-gray-500 mt-1">Full CRUD operations on products</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Multi-tier Pricing</h4>
              <p className="text-sm text-gray-500 mt-1">Wholesale, retail, and box pricing</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Stock Tracking</h4>
              <p className="text-sm text-gray-500 mt-1">Real-time inventory levels</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}