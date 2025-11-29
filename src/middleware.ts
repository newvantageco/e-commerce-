import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
)

// Routes that require authentication
const protectedRoutes = ['/account', '/checkout']

// Routes that require admin/staff access
const adminRoutes = ['/admin']

// Routes that should redirect if authenticated
const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  let user: { id: string; role: string } | null = null

  // Verify token if present
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      user = { id: payload.userId as string, role: payload.role as string }
    } catch {
      // Token is invalid, clear it
      const response = NextResponse.next()
      response.cookies.delete('auth-token')
      return response
    }
  }

  // Check protected routes (require authentication)
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Check admin routes (require staff or higher role)
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))

  if (isAdminRoute) {
    if (!user) {
      const url = new URL('/login', request.url)
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    const adminRoles = ['STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']
    if (!adminRoles.includes(user.role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Redirect authenticated users away from auth pages
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}
