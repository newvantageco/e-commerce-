import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import {
  successResponse,
  parseBody,
  withAuth,
  withErrorHandler,
} from '@/lib/api-utils'

const notificationPreferencesSchema = z.object({
  orderUpdates: z.boolean().optional(),
  promotions: z.boolean().optional(),
  newsletter: z.boolean().optional(),
})

// GET /api/auth/notifications - Get notification preferences
async function getHandler(request: NextRequest) {
  const auth = await withAuth(request)
  if (auth instanceof Response) return auth

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { notificationPreferences: true },
  })

  const defaults = {
    orderUpdates: true,
    promotions: false,
    newsletter: true,
  }

  return successResponse({
    ...defaults,
    ...(user?.notificationPreferences as Record<string, boolean> || {}),
  })
}

// PUT /api/auth/notifications - Update notification preferences
async function putHandler(request: NextRequest) {
  const auth = await withAuth(request)
  if (auth instanceof Response) return auth

  const body = await parseBody(request, notificationPreferencesSchema)

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { notificationPreferences: true },
  })

  const currentPreferences = (user?.notificationPreferences as Record<string, boolean>) || {}

  await prisma.user.update({
    where: { id: auth.user.id },
    data: {
      notificationPreferences: {
        ...currentPreferences,
        ...body,
      },
    },
  })

  return successResponse({ message: 'Notification preferences updated' })
}

export const GET = withErrorHandler(getHandler)
export const PUT = withErrorHandler(putHandler)
