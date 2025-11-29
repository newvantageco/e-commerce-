import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { brandSchema } from '@/lib/validations'
import {
  successResponse,
  errorResponse,
  parseBody,
  withAuth,
  withErrorHandler,
} from '@/lib/api-utils'
import { slugify } from '@/lib/utils'

// GET /api/brands - List brands
async function getHandler(request: NextRequest) {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { name: 'asc' },
  })

  return successResponse(brands)
}

// POST /api/brands - Create brand
async function postHandler(request: NextRequest) {
  const auth = await withAuth(request, { requiredPermission: 'products:create' })
  if (auth instanceof Response) return auth

  const body = await parseBody(request, brandSchema)
  const slug = body.slug || slugify(body.name)

  const existing = await prisma.brand.findUnique({ where: { slug } })
  if (existing) {
    return errorResponse('A brand with this slug already exists', 400)
  }

  const brand = await prisma.brand.create({
    data: { ...body, slug },
  })

  return successResponse(brand, undefined, 201)
}

export const GET = withErrorHandler(getHandler)
export const POST = withErrorHandler(postHandler)
