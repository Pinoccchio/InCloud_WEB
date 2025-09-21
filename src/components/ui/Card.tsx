import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'surface' | 'accent'
  interactive?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', interactive = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          // Base styles - Enhanced for Flat Design 2.0
          'rounded-xl transition-all duration-200 ease-in-out',
          {
            // Interactive cards have hover effects
            'hover:shadow-lg hover:-translate-y-1 cursor-pointer': interactive,
          },

          // Variant styles - Enhanced with better shadows and surfaces
          {
            // Default - Clean border with subtle shadow
            'bg-white border border-gray-200 shadow-sm hover:shadow-md': variant === 'default',

            // Elevated - Prominent shadow for important content
            'bg-white shadow-md border border-gray-100 hover:shadow-lg': variant === 'elevated',

            // Outlined - Strong border for emphasis
            'bg-white border-2 border-gray-300 hover:border-primary-300 hover:shadow-sm': variant === 'outlined',

            // Surface - Subtle background for sections
            'bg-gray-50 border border-gray-200 shadow-sm hover:bg-white hover:shadow-md': variant === 'surface',

            // Accent - Brand-colored background
            'bg-primary-50 border border-primary-200 shadow-sm hover:bg-primary-100 hover:shadow-md': variant === 'accent',
          },

          className
        )}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'

const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx('flex flex-col space-y-2 p-6 pb-4', className)}
    {...props}
  />
))

CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={clsx('text-xl font-bold leading-tight text-gray-900 mb-1', className)}
    {...props}
  />
))

CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={clsx('text-base text-gray-700 leading-relaxed', className)}
    {...props}
  />
))

CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={clsx('p-6 pt-2', className)} {...props} />
))

CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx('flex items-center justify-between p-6 pt-4 border-t border-gray-100', className)}
    {...props}
  />
))

CardFooter.displayName = 'CardFooter'

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}
export type { CardProps }