import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { addressSchema } from '@/lib/validations'
import {
  successResponse,
  errorResponse,
  parseBody,
  withAuth,
  withErrorHandler,
} from '@/lib/api-utils'

// GET /api/addresses - List user addresses
async function getHandler(request: NextRequest) {
  const auth = await withAuth(request)
  if (auth instanceof Response) return auth

  const addresses = await prisma.address.findMany({
    where: { userId: auth.user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })

  return successResponse(addresses)
}

// POST /api/addresses - Create address
async function postHandler(request: NextRequest) {
  const auth = await withAuth(request)
  if (auth instanceof Response) return auth

  const body = await parseBody(request, addressSchema)

  // If this is the first address or marked as default, update other addresses
  if (body.isDefault) {
    await prisma.address.updateMany({
      where: { userId: auth.user.id, isDefault: true },
      data: { isDefault: false },
    })
  }

  // Check if this is the first address
  const addressCount = await prisma.address.count({
    where: { userId: auth.user.id },
  })

  const address = await prisma.address.create({
    data: {
      ...body,
      userId: auth.user.id,
      isDefault: body.isDefault || addressCount === 0,
    },
  })

  return successResponse(address, undefined, 201)
}

export const GET = withErrorHandler(getHandler)
export const POST = withErrorHandler(postHandler)
