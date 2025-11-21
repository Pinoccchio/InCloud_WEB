'use client'

import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { clsx } from 'clsx'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  showPasswordToggle?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, showPasswordToggle, id, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const isPasswordField = type === 'password'
    const shouldShowToggle = isPasswordField && showPasswordToggle
    const inputType = isPasswordField && showPassword ? 'text' : type

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            id={inputId}
            type={inputType}
            className={clsx(
              'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white placeholder:text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              {
                'border-error focus:border-error focus:ring-error': error,
                'pr-12': shouldShowToggle,
              },
              className
            )}
            ref={ref}
            {...props}
          />

          {shouldShowToggle && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          )}
        </div>

        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-600">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
export type { InputProps }