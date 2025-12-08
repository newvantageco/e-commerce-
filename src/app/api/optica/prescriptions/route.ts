/**
 * OpticaScan™ & OpticaVault™ API - Prescription Management
 *
 * POST /api/optica/prescriptions - Add new prescription
 * GET /api/optica/prescriptions - List user's prescriptions
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
  validatePrescription,
  determinePrescriptionStatus,
  getExpirationDate,
  getDaysUntilExpiration,
  generatePrescriptionSummary,
  classifyPrescriptionStrength,
  PrescriptionValues,
  PrescriptionMetadata,
} from '@/lib/optica-scan'

// ==================== Validation Schemas ====================

const prescriptionValuesSchema = z.object({
  odSphere: z.number().min(-20).max(20).nullable().optional(),
  odCylinder: z.number().min(-6).max(6).nullable().optional(),
  odAxis: z.number().int().min(1).max(180).nullable().optional(),
  odAdd: z.number().min(0.75).max(4).nullable().optional(),
  odPrism: z.number().min(0).max(10).nullable().optional(),
  odPrismDirection: z.enum(['BU', 'BD', 'BI', 'BO']).nullable().optional(),

  osSphere: z.number().min(-20).max(20).nullable().optional(),
  osCylinder: z.number().min(-6).max(6).nullable().optional(),
  osAxis: z.number().int().min(1).max(180).nullable().optional(),
  osAdd: z.number().min(0.75).max(4).nullable().optional(),
  osPrism: z.number().min(0).max(10).nullable().optional(),
  osPrismDirection: z.enum(['BU', 'BD', 'BI', 'BO']).nullable().optional(),

  pdSingle: z.number().min(50).max(80).nullable().optional(),
  pdRight: z.number().min(25).max(40).nullable().optional(),
  pdLeft: z.number().min(25).max(40).nullable().optional(),
})

const prescriptionMetadataSchema = z.object({
  prescribedDate: z.string().datetime().optional(),
  prescriberName: z.string().max(100).optional(),
  prescriberLicense: z.string().max(50).optional(),
  prescriberPhone: z.string().max(20).optional(),
  clinicName: z.string().max(100).optional(),
  clinicAddress: z.string().max(200).optional(),
})

const createPrescriptionSchema = z.object({
  values: prescriptionValuesSchema,
  metadata: prescriptionMetadataSchema.optional(),
  sourceType: z.enum(['MANUAL', 'OCR_SCAN', 'API_IMPORT']).default('MANUAL'),
  consentGiven: z.boolean().default(false),
})

// ==================== POST: Create Prescription ====================

async function handlePost(request: NextRequest) {
  const authResult = await withAuth(request)
  if (authResult instanceof Response) return authResult

  const body = await parseBody(request, createPrescriptionSchema)
  const { values, metadata, sourceType, consentGiven } = body

  // Validate prescription values
  const validation = validatePrescription(values as PrescriptionValues)

  if (!validation.isValid) {
    return errorResponse('Invalid prescription values', 400, {
      validation: validation.errors.map(e => e.message),
    })
  }

  // Calculate expiration date
  const prescribedDate = metadata?.prescribedDate
    ? new Date(metadata.prescribedDate)
    : new Date()
  const expirationDate = getExpirationDate(prescribedDate)

  // Determine status
  const status = determinePrescriptionStatus(
    values as PrescriptionValues,
    { prescribedDate, expirationDate } as PrescriptionMetadata
  )

  // Create prescription record
  const prescription = await prisma.prescriptionRecord.create({
    data: {
      userId: authResult.user.id,

      // Right eye
      odSphere: values.odSphere,
      odCylinder: values.odCylinder,
      odAxis: values.odAxis,
      odAdd: values.odAdd,
      odPrism: values.odPrism,
      odPrismDirection: values.odPrismDirection,

      // Left eye
      osSphere: values.osSphere,
      osCylinder: values.osCylinder,
      osAxis: values.osAxis,
      osAdd: values.osAdd,
      osPrism: values.osPrism,
      osPrismDirection: values.osPrismDirection,

      // PD
      pdSingle: values.pdSingle,
      pdRight: values.pdRight,
      pdLeft: values.pdLeft,

      // Metadata
      prescribedDate,
      expirationDate,
      prescriberName: metadata?.prescriberName,
      prescriberLicense: metadata?.prescriberLicense,
      prescriberPhone: metadata?.prescriberPhone,
      clinicName: metadata?.clinicName,
      clinicAddress: metadata?.clinicAddress,

      // Status & source
      status,
      sourceType,

      // Consent
      consentGiven,
      consentAt: consentGiven ? new Date() : undefined,
    },
  })

  // Generate summary
  const summary = generatePrescriptionSummary(values as PrescriptionValues)
  const strength = classifyPrescriptionStrength(values as PrescriptionValues)
  const daysUntilExpiration = getDaysUntilExpiration(expirationDate)

  return successResponse({
    id: prescription.id,
    status: prescription.status,
    summary,
    strength,
    expirationDate: prescription.expirationDate,
    daysUntilExpiration,
    validation: {
      isValid: validation.isValid,
      warnings: validation.warnings.map(w => w.message),
    },
  }, undefined, 201)
}

// ==================== GET: List Prescriptions ====================

async function handleGet(request: NextRequest) {
  const authResult = await withAuth(request)
  if (authResult instanceof Response) return authResult

  const params = parseQueryParams(request)
  const { page, limit, skip } = getPagination(params)
  const activeOnly = params.activeOnly === 'true'

  const where = {
    userId: authResult.user.id,
    isActive: true,
    ...(activeOnly && { status: { not: 'EXPIRED' as const } }),
  }

  const [prescriptions, total] = await Promise.all([
    prisma.prescriptionRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.prescriptionRecord.count({ where }),
  ])

  const prescriptionData = prescriptions.map(rx => {
    const values: PrescriptionValues = {
      odSphere: rx.odSphere,
      odCylinder: rx.odCylinder,
      odAxis: rx.odAxis,
      odAdd: rx.odAdd,
      osSphere: rx.osSphere,
      osCylinder: rx.osCylinder,
      osAxis: rx.osAxis,
      osAdd: rx.osAdd,
      pdSingle: rx.pdSingle,
      pdRight: rx.pdRight,
      pdLeft: rx.pdLeft,
    }

    return {
      id: rx.id,
      status: rx.status,
      summary: generatePrescriptionSummary(values),
      strength: classifyPrescriptionStrength(values),
      values: {
        rightEye: {
          sphere: rx.odSphere,
          cylinder: rx.odCylinder,
          axis: rx.odAxis,
          add: rx.odAdd,
        },
        leftEye: {
          sphere: rx.osSphere,
          cylinder: rx.osCylinder,
          axis: rx.osAxis,
          add: rx.osAdd,
        },
        pd: rx.pdSingle || (rx.pdRight && rx.pdLeft ? `${rx.pdRight}/${rx.pdLeft}` : null),
      },
      prescriber: {
        name: rx.prescriberName,
        clinic: rx.clinicName,
      },
      prescribedDate: rx.prescribedDate,
      expirationDate: rx.expirationDate,
      daysUntilExpiration: rx.expirationDate
        ? getDaysUntilExpiration(rx.expirationDate)
        : null,
      sourceType: rx.sourceType,
      createdAt: rx.createdAt,
    }
  })

  return successResponse(prescriptionData, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  })
}

// ==================== Exports ====================

export const POST = withErrorHandler(handlePost)
export const GET = withErrorHandler(handleGet)
