import { HTMLAttributes } from 'react'
import Image from 'next/image'
import { clsx } from 'clsx'

interface LogoProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  variant?: 'full' | 'compact'
  showText?: boolean
}

export function Logo({
  size = 'md',
  variant = 'full',
  showText = true,
  className,
  ...props
}: LogoProps) {
  const sizeMap = {
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 48, height: 48 },
    xl: { width: 64, height: 64 },
    '2xl': { width: 96, height: 96 },
  }

  const logoSize = sizeMap[size]

  return (
    <div
      className={clsx('flex items-center', {
        'space-x-3': showText && variant === 'full',
        'space-x-2': showText && variant === 'compact',
      }, className)}
      {...props}
    >
      {/* Actual J.A's Logo Image */}
      <div className="relative flex-shrink-0">
        <Image
          src="/logo/primary-logo.png"
          alt="J.A's Food Trading Logo"
          width={logoSize.width}
          height={logoSize.height}
          className="object-contain"
          priority
        />
      </div>

      {/* Company Text - Show based on variant and showText prop */}
      {showText && variant === 'full' && (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
            J.A&apos;s Food Trading
          </span>
          <span className="text-xs text-gray-800 leading-tight font-semibold">
            EST. 2018
          </span>
        </div>
      )}

      {showText && variant === 'compact' && (
        <span className="font-bold text-gray-900 text-sm leading-tight">
          J.A&apos;s
        </span>
      )}
    </div>
  )
}

export function InCloudLogo({
  size = 'md',
  className,
  showText = true,
  ...props
}: Omit<LogoProps, 'variant'>) {
  const sizeMap = {
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 48, height: 48 },
    xl: { width: 64, height: 64 },
  }

  const logoSize = sizeMap[size]

  return (
    <div
      className={clsx('flex items-center', {
        'space-x-3': showText,
      }, className)}
      {...props}
    >
      {/* InCloud Logo - Combination of J.A's logo and system branding */}
      <div className="relative flex-shrink-0">
        <Image
          src="/logo/primary-logo.png"
          alt="InCloud by J.A's Food Trading"
          width={logoSize.width}
          height={logoSize.height}
          className="object-contain"
          priority
        />
      </div>

      {/* System Name */}
      {showText && (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
            InCloud
          </span>
          <span className="text-xs text-gray-800 leading-tight font-semibold">
            Inventory Management
          </span>
        </div>
      )}
    </div>
  )
}

// Fallback Logo Component (in case image fails to load)
export function FallbackLogo({ size = 'md', variant = 'full', className, ...props }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16',
  }

  return (
    <div
      className={clsx('flex items-center space-x-3', className)}
      {...props}
    >
      {/* Fallback Logo Icon */}
      <div className={clsx(
        'relative flex items-center justify-center rounded-full bg-primary border-2 border-accent',
        sizeClasses[size],
        'aspect-square'
      )}>
        <span className="text-white font-bold text-xs sm:text-sm">JA</span>
      </div>

      {/* Company Name */}
      {variant === 'full' && (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 text-sm sm:text-base">
            J.A&apos;s Food Trading
          </span>
          <span className="text-xs text-gray-800 font-semibold">
            EST. 2018
          </span>
        </div>
      )}
    </div>
  )
}