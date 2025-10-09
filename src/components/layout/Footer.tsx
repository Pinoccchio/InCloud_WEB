import Link from 'next/link'
import { Logo } from '@/components/ui'

export function Footer() {
  return (
    <footer className="w-full bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-secondary-500"></div>

      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
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

          {/* Navigation */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
              <span>Navigation</span>
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="#features" className="text-gray-800 hover:text-primary-600 transition-all duration-200 hover:translate-x-1 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 group-hover:bg-primary-500 transition-colors"></span>
                  Features
                </Link>
              </li>
              <li>
                <Link href="#about" className="text-gray-800 hover:text-primary-600 transition-all duration-200 hover:translate-x-1 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 group-hover:bg-primary-500 transition-colors"></span>
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div id="contact" className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <div className="w-3 h-3 bg-secondary-500 rounded-full"></div>
              <span>Contact Us</span>
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="tel:09663023303" className="text-gray-800 hover:text-secondary-600 transition-all duration-200 hover:translate-x-1 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 group-hover:bg-secondary-500 transition-colors"></span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    09663023303
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/JAsFoodTrading"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-800 hover:text-secondary-600 transition-all duration-200 hover:translate-x-1 flex items-center group"
                >
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 group-hover:bg-secondary-500 transition-colors"></span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    J.A&apos;s Food Trading
                  </span>
                </a>
              </li>
              <li>
                <div className="text-gray-800 flex items-start group">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 mt-1.5"></span>
                  <span className="flex items-start">
                    <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">Sampaloc, Manila<br/>Philippines</span>
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 pt-8 border-t border-gray-300/50">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="text-sm font-semibold text-gray-800">
                © 2025 J.A&apos;s Food Trading. All rights reserved.
              </div>
              <div className="hidden md:block w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="text-sm text-gray-700">
                Powered by InCloud Technology
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}