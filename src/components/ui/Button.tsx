import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={clsx(
          // Base styles - Enhanced for Flat Design 2.0
          'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 ease-in-out transform',
          'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-200 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-95',

          // Variant styles - Enhanced with flat design principles
          {
            // Primary - Deep red with subtle shadow
            'bg-primary-500 text-white shadow-md hover:bg-primary-600 hover:shadow-lg active:bg-primary-700 focus-visible:ring-primary-200': variant === 'primary',

            // Secondary - Blue with clean styling
            'bg-secondary-500 text-white shadow-md hover:bg-secondary-600 hover:shadow-lg active:bg-secondary-700 focus-visible:ring-secondary-200': variant === 'secondary',

            // Outline - Enhanced border with hover fill
            'bg-transparent border-2 border-primary-500 text-primary-600 shadow-sm hover:bg-primary-500 hover:text-white hover:shadow-md active:bg-primary-600 focus-visible:ring-primary-200': variant === 'outline',

            // Ghost - Subtle background with enhanced hover
            'bg-transparent text-primary-600 hover:bg-primary-50 hover:text-primary-700 active:bg-primary-100 focus-visible:bg-primary-50 focus-visible:ring-primary-200': variant === 'ghost',
          },

          // Size styles - Improved proportions
          {
            'h-9 px-4 text-sm font-medium': size === 'sm',
            'h-11 px-6 py-3 text-base': size === 'md',
            'h-13 px-8 py-4 text-lg font-semibold': size === 'lg',
          },

          className
        )}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps }