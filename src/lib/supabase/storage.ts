import { supabase } from './auth'

export interface UploadResult {
  success: boolean
  data?: {
    path: string
    url: string
    fullPath: string
  }
  error?: string
}

export interface DeleteResult {
  success: boolean
  error?: string
}

// Storage bucket name for product images
export const PRODUCT_IMAGES_BUCKET = 'product-images'

// Maximum file size (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed image types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

/**
 * Upload a product image to Supabase Storage
 */
export async function uploadProductImage(
  file: File,
  productId: string,
  folder: 'main' | 'gallery' | 'thumbnails' = 'gallery'
): Promise<UploadResult> {
  try {
    // Validate file
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please upload JPEG, PNG, or WebP images.'
      }
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: 'File size too large. Maximum size is 5MB.'
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileName = `${timestamp}_${randomId}.${fileExt}`
    const filePath = `products/${productId}/${folder}/${fileName}`

    // Upload to storage
    const { data, error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(filePath)

    return {
      success: true,
      data: {
        path: filePath,
        url: urlData.publicUrl,
        fullPath: data.fullPath
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

/**
 * Upload multiple product images
 */
export async function uploadMultipleProductImages(
  files: File[],
  productId: string,
  folder: 'main' | 'gallery' | 'thumbnails' = 'gallery'
): Promise<{
  successful: Array<{ file: File; result: UploadResult['data'] }>
  failed: Array<{ file: File; error: string }>
}> {
  const results = await Promise.allSettled(
    files.map(file => uploadProductImage(file, productId, folder))
  )

  const successful: Array<{ file: File; result: UploadResult['data'] }> = []
  const failed: Array<{ file: File; error: string }> = []

  results.forEach((result, index) => {
    const file = files[index]

    if (result.status === 'fulfilled' && result.value.success && result.value.data) {
      successful.push({
        file,
        result: result.value.data
      })
    } else {
      const error = result.status === 'rejected'
        ? result.reason?.message || 'Upload failed'
        : (result.value.error || 'Upload failed')

      failed.push({
        file,
        error
      })
    }
  })

  return { successful, failed }
}

/**
 * Delete a product image from storage
 */
export async function deleteProductImage(filePath: string): Promise<DeleteResult> {
  try {
    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove([filePath])

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    }
  }
}

/**
 * Delete multiple product images
 */
export async function deleteMultipleProductImages(filePaths: string[]): Promise<{
  successful: string[]
  failed: Array<{ path: string; error: string }>
}> {
  const results = await Promise.allSettled(
    filePaths.map(path => deleteProductImage(path))
  )

  const successful: string[] = []
  const failed: Array<{ path: string; error: string }> = []

  results.forEach((result, index) => {
    const path = filePaths[index]

    if (result.status === 'fulfilled' && result.value.success) {
      successful.push(path)
    } else {
      const error = result.status === 'rejected'
        ? result.reason?.message || 'Delete failed'
        : (result.value.error || 'Delete failed')

      failed.push({
        path,
        error
      })
    }
  })

  return { successful, failed }
}

/**
 * Get public URL for a stored image
 */
export function getProductImageUrl(filePath: string): string {
  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(filePath)

  return data.publicUrl
}

/**
 * Get all images for a product
 */
export async function getProductImages(productId: string): Promise<{
  success: boolean
  data?: Array<{
    name: string
    path: string
    url: string
    size: number
    updatedAt: string
  }>
  error?: string
}> {
  try {
    const { data, error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .list(`products/${productId}`, {
        limit: 100,
        offset: 0
      })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    const images = (data || [])
      .filter(item => item.name && !item.name.endsWith('/')) // Filter out folders
      .map(item => ({
        name: item.name,
        path: `products/${productId}/${item.name}`,
        url: getProductImageUrl(`products/${productId}/${item.name}`),
        size: item.metadata?.size || 0,
        updatedAt: item.updated_at || item.created_at || ''
      }))

    return {
      success: true,
      data: images
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch images'
    }
  }
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, or WebP images.'
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 5MB.'
    }
  }

  return { valid: true }
}

/**
 * Create a thumbnail URL with Supabase's image transformations
 */
export function createThumbnailUrl(originalUrl: string, width = 150, height = 150): string {
  return `${originalUrl}?width=${width}&height=${height}&resize=cover`
}