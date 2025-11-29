'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Home, RefreshCw, AlertTriangle } from 'lucide-react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Something went wrong
          </h1>
          <p className="text-gray-500 mt-2">
            We apologize for the inconvenience. An unexpected error occurred while
            processing your request.
          </p>
          {error.digest && (
            <p className="text-xs text-gray-400 mt-4 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left">
          <h3 className="font-medium text-gray-900 mb-2">Need help?</h3>
          <p className="text-sm text-gray-500">
            If this problem persists, please contact our support team at{' '}
            <a
              href="mailto:support@optica.com"
              className="text-primary-600 hover:text-primary-700"
            >
              support@optica.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
