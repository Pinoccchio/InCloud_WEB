import Link from 'next/link'
import { Button, Card, CardDescription, CardHeader, CardTitle } from '@/components/ui'

export default function Home() {
  return (
    <>
        {/* Hero Section - Enhanced Flat Design 2.0 */}
        <section className="relative bg-white py-24 lg:py-32 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50"></div>
          <div className="absolute top-0 right-0 w-1/3 h-full bg-primary-500 opacity-5 transform skew-x-12 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-1/4 h-2/3 bg-secondary-500 opacity-5 transform -skew-x-12 -translate-x-1/4"></div>

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
              <p className="text-xl lg:text-2xl text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed font-medium">
                Transform your frozen food distribution with our comprehensive cloud-based platform.
                <span className="block mt-2 text-primary-600 font-semibold">
                  Real-time tracking • Advanced analytics • Multi-branch coordination
                </span>
              </p>

              {/* Enhanced call-to-action buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto px-8 py-4 text-lg shadow-lg hover:shadow-xl">
                    🚀 Get Started Free
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-4 text-lg">
                    👤 Admin Login
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-1">3</div>
                  <div className="text-sm text-gray-600 font-medium">Active Branches</div>
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
                🔥 Core Features
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
                    Monitor stock levels across all 3 branches in Sampaloc, Manila with instant updates and automated alerts
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
                    Handle complex pricing structures including wholesale, retail, and box pricing with automated calculations
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

        {/* About Section - Enhanced Flat Design 2.0 */}
        <section id="about" className="py-24 bg-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-secondary-500"></div>

          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* Section header */}
              <div className="text-center mb-16">
                <div className="inline-block px-4 py-2 bg-secondary-100 text-secondary-700 rounded-full text-sm font-semibold mb-4">
                  🏢 About Our Company
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
                    <span className="text-3xl font-extrabold text-white">3</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Active Branches</h3>
                  <p className="text-gray-600 font-medium">Strategically located across Sampaloc, Manila</p>
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

        {/* CTA Section - Enhanced Flat Design 2.0 */}
        <section id="contact" className="py-24 bg-gradient-to-br from-primary-600 to-primary-700 text-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-secondary-500 opacity-10 transform skew-x-12 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-1/4 h-2/3 bg-accent-500 opacity-15 transform -skew-x-12 -translate-x-1/4"></div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              {/* Header badge */}
              <div className="inline-block px-4 py-2 bg-white/20 text-white rounded-full text-sm font-semibold mb-6">
                🚀 Ready to Transform?
              </div>

              {/* Main CTA headline */}
              <h2 className="text-4xl lg:text-6xl font-extrabold mb-6 leading-tight">
                Modernize Your
                <span className="block text-accent-300">Inventory Management</span>
                <span className="block text-secondary-300 text-3xl lg:text-4xl">Today</span>
              </h2>

              {/* Enhanced description */}
              <p className="text-xl lg:text-2xl mb-10 opacity-90 max-w-3xl mx-auto leading-relaxed">
                Join the digital transformation of food trading with InCloud&apos;s comprehensive solution.
                <span className="block mt-2 font-semibold text-accent-200">
                  Start your free trial and see the difference in 24 hours.
                </span>
              </p>

              {/* Enhanced CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                <Link href="/signup">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto px-10 py-5 text-lg font-bold shadow-2xl hover:shadow-3xl bg-white text-primary-800 hover:bg-primary-50 hover:text-primary-900 border-2 border-white"
                  >
                    🎯 Start Free Trial
                  </Button>
                </Link>
                <Link href="#contact">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto px-10 py-5 text-lg font-bold border-2 border-white text-white bg-black/10 hover:bg-white hover:text-primary-600 transition-all backdrop-blur-sm"
                  >
                    💬 Contact Sales
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto opacity-90">
                <div className="text-center">
                  <div className="text-lg font-semibold text-accent-200 mb-1">✅ No Setup Fees</div>
                  <div className="text-sm text-white/80">Get started immediately</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-accent-200 mb-1">🔒 Enterprise Security</div>
                  <div className="text-sm text-white/80">Your data is protected</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-accent-200 mb-1">📞 24/7 Support</div>
                  <div className="text-sm text-white/80">We&apos;re here to help</div>
                </div>
              </div>
            </div>
          </div>
        </section>
    </>
  )
}
