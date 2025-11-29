import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { categorySchema } from '@/lib/validations'
import {
  successResponse,
  errorResponse,
  parseBody,
  withAuth,
  withErrorHandler,
} from '@/lib/api-utils'
import { slugify } from '@/lib/utils'

// GET /api/categories - List categories
async function getHandler(request: NextRequest) {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      children: {
        where: { isActive: true },
        select: { id: true, name: true, slug: true, image: true },
      },
      _count: { select: { products: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })

  return successResponse(categories)
}

// POST /api/categories - Create category
async function postHandler(request: NextRequest) {
  const auth = await withAuth(request, { requiredPermission: 'products:create' })
  if (auth instanceof Response) return auth

  const body = await parseBody(request, categorySchema)
  const slug = body.slug || slugify(body.name)

  const existing = await prisma.category.findUnique({ where: { slug } })
  if (existing) {
    return errorResponse('A category with this slug already exists', 400)
  }

  const category = await prisma.category.create({
    data: { ...body, slug },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      children: true,
    },
  })

  return successResponse(category, undefined, 201)
}

export const GET = withErrorHandler(getHandler)
export const POST = withErrorHandler(postHandler)
