'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Button, Input } from '@/components/ui'
import { Database } from '@/types/supabase'

type PricingTier = Database['public']['Enums']['pricing_tier']

interface PriceTier {
  id?: string
  tier_type: PricingTier
  price: number | string
  min_quantity: number | string
  max_quantity?: number | string
  is_active: boolean
}

interface PricingTiersProps {
  value: PriceTier[]
  onChange: (tiers: PriceTier[]) => void
  disabled?: boolean
}

const TIER_LABELS = {
  wholesale: { label: 'Wholesale', description: 'Bulk orders for retailers' },
  retail: { label: 'Retail', description: 'Individual customer pricing' },
  bulk: { label: 'Bulk Pricing', description: 'Large volume/bulk pricing' }
}

const TIER_BADGE_COLORS = {
  wholesale: 'bg-blue-100 text-blue-800 border-blue-200',
  retail: 'bg-green-100 text-green-800 border-green-200',
  bulk: 'bg-purple-100 text-purple-800 border-purple-200'
}

export default function PricingTiers({ value, onChange, disabled = false }: PricingTiersProps) {
  const [tiers, setTiers] = useState<PriceTier[]>(value)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [newTier, setNewTier] = useState<PriceTier>({
    tier_type: 'retail',
    price: '',
    min_quantity: '',
    max_quantity: '',
    is_active: true
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTiers(value)
  }, [value])

  const getAvailableTierTypes = (): PricingTier[] => {
    const usedTypes = new Set(tiers.map(t => t.tier_type))
    return (Object.keys(TIER_LABELS) as PricingTier[]).filter(type => !usedTypes.has(type))
  }

  const validateTier = (tier: PriceTier): string | null => {
    const price = typeof tier.price === 'string' ? parseFloat(tier.price) : tier.price
    const minQuantity = typeof tier.min_quantity === 'string' ? parseInt(tier.min_quantity) : tier.min_quantity
    const maxQuantity = tier.max_quantity ? (typeof tier.max_quantity === 'string' ? parseInt(tier.max_quantity) : tier.max_quantity) : null

    if (!tier.price || tier.price === '' || isNaN(price) || price <= 0) {
      return 'Price must be greater than 0'
    }

    if (!tier.min_quantity || tier.min_quantity === '' || isNaN(minQuantity) || minQuantity <= 0) {
      return 'Minimum quantity must be greater than 0'
    }

    if (maxQuantity !== null && maxQuantity <= minQuantity) {
      return 'Maximum quantity must be greater than minimum quantity'
    }

    return null
  }

  const handleAddTier = () => {
    const validationError = validateTier(newTier)
    if (validationError) {
      setError(validationError)
      return
    }

    const newTiers = [...tiers, newTier]
    setTiers(newTiers)
    onChange(newTiers)

    // Reset form
    setIsAdding(false)
    const availableTypes = (Object.keys(TIER_LABELS) as PricingTier[]).filter(
      type => !newTiers.map(t => t.tier_type).includes(type)
    )
    setNewTier({
      tier_type: availableTypes[0] || 'retail',
      price: '',
      min_quantity: '',
      max_quantity: '',
      is_active: true
    })
    setError(null)
  }

  const handleUpdateTier = (index: number, updates: Partial<PriceTier>) => {
    const updatedTiers = [...tiers]
    updatedTiers[index] = { ...updatedTiers[index], ...updates }

    const validationError = validateTier(updatedTiers[index])
    if (validationError) {
      setError(validationError)
      return
    }

    setTiers(updatedTiers)
    onChange(updatedTiers)
    setEditingIndex(null)
    setError(null)
  }

  const handleRemoveTier = (index: number) => {
    const newTiers = tiers.filter((_, i) => i !== index)
    setTiers(newTiers)
    onChange(newTiers)
    setError(null)
  }

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return '₱0.00'
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(numValue)
  }

  const formatQuantityRange = (min: number | string, max?: number | string) => {
    const minVal = typeof min === 'string' ? (min || '?') : min
    if (!max || max === '') {
      return `${minVal}+ units`
    }
    const maxVal = typeof max === 'string' ? max : max
    return `${minVal}-${maxVal} units`
  }

  const availableTierTypes = getAvailableTierTypes()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Pricing Types</h3>
          <p className="text-sm text-gray-600">
            Configure pricing for wholesale, retail, and bulk quantities
          </p>
        </div>
      </div>

      {/* Main Consolidated Box */}
      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
        {/* Pricing Types List */}
        {tiers.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {tiers.map((tier, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                {editingIndex === index ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${TIER_BADGE_COLORS[tier.tier_type]}`}>
                          {TIER_LABELS[tier.tier_type].label}
                        </span>
                        <label className="flex items-center text-sm font-medium text-gray-900">
                          <input
                            type="checkbox"
                            checked={tier.is_active}
                            onChange={(e) => handleUpdateTier(index, { is_active: e.target.checked })}
                            className="h-5 w-5 text-blue-600 bg-white border-2 border-gray-400 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 mr-2 cursor-pointer checked:bg-blue-600 checked:border-blue-600"
                          />
                          Active
                        </label>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const validationError = validateTier(tier)
                            if (validationError) {
                              setError(validationError)
                            } else {
                              setEditingIndex(null)
                              setError(null)
                            }
                          }}
                          className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                          title="Save"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingIndex(null)
                            setError(null)
                          }}
                          className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="Cancel"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Price (₱) *
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={tier.price}
                          onChange={(e) => handleUpdateTier(index, { price: e.target.value })}
                          placeholder="0.00"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Min Quantity *
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={tier.min_quantity}
                          onChange={(e) => handleUpdateTier(index, { min_quantity: e.target.value })}
                          placeholder="1"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Max Quantity
                        </label>
                        <Input
                          type="number"
                          min={(typeof tier.min_quantity === 'string' ? parseInt(tier.min_quantity) || 1 : tier.min_quantity) + 1}
                          value={tier.max_quantity || ''}
                          onChange={(e) => handleUpdateTier(index, { max_quantity: e.target.value })}
                          placeholder="Unlimited"
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    )}
                  </div>
                ) : (
                  /* View Mode */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${TIER_BADGE_COLORS[tier.tier_type]}`}>
                        {TIER_LABELS[tier.tier_type].label}
                      </span>
                      <div className="flex items-center space-x-6 text-sm">
                        <div>
                          <span className="text-gray-500 text-xs">Price:</span>
                          <span className="ml-1 font-semibold text-gray-900">
                            {formatCurrency(tier.price)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Quantity:</span>
                          <span className="ml-1 text-gray-700">
                            {formatQuantityRange(tier.min_quantity, tier.max_quantity)}
                          </span>
                        </div>
                        <div>
                          {tier.is_active ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingIndex(index)}
                        disabled={disabled}
                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        title="Edit pricing type"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveTier(index)}
                        disabled={disabled}
                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Remove pricing type"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p className="text-sm mb-2">No pricing types configured</p>
            <p className="text-xs text-gray-400">Add your first pricing type to get started</p>
          </div>
        )}

        {/* Add New Pricing Type Section */}
        {availableTierTypes.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            {isAdding ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">Add New Pricing Type</h4>
                  <button
                    onClick={() => {
                      setIsAdding(false)
                      setError(null)
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      value={newTier.tier_type}
                      onChange={(e) => setNewTier({ ...newTier, tier_type: e.target.value as PricingTier })}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {availableTierTypes.map(type => (
                        <option key={type} value={type}>
                          {TIER_LABELS[type].label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Price (₱) *
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newTier.price}
                      onChange={(e) => setNewTier({ ...newTier, price: e.target.value })}
                      placeholder="0.00"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Min Qty *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={newTier.min_quantity}
                      onChange={(e) => setNewTier({ ...newTier, min_quantity: e.target.value })}
                      placeholder="1"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Max Qty
                    </label>
                    <Input
                      type="number"
                      min={(typeof newTier.min_quantity === 'string' ? parseInt(newTier.min_quantity) || 1 : newTier.min_quantity) + 1}
                      value={newTier.max_quantity || ''}
                      onChange={(e) => setNewTier({ ...newTier, max_quantity: e.target.value })}
                      placeholder="∞"
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="flex items-center text-sm font-medium text-gray-900">
                    <input
                      type="checkbox"
                      checked={newTier.is_active}
                      onChange={(e) => setNewTier({ ...newTier, is_active: e.target.checked })}
                      className="h-5 w-5 text-blue-600 bg-white border-2 border-gray-400 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 mr-2 cursor-pointer checked:bg-blue-600 checked:border-blue-600"
                    />
                    Active
                  </label>
                </div>

                {error && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    {error}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleAddTier}
                    size="sm"
                    disabled={disabled}
                  >
                    Add Pricing Type
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => setIsAdding(true)}
                disabled={disabled || tiers.length >= 3}
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Pricing Type
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Summary Section */}
      {tiers.length > 0 && tiers.some(t => t.is_active) && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
          <h4 className="font-medium text-gray-900 mb-3 text-sm">Pricing Summary</h4>
          <div className="space-y-2">
            {tiers
              .filter(tier => tier.is_active)
              .sort((a, b) => {
                const aMin = typeof a.min_quantity === 'string' ? parseInt(a.min_quantity) || 0 : a.min_quantity
                const bMin = typeof b.min_quantity === 'string' ? parseInt(b.min_quantity) || 0 : b.min_quantity
                return aMin - bMin
              })
              .map((tier, index) => (
                <div key={index} className="flex justify-between items-center text-sm bg-white bg-opacity-60 px-3 py-2 rounded">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${TIER_BADGE_COLORS[tier.tier_type]}`}>
                      {TIER_LABELS[tier.tier_type].label}
                    </span>
                    <span className="text-gray-600 text-xs">
                      {formatQuantityRange(tier.min_quantity, tier.max_quantity)}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(tier.price)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
