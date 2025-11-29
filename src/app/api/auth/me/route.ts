import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'

async function handler(_request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return errorResponse('Not authenticated', 401)
  }

  return successResponse({ user })
}

export const GET = withErrorHandler(handler)
