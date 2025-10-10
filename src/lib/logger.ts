/**
 * Terminal Logger Utility for InCloud Web Application
 *
 * Provides structured console logging with colors and formatting
 * for tracking operations, data fetching, and debugging
 */

type LogLevel = 'DEBUG' | 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'FATAL'

interface LogContext {
  service?: string
  operation?: string
  userId?: string
  adminId?: string
  branchId?: string
  requestId?: string
  [key: string]: any
}

interface TimerStore {
  [key: string]: number
}

class Logger {
  private isDevelopment: boolean
  private timers: TimerStore = {}

  // ANSI color codes for terminal
  private colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',

    // Foreground colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
  }

  // Emoji icons for different log levels
  private icons = {
    DEBUG: '🔍',
    INFO: '📋',
    SUCCESS: '✅',
    WARN: '⚠️',
    ERROR: '❌',
    FATAL: '💀',
    TIME: '⏱️',
    FETCH: '🔄',
    DB: '💾',
    API: '🌐',
  }

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production'
  }

  /**
   * Format timestamp for logs
   */
  private getTimestamp(): string {
    const now = new Date()
    return now.toISOString().split('T')[1].split('.')[0] // HH:MM:SS
  }

  /**
   * Format log message with color and context
   */
  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): string {
    const timestamp = this.getTimestamp()
    const icon = this.icons[level]

    let color = this.colors.reset
    switch (level) {
      case 'DEBUG':
        color = this.colors.gray
        break
      case 'INFO':
        color = this.colors.blue
        break
      case 'SUCCESS':
        color = this.colors.green
        break
      case 'WARN':
        color = this.colors.yellow
        break
      case 'ERROR':
      case 'FATAL':
        color = this.colors.red
        break
    }

    // Build the log line
    let logLine = `${this.colors.gray}[${timestamp}]${this.colors.reset} `
    logLine += `${color}${icon} [${level}]${this.colors.reset} `

    // Add service/operation if provided
    if (context?.service) {
      logLine += `${this.colors.cyan}${context.service}${this.colors.reset} `
    }
    if (context?.operation) {
      logLine += `${this.colors.dim}(${context.operation})${this.colors.reset} `
    }

    logLine += `${color}${message}${this.colors.reset}`

    return logLine
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return

    const formatted = this.formatMessage('DEBUG', message, context)
    console.log(formatted)

    if (context && Object.keys(context).filter(k => !['service', 'operation'].includes(k)).length > 0) {
      console.log(this.colors.gray, context, this.colors.reset)
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    const formatted = this.formatMessage('INFO', message, context)
    console.log(formatted)

    if (context && this.isDevelopment) {
      const filteredContext = { ...context }
      delete filteredContext.service
      delete filteredContext.operation
      if (Object.keys(filteredContext).length > 0) {
        console.log(this.colors.dim, filteredContext, this.colors.reset)
      }
    }
  }

  /**
   * Log successful operations
   */
  success(message: string, context?: LogContext): void {
    const formatted = this.formatMessage('SUCCESS', message, context)
    console.log(formatted)

    if (context?.duration) {
      console.log(`${this.colors.gray}  └─ Duration: ${context.duration}ms${this.colors.reset}`)
    }
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: LogContext): void {
    const formatted = this.formatMessage('WARN', message, context)
    console.warn(formatted)

    if (context && this.isDevelopment) {
      console.warn(this.colors.yellow, context, this.colors.reset)
    }
  }

  /**
   * Log errors
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const formatted = this.formatMessage('ERROR', message, context, error)
    console.error(formatted)

    if (error) {
      console.error(`${this.colors.red}  └─ Error: ${error.message}${this.colors.reset}`)
      if (this.isDevelopment && error.stack) {
        console.error(`${this.colors.gray}${error.stack}${this.colors.reset}`)
      }
    }

    if (context && this.isDevelopment) {
      console.error(this.colors.red, context, this.colors.reset)
    }
  }

  /**
   * Log fatal errors (always logged, even in production)
   */
  fatal(message: string, error?: Error, context?: LogContext): void {
    const formatted = this.formatMessage('FATAL', message, context, error)
    console.error(formatted)

    if (error) {
      console.error(`${this.colors.red}${this.colors.bright}  └─ Fatal Error: ${error.message}${this.colors.reset}`)
      if (error.stack) {
        console.error(`${this.colors.red}${error.stack}${this.colors.reset}`)
      }
    }

    if (context) {
      console.error(this.colors.red, context, this.colors.reset)
    }
  }

  /**
   * Start a timer for performance tracking
   */
  time(label: string, context?: LogContext): void {
    this.timers[label] = Date.now()

    if (this.isDevelopment) {
      const msg = `${this.icons.TIME} Timer started: ${label}`
      console.log(`${this.colors.gray}${msg}${this.colors.reset}`)
    }
  }

  /**
   * End a timer and log the duration
   */
  timeEnd(label: string, context?: LogContext): number {
    const startTime = this.timers[label]
    if (!startTime) {
      this.warn(`Timer "${label}" does not exist`, context)
      return 0
    }

    const duration = Date.now() - startTime
    delete this.timers[label]

    const msg = `${this.icons.TIME} Timer ended: ${label} - ${duration}ms`
    const color = duration > 1000 ? this.colors.red : duration > 500 ? this.colors.yellow : this.colors.green
    console.log(`${color}${msg}${this.colors.reset}`)

    return duration
  }

  /**
   * Log database queries
   */
  db(operation: string, table: string, context?: LogContext): void {
    const msg = `${this.icons.DB} DB ${operation}: ${table}`
    const formatted = this.formatMessage('INFO', msg, { ...context, service: 'Database' })
    console.log(formatted)
  }

  /**
   * Log API requests
   */
  api(method: string, path: string, context?: LogContext): void {
    const msg = `${this.icons.API} ${method} ${path}`
    const formatted = this.formatMessage('INFO', msg, { ...context, service: 'API' })
    console.log(formatted)
  }

  /**
   * Log data fetching operations
   */
  fetch(message: string, context?: LogContext): void {
    const msg = `${this.icons.FETCH} ${message}`
    const formatted = this.formatMessage('INFO', msg, { ...context, service: context?.service || 'DataFetch' })
    console.log(formatted)
  }

  /**
   * Create a child logger with preset context
   */
  child(defaultContext: LogContext): ChildLogger {
    return new ChildLogger(this, defaultContext)
  }

  /**
   * Log a separator line (useful for grouping logs)
   */
  separator(label?: string): void {
    if (!this.isDevelopment) return

    const line = '─'.repeat(80)
    if (label) {
      const paddedLabel = ` ${label} `
      const padding = Math.floor((80 - paddedLabel.length) / 2)
      const sep = '─'.repeat(padding) + paddedLabel + '─'.repeat(padding)
      console.log(`${this.colors.gray}${sep}${this.colors.reset}`)
    } else {
      console.log(`${this.colors.gray}${line}${this.colors.reset}`)
    }
  }

  /**
   * Group related logs together (collapsible in some terminals)
   */
  group(label: string): void {
    if (!this.isDevelopment) return
    console.group(`${this.colors.cyan}${label}${this.colors.reset}`)
  }

  /**
   * End a log group
   */
  groupEnd(): void {
    if (!this.isDevelopment) return
    console.groupEnd()
  }
}

/**
 * Child logger with preset context
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private defaultContext: LogContext
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.defaultContext, ...context }
  }

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context))
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context))
  }

  success(message: string, context?: LogContext): void {
    this.parent.success(message, this.mergeContext(context))
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.mergeContext(context))
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.parent.error(message, error, this.mergeContext(context))
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    this.parent.fatal(message, error, this.mergeContext(context))
  }

  time(label: string, context?: LogContext): void {
    this.parent.time(label, this.mergeContext(context))
  }

  timeEnd(label: string, context?: LogContext): number {
    return this.parent.timeEnd(label, this.mergeContext(context))
  }

  db(operation: string, table: string, context?: LogContext): void {
    this.parent.db(operation, table, this.mergeContext(context))
  }

  api(method: string, path: string, context?: LogContext): void {
    this.parent.api(method, path, this.mergeContext(context))
  }

  fetch(message: string, context?: LogContext): void {
    this.parent.fetch(message, this.mergeContext(context))
  }
}

// Export singleton instance
export const logger = new Logger()

// Export types
export type { LogContext, LogLevel }
