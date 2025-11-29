import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import {
  successResponse,
  errorResponse,
  parseBody,
  withErrorHandler,
} from '@/lib/api-utils'
import { getCurrentUser } from '@/lib/auth'

const CART_SESSION_COOKIE = 'cart_session_id'

interface RouteContext {
  params: Promise<{ itemId: string }>
}

async function getCurrentCart() {
  const user = await getCurrentUser()
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value

  if (user) {
    return prisma.cart.findUnique({ where: { userId: user.id } })
  } else if (sessionId) {
    return prisma.cart.findUnique({ where: { sessionId } })
  }
  return null
}

// PUT /api/cart/[itemId] - Update cart item
async function putHandler(request: NextRequest, context: RouteContext) {
  const { itemId } = await context.params
  const body = await parseBody(
    request,
    z.object({
      quantity: z.number().int().min(0),
      prescription: z.any().optional(),
    })
  )

  const cart = await getCurrentCart()
  if (!cart) {
    return errorResponse('Cart not found', 404)
  }

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
  })

  if (!item) {
    return errorResponse('Cart item not found', 404)
  }

  if (body.quantity === 0) {
    // Remove item
    await prisma.cartItem.delete({ where: { id: itemId } })
  } else {
    // Update quantity
    await prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity: body.quantity,
        ...(body.prescription && { prescription: body.prescription }),
      },
    })
  }

  // Fetch updated cart
  const updatedCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          product: {
            include: { images: { where: { isPrimary: true }, take: 1 } },
          },
          variant: true,
        },
      },
    },
  })

  return successResponse(updatedCart)
}

// DELETE /api/cart/[itemId] - Remove cart item
async function deleteHandler(request: NextRequest, context: RouteContext) {
  const { itemId } = await context.params

  const cart = await getCurrentCart()
  if (!cart) {
    return errorResponse('Cart not found', 404)
  }

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
  })

  if (!item) {
    return errorResponse('Cart item not found', 404)
  }

  await prisma.cartItem.delete({ where: { id: itemId } })

  // Fetch updated cart
  const updatedCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          product: {
            include: { images: { where: { isPrimary: true }, take: 1 } },
          },
          variant: true,
        },
      },
    },
  })

  return successResponse(updatedCart)
}

export const PUT = withErrorHandler(putHandler)
export const DELETE = withErrorHandler(deleteHandler)
