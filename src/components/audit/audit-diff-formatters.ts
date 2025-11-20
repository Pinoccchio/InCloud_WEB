/**
 * Audit Diff Formatters
 *
 * Utility functions for formatting audit log field values for diff display.
 * Handles currency, dates, booleans, enums, and other data types.
 */

export type FieldType = 'currency' | 'date' | 'text' | 'number' | 'boolean' | 'enum' | 'array' | 'object'

/**
 * Format currency values in Philippine Peso
 */
export function formatCurrency(value: unknown): string {
  if (value === null || value === undefined) return 'N/A'

  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value)

  if (isNaN(numValue)) return String(value)

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue).replace('PHP', '₱')
}

/**
 * Format date/timestamp values
 */
export function formatDate(value: unknown): string {
  if (value === null || value === undefined) return 'N/A'

  const dateValue = typeof value === 'string' ? new Date(value) : value as Date

  if (!(dateValue instanceof Date) || isNaN(dateValue.getTime())) {
    return String(value)
  }

  return dateValue.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Format boolean values with friendly labels
 */
export function formatBoolean(value: unknown, field: string): string {
  if (value === null || value === undefined) return 'N/A'

  const boolValue = Boolean(value)

  // Contextual boolean labels
  if (field.includes('active')) {
    return boolValue ? 'Active' : 'Inactive'
  }

  if (field.includes('paid') || field.includes('completed')) {
    return boolValue ? 'Yes' : 'No'
  }

  return boolValue ? 'True' : 'False'
}

/**
 * Format enum values with human-readable labels
 */
export function formatEnum(value: unknown, field: string): string {
  if (value === null || value === undefined) return 'N/A'

  const strValue = String(value)

  // Order status enum
  if (field === 'status') {
    const statusLabels: Record<string, string> = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'in_transit': 'In Transit',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'refunded': 'Refunded'
    }
    return statusLabels[strValue] || strValue
  }

  // Payment method enum
  if (field === 'payment_method') {
    const paymentLabels: Record<string, string> = {
      'cash': 'Cash',
      'gcash': 'GCash',
      'bank_transfer': 'Bank Transfer',
      'credit_terms': 'Credit Terms'
    }
    return paymentLabels[strValue] || strValue
  }

  // Pricing type enum
  if (field === 'pricing_type') {
    const pricingLabels: Record<string, string> = {
      'wholesale': 'Wholesale',
      'retail': 'Retail',
      'bulk': 'Bulk/Box'
    }
    return pricingLabels[strValue] || strValue
  }

  // Product status enum
  if (field === 'product_status') {
    const productStatusLabels: Record<string, string> = {
      'available': 'Available',
      'unavailable': 'Unavailable',
      'discontinued': 'Discontinued'
    }
    return productStatusLabels[strValue] || strValue
  }

  // Default: capitalize first letter of each word
  return strValue
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format array values
 */
export function formatArray(value: unknown): string {
  if (value === null || value === undefined) return 'N/A'

  if (!Array.isArray(value)) return String(value)

  if (value.length === 0) return 'Empty'

  return value.join(', ')
}

/**
 * Get user-friendly field label
 */
export function getFieldLabel(field: string): string {
  const labelMap: Record<string, string> = {
    // Order fields
    'total_amount': 'Total Amount',
    'subtotal': 'Subtotal',
    'discount_amount': 'Discount',
    'payment_method': 'Payment Method',
    'gcash_reference_number': 'GCash Reference',
    'status': 'Order Status',
    'delivery_address': 'Delivery Address',
    'delivery_date': 'Delivery Date',
    'special_instructions': 'Special Instructions',

    // Product fields
    'product_name': 'Product Name',
    'product_status': 'Product Status',
    'pricing_type': 'Pricing Type',
    'price': 'Price',
    'quantity': 'Quantity',

    // Timestamp fields
    'created_at': 'Created At',
    'updated_at': 'Updated At',

    // ID fields
    'id': 'ID',
    'customer_id': 'Customer ID',
    'branch_id': 'Branch ID',
    'admin_id': 'Admin ID'
  }

  return labelMap[field] || field
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Detect field type based on field name and value
 */
export function detectFieldType(field: string, value: unknown): FieldType {
  // Currency fields
  if (field.includes('amount') || field.includes('price') || field.includes('total') || field.includes('discount')) {
    return 'currency'
  }

  // Date fields
  if (field.includes('date') || field.includes('_at')) {
    return 'date'
  }

  // Boolean fields
  if (typeof value === 'boolean' || field.includes('is_') || field.includes('has_')) {
    return 'boolean'
  }

  // Array fields
  if (Array.isArray(value)) {
    return 'array'
  }

  // Object fields
  if (typeof value === 'object' && value !== null) {
    return 'object'
  }

  // Enum fields (known enum fields)
  if (field === 'status' || field === 'payment_method' || field === 'pricing_type' || field === 'product_status') {
    return 'enum'
  }

  // Number fields
  if (typeof value === 'number') {
    return 'number'
  }

  // Default to text
  return 'text'
}

/**
 * Format value based on detected type
 */
export function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return 'N/A'

  const fieldType = detectFieldType(field, value)

  switch (fieldType) {
    case 'currency':
      return formatCurrency(value)
    case 'date':
      return formatDate(value)
    case 'boolean':
      return formatBoolean(value, field)
    case 'enum':
      return formatEnum(value, field)
    case 'array':
      return formatArray(value)
    case 'object':
      return JSON.stringify(value, null, 2)
    case 'number':
      return String(value)
    case 'text':
    default:
      return String(value)
  }
}

/**
 * Calculate change magnitude for numeric fields
 */
export function calculateChangeMagnitude(oldValue: unknown, newValue: unknown): { amount: number; percentage: number | null } | null {
  const oldNum = typeof oldValue === 'string' ? parseFloat(oldValue) : Number(oldValue)
  const newNum = typeof newValue === 'string' ? parseFloat(newValue) : Number(newValue)

  if (isNaN(oldNum) || isNaN(newNum)) return null

  const amount = newNum - oldNum
  const percentage = oldNum !== 0 ? ((amount / oldNum) * 100) : null

  return { amount, percentage }
}
