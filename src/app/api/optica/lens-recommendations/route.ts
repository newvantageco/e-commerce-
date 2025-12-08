/**
 * OpticaLens™ API - Intelligent Lens Configuration
 *
 * POST /api/optica/lens-recommendations - Get lens recommendations
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
} from '@/lib/api-utils'
import {
  generateLensRecommendation,
  LensConfigInput,
  LENS_INDEX_PROPERTIES,
  COATING_PROPERTIES,
} from '@/lib/optica-lens'
import { PrescriptionValues } from '@/lib/optica-scan'

// ==================== Validation Schemas ====================

const prescriptionInputSchema = z.object({
  odSphere: z.number().min(-20).max(20).nullable().optional(),
  odCylinder: z.number().min(-6).max(6).nullable().optional(),
  odAxis: z.number().int().min(1).max(180).nullable().optional(),
  odAdd: z.number().min(0.75).max(4).nullable().optional(),
  osSphere: z.number().min(-20).max(20).nullable().optional(),
  osCylinder: z.number().min(-6).max(6).nullable().optional(),
  osAxis: z.number().int().min(1).max(180).nullable().optional(),
  osAdd: z.number().min(0.75).max(4).nullable().optional(),
  pdSingle: z.number().min(50).max(80).nullable().optional(),
})

const frameInfoSchema = z.object({
  lensWidth: z.number().min(40).max(70).optional(),
  lensHeight: z.number().min(25).max(55).optional(),
  frameShape: z.string().optional(),
})

const lensRecommendationInputSchema = z.object({
  prescriptionId: z.string().optional(),
  prescription: prescriptionInputSchema.optional(),
  usageType: z.enum(['EVERYDAY', 'COMPUTER', 'READING', 'DRIVING', 'SPORTS', 'FASHION']),
  budgetRange: z.enum(['BUDGET', 'MID_RANGE', 'PREMIUM']),
  priorityFactors: z.array(z.enum(['THIN_LIGHT', 'DURABILITY', 'CLARITY', 'PROTECTION', 'COST'])),
  frameInfo: frameInfoSchema.optional(),
  sessionId: z.string().optional(),
})

// ==================== POST: Get Lens Recommendations ====================

async function handlePost(request: NextRequest) {
  // Auth is optional - can work for anonymous users
  const authResult = await withAuth(request, {})
  const userId = authResult instanceof Response ? null : authResult.user.id

  const body = await parseBody(request, lensRecommendationInputSchema)

  let prescriptionValues: PrescriptionValues | undefined

  // Get prescription from ID or direct input
  if (body.prescriptionId) {
    if (!userId) {
      return errorResponse('Authentication required to use saved prescriptions', 401)
    }

    const prescription = await prisma.prescriptionRecord.findFirst({
      where: {
        id: body.prescriptionId,
        userId,
        isActive: true,
      },
    })

    if (!prescription) {
      return errorResponse('Prescription not found', 404)
    }

    prescriptionValues = {
      odSphere: prescription.odSphere,
      odCylinder: prescription.odCylinder,
      odAxis: prescription.odAxis,
      odAdd: prescription.odAdd,
      osSphere: prescription.osSphere,
      osCylinder: prescription.osCylinder,
      osAxis: prescription.osAxis,
      osAdd: prescription.osAdd,
      pdSingle: prescription.pdSingle,
    }
  } else if (body.prescription) {
    prescriptionValues = body.prescription as PrescriptionValues
  }

  // Generate recommendation
  const input: LensConfigInput = {
    prescription: prescriptionValues,
    usageType: body.usageType,
    budgetRange: body.budgetRange,
    priorityFactors: body.priorityFactors,
    frameInfo: body.frameInfo,
  }

  const recommendation = generateLensRecommendation(input)

  // Store recommendation if user is authenticated
  if (userId || body.sessionId) {
    await prisma.lensRecommendation.create({
      data: {
        userId: userId || undefined,
        sessionId: !userId ? body.sessionId : undefined,
        prescriptionId: body.prescriptionId || undefined,
        usageType: body.usageType,
        budgetRange: body.budgetRange,
        priorityFactors: body.priorityFactors,
        lensIndex: recommendation.lensIndex,
        lensDesign: recommendation.lensDesign,
        recommendedCoatings: recommendation.recommendedCoatings,
        estimatedThicknessCenter: recommendation.estimatedThickness.center,
        estimatedThicknessEdge: recommendation.estimatedThickness.edge,
        estimatedWeight: recommendation.estimatedWeight,
        estimatedCost: recommendation.estimatedCost.total,
        recommendations: {
          explanations: recommendation.explanations,
          alternatives: recommendation.alternatives,
        },
      },
    })
  }

  // Get lens index details
  const lensIndexDetails = LENS_INDEX_PROPERTIES[recommendation.lensIndex]

  // Get coating details
  const coatingDetails = recommendation.recommendedCoatings.map(coating => ({
    id: coating,
    ...COATING_PROPERTIES[coating],
  }))

  return successResponse({
    recommendation: {
      lensIndex: {
        id: recommendation.lensIndex,
        name: lensIndexDetails.name,
        description: lensIndexDetails.description,
        refractiveIndex: lensIndexDetails.index,
        thicknessReduction: `${lensIndexDetails.thicknessReduction}%`,
        impactResistance: lensIndexDetails.impactResistance,
      },
      lensDesign: recommendation.lensDesign,
      coatings: coatingDetails,
      estimatedThickness: {
        center: `${recommendation.estimatedThickness.center}mm`,
        edge: `${recommendation.estimatedThickness.edge}mm`,
      },
      estimatedWeight: `${recommendation.estimatedWeight}g per lens`,
      estimatedCost: {
        lensBase: recommendation.estimatedCost.lensBase,
        coatings: recommendation.estimatedCost.coatings,
        total: recommendation.estimatedCost.total,
        formatted: `$${recommendation.estimatedCost.total}`,
      },
    },
    explanations: recommendation.explanations,
    alternatives: recommendation.alternatives.map(alt => ({
      lensIndex: {
        id: alt.lensIndex,
        name: LENS_INDEX_PROPERTIES[alt.lensIndex].name,
      },
      coatings: alt.coatings.map(c => COATING_PROPERTIES[c].name),
      priceDifference: alt.priceDiff,
      benefits: alt.benefits,
      tradeoffs: alt.tradeoffs,
    })),
    input: {
      usageType: body.usageType,
      budgetRange: body.budgetRange,
      priorityFactors: body.priorityFactors,
      hasPrescription: !!prescriptionValues,
    },
  }, undefined, 200)
}

// ==================== Exports ====================

export const POST = withErrorHandler(handlePost)
