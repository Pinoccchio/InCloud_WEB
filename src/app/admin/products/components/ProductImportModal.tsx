'use client'

import { useState, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

interface ProductImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (result: ImportResult) => void
}

interface ImportResult {
  success: boolean
  totalRows: number
  successCount: number
  errorCount: number
  duplicateCount: number
  updatedCount: number
  skippedCount: number
  errors: Array<{
    row: number
    field: string
    message: string
  }>
  createdProducts?: string[]
  updatedProducts?: string[]
  skippedProducts?: Array<{
    row: number
    name: string
    reason: string
  }>
}

export default function ProductImportModal({
  isOpen,
  onClose,
  onSuccess
}: ProductImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update' | 'fail'>('skip')

  const { admin } = useAuth()

  const handleFileSelect = (file: File) => {
    // Check MIME types - comprehensive list for better browser compatibility
    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
      'application/vnd.ms-excel',                                          // XLS
      'application/xls',                                                   // XLS alternative
      'application/x-xls',                                                 // XLS alternative
      'application/x-msexcel',                                            // XLS alternative
      'text/csv',                                                         // CSV
      'application/csv',                                                   // CSV alternative
      'text/comma-separated-values',                                       // CSV alternative
      'application/x-csv',                                                 // CSV alternative
      'text/x-csv',                                                        // CSV alternative
      'text/plain'                                                        // CSV as plain text
    ];

    // Fallback to extension check when MIME type is unreliable
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    // Accept if MIME type matches OR file extension is valid
    if (validMimeTypes.includes(file.type) || hasValidExtension) {
      setSelectedFile(file)
      setImportResult(null)
    } else {
      alert('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file')
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleImport = async () => {
    if (!selectedFile || !admin) return

    try {
      setImporting(true)

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('adminId', admin.id)
      formData.append('duplicateStrategy', duplicateStrategy)

      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import products')
      }

      setImportResult(result)

      if (result.success) {
        onSuccess(result)
      }

    } catch (error) {
      console.error('Import error:', error)
      setImportResult({
        success: false,
        totalRows: 0,
        successCount: 0,
        errorCount: 1,
        duplicateCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        errors: [{
          row: 0,
          field: 'general',
          message: error instanceof Error ? error.message : 'Import failed'
        }],
        createdProducts: [],
        updatedProducts: [],
        skippedProducts: []
      })
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setImportResult(null)
    setDragActive(false)
    onClose()
  }

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/templates?type=products')
      if (!response.ok) {
        throw new Error('Failed to download template')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'InCloud_Products_Import_Template.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Template download error:', error)
      alert('Failed to download template')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                    Import Products from Excel
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                  {!importResult ? (
                    <>
                      {/* Instructions */}
                      <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Before You Import:</h4>
                        <ul className="text-sm text-blue-900 space-y-1">
                          <li>• Download the template first to ensure correct format</li>
                          <li>• Supports Excel (.xlsx, .xls) and CSV (.csv) files</li>
                          <li>• Make sure category and brand names match existing ones exactly</li>
                          <li>• At least one pricing tier (SRP) is required</li>
                          <li>• Product names must be unique</li>
                        </ul>
                        <button
                          onClick={downloadTemplate}
                          className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-900 underline hover:no-underline"
                        >
                          Download Import Template
                        </button>
                      </div>

                      {/* File Upload Area */}
                      <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          dragActive
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                      >
                        {selectedFile ? (
                          <div className="flex items-center justify-center space-x-3">
                            <DocumentArrowUpIcon className="w-8 h-8 text-green-600" />
                            <div className="text-left">
                              <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                              <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                            </div>
                            <button
                              onClick={() => setSelectedFile(null)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              Upload Excel File
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Drag and drop your Excel file here, or click to browse
                            </p>
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                                onChange={handleFileChange}
                                className="hidden"
                              />
                              <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                Choose File
                              </span>
                            </label>
                            <p className="text-xs text-gray-500 mt-2">
                              Supports .xlsx, .xls, and .csv files
                            </p>
                          </>
                        )}
                      </div>

                      {/* Duplicate Strategy Options */}
                      {selectedFile && (
                        <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-3">Duplicate Handling Strategy</h4>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="duplicateStrategy"
                                value="skip"
                                checked={duplicateStrategy === 'skip'}
                                onChange={(e) => setDuplicateStrategy(e.target.value as 'skip' | 'update' | 'fail')}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-900">
                                <strong>Skip duplicates</strong> - Skip products that already exist (recommended)
                              </span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="duplicateStrategy"
                                value="update"
                                checked={duplicateStrategy === 'update'}
                                onChange={(e) => setDuplicateStrategy(e.target.value as 'skip' | 'update' | 'fail')}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-900">
                                <strong>Update existing</strong> - Update products that already exist with new data
                              </span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="duplicateStrategy"
                                value="fail"
                                checked={duplicateStrategy === 'fail'}
                                onChange={(e) => setDuplicateStrategy(e.target.value as 'skip' | 'update' | 'fail')}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-900">
                                <strong>Fail on duplicates</strong> - Stop import if duplicates are found
                              </span>
                            </label>
                          </div>
                          <p className="text-xs text-gray-700 mt-2">
                            Duplicates are detected by SKU, barcode, or product name
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Import Results */
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        {importResult.success ? (
                          <CheckCircleIcon className="w-6 h-6 text-green-600" />
                        ) : (
                          <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                        )}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {importResult.success ? 'Import Completed' : 'Import Failed'}
                        </h3>
                      </div>

                      {/* Statistics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">{importResult.totalRows}</div>
                          <div className="text-sm text-gray-700">Total Rows</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{importResult.successCount}</div>
                          <div className="text-sm text-green-700">Created/Updated</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{importResult.skippedCount || 0}</div>
                          <div className="text-sm text-blue-700">Skipped</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{importResult.errorCount}</div>
                          <div className="text-sm text-red-700">Errors</div>
                        </div>
                      </div>

                      {/* Detailed Results */}
                      {(importResult.duplicateCount > 0 || importResult.updatedCount > 0 || importResult.skippedCount > 0) && (
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-semibold text-blue-900 mb-3">Duplicate Handling Summary</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {importResult.duplicateCount > 0 && (
                              <div className="text-center p-2 bg-white rounded border">
                                <div className="text-lg font-bold text-blue-600">{importResult.duplicateCount}</div>
                                <div className="text-blue-700">Duplicates Found</div>
                              </div>
                            )}
                            {importResult.updatedCount > 0 && (
                              <div className="text-center p-2 bg-white rounded border">
                                <div className="text-lg font-bold text-green-600">{importResult.updatedCount}</div>
                                <div className="text-green-700">Products Updated</div>
                              </div>
                            )}
                            {importResult.skippedCount > 0 && (
                              <div className="text-center p-2 bg-white rounded border">
                                <div className="text-lg font-bold text-yellow-600">{importResult.skippedCount}</div>
                                <div className="text-yellow-700">Products Skipped</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Skipped Products Details */}
                      {importResult.skippedProducts && importResult.skippedProducts.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Skipped Products:</h4>
                          <div className="max-h-40 overflow-y-auto space-y-2">
                            {importResult.skippedProducts.map((skipped, index) => (
                              <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                <div className="font-medium text-yellow-800">Row {skipped.row}: {skipped.name}</div>
                                <div className="text-yellow-700">{skipped.reason}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Errors */}
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="max-h-60 overflow-y-auto">
                          <h4 className="font-semibold text-gray-900 mb-2">Errors Found:</h4>
                          <div className="space-y-2">
                            {importResult.errors.map((error, index) => (
                              <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="text-sm">
                                  <span className="font-semibold text-red-800">
                                    Row {error.row}
                                  </span>
                                  {error.field !== 'general' && (
                                    <span className="text-red-700"> ({error.field})</span>
                                  )}
                                  <span className="text-red-700">: {error.message}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={importing}
                  >
                    {importResult ? 'Close' : 'Cancel'}
                  </Button>

                  {!importResult && (
                    <Button
                      onClick={handleImport}
                      disabled={!selectedFile || importing}
                      isLoading={importing}
                    >
                      {importing ? 'Importing...' : 'Import Products'}
                    </Button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}