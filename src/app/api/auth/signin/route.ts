import { NextRequest } from 'next/server'
import { signIn, setAuthCookie } from '@/lib/auth'
import { signInSchema } from '@/lib/validations'
import {
  successResponse,
  errorResponse,
  parseBody,
  withErrorHandler,
} from '@/lib/api-utils'

async function handler(request: NextRequest) {
  const body = await parseBody(request, signInSchema)

  try {
    const { user, token } = await signIn(body.email, body.password)
    await setAuthCookie(token)
    return successResponse({ user, token })
  } catch {
    return errorResponse('Invalid email or password', 401)
  }
}

export const POST = withErrorHandler(handler)
