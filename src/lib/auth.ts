import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from './db'
import { Role, User } from '@prisma/client'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production'
const JWT_EXPIRY = '7d'
const COOKIE_NAME = 'auth_token'

export interface JWTPayload {
  userId: string
  email: string
  role: Role
}

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  avatar: string | null
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// JWT Token management
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

// Cookie management
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)
  return cookie?.value || null
}

// Get current user from cookie
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAuthCookie()
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      avatar: true,
      isActive: true,
    },
  })

  if (!user || !user.isActive) return null

  return user
}

// Authentication functions
export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<{ user: AuthUser; token: string }> {
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    throw new Error('Email already exists')
  }

  const hashedPassword = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'CUSTOMER',
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      avatar: true,
    },
  })

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  // Create session
  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  })

  return { user, token }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      role: true,
      avatar: true,
      isActive: true,
    },
  })

  if (!user || !user.isActive) {
    throw new Error('Invalid credentials')
  }

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    throw new Error('Invalid credentials')
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  // Create session
  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  const { password: _, ...userWithoutPassword } = user

  return { user: userWithoutPassword, token }
}

export async function signOut(): Promise<void> {
  const token = await getAuthCookie()
  if (token) {
    await prisma.session.deleteMany({ where: { token } })
  }
  await removeAuthCookie()
}

// Role-based access control
export const ROLE_HIERARCHY: Record<Role, number> = {
  CUSTOMER: 0,
  STAFF: 1,
  MANAGER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
}

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function hasAnyRole(userRole: Role, roles: Role[]): boolean {
  return roles.some((role) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role])
}

// Permissions
export const PERMISSIONS = {
  // Products
  'products:read': ['CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'products:create': ['STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'products:update': ['STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'products:delete': ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],

  // Orders
  'orders:read': ['STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'orders:update': ['STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'orders:delete': ['ADMIN', 'SUPER_ADMIN'],
  'orders:refund': ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],

  // Users
  'users:read': ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'users:create': ['ADMIN', 'SUPER_ADMIN'],
  'users:update': ['ADMIN', 'SUPER_ADMIN'],
  'users:delete': ['SUPER_ADMIN'],
  'users:roles': ['SUPER_ADMIN'],

  // Analytics
  'analytics:read': ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],

  // Settings
  'settings:read': ['ADMIN', 'SUPER_ADMIN'],
  'settings:update': ['SUPER_ADMIN'],

  // Coupons
  'coupons:read': ['STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'coupons:create': ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'coupons:update': ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  'coupons:delete': ['ADMIN', 'SUPER_ADMIN'],

  // API Keys
  'apikeys:read': ['ADMIN', 'SUPER_ADMIN'],
  'apikeys:create': ['ADMIN', 'SUPER_ADMIN'],
  'apikeys:delete': ['SUPER_ADMIN'],
} as const

export type Permission = keyof typeof PERMISSIONS

export function hasPermission(role: Role, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission]
  return allowedRoles.includes(role)
}

// API Key authentication
export async function authenticateApiKey(
  apiKey: string
): Promise<{ user: AuthUser; permissions: string[] } | null> {
  const key = await prisma.apiKey.findUnique({
    where: { key: apiKey },
    include: { user: true },
  })

  if (!key || !key.isActive) return null
  if (key.expiresAt && key.expiresAt < new Date()) return null
  if (!key.user.isActive) return null

  // Update last used
  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  })

  return {
    user: {
      id: key.user.id,
      email: key.user.email,
      firstName: key.user.firstName,
      lastName: key.user.lastName,
      role: key.user.role,
      avatar: key.user.avatar,
    },
    permissions: key.permissions,
  }
}
