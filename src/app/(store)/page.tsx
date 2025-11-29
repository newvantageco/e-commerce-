import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Truck,
  Shield,
  RefreshCw,
  Sparkles,
  Eye,
  Star,
} from 'lucide-react'
import { prisma } from '@/lib/db'
import { ProductCard } from '@/components/ui/product-card'

async function getFeaturedProducts() {
  return prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      category: { select: { name: true, slug: true } },
      brand: { select: { name: true } },
    },
    take: 8,
  })
}

async function getNewArrivals() {
  return prisma.product.findMany({
    where: { isActive: true, isNewArrival: true },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      category: { select: { name: true, slug: true } },
      brand: { select: { name: true } },
    },
    take: 4,
  })
}

async function getBestSellers() {
  return prisma.product.findMany({
    where: { isActive: true, isBestSeller: true },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      category: { select: { name: true, slug: true } },
      brand: { select: { name: true } },
    },
    take: 4,
  })
}

async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true, parentId: null },
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: 'asc' },
    take: 6,
  })
}

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders over $100',
  },
  {
    icon: RefreshCw,
    title: '30-Day Returns',
    description: 'Easy returns & exchanges',
  },
  {
    icon: Shield,
    title: '2-Year Warranty',
    description: 'Full coverage included',
  },
  {
    icon: Eye,
    title: 'Virtual Try-On',
    description: 'See before you buy',
  },
]

const testimonials = [
  {
    name: 'Sarah M.',
    rating: 5,
    text: 'Best glasses I have ever owned! The quality is amazing and they fit perfectly.',
    image: '/images/testimonials/1.jpg',
  },
  {
    name: 'James K.',
    rating: 5,
    text: 'Great customer service and fast shipping. Will definitely order again!',
    image: '/images/testimonials/2.jpg',
  },
  {
    name: 'Emily R.',
    rating: 5,
    text: 'Love my new sunglasses. The polarized lenses are incredible.',
    image: '/images/testimonials/3.jpg',
  },
]

export default async function HomePage() {
  const [featuredProducts, newArrivals, bestSellers, categories] =
    await Promise.all([
      getFeaturedProducts(),
      getNewArrivals(),
      getBestSellers(),
      getCategories(),
    ])

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                New Collection 2024
              </div>
              <h1 className="text-4xl lg:text-6xl font-display font-bold text-gray-900 leading-tight">
                See the World in{' '}
                <span className="gradient-text">Perfect Style</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-lg">
                Discover our curated collection of premium eyewear. From classic
                frames to modern designs, find your perfect pair.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/eyeglasses" className="btn-primary btn-lg">
                  Shop Eyeglasses
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link href="/sunglasses" className="btn-outline btn-lg">
                  Shop Sunglasses
                </Link>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">50K+</p>
                  <p className="text-sm text-gray-500">Happy Customers</p>
                </div>
                <div className="w-px h-12 bg-gray-300" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">4.9</p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 text-yellow-400 fill-yellow-400"
                      />
                    ))}
                  </div>
                </div>
                <div className="w-px h-12 bg-gray-300" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">500+</p>
                  <p className="text-sm text-gray-500">Frame Styles</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative aspect-square lg:aspect-[4/5] rounded-2xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800"
                  alt="Stylish person wearing glasses"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 max-w-[200px]">
                <p className="text-sm font-medium text-gray-900">
                  Trending Now
                </p>
                <p className="text-xs text-gray-500">Blue Light Glasses</p>
                <Link
                  href="/eyeglasses?lens=blue-light"
                  className="text-xs text-primary-600 font-medium mt-2 inline-block"
                >
                  Shop Now &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="border-y bg-white">
        <div className="container py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold text-gray-900">
                Shop by Category
              </h2>
              <p className="text-gray-500 mt-2">
                Find the perfect frames for your style
              </p>
            </div>
            <Link
              href="/categories"
              className="hidden sm:flex items-center text-primary-600 font-medium hover:text-primary-700"
            >
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Category Cards */}
            <Link
              href="/eyeglasses"
              className="group relative aspect-[4/3] rounded-xl overflow-hidden"
            >
              <Image
                src="https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600"
                alt="Eyeglasses"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-semibold">Eyeglasses</h3>
                <p className="text-sm text-white/80">200+ styles</p>
              </div>
            </Link>

            <Link
              href="/sunglasses"
              className="group relative aspect-[4/3] rounded-xl overflow-hidden"
            >
              <Image
                src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600"
                alt="Sunglasses"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-semibold">Sunglasses</h3>
                <p className="text-sm text-white/80">150+ styles</p>
              </div>
            </Link>

            <Link
              href="/eyeglasses?lens=blue-light"
              className="group relative aspect-[4/3] rounded-xl overflow-hidden col-span-2 lg:col-span-1"
            >
              <Image
                src="https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=600"
                alt="Blue Light Glasses"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-semibold">Blue Light Glasses</h3>
                <p className="text-sm text-white/80">Protect your eyes</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold text-gray-900">
                Featured Collection
              </h2>
              <p className="text-gray-500 mt-2">
                Handpicked styles just for you
              </p>
            </div>
            <Link
              href="/shop?featured=true"
              className="hidden sm:flex items-center text-primary-600 font-medium hover:text-primary-700"
            >
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    ...product,
                    price: parseFloat(product.price.toString()),
                    compareAtPrice: product.compareAtPrice
                      ? parseFloat(product.compareAtPrice.toString())
                      : null,
                  }}
                />
              ))
            ) : (
              // Placeholder cards if no products
              [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-200 rounded-lg animate-shimmer"
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Banner */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="relative bg-primary-600 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <pattern
                  id="grid"
                  width="10"
                  height="10"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1" cy="1" r="1" fill="currentColor" />
                </pattern>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>
            <div className="relative grid lg:grid-cols-2 items-center gap-8 p-8 lg:p-12">
              <div className="text-white">
                <h2 className="text-3xl lg:text-4xl font-display font-bold mb-4">
                  Get 15% Off Your First Order
                </h2>
                <p className="text-primary-100 mb-6 max-w-md">
                  Join the Optica family and receive exclusive offers, early
                  access to new arrivals, and expert eyewear tips.
                </p>
                <form className="flex gap-2 max-w-md">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
              </div>
              <div className="hidden lg:block">
                <Image
                  src="https://images.unsplash.com/photo-1577803645773-f96470509666?w=600"
                  alt="Stylish eyewear"
                  width={500}
                  height={350}
                  className="rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-display font-bold text-gray-900">
                  New Arrivals
                </h2>
                <p className="text-gray-500 mt-2">
                  Fresh styles just dropped
                </p>
              </div>
              <Link
                href="/shop?new=true"
                className="hidden sm:flex items-center text-primary-600 font-medium hover:text-primary-700"
              >
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {newArrivals.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    ...product,
                    price: parseFloat(product.price.toString()),
                    compareAtPrice: product.compareAtPrice
                      ? parseFloat(product.compareAtPrice.toString())
                      : null,
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-gray-900">
              What Our Customers Say
            </h2>
            <p className="text-gray-500 mt-2">
              Join thousands of satisfied customers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-xl border shadow-sm"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star
                      key={j}
                      className="h-4 w-4 text-yellow-400 fill-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-500">Verified Buyer</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
