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
  DocumentTextIcon,
  PhotoIcon,
  EyeIcon,
  CreditCardIcon,
  MapPinIcon,
  CurrencyDollarIcon
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
  address: {
    street?: string
    barangay?: string
    city?: string
    province?: string
    postal_code?: string
    notes?: string
  } | null
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
  total_amount: number
  notes: string | null
  delivery_address: Record<string, unknown> | null
  payment_method: string | null
  gcash_reference_number: string | null
  proof_of_payment_url: string | null
  proof_of_payment_status: string | null
  proof_submitted_at: string | null
  proof_reviewed_by: string | null
  proof_reviewed_at: string | null
  proof_rejection_reason: string | null
  cancellation_reason: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  customer: CustomerData
  branch: BranchData
  order_items: Array<{
    id: string
    quantity: number
    unit_price: number
    total_price: number
    pricing_type: PricingTier
    fulfillment_status: string | null
    product: {
      id: string
      name: string
      product_id: string | null
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
  price_history: Array<{
    id: string
    created_at: string
    old_total_amount: number
    new_total_amount: number
    old_discount_amount: number
    new_discount_amount: number
    adjustment_reason: string
    admin_name: string
    amount_change: number
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
  const [showProofFullscreen, setShowProofFullscreen] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processingProof, setProcessingProof] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancellingOrder, setCancellingOrder] = useState(false)
  // Price editing state
  const [showPriceEditModal, setShowPriceEditModal] = useState(false)
  const [editingPrice, setEditingPrice] = useState({
    subtotal: 0,
    discountAmount: 0,
    totalAmount: 0,
    reason: ''
  })
  const [updatingPrice, setUpdatingPrice] = useState(false)
  const [priceError, setPriceError] = useState('')
  const { addToast} = useToast()

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
            customer_type,
            address
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
            pricing_type,
            fulfillment_status,
            products!inner(
              id,
              name,
              product_id,
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

      // Fetch price edit history from the view
      const { data: priceHistory, error: priceHistoryError } = await supabase
        .from('order_price_edit_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })

      if (priceHistoryError) {
        console.warn('Could not fetch price history:', priceHistoryError)
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
        total_amount: orderData.total_amount,
        notes: orderData.notes,
        delivery_address: processDeliveryAddress(orderData.delivery_address),
        payment_method: orderData.payment_method || null,
        gcash_reference_number: orderData.gcash_reference_number || null,
        proof_of_payment_url: orderData.proof_of_payment_url || null,
        proof_of_payment_status: orderData.proof_of_payment_status || null,
        proof_submitted_at: orderData.proof_submitted_at || null,
        proof_reviewed_by: orderData.proof_reviewed_by || null,
        proof_reviewed_at: orderData.proof_reviewed_at || null,
        proof_rejection_reason: orderData.proof_rejection_reason || null,
        cancellation_reason: orderData.cancellation_reason || null,
        cancelled_at: orderData.cancelled_at || null,
        cancelled_by: orderData.cancelled_by || null,
        customer: orderData.customers,
        branch: orderData.branches,
        order_items: orderData.order_items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          pricing_type: item.pricing_type,
          fulfillment_status: item.fulfillment_status,
          product: {
            id: item.products.id,
            name: item.products.name,
            product_id: item.products.product_id,
            unit_of_measure: item.products.unit_of_measure,
            images: processProductImages(item.products.images)
          }
        })),
        status_history: processedHistory,
        price_history: priceHistory || []
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

  // Update order status with proper error handling using secure RPC function
  const updateOrderStatus = async (newStatus: OrderStatus) => {
    if (!order) return

    try {
      setUpdating(true)

      const { data: adminData } = await supabase.auth.getUser()
      if (!adminData.user) throw new Error('Not authenticated')

      // Call the secure RPC function to update order status
      const { data: result, error: rpcError } = await supabase.rpc('admin_update_order_status', {
        p_order_id: order.id,
        p_new_status: newStatus,
        p_notes: statusNotes.trim() || `Status updated to ${statusConfig[newStatus].label}`
      })

      if (rpcError) {
        console.error('RPC error updating order status:', rpcError)
        throw new Error(`Failed to update order: ${rpcError.message || 'Unknown database error'}`)
      }

      // Check the result from the RPC function
      if (result && !result.success) {
        throw new Error(result.error || 'Failed to update order status')
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

  // Approve proof of payment
  const approveProofOfPayment = async () => {
    if (!order) return

    try {
      setProcessingProof(true)

      const { data: adminData } = await supabase.auth.getUser()
      if (!adminData.user) throw new Error('Not authenticated')

      // Get admin ID from admins table (not auth user ID)
      const { data: adminProfile, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', adminData.user.id)
        .single()

      if (adminError || !adminProfile) {
        throw new Error('Admin profile not found')
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          proof_of_payment_status: 'approved',
          proof_reviewed_by: adminProfile.id,
          proof_reviewed_at: new Date().toISOString(),
          proof_rejection_reason: null,
          payment_status: 'paid' // Automatically mark as paid when proof is approved
        })
        .eq('id', order.id)

      if (updateError) throw updateError

      addToast({
        type: 'success',
        title: 'Proof of Payment Approved',
        message: 'The proof of payment has been approved and payment status updated.'
      })

      await fetchOrderDetails()
    } catch (err) {
      console.error('Error approving proof of payment:', err)
      addToast({
        type: 'error',
        title: 'Failed to approve payment',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      })
    } finally {
      setProcessingProof(false)
    }
  }

  // Reject proof of payment
  const rejectProofOfPayment = async () => {
    if (!order || !rejectionReason.trim()) {
      addToast({
        type: 'error',
        title: 'Rejection reason required',
        message: 'Please provide a reason for rejecting the proof of payment.'
      })
      return
    }

    try {
      setProcessingProof(true)

      const { data: adminData } = await supabase.auth.getUser()
      if (!adminData.user) throw new Error('Not authenticated')

      // Get admin ID from admins table (not auth user ID)
      const { data: adminProfile, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', adminData.user.id)
        .single()

      if (adminError || !adminProfile) {
        throw new Error('Admin profile not found')
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          proof_of_payment_status: 'rejected',
          proof_reviewed_by: adminProfile.id,
          proof_reviewed_at: new Date().toISOString(),
          proof_rejection_reason: rejectionReason.trim()
        })
        .eq('id', order.id)

      if (updateError) throw updateError

      addToast({
        type: 'success',
        title: 'Proof of Payment Rejected',
        message: 'The customer will be notified to submit a new proof of payment.'
      })

      setShowRejectModal(false)
      setRejectionReason('')
      await fetchOrderDetails()
    } catch (err) {
      console.error('Error rejecting proof of payment:', err)
      addToast({
        type: 'error',
        title: 'Failed to reject payment',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      })
    } finally {
      setProcessingProof(false)
    }
  }

  // Cancel order
  const cancelOrder = async () => {
    if (!order || !cancellationReason.trim()) {
      addToast({
        type: 'error',
        title: 'Cancellation reason required',
        message: 'Please provide a reason for cancelling this order.'
      })
      return
    }

    try {
      setCancellingOrder(true)

      const { data: adminData } = await supabase.auth.getUser()
      if (!adminData.user) throw new Error('Not authenticated')

      // Get admin ID from profiles/admins table
      const { data: adminProfile, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', adminData.user.id)
        .single()

      if (adminError || !adminProfile) {
        throw new Error('Admin profile not found')
      }

      // Update order to cancelled status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancellation_reason: cancellationReason.trim(),
          cancelled_at: new Date().toISOString(),
          cancelled_by: adminProfile.id,
          payment_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (updateError) {
        console.error('Order cancellation error details:', updateError)
        throw new Error(`Failed to cancel order: ${updateError.message || 'Unknown database error'}`)
      }

      addToast({
        type: 'success',
        title: 'Order Cancelled',
        message: 'The order has been successfully cancelled.'
      })

      setShowCancelModal(false)
      setCancellationReason('')
      await fetchOrderDetails()

    } catch (err) {
      console.error('Error cancelling order:', err)
      addToast({
        type: 'error',
        title: 'Failed to cancel order',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      })
    } finally {
      setCancellingOrder(false)
    }
  }

  // Price editing functions
  const updateOrderPrice = async () => {
    if (!order) return

    // Validation
    if (!editingPrice.reason.trim()) {
      setPriceError('Please provide a reason for the price adjustment')
      return
    }

    if (editingPrice.totalAmount < 0) {
      setPriceError('Total amount cannot be negative')
      return
    }

    if (editingPrice.discountAmount < 0) {
      setPriceError('Discount amount cannot be negative')
      return
    }

    try {
      setUpdatingPrice(true)
      setPriceError('')

      // Check authentication
      const { data: adminData } = await supabase.auth.getUser()
      if (!adminData.user) {
        throw new Error('Not authenticated')
      }

      // Call RPC function
      const { data: result, error: rpcError } = await supabase.rpc(
        'admin_update_order_price',
        {
          p_order_id: order.id,
          p_new_total_amount: editingPrice.totalAmount,
          p_new_discount_amount: editingPrice.discountAmount,
          p_adjustment_reason: editingPrice.reason.trim()
        }
      )

      if (rpcError) {
        throw new Error(rpcError.message)
      }

      if (result && !result.success) {
        throw new Error(result.error || 'Failed to update price')
      }

      // Success!
      addToast({
        type: 'success',
        title: 'Order Price Updated',
        message: `Total changed to ${formatCurrency(editingPrice.totalAmount)}`
      })

      // Close modal and refresh
      setShowPriceEditModal(false)
      setEditingPrice({ subtotal: 0, discountAmount: 0, totalAmount: 0, reason: '' })
      await fetchOrderDetails()

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setPriceError(errorMessage)

      addToast({
        type: 'error',
        title: 'Failed to Update Price',
        message: errorMessage
      })
    } finally {
      setUpdatingPrice(false)
    }
  }

  const openPriceEditModal = () => {
    if (!order) return

    setEditingPrice({
      subtotal: order.subtotal,
      discountAmount: order.discount_amount || 0,
      totalAmount: order.total_amount,
      reason: ''
    })
    setPriceError('')
    setShowPriceEditModal(true)
  }

  const calculateNewTotal = (discount: number) => {
    const subtotal = editingPrice.subtotal
    const newTotal = Math.max(0, subtotal - discount)
    setEditingPrice(prev => ({ ...prev, discountAmount: discount, totalAmount: newTotal }))
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

  const canCancelOrder = () => {
    // Orders can be cancelled if they're not already delivered, cancelled, or returned
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
                          {canCancelOrder() && (
                            <Button
                              onClick={() => setShowCancelModal(true)}
                              disabled={updating || cancellingOrder}
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                              Cancel Order
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

                  {/* Cancellation Information */}
                  {order.status === 'cancelled' && order.cancellation_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-red-900 mb-2 flex items-center">
                        <XMarkIcon className="w-4 h-4 mr-2" />
                        Order Cancellation Details
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-red-800">Reason</p>
                          <p className="text-sm text-red-700 mt-1">{order.cancellation_reason}</p>
                        </div>
                        {order.cancelled_at && (
                          <div>
                            <p className="text-sm font-medium text-red-800">Cancelled At</p>
                            <p className="text-sm text-red-700">{formatDate(order.cancelled_at)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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

                  {/* Customer Address */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-2" />
                      Customer Registered Address
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {order.customer.address ? (
                        <div className="space-y-2 text-sm text-gray-700">
                          {order.customer.address.street && (
                            <p className="font-medium text-gray-900">{order.customer.address.street}</p>
                          )}
                          {order.customer.address.barangay && (
                            <p>{order.customer.address.barangay}</p>
                          )}
                          <p>
                            {order.customer.address.city || 'Manila'}
                            {order.customer.address.province && `, ${order.customer.address.province}`}
                          </p>
                          {order.customer.address.postal_code && (
                            <p className="text-gray-500">Postal Code: {order.customer.address.postal_code}</p>
                          )}
                          {order.customer.address.notes && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-medium text-gray-600 mb-1">Delivery Notes:</p>
                              <p className="italic text-gray-600">{order.customer.address.notes}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          Customer has not provided a registered address
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <CreditCardIcon className="w-4 h-4 mr-2" />
                      Payment Information
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-3">
                        {/* Payment Method */}
                        <div>
                          <p className="text-sm font-medium text-gray-700">Payment Method</p>
                          <div className="mt-2">
                            {order.payment_method === 'online_payment' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                <CheckCircleIcon className="w-4 h-4 mr-2" />
                                Online Payment (GCash)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                <TruckIcon className="w-4 h-4 mr-2" />
                                Cash on Delivery
                              </span>
                            )}
                          </div>
                        </div>

                        {/* GCash Reference (conditional - only for online payment) */}
                        {order.payment_method === 'online_payment' && order.gcash_reference_number && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">GCash Reference Number</p>
                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <code className="text-sm font-mono font-semibold text-green-800">
                                {order.gcash_reference_number}
                              </code>
                            </div>
                            <p className="mt-2 text-xs text-gray-500 italic">
                              Use this reference to verify payment in GCash transaction history
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Proof of Payment */}
                  {order.proof_of_payment_url && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <PhotoIcon className="w-4 h-4 mr-2" />
                        Proof of Payment
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Payment Image Preview */}
                          <div className="flex-shrink-0">
                            <div className="relative w-full md:w-48 h-48 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                              <Image
                                src={order.proof_of_payment_url}
                                alt="Proof of Payment"
                                fill
                                className="object-contain"
                              />
                              <button
                                onClick={() => setShowProofFullscreen(true)}
                                className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center group"
                              >
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-2">
                                  <EyeIcon className="w-6 h-6 text-gray-900" />
                                </div>
                              </button>
                            </div>
                            <button
                              onClick={() => setShowProofFullscreen(true)}
                              className="mt-2 w-full text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              View Full Size
                            </button>
                          </div>

                          {/* Payment Details */}
                          <div className="flex-1 space-y-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Status</p>
                              <div className="mt-1">
                                {order.proof_of_payment_status === 'approved' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                                    Approved
                                  </span>
                                )}
                                {order.proof_of_payment_status === 'pending' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <ClockIcon className="w-3 h-3 mr-1" />
                                    Pending Review
                                  </span>
                                )}
                                {order.proof_of_payment_status === 'rejected' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <XMarkIcon className="w-3 h-3 mr-1" />
                                    Rejected
                                  </span>
                                )}
                                {!order.proof_of_payment_status && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Not Submitted
                                  </span>
                                )}
                              </div>
                            </div>

                            {order.proof_submitted_at && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">Submitted</p>
                                <p className="text-sm text-gray-600">{formatDate(order.proof_submitted_at)}</p>
                              </div>
                            )}

                            {order.proof_reviewed_at && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">Reviewed</p>
                                <p className="text-sm text-gray-600">{formatDate(order.proof_reviewed_at)}</p>
                              </div>
                            )}

                            {order.proof_rejection_reason && (
                              <div className="pt-2 border-t border-gray-200">
                                <p className="text-sm font-medium text-red-700">Rejection Reason</p>
                                <p className="text-sm text-gray-700 mt-1">{order.proof_rejection_reason}</p>
                              </div>
                            )}

                            {/* Action Buttons for Pending Proofs */}
                            {order.proof_of_payment_status === 'pending' && (
                              <div className="pt-3 border-t border-gray-200">
                                <p className="text-sm font-medium text-gray-700 mb-2">Review Actions</p>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={approveProofOfPayment}
                                    disabled={processingProof}
                                    size="sm"
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {processingProof ? 'Processing...' : 'Approve Payment'}
                                  </Button>
                                  <Button
                                    onClick={() => setShowRejectModal(true)}
                                    disabled={processingProof}
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                                  >
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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
                                      {item.product.product_id && (
                                        <p className="text-sm text-gray-500">Product ID: {item.product.product_id}</p>
                                      )}
                                      <p className="text-sm text-gray-500">
                                        {item.quantity} {item.product.unit_of_measure || 'units'} • {item.pricing_type.toUpperCase()} Price
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
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900">Order Summary</h4>
                      {order.status !== 'delivered' && order.status !== 'returned' && (
                        <button
                          onClick={openPriceEditModal}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium
                                   flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Edit Price
                        </button>
                      )}
                    </div>
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
                        <div className="border-t border-gray-200 pt-2">
                          <div className="flex justify-between text-base font-medium">
                            <span className="text-gray-900">Total</span>
                            <span className="text-gray-900">{formatCurrency(order.total_amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price Adjustment History */}
                  {order.price_history.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                        Price Adjustment History
                      </h4>
                      <div className="flow-root">
                        <ul className="-mb-8">
                          {order.price_history.map((history, index) => {
                            const isIncrease = history.amount_change < 0 // Negative change means increase
                            const changeAmount = Math.abs(history.amount_change)

                            return (
                              <li key={history.id}>
                                <div className="relative pb-8">
                                  {index !== order.price_history.length - 1 && (
                                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                                  )}
                                  <div className="relative flex space-x-3">
                                    <div>
                                      <span className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center ring-8 ring-white">
                                        <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          Price adjusted from{' '}
                                          <span className="font-medium text-gray-900">
                                            {formatCurrency(history.old_total_amount)}
                                          </span>{' '}
                                          to{' '}
                                          <span className="font-medium text-gray-900">
                                            {formatCurrency(history.new_total_amount)}
                                          </span>
                                          {changeAmount > 0 && (
                                            <span className={`ml-2 text-xs font-medium ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                                              ({isIncrease ? '+' : '-'}{formatCurrency(changeAmount)})
                                            </span>
                                          )}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                          Discount: {formatCurrency(history.old_discount_amount || 0)} → {formatCurrency(history.new_discount_amount)}
                                        </p>
                                        {history.adjustment_reason && (
                                          <p className="text-sm text-gray-600 mt-2 italic">
                                            "{history.adjustment_reason}"
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                        <p>{formatDate(history.created_at)}</p>
                                        <p>by {history.admin_name}</p>
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

      {/* Fullscreen Proof of Payment Modal */}
      <Dialog open={showProofFullscreen} onClose={() => setShowProofFullscreen(false)} className="relative z-[60]">
        <div className="fixed inset-0 bg-black/90" onClick={() => setShowProofFullscreen(false)} />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="relative w-full max-w-5xl">
              {/* Close Button */}
              <button
                onClick={() => setShowProofFullscreen(false)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="w-8 h-8" />
              </button>

              {/* Full Size Image */}
              {order?.proof_of_payment_url && (
                <div className="relative w-full bg-white rounded-lg overflow-hidden shadow-2xl" style={{ minHeight: '500px', maxHeight: '80vh' }}>
                  <Image
                    src={order.proof_of_payment_url}
                    alt="Proof of Payment - Full Size"
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              {/* Image Info */}
              <div className="mt-4 text-center text-white text-sm">
                <p>Proof of Payment for Order {order?.order_number}</p>
                {order?.proof_submitted_at && (
                  <p className="text-gray-300 mt-1">
                    Submitted on {order.proof_submitted_at ? formatDate(order.proof_submitted_at) : 'N/A'}
                  </p>
                )}
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Rejection Reason Modal */}
      <Dialog open={showRejectModal} onClose={() => !processingProof && setShowRejectModal(false)} className="relative z-[60]">
        <div className="fixed inset-0 bg-black/25" />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <DialogTitle className="text-lg font-medium text-gray-900">
                  Reject Proof of Payment
                </DialogTitle>
                <button
                  onClick={() => !processingProof && setShowRejectModal(false)}
                  disabled={processingProof}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-4">
                <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Please provide a clear reason why the proof of payment is being rejected..."
                  disabled={processingProof}
                />
                <p className="mt-2 text-sm text-gray-600">
                  The customer will see this message and be able to submit a new proof of payment.
                </p>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectModal(false)}
                  disabled={processingProof}
                >
                  Cancel
                </Button>
                <Button
                  onClick={rejectProofOfPayment}
                  disabled={processingProof || !rejectionReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {processingProof ? 'Rejecting...' : 'Reject Payment'}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Order Cancellation Modal */}
      <Dialog open={showCancelModal} onClose={() => !cancellingOrder && setShowCancelModal(false)} className="relative z-[60]">
        <div className="fixed inset-0 bg-black/25" />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <DialogTitle className="text-lg font-medium text-gray-900">
                  Cancel Order
                </DialogTitle>
                <button
                  onClick={() => !cancellingOrder && setShowCancelModal(false)}
                  disabled={cancellingOrder}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-2 mb-6">
                <p className="text-sm text-gray-600">
                  You are about to cancel order <span className="font-semibold">{order?.order_number}</span>.
                  This action will mark the order as cancelled and notify the customer.
                </p>
              </div>

              <div className="mt-4">
                <label htmlFor="cancellation-reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Cancellation *
                </label>
                <textarea
                  id="cancellation-reason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows={4}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Please provide a clear reason for cancelling this order..."
                  disabled={cancellingOrder}
                />
                <p className="mt-2 text-sm text-gray-600">
                  The customer will see this cancellation reason in their order history.
                </p>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancellingOrder}
                >
                  Keep Order
                </Button>
                <Button
                  onClick={cancelOrder}
                  disabled={cancellingOrder || !cancellationReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {cancellingOrder ? 'Cancelling...' : 'Cancel Order'}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Price Edit Modal */}
      <Dialog open={showPriceEditModal} onClose={() => !updatingPrice && setShowPriceEditModal(false)} className="relative z-[60]">
        <div className="fixed inset-0 bg-black/25" />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <DialogTitle className="text-lg font-medium text-gray-900">
                  Edit Order Price
                </DialogTitle>
                <button
                  onClick={() => !updatingPrice && setShowPriceEditModal(false)}
                  disabled={updatingPrice}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Current Values */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Current Subtotal:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(order?.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Current Discount:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(order?.discount_amount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Total:</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(order?.total_amount || 0)}</span>
                </div>
              </div>

              {/* Discount Input */}
              <div className="mb-4">
                <label htmlFor="discount-amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Amount
                </label>
                <input
                  type="number"
                  id="discount-amount"
                  value={editingPrice.discountAmount === 0 ? '' : editingPrice.discountAmount}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                    if (!isNaN(value)) {
                      calculateNewTotal(value)
                    }
                  }}
                  min="0"
                  max={editingPrice.subtotal}
                  step="0.01"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  disabled={updatingPrice}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum: {formatCurrency(editingPrice.subtotal)}
                </p>
              </div>

              {/* New Total Preview */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">New Total:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(editingPrice.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Reason Input */}
              <div className="mb-4">
                <label htmlFor="price-adjustment-reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Price Adjustment *
                </label>
                <textarea
                  id="price-adjustment-reason"
                  value={editingPrice.reason}
                  onChange={(e) => setEditingPrice(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Customer loyalty discount, Damaged goods compensation, Promotional offer..."
                  disabled={updatingPrice}
                />
                <p className="mt-2 text-xs text-gray-600">
                  This reason will be logged in the audit trail for record-keeping.
                </p>
              </div>

              {/* Error Display */}
              {priceError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{priceError}</p>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPriceEditModal(false)
                    setPriceError('')
                  }}
                  disabled={updatingPrice}
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateOrderPrice}
                  disabled={updatingPrice || !editingPrice.reason.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updatingPrice ? 'Updating...' : 'Update Price'}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </Dialog>
  )
}