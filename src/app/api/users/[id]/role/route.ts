import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { userRoleUpdateSchema } from '@/lib/validations'
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

// PUT /api/users/[id]/role - Update user role (super admin only)
async function putHandler(request: NextRequest, context: RouteContext) {
  const auth = await withAuth(request, { requiredPermission: 'users:roles' })
  if (auth instanceof Response) return auth

  const { id } = await context.params
  const body = await parseBody(request, userRoleUpdateSchema)

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return errorResponse('User not found', 404)
  }

  // Prevent changing your own role
  if (user.id === auth.user.id) {
    return errorResponse('Cannot change your own role', 400)
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role: body.role },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  })

  // Log audit
  await prisma.auditLog.create({
    data: {
      userId: auth.user.id,
      action: 'UPDATE_ROLE',
      entity: 'User',
      entityId: id,
      oldValue: { role: user.role },
      newValue: { role: body.role },
    },
  })

  return successResponse(updatedUser)
}

export const PUT = withErrorHandler(putHandler)
