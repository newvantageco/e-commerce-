import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { paginationSchema } from '@/lib/validations'
import {
  successResponse,
  errorResponse,
  parseQueryParams,
  getPagination,
  getSort,
  withAuth,
  withErrorHandler,
} from '@/lib/api-utils'
import { Prisma, OrderStatus } from '@prisma/client'

// GET /api/orders - List orders
async function getHandler(request: NextRequest) {
  const auth = await withAuth(request)
  if (auth instanceof Response) return auth

  const params = parseQueryParams(request)
  const { page, limit, skip } = getPagination(params)
  const orderBy = getSort(params, ['createdAt', 'total', 'status'], 'createdAt')

  // Build where clause based on user role
  const where: Prisma.OrderWhereInput = {}

  // Regular customers can only see their own orders
  if (auth.user.role === 'CUSTOMER') {
    where.userId = auth.user.id
  } else {
    // Staff and above can filter by status, customer, etc.
    if (params.status) {
      where.status = params.status as OrderStatus
    }
    if (params.userId) {
      where.userId = String(params.userId)
    }
    if (params.email) {
      where.email = { contains: String(params.email), mode: 'insensitive' }
    }
    if (params.orderNumber) {
      where.orderNumber = { contains: String(params.orderNumber), mode: 'insensitive' }
    }
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          take: 3, // Preview first 3 items
        },
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
        _count: { select: { items: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  return successResponse(orders, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  })
}

export const GET = withErrorHandler(getHandler)
