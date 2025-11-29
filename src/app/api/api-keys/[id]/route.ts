import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  successResponse,
  errorResponse,
  withAuth,
  withErrorHandler,
} from '@/lib/api-utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

// DELETE /api/api-keys/[id] - Revoke API key
async function deleteHandler(request: NextRequest, context: RouteContext) {
  const auth = await withAuth(request, { requiredPermission: 'apikeys:delete' })
  if (auth instanceof Response) return auth

  const { id } = await context.params

  const apiKey = await prisma.apiKey.findFirst({
    where: { id, userId: auth.user.id },
  })

  if (!apiKey) {
    return errorResponse('API key not found', 404)
  }

  await prisma.apiKey.delete({ where: { id } })

  return successResponse({ message: 'API key revoked successfully' })
}

export const DELETE = withErrorHandler(deleteHandler)
