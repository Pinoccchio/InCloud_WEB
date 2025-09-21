import Link from 'next/link'
import { Logo } from '@/components/ui'

export function Footer() {
  return (
    <footer className="w-full bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-secondary-500"></div>

      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="space-y-6">
            <Logo size="lg" />
            <p className="text-base text-gray-700 leading-relaxed max-w-sm">
              Professional inventory management solutions empowering J.A&apos;s Food Trading and partners across Manila with cutting-edge technology.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-800">Established 2018</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-800">Sampaloc, Manila</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
              <span>Product</span>
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="#features" className="text-gray-800 hover:text-primary-600 transition-all duration-200 hover:translate-x-1 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 group-hover:bg-primary-500 transition-colors"></span>
                  Features
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-gray-800 hover:text-primary-600 transition-all duration-200 hover:translate-x-1 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 group-hover:bg-primary-500 transition-colors"></span>
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#analytics" className="text-gray-800 hover:text-primary-600 transition-all duration-200 hover:translate-x-1 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 group-hover:bg-primary-500 transition-colors"></span>
                  Analytics
                </Link>
              </li>
              <li>
                <Link href="#mobile" className="text-gray-800 hover:text-primary-600 transition-all duration-200 hover:translate-x-1 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 group-hover:bg-primary-500 transition-colors"></span>
                  Mobile App
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <div className="w-3 h-3 bg-secondary-500 rounded-full"></div>
              <span>Company</span>
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="#about" className="text-gray-800 hover:text-secondary-600 transition-all duration-200 hover:translate-x-1 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 group-hover:bg-secondary-500 transition-colors"></span>
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-gray-800 hover:text-secondary-600 transition-all duration-200 hover:translate-x-1 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 group-hover:bg-secondary-500 transition-colors"></span>
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#careers" className="text-gray-800 hover:text-secondary-600 transition-all duration-200 hover:translate-x-1 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 group-hover:bg-secondary-500 transition-colors"></span>
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#news" className="text-gray-800 hover:text-secondary-600 transition-all duration-200 hover:translate-x-1 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 group-hover:bg-secondary-500 transition-colors"></span>
                  News
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <div className="w-3 h-3 bg-accent-500 rounded-full"></div>
              <span>Legal</span>
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-gray-800 hover:text-accent-600 transition-all duration-200 hover:translate-x-1 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 group-hover:bg-accent-500 transition-colors"></span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-800 hover:text-accent-600 transition-all duration-200 hover:translate-x-1 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 group-hover:bg-accent-500 transition-colors"></span>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-gray-800 hover:text-accent-600 transition-all duration-200 hover:translate-x-1 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 group-hover:bg-accent-500 transition-colors"></span>
                  Security
                </Link>
              </li>
              <li>
                <Link href="/compliance" className="text-gray-800 hover:text-accent-600 transition-all duration-200 hover:translate-x-1 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 group-hover:bg-accent-500 transition-colors"></span>
                  Compliance
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 pt-8 border-t border-gray-300/50">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="text-sm font-semibold text-gray-800">
                © 2024 J.A&apos;s Food Trading. All rights reserved.
              </div>
              <div className="hidden md:block w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="text-sm text-gray-700">
                Powered by InCloud Technology
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/privacy" className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-all duration-200 hover:scale-105">
                Privacy
              </Link>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <Link href="/terms" className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-all duration-200 hover:scale-105">
                Terms
              </Link>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-all duration-200 hover:scale-105">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}