/**
 * Philippine Timezone Utility Functions
 * Handles consistent date operations for Philippine timezone (Asia/Manila, UTC+8)
 */

/**
 * Get current Philippine date in YYYY-MM-DD format
 * @returns Current Philippine date as string (YYYY-MM-DD)
 */
export function getPhilippineDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila'
  }).format(new Date())
}

/**
 * Get current Philippine datetime as ISO string for database storage
 * @returns Current Philippine datetime in ISO format
 */
export function getPhilippineDateTime(): string {
  const now = new Date()
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' })).toISOString()
}

/**
 * Convert a date string to Philippine timezone-aware date for comparison
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object adjusted for Philippine timezone
 */
export function toPhilippineDate(dateString: string): Date {
  // Create date at Philippine midnight
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day) // month is 0-indexed
}

/**
 * Check if a date string represents today in Philippine timezone
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns True if the date is today in Philippine timezone
 */
export function isToday(dateString: string): boolean {
  return dateString === getPhilippineDate()
}

/**
 * Check if a date string is in the future relative to Philippine timezone
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns True if the date is in the future
 */
export function isFutureDate(dateString: string): boolean {
  const today = getPhilippineDate()
  return dateString > today
}

/**
 * Check if a date string is in the past relative to Philippine timezone
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns True if the date is in the past
 */
export function isPastDate(dateString: string): boolean {
  const today = getPhilippineDate()
  return dateString < today
}

/**
 * Get a date string that is N days from today in Philippine timezone
 * @param days - Number of days to add (positive) or subtract (negative)
 * @returns Date string in YYYY-MM-DD format
 */
export function getPhilippineDateOffset(days: number): string {
  const philippineNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
  philippineNow.setDate(philippineNow.getDate() + days)

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila'
  }).format(philippineNow)
}

/**
 * Format a date string for display in Philippine format
 * @param dateString - Date string in YYYY-MM-DD format
 * @param format - Format type: 'short' (MM/DD/YYYY) or 'long' (Month DD, YYYY)
 * @returns Formatted date string
 */
export function formatPhilippineDate(dateString: string, format: 'short' | 'long' = 'short'): string {
  const date = new Date(dateString + 'T00:00:00')

  if (format === 'long') {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Manila'
    })
  }

  // Default short format: MM/DD/YYYY
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Manila'
  })
}

/**
 * Convert form datetime-local input to Philippine timezone ISO string for database
 * @param datetimeLocalString - Datetime string from datetime-local input
 * @returns ISO string adjusted for Philippine timezone
 */
export function philippineDatetimeToUTC(datetimeLocalString: string): string {
  // Assume the datetime-local is in Philippine timezone
  const date = new Date(datetimeLocalString)
  // Adjust for Philippine timezone offset (UTC+8)
  date.setHours(date.getHours() - 8)
  return date.toISOString()
}

/**
 * Get minimum date for date inputs (today in Philippine timezone)
 * @returns Date string in YYYY-MM-DD format for min attribute
 */
export function getMinDate(): string {
  return getPhilippineDate()
}

/**
 * Get maximum reasonable expiration date (5 years from now in Philippine timezone)
 * @returns Date string in YYYY-MM-DD format
 */
export function getMaxExpirationDate(): string {
  return getPhilippineDateOffset(365 * 5) // 5 years from now
}