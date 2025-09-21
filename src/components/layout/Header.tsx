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
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md p-1">
            <Logo size="md" />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="#features"
              className="text-sm font-medium text-gray-700 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1"
            >
              Features
            </Link>
            <Link
              href="#about"
              className="text-sm font-medium text-gray-700 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1"
            >
              About
            </Link>
            <Link
              href="#contact"
              className="text-sm font-medium text-gray-700 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1"
            >
              Contact
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>
    )
  }

  if (variant === 'auth') {
    return (
      <header className="w-full border-b border-gray-200 bg-white">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md p-1">
            <Logo size="md" />
          </Link>
        </div>
      </header>
    )
  }

  // Dashboard variant - more comprehensive navigation
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md p-1">
          <Logo size="md" variant="compact" />
        </Link>

        {/* Dashboard Navigation */}
        <nav className="hidden lg:flex items-center space-x-6">
          <Link
            href="/dashboard"
            className={clsx(
              'text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1',
              pathname === '/dashboard'
                ? 'text-primary bg-primary/10'
                : 'text-gray-700 hover:text-primary hover:bg-primary/5'
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/products"
            className={clsx(
              'text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1',
              pathname.startsWith('/products')
                ? 'text-primary bg-primary/10'
                : 'text-gray-700 hover:text-primary hover:bg-primary/5'
            )}
          >
            Products
          </Link>
          <Link
            href="/orders"
            className={clsx(
              'text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1',
              pathname.startsWith('/orders')
                ? 'text-primary bg-primary/10'
                : 'text-gray-700 hover:text-primary hover:bg-primary/5'
            )}
          >
            Orders
          </Link>
          <Link
            href="/analytics"
            className={clsx(
              'text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1',
              pathname.startsWith('/analytics')
                ? 'text-primary bg-primary/10'
                : 'text-gray-700 hover:text-primary hover:bg-primary/5'
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