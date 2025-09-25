'use client'

import { useState, useRef, useCallback } from 'react'
import { PhotoIcon, XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'
import { uploadMultipleProductImages, validateImageFile, createThumbnailUrl } from '@/lib/supabase/storage'

interface UploadedImage {
  id: string
  file: File
  url: string
  path: string
  isUploading: boolean
  error?: string
}

interface ImageUploaderProps {
  productId?: string
  maxImages?: number
  onImagesChange: (images: UploadedImage[]) => void
  initialImages?: Array<{
    id: string
    url: string
    path: string
  }>
}

export default function ImageUploader({
  productId,
  maxImages = 10,
  onImagesChange,
  initialImages = []
}: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>(
    initialImages.map(img => ({
      ...img,
      file: new File([], 'existing'),
      isUploading: false
    }))
  )
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateImages = useCallback((newImages: UploadedImage[]) => {
    setImages(newImages)
    onImagesChange(newImages)
  }, [onImagesChange])

  const handleFileSelect = useCallback(async (files: File[]) => {
    console.log('📤 ImageUploader: Starting file selection', {
      fileCount: files.length,
      productId,
      fileNames: Array.from(files).map(f => f.name)
    })

    if (!files.length) return

    // Check if productId is available
    if (!productId) {
      console.error('❌ ImageUploader: No productId provided - upload will fail')
      alert('Cannot upload images: Product ID not available')
      return
    }

    // Validate files
    const validFiles: File[] = []
    const invalidFiles: Array<{ file: File; error: string }> = []

    files.forEach(file => {
      const validation = validateImageFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        invalidFiles.push({ file, error: validation.error || 'Invalid file' })
      }
    })

    console.log('✅ File validation completed', {
      validCount: validFiles.length,
      invalidCount: invalidFiles.length,
      invalidErrors: invalidFiles.map(f => f.error)
    })

    // Check if adding these files would exceed the limit
    const currentCount = images.length
    const availableSlots = maxImages - currentCount

    if (validFiles.length > availableSlots) {
      const excessCount = validFiles.length - availableSlots
      alert(`You can only upload ${availableSlots} more image(s). ${excessCount} file(s) will be ignored.`)
      validFiles.splice(availableSlots)
    }

    if (validFiles.length === 0) {
      if (invalidFiles.length > 0) {
        alert(`Invalid files: ${invalidFiles.map(f => f.error).join(', ')}`)
      }
      return
    }

    // Create preview images immediately
    const newImages: UploadedImage[] = validFiles.map(file => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      path: '',
      isUploading: true
    }))

    const updatedImages = [...images, ...newImages]
    updateImages(updatedImages)

    // If we have a productId, upload to Supabase
    if (productId) {
      console.log('🚀 Starting upload to Supabase', { productId, fileCount: validFiles.length })
      setIsUploading(true)

      try {
        const uploadResults = await uploadMultipleProductImages(validFiles, productId, 'gallery')
        console.log('📊 Upload results received', {
          successful: uploadResults.successful.length,
          failed: uploadResults.failed.length,
          failedReasons: uploadResults.failed.map(f => f.error)
        })

        // Update images with upload results
        const finalImages = updatedImages.map(img => {
          if (img.isUploading) {
            const successResult = uploadResults.successful.find(r => r.file === img.file)
            const failResult = uploadResults.failed.find(r => r.file === img.file)

            if (successResult) {
              console.log('✅ Upload successful for', img.file.name, successResult.result.url)
              // Replace preview URL with actual URL
              URL.revokeObjectURL(img.url)
              return {
                ...img,
                url: successResult.result.url,
                path: successResult.result.path,
                isUploading: false
              }
            } else if (failResult) {
              console.error('❌ Upload failed for', img.file.name, failResult.error)
              return {
                ...img,
                isUploading: false,
                error: failResult.error
              }
            }
          }
          return img
        })

        updateImages(finalImages)
        console.log('🏁 Image upload process completed')
      } catch (error) {
        console.error('💥 Upload process crashed:', error)
        // Mark all uploading images as failed
        const failedImages = updatedImages.map(img =>
          img.isUploading
            ? { ...img, isUploading: false, error: 'Upload failed' }
            : img
        )
        updateImages(failedImages)
      } finally {
        setIsUploading(false)
      }
    }
  }, [images, maxImages, productId, updateImages])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFileSelect(files)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragging(false)
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFileSelect(files)
    // Reset input
    e.target.value = ''
  }, [handleFileSelect])

  const removeImage = useCallback((imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId)
    if (imageToRemove && imageToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url)
    }

    const newImages = images.filter(img => img.id !== imageId)
    updateImages(newImages)
  }, [images, updateImages])

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${isDragging
            ? 'border-primary-400 bg-primary-50'
            : images.length >= maxImages
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="text-center">
          {images.length >= maxImages ? (
            <div className="text-gray-500">
              <PhotoIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Maximum number of images reached ({maxImages})</p>
            </div>
          ) : (
            <>
              <CloudArrowUpIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Drop images here or{' '}
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                    disabled={isUploading}
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WebP up to 5MB • {images.length}/{maxImages} images
                </p>
              </div>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading || images.length >= maxImages}
        />
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
            >
              <img
                src={createThumbnailUrl(image.url, 200, 200)}
                alt="Product"
                className="w-full h-full object-cover"
              />

              {/* Loading Overlay */}
              {image.isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="flex flex-col items-center text-white">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mb-2"></div>
                    <span className="text-xs">Uploading...</span>
                  </div>
                </div>
              )}

              {/* Error Overlay */}
              {image.error && (
                <div className="absolute inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center p-2">
                  <div className="text-center text-white">
                    <XMarkIcon className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-xs">{image.error}</span>
                  </div>
                </div>
              )}

              {/* Remove Button */}
              <button
                onClick={() => removeImage(image.id)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                disabled={image.isUploading}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="text-center text-sm text-gray-600">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent mr-2"></div>
            Uploading images...
          </div>
        </div>
      )}
    </div>
  )
}