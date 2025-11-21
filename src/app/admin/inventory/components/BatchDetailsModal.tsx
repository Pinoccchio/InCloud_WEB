'use client'

import { useState, useEffect, Fragment, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabase/auth'

interface InventoryItem {
  id: string
  product_name: string
  product_id: string
  brand_name: string
  category_name: string
}

interface BatchDetailsModalProps {
  inventoryItem: InventoryItem | null
  isOpen: boolean
  onClose: () => void
  onBatchRemoved?: () => void
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
  onClose,
  onBatchRemoved
}: BatchDetailsModalProps) {
  const [batches, setBatches] = useState<ProductBatch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removingBatchId, setRemovingBatchId] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [batchToRemove, setBatchToRemove] = useState<ProductBatch | null>(null)
  const [removalError, setRemovalError] = useState<string | null>(null)

  const { addToast } = useToast()

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

  // Handle batch removal
  const handleRemoveBatchClick = (batch: ProductBatch) => {
    setBatchToRemove(batch)
    setRemovalError(null)
    setShowConfirmDialog(true)
  }

  const handleConfirmRemoval = async () => {
    if (!batchToRemove) return

    setRemovingBatchId(batchToRemove.id)
    setRemovalError(null)

    try {
      // Get current admin user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Call RPC function to remove batch
      const { data, error } = await supabase.rpc('remove_expired_batch', {
        p_batch_id: batchToRemove.id,
        p_admin_id: user.id,
        p_reason: 'Expired product disposal'
      })

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error || 'Failed to remove batch')
      }

      // Success - show toast notification to user
      addToast({
        type: 'success',
        title: 'Batch Removed Successfully',
        message: `Successfully removed ${batchToRemove.quantity} units from batch ${batchToRemove.batch_number}`
      })

      // Reload batch data
      await loadBatchData()

      // Notify parent component to refresh inventory table
      if (onBatchRemoved) {
        onBatchRemoved()
      }

      // Close dialog
      setShowConfirmDialog(false)
      setBatchToRemove(null)
    } catch (err) {
      console.error('Error removing batch:', err)
      setRemovalError(err instanceof Error ? err.message : 'Failed to remove batch')
    } finally {
      setRemovingBatchId(null)
    }
  }

  const handleCancelRemoval = () => {
    setShowConfirmDialog(false)
    setBatchToRemove(null)
    setRemovalError(null)
  }

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price)
  }

  const calculateTotalQuantity = () => {
    return batches.reduce((total, batch) => total + batch.quantity, 0)
  }

  if (!inventoryItem) return null

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
                <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white">
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
                <div className="px-4 py-3">
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
                    <div className="space-y-4">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <p className="text-2xl font-bold text-green-900">{calculateTotalQuantity()} units</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* FIFO Priority Notice */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex">
                          <ClockIcon className="w-4 h-4 text-blue-400 mt-0.5" />
                          <div className="ml-2">
                            <p className="text-sm text-blue-700">
                              <span className="font-medium">FIFO System:</span> Batches are prioritized by expiration date (earliest first).
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Batches Table */}
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-gray-900">Inventory Batches</h4>

                        <div className="overflow-hidden rounded-lg border border-gray-200">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Batch / Priority
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Quantity
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Expiration
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Supplier
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {batches.map((batch) => (
                                <tr key={batch.id} className="hover:bg-gray-50">
                                  {/* Batch Number & Priority */}
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {batch.batch_number}
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadgeColor(batch.priority_order)}`}>
                                          #{batch.priority_order}
                                        </span>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Quantity */}
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {batch.quantity} units
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {formatPrice(Number(batch.cost_per_unit))}/unit
                                    </div>
                                  </td>

                                  {/* Expiration */}
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="space-y-1">
                                      {(batch.expiration_status === 'expired' || batch.expiration_status === 'expiring') && (
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getExpirationStatusColor(batch.expiration_status)}`}>
                                          {getExpirationIcon(batch.expiration_status)}
                                          <span className="ml-1 capitalize">
                                            {batch.expiration_status === 'expired' ? 'Expired' : 'Expiring Soon'}
                                          </span>
                                        </span>
                                      )}
                                      <div className="text-xs text-gray-500">
                                        {formatDate(batch.expiration_date)}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Supplier */}
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {batch.supplier_name || 'Unknown'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Received: {formatDate(batch.received_date)}
                                    </div>
                                  </td>

                                  {/* Actions */}
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <button
                                      onClick={() => batch.expiration_status === 'expired' ? handleRemoveBatchClick(batch) : undefined}
                                      disabled={batch.expiration_status !== 'expired' || removingBatchId !== null}
                                      className={`p-2 rounded transition-colors focus:outline-none ${
                                        batch.expiration_status === 'expired'
                                          ? 'text-red-600 hover:text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-red-500 cursor-pointer'
                                          : 'text-gray-300 cursor-not-allowed'
                                      } disabled:opacity-50`}
                                      title={
                                        batch.expiration_status === 'expired'
                                          ? 'Remove expired batch'
                                          : batch.expiration_status === 'expiring'
                                          ? 'Batch expiring soon - removal available after expiration'
                                          : 'Batch is fresh - removal available after expiration'
                                      }
                                      aria-label={`Remove batch ${batch.batch_number}`}
                                    >
                                      <TrashIcon className="w-5 h-5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
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

    {/* Confirmation Dialog for Batch Removal */}
    <Transition appear show={showConfirmDialog} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleCancelRemoval}>
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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        Remove Expired Batch?
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-3">
                          This action cannot be undone. The batch will be marked as removed and inventory will be reduced.
                        </p>
                        {batchToRemove && (
                          <div className="bg-gray-50 rounded-lg p-3 space-y-1 border border-gray-200">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-700">Batch Number:</span>
                              <span className="text-sm text-gray-900">{batchToRemove.batch_number}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-700">Product:</span>
                              <span className="text-sm text-gray-900">{inventoryItem?.product_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-700">Quantity:</span>
                              <span className="text-sm text-gray-900">{batchToRemove.quantity} units</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-700">Expired:</span>
                              <span className="text-sm text-red-600">{formatDate(batchToRemove.expiration_date)}</span>
                            </div>
                          </div>
                        )}
                        {removalError && (
                          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-700">{removalError}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
                  <button
                    type="button"
                    disabled={removingBatchId !== null}
                    onClick={handleConfirmRemoval}
                    className="inline-flex w-full justify-center items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto transition-colors"
                  >
                    {removingBatchId ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Removing...</span>
                      </>
                    ) : (
                      'Remove Batch'
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={removingBatchId !== null}
                    onClick={handleCancelRemoval}
                    className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:w-auto transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  </>
  )
}