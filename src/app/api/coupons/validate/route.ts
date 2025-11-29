import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import {
  successResponse,
  errorResponse,
  parseBody,
  withErrorHandler,
} from '@/lib/api-utils'

// POST /api/coupons/validate - Validate coupon code
async function postHandler(request: NextRequest) {
  const body = await parseBody(
    request,
    z.object({
      code: z.string().min(1),
      subtotal: z.number().optional(),
    })
  )

  const coupon = await prisma.coupon.findFirst({
    where: {
      code: body.code.toUpperCase(),
      isActive: true,
      startsAt: { lte: new Date() },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  })

  if (!coupon) {
    return errorResponse('Invalid or expired coupon code', 404)
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return errorResponse('Coupon usage limit has been reached', 400)
  }

  // Check minimum purchase
  if (
    coupon.minimumPurchase &&
    body.subtotal &&
    body.subtotal < parseFloat(coupon.minimumPurchase.toString())
  ) {
    return errorResponse(
      `Minimum purchase of $${coupon.minimumPurchase} required`,
      400
    )
  }

  // Calculate discount
  let discount = 0
  const discountValue = parseFloat(coupon.discountValue.toString())

  if (body.subtotal) {
    switch (coupon.discountType) {
      case 'PERCENTAGE':
        discount = body.subtotal * (discountValue / 100)
        if (coupon.maximumDiscount) {
          discount = Math.min(discount, parseFloat(coupon.maximumDiscount.toString()))
        }
        break
      case 'FIXED_AMOUNT':
        discount = Math.min(discountValue, body.subtotal)
        break
      case 'FREE_SHIPPING':
        // Return 0 discount but mark as valid
        break
    }
  }

  return successResponse({
    valid: true,
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: discountValue,
      description: coupon.description,
    },
    discount,
  })
}

export const POST = withErrorHandler(postHandler)
