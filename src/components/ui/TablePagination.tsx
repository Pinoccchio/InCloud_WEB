'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { Button } from './Button'

interface TablePaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  itemLabel: string
  onPageChange: (page: number) => void
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  itemLabel,
  onPageChange
}: TablePaginationProps) {
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
      <div className="text-sm text-gray-700">
        Showing <span className="font-medium">{startItem}</span>-
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{totalItems}</span> {itemLabel}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-700">
          Page <span className="font-medium">{currentPage}</span> of{' '}
          <span className="font-medium">{totalPages}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1"
        >
          Next
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
