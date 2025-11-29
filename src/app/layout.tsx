import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Providers } from '@/components/providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: {
    default: 'Optica - Premium Eyewear & Prescription Glasses',
    template: '%s | Optica',
  },
  description:
    'Discover premium prescription glasses, sunglasses, and eyewear accessories. Free shipping on orders over $100. Virtual try-on available.',
  keywords: [
    'glasses',
    'eyewear',
    'prescription glasses',
    'sunglasses',
    'eyeglasses',
    'optical',
    'frames',
    'lenses',
  ],
  authors: [{ name: 'Optica' }],
  creator: 'Optica',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'Optica',
    title: 'Optica - Premium Eyewear & Prescription Glasses',
    description:
      'Discover premium prescription glasses, sunglasses, and eyewear accessories.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Optica - Premium Eyewear & Prescription Glasses',
    description:
      'Discover premium prescription glasses, sunglasses, and eyewear accessories.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
