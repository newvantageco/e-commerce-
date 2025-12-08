/**
 * OpticaFit™ API - Virtual Try-On Session Management
 *
 * POST /api/optica/virtual-tryon - Create/update try-on session
 * GET /api/optica/virtual-tryon - Get session details
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import {
  withErrorHandler,
  withAuth,
  successResponse,
  errorResponse,
  parseBody,
  parseQueryParams,
} from '@/lib/api-utils'

// ==================== Validation Schemas ====================

const createSessionSchema = z.object({
  sessionId: z.string().optional(),
  faceAnalysisId: z.string().optional(),
  deviceType: z.enum(['MOBILE', 'TABLET', 'DESKTOP']).optional(),
  browserInfo: z.string().optional(),
})

const updateSessionSchema = z.object({
  sessionId: z.string(),
  productViewed: z.string().optional(),
  productSaved: z.string().optional(),
  productUnsaved: z.string().optional(),
  timeSpentSeconds: z.number().optional(),
  addedToCart: z.boolean().optional(),
  purchased: z.boolean().optional(),
  orderId: z.string().optional(),
  renderQuality: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  userRating: z.number().int().min(1).max(5).optional(),
})

// ==================== POST: Create/Update Session ====================

async function handlePost(request: NextRequest) {
  // Auth is optional
  const authResult = await withAuth(request, {})
  const userId = authResult instanceof Response ? null : authResult.user.id

  const body = await parseBody(request)

  // Determine if this is create or update
  if (body.productViewed || body.productSaved || body.timeSpentSeconds !== undefined) {
    // Update existing session
    const updateBody = updateSessionSchema.parse(body)

    const session = await prisma.virtualTryOnSession.findFirst({
      where: {
        OR: [
          { id: updateBody.sessionId },
          { sessionId: updateBody.sessionId },
        ],
      },
    })

    if (!session) {
      return errorResponse('Session not found', 404)
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (updateBody.productViewed) {
      updateData.productsViewed = {
        push: updateBody.productViewed,
      }
    }

    if (updateBody.productSaved) {
      updateData.productsSaved = {
        push: updateBody.productSaved,
      }
    }

    if (updateBody.productUnsaved) {
      // Remove from saved - need to fetch current and filter
      const currentSaved = session.productsSaved.filter(
        id => id !== updateBody.productUnsaved
      )
      updateData.productsSaved = currentSaved
    }

    if (updateBody.timeSpentSeconds !== undefined) {
      updateData.timeSpentSeconds = {
        increment: updateBody.timeSpentSeconds,
      }
    }

    if (updateBody.addedToCart !== undefined) {
      updateData.addedToCart = updateBody.addedToCart
    }

    if (updateBody.purchased !== undefined) {
      updateData.purchased = updateBody.purchased
      if (updateBody.orderId) {
        updateData.orderId = updateBody.orderId
      }
    }

    if (updateBody.renderQuality) {
      updateData.renderQuality = updateBody.renderQuality
    }

    if (updateBody.userRating) {
      updateData.userRating = updateBody.userRating
    }

    const updatedSession = await prisma.virtualTryOnSession.update({
      where: { id: session.id },
      data: updateData,
    })

    return successResponse({
      sessionId: updatedSession.id,
      productsViewed: updatedSession.productsViewed.length,
      productsSaved: updatedSession.productsSaved.length,
      timeSpentSeconds: updatedSession.timeSpentSeconds,
      addedToCart: updatedSession.addedToCart,
      purchased: updatedSession.purchased,
    })
  }

  // Create new session
  const createBody = createSessionSchema.parse(body)

  if (!userId && !createBody.sessionId) {
    return errorResponse('Either authentication or sessionId is required', 400)
  }

  // Check if session already exists
  if (createBody.sessionId) {
    const existingSession = await prisma.virtualTryOnSession.findFirst({
      where: { sessionId: createBody.sessionId },
    })

    if (existingSession) {
      return successResponse({
        sessionId: existingSession.id,
        isExisting: true,
        productsViewed: existingSession.productsViewed.length,
        productsSaved: existingSession.productsSaved.length,
        timeSpentSeconds: existingSession.timeSpentSeconds,
      })
    }
  }

  const session = await prisma.virtualTryOnSession.create({
    data: {
      userId: userId || undefined,
      sessionId: !userId ? createBody.sessionId : undefined,
      faceAnalysisId: createBody.faceAnalysisId,
      deviceType: createBody.deviceType,
      browserInfo: createBody.browserInfo,
      productsViewed: [],
      productsSaved: [],
    },
  })

  return successResponse({
    sessionId: session.id,
    isExisting: false,
    faceAnalysisId: session.faceAnalysisId,
  }, undefined, 201)
}

// ==================== GET: Get Session Details ====================

async function handleGet(request: NextRequest) {
  const params = parseQueryParams(request)
  const sessionId = String(params.sessionId || '')

  if (!sessionId) {
    // If authenticated, return user's sessions
    const authResult = await withAuth(request)
    if (authResult instanceof Response) {
      return errorResponse('Session ID or authentication required', 400)
    }

    const sessions = await prisma.virtualTryOnSession.findMany({
      where: { userId: authResult.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        faceAnalysis: {
          select: {
            faceShape: true,
            optimalFrameWidth: true,
          },
        },
      },
    })

    return successResponse(sessions.map(s => ({
      id: s.id,
      productsViewed: s.productsViewed.length,
      productsSaved: s.productsSaved,
      timeSpentSeconds: s.timeSpentSeconds,
      addedToCart: s.addedToCart,
      purchased: s.purchased,
      faceShape: s.faceAnalysis?.faceShape,
      deviceType: s.deviceType,
      createdAt: s.createdAt,
    })))
  }

  const session = await prisma.virtualTryOnSession.findFirst({
    where: {
      OR: [
        { id: sessionId },
        { sessionId: sessionId },
      ],
    },
    include: {
      faceAnalysis: {
        select: {
          id: true,
          faceShape: true,
          faceShapeConfidence: true,
          optimalFrameWidth: true,
          optimalBridgeWidth: true,
          recommendedShapes: true,
        },
      },
    },
  })

  if (!session) {
    return errorResponse('Session not found', 404)
  }

  // Get product details for viewed/saved products
  const allProductIds = [...new Set([...session.productsViewed, ...session.productsSaved])]

  const products = await prisma.product.findMany({
    where: { id: { in: allProductIds } },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      frameShape: true,
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { url: true },
      },
    },
  })

  const productMap = new Map(products.map(p => [p.id, p]))

  return successResponse({
    id: session.id,
    faceAnalysis: session.faceAnalysis,
    productsViewed: session.productsViewed.map(id => productMap.get(id)).filter(Boolean),
    productsSaved: session.productsSaved.map(id => productMap.get(id)).filter(Boolean),
    stats: {
      totalViewed: session.productsViewed.length,
      totalSaved: session.productsSaved.length,
      timeSpentSeconds: session.timeSpentSeconds,
      timeSpentFormatted: formatTime(session.timeSpentSeconds),
    },
    conversion: {
      addedToCart: session.addedToCart,
      purchased: session.purchased,
      orderId: session.orderId,
    },
    quality: {
      renderQuality: session.renderQuality,
      userRating: session.userRating,
    },
    deviceType: session.deviceType,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  })
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

// ==================== Exports ====================

export const POST = withErrorHandler(handlePost)
export const GET = withErrorHandler(handleGet)
