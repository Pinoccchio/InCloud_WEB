import { NextRequest, NextResponse } from 'next/server'
import { validateAdminWithContext, getRequestMetadata } from '@/lib/auth-middleware'

// Constants
const HTTP_STATUS = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const

const ERROR_MESSAGES = {
  MISSING_BRAND_ID: 'Missing required field: brandId',
  INVALID_BRAND_ID: 'Invalid brandId format - must be a valid UUID',
  BRAND_NOT_FOUND: 'Brand not found',
  CHECK_DEPENDENCIES_FAILED: 'Failed to check brand dependencies',
  DELETE_FAILED: 'Failed to delete brand',
  INTERNAL_ERROR: 'Internal server error',
  BRAND_HAS_PRODUCTS: 'Cannot delete brand with associated products',
} as const

// Validation functions
/**
 * Validates if a string is a properly formatted UUID (v1-v5)
 * @param uuid - The string to validate
 * @returns True if the string is a valid UUID, false otherwise
 */
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Sanitizes input string by trimming whitespace and limiting length
 * @param input - The string to sanitize
 * @returns Sanitized string or undefined if input is falsy
 */
const sanitizeString = (input: string | undefined): string | undefined => {
  if (!input) return undefined
  return input.trim().slice(0, 1000) // Limit length and trim whitespace
}

/**
 * Creates a standardized error response
 * @param message - The error message
 * @param status - HTTP status code
 * @param details - Optional additional error details
 * @returns NextResponse with error structure
 */
const createErrorResponse = (message: string, status: number, details?: unknown): NextResponse => {
  const errorBody: { error: string; details?: unknown } = { error: message }
  if (details) {
    errorBody.details = details
  }
  return NextResponse.json(errorBody, { status })
}

/**
 * Creates a standardized success response
 * @param data - Data to include in the response
 * @returns NextResponse with success structure
 */
const createSuccessResponse = (data: Record<string, unknown>): NextResponse => {
  return NextResponse.json({ success: true, ...data })
}

/**
 * Validates brand ID input for required field and UUID format
 * @param brandId - The brand ID to validate
 * @returns Error response if validation fails, null if valid
 */
const validateInput = (brandId: string | undefined): NextResponse | null => {
  if (!brandId) {
    return createErrorResponse(ERROR_MESSAGES.MISSING_BRAND_ID, HTTP_STATUS.BAD_REQUEST)
  }

  if (!isValidUUID(brandId)) {
    return createErrorResponse(ERROR_MESSAGES.INVALID_BRAND_ID, HTTP_STATUS.BAD_REQUEST)
  }

  return null
}

/**
 * Fetches brand details from the database
 * @param client - Supabase client instance
 * @param brandId - The brand ID to fetch
 * @returns Promise resolving to brand data and potential errors
 */
const fetchBrandDetails = async (client: unknown, brandId: string) => {
  return await (client as { from: (table: string) => unknown })
    .from('brands')
    .select(`
      id,
      name,
      description,
      status,
      created_at,
      created_by,
      updated_by
    `)
    .eq('id', brandId)
    .single() as { data: BrandRecord | null; error: unknown }
}

/**
 * Checks for products associated with a brand
 * @param client - Supabase client instance
 * @param brandId - The brand ID to check
 * @returns Promise resolving to associated products data and potential errors
 */
const checkAssociatedProducts = async (client: unknown, brandId: string) => {
  return await (client as { from: (table: string) => unknown })
    .from('products')
    .select('id, name, sku')
    .eq('brand_id', brandId) as { data: ProductRecord[] | null; error: unknown }
}

/**
 * Creates an audit log entry for brand deletion
 * @param client - Supabase client instance
 * @param currentAdminId - ID of the admin performing the deletion
 * @param brandToDelete - The brand record being deleted
 * @param reason - Optional reason for deletion
 * @param auditMetadata - Metadata for the audit log
 */
const createAuditLog = async (
  client: unknown,
  currentAdminId: string,
  brandToDelete: BrandRecord,
  reason: string | undefined,
  auditMetadata: { timestamp: string }
) => {
  try {
    await (client as { from: (table: string) => unknown })
      .from('audit_logs')
      .insert({
        admin_id: currentAdminId,
        action: 'delete',
        table_name: 'brands',
        record_id: brandToDelete.id,
        old_data: brandToDelete,
        metadata: {
          deleted_brand_name: brandToDelete.name,
          had_no_associated_products: true,
          reason: reason || null,
          action_context: 'brand_deletion_safe',
          timestamp: auditMetadata.timestamp
        }
      })
  } catch {
    // Audit logging failure shouldn't fail the request
    // Error would be logged by monitoring systems
  }
}

// Types for the API
interface DeleteBrandRequestBody {
  brandId: string
  reason?: string
  currentAdminId: string
  currentAdminRole: 'admin' | 'super_admin'
}

interface BrandRecord {
  id: string
  name: string
  description: string | null
  status: string | null
  created_at: string
  created_by: string | null
  updated_by: string | null
}

interface ProductRecord {
  id: string
  name: string
  sku: string
}

/**
 * DELETE /api/brands/delete
 *
 * Deletes a brand from the system with comprehensive safety checks and audit logging.
 * This endpoint ensures data integrity by preventing deletion of brands that are still
 * referenced by products, maintaining referential integrity in the database.
 *
 * **Security Requirements:**
 * - Requires admin authentication (admin or super_admin role)
 * - Validates admin context via middleware
 *
 * **Request Body:**
 * - `brandId` (string, required): UUID of the brand to delete
 * - `reason` (string, optional): Reason for deletion (for audit purposes)
 *
 * **Business Logic:**
 * 1. Validates input (required fields, UUID format)
 * 2. Checks if brand exists in the database
 * 3. Verifies no products are associated with the brand
 * 4. Performs deletion if safe
 * 5. Creates audit log entry
 *
 * **Error Responses:**
 * - 400: Missing or invalid brandId format
 * - 404: Brand not found
 * - 409: Cannot delete brand with associated products (includes product list)
 * - 500: Internal server error or dependency check failure
 *
 * **Success Response:**
 * - 200: Brand successfully deleted with confirmation details
 *
 * @param request - NextRequest containing admin context and brand deletion data
 * @returns Promise<NextResponse> - Standardized API response
 *
 * @example
 * ```typescript
 * // Request body
 * {
 *   "brandId": "a4e4da77-7d55-401f-bb96-d0a2c42c0a65",
 *   "reason": "Brand discontinued by supplier"
 * }
 *
 * // Success response
 * {
 *   "success": true,
 *   "message": "Brand \"Ocean Fresh\" has been deleted successfully",
 *   "deletedBrand": {
 *     "id": "a4e4da77-7d55-401f-bb96-d0a2c42c0a65",
 *     "name": "Ocean Fresh"
 *   }
 * }
 *
 * // Error response (brand has products)
 * {
 *   "error": "Cannot delete brand with associated products",
 *   "details": {
 *     "message": "This brand is currently used by 3 product(s). Please reassign or delete these products first.",
 *     "associatedProducts": [
 *       { "id": "...", "name": "Premium Salmon", "sku": "SAL001" }
 *     ],
 *     "productCount": 3
 *   }
 * }
 * ```
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Get admin context and validate permissions
    const { client, currentAdminId, requestBody } = await validateAdminWithContext(request)
    const { brandId: rawBrandId, reason: rawReason } = requestBody as DeleteBrandRequestBody

    // Get audit metadata
    const auditMetadata = getRequestMetadata(request)

    // Validate and sanitize input
    const brandId = sanitizeString(rawBrandId)
    const reason = sanitizeString(rawReason)

    // Validate input
    const validationError = validateInput(brandId)
    if (validationError) {
      return validationError
    }

    // Get brand details before deletion
    const { data: brandToDelete, error: fetchError } = await fetchBrandDetails(client, brandId!)

    if (fetchError || !brandToDelete) {
      return createErrorResponse(ERROR_MESSAGES.BRAND_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }

    // Check for products using this brand (prevent deletion if products exist)
    const { data: associatedProducts, error: productsError } = await checkAssociatedProducts(client, brandId!)

    if (productsError) {
      // Log error for debugging but don't expose internal details
      return createErrorResponse(ERROR_MESSAGES.CHECK_DEPENDENCIES_FAILED, HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }

    // Prevent deletion if products are still using this brand
    if (associatedProducts && associatedProducts.length > 0) {
      const details = {
        message: `This brand is currently used by ${associatedProducts.length} product(s). Please reassign or delete these products first.`,
        associatedProducts: associatedProducts.map((p: ProductRecord) => ({
          id: p.id,
          name: p.name,
          sku: p.sku
        })),
        productCount: associatedProducts.length
      }
      return createErrorResponse(ERROR_MESSAGES.BRAND_HAS_PRODUCTS, HTTP_STATUS.CONFLICT, details)
    }

    // Delete the brand (safe since no products reference it)
    const { error: deleteError } = await client
      .from('brands')
      .delete()
      .eq('id', brandId)

    if (deleteError) {
      // Log error for debugging but don't expose internal details
      return createErrorResponse(ERROR_MESSAGES.DELETE_FAILED, HTTP_STATUS.BAD_REQUEST)
    }

    // Create audit log entry
    await createAuditLog(client, currentAdminId, brandToDelete, reason, auditMetadata)

    return createSuccessResponse({
      message: `Brand "${brandToDelete.name}" has been deleted successfully`,
      deletedBrand: {
        id: brandToDelete.id,
        name: brandToDelete.name
      }
    })

  } catch {
    // Log error for debugging but don't expose internal details
    return createErrorResponse(ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}