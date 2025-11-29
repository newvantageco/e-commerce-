import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import {
  successResponse,
  errorResponse,
  parseBody,
  withAuth,
  withErrorHandler,
} from '@/lib/api-utils'

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

// PUT /api/auth/password - Update password
async function putHandler(request: NextRequest) {
  const auth = await withAuth(request)
  if (auth instanceof Response) return auth

  const body = await parseBody(request, passwordUpdateSchema)

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { password: true },
  })

  if (!user) {
    return errorResponse('User not found', 404)
  }

  // Verify current password
  const isValid = await bcrypt.compare(body.currentPassword, user.password)
  if (!isValid) {
    return errorResponse('Current password is incorrect', 400)
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(body.newPassword, 12)

  // Update password
  await prisma.user.update({
    where: { id: auth.user.id },
    data: { password: hashedPassword },
  })

  return successResponse({ message: 'Password updated successfully' })
}

export const PUT = withErrorHandler(putHandler)
