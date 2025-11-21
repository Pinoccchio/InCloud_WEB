'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'

interface GenerateReportModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (options: ReportGenerationOptions) => Promise<void>
  currentDateRange: {
    startDate?: string
    endDate?: string
  }
}

export interface ReportGenerationOptions {
  startDate?: string
  endDate?: string
  includeAI: boolean
}

export default function GenerateReportModal({
  isOpen,
  onClose,
  onGenerate,
  currentDateRange,
}: GenerateReportModalProps) {
  const [includeAI, setIncludeAI] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    try {
      setError(null)
      setIsGenerating(true)

      const options: ReportGenerationOptions = {
        startDate: currentDateRange.startDate,
        endDate: currentDateRange.endDate,
        includeAI,
      }

      await onGenerate(options)

      // Close modal on success
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const getDateRangeText = () => {
    if (currentDateRange.startDate && currentDateRange.endDate) {
      return `${formatDate(currentDateRange.startDate)} - ${formatDate(currentDateRange.endDate)}`
    } else if (currentDateRange.startDate) {
      return `From ${formatDate(currentDateRange.startDate)}`
    } else if (currentDateRange.endDate) {
      return `Until ${formatDate(currentDateRange.endDate)}`
    }
    return 'All Time'
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

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
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <DocumentArrowDownIcon className="w-6 h-6 text-blue-600" />
                    Generate Analytics Report
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    disabled={isGenerating}
                    className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="mt-4 space-y-4">
                  {/* Date Range Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Report Period</h4>
                    <p className="text-sm text-blue-700">{getDateRangeText()}</p>
                  </div>

                  {/* Include AI Toggle */}
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="includeAI"
                        type="checkbox"
                        checked={includeAI}
                        onChange={(e) => setIncludeAI(e.target.checked)}
                        disabled={isGenerating}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="includeAI" className="font-medium text-gray-900">
                        Include AI-Powered Insights
                      </label>
                      <p className="text-gray-500 text-xs mt-1">
                        Add prescriptive recommendations and AI analysis to the report
                      </p>
                    </div>
                  </div>

                  {/* Report Contents Preview */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Report Will Include:</h4>
                    <ul className="text-sm text-gray-600 space-y-1.5">
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">✓</span>
                        <span>Executive Summary & Key Metrics</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">✓</span>
                        <span>Sales Performance Charts</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">✓</span>
                        <span>Brand Performance Analysis</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">✓</span>
                        <span>Expiration Alerts & Low Stock Products</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">✓</span>
                        <span>Pricing Tier Breakdown</span>
                      </li>
                      {includeAI && (
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">✓</span>
                          <span className="font-medium">AI-Powered Recommendations</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isGenerating}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <DocumentArrowDownIcon className="w-4 h-4" />
                        Generate PDF Report
                      </>
                    )}
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
