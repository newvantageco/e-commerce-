import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { userUpdateSchema, userRoleUpdateSchema } from '@/lib/validations'
import {
  successResponse,
  errorResponse,
  parseBody,
  withAuth,
  withErrorHandler,
} from '@/lib/api-utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/users/[id]
async function getHandler(request: NextRequest, context: RouteContext) {
  const auth = await withAuth(request, { requiredPermission: 'users:read' })
  if (auth instanceof Response) return auth

  const { id } = await context.params

  const user = await prisma.user.findUnique({
    where: { id },
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
      addresses: true,
      orders: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
        },
      },
      _count: { select: { orders: true, reviews: true } },
    },
  })

  if (!user) {
    return errorResponse('User not found', 404)
  }

  return successResponse(user)
}

// PUT /api/users/[id]
async function putHandler(request: NextRequest, context: RouteContext) {
  const auth = await withAuth(request, { requiredPermission: 'users:update' })
  if (auth instanceof Response) return auth

  const { id } = await context.params
  const body = await parseBody(request, userUpdateSchema)

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return errorResponse('User not found', 404)
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: body,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
      isActive: true,
    },
  })

  return successResponse(updatedUser)
}

// DELETE /api/users/[id] - Deactivate user
async function deleteHandler(request: NextRequest, context: RouteContext) {
  const auth = await withAuth(request, { requiredPermission: 'users:delete' })
  if (auth instanceof Response) return auth

  const { id } = await context.params

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return errorResponse('User not found', 404)
  }

  // Prevent deleting yourself
  if (user.id === auth.user.id) {
    return errorResponse('Cannot delete your own account', 400)
  }

  // Soft delete
  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  })

  return successResponse({ message: 'User deactivated successfully' })
}

export const GET = withErrorHandler(getHandler)
export const PUT = withErrorHandler(putHandler)
export const DELETE = withErrorHandler(deleteHandler)
