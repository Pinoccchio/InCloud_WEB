'use client'

import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { TrashIcon, XMarkIcon, FolderPlusIcon } from '@heroicons/react/24/outline'
import { Button, Input, LoadingSpinner } from '@/components/ui'
import { supabase } from '@/lib/supabase/auth'
import { useAuth } from '@/contexts/AuthContext'
import { Database } from '@/types/supabase'

type Category = Database['public']['Tables']['categories']['Row']
type ManagedCategory = Category & { productCount: number }

const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100, 'Category name is too long'),
  description: z.string().max(500, 'Description is too long').optional()
})

type CreateCategoryFormData = z.infer<typeof createCategorySchema>

interface CategoryManagementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (category: Category) => void | Promise<void>
  onDelete?: (categoryId: string) => void | Promise<void>
  selectedCategoryId?: string | null
}

export default function CategoryManagementModal({
  isOpen,
  onClose,
  onSuccess,
  onDelete,
  selectedCategoryId
}: CategoryManagementModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [categories, setCategories] = useState<ManagedCategory[]>([])
  const [error, setError] = useState<string | null>(null)
  const { admin } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema)
  })

  const loadCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true)

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (categoriesError) {
        throw new Error(`Failed to load categories: ${categoriesError.message}`)
      }

      const categoriesWithUsage = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count, error: countError } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('category_id', category.id)

          if (countError) {
            throw new Error(`Failed to check products for ${category.name}: ${countError.message}`)
          }

          return {
            ...category,
            productCount: count || 0
          }
        })
      )

      setCategories(categoriesWithUsage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories.')
    } finally {
      setIsLoadingCategories(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadCategories()
    }
  }, [isOpen, loadCategories])

  const onSubmit = async (data: CreateCategoryFormData) => {
    if (!admin) {
      setError('You must be logged in to create categories')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const { data: existing, error: checkError } = await supabase
        .from('categories')
        .select('id, name')
        .ilike('name', data.name.trim())
        .limit(1)

      if (checkError) {
        throw new Error(`Database error: ${checkError.message}`)
      }

      if (existing && existing.length > 0) {
        setError(`Category "${data.name}" already exists. Please use a different name.`)
        return
      }

      const { data: newCategory, error: createError } = await supabase
        .from('categories')
        .insert({
          name: data.name.trim(),
          description: data.description?.trim() || null,
          is_active: true,
          created_by: admin.id
        })
        .select()
        .single()

      if (createError) {
        throw new Error(`Failed to create category: ${createError.message}`)
      }

      if (!newCategory) {
        throw new Error('Category was created but no data was returned')
      }

      await Promise.resolve(onSuccess(newCategory))
      await loadCategories()
      reset()
      onClose()
    } catch (err) {
      console.error('Error creating category:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to create category. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (category: ManagedCategory) => {
    if (category.productCount > 0) {
      setError(`Cannot delete "${category.name}" because it is used by ${category.productCount} product(s).`)
      return
    }

    if (!window.confirm(`Delete category "${category.name}"? This cannot be undone.`)) {
      return
    }

    try {
      setIsDeletingId(category.id)
      setError(null)

      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)

      if (deleteError) {
        throw new Error(`Failed to delete category: ${deleteError.message}`)
      }

      setCategories((prev) => prev.filter((item) => item.id !== category.id))
      await Promise.resolve(onDelete?.(category.id))
    } catch (err) {
      console.error('Error deleting category:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to delete category. Please try again.'
      )
    } finally {
      setIsDeletingId(null)
    }
  }

  const handleClose = () => {
    if (!isSubmitting && !isDeletingId) {
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
          <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <FolderPlusIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-gray-900">
                    Manage Categories
                  </DialogTitle>
                  <p className="text-sm text-gray-600">
                    Create categories and remove unused ones
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting || !!isDeletingId}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                  label="Category Name"
                  placeholder="e.g., Frozen Vegetables, Dairy Products"
                  error={errors.name?.message}
                  {...register('name')}
                  autoFocus
                />

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Description (Optional)
                  </label>
                  <textarea
                    {...register('description')}
                    placeholder="Brief description of this category..."
                    rows={3}
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white placeholder:text-gray-600 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClose}
                    disabled={isSubmitting || !!isDeletingId}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={isSubmitting || !!isDeletingId}
                  >
                    {isSubmitting ? 'Creating Category...' : 'Create Category'}
                  </Button>
                </div>
              </form>

              <div className="border border-gray-200 rounded-xl">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Existing Categories</h3>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {isLoadingCategories ? (
                    <div className="py-10 flex items-center justify-center">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="px-4 py-8 text-sm text-gray-500 text-center">
                      No categories found.
                    </div>
                  ) : (
                    categories.map((category) => {
                      const isSelected = selectedCategoryId === category.id
                      const isInUse = category.productCount > 0

                      return (
                        <div key={category.id} className="px-4 py-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">{category.name}</p>
                              {isSelected && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Selected
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {isInUse ? `${category.productCount} linked product(s)` : 'Unused'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(category)}
                            disabled={!!isDeletingId || isInUse}
                            className={`p-2 rounded-md transition-colors ${
                              isInUse || !!isDeletingId
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                            title={isInUse ? 'Cannot delete a category used by products' : 'Delete category'}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-5 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
