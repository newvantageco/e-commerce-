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

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/categories/[id]
async function getHandler(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  const category = await prisma.category.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      isActive: true,
    },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      children: {
        where: { isActive: true },
        select: { id: true, name: true, slug: true, image: true },
      },
      products: {
        where: { isActive: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
        },
        take: 8,
      },
      _count: { select: { products: true } },
    },
  })

  if (!category) {
    return errorResponse('Category not found', 404)
  }

  return successResponse(category)
}

// PUT /api/categories/[id]
async function putHandler(request: NextRequest, context: RouteContext) {
  const auth = await withAuth(request, { requiredPermission: 'products:update' })
  if (auth instanceof Response) return auth

  const { id } = await context.params
  const body = await parseBody(request, categorySchema.partial())

  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) {
    return errorResponse('Category not found', 404)
  }

  let slug = body.slug
  if (body.name && !slug) {
    slug = slugify(body.name)
  }

  if (slug && slug !== existing.slug) {
    const slugExists = await prisma.category.findFirst({
      where: { slug, id: { not: id } },
    })
    if (slugExists) {
      return errorResponse('A category with this slug already exists', 400)
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: { ...body, slug },
    include: {
      parent: true,
      children: true,
    },
  })

  return successResponse(category)
}

// DELETE /api/categories/[id]
async function deleteHandler(request: NextRequest, context: RouteContext) {
  const auth = await withAuth(request, { requiredPermission: 'products:delete' })
  if (auth instanceof Response) return auth

  const { id } = await context.params

  const category = await prisma.category.findUnique({ where: { id } })
  if (!category) {
    return errorResponse('Category not found', 404)
  }

  await prisma.category.update({
    where: { id },
    data: { isActive: false },
  })

  return successResponse({ message: 'Category deleted successfully' })
}

export const GET = withErrorHandler(getHandler)
export const PUT = withErrorHandler(putHandler)
export const DELETE = withErrorHandler(deleteHandler)
