import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { couponSchema, paginationSchema } from '@/lib/validations'
import {
  successResponse,
  errorResponse,
  parseBody,
  parseQueryParams,
  getPagination,
  withAuth,
  withErrorHandler,
} from '@/lib/api-utils'

// GET /api/coupons - List coupons (admin only)
async function getHandler(request: NextRequest) {
  const auth = await withAuth(request, { requiredPermission: 'coupons:read' })
  if (auth instanceof Response) return auth

  const params = parseQueryParams(request)
  const { page, limit, skip } = getPagination(params)

  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.coupon.count(),
  ])

  return successResponse(coupons, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  })
}

// POST /api/coupons - Create coupon
async function postHandler(request: NextRequest) {
  const auth = await withAuth(request, { requiredPermission: 'coupons:create' })
  if (auth instanceof Response) return auth

  const body = await parseBody(request, couponSchema)

  const existingCoupon = await prisma.coupon.findUnique({
    where: { code: body.code.toUpperCase() },
  })

  if (existingCoupon) {
    return errorResponse('A coupon with this code already exists', 400)
  }

  const coupon = await prisma.coupon.create({
    data: {
      ...body,
      code: body.code.toUpperCase(),
      startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  })

  return successResponse(coupon, undefined, 201)
}

export const GET = withErrorHandler(getHandler)
export const POST = withErrorHandler(postHandler)
