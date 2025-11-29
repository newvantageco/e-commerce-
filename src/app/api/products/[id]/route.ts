import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { productSchema } from '@/lib/validations'
import {
  successResponse,
  errorResponse,
  parseBody,
  withAuth,
  withErrorHandler,
} from '@/lib/api-utils'
import { slugify } from '@/lib/utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/products/[id] - Get a single product
async function getHandler(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  // Find by ID or slug
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      isActive: true,
    },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true, logo: true } },
      variants: { where: { isActive: true } },
      reviews: {
        where: { isApproved: true },
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: { select: { reviews: true } },
    },
  })

  if (!product) {
    return errorResponse('Product not found', 404)
  }

  // Get average rating
  const rating = await prisma.review.aggregate({
    where: { productId: product.id, isApproved: true },
    _avg: { rating: true },
  })

  // Get related products
  const relatedProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: product.id },
      OR: [
        { categoryId: product.categoryId },
        { brandId: product.brandId },
        { frameShape: product.frameShape },
      ],
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
    },
    take: 4,
  })

  return successResponse({
    ...product,
    rating: rating._avg.rating || 0,
    reviewCount: product._count.reviews,
    relatedProducts,
  })
}

// PUT /api/products/[id] - Update a product
async function putHandler(request: NextRequest, context: RouteContext) {
  const auth = await withAuth(request, { requiredPermission: 'products:update' })
  if (auth instanceof Response) return auth

  const { id } = await context.params
  const body = await parseBody(request, productSchema.partial())

  const existingProduct = await prisma.product.findUnique({ where: { id } })
  if (!existingProduct) {
    return errorResponse('Product not found', 404)
  }

  // Handle slug update
  let slug = body.slug
  if (body.name && !slug) {
    slug = slugify(body.name)
  }

  if (slug && slug !== existingProduct.slug) {
    const slugExists = await prisma.product.findFirst({
      where: { slug, id: { not: id } },
    })
    if (slugExists) {
      return errorResponse('A product with this slug already exists', 400)
    }
  }

  // Handle SKU update
  if (body.sku && body.sku !== existingProduct.sku) {
    const skuExists = await prisma.product.findFirst({
      where: { sku: body.sku, id: { not: id } },
    })
    if (skuExists) {
      return errorResponse('A product with this SKU already exists', 400)
    }
  }

  const { images, ...productData } = body

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...productData,
      slug,
      updatedAt: new Date(),
    },
    include: {
      images: true,
      category: true,
      brand: true,
      variants: true,
    },
  })

  // Handle images update separately if provided
  if (images) {
    await prisma.productImage.deleteMany({ where: { productId: id } })
    await prisma.productImage.createMany({
      data: images.map((img, index) => ({
        productId: id,
        url: img.url,
        alt: img.alt,
        sortOrder: img.sortOrder ?? index,
        isPrimary: img.isPrimary ?? index === 0,
      })),
    })
  }

  return successResponse(product)
}

// DELETE /api/products/[id] - Delete a product
async function deleteHandler(request: NextRequest, context: RouteContext) {
  const auth = await withAuth(request, { requiredPermission: 'products:delete' })
  if (auth instanceof Response) return auth

  const { id } = await context.params

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) {
    return errorResponse('Product not found', 404)
  }

  // Soft delete - set isActive to false
  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  })

  return successResponse({ message: 'Product deleted successfully' })
}

export const GET = withErrorHandler(getHandler)
export const PUT = withErrorHandler(putHandler)
export const DELETE = withErrorHandler(deleteHandler)
