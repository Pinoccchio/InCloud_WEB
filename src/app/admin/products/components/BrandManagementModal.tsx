'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon, TagIcon } from '@heroicons/react/24/outline'
import { Button, Input } from '@/components/ui'
import { supabase } from '@/lib/supabase/auth'
import { useAuth } from '@/contexts/AuthContext'
import { Database } from '@/types/supabase'

type Brand = Database['public']['Tables']['brands']['Row']

// Form validation schema
const createBrandSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters').max(100, 'Brand name is too long'),
  description: z.string().max(500, 'Description is too long').optional()
})

type CreateBrandFormData = z.infer<typeof createBrandSchema>

interface BrandManagementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (brand: Brand) => void
}

export default function BrandManagementModal({
  isOpen,
  onClose,
  onSuccess
}: BrandManagementModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { admin } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateBrandFormData>({
    resolver: zodResolver(createBrandSchema)
  })

  const onSubmit = async (data: CreateBrandFormData) => {
    if (!admin) {
      setError('You must be logged in to create brands')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Check if brand name already exists
      const { data: existing, error: checkError } = await supabase
        .from('brands')
        .select('id, name')
        .ilike('name', data.name.trim())
        .limit(1)

      if (checkError) {
        throw new Error(`Database error: ${checkError.message}`)
      }

      if (existing && existing.length > 0) {
        setError(`Brand "${data.name}" already exists. Please use a different name.`)
        return
      }

      // Create new brand
      const { data: newBrand, error: createError } = await supabase
        .from('brands')
        .insert({
          name: data.name.trim(),
          description: data.description?.trim() || null,
          is_active: true,
          created_by: admin.id
        })
        .select()
        .single()

      if (createError) {
        throw new Error(`Failed to create brand: ${createError.message}`)
      }

      if (!newBrand) {
        throw new Error('Brand was created but no data was returned')
      }

      // Success
      reset()
      onSuccess(newBrand)
      onClose()
    } catch (err) {
      console.error('Error creating brand:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to create brand. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      reset()
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <TagIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-gray-900">
                    Add New Brand
                  </DialogTitle>
                  <p className="text-sm text-gray-600">
                    Create a new product brand
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Brand Name */}
              <Input
                label="Brand Name"
                placeholder="e.g., Creamy Delights, Ocean Fresh"
                error={errors.name?.message}
                {...register('name')}
                autoFocus
              />

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Description (Optional)
                </label>
                <textarea
                  {...register('description')}
                  placeholder="Brief description of this brand..."
                  rows={3}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white placeholder:text-gray-600 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Brand...' : 'Create Brand'}
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
