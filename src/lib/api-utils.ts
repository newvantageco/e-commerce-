import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'
import { getCurrentUser, authenticateApiKey, hasPermission, Permission, AuthUser } from './auth'
import { Role } from '@prisma/client'

// Standard API response format
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string[]>
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export function successResponse<T>(
  data: T,
  meta?: ApiResponse['meta'],
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data, meta }, { status })
}

export function errorResponse(
  error: string,
  status = 400,
  errors?: Record<string, string[]>
): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error, errors }, { status })
}

// Validation helper
export function validateBody<T>(schema: ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

// Parse request body safely
export async function parseBody<T>(
  request: NextRequest,
  schema?: ZodSchema<T>
): Promise<T> {
  const body = await request.json()
  if (schema) {
    return validateBody(schema, body)
  }
  return body as T
}

// Handle Zod validation errors
export function handleZodError(error: ZodError): NextResponse<ApiResponse> {
  const errors: Record<string, string[]> = {}
  error.errors.forEach((err) => {
    const path = err.path.join('.')
    if (!errors[path]) {
      errors[path] = []
    }
    errors[path].push(err.message)
  })
  return errorResponse('Validation failed', 400, errors)
}

// Authentication context
export interface AuthContext {
  user: AuthUser
  isApiKey: boolean
  permissions?: string[]
}

// Auth middleware helper
export async function withAuth(
  request: NextRequest,
  options?: {
    requiredRole?: Role
    requiredPermission?: Permission
    allowApiKey?: boolean
  }
): Promise<AuthContext | NextResponse<ApiResponse>> {
  const { requiredRole, requiredPermission, allowApiKey = true } = options || {}

  // Try API key authentication first
  const apiKey = request.headers.get('x-api-key')
  if (apiKey && allowApiKey) {
    const apiKeyAuth = await authenticateApiKey(apiKey)
    if (apiKeyAuth) {
      // Check permission if required
      if (requiredPermission && !apiKeyAuth.permissions.includes(requiredPermission)) {
        return errorResponse('Insufficient permissions', 403)
      }
      return { user: apiKeyAuth.user, isApiKey: true, permissions: apiKeyAuth.permissions }
    }
    return errorResponse('Invalid API key', 401)
  }

  // Try session authentication
  const user = await getCurrentUser()
  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  // Check role
  if (requiredRole) {
    const roleHierarchy: Record<Role, number> = {
      CUSTOMER: 0,
      STAFF: 1,
      MANAGER: 2,
      ADMIN: 3,
      SUPER_ADMIN: 4,
    }
    if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
      return errorResponse('Insufficient permissions', 403)
    }
  }

  // Check permission
  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    return errorResponse('Insufficient permissions', 403)
  }

  return { user, isApiKey: false }
}

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  identifier: string,
  limit = 100,
  windowMs = 60000
): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

// Get client IP
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

// Parse query params
export function parseQueryParams(
  request: NextRequest
): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {}
  const searchParams = request.nextUrl.searchParams

  searchParams.forEach((value, key) => {
    if (params[key]) {
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value)
      } else {
        params[key] = [params[key] as string, value]
      }
    } else {
      params[key] = value
    }
  })

  return params
}

// Pagination helper
export function getPagination(params: Record<string, string | string[]>) {
  const page = Math.max(1, parseInt(String(params.page || '1'), 10))
  const limit = Math.min(100, Math.max(1, parseInt(String(params.limit || '20'), 10)))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

// Sort helper
export function getSort(
  params: Record<string, string | string[]>,
  allowedFields: string[],
  defaultField = 'createdAt'
) {
  const sortBy = String(params.sortBy || defaultField)
  const sortOrder = String(params.sortOrder || 'desc') as 'asc' | 'desc'

  if (!allowedFields.includes(sortBy)) {
    return { [defaultField]: sortOrder }
  }

  return { [sortBy]: sortOrder }
}

// CORS headers
export function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Max-Age': '86400',
  }
}

// OPTIONS handler for CORS
export function handleOptions(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  })
}

// Wrap handler with error handling
export function withErrorHandler<T>(
  handler: (request: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: T): Promise<NextResponse> => {
    try {
      const response = await handler(request, context)
      // Add CORS headers to all responses
      const headers = new Headers(response.headers)
      Object.entries(corsHeaders()).forEach(([key, value]) => {
        headers.set(key, value)
      })
      return new NextResponse(response.body, {
        status: response.status,
        headers,
      })
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof ZodError) {
        return handleZodError(error)
      }

      if (error instanceof Error) {
        return errorResponse(error.message, 500)
      }

      return errorResponse('Internal server error', 500)
    }
  }
}
