import Link from 'next/link'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Logo } from '@/components/ui'

export default function Home() {
  return (
    <>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/5 via-white to-secondary/5 py-20 lg:py-32">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <Logo size="xl" className="justify-center mb-8" />

              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Professional Inventory Management for{' '}
                <span className="text-primary">J.A's Food Trading</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Streamline your frozen food distribution with our cloud-based inventory system.
                Real-time tracking, analytics, and multi-branch coordination in one platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Admin Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need to Manage Your Inventory
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Built specifically for frozen food trading with features that matter to your business
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card variant="elevated">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <CardTitle>Real-time Inventory Tracking</CardTitle>
                  <CardDescription>
                    Monitor stock levels across all 3 branches in Sampaloc, Manila with instant updates
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <CardTitle>Expiration Management</CardTitle>
                  <CardDescription>
                    Track expiration dates for frozen goods with automated alerts and priority selling
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <CardTitle>Advanced Analytics</CardTitle>
                  <CardDescription>
                    Descriptive and prescriptive analytics to optimize pricing and stock decisions
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <CardTitle>Mobile Customer App</CardTitle>
                  <CardDescription>
                    Flutter mobile app for customers to browse products and place orders seamlessly
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <CardTitle>Multi-pricing Support</CardTitle>
                  <CardDescription>
                    Handle wholesale, retail, and box pricing structures with ease
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <CardTitle>Real-time Sync</CardTitle>
                  <CardDescription>
                    Instant synchronization between web and mobile platforms for up-to-date information
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">
                Trusted by J.A's Food Trading Since 2018
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">3</div>
                  <div className="text-gray-600">Branches in Manila</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">6+</div>
                  <div className="text-gray-600">Years of Experience</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                  <div className="text-gray-600">System Availability</div>
                </div>
              </div>

              <p className="text-lg text-gray-600 mb-8">
                Located in Sampaloc, Manila, J.A's Food Trading has been serving the frozen food
                distribution industry since 2018. Our InCloud system is designed specifically
                to meet the unique challenges of frozen food inventory management.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-20 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Modernize Your Inventory Management?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join the digital transformation of food trading with InCloud's comprehensive solution
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="#contact">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </section>
    </>
  )
}
