'use client'

import { useState, useEffect, Fragment, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TruckIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui'
import { supabase } from '@/lib/supabase/auth'

interface InventoryItem {
  id: string
  product_name: string
  sku: string
  brand_name: string
  category_name: string
}

interface BatchDetailsModalProps {
  inventoryItem: InventoryItem | null
  isOpen: boolean
  onClose: () => void
}

interface ProductBatch {
  id: string
  batch_number: string
  quantity: number
  received_date: string
  expiration_date: string
  cost_per_unit: number
  supplier_name: string
  supplier_info: Record<string, string | number>
  status: string
  is_active: boolean
  created_at: string
  updated_at: string
  days_until_expiration: number
  expiration_status: 'fresh' | 'expiring' | 'expired'
  priority_order: number
}

export default function BatchDetailsModal({
  inventoryItem,
  isOpen,
  onClose
}: BatchDetailsModalProps) {
  const [batches, setBatches] = useState<ProductBatch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load batch data
  const loadBatchData = useCallback(async () => {
    if (!inventoryItem?.id) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('product_batches')
        .select('*')
        .eq('inventory_id', inventoryItem.id)
        .eq('is_active', true)
        .order('expiration_date', { ascending: true })

      if (error) throw error

      // Process batches with expiration status and FIFO priority
      const processedBatches = (data || []).map((batch, index) => {
        const today = new Date()
        const expirationDate = new Date(batch.expiration_date)
        const daysUntilExpiration = Math.ceil(
          (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        let expirationStatus: 'fresh' | 'expiring' | 'expired' = 'fresh'
        if (daysUntilExpiration < 0) {
          expirationStatus = 'expired'
        } else if (daysUntilExpiration <= 7) {
          expirationStatus = 'expiring'
        }

        return {
          ...batch,
          days_until_expiration: daysUntilExpiration,
          expiration_status: expirationStatus,
          priority_order: index + 1 // FIFO order based on expiration date
        }
      })

      setBatches(processedBatches)
    } catch (err) {
      console.error('Error loading batch data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load batch data')
    } finally {
      setLoading(false)
    }
  }, [inventoryItem])

  useEffect(() => {
    if (isOpen && inventoryItem) {
      loadBatchData()
    }
  }, [isOpen, inventoryItem, loadBatchData])

  const getExpirationStatusColor = (status: string) => {
    switch (status) {
      case 'expired': return 'text-red-600 bg-red-50 border-red-200'
      case 'expiring': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getExpirationIcon = (status: string) => {
    switch (status) {
      case 'expired': return <ExclamationTriangleIcon className="w-4 h-4" />
      case 'expiring': return <ClockIcon className="w-4 h-4" />
      default: return <CheckCircleIcon className="w-4 h-4" />
    }
  }

  const getPriorityBadgeColor = (order: number) => {
    if (order === 1) return 'bg-red-100 text-red-800 border-red-200' // Highest priority (first to expire)
    if (order === 2) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (order === 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price)
  }

  const calculateTotalValue = () => {
    return batches.reduce((total, batch) => {
      return total + (batch.quantity * Number(batch.cost_per_unit))
    }, 0)
  }

  const calculateTotalQuantity = () => {
    return batches.reduce((total, batch) => total + batch.quantity, 0)
  }

  if (!inventoryItem) return null

  return (
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
          <div className="fixed inset-0 bg-black/60" />
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-white">
                  <div>
                    <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                      Batch Details - {inventoryItem.product_name}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-500">
                      FIFO inventory batches ordered by expiration date (earliest first)
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mt-0.5" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error Loading Batches</h3>
                          <p className="mt-1 text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  ) : batches.length === 0 ? (
                    <div className="text-center py-8">
                      <ArchiveBoxIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Batches</h3>
                      <p className="text-gray-500">
                        This product currently has no active inventory batches.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <ArchiveBoxIcon className="w-8 h-8 text-blue-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-blue-900">Total Batches</p>
                              <p className="text-2xl font-bold text-blue-900">{batches.length}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <ArchiveBoxIcon className="w-8 h-8 text-green-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-green-900">Total Quantity</p>
                              <p className="text-2xl font-bold text-green-900">{calculateTotalQuantity()}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="w-8 h-8 text-purple-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-purple-900">Total Value</p>
                              <p className="text-2xl font-bold text-purple-900">
                                {formatPrice(calculateTotalValue())}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* FIFO Priority Notice */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex">
                          <ClockIcon className="w-5 h-5 text-blue-400 mt-0.5" />
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">FIFO (First-In-First-Out) System</h3>
                            <p className="mt-1 text-sm text-blue-700">
                              Batches are automatically prioritized by expiration date. Products from earlier expiring batches
                              will be used first in order fulfillment to minimize waste.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Batches List */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900">Inventory Batches</h4>

                        <div className="space-y-3">
                          {batches.map((batch) => (
                            <div
                              key={batch.id}
                              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                  {/* Batch Info */}
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <h5 className="text-sm font-semibold text-gray-900">
                                        {batch.batch_number}
                                      </h5>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadgeColor(batch.priority_order)}`}>
                                        Priority #{batch.priority_order}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-500">Quantity: {batch.quantity} units</p>
                                    <p className="text-sm text-gray-500">
                                      Value: {formatPrice(batch.quantity * Number(batch.cost_per_unit))}
                                    </p>
                                  </div>

                                  {/* Expiration Status */}
                                  <div className="space-y-1">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getExpirationStatusColor(batch.expiration_status)}`}>
                                      {getExpirationIcon(batch.expiration_status)}
                                      <span className="ml-1 capitalize">
                                        {batch.expiration_status === 'expired' ? 'Expired' :
                                         batch.expiration_status === 'expiring' ? 'Expiring Soon' : 'Fresh'}
                                      </span>
                                    </span>
                                    <p className="text-sm text-gray-600">
                                      Expires: {formatDate(batch.expiration_date)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {batch.days_until_expiration >= 0
                                        ? `${batch.days_until_expiration} days remaining`
                                        : `Expired ${Math.abs(batch.days_until_expiration)} days ago`
                                      }
                                    </p>
                                  </div>

                                  {/* Supplier Info */}
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium text-gray-900 flex items-center">
                                      <TruckIcon className="w-4 h-4 mr-1" />
                                      {batch.supplier_name || 'Unknown Supplier'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Cost: {formatPrice(Number(batch.cost_per_unit))} per unit
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Received: {formatDate(batch.received_date)}
                                    </p>
                                  </div>

                                  {/* Timestamps */}
                                  <div className="space-y-1">
                                    <p className="text-xs text-gray-500 flex items-center">
                                      <CalendarIcon className="w-3 h-3 mr-1" />
                                      Created: {formatDateTime(batch.created_at)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Updated: {formatDateTime(batch.updated_at)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Status: <span className="capitalize font-medium">{batch.status}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Additional Supplier Info */}
                              {batch.supplier_info && Object.keys(batch.supplier_info).length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <p className="text-xs font-medium text-gray-500 mb-2">Additional Supplier Information:</p>
                                  <div className="text-xs text-gray-400 space-y-1">
                                    {Object.entries(batch.supplier_info).map(([key, value]) => (
                                      <p key={key}>
                                        <span className="capitalize font-medium">{key}:</span> {String(value)}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}