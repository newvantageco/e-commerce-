import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  successResponse,
  withAuth,
  withErrorHandler,
} from '@/lib/api-utils'

// GET /api/analytics/dashboard - Dashboard stats
async function getHandler(request: NextRequest) {
  const auth = await withAuth(request, { requiredPermission: 'analytics:read' })
  if (auth instanceof Response) return auth

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // Get various stats in parallel
  const [
    totalOrders,
    todayOrders,
    monthOrders,
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    totalCustomers,
    newCustomersThisMonth,
    totalProducts,
    lowStockProducts,
    pendingOrders,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    // Total orders
    prisma.order.count({ where: { status: { not: 'CANCELLED' } } }),

    // Today's orders
    prisma.order.count({
      where: { createdAt: { gte: startOfDay }, status: { not: 'CANCELLED' } },
    }),

    // This month's orders
    prisma.order.count({
      where: { createdAt: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
    }),

    // Total revenue
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { total: true },
    }),

    // This month's revenue
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID', createdAt: { gte: startOfMonth } },
      _sum: { total: true },
    }),

    // Last month's revenue
    prisma.order.aggregate({
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: startOfLastMonth, lt: startOfMonth },
      },
      _sum: { total: true },
    }),

    // Total customers
    prisma.user.count({ where: { role: 'CUSTOMER' } }),

    // New customers this month
    prisma.user.count({
      where: { role: 'CUSTOMER', createdAt: { gte: startOfMonth } },
    }),

    // Total products
    prisma.product.count({ where: { isActive: true } }),

    // Low stock products
    prisma.product.count({
      where: {
        isActive: true,
        trackInventory: true,
        quantity: { lte: prisma.product.fields.lowStockThreshold },
      },
    }),

    // Pending orders
    prisma.order.count({ where: { status: 'PENDING' } }),

    // Recent orders
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        email: true,
        status: true,
        total: true,
        createdAt: true,
      },
    }),

    // Top selling products
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ])

  // Get product details for top products
  const topProductDetails = await prisma.product.findMany({
    where: { id: { in: topProducts.map((p) => p.productId) } },
    select: {
      id: true,
      name: true,
      price: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
  })

  const topProductsWithDetails = topProducts.map((p) => {
    const product = topProductDetails.find((d) => d.id === p.productId)
    return {
      productId: p.productId,
      name: product?.name || 'Unknown',
      price: product?.price || 0,
      image: product?.images[0]?.url || null,
      soldCount: p._sum.quantity || 0,
    }
  })

  // Calculate revenue growth
  const currentRevenue = parseFloat(monthRevenue._sum.total?.toString() || '0')
  const previousRevenue = parseFloat(lastMonthRevenue._sum.total?.toString() || '0')
  const revenueGrowth = previousRevenue > 0
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
    : 0

  return successResponse({
    overview: {
      totalOrders,
      todayOrders,
      monthOrders,
      totalRevenue: parseFloat(totalRevenue._sum.total?.toString() || '0'),
      monthRevenue: currentRevenue,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      totalCustomers,
      newCustomersThisMonth,
      totalProducts,
      lowStockProducts,
      pendingOrders,
    },
    recentOrders,
    topProducts: topProductsWithDetails,
  })
}

export const GET = withErrorHandler(getHandler)
