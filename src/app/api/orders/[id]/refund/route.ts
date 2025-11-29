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
import { createRefund, formatAmountForStripe, formatAmountFromStripe } from '@/lib/stripe'
import { Decimal } from '@prisma/client/runtime/library'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /api/orders/[id]/refund - Refund order
async function postHandler(request: NextRequest, context: RouteContext) {
  const auth = await withAuth(request, { requiredPermission: 'orders:refund' })
  if (auth instanceof Response) return auth

  const { id } = await context.params

  const refundSchema = z.object({
    amount: z.number().positive().optional(), // Full refund if not specified
    reason: z.string().optional(),
  })

  const body = await parseBody(request, refundSchema)

  const order = await prisma.order.findUnique({
    where: { id },
    include: { transactions: true },
  })

  if (!order) {
    return errorResponse('Order not found', 404)
  }

  if (!order.stripePaymentIntentId) {
    return errorResponse('No payment found for this order', 400)
  }

  if (order.paymentStatus !== 'PAID') {
    return errorResponse('Order has not been paid', 400)
  }

  // Calculate max refundable amount
  const totalPaid = parseFloat(order.total.toString())
  const alreadyRefunded = order.transactions
    .filter((t) => t.type === 'REFUND' || t.type === 'PARTIAL_REFUND')
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)

  const maxRefundable = totalPaid - alreadyRefunded
  const refundAmount = body.amount ? Math.min(body.amount, maxRefundable) : maxRefundable

  if (refundAmount <= 0) {
    return errorResponse('No refundable amount available', 400)
  }

  // Process refund with Stripe
  const refund = await createRefund(
    order.stripePaymentIntentId,
    formatAmountForStripe(refundAmount)
  )

  // Record transaction
  await prisma.transaction.create({
    data: {
      orderId: id,
      type: refundAmount === totalPaid ? 'REFUND' : 'PARTIAL_REFUND',
      amount: new Decimal(refundAmount),
      status: refund.status || 'succeeded',
      stripeId: refund.id,
      metadata: { reason: body.reason },
    },
  })

  // Update order status
  const newPaymentStatus =
    refundAmount >= maxRefundable ? 'REFUNDED' : 'PARTIALLY_REFUNDED'

  await prisma.order.update({
    where: { id },
    data: {
      paymentStatus: newPaymentStatus,
      status: newPaymentStatus === 'REFUNDED' ? 'REFUNDED' : order.status,
    },
  })

  // Add timeline entry
  await prisma.orderTimeline.create({
    data: {
      orderId: id,
      status: newPaymentStatus,
      message: `Refund of $${refundAmount.toFixed(2)} processed${body.reason ? `: ${body.reason}` : ''}`,
      createdBy: auth.user.id,
    },
  })

  return successResponse({
    refundId: refund.id,
    amount: refundAmount,
    status: refund.status,
  })
}

export const POST = withErrorHandler(postHandler)
