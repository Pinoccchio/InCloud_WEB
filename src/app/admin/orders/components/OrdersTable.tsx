'use client'

import { useState, useEffect } from 'react'
import {
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase/auth'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui'

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

interface OrdersTableProps {
  searchQuery: string
  statusFilter: string
  paymentFilter: string
  dateRange: string
  onOrderSelect: (order: Order) => void
}

const statusConfig = {
  pending: {
    icon: ClockIcon,
    color: 'text-yellow-600 bg-yellow-100',
    label: 'Pending'
  },
  confirmed: {
    icon: CheckCircleIcon,
    color: 'text-blue-600 bg-blue-100',
    label: 'Confirmed'
  },
  in_transit: {
    icon: TruckIcon,
    color: 'text-purple-600 bg-purple-100',
    label: 'In Transit'
  },
  delivered: {
    icon: CheckCircleIcon,
    color: 'text-green-600 bg-green-100',
    label: 'Delivered'
  },
  cancelled: {
    icon: XMarkIcon,
    color: 'text-red-600 bg-red-100',
    label: 'Cancelled'
  },
  returned: {
    icon: ArrowPathIcon,
    color: 'text-gray-600 bg-gray-100',
    label: 'Returned'
  }
}

const paymentStatusConfig = {
  pending: { color: 'text-yellow-700 bg-yellow-100', label: 'Pending' },
  paid: { color: 'text-green-700 bg-green-100', label: 'Paid' },
  partial: { color: 'text-orange-700 bg-orange-100', label: 'Partial' },
  refunded: { color: 'text-purple-700 bg-purple-100', label: 'Refunded' },
  cancelled: { color: 'text-red-700 bg-red-100', label: 'Cancelled' }
}

export default function OrdersTable({
  searchQuery,
  statusFilter,
  paymentFilter,
  dateRange,
  onOrderSelect
}: OrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()

  // Fetch orders data
  const fetchOrders = async () => {
    console.log('📦 [OrdersTable] Starting orders fetch')
    const startTime = performance.now()

    try {
      setLoading(true)
      setError(null)

      console.log('📋 [OrdersTable] Applied filters:', {
        searchQuery,
        statusFilter,
        paymentFilter,
        dateRange
      })

      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          payment_status,
          order_date,
          delivery_date,
          total_amount,
          notes,
          customers!inner(
            full_name,
            email
          ),
          branches!inner(
            name
          ),
          order_items(
            id
          )
        `)
        .order('order_date', { ascending: false })

      // Apply filters
      if (statusFilter && statusFilter !== 'all') {
        console.log('🔍 [OrdersTable] Applying status filter:', statusFilter)
        query = query.eq('status', statusFilter)
      }

      if (paymentFilter && paymentFilter !== 'all') {
        console.log('💳 [OrdersTable] Applying payment filter:', paymentFilter)
        query = query.eq('payment_status', paymentFilter)
      }

      // Date range filter
      if (dateRange && dateRange !== 'all') {
        const now = new Date()
        let startDate: Date

        switch (dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          default:
            startDate = new Date(0)
        }

        console.log('📅 [OrdersTable] Applying date range filter:', {
          dateRange,
          startDate: startDate.toISOString()
        })
        query = query.gte('order_date', startDate.toISOString())
      }

      console.log('💾 [OrdersTable] Fetching orders from database...')
      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      console.log('✅ [OrdersTable] Orders fetched from database:', {
        count: data?.length || 0,
        duration: `${(performance.now() - startTime).toFixed(0)}ms`
      })

      // Transform data
      console.log('🔄 [OrdersTable] Transforming order data...')
      const transformedOrders: Order[] = (data || []).map(order => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customers?.full_name || 'Unknown Customer',
        customer_email: order.customers?.email || '',
        status: order.status,
        payment_status: order.payment_status,
        order_date: order.order_date,
        delivery_date: order.delivery_date,
        total_amount: order.total_amount,
        items_count: order.order_items?.length || 0,
        branch_name: order.branches?.name || 'Unknown Branch'
      }))

      // Apply search filter
      let filteredOrders = transformedOrders
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        console.log('🔍 [OrdersTable] Applying search filter:', searchQuery)
        filteredOrders = transformedOrders.filter(order =>
          order.order_number.toLowerCase().includes(query) ||
          order.customer_name.toLowerCase().includes(query) ||
          order.customer_email.toLowerCase().includes(query)
        )
      }

      const totalDuration = (performance.now() - startTime).toFixed(0)

      console.log('🎉 [OrdersTable] Orders fetch completed successfully:', {
        totalOrders: filteredOrders.length,
        totalDuration: `${totalDuration}ms`,
        statusBreakdown: {
          pending: filteredOrders.filter(o => o.status === 'pending').length,
          confirmed: filteredOrders.filter(o => o.status === 'confirmed').length,
          in_transit: filteredOrders.filter(o => o.status === 'in_transit').length,
          delivered: filteredOrders.filter(o => o.status === 'delivered').length,
          cancelled: filteredOrders.filter(o => o.status === 'cancelled').length
        },
        paymentBreakdown: {
          paid: filteredOrders.filter(o => o.payment_status === 'paid').length,
          pending: filteredOrders.filter(o => o.payment_status === 'pending').length
        }
      })

      setOrders(filteredOrders)
    } catch (err) {
      console.error('❌ [OrdersTable] Error fetching orders:', err)
      console.error('📋 [OrdersTable] Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        filters: { searchQuery, statusFilter, paymentFilter, dateRange },
        duration: `${(performance.now() - startTime).toFixed(0)}ms`
      })
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
      showToast('Failed to fetch orders', 'error')
    } finally {
      setLoading(false)
      console.log('🏁 [OrdersTable] Fetch operation completed')
    }
  }

  // Set up real-time subscription
  useEffect(() => {
    console.log('🔄 [OrdersTable] Component mounted/filters changed - initializing data fetch')
    fetchOrders()

    // Subscribe to real-time changes with unique channel name
    const channelName = `orders-table-${Date.now()}`
    console.log('📡 [OrdersTable] Setting up real-time subscription:', channelName)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('➕ [OrdersTable] Real-time INSERT detected:', {
            orderId: payload.new.id,
            orderNumber: payload.new.order_number
          })
          fetchOrders() // Refetch when changes occur
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('🔄 [OrdersTable] Real-time UPDATE detected:', {
            orderId: payload.new.id,
            orderNumber: payload.new.order_number,
            status: payload.new.status
          })
          fetchOrders() // Refetch when changes occur
        }
      )
      .subscribe()

    return () => {
      console.log('🔌 [OrdersTable] Cleaning up real-time subscription:', channelName)
      supabase.removeChannel(channel)
    }
  }, [statusFilter, paymentFilter, dateRange])

  // Refetch when search query changes
  useEffect(() => {
    console.log('🔍 [OrdersTable] Search query changed - refetching orders')
    fetchOrders()
  }, [searchQuery])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading orders...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchOrders} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Orders will appear here when customers place them'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => {
              const StatusIcon = statusConfig[order.status].icon
              return (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.order_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.branch_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customer_email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[order.status].color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig[order.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusConfig[order.payment_status].color}`}>
                      {paymentStatusConfig[order.payment_status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(order.order_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.items_count} item{order.items_count !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOrderSelect(order)}
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}