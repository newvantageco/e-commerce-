/**
 * OpticaVault™ API - Prescription Sharing
 *
 * POST /api/optica/prescriptions/share - Create share link
 * GET /api/optica/prescriptions/share?token=xxx - Access shared prescription
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
  getClientIp,
} from '@/lib/api-utils'
import {
  generatePrescriptionSummary,
  classifyPrescriptionStrength,
  PrescriptionValues,
} from '@/lib/optica-scan'

// ==================== Validation Schemas ====================

const createShareSchema = z.object({
  prescriptionId: z.string(),
  recipientEmail: z.string().email().optional(),
  recipientName: z.string().max(100).optional(),
  maxAccessCount: z.number().int().min(1).max(100).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
})

// ==================== POST: Create Share Link ====================

async function handlePost(request: NextRequest) {
  const authResult = await withAuth(request)
  if (authResult instanceof Response) return authResult

  const body = await parseBody(request, createShareSchema)
  const { prescriptionId, recipientEmail, recipientName, maxAccessCount, expiresInDays } = body

  // Verify prescription belongs to user
  const prescription = await prisma.prescriptionRecord.findFirst({
    where: {
      id: prescriptionId,
      userId: authResult.user.id,
      isActive: true,
    },
  })

  if (!prescription) {
    return errorResponse('Prescription not found', 404)
  }

  // Check if prescription is expired
  if (prescription.status === 'EXPIRED') {
    return errorResponse('Cannot share an expired prescription', 400)
  }

  // Calculate expiration date
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : undefined

  // Create share link
  const share = await prisma.prescriptionShare.create({
    data: {
      prescriptionId,
      recipientEmail,
      recipientName,
      maxAccessCount,
      expiresAt,
    },
  })

  // Generate share URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const shareUrl = `${baseUrl}/rx/${share.shareToken}`

  return successResponse({
    shareId: share.id,
    shareToken: share.shareToken,
    shareUrl,
    recipientEmail,
    recipientName,
    maxAccessCount,
    expiresAt,
    createdAt: share.createdAt,
  }, undefined, 201)
}

// ==================== GET: Access Shared Prescription ====================

async function handleGet(request: NextRequest) {
  const params = parseQueryParams(request)
  const token = String(params.token || '')

  if (!token) {
    return errorResponse('Share token is required', 400)
  }

  // Find share link
  const share = await prisma.prescriptionShare.findUnique({
    where: { shareToken: token },
    include: {
      prescription: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  })

  if (!share) {
    return errorResponse('Share link not found or invalid', 404)
  }

  // Check if share is active
  if (!share.isActive) {
    return errorResponse('This share link has been deactivated', 403)
  }

  // Check expiration
  if (share.expiresAt && new Date() > share.expiresAt) {
    return errorResponse('This share link has expired', 403)
  }

  // Check access count
  if (share.maxAccessCount && share.accessCount >= share.maxAccessCount) {
    return errorResponse('This share link has reached its access limit', 403)
  }

  // Check prescription status
  if (share.prescription.status === 'EXPIRED') {
    return errorResponse('This prescription has expired', 403)
  }

  if (share.prescription.status === 'REJECTED') {
    return errorResponse('This prescription was rejected', 403)
  }

  // Update access tracking
  const clientIp = getClientIp(request)
  await prisma.prescriptionShare.update({
    where: { id: share.id },
    data: {
      accessCount: { increment: 1 },
      lastAccessedAt: new Date(),
      lastAccessedBy: clientIp,
    },
  })

  // Build prescription values
  const rx = share.prescription
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

  return successResponse({
    prescription: {
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
          prism: rx.odPrism,
          prismDirection: rx.odPrismDirection,
        },
        leftEye: {
          sphere: rx.osSphere,
          cylinder: rx.osCylinder,
          axis: rx.osAxis,
          add: rx.osAdd,
          prism: rx.osPrism,
          prismDirection: rx.osPrismDirection,
        },
        pd: {
          single: rx.pdSingle,
          right: rx.pdRight,
          left: rx.pdLeft,
        },
      },
      prescriber: {
        name: rx.prescriberName,
        license: rx.prescriberLicense,
        phone: rx.prescriberPhone,
        clinic: rx.clinicName,
        address: rx.clinicAddress,
      },
      prescribedDate: rx.prescribedDate,
      expirationDate: rx.expirationDate,
      verifiedAt: rx.verifiedAt,
    },
    owner: {
      firstName: rx.user.firstName,
      lastName: rx.user.lastName,
    },
    share: {
      accessCount: share.accessCount + 1,
      maxAccessCount: share.maxAccessCount,
      expiresAt: share.expiresAt,
    },
  })
}

// ==================== Exports ====================

export const POST = withErrorHandler(handlePost)
export const GET = withErrorHandler(handleGet)
