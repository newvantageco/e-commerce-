import Link from 'next/link'
import { prisma } from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import { Glasses, ChevronRight, SlidersHorizontal } from 'lucide-react'
import ProductFilters from '@/components/product/product-filters'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getEyeglasses(params: Record<string, string | string[] | undefined>) {
  const page = Number(params.page) || 1
  const limit = 12
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {
    status: 'ACTIVE',
    OR: [
      { category: { slug: 'eyeglasses' } },
      { category: { parent: { slug: 'eyeglasses' } } },
      { frameType: 'OPTICAL' },
    ],
  }

  // Apply filters
  if (params.brand) {
    where.brand = { slug: String(params.brand) }
  }

  if (params.frameShape) {
    where.frameShape = String(params.frameShape)
  }

  if (params.frameMaterial) {
    where.frameMaterial = String(params.frameMaterial)
  }

  if (params.gender) {
    where.gender = String(params.gender)
  }

  if (params.minPrice || params.maxPrice) {
    where.price = {}
    if (params.minPrice) {
      (where.price as Record<string, number>).gte = Number(params.minPrice)
    }
    if (params.maxPrice) {
      (where.price as Record<string, number>).lte = Number(params.maxPrice)
    }
  }

  // Sorting
  let orderBy: Record<string, string> = { createdAt: 'desc' }
  if (params.sort === 'price_asc') orderBy = { price: 'asc' }
  else if (params.sort === 'price_desc') orderBy = { price: 'desc' }
  else if (params.sort === 'name') orderBy = { name: 'asc' }
  else if (params.sort === 'popular') orderBy = { soldCount: 'desc' }

  const [products, total, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { take: 2, orderBy: { position: 'asc' } },
        brand: { select: { name: true, slug: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: { OR: [{ slug: 'eyeglasses' }, { parent: { slug: 'eyeglasses' } }] },
      orderBy: { name: 'asc' },
    }),
    prisma.brand.findMany({
      where: { products: { some: where } },
      orderBy: { name: 'asc' },
    }),
  ])

  return {
    products,
    total,
    totalPages: Math.ceil(total / limit),
    page,
    categories,
    brands,
  }
}

export default async function EyeglassesPage({ searchParams }: Props) {
  const params = await searchParams
  const data = await getEyeglasses(params)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-700 text-white py-16">
        <div className="container text-center">
          <Glasses className="h-16 w-16 mx-auto mb-4 opacity-80" />
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Prescription Eyeglasses
          </h1>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto">
            Find your perfect pair from our curated collection of premium eyeglasses.
            Available with single vision, bifocal, and progressive lenses.
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="container py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900">Eyeglasses</span>
        </nav>
      </div>

      <div className="container pb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <ProductFilters
              categories={data.categories}
              brands={data.brands}
              baseUrl="/eyeglasses"
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <p className="text-gray-500">
                Showing {data.products.length} of {data.total} products
              </p>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <SlidersHorizontal className="h-4 w-4" />
                  Sort by:
                  <select
                    defaultValue={String(params.sort || '')}
                    className="border rounded-lg px-3 py-1.5 text-sm"
                    onChange={(e) => {
                      const url = new URL(window.location.href)
                      if (e.target.value) {
                        url.searchParams.set('sort', e.target.value)
                      } else {
                        url.searchParams.delete('sort')
                      }
                      window.location.href = url.toString()
                    }}
                  >
                    <option value="">Newest</option>
                    <option value="popular">Most Popular</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name">Name A-Z</option>
                  </select>
                </label>
              </div>
            </div>

            {data.products.length > 0 ? (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-lg transition-all"
                    >
                      <div className="aspect-square relative bg-gray-100">
                        {product.images[0] ? (
                          <img
                            src={product.images[0].url}
                            alt={product.images[0].alt || product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Glasses className="h-16 w-16 text-gray-300" />
                          </div>
                        )}
                        {product.compareAtPrice && (
                          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
                            Sale
                          </span>
                        )}
                        {product.isNewArrival && (
                          <span className="absolute top-3 right-3 bg-primary-600 text-white text-xs font-medium px-2 py-1 rounded">
                            New
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        {product.brand && (
                          <p className="text-xs text-gray-500 mb-1">
                            {product.brand.name}
                          </p>
                        )}
                        <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {formatPrice(parseFloat(product.price.toString()))}
                          </span>
                          {product.compareAtPrice && (
                            <span className="text-sm text-gray-400 line-through">
                              {formatPrice(parseFloat(product.compareAtPrice.toString()))}
                            </span>
                          )}
                        </div>
                        {product.frameShape && (
                          <p className="text-xs text-gray-500 mt-2 capitalize">
                            {product.frameShape.toLowerCase().replace('_', ' ')} Frame
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {data.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {data.page > 1 && (
                      <Link
                        href={`?page=${data.page - 1}`}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                      >
                        Previous
                      </Link>
                    )}
                    {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => {
                      const pageNum = i + 1
                      return (
                        <Link
                          key={pageNum}
                          href={`?page=${pageNum}`}
                          className={`px-4 py-2 border rounded-lg ${
                            data.page === pageNum
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </Link>
                      )
                    })}
                    {data.page < data.totalPages && (
                      <Link
                        href={`?page=${data.page + 1}`}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
                <Glasses className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  No eyeglasses found
                </h2>
                <p className="text-gray-500 mb-6">
                  Try adjusting your filters to see more results.
                </p>
                <Link href="/eyeglasses" className="btn-primary">
                  Clear Filters
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
