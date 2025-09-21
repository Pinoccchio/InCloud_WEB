import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'white'
}

export function LoadingSpinner({
  size = 'md',
  variant = 'primary',
  className,
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-2',
        {
          'h-4 w-4 border-t-transparent': size === 'sm',
          'h-6 w-6 border-t-transparent': size === 'md',
          'h-8 w-8 border-t-transparent': size === 'lg',
        },
        {
          'border-primary border-t-transparent': variant === 'primary',
          'border-secondary border-t-transparent': variant === 'secondary',
          'border-white border-t-transparent': variant === 'white',
        },
        className
      )}
      {...props}
    />
  )
}

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular'
  width?: string | number
  height?: string | number
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-200',
        {
          'h-4 rounded': variant === 'text',
          'rounded-md': variant === 'rectangular',
          'rounded-full': variant === 'circular',
        },
        className
      )}
      style={{
        width: width,
        height: height || (variant === 'text' ? '1rem' : undefined),
      }}
      {...props}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <Skeleton variant="rectangular" height="200px" />
      <div className="space-y-2">
        <Skeleton variant="text" width="75%" />
        <Skeleton variant="text" width="50%" />
      </div>
      <div className="flex space-x-2">
        <Skeleton variant="rectangular" width="80px" height="32px" />
        <Skeleton variant="rectangular" width="80px" height="32px" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" height="20px" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" height="16px" />
          ))}
        </div>
      ))}
    </div>
  )
}