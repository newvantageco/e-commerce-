import { NextRequest } from 'next/server'
import { signOut } from '@/lib/auth'
import { successResponse, withErrorHandler } from '@/lib/api-utils'

async function handler(_request: NextRequest) {
  await signOut()
  return successResponse({ message: 'Signed out successfully' })
}

export const POST = withErrorHandler(handler)
