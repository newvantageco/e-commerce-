'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  Heart,
  ChevronDown,
} from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

const navigation = [
  {
    name: 'Eyeglasses',
    href: '/eyeglasses',
    children: [
      { name: 'All Eyeglasses', href: '/eyeglasses' },
      { name: 'Blue Light Glasses', href: '/eyeglasses?lens=blue-light' },
      { name: 'Reading Glasses', href: '/eyeglasses?lens=reading' },
      { name: 'Progressive Lenses', href: '/eyeglasses?lens=progressive' },
    ],
  },
  {
    name: 'Sunglasses',
    href: '/sunglasses',
    children: [
      { name: 'All Sunglasses', href: '/sunglasses' },
      { name: 'Polarized', href: '/sunglasses?lens=polarized' },
      { name: 'Prescription Sunglasses', href: '/sunglasses?prescription=true' },
    ],
  },
  { name: 'Accessories', href: '/accessories' },
  { name: 'Brands', href: '/brands' },
  { name: 'Sale', href: '/sale', highlight: true },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const pathname = usePathname()

  const { items, openCart } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()

  const itemCount = items.reduce((total, item) => total + item.quantity, 0)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setActiveDropdown(null)
  }, [pathname])

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-primary-600 text-white text-center py-2 text-sm">
        <p>Free shipping on orders over $100 | Use code WELCOME15 for 15% off</p>
      </div>

      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300',
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm'
            : 'bg-white'
        )}
      >
        <nav className="container">
          <div className="flex h-16 items-center justify-between">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 -ml-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="font-display text-xl font-bold">Optica</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navigation.map((item) => (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(item.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1 text-sm font-medium transition-colors',
                      item.highlight
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-gray-700 hover:text-primary-600',
                      pathname === item.href && 'text-primary-600'
                    )}
                  >
                    {item.name}
                    {item.children && (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Link>

                  {/* Dropdown */}
                  {item.children && (
                    <AnimatePresence>
                      {activeDropdown === item.name && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 pt-2"
                        >
                          <div className="bg-white rounded-lg shadow-lg border py-2 min-w-[200px]">
                            {item.children.map((child) => (
                              <Link
                                key={child.name}
                                href={child.href}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </div>

            {/* Right side icons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>

              <Link
                href="/wishlist"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:flex"
              >
                <Heart className="h-5 w-5" />
              </Link>

              <Link
                href={isAuthenticated ? '/account' : '/login'}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <User className="h-5 w-5" />
              </Link>

              <button
                onClick={openCart}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t"
            >
              <div className="container py-4 space-y-4">
                {navigation.map((item) => (
                  <div key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'block py-2 text-base font-medium',
                        item.highlight
                          ? 'text-red-500'
                          : 'text-gray-900'
                      )}
                    >
                      {item.name}
                    </Link>
                    {item.children && (
                      <div className="pl-4 space-y-2 mt-2">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className="block py-1 text-sm text-gray-600"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              exit={{ y: -100 }}
              className="bg-white p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="container">
                <div className="flex items-center gap-4">
                  <Search className="h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for frames, styles, or brands..."
                    className="flex-1 py-3 text-lg outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
