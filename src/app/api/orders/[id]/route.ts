import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import {
  successResponse,
  errorResponse,
  parseBody,
  withAuth,
  withErrorHandler,
} from '@/lib/api-utils'
import { createRefund, formatAmountForStripe } from '@/lib/stripe'
import { sendEmail, shippingConfirmationEmail } from '@/lib/email'
import { OrderStatus, PaymentStatus, FulfillmentStatus, Decimal } from '@prisma/client'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/orders/[id] - Get order details
async function getHandler(request: NextRequest, context: RouteContext) {
  const auth = await withAuth(request)
  if (auth instanceof Response) return auth

  const { id } = await context.params

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id }, { orderNumber: id }],
      // Customers can only see their own orders
      ...(auth.user.role === 'CUSTOMER' && { userId: auth.user.id }),
    },
    include: {
      items: {
        include: {
          product: {
            select: { slug: true, images: { where: { isPrimary: true }, take: 1 } },
          },
        },
      },
      user: {
        select: { firstName: true, lastName: true, email: true, phone: true },
      },
      coupon: {
        select: { code: true, discountType: true, discountValue: true },
      },
      transactions: true,
      timeline: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!order) {
    return errorResponse('Order not found', 404)
  }

  return successResponse(order)
}

// PUT /api/orders/[id] - Update order status
async function putHandler(request: NextRequest, context: RouteContext) {
  const auth = await withAuth(request, { requiredPermission: 'orders:update' })
  if (auth instanceof Response) return auth

  const { id } = await context.params

  const updateSchema = z.object({
    status: z.nativeEnum(OrderStatus).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    fulfillmentStatus: z.nativeEnum(FulfillmentStatus).optional(),
    trackingNumber: z.string().optional(),
    trackingUrl: z.string().url().optional(),
    internalNote: z.string().optional(),
  })

  const body = await parseBody(request, updateSchema)

  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: true },
  })

  if (!order) {
    return errorResponse('Order not found', 404)
  }

  // Update order
  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      ...body,
      ...(body.status === 'SHIPPED' && { shippedAt: new Date() }),
      ...(body.status === 'DELIVERED' && { deliveredAt: new Date() }),
    },
    include: {
      items: true,
      timeline: { orderBy: { createdAt: 'desc' } },
    },
  })

  // Add timeline entry
  if (body.status) {
    await prisma.orderTimeline.create({
      data: {
        orderId: id,
        status: body.status,
        message: getStatusMessage(body.status),
        createdBy: auth.user.id,
      },
    })
  }

  // Send shipping notification
  if (body.status === 'SHIPPED' && body.trackingNumber) {
    const customerName = order.user
      ? `${order.user.firstName} ${order.user.lastName}`
      : (order.shippingAddress as { firstName?: string; lastName?: string })?.firstName || 'Customer'

    sendEmail({
      to: order.email,
      subject: `Your order ${order.orderNumber} has shipped!`,
      html: shippingConfirmationEmail({
        orderNumber: order.orderNumber,
        customerName,
        trackingNumber: body.trackingNumber,
        trackingUrl: body.trackingUrl,
      }),
    }).catch(console.error)
  }

  return successResponse(updatedOrder)
}

function getStatusMessage(status: OrderStatus): string {
  const messages: Record<OrderStatus, string> = {
    PENDING: 'Order is pending',
    CONFIRMED: 'Order has been confirmed',
    PROCESSING: 'Order is being processed',
    SHIPPED: 'Order has been shipped',
    DELIVERED: 'Order has been delivered',
    CANCELLED: 'Order has been cancelled',
    REFUNDED: 'Order has been refunded',
    ON_HOLD: 'Order is on hold',
  }
  return messages[status]
}

export const GET = withErrorHandler(getHandler)
export const PUT = withErrorHandler(putHandler)
