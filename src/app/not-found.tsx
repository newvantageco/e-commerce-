import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-display font-bold text-gray-200">404</h1>
          <div className="relative -mt-16">
            <h2 className="text-2xl font-display font-bold text-gray-900">
              Page Not Found
            </h2>
            <p className="text-gray-500 mt-2">
              Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been
              moved or deleted.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Search className="h-5 w-5" />
            Browse Shop
          </Link>
        </div>

        <div className="mt-8">
          <button
            onClick={() => window.history.back()}
            className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back to previous page
          </button>
        </div>
      </div>
    </div>
  )
}
