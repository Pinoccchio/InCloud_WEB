'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import Image from 'next/image'
import {
  XMarkIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  ArrowPathIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase/auth'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui'

interface OrderDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string | null
}

// Exact type definitions matching Supabase schema
type OrderStatus = 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled' | 'returned'
type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded' | 'cancelled'
type PricingTier = 'wholesale' | 'retail' | 'box'

interface CustomerData {
  id: string
  full_name: string
  email: string
  phone: string | null
  customer_type: string | null
}

interface BranchData {
  id: string
  name: string
  address: string
}






// Clean interface for component use
interface OrderDetails {
  id: string
  order_number: string
  status: OrderStatus | null
  payment_status: PaymentStatus | null
  order_date: string | null
  delivery_date: string | null
  subtotal: number
  discount_amount: number | null
  tax_amount: number | null
  total_amount: number
  notes: string | null
  delivery_address: Record<string, unknown> | null
  customer: CustomerData
  branch: BranchData
  order_items: Array<{
    id: string
    quantity: number
    unit_price: number
    total_price: number
    pricing_tier: PricingTier
    fulfillment_status: string | null
    product: {
      id: string
      name: string
      sku: string | null
      unit_of_measure: string | null
      images: string[]
    }
  }>
  status_history: Array<{
    id: string
    old_status: OrderStatus | null
    new_status: OrderStatus
    changed_by_user_id: string | null
    created_at: string | null
    notes: string | null
    user_display_name: string
    user_type: 'Admin' | 'Customer' | 'System'
  }>
}

const statusConfig = {
  pending: {
    icon: ClockIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Pending',
    description: 'Order submitted, waiting for confirmation'
  },
  confirmed: {
    icon: CheckCircleIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Confirmed',
    description: 'Order confirmed, being prepared'
  },
  in_transit: {
    icon: TruckIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'In Transit',
    description: 'Order shipped, on the way to delivery'
  },
  delivered: {
    icon: CheckCircleIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Delivered',
    description: 'Order successfully delivered'
  },
  cancelled: {
    icon: XMarkIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Cancelled',
    description: 'Order cancelled'
  },
  returned: {
    icon: ArrowPathIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Returned',
    description: 'Order returned by customer'
  }
}

const statusFlow: OrderStatus[] = ['pending', 'confirmed', 'in_transit', 'delivered']

// Utility functions for data transformation
const processProductImages = (images: unknown): string[] => {
  if (!images) return []
  if (Array.isArray(images)) {
    return images.filter(img => typeof img === 'string' && img.trim())
  }
  if (typeof images === 'string' && images.trim()) {
    return [images]
  }
  return []
}

const processDeliveryAddress = (address: unknown): Record<string, unknown> | null => {
  if (!address || typeof address !== 'object') return null
  return address as Record<string, unknown>
}


export default function OrderDetailsModal({ isOpen, onClose, orderId }: OrderDetailsModalProps) {
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [statusNotes, setStatusNotes] = useState('')
  const { addToast } = useToast()

  // Fetch order details with proper error handling
  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return

    try {
      setLoading(true)

      // First, get basic order data
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customers!inner(
            id,
            full_name,
            email,
            phone,
            customer_type
          ),
          branches!inner(
            id,
            name,
            address
          ),
          order_items(
            id,
            quantity,
            unit_price,
            total_price,
            pricing_tier,
            fulfillment_status,
            products!inner(
              id,
              name,
              sku,
              unit_of_measure,
              images
            )
          )
        `)
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      // Separately fetch status history with user information
      const { data: statusHistory, error: historyError } = await supabase
        .from('order_status_history')
        .select(`
          id,
          old_status,
          new_status,
          changed_by_user_id,
          created_at,
          notes
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })

      if (historyError) {
        console.warn('Could not fetch status history:', historyError)
      }

      // Fetch user details for status history
      const processedHistory: OrderDetails['status_history'] = []

      if (statusHistory) {
        for (const historyItem of statusHistory) {
          let userInfo: { name: string; type: 'Admin' | 'Customer' | 'System' } = { name: 'System', type: 'System' }

          if (historyItem.changed_by_user_id) {
            try {
              // Check if user is admin first
              const { data: adminData } = await supabase
                .from('admins')
                .select('full_name, role')
                .eq('user_id', historyItem.changed_by_user_id)
                .single()

              if (adminData?.full_name) {
                userInfo = { name: adminData.full_name, type: 'Admin' }
              } else {
                // Check if user is customer
                const { data: customerData } = await supabase
                  .from('customers')
                  .select('full_name')
                  .eq('user_id', historyItem.changed_by_user_id)
                  .single()

                if (customerData?.full_name) {
                  userInfo = { name: customerData.full_name, type: 'Customer' }
                }
              }
            } catch (err) {
              console.warn('Could not fetch user info for history item:', err)
            }
          }

          processedHistory.push({
            id: historyItem.id,
            old_status: historyItem.old_status,
            new_status: historyItem.new_status,
            changed_by_user_id: historyItem.changed_by_user_id,
            created_at: historyItem.created_at,
            notes: historyItem.notes,
            user_display_name: userInfo.name,
            user_type: userInfo.type
          })
        }
      }

      // Transform the data to match our clean interface
      const transformedOrder: OrderDetails = {
        id: orderData.id,
        order_number: orderData.order_number,
        status: orderData.status || null,
        payment_status: orderData.payment_status || null,
        order_date: orderData.order_date || null,
        delivery_date: orderData.delivery_date,
        subtotal: orderData.subtotal,
        discount_amount: orderData.discount_amount || null,
        tax_amount: orderData.tax_amount || null,
        total_amount: orderData.total_amount,
        notes: orderData.notes,
        delivery_address: processDeliveryAddress(orderData.delivery_address),
        customer: orderData.customers,
        branch: orderData.branches,
        order_items: orderData.order_items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          pricing_tier: item.pricing_tier,
          fulfillment_status: item.fulfillment_status,
          product: {
            id: item.products.id,
            name: item.products.name,
            sku: item.products.sku,
            unit_of_measure: item.products.unit_of_measure,
            images: processProductImages(item.products.images)
          }
        })),
        status_history: processedHistory
      }

      setOrder(transformedOrder)
    } catch (err) {
      console.error('Error fetching order details:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      addToast({
        type: 'error',
        title: 'Failed to fetch order details',
        message: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }, [orderId, addToast])

  // Update order status with proper error handling
  const updateOrderStatus = async (newStatus: OrderStatus) => {
    if (!order) return

    try {
      setUpdating(true)

      const { data: adminData } = await supabase.auth.getUser()
      if (!adminData.user) throw new Error('Not authenticated')

      // Prepare update data
      const updateData: {
        status: string
        updated_at: string
        notes?: string
      } = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      // Add status notes to order notes if provided
      if (statusNotes.trim()) {
        updateData.notes = order.notes
          ? `${order.notes}\n\nStatus Update: ${statusNotes.trim()}`
          : `Status Update: ${statusNotes.trim()}`
      }

      // Set delivery date when marking as delivered
      if (newStatus === 'delivered') {
        updateData.delivery_date = new Date().toISOString()
      }

      // Update order status - database trigger will automatically create status history
      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order.id)

      if (updateError) {
        console.error('Order update error details:', updateError)
        throw new Error(`Failed to update order: ${updateError.message || 'Unknown database error'}`)
      }

      addToast({
        type: 'success',
        title: 'Order Status Updated',
        message: `Status changed to ${statusConfig[newStatus].label}`
      })

      setStatusNotes('')
      await fetchOrderDetails()

    } catch (err) {
      console.error('Error updating order status:', err)

      // Improved error handling with detailed messages
      let errorMessage = 'Unknown error occurred'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err)
      }

      addToast({
        type: 'error',
        title: 'Failed to update order status',
        message: errorMessage
      })
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails()
    }
  }, [isOpen, orderId, fetchOrderDetails])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNextStatus = (): OrderStatus | null => {
    if (!order || !order.status) return null
    const currentIndex = statusFlow.indexOf(order.status)
    return currentIndex >= 0 && currentIndex < statusFlow.length - 1
      ? statusFlow[currentIndex + 1]
      : null
  }

  const canUpdateStatus = () => {
    return order && order.status && ['pending', 'confirmed', 'in_transit'].includes(order.status)
  }

  // Helper function to get status history bubble styles
  const getStatusHistoryStyles = (status: OrderStatus) => {
    const config = statusConfig[status]
    return {
      bgColor: config.bgColor,
      textColor: config.color,
      icon: config.icon
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-medium text-gray-900">
                    Order Details
                  </DialogTitle>
                  {order && (
                    <p className="text-sm text-gray-500">
                      {order.order_number} • {order.order_date ? formatDate(order.order_date) : 'Date not available'}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white px-6 py-4 max-h-[70vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : order ? (
                <div className="space-y-6">
                  {/* Order Status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {(() => {
                          const status = order.status || 'pending'
                          const StatusIcon = statusConfig[status].icon
                          return (
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig[status].color} ${statusConfig[status].bgColor}`}>
                              <StatusIcon className="w-4 h-4 mr-2" />
                              {statusConfig[status].label}
                            </div>
                          )
                        })()}
                        <span className="ml-3 text-sm text-gray-500">
                          {statusConfig[order.status || 'pending'].description}
                        </span>
                      </div>

                      {/* Status Update Actions */}
                      {canUpdateStatus() && (
                        <div className="flex items-center space-x-2">
                          {getNextStatus() && (
                            <Button
                              onClick={() => updateOrderStatus(getNextStatus()!)}
                              disabled={updating}
                              size="sm"
                            >
                              {updating ? 'Updating...' : `Mark as ${statusConfig[getNextStatus()!].label}`}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Status Notes Input */}
                    {canUpdateStatus() && (
                      <div className="mt-3">
                        <textarea
                          value={statusNotes}
                          onChange={(e) => setStatusNotes(e.target.value)}
                          placeholder="Add notes for status update (optional)"
                          rows={2}
                          className="block w-full border border-gray-400 rounded-md px-3 py-2 text-sm text-gray-900 font-medium hover:border-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    )}
                  </div>

                  {/* Customer Information */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <UserIcon className="w-4 h-4 mr-2" />
                      Customer Information
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.customer.full_name}</p>
                          <p className="text-sm text-gray-500">{order.customer.email}</p>
                          {order.customer.phone && (
                            <p className="text-sm text-gray-500">{order.customer.phone}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Customer Type</p>
                          <p className="text-sm font-medium text-gray-900 capitalize">{order.customer.customer_type || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="divide-y divide-gray-200">
                        {order.order_items.map((item) => {
                          return (
                            <div key={item.id} className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-start space-x-3">
                                    {item.product.images.length > 0 ? (
                                      <Image
                                        src={item.product.images[0] || '/placeholder-product.png'}
                                        alt={item.product.name}
                                        width={48}
                                        height={48}
                                        className="w-12 h-12 rounded-lg object-cover"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <DocumentTextIcon className="w-6 h-6 text-gray-400" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                                      {item.product.sku && (
                                        <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                                      )}
                                      <p className="text-sm text-gray-500">
                                        {item.quantity} {item.product.unit_of_measure || 'units'} • {item.pricing_tier.toUpperCase()} Price
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatCurrency(item.total_price)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {formatCurrency(item.unit_price)} each
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Order Summary</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Subtotal</span>
                          <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                        </div>
                        {(order.discount_amount || 0) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Discount</span>
                            <span className="text-green-600">-{formatCurrency(order.discount_amount || 0)}</span>
                          </div>
                        )}
                        {(order.tax_amount || 0) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Tax</span>
                            <span className="text-gray-900">{formatCurrency(order.tax_amount || 0)}</span>
                          </div>
                        )}
                        <div className="border-t border-gray-200 pt-2">
                          <div className="flex justify-between text-base font-medium">
                            <span className="text-gray-900">Total</span>
                            <span className="text-gray-900">{formatCurrency(order.total_amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status History */}
                  {order.status_history.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <ClockIcon className="w-4 h-4 mr-2" />
                        Status History
                      </h4>
                      <div className="flow-root">
                        <ul className="-mb-8">
                          {order.status_history.map((history, index) => {
                            const historyStyles = getStatusHistoryStyles(history.new_status)
                            const StatusIcon = historyStyles.icon
                            return (
                              <li key={history.id}>
                                <div className="relative pb-8">
                                  {index !== order.status_history.length - 1 && (
                                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                                  )}
                                  <div className="relative flex space-x-3">
                                    <div>
                                      <span className={`h-8 w-8 rounded-full ${historyStyles.bgColor} flex items-center justify-center ring-8 ring-white`}>
                                        <StatusIcon className={`w-4 h-4 ${historyStyles.textColor}`} />
                                      </span>
                                    </div>
                                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        Status changed from{' '}
                                        <span className="font-medium text-gray-900">
                                          {history.old_status ? statusConfig[history.old_status]?.label : 'None'}
                                        </span>{' '}
                                        to{' '}
                                        <span className="font-medium text-gray-900">
                                          {statusConfig[history.new_status]?.label}
                                        </span>
                                      </p>
                                      {history.notes && (
                                        <p className="text-sm text-gray-500 mt-1">{history.notes}</p>
                                      )}
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                      <p>{history.created_at ? formatDate(history.created_at) : 'Date unavailable'}</p>
                                      <p>
                                        by {history.user_display_name} ({history.user_type})
                                      </p>
                                    </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Order not found</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}