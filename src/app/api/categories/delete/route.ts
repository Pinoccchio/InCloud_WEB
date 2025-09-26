import { NextRequest, NextResponse } from 'next/server'
import { validateAdminWithContext, getRequestMetadata } from '@/lib/auth-middleware'

// Types for the API
interface DeleteCategoryRequestBody {
  categoryId: string
  reason?: string
  currentAdminId: string
  currentAdminRole: 'admin' | 'super_admin'
}

export async function DELETE(request: NextRequest) {
  try {
    // Get admin context and validate permissions
    const { client, currentAdminId, requestBody } = await validateAdminWithContext(request)
    const { categoryId, reason } = requestBody as DeleteCategoryRequestBody

    // Get audit metadata
    const auditMetadata = getRequestMetadata(request)

    // Validate required fields
    if (!categoryId) {
      return NextResponse.json(
        { error: 'Missing required field: categoryId' },
        { status: 400 }
      )
    }

    // Get category details before deletion
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
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check for subcategories (prevent deletion if subcategories exist)
    const { data: subcategories, error: subcategoriesError } = await client
      .from('categories')
      .select('id, name')
      .eq('parent_id', categoryId)

    if (subcategoriesError) {
      console.error('Error checking subcategories:', subcategoriesError)
      return NextResponse.json(
        { error: 'Failed to check category hierarchy' },
        { status: 500 }
      )
    }

    // Prevent deletion if subcategories exist
    if (subcategories && subcategories.length > 0) {
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

    // Check for products using this category (prevent deletion if products exist)
    const { data: associatedProducts, error: productsError } = await client
      .from('products')
      .select('id, name, sku')
      .eq('category_id', categoryId)

    if (productsError) {
      console.error('Error checking associated products:', productsError)
      return NextResponse.json(
        { error: 'Failed to check category dependencies' },
        { status: 500 }
      )
    }

    // Prevent deletion if products are still using this category
    if (associatedProducts && associatedProducts.length > 0) {
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

    // Get parent category info for audit trail
    let parentCategoryInfo = null
    if (categoryToDelete.parent_id) {
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
      }
    }

    // Delete the category (safe since no subcategories or products reference it)
    const { error: deleteError } = await client
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (deleteError) {
      console.error('Error deleting category:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 400 }
      )
    }

    // Create audit log entry
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
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
      // Don't fail the request if audit logging fails
    }

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
    console.error('Unexpected error in delete category API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}