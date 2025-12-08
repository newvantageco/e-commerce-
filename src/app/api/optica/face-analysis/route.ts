/**
 * OpticaVision™ API - Face Analysis & Frame Recommendations
 *
 * POST /api/optica/face-analysis - Analyze face and get recommendations
 * GET /api/optica/face-analysis - Get user's analysis history
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
  getPagination,
} from '@/lib/api-utils'
import {
  performFaceAnalysis,
  calculateFrameMatchScore,
  FacialMeasurements,
  ColorAnalysis,
  getColorRecommendations,
} from '@/lib/optica-vision'
import { FaceShape, SkinTone, FrameShape, FrameMaterial } from '@prisma/client'

// ==================== Validation Schemas ====================

const facialMeasurementsSchema = z.object({
  faceWidth: z.number().min(100).max(200),
  faceLength: z.number().min(100).max(250),
  foreheadWidth: z.number().min(80).max(180),
  cheekboneWidth: z.number().min(80).max(180),
  jawWidth: z.number().min(70).max(170),
  noseBridgeHeight: z.number().optional(),
  noseBridgeWidth: z.number().optional(),
})

const colorAnalysisSchema = z.object({
  skinTone: z.enum(['WARM', 'COOL', 'NEUTRAL']),
  hairColor: z.string().optional(),
  eyeColor: z.string().optional(),
})

const faceAnalysisInputSchema = z.object({
  measurements: facialMeasurementsSchema,
  colorAnalysis: colorAnalysisSchema.optional(),
  sessionId: z.string().optional(), // For anonymous users
})

// ==================== POST: Create Face Analysis ====================

async function handlePost(request: NextRequest) {
  // Auth is optional - can work for anonymous users with sessionId
  const authResult = await withAuth(request, {})
  const userId = authResult instanceof Response ? null : authResult.user.id

  const body = await parseBody(request, faceAnalysisInputSchema)
  const { measurements, colorAnalysis, sessionId } = body

  if (!userId && !sessionId) {
    return errorResponse('Either authentication or sessionId is required', 400)
  }

  // Perform face analysis
  const colorData = colorAnalysis ? {
    skinTone: colorAnalysis.skinTone as SkinTone,
    hairColor: colorAnalysis.hairColor || '',
    eyeColor: colorAnalysis.eyeColor || '',
    recommendedColors: getColorRecommendations(colorAnalysis.skinTone as SkinTone).colors,
  } : undefined

  const analysisResult = performFaceAnalysis(
    measurements as FacialMeasurements,
    colorData
  )

  // Store analysis in database
  const faceAnalysis = await prisma.faceAnalysis.create({
    data: {
      userId: userId || undefined,
      sessionId: !userId ? sessionId : undefined,

      // Face shape
      faceShape: analysisResult.faceShape,
      faceShapeConfidence: analysisResult.confidence,

      // Measurements
      faceWidth: measurements.faceWidth,
      faceLength: measurements.faceLength,
      foreheadWidth: measurements.foreheadWidth,
      cheekboneWidth: measurements.cheekboneWidth,
      jawWidth: measurements.jawWidth,
      noseBridgeHeight: measurements.noseBridgeHeight,
      noseBridgeWidth: measurements.noseBridgeWidth,

      // Proportions
      widthToLengthRatio: analysisResult.proportions.widthToLengthRatio,
      foreheadToJawRatio: analysisResult.proportions.foreheadToJawRatio,

      // Color analysis
      skinTone: colorData?.skinTone,
      hairColor: colorData?.hairColor,
      eyeColor: colorData?.eyeColor,

      // Recommendations
      recommendedShapes: analysisResult.recommendedFrameShapes,
      recommendedMaterials: analysisResult.recommendedMaterials,
      recommendedColors: colorData?.recommendedColors || [],

      // Optimal dimensions
      optimalFrameWidth: analysisResult.optimalDimensions.frameWidth,
      optimalBridgeWidth: analysisResult.optimalDimensions.bridgeWidth,
      optimalTempleLength: analysisResult.optimalDimensions.templeLength,
    },
  })

  // Get product recommendations based on analysis
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      frameShape: { in: analysisResult.recommendedFrameShapes },
    },
    take: 20,
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      brand: { select: { name: true } },
    },
  })

  // Calculate match scores for each product
  const recommendations = products.map(product => {
    const matchScore = calculateFrameMatchScore(analysisResult, {
      id: product.id,
      frameShape: product.frameShape,
      frameMaterial: product.frameMaterial,
      frameWidth: product.frameWidth,
      lensWidth: product.lensWidth,
      bridgeWidth: product.bridgeWidth,
      templeLength: product.templeLength,
    })

    return {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        frameShape: product.frameShape,
        frameMaterial: product.frameMaterial,
        image: product.images[0]?.url,
        brand: product.brand?.name,
      },
      matchScore,
    }
  }).sort((a, b) => b.matchScore.overallScore - a.matchScore.overallScore)

  // Store top recommendations
  const topRecommendations = recommendations.slice(0, 10)
  await Promise.all(
    topRecommendations.map((rec, index) =>
      prisma.frameRecommendation.create({
        data: {
          faceAnalysisId: faceAnalysis.id,
          productId: rec.product.id,
          overallScore: rec.matchScore.overallScore,
          shapeScore: rec.matchScore.shapeScore,
          sizeScore: rec.matchScore.sizeScore,
          colorScore: rec.matchScore.colorScore,
          styleScore: rec.matchScore.styleScore,
          matchReasons: rec.matchScore.matchReasons,
          warnings: rec.matchScore.warnings,
          rank: index + 1,
        },
      })
    )
  )

  return successResponse({
    analysisId: faceAnalysis.id,
    faceShape: analysisResult.faceShape,
    confidence: analysisResult.confidence,
    proportions: analysisResult.proportions,
    optimalDimensions: analysisResult.optimalDimensions,
    recommendedFrameShapes: analysisResult.recommendedFrameShapes,
    recommendedMaterials: analysisResult.recommendedMaterials,
    colorRecommendations: colorData?.recommendedColors,
    topRecommendations: topRecommendations.map(rec => ({
      ...rec.product,
      score: rec.matchScore.overallScore,
      matchReasons: rec.matchScore.matchReasons,
      warnings: rec.matchScore.warnings,
    })),
  }, undefined, 201)
}

// ==================== GET: Get Analysis History ====================

async function handleGet(request: NextRequest) {
  const authResult = await withAuth(request)
  if (authResult instanceof Response) return authResult

  const params = parseQueryParams(request)
  const { page, limit, skip } = getPagination(params)

  const [analyses, total] = await Promise.all([
    prisma.faceAnalysis.findMany({
      where: { userId: authResult.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        recommendations: {
          orderBy: { rank: 'asc' },
          take: 5,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
      },
    }),
    prisma.faceAnalysis.count({ where: { userId: authResult.user.id } }),
  ])

  return successResponse(
    analyses.map(analysis => ({
      id: analysis.id,
      faceShape: analysis.faceShape,
      confidence: analysis.faceShapeConfidence,
      measurements: {
        faceWidth: analysis.faceWidth,
        faceLength: analysis.faceLength,
        foreheadWidth: analysis.foreheadWidth,
        cheekboneWidth: analysis.cheekboneWidth,
        jawWidth: analysis.jawWidth,
      },
      optimalDimensions: {
        frameWidth: analysis.optimalFrameWidth,
        bridgeWidth: analysis.optimalBridgeWidth,
        templeLength: analysis.optimalTempleLength,
      },
      recommendedShapes: analysis.recommendedShapes,
      topProducts: analysis.recommendations.map(rec => ({
        id: rec.product.id,
        name: rec.product.name,
        slug: rec.product.slug,
        price: rec.product.price,
        image: rec.product.images[0]?.url,
        score: rec.overallScore,
      })),
      createdAt: analysis.createdAt,
    })),
    { page, limit, total, totalPages: Math.ceil(total / limit) }
  )
}

// ==================== Exports ====================

export const POST = withErrorHandler(handlePost)
export const GET = withErrorHandler(handleGet)
