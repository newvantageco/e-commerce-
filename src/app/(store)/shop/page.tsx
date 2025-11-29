import { Suspense } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { ProductCard } from '@/components/ui/product-card'
import { ProductFilters } from '@/components/product/product-filters'
import { ChevronRight, SlidersHorizontal } from 'lucide-react'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getProducts(params: Record<string, string | string[] | undefined>) {
  const page = Number(params.page) || 1
  const limit = 12
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { isActive: true }

  if (params.search) {
    where.OR = [
      { name: { contains: String(params.search), mode: 'insensitive' } },
      { description: { contains: String(params.search), mode: 'insensitive' } },
    ]
  }

  if (params.category) {
    where.category = { slug: String(params.category) }
  }

  if (params.brand) {
    where.brand = { slug: String(params.brand) }
  }

  if (params.minPrice || params.maxPrice) {
    where.price = {}
    if (params.minPrice) where.price.gte = Number(params.minPrice)
    if (params.maxPrice) where.price.lte = Number(params.maxPrice)
  }

  if (params.frameShape) {
    where.frameShape = String(params.frameShape)
  }

  if (params.frameMaterial) {
    where.frameMaterial = String(params.frameMaterial)
  }

  if (params.frameType) {
    where.frameType = String(params.frameType)
  }

  if (params.featured === 'true') {
    where.isFeatured = true
  }

  if (params.new === 'true') {
    where.isNewArrival = true
  }

  // Sort
  let orderBy: Record<string, string> = { createdAt: 'desc' }
  if (params.sort) {
    switch (params.sort) {
      case 'price-asc':
        orderBy = { price: 'asc' }
        break
      case 'price-desc':
        orderBy = { price: 'desc' }
        break
      case 'name':
        orderBy = { name: 'asc' }
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
    }
  }

  const [products, total, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: { select: { name: true, slug: true } },
        brand: { select: { name: true, slug: true } },
        variants: { where: { isActive: true }, select: { colorCode: true, color: true, id: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
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

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams
  const data = await getProducts(params)

  const currentCategory = params.category
    ? data.categories.find((c) => c.slug === params.category)
    : null

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900">
          {currentCategory?.name || 'All Products'}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">
            {currentCategory?.name || 'All Products'}
          </h1>
          <p className="text-gray-500 mt-1">
            {data.total} {data.total === 1 ? 'product' : 'products'} found
          </p>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-500">Sort by:</label>
          <form>
            <select
              name="sort"
              defaultValue={String(params.sort || 'newest')}
              onChange={(e) => {
                const url = new URL(window.location.href)
                url.searchParams.set('sort', e.target.value)
                window.location.href = url.toString()
              }}
              className="input w-auto"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name</option>
            </select>
          </form>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <Suspense fallback={<div className="animate-pulse bg-gray-100 h-96 rounded-xl" />}>
            <ProductFilters
              categories={data.categories}
              brands={data.brands}
              currentFilters={params}
            />
          </Suspense>
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {data.products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
                {data.products.map((product) => (
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

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  {data.page > 1 && (
                    <Link
                      href={`?${new URLSearchParams({ ...params, page: String(data.page - 1) } as Record<string, string>)}`}
                      className="btn-outline"
                    >
                      Previous
                    </Link>
                  )}

                  <div className="flex items-center gap-1">
                    {[...Array(data.totalPages)].map((_, i) => {
                      const pageNum = i + 1
                      const isCurrentPage = pageNum === data.page

                      if (
                        pageNum === 1 ||
                        pageNum === data.totalPages ||
                        Math.abs(pageNum - data.page) <= 1
                      ) {
                        return (
                          <Link
                            key={pageNum}
                            href={`?${new URLSearchParams({ ...params, page: String(pageNum) } as Record<string, string>)}`}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium ${
                              isCurrentPage
                                ? 'bg-primary-600 text-white'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </Link>
                        )
                      } else if (
                        pageNum === 2 ||
                        pageNum === data.totalPages - 1
                      ) {
                        return (
                          <span key={pageNum} className="px-2">
                            ...
                          </span>
                        )
                      }
                      return null
                    })}
                  </div>

                  {data.page < data.totalPages && (
                    <Link
                      href={`?${new URLSearchParams({ ...params, page: String(data.page + 1) } as Record<string, string>)}`}
                      className="btn-outline"
                    >
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <SlidersHorizontal className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your filters or search terms
              </p>
              <Link href="/shop" className="btn-primary">
                Clear Filters
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
