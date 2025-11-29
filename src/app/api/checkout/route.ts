import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { checkoutSchema } from '@/lib/validations'
import { createPaymentIntent, formatAmountForStripe } from '@/lib/stripe'
import {
  successResponse,
  errorResponse,
  parseBody,
  withErrorHandler,
} from '@/lib/api-utils'
import { getCurrentUser } from '@/lib/auth'
import { generateOrderNumber } from '@/lib/utils'
import { Decimal } from '@prisma/client/runtime/library'

const CART_SESSION_COOKIE = 'cart_session_id'

// POST /api/checkout - Create order and payment intent
async function postHandler(request: NextRequest) {
  const user = await getCurrentUser()
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value

  // Get cart
  let cart
  if (user) {
    cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    })
  } else if (sessionId) {
    cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    })
  }

  if (!cart || cart.items.length === 0) {
    return errorResponse('Cart is empty', 400)
  }

  const body = await parseBody(request, checkoutSchema)

  // Calculate totals
  let subtotal = 0
  const orderItems: Array<{
    productId: string
    variantId: string | null
    name: string
    sku: string
    image: string | null
    price: Decimal
    quantity: number
    total: Decimal
    prescription: unknown
  }> = []

  for (const item of cart.items) {
    // Check stock
    if (item.product.trackInventory) {
      const stockQty = item.variant?.quantity ?? item.product.quantity
      if (stockQty < item.quantity) {
        return errorResponse(
          `Insufficient stock for ${item.product.name}. Only ${stockQty} available.`,
          400
        )
      }
    }

    const price = item.variant?.price
      ? parseFloat(item.variant.price.toString())
      : parseFloat(item.product.price.toString())
    const itemTotal = price * item.quantity
    subtotal += itemTotal

    // Get product image
    const productImage = await prisma.productImage.findFirst({
      where: { productId: item.productId, isPrimary: true },
    })

    orderItems.push({
      productId: item.productId,
      variantId: item.variantId,
      name: item.variant?.name
        ? `${item.product.name} - ${item.variant.name}`
        : item.product.name,
      sku: item.variant?.sku || item.product.sku,
      image: item.variant?.image || productImage?.url || null,
      price: new Decimal(price),
      quantity: item.quantity,
      total: new Decimal(itemTotal),
      prescription: item.prescription,
    })
  }

  // Apply coupon if provided
  let discountTotal = 0
  let coupon = null
  if (body.couponCode) {
    coupon = await prisma.coupon.findFirst({
      where: {
        code: body.couponCode.toUpperCase(),
        isActive: true,
        startsAt: { lte: new Date() },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    })

    if (coupon) {
      // Check usage limits
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return errorResponse('Coupon usage limit reached', 400)
      }

      // Check minimum purchase
      if (coupon.minimumPurchase && subtotal < parseFloat(coupon.minimumPurchase.toString())) {
        return errorResponse(
          `Minimum purchase of $${coupon.minimumPurchase} required for this coupon`,
          400
        )
      }

      // Calculate discount
      const discountValue = parseFloat(coupon.discountValue.toString())
      switch (coupon.discountType) {
        case 'PERCENTAGE':
          discountTotal = subtotal * (discountValue / 100)
          if (coupon.maximumDiscount) {
            discountTotal = Math.min(discountTotal, parseFloat(coupon.maximumDiscount.toString()))
          }
          break
        case 'FIXED_AMOUNT':
          discountTotal = Math.min(discountValue, subtotal)
          break
        case 'FREE_SHIPPING':
          // Will be applied to shipping
          break
      }
    }
  }

  // Calculate shipping (simplified - could be based on address, weight, etc.)
  const shippingTotal = coupon?.discountType === 'FREE_SHIPPING' ? 0 : subtotal >= 100 ? 0 : 9.99

  // Calculate tax (simplified - could integrate with tax service)
  const taxRate = 0.08 // 8% tax
  const taxTotal = (subtotal - discountTotal) * taxRate

  // Calculate total
  const total = subtotal - discountTotal + shippingTotal + taxTotal

  // Create order number
  const orderNumber = generateOrderNumber()

  // Create billing address
  const billingAddress = body.sameAsShipping
    ? body.shippingAddress
    : body.billingAddress || body.shippingAddress

  // Create order
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: user?.id,
      email: body.email,
      phone: body.shippingAddress.phone,
      subtotal: new Decimal(subtotal),
      discountTotal: new Decimal(discountTotal),
      shippingTotal: new Decimal(shippingTotal),
      taxTotal: new Decimal(taxTotal),
      total: new Decimal(total),
      shippingAddress: body.shippingAddress,
      billingAddress: billingAddress,
      shippingMethod: body.shippingMethod || 'standard',
      couponId: coupon?.id,
      couponCode: coupon?.code,
      customerNote: body.customerNote,
      items: {
        create: orderItems,
      },
      timeline: {
        create: {
          status: 'PENDING',
          message: 'Order created',
        },
      },
    },
    include: {
      items: true,
    },
  })

  // Create Stripe payment intent
  const paymentIntent = await createPaymentIntent({
    amount: formatAmountForStripe(total),
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
    },
    description: `Order ${order.orderNumber}`,
  })

  // Update order with payment intent ID
  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  })

  return successResponse({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      subtotal,
      discountTotal,
      shippingTotal,
      taxTotal,
      total,
    },
    clientSecret: paymentIntent.client_secret,
  })
}

export const POST = withErrorHandler(postHandler)
