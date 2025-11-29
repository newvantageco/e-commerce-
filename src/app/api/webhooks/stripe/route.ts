import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { constructWebhookEvent, formatAmountFromStripe } from '@/lib/stripe'
import { sendEmail, orderConfirmationEmail } from '@/lib/email'
import { Decimal } from '@prisma/client/runtime/library'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = constructWebhookEvent(body, signature)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId
  if (!orderId) return

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: true,
    },
  })

  if (!order) return

  // Update order status
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      stripeChargeId: paymentIntent.latest_charge as string,
    },
  })

  // Record transaction
  await prisma.transaction.create({
    data: {
      orderId,
      type: 'CHARGE',
      amount: new Decimal(formatAmountFromStripe(paymentIntent.amount)),
      status: 'succeeded',
      stripeId: paymentIntent.id,
    },
  })

  // Add timeline entry
  await prisma.orderTimeline.create({
    data: {
      orderId,
      status: 'CONFIRMED',
      message: 'Payment received',
    },
  })

  // Update inventory
  for (const item of order.items) {
    if (item.variantId) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: { quantity: { decrement: item.quantity } },
      })
    } else {
      await prisma.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      })
    }
  }

  // Update coupon usage if applicable
  if (order.couponId) {
    await prisma.coupon.update({
      where: { id: order.couponId },
      data: { usageCount: { increment: 1 } },
    })
  }

  // Clear cart
  if (order.userId) {
    const cart = await prisma.cart.findUnique({ where: { userId: order.userId } })
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    }
  }

  // Send confirmation email
  const customerName = order.user
    ? `${order.user.firstName} ${order.user.lastName}`
    : (order.shippingAddress as { firstName?: string })?.firstName || 'Customer'

  sendEmail({
    to: order.email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: orderConfirmationEmail({
      orderNumber: order.orderNumber,
      customerName,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price.toString()),
      })),
      subtotal: parseFloat(order.subtotal.toString()),
      shipping: parseFloat(order.shippingTotal.toString()),
      tax: parseFloat(order.taxTotal.toString()),
      total: parseFloat(order.total.toString()),
    }),
  }).catch(console.error)
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId
  if (!orderId) return

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'FAILED',
    },
  })

  await prisma.orderTimeline.create({
    data: {
      orderId,
      status: 'FAILED',
      message: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
    },
  })
}

async function handleRefund(charge: Stripe.Charge) {
  // Find order by charge ID
  const order = await prisma.order.findFirst({
    where: { stripeChargeId: charge.id },
  })

  if (!order) return

  const refundAmount = formatAmountFromStripe(charge.amount_refunded)
  const totalAmount = parseFloat(order.total.toString())

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: charge.refunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      status: charge.refunded ? 'REFUNDED' : order.status,
    },
  })
}
