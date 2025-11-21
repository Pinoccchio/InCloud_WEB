'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { SupplierOrderModal } from './components/SupplierOrderModal'
import { SupplierOrdersTable } from './components/SupplierOrdersTable'
import { SupplierOrderDetailsModal } from './components/SupplierOrderDetailsModal'

interface SupplierOrder {
  id: string
  order_number: string
  supplier_name: string
  branch_name: string
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled'
  order_date: string
  expected_delivery_date?: string
  total_amount: number
  items_count: number
}

export default function SupplierOrdersPage() {
  const { session } = useAuth()
  const { addToast } = useToast()
  const [orders, setOrders] = useState<SupplierOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchOrders()
  }, [currentPage, statusFilter, startDate, endDate])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (startDate) {
        params.append('startDate', startDate)
      }
      if (endDate) {
        params.append('endDate', endDate)
      }

      const response = await fetch(`/api/supplier-orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error || 'Unknown error'
        })
        throw new Error(errorData.error || `Failed to fetch supplier orders (${response.status})`)
      }

      const data = await response.json()
      setOrders(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching supplier orders:', error)
      addToast({
        type: 'error',
        title: 'Failed to Load Supplier Orders',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (order: SupplierOrder) => {
    setSelectedOrderId(order.id)
    setShowDetailsModal(true)
  }

  const handleCreateSuccess = () => {
    fetchOrders()
  }

  const handleStatusUpdate = () => {
    fetchOrders()
  }

  const resetFilters = () => {
    setStatusFilter('all')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Orders</h1>
          <p className="text-gray-600 mt-1">
            Manage supplier orders and track deliveries
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create Supplier Order
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-700" />
            <span className="text-sm font-medium text-gray-900">Filters:</span>
          </div>

          <div className="flex items-center gap-3 flex-1">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-900">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-900">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-900">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {(statusFilter !== 'all' || startDate || endDate) && (
              <button
                onClick={resetFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <SupplierOrdersTable
        orders={orders}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onViewDetails={handleViewDetails}
      />

      {/* Create Modal */}
      <SupplierOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Details Modal */}
      <SupplierOrderDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedOrderId(null)
        }}
        orderId={selectedOrderId}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  )
}
