'use client'

import { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Button, LoadingSpinner, ConfirmDialog } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import {
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  ClockIcon,
  BuildingStorefrontIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface OrderItem {
  id: string
  product_name: string
  sku: string
  quantity: number
  unit_cost: number
  total_cost: number
  expected_expiration_date?: string
  batch_number?: string
  received_quantity: number
}

interface StatusHistoryEntry {
  id: string
  old_status: string | null
  new_status: string
  changed_by_name: string
  notes: string
  created_at: string
}

interface SupplierOrderDetails {
  id: string
  order_number: string
  supplier_name: string
  supplier_contact?: string
  supplier_email?: string
  branch_name: string
  created_by_name: string
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled'
  order_date: string
  expected_delivery_date?: string
  actual_delivery_date?: string
  subtotal: number
  shipping_cost: number
  total_amount: number
  payment_terms?: string
  payment_status: string
  notes?: string
  items: OrderItem[]
  status_history: StatusHistoryEntry[]
}

interface SupplierOrderDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string | null
  onStatusUpdate: () => void
}

export function SupplierOrderDetailsModal({
  isOpen,
  onClose,
  orderId,
  onStatusUpdate
}: SupplierOrderDetailsModalProps) {
  const { session } = useAuth()
  const { addToast } = useToast()
  const [order, setOrder] = useState<SupplierOrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails()
    }
  }, [isOpen, orderId])

  const fetchOrderDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/supplier-orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch order details')
      }

      const data = await response.json()
      setOrder(data.data)
    } catch (error) {
      console.error('Error fetching order details:', error)
      addToast({
        type: 'error',
        title: 'Failed to Load Order Details',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!order) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/supplier-orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update status')
      }

      const data = await response.json()
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: `Order status updated to ${newStatus.toUpperCase().replace('_', ' ')}`
      })

      await fetchOrderDetails()
      onStatusUpdate()
    } catch (error) {
      console.error('Error updating status:', error)
      addToast({
        type: 'error',
        title: 'Failed to Update Status',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setUpdating(false)
    }
  }

  const cancelOrder = async () => {
    if (!order) return

    setCancelling(true)
    try {
      const response = await fetch(`/api/supplier-orders/${order.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ notes: 'Order cancelled by admin' })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel order')
      }

      const data = await response.json()
      addToast({
        type: 'success',
        title: 'Order Cancelled',
        message: `Supplier order ${order.order_number} has been cancelled`
      })

      await fetchOrderDetails()
      onStatusUpdate()
      setShowCancelDialog(false)
    } catch (error) {
      console.error('Error cancelling order:', error)
      addToast({
        type: 'error',
        title: 'Failed to Cancel Order',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setCancelling(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'in_transit':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return 'confirmed'
      case 'confirmed':
        return 'in_transit'
      case 'in_transit':
        return 'delivered'
      default:
        return null
    }
  }

  const getNextStatusLabel = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return 'Confirm Order'
      case 'confirmed':
        return 'Mark In Transit'
      case 'in_transit':
        return 'Mark Delivered'
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return `₱${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <>
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    {order ? `Supplier Order: ${order.order_number}` : 'Order Details'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : order ? (
                    <div className="space-y-6">
          {/* Status Banner */}
          <div className={`p-4 rounded-lg ${getStatusColor(order.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {order.status === 'pending' && <ClockIcon className="h-6 w-6" />}
                {order.status === 'confirmed' && <CheckCircleIcon className="h-6 w-6" />}
                {order.status === 'in_transit' && <TruckIcon className="h-6 w-6" />}
                {order.status === 'delivered' && <BuildingStorefrontIcon className="h-6 w-6" />}
                {order.status === 'cancelled' && <XCircleIcon className="h-6 w-6" />}
                <div>
                  <div className="font-semibold">
                    {order.status.toUpperCase().replace('_', ' ')}
                  </div>
                  <div className="text-sm opacity-80">
                    {order.status === 'delivered' && order.actual_delivery_date
                      ? `Delivered on ${formatDate(order.actual_delivery_date)}`
                      : order.expected_delivery_date
                      ? `Expected: ${formatDate(order.expected_delivery_date)}`
                      : 'No delivery date set'}
                  </div>
                </div>
              </div>
              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                <div className="flex gap-2">
                  {getNextStatus(order.status) && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(getNextStatus(order.status)!)}
                      disabled={updating}
                    >
                      {updating ? 'Updating...' : getNextStatusLabel(order.status)}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={updating}
                    className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-700"
                  >
                    Cancel Order
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Supplier & Order Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-gray-900">Supplier Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-900">Name:</span>
                  <div className="font-medium text-gray-900">{order.supplier_name}</div>
                </div>
                {order.supplier_contact && (
                  <div>
                    <span className="text-gray-900">Contact:</span>
                    <div className="font-medium text-gray-900">{order.supplier_contact}</div>
                  </div>
                )}
                {order.supplier_email && (
                  <div>
                    <span className="text-gray-900">Email:</span>
                    <div className="font-medium text-gray-900">{order.supplier_email}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-gray-900">Order Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-900">Branch:</span>
                  <div className="font-medium text-gray-900">{order.branch_name}</div>
                </div>
                <div>
                  <span className="text-gray-900">Created By:</span>
                  <div className="font-medium text-gray-900">{order.created_by_name}</div>
                </div>
                <div>
                  <span className="text-gray-900">Order Date:</span>
                  <div className="font-medium text-gray-900">{formatDate(order.order_date)}</div>
                </div>
                {order.payment_terms && (
                  <div>
                    <span className="text-gray-900">Payment Terms:</span>
                    <div className="font-medium text-gray-900">{order.payment_terms}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-900">{order.notes}</p>
            </div>
          )}

          {/* Order Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase">
                      Unit Cost
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.product_name}
                        {item.batch_number && (
                          <div className="text-xs text-gray-900">Batch: {item.batch_number}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.sku}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(item.unit_cost)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.total_cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      Subtotal:
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(order.subtotal)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      Shipping:
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(order.shipping_cost)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      Total Amount:
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600 text-right">
                      {formatCurrency(order.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Status History */}
          {order.status_history.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Status History</h3>
              <div className="space-y-2">
                {order.status_history.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.old_status ? (
                          <>
                            {entry.old_status.toUpperCase()} → {entry.new_status.toUpperCase()}
                          </>
                        ) : (
                          entry.new_status.toUpperCase()
                        )}
                      </div>
                      <div className="text-xs text-gray-900 mt-1">
                        by {entry.changed_by_name} • {formatDate(entry.created_at)}
                      </div>
                      {entry.notes && (
                        <div className="text-sm text-gray-900 mt-1">{entry.notes}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-900">
                      Failed to load order details
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={onClose}>
                      Close
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>

    {/* Cancel Order Confirmation Dialog - Outside parent Dialog */}
    <ConfirmDialog
      isOpen={showCancelDialog}
      onClose={() => setShowCancelDialog(false)}
      onConfirm={cancelOrder}
      title="Cancel Supplier Order"
      message={`Are you sure you want to cancel supplier order ${order?.order_number}? This action cannot be undone.`}
      confirmText="Yes, Cancel Order"
      cancelText="No, Keep Order"
      type="danger"
      isLoading={cancelling}
    />
  </>
  )
}
