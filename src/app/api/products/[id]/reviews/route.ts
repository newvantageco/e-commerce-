import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { reviewSchema, paginationSchema } from '@/lib/validations'
import {
  successResponse,
  errorResponse,
  parseBody,
  parseQueryParams,
  getPagination,
  withAuth,
  withErrorHandler,
} from '@/lib/api-utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/products/[id]/reviews - List reviews
async function getHandler(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const params = parseQueryParams(request)
  const { page, limit, skip } = getPagination(params)

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!product) {
    return errorResponse('Product not found', 404)
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId: id, isApproved: true },
      include: {
        user: {
          select: { firstName: true, lastName: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { productId: id, isApproved: true } }),
  ])

  // Get rating distribution
  const ratingDistribution = await prisma.review.groupBy({
    by: ['rating'],
    where: { productId: id, isApproved: true },
    _count: { rating: true },
  })

  const distribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }
  ratingDistribution.forEach((r) => {
    distribution[r.rating as keyof typeof distribution] = r._count.rating
  })

  // Get average rating
  const avgRating = await prisma.review.aggregate({
    where: { productId: id, isApproved: true },
    _avg: { rating: true },
  })

  return successResponse(
    {
      reviews,
      stats: {
        average: avgRating._avg.rating || 0,
        total,
        distribution,
      },
    },
    {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  )
}

// POST /api/products/[id]/reviews - Create review
async function postHandler(request: NextRequest, context: RouteContext) {
  const auth = await withAuth(request)
  if (auth instanceof Response) return auth

  const { id } = await context.params
  const body = await parseBody(request, reviewSchema)

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!product) {
    return errorResponse('Product not found', 404)
  }

  // Check if user already reviewed this product
  const existingReview = await prisma.review.findUnique({
    where: {
      productId_userId: { productId: id, viserId: auth.user.id },
    },
  })

  if (existingReview) {
    return errorResponse('You have already reviewed this product', 400)
  }

  // Check if user has purchased this product
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      productId: id,
      order: {
        userId: auth.user.id,
        status: { in: ['DELIVERED', 'SHIPPED'] },
      },
    },
  })

  const review = await prisma.review.create({
    data: {
      ...body,
      productId: id,
      userId: auth.user.id,
      isVerified: !!hasPurchased,
      isApproved: false, // Requires moderation
    },
    include: {
      user: {
        select: { firstName: true, lastName: true, avatar: true },
      },
    },
  })

  return successResponse(review, undefined, 201)
}

export const GET = withErrorHandler(getHandler)
export const POST = withErrorHandler(postHandler)
