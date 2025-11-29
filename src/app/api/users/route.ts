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
import { Prisma, Role } from '@prisma/client'

// GET /api/users - List users (admin only)
async function getHandler(request: NextRequest) {
  const auth = await withAuth(request, { requiredPermission: 'users:read' })
  if (auth instanceof Response) return auth

  const params = parseQueryParams(request)
  const { page, limit, skip } = getPagination(params)
  const orderBy = getSort(params, ['createdAt', 'email', 'firstName', 'lastName'], 'createdAt')

  const where: Prisma.UserWhereInput = {}

  if (params.search) {
    where.OR = [
      { email: { contains: String(params.search), mode: 'insensitive' } },
      { firstName: { contains: String(params.search), mode: 'insensitive' } },
      { lastName: { contains: String(params.search), mode: 'insensitive' } },
    ]
  }

  if (params.role) {
    where.role = params.role as Role
  }

  if (params.isActive !== undefined) {
    where.isActive = params.isActive === 'true'
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { orders: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return successResponse(users, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  })
}

export const GET = withErrorHandler(getHandler)
