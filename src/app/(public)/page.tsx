'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Card, CardDescription, CardHeader, CardTitle, LoadingSpinner } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import QRCode from 'react-qr-code'

export default function Home() {
  const { isAuthenticated, isLoading, admin } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to role-specific dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && admin) {
      // Direct redirect based on role
      if (admin.role === 'super_admin') {
        router.push('/super-admin/dashboard')
      } else if (admin.role === 'admin') {
        router.push('/admin/dashboard')
      }
    }
  }, [isAuthenticated, isLoading, admin, router])

  // Show loading while checking auth status or waiting for admin data
  if (isLoading || (isAuthenticated && !admin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Don't render if authenticated (redirect is happening)
  if (isAuthenticated && admin) {
    return null
  }
  return (
    <>
        {/* Hero Section - Enhanced Flat Design 2.0 */}
        <section className="relative bg-white py-24 lg:py-32 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50"></div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="max-w-5xl mx-auto">
              {/* Main headline with improved typography */}
              <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
                Professional Inventory
                <br />
                <span className="text-primary-600">Management System</span>
                <br />
                <span className="text-secondary-600 text-4xl lg:text-5xl">for J.A&apos;s Food Trading</span>
              </h1>

              {/* Enhanced subtitle */}
              <p className="text-xl lg:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed font-medium">
                Transform your frozen food distribution with our comprehensive cloud-based platform.
                <span className="block mt-2 text-primary-600 font-semibold">
                  Real-time tracking • Advanced analytics • Centralized operations
                </span>
              </p>

              {/* Trust indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-1">35+</div>
                  <div className="text-sm text-gray-600 font-medium">Active Products</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary-600 mb-1">2018</div>
                  <div className="text-sm text-gray-600 font-medium">Established Since</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent-600 mb-1">24/7</div>
                  <div className="text-sm text-gray-600 font-medium">System Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Enhanced Flat Design 2.0 */}
        <section id="features" className="py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-20">
              <div className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-4">
                Core Features
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
                Everything You Need for
                <span className="block text-primary-600">Modern Inventory Management</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Built specifically for frozen food trading with enterprise-grade features that scale with your business operations
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card variant="elevated" interactive>
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <CardTitle className="text-gray-900">Real-time Inventory Tracking</CardTitle>
                  <CardDescription className="text-gray-600">
                    Monitor stock levels across branch operations in Sampaloc, Manila with instant updates and automated alerts
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card variant="elevated" interactive>
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <CardTitle className="text-gray-900">Smart Expiration Management</CardTitle>
                  <CardDescription className="text-gray-600">
                    Advanced tracking for frozen goods with AI-powered alerts for optimal product rotation and minimal waste
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card variant="elevated" interactive>
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <CardTitle className="text-gray-900">Advanced Analytics Engine</CardTitle>
                  <CardDescription className="text-gray-600">
                    Descriptive and prescriptive analytics with actionable insights for pricing optimization and demand forecasting
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card variant="elevated" interactive>
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <CardTitle className="text-gray-900">Mobile Customer Experience</CardTitle>
                  <CardDescription className="text-gray-600">
                    Native Flutter mobile app with seamless product browsing, cart management, and order tracking for customers
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card variant="elevated" interactive>
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <CardTitle className="text-gray-900">Flexible Pricing System</CardTitle>
                  <CardDescription className="text-gray-600">
                    Handle complex pricing structures including wholesale, retail, and bulk pricing with automated calculations
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card variant="elevated" interactive>
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-primary-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <CardTitle className="text-gray-900">Enterprise Synchronization</CardTitle>
                  <CardDescription className="text-gray-600">
                    Real-time data sync between web and mobile platforms with enterprise-grade security and reliability
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Mobile App Download Section */}
        <section className="py-24 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* Section header */}
              <div className="text-center mb-12">
                <div className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-4">
                  Mobile App
                </div>
                <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
                  Download the
                  <span className="block text-primary-600">InCloud Mobile App</span>
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Access your inventory on the go. Browse products, manage orders, and track stock levels from your mobile device.
                </p>
              </div>

              {/* Download content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left side - QR Code and Download Link */}
                <div className="flex flex-col items-center lg:items-start space-y-6">
                  <Card variant="elevated" className="p-8 bg-white">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Scan to Download</h3>
                      <div className="bg-white p-6 rounded-xl inline-block shadow-lg">
                        <QRCode
                          value="https://drive.google.com/drive/folders/1b_-4JENADwl0j6C6cJJk9X-kUNZbaDWq?usp=sharing"
                          size={200}
                          level="H"
                          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-4">Scan with your phone camera</p>
                    </div>
                  </Card>

                  <div className="w-full">
                    <a
                      href="https://drive.google.com/drive/folders/1b_-4JENADwl0j6C6cJJk9X-kUNZbaDWq?usp=sharing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button
                        size="lg"
                        className="w-full px-8 py-4 text-lg shadow-lg hover:shadow-xl"
                      >
                        📥 Download APK from Google Drive
                      </Button>
                    </a>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Direct download link • Compatible with Android devices
                    </p>
                  </div>
                </div>

                {/* Right side - Features and Instructions */}
                <div className="space-y-6">
                  <Card variant="surface" className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Installation Guide</h3>
                    <ol className="space-y-3 text-gray-700">
                      <li className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                        <span><strong>Download</strong> the APK file from the link above or scan the QR code</span>
                      </li>
                      <li className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                        <span><strong>Enable</strong> &ldquo;Install from unknown sources&rdquo; in your phone settings if prompted</span>
                      </li>
                      <li className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                        <span><strong>Open</strong> the downloaded APK file and follow the installation steps</span>
                      </li>
                      <li className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
                        <span><strong>Launch</strong> InCloud and sign in with your account credentials</span>
                      </li>
                    </ol>
                  </Card>

                  <Card variant="surface" className="p-6 bg-primary-50 border-primary-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">App Features</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-center">
                        <span className="text-primary-600 mr-2">✓</span>
                        Browse complete product catalog with images
                      </li>
                      <li className="flex items-center">
                        <span className="text-primary-600 mr-2">✓</span>
                        Real-time inventory stock levels
                      </li>
                      <li className="flex items-center">
                        <span className="text-primary-600 mr-2">✓</span>
                        Place and track orders on the go
                      </li>
                      <li className="flex items-center">
                        <span className="text-primary-600 mr-2">✓</span>
                        Receive instant notifications
                      </li>
                      <li className="flex items-center">
                        <span className="text-primary-600 mr-2">✓</span>
                        Manage your shopping cart
                      </li>
                    </ul>
                  </Card>
                </div>
              </div>

              {/* Note about Android */}
              <div className="mt-12 text-center">
                <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Currently available for Android devices. iOS version coming soon. Make sure to download from the official Google Drive link provided above.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section - Enhanced Flat Design 2.0 */}
        <section id="about" className="py-24 bg-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-secondary-500"></div>

          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* Section header */}
              <div className="text-center mb-16">
                <div className="inline-block px-4 py-2 bg-secondary-100 text-secondary-700 rounded-full text-sm font-semibold mb-4">
                  About Us
                </div>
                <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
                  Trusted Partner Since
                  <span className="block text-primary-600">2018</span>
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Serving Manila&apos;s frozen food distribution industry with innovative technology and reliable service
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <Card variant="elevated" interactive className="text-center p-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Centralized Hub</h3>
                  <p className="text-gray-600 font-medium">Main operations in Sampaloc, Manila</p>
                </Card>

                <Card variant="elevated" interactive className="text-center p-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-3xl font-extrabold text-white">6+</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Years Experience</h3>
                  <p className="text-gray-600 font-medium">Proven track record in food distribution</p>
                </Card>

                <Card variant="elevated" interactive className="text-center p-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-accent-500 to-accent-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-lg font-extrabold text-white">24/7</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">System Uptime</h3>
                  <p className="text-gray-600 font-medium">Reliable infrastructure for your business</p>
                </Card>
              </div>

              {/* Company story */}
              <Card variant="surface" className="p-10 text-center">
                <div className="max-w-4xl mx-auto">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Leading Innovation in Frozen Food Distribution
                  </h3>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    Based in the heart of Sampaloc, Manila, J.A&apos;s Food Trading has been at the forefront
                    of frozen food distribution since 2018. Our commitment to quality, innovation, and
                    customer satisfaction drives us to continuously improve our operations.
                  </p>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    InCloud represents our dedication to digital transformation, providing a comprehensive
                    solution that addresses the unique challenges of frozen food inventory management while
                    empowering our team and customers with cutting-edge technology.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

    </>
  )
}
