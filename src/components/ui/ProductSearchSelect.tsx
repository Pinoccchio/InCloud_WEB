'use client'

import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import {
  CheckIcon,
  ChevronUpDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface ProductSearchOption {
  value: string
  label: string
  description?: string
  meta?: string
  searchText?: string
}

interface ProductSearchSelectProps {
  label?: string
  value: string
  options: ProductSearchOption[]
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  error?: string
  disabled?: boolean
  required?: boolean
}

export function ProductSearchSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select product',
  searchPlaceholder = 'Search products...',
  emptyMessage = 'No products found.',
  error,
  disabled = false,
  required = false
}: ProductSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)

  const selectedOption = options.find((option) => option.value === value)
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredOptions = options.filter((option) => {
    if (!normalizedQuery) {
      return true
    }

    const searchableContent = [
      option.label,
      option.description,
      option.meta,
      option.searchText
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return searchableContent.includes(normalizedQuery)
  })

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isOpen])

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="mb-2 block text-sm font-semibold text-gray-800">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev)
            }
          }}
          disabled={disabled}
          className={clsx(
            'flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-left text-sm text-gray-900 ring-offset-white transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            {
              'border-error focus:border-error focus:ring-error': error,
              'border-gray-300': !error,
              'cursor-not-allowed opacity-50': disabled
            }
          )}
        >
          <span className={clsx('truncate', !selectedOption && 'text-gray-500')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronUpDownIcon className="ml-2 h-4 w-4 flex-shrink-0 text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute z-30 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 p-2">
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  autoFocus
                  className="h-10 w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <p className="px-3 py-3 text-sm text-gray-500">{emptyMessage}</p>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value)
                        setIsOpen(false)
                      }}
                      className={clsx(
                        'flex w-full items-start justify-between gap-3 px-3 py-2 text-left transition-colors',
                        isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{option.label}</p>
                        {option.description && (
                          <p className="truncate text-xs text-gray-600">{option.description}</p>
                        )}
                        {option.meta && (
                          <p className="truncate text-xs text-gray-500">{option.meta}</p>
                        )}
                      </div>
                      <CheckIcon
                        className={clsx(
                          'mt-0.5 h-4 w-4 flex-shrink-0',
                          isSelected ? 'text-primary-600' : 'text-transparent'
                        )}
                      />
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  )
}
