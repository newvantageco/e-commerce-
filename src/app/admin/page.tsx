import Link from 'next/link'
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'
import { prisma } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'

async function getDashboardStats() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    totalOrders,
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    totalCustomers,
    newCustomersThisMonth,
    lowStockProducts,
    pendingOrders,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { status: { not: 'CANCELLED' } } }),
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID', createdAt: { gte: startOfMonth } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: startOfLastMonth, lt: startOfMonth },
      },
      _sum: { total: true },
    }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({
      where: { role: 'CUSTOMER', createdAt: { gte: startOfMonth } },
    }),
    prisma.product.count({
      where: {
        isActive: true,
        trackInventory: true,
        quantity: { lt: 5 },
      },
    }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        items: { take: 1 },
      },
    }),
  ])

  const currentRevenue = parseFloat(monthRevenue._sum.total?.toString() || '0')
  const previousRevenue = parseFloat(lastMonthRevenue._sum.total?.toString() || '0')
  const revenueGrowth =
    previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0

  return {
    totalOrders,
    totalRevenue: parseFloat(totalRevenue._sum.total?.toString() || '0'),
    monthRevenue: currentRevenue,
    revenueGrowth: Math.round(revenueGrowth * 10) / 10,
    totalCustomers,
    newCustomersThisMonth,
    lowStockProducts,
    pendingOrders,
    recentOrders,
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  const statCards = [
    {
      name: 'Total Revenue',
      value: formatPrice(stats.totalRevenue),
      change: `${stats.revenueGrowth >= 0 ? '+' : ''}${stats.revenueGrowth}%`,
      changeType: stats.revenueGrowth >= 0 ? 'positive' : 'negative',
      icon: DollarSign,
    },
    {
      name: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      subtext: `${stats.pendingOrders} pending`,
      icon: ShoppingCart,
    },
    {
      name: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      subtext: `+${stats.newCustomersThisMonth} this month`,
      icon: Users,
    },
    {
      name: 'Low Stock Items',
      value: stats.lowStockProducts.toString(),
      alert: stats.lowStockProducts > 0,
      icon: Package,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Welcome back! Here&apos;s what&apos;s happening with your store.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl border p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <stat.icon className="h-5 w-5 text-primary-600" />
              </div>
              {stat.alert && (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
            </div>
            <p className="text-sm text-gray-500">{stat.name}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stat.value}
            </p>
            {stat.change && (
              <div
                className={`flex items-center gap-1 mt-2 text-sm ${
                  stat.changeType === 'positive'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {stat.changeType === 'positive' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {stat.change} from last month
              </div>
            )}
            {stat.subtext && (
              <p className="text-sm text-gray-500 mt-2">{stat.subtext}</p>
            )}
          </div>
        ))}
      </div>

      {/* Recent Orders & Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y">
            {stats.recentOrders.length > 0 ? (
              stats.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.orderNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.user
                          ? `${order.user.firstName} ${order.user.lastName}`
                          : order.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatPrice(parseFloat(order.total.toString()))}
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No orders yet. Your first order will appear here.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-2">
            <Link
              href="/admin/products/new"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Add New Product</p>
                <p className="text-sm text-gray-500">Create a new product listing</p>
              </div>
            </Link>
            <Link
              href="/admin/orders?status=PENDING"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Process Orders</p>
                <p className="text-sm text-gray-500">
                  {stats.pendingOrders} orders waiting
                </p>
              </div>
            </Link>
            <Link
              href="/admin/products?lowStock=true"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Low Stock Alert</p>
                <p className="text-sm text-gray-500">
                  {stats.lowStockProducts} items need restock
                </p>
              </div>
            </Link>
            <Link
              href="/admin/coupons/new"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Create Coupon</p>
                <p className="text-sm text-gray-500">Set up a promotion</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
