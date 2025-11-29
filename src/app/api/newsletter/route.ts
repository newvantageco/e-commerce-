import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { newsletterSchema } from '@/lib/validations'
import {
  successResponse,
  errorResponse,
  parseBody,
  withErrorHandler,
} from '@/lib/api-utils'

// POST /api/newsletter - Subscribe to newsletter
async function postHandler(request: NextRequest) {
  const body = await parseBody(request, newsletterSchema)

  const existing = await prisma.newsletter.findUnique({
    where: { email: body.email.toLowerCase() },
  })

  if (existing) {
    if (existing.isActive) {
      return successResponse({ message: 'Already subscribed' })
    } else {
      // Reactivate subscription
      await prisma.newsletter.update({
        where: { id: existing.id },
        data: { isActive: true },
      })
      return successResponse({ message: 'Subscription reactivated' })
    }
  }

  await prisma.newsletter.create({
    data: {
      email: body.email.toLowerCase(),
      firstName: body.firstName,
      source: body.source || 'website',
    },
  })

  return successResponse({ message: 'Successfully subscribed' }, undefined, 201)
}

export const POST = withErrorHandler(postHandler)
