import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { productSchema, productFilterSchema, paginationSchema } from '@/lib/validations'
import {
  successResponse,
  errorResponse,
  parseBody,
  parseQueryParams,
  getPagination,
  getSort,
  withAuth,
  withErrorHandler,
} from '@/lib/api-utils'
import { slugify, generateSku } from '@/lib/utils'
import { Prisma } from '@prisma/client'

// GET /api/products - List products with filtering, sorting, pagination
async function getHandler(request: NextRequest) {
  const params = parseQueryParams(request)
  const filters = productFilterSchema.parse(params)
  const pagination = paginationSchema.parse(params)
  const { page, limit, skip } = getPagination(params)
  const orderBy = getSort(params, ['name', 'price', 'createdAt'], 'createdAt')

  // Build where clause
  const where: Prisma.ProductWhereInput = {
    isActive: true,
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { sku: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters.category) {
    where.category = { slug: filters.category }
  }

  if (filters.brand) {
    where.brand = { slug: filters.brand }
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {}
    if (filters.minPrice !== undefined) {
      where.price.gte = filters.minPrice
    }
    if (filters.maxPrice !== undefined) {
      where.price.lte = filters.maxPrice
    }
  }

  if (filters.frameType) {
    where.frameType = filters.frameType as Prisma.EnumFrameTypeFilter
  }

  if (filters.frameShape) {
    where.frameShape = filters.frameShape as Prisma.EnumFrameShapeFilter
  }

  if (filters.frameMaterial) {
    where.frameMaterial = filters.frameMaterial as Prisma.EnumFrameMaterialFilter
  }

  if (filters.isFeatured) {
    where.isFeatured = true
  }

  if (filters.isNewArrival) {
    where.isNewArrival = true
  }

  if (filters.isBestSeller) {
    where.isBestSeller = true
  }

  if (filters.inStock) {
    where.quantity = { gt: 0 }
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        variants: { where: { isActive: true } },
        _count: { select: { reviews: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  // Calculate average rating for each product
  const productsWithRating = await Promise.all(
    products.map(async (product) => {
      const rating = await prisma.review.aggregate({
        where: { productId: product.id, isApproved: true },
        _avg: { rating: true },
      })
      return {
        ...product,
        rating: rating._avg.rating || 0,
        reviewCount: product._count.reviews,
      }
    })
  )

  return successResponse(productsWithRating, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  })
}

// POST /api/products - Create a new product (admin only)
async function postHandler(request: NextRequest) {
  const auth = await withAuth(request, { requiredPermission: 'products:create' })
  if (auth instanceof Response) return auth

  const body = await parseBody(request, productSchema)

  // Generate slug if not provided
  const slug = body.slug || slugify(body.name)

  // Check if slug already exists
  const existingProduct = await prisma.product.findUnique({ where: { slug } })
  if (existingProduct) {
    return errorResponse('A product with this slug already exists', 400)
  }

  // Check if SKU already exists
  const existingSku = await prisma.product.findUnique({ where: { sku: body.sku } })
  if (existingSku) {
    return errorResponse('A product with this SKU already exists', 400)
  }

  const { images, ...productData } = body

  const product = await prisma.product.create({
    data: {
      ...productData,
      slug,
      images: images
        ? {
            create: images.map((img, index) => ({
              url: img.url,
              alt: img.alt,
              sortOrder: img.sortOrder ?? index,
              isPrimary: img.isPrimary ?? index === 0,
            })),
          }
        : undefined,
    },
    include: {
      images: true,
      category: true,
      brand: true,
      variants: true,
    },
  })

  return successResponse(product, undefined, 201)
}

export const GET = withErrorHandler(getHandler)
export const POST = withErrorHandler(postHandler)
