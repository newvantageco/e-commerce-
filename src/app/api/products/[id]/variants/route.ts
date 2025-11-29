import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { productVariantSchema } from '@/lib/validations'
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

// GET /api/products/[id]/variants - List variants
async function getHandler(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!product) {
    return errorResponse('Product not found', 404)
  }

  const variants = await prisma.productVariant.findMany({
    where: { productId: id },
    orderBy: { createdAt: 'asc' },
  })

  return successResponse(variants)
}

// POST /api/products/[id]/variants - Create variant
async function postHandler(request: NextRequest, context: RouteContext) {
  const auth = await withAuth(request, { requiredPermission: 'products:update' })
  if (auth instanceof Response) return auth

  const { id } = await context.params
  const body = await parseBody(request, productVariantSchema)

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!product) {
    return errorResponse('Product not found', 404)
  }

  // Check SKU uniqueness
  const existingSku = await prisma.productVariant.findUnique({
    where: { sku: body.sku },
  })

  if (existingSku) {
    return errorResponse('A variant with this SKU already exists', 400)
  }

  const variant = await prisma.productVariant.create({
    data: {
      ...body,
      productId: id,
    },
  })

  return successResponse(variant, undefined, 201)
}

export const GET = withErrorHandler(getHandler)
export const POST = withErrorHandler(postHandler)
