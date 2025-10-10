import { NextRequest, NextResponse } from 'next/server'
import { validateAdminWithContext, getRequestMetadata } from '@/lib/auth-middleware'
import { logger } from '@/lib/logger'

// Types for the API
interface DeleteCategoryRequestBody {
  categoryId: string
  reason?: string
  currentAdminId: string
  currentAdminRole: 'admin' | 'super_admin'
}

export async function DELETE(request: NextRequest) {
  const routeLogger = logger.child({
    route: 'DELETE /api/categories/delete',
    operation: 'deleteCategory'
  })
  routeLogger.time('deleteCategory')

  try {
    routeLogger.info('Starting category deletion request')

    // Get admin context and validate permissions
    const { client, currentAdminId, requestBody } = await validateAdminWithContext(request)
    const { categoryId, reason } = requestBody as DeleteCategoryRequestBody

    routeLogger.debug('Request validated', {
      currentAdminId,
      categoryId,
      hasReason: !!reason
    })

    // Get audit metadata
    const auditMetadata = getRequestMetadata(request)

    // Validate required fields
    if (!categoryId) {
      routeLogger.warn('Missing required field: categoryId')
      return NextResponse.json(
        { error: 'Missing required field: categoryId' },
        { status: 400 }
      )
    }

    // Get category details before deletion
    routeLogger.info('Fetching category details', { categoryId })
    routeLogger.db('SELECT', 'categories')
    const { data: categoryToDelete, error: fetchError } = await client
      .from('categories')
      .select(`
        id,
        name,
        description,
        parent_id,
        status,
        created_at,
        created_by,
        updated_by
      `)
      .eq('id', categoryId)
      .single()

    if (fetchError || !categoryToDelete) {
      routeLogger.warn('Category not found', { categoryId, error: fetchError?.message })
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    routeLogger.debug('Category found', {
      categoryName: categoryToDelete.name,
      isTopLevel: !categoryToDelete.parent_id
    })

    // Check for subcategories (prevent deletion if subcategories exist)
    routeLogger.info('Checking for subcategories')
    routeLogger.db('SELECT', 'categories')
    const { data: subcategories, error: subcategoriesError } = await client
      .from('categories')
      .select('id, name')
      .eq('parent_id', categoryId)

    if (subcategoriesError) {
      routeLogger.error('Error checking subcategories', subcategoriesError)
      return NextResponse.json(
        { error: 'Failed to check category hierarchy' },
        { status: 500 }
      )
    }

    // Prevent deletion if subcategories exist
    if (subcategories && subcategories.length > 0) {
      routeLogger.warn('Cannot delete category with subcategories', {
        categoryName: categoryToDelete.name,
        subcategoryCount: subcategories.length
      })
      return NextResponse.json(
        {
          error: 'Cannot delete category with subcategories',
          details: {
            message: `This category has ${subcategories.length} subcategory(ies). Please delete or reassign subcategories first.`,
            subcategories: subcategories.map(sub => ({
              id: sub.id,
              name: sub.name
            })),
            subcategoryCount: subcategories.length
          }
        },
        { status: 409 } // Conflict
      )
    }

    routeLogger.debug('No subcategories found')

    // Check for products using this category (prevent deletion if products exist)
    routeLogger.info('Checking for associated products')
    routeLogger.db('SELECT', 'products')
    const { data: associatedProducts, error: productsError } = await client
      .from('products')
      .select('id, name, sku')
      .eq('category_id', categoryId)

    if (productsError) {
      routeLogger.error('Error checking associated products', productsError)
      return NextResponse.json(
        { error: 'Failed to check category dependencies' },
        { status: 500 }
      )
    }

    // Prevent deletion if products are still using this category
    if (associatedProducts && associatedProducts.length > 0) {
      routeLogger.warn('Cannot delete category with associated products', {
        categoryName: categoryToDelete.name,
        productCount: associatedProducts.length
      })
      return NextResponse.json(
        {
          error: 'Cannot delete category with associated products',
          details: {
            message: `This category is currently used by ${associatedProducts.length} product(s). Please reassign or delete these products first.`,
            associatedProducts: associatedProducts.map(p => ({
              id: p.id,
              name: p.name,
              sku: p.sku
            })),
            productCount: associatedProducts.length
          }
        },
        { status: 409 } // Conflict
      )
    }

    routeLogger.debug('No associated products found - safe to delete')

    // Get parent category info for audit trail
    let parentCategoryInfo = null
    if (categoryToDelete.parent_id) {
      routeLogger.debug('Fetching parent category for audit trail')
      routeLogger.db('SELECT', 'categories')
      const { data: parentCategory } = await client
        .from('categories')
        .select('id, name')
        .eq('id', categoryToDelete.parent_id)
        .single()

      if (parentCategory) {
        parentCategoryInfo = {
          id: parentCategory.id,
          name: parentCategory.name
        }
        routeLogger.debug('Parent category found', { parentName: parentCategory.name })
      }
    }

    // Delete the category (safe since no subcategories or products reference it)
    routeLogger.info('Deleting category from database', { categoryId, categoryName: categoryToDelete.name })
    routeLogger.db('DELETE', 'categories')
    const { error: deleteError } = await client
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (deleteError) {
      routeLogger.error('Error deleting category', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 400 }
      )
    }

    routeLogger.debug('Category deleted from database')

    // Create audit log entry
    routeLogger.info('Creating audit log entry')
    routeLogger.db('INSERT', 'audit_logs')
    try {
      await client
        .from('audit_logs')
        .insert({
          admin_id: currentAdminId,
          action: 'delete',
          table_name: 'categories',
          record_id: categoryToDelete.id,
          old_data: categoryToDelete,
          metadata: {
            deleted_category_name: categoryToDelete.name,
            was_top_level: !categoryToDelete.parent_id,
            parent_category: parentCategoryInfo,
            had_no_subcategories: true,
            had_no_associated_products: true,
            reason: reason || null,
            action_context: 'category_deletion_safe',
            timestamp: auditMetadata.timestamp
          }
        })
      routeLogger.debug('Audit log entry created')
    } catch (auditError) {
      routeLogger.warn('Failed to create audit log', { error: auditError })
      // Don't fail the request if audit logging fails
    }

    const duration = routeLogger.timeEnd('deleteCategory')
    routeLogger.success('Category deleted successfully', {
      duration,
      categoryId,
      categoryName: categoryToDelete.name,
      wasTopLevel: !categoryToDelete.parent_id,
      performedBy: currentAdminId
    })

    return NextResponse.json({
      success: true,
      message: `Category "${categoryToDelete.name}" has been deleted successfully`,
      deletedCategory: {
        id: categoryToDelete.id,
        name: categoryToDelete.name,
        wasTopLevel: !categoryToDelete.parent_id
      }
    })

  } catch (error) {
    routeLogger.error('Unexpected error in delete category API', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}