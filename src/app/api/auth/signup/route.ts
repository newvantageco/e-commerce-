import { NextRequest } from 'next/server'
import { signUp, setAuthCookie } from '@/lib/auth'
import { signUpSchema } from '@/lib/validations'
import {
  successResponse,
  errorResponse,
  parseBody,
  withErrorHandler,
} from '@/lib/api-utils'
import { sendEmail, welcomeEmail } from '@/lib/email'

async function handler(request: NextRequest) {
  const body = await parseBody(request, signUpSchema)

  const { user, token } = await signUp(
    body.email,
    body.password,
    body.firstName,
    body.lastName
  )

  await setAuthCookie(token)

  // Send welcome email (non-blocking)
  sendEmail({
    to: user.email,
    subject: 'Welcome to Optica Glasses!',
    html: welcomeEmail({ firstName: user.firstName, email: user.email }),
  }).catch(console.error)

  return successResponse({ user, token }, undefined, 201)
}

export const POST = withErrorHandler(handler)
