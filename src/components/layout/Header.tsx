'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui'
import { Button } from '@/components/ui'
import { clsx } from 'clsx'

interface HeaderProps {
  variant?: 'landing' | 'auth' | 'dashboard'
}

export function Header({ variant = 'landing' }: HeaderProps) {
  const pathname = usePathname()

  if (variant === 'landing') {
    return (
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 shadow-md border-b border-gray-200/50">
        <div className="container mx-auto flex h-18 items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 rounded-lg p-2 transition-all hover:bg-gray-50">
            <Logo size="md" />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            <Link
              href="#features"
              className="text-sm font-semibold text-gray-900 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 rounded-lg px-4 py-2"
            >
              Features
            </Link>
            <Link
              href="#about"
              className="text-sm font-semibold text-gray-900 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 rounded-lg px-4 py-2"
            >
              About
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button size="sm" className="font-semibold shadow-md hover:shadow-lg">
                Admin Login
              </Button>
            </Link>
          </div>
        </div>
      </header>
    )
  }

  if (variant === 'auth') {
    return (
      <header className="w-full bg-white shadow-sm border-b border-gray-200/50">
        <div className="container mx-auto flex h-18 items-center px-6">
          <Link href="/" className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 rounded-lg p-2 transition-all hover:bg-gray-50">
            <Logo size="md" />
          </Link>
        </div>
      </header>
    )
  }

  // Dashboard variant - more comprehensive navigation
  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-md border-b border-gray-200/50">
      <div className="container mx-auto flex h-18 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 rounded-lg p-2 transition-all hover:bg-gray-50">
          <Logo size="md" variant="compact" />
        </Link>

        {/* Dashboard Navigation */}
        <nav className="hidden lg:flex items-center space-x-2">
          <Link
            href="/dashboard"
            className={clsx(
              'text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 rounded-lg px-4 py-2',
              pathname === '/dashboard'
                ? 'text-primary-600 bg-primary-100'
                : 'text-gray-900 hover:text-primary-600 hover:bg-primary-50'
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/products"
            className={clsx(
              'text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 rounded-lg px-4 py-2',
              pathname.startsWith('/products')
                ? 'text-primary-600 bg-primary-100'
                : 'text-gray-900 hover:text-primary-600 hover:bg-primary-50'
            )}
          >
            Products
          </Link>
          <Link
            href="/orders"
            className={clsx(
              'text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 rounded-lg px-4 py-2',
              pathname.startsWith('/orders')
                ? 'text-primary-600 bg-primary-100'
                : 'text-gray-900 hover:text-primary-600 hover:bg-primary-50'
            )}
          >
            Orders
          </Link>
          <Link
            href="/analytics"
            className={clsx(
              'text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 rounded-lg px-4 py-2',
              pathname.startsWith('/analytics')
                ? 'text-primary-600 bg-primary-100'
                : 'text-gray-900 hover:text-primary-600 hover:bg-primary-50'
            )}
          >
            Analytics
          </Link>
        </nav>

        {/* User Menu */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm">
            Profile
          </Button>
          <Button variant="ghost" size="sm">
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}