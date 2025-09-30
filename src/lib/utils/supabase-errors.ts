/**
 * Supabase Error Utility
 * Parses and formats Supabase database errors for better debugging and user feedback
 */

import { PostgrestError } from '@supabase/supabase-js'

export interface ParsedSupabaseError {
  message: string
  details: string | null
  hint: string | null
  code: string | null
  fullError: string
  isRLSError: boolean
  isConstraintError: boolean
  isFunctionError: boolean
}

/**
 * Parse Supabase/PostgreSQL errors into a structured format
 */
export function parseSupabaseError(error: unknown): ParsedSupabaseError {
  // Default error structure
  const parsed: ParsedSupabaseError = {
    message: 'An unknown error occurred',
    details: null,
    hint: null,
    code: null,
    fullError: JSON.stringify(error, null, 2),
    isRLSError: false,
    isConstraintError: false,
    isFunctionError: false
  }

  // Handle PostgrestError (Supabase/PostgREST errors)
  if (error && typeof error === 'object' && 'message' in error) {
    const postgrestError = error as PostgrestError

    parsed.message = postgrestError.message || 'Database operation failed'
    parsed.details = postgrestError.details || null
    parsed.hint = postgrestError.hint || null
    parsed.code = postgrestError.code || null

    // Detect error types
    parsed.isRLSError =
      postgrestError.code === '42501' || // insufficient_privilege
      postgrestError.code === 'PGRST301' || // Row-level security policy violation
      postgrestError.message?.toLowerCase().includes('row-level security') ||
      postgrestError.message?.toLowerCase().includes('rls') ||
      false

    parsed.isConstraintError =
      postgrestError.code === '23505' || // unique_violation
      postgrestError.code === '23503' || // foreign_key_violation
      postgrestError.code === '23502' || // not_null_violation
      postgrestError.code === '23514' || // check_violation
      postgrestError.code === 'PGRST116' || // 409 Conflict (from upsert without onConflict)
      postgrestError.message?.toLowerCase().includes('constraint') ||
      postgrestError.message?.toLowerCase().includes('duplicate') ||
      postgrestError.message?.toLowerCase().includes('conflict') ||
      false

    parsed.isFunctionError =
      postgrestError.code?.startsWith('P00') || // Function-raised exceptions
      postgrestError.message?.toLowerCase().includes('function') ||
      false
  }
  // Handle standard Error objects
  else if (error instanceof Error) {
    parsed.message = error.message
    parsed.fullError = error.stack || error.toString()
  }
  // Handle string errors
  else if (typeof error === 'string') {
    parsed.message = error
    parsed.fullError = error
  }

  return parsed
}

/**
 * Format error for display to users (user-friendly message)
 */
export function formatErrorForUser(parsed: ParsedSupabaseError): string {
  // RLS errors - more specific guidance
  if (parsed.isRLSError) {
    return `Permission denied: You don't have access to perform this operation. ${parsed.hint || 'Please contact your administrator.'}`
  }

  // Constraint errors - specific guidance
  if (parsed.isConstraintError) {
    if (parsed.message.toLowerCase().includes('duplicate') || parsed.code === '23505') {
      if (parsed.message.toLowerCase().includes('sku')) {
        return 'This SKU is already in use. Please use a unique SKU.'
      }
      if (parsed.message.toLowerCase().includes('barcode')) {
        return 'This barcode is already in use. Please use a unique barcode.'
      }
      if (parsed.message.toLowerCase().includes('notification_settings')) {
        return 'A settings record already exists for this branch and admin. Please refresh and try again.'
      }
      return 'A record with this information already exists. Please check for duplicates.'
    }

    if (parsed.message.toLowerCase().includes('foreign key') || parsed.code === '23503') {
      return 'Invalid reference: The selected category or brand may no longer exist. Please refresh and try again.'
    }

    if (parsed.message.toLowerCase().includes('not null') || parsed.code === '23502') {
      return 'Required field missing: Please ensure all required fields are filled.'
    }
  }

  // Function errors - show detailed message from database
  if (parsed.isFunctionError) {
    // Extract the main error message (remove technical details)
    const cleanMessage = parsed.message
      .replace(/^Error invoking Database Function:?\s*/i, '')
      .replace(/^Function error:?\s*/i, '')
      .trim()

    return cleanMessage || 'Database operation failed. Please try again.'
  }

  // Default: use the message from the error
  return parsed.message || 'An unexpected error occurred. Please try again.'
}

/**
 * Format error for console logging (detailed technical information)
 */
export function formatErrorForConsole(parsed: ParsedSupabaseError, context?: string): string {
  const lines: string[] = []

  if (context) {
    lines.push(`❌ Error in ${context}`)
    lines.push('━'.repeat(80))
  }

  lines.push(`Message: ${parsed.message}`)

  if (parsed.code) {
    lines.push(`Code: ${parsed.code}`)
  }

  if (parsed.details) {
    lines.push(`Details: ${parsed.details}`)
  }

  if (parsed.hint) {
    lines.push(`Hint: ${parsed.hint}`)
  }

  lines.push('')
  lines.push('Error Type:')
  if (parsed.isRLSError) lines.push('  • Row-Level Security (RLS) violation')
  if (parsed.isConstraintError) lines.push('  • Database constraint violation')
  if (parsed.isFunctionError) lines.push('  • Database function error')
  if (!parsed.isRLSError && !parsed.isConstraintError && !parsed.isFunctionError) {
    lines.push('  • General database error')
  }

  lines.push('')
  lines.push('Full Error Object:')
  lines.push(parsed.fullError)

  if (context) {
    lines.push('━'.repeat(80))
  }

  return lines.join('\n')
}

/**
 * Log error to console with formatting
 */
export function logSupabaseError(error: unknown, context?: string): ParsedSupabaseError {
  const parsed = parseSupabaseError(error)
  const formatted = formatErrorForConsole(parsed, context)
  console.error(formatted)
  return parsed
}

/**
 * Get a complete error report for displaying to users and logging
 */
export function getErrorReport(error: unknown, context?: string): {
  userMessage: string
  consoleLog: string
  parsed: ParsedSupabaseError
} {
  const parsed = parseSupabaseError(error)
  const userMessage = formatErrorForUser(parsed)
  const consoleLog = formatErrorForConsole(parsed, context)

  return {
    userMessage,
    consoleLog,
    parsed
  }
}