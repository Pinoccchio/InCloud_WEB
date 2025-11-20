'use client'

import { useState, useEffect } from 'react'
import {
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TruckIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase/auth'
import { Button } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'

// Component imports
import OrdersTable from './components/OrdersTable'
import OrderFilters from './components/OrderFilters'
import OrderDetailsModal from './components/OrderDetailsModal'

interface OrderStats {
  totalOrders: number
  pendingOrders: number
  confirmedOrders: number
  inTransitOrders: number
  deliveredOrders: number
  todaysRevenue: number
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled' | 'returned'
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded' | 'cancelled'
  order_date: string
  delivery_date: string | null
  total_amount: number
  items_count: number
  branch_name: string
}

export default function OrdersPage() {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateRange, setDateRange] = useState('all')

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)

  // Data states
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    inTransitOrders: 0,
    deliveredOrders: 0,
    todaysRevenue: 0
  })
  const [loadingStats, setLoadingStats] = useState(true)

  const { showToast } = useToast()

  // Fetch order statistics
  const fetchStats = async () => {
    try {
      setLoadingStats(true)

      // Get order counts by status
      const { data: orders, error } = await supabase
        .from('orders')
        .select('status, total_amount, order_date')

      if (error) throw error

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const stats: OrderStats = {
        totalOrders: orders?.length || 0,
        pendingOrders: orders?.filter(o => o.status === 'pending').length || 0,
        confirmedOrders: orders?.filter(o => o.status === 'confirmed').length || 0,
        inTransitOrders: orders?.filter(o => o.status === 'in_transit').length || 0,
        deliveredOrders: orders?.filter(o => o.status === 'delivered').length || 0,
        todaysRevenue: orders?.filter(o =>
          new Date(o.order_date) >= today && o.status === 'delivered'
        ).reduce((sum, o) => sum + o.total_amount, 0) || 0
      }

      setStats(stats)
    } catch (err) {
      console.error('Error fetching order stats:', err)
      showToast('Failed to fetch order statistics', 'error')
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    fetchStats()

    // Subscribe to real-time changes with unique channel name
    const channelName = `orders-stats-${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchStats()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchStats()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  const handleCloseOrderDetails = () => {
    setShowOrderDetails(false)
    setSelectedOrder(null)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPaymentFilter('all')
    setDateRange('all')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage customer orders from request to delivery
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchStats}>
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {loadingStats ? '...' : stats.totalOrders.toLocaleString()}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {loadingStats ? '...' : stats.pendingOrders.toLocaleString()}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Confirmed</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {loadingStats ? '...' : stats.confirmedOrders.toLocaleString()}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TruckIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">In Transit</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {loadingStats ? '...' : stats.inTransitOrders.toLocaleString()}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Today&apos;s Revenue</dt>
                <dd className="flex items-baseline">
                  <div className="text-xl font-semibold text-gray-900">
                    {loadingStats ? '...' : formatCurrency(stats.todaysRevenue)}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <OrderFilters
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        paymentFilter={paymentFilter}
        dateRange={dateRange}
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
        onPaymentChange={setPaymentFilter}
        onDateRangeChange={setDateRange}
        onClearFilters={clearFilters}
      />

      {/* Orders Table */}
      <OrdersTable
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        paymentFilter={paymentFilter}
        dateRange={dateRange}
        onOrderSelect={handleOrderSelect}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={showOrderDetails}
        onClose={handleCloseOrderDetails}
        orderId={selectedOrder?.id || null}
      />
    </div>
  )
}