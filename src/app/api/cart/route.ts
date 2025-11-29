import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { cartItemSchema } from '@/lib/validations'
import {
  successResponse,
  errorResponse,
  parseBody,
  withErrorHandler,
} from '@/lib/api-utils'
import { getCurrentUser } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

const CART_SESSION_COOKIE = 'cart_session_id'

async function getOrCreateCart() {
  const user = await getCurrentUser()
  const cookieStore = await cookies()
  let sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value

  if (user) {
    // User is logged in, find or create their cart
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
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

    if (!cart) {
      // Check if there's a session cart to merge
      if (sessionId) {
        const sessionCart = await prisma.cart.findUnique({
          where: { sessionId },
          include: { items: true },
        })

        if (sessionCart) {
          // Create user cart with session items
          cart = await prisma.cart.create({
            data: {
              userId: user.id,
              items: {
                create: sessionCart.items.map((item) => ({
                  productId: item.productId,
                  variantId: item.variantId,
                  quantity: item.quantity,
                  prescription: item.prescription,
                })),
              },
            },
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

          // Delete session cart
          await prisma.cart.delete({ where: { id: sessionCart.id } })
          cookieStore.delete(CART_SESSION_COOKIE)
        } else {
          cart = await prisma.cart.create({
            data: { userId: user.id },
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
        }
      } else {
        cart = await prisma.cart.create({
          data: { userId: user.id },
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
      }
    }

    return cart
  } else {
    // Guest user - use session
    if (!sessionId) {
      sessionId = uuidv4()
      cookieStore.set(CART_SESSION_COOKIE, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
    }

    let cart = await prisma.cart.findUnique({
      where: { sessionId },
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

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          sessionId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
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
    }

    return cart
  }
}

// Calculate cart totals
function calculateCartTotals(
  items: Array<{
    quantity: number
    product: { price: { toString(): string }; compareAtPrice?: { toString(): string } | null }
    variant?: { price?: { toString(): string } | null } | null
  }>
) {
  let subtotal = 0
  let compareAtTotal = 0

  items.forEach((item) => {
    const price = item.variant?.price
      ? parseFloat(item.variant.price.toString())
      : parseFloat(item.product.price.toString())
    subtotal += price * item.quantity

    const compareAt = item.product.compareAtPrice
      ? parseFloat(item.product.compareAtPrice.toString())
      : price
    compareAtTotal += compareAt * item.quantity
  })

  return {
    subtotal,
    compareAtTotal,
    savings: compareAtTotal - subtotal,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  }
}

// GET /api/cart
async function getHandler(request: NextRequest) {
  const cart = await getOrCreateCart()
  const totals = calculateCartTotals(cart.items)

  return successResponse({
    ...cart,
    ...totals,
  })
}

// POST /api/cart - Add item to cart
async function postHandler(request: NextRequest) {
  const body = await parseBody(request, cartItemSchema)
  const cart = await getOrCreateCart()

  // Verify product exists and is active
  const product = await prisma.product.findFirst({
    where: { id: body.productId, isActive: true },
  })

  if (!product) {
    return errorResponse('Product not found', 404)
  }

  // Verify variant if provided
  if (body.variantId) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: body.variantId, productId: body.productId, isActive: true },
    })
    if (!variant) {
      return errorResponse('Variant not found', 404)
    }
  }

  // Check if item already exists in cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: body.productId,
      variantId: body.variantId || null,
    },
  })

  if (existingItem) {
    // Update quantity
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + body.quantity,
        prescription: body.prescription || existingItem.prescription,
      },
    })
  } else {
    // Add new item
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: body.productId,
        variantId: body.variantId,
        quantity: body.quantity,
        prescription: body.prescription,
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

  const totals = calculateCartTotals(updatedCart!.items)

  return successResponse({
    ...updatedCart,
    ...totals,
  })
}

// DELETE /api/cart - Clear cart
async function deleteHandler(request: NextRequest) {
  const cart = await getOrCreateCart()

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  })

  return successResponse({ message: 'Cart cleared', items: [], itemCount: 0, subtotal: 0 })
}

export const GET = withErrorHandler(getHandler)
export const POST = withErrorHandler(postHandler)
export const DELETE = withErrorHandler(deleteHandler)
