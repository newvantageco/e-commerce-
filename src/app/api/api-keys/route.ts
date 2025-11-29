import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { apiKeySchema } from '@/lib/validations'
import {
  successResponse,
  errorResponse,
  parseBody,
  withAuth,
  withErrorHandler,
} from '@/lib/api-utils'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

// Generate a secure API key
function generateApiKey(): string {
  const prefix = 'opt_'
  const key = crypto.randomBytes(24).toString('hex')
  return `${prefix}${key}`
}

// GET /api/api-keys - List API keys
async function getHandler(request: NextRequest) {
  const auth = await withAuth(request, { requiredPermission: 'apikeys:read' })
  if (auth instanceof Response) return auth

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: auth.user.id },
    select: {
      id: true,
      name: true,
      key: true,
      permissions: true,
      isActive: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Mask keys (show only first 8 and last 4 characters)
  const maskedKeys = apiKeys.map((k) => ({
    ...k,
    key: `${k.key.slice(0, 8)}...${k.key.slice(-4)}`,
  }))

  return successResponse(maskedKeys)
}

// POST /api/api-keys - Create API key
async function postHandler(request: NextRequest) {
  const auth = await withAuth(request, { requiredPermission: 'apikeys:create' })
  if (auth instanceof Response) return auth

  const body = await parseBody(request, apiKeySchema)

  const key = generateApiKey()

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: auth.user.id,
      name: body.name,
      key,
      permissions: body.permissions,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  })

  // Return full key only on creation
  return successResponse(
    {
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key, // Full key shown only once
      permissions: apiKey.permissions,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    },
    undefined,
    201
  )
}

export const GET = withErrorHandler(getHandler)
export const POST = withErrorHandler(postHandler)
