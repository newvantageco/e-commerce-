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

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/addresses/[id] - Get single address
async function getHandler(request: NextRequest, context: RouteContext) {
  const auth = await withAuth(request)
  if (auth instanceof Response) return auth

  const { id } = await context.params

  const address = await prisma.address.findFirst({
    where: { id, userId: auth.user.id },
  })

  if (!address) {
    return errorResponse('Address not found', 404)
  }

  return successResponse(address)
}

// PUT /api/addresses/[id] - Update address
async function putHandler(request: NextRequest, context: RouteContext) {
  const auth = await withAuth(request)
  if (auth instanceof Response) return auth

  const { id } = await context.params
  const body = await parseBody(request, addressSchema.partial())

  const existingAddress = await prisma.address.findFirst({
    where: { id, userId: auth.user.id },
  })

  if (!existingAddress) {
    return errorResponse('Address not found', 404)
  }

  // If setting as default, update other addresses
  if (body.isDefault) {
    await prisma.address.updateMany({
      where: { userId: auth.user.id, isDefault: true, NOT: { id } },
      data: { isDefault: false },
    })
  }

  const address = await prisma.address.update({
    where: { id },
    data: body,
  })

  return successResponse(address)
}

// DELETE /api/addresses/[id] - Delete address
async function deleteHandler(request: NextRequest, context: RouteContext) {
  const auth = await withAuth(request)
  if (auth instanceof Response) return auth

  const { id } = await context.params

  const address = await prisma.address.findFirst({
    where: { id, userId: auth.user.id },
  })

  if (!address) {
    return errorResponse('Address not found', 404)
  }

  await prisma.address.delete({ where: { id } })

  // If deleted address was default, make another one default
  if (address.isDefault) {
    const nextAddress = await prisma.address.findFirst({
      where: { userId: auth.user.id },
      orderBy: { createdAt: 'desc' },
    })

    if (nextAddress) {
      await prisma.address.update({
        where: { id: nextAddress.id },
        data: { isDefault: true },
      })
    }
  }

  return successResponse({ deleted: true })
}

export const GET = withErrorHandler(getHandler)
export const PUT = withErrorHandler(putHandler)
export const DELETE = withErrorHandler(deleteHandler)
