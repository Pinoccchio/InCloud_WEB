'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button, Input } from '@/components/ui'
import { Database } from '@/types/supabase'

type PricingTier = Database['public']['Enums']['pricing_tier']
type PriceTierRow = Database['public']['Tables']['price_tiers']['Row']
type PriceTierInsert = Database['public']['Tables']['price_tiers']['Insert']

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
  box: { label: 'Box Pricing', description: 'Per box/case pricing' }
}

const TIER_COLORS = {
  wholesale: 'bg-blue-50 text-blue-700 border-blue-200',
  retail: 'bg-green-50 text-green-700 border-green-200',
  box: 'bg-purple-50 text-purple-700 border-purple-200'
}

export default function PricingTiers({ value, onChange, disabled = false }: PricingTiersProps) {
  const [tiers, setTiers] = useState<PriceTier[]>(value)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setTiers(value)
  }, [value])

  const validateTier = (tier: PriceTier, index: number): string | null => {
    // Parse string values to numbers for validation
    const price = typeof tier.price === 'string' ? parseFloat(tier.price) : tier.price
    const minQuantity = typeof tier.min_quantity === 'string' ? parseInt(tier.min_quantity) : tier.min_quantity
    const maxQuantity = typeof tier.max_quantity === 'string' ? parseInt(tier.max_quantity) : tier.max_quantity

    // Check for empty required fields
    if (!tier.price || tier.price === '') {
      return 'Price is required'
    }
    if (!tier.min_quantity || tier.min_quantity === '') {
      return 'Minimum quantity is required'
    }

    if (isNaN(price) || price <= 0) {
      return 'Price must be greater than 0'
    }

    if (isNaN(minQuantity) || minQuantity <= 0) {
      return 'Minimum quantity must be greater than 0'
    }

    if (tier.max_quantity && tier.max_quantity !== '' && (!isNaN(maxQuantity) && maxQuantity <= minQuantity)) {
      return 'Maximum quantity must be greater than minimum quantity'
    }

    // Check for overlapping quantity ranges with other tiers of the same type
    const otherTiers = tiers.filter((_, i) => i !== index && _.tier_type === tier.tier_type)
    for (const otherTier of otherTiers) {
      const otherMin = typeof otherTier.min_quantity === 'string' ? parseInt(otherTier.min_quantity) : otherTier.min_quantity
      const otherMax = typeof otherTier.max_quantity === 'string' ? parseInt(otherTier.max_quantity) : otherTier.max_quantity || Infinity

      const currentMin = minQuantity
      const currentMax = maxQuantity || Infinity

      // Skip validation if other tier has invalid data
      if (isNaN(otherMin)) continue

      // Check if ranges overlap
      if (
        (currentMin >= otherMin && currentMin <= otherMax) ||
        (currentMax >= otherMin && currentMax <= otherMax) ||
        (otherMin >= currentMin && otherMin <= currentMax)
      ) {
        return 'Quantity range overlaps with another tier of the same type'
      }
    }

    return null
  }

  const validateAllTiers = (newTiers: PriceTier[]): Record<string, string> => {
    const newErrors: Record<string, string> = {}

    newTiers.forEach((tier, index) => {
      const error = validateTier(tier, index)
      if (error) {
        newErrors[`tier-${index}`] = error
      }
    })

    return newErrors
  }

  const updateTier = (index: number, updates: Partial<PriceTier>) => {
    const newTiers = [...tiers]
    newTiers[index] = { ...newTiers[index], ...updates }

    const newErrors = validateAllTiers(newTiers)
    setErrors(newErrors)
    setTiers(newTiers)
    onChange(newTiers)
  }

  const addTier = () => {
    const newTier: PriceTier = {
      tier_type: 'retail',
      price: '',
      min_quantity: '',
      max_quantity: '',
      is_active: true
    }

    const newTiers = [...tiers, newTier]
    const newErrors = validateAllTiers(newTiers)
    setErrors(newErrors)
    setTiers(newTiers)
    onChange(newTiers)
  }

  const removeTier = (index: number) => {
    const newTiers = tiers.filter((_, i) => i !== index)
    const newErrors = validateAllTiers(newTiers)
    setErrors(newErrors)
    setTiers(newTiers)
    onChange(newTiers)
  }

  const getTierTypeOptions = (currentIndex: number) => {
    const usedTypes = new Set(
      tiers
        .map((tier, index) => ({ tier, index }))
        .filter(({ index }) => index !== currentIndex)
        .map(({ tier }) => tier.tier_type)
    )

    return Object.entries(TIER_LABELS).filter(([key]) => !usedTypes.has(key as PricingTier))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(value)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Pricing Tiers</h3>
          <p className="text-sm text-gray-600">
            Set different prices for wholesale, retail, and box quantities
          </p>
        </div>
        <Button
          type="button"
          onClick={addTier}
          disabled={disabled || tiers.length >= 3}
          size="sm"
          className="flex items-center"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Tier
        </Button>
      </div>

      {tiers.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No pricing tiers defined</p>
          <Button
            type="button"
            onClick={addTier}
            disabled={disabled}
            variant="outline"
          >
            Add Your First Pricing Tier
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {tiers.map((tier, index) => {
            const error = errors[`tier-${index}`]
            const tierTypeOptions = getTierTypeOptions(index)

            return (
              <div
                key={`tier-${index}`}
                className={`p-6 border rounded-lg ${TIER_COLORS[tier.tier_type]} ${
                  error ? 'border-red-300' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tier Type
                        </label>
                        <select
                          value={tier.tier_type}
                          onChange={(e) => updateTier(index, { tier_type: e.target.value as PricingTier })}
                          disabled={disabled}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                          {/* Keep current option even if used elsewhere */}
                          <option value={tier.tier_type}>
                            {TIER_LABELS[tier.tier_type].label}
                          </option>
                          {/* Add unused options */}
                          {tierTypeOptions
                            .filter(([key]) => key !== tier.tier_type)
                            .map(([key, config]) => (
                              <option key={key} value={key}>
                                {config.label}
                              </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-600">
                          {TIER_LABELS[tier.tier_type].description}
                        </p>
                      </div>

                      <div className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={tier.is_active}
                            onChange={(e) => updateTier(index, { is_active: e.target.checked })}
                            disabled={disabled}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
                          />
                          <span className="text-sm text-gray-700">Active</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price (₱)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={tier.price}
                          onChange={(e) => {
                            // Store raw string value during typing, like RestockModal
                            updateTier(index, { price: e.target.value })
                          }}
                          placeholder="0.00"
                          disabled={disabled}
                          className={error ? 'border-red-300' : ''}
                        />
                        {tier.price && tier.price !== '' && !isNaN(typeof tier.price === 'string' ? parseFloat(tier.price) : tier.price) && (typeof tier.price === 'string' ? parseFloat(tier.price) : tier.price) > 0 && (
                          <p className="mt-1 text-xs text-gray-600">
                            {formatCurrency(typeof tier.price === 'string' ? parseFloat(tier.price) : tier.price)}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Min Quantity
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={tier.min_quantity}
                          onChange={(e) => {
                            // Store raw string value during typing, like RestockModal
                            updateTier(index, { min_quantity: e.target.value })
                          }}
                          placeholder="1"
                          disabled={disabled}
                          className={error ? 'border-red-300' : ''}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Quantity (Optional)
                        </label>
                        <Input
                          type="number"
                          min={(typeof tier.min_quantity === 'string' ? parseInt(tier.min_quantity) || 1 : tier.min_quantity) + 1}
                          value={tier.max_quantity || ''}
                          onChange={(e) => {
                            // Store raw string value during typing, like RestockModal
                            updateTier(index, { max_quantity: e.target.value })
                          }}
                          disabled={disabled}
                          className={error ? 'border-red-300' : ''}
                          placeholder="Unlimited"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="mt-3 flex items-center text-red-600">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        <span className="text-sm">{error}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeTier(index)}
                    disabled={disabled}
                    className="ml-4 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove tier"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Quantity Range Display */}
                <div className="mt-4 p-3 bg-white bg-opacity-50 rounded border border-gray-200">
                  <div className="text-sm">
                    <span className="font-medium">Applies to orders of: </span>
                    <span className="text-gray-700">
                      {typeof tier.min_quantity === 'string' ? (tier.min_quantity || '?') : tier.min_quantity} - {tier.max_quantity && tier.max_quantity !== '' ? (typeof tier.max_quantity === 'string' ? tier.max_quantity : tier.max_quantity) : '∞'} units
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Summary */}
      {tiers.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Pricing Summary</h4>
          <div className="space-y-2">
            {tiers
              .filter(tier => tier.is_active)
              .sort((a, b) => {
                const aMin = typeof a.min_quantity === 'string' ? parseInt(a.min_quantity) || 0 : a.min_quantity
                const bMin = typeof b.min_quantity === 'string' ? parseInt(b.min_quantity) || 0 : b.min_quantity
                return aMin - bMin
              })
              .map((tier, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {TIER_LABELS[tier.tier_type].label}
                    {tier.max_quantity && tier.max_quantity !== ''
                      ? ` (${typeof tier.min_quantity === 'string' ? tier.min_quantity : tier.min_quantity}-${typeof tier.max_quantity === 'string' ? tier.max_quantity : tier.max_quantity} units)`
                      : ` (${typeof tier.min_quantity === 'string' ? tier.min_quantity : tier.min_quantity}+ units)`
                    }
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(typeof tier.price === 'string' ? parseFloat(tier.price) || 0 : tier.price)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}