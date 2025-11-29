import Link from 'next/link'
import {
  Search,
  Filter,
  Eye,
  Package,
  ChevronRight,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  RefreshCw,
} from 'lucide-react'
import { prisma } from '@/lib/db'
import { formatPrice, formatDateTime } from '@/lib/utils'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const statusConfig = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  PROCESSING: { label: 'Processing', color: 'bg-purple-100 text-purple-800', icon: RefreshCw },
  SHIPPED: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-100 text-gray-800', icon: RefreshCw },
  ON_HOLD: { label: 'On Hold', color: 'bg-orange-100 text-orange-800', icon: Clock },
}

async function getOrders(params: Record<string, string | string[] | undefined>) {
  const page = Number(params.page) || 1
  const limit = 20
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (params.status) {
    where.status = String(params.status)
  }

  if (params.search) {
    where.OR = [
      { orderNumber: { contains: String(params.search), mode: 'insensitive' } },
      { email: { contains: String(params.search), mode: 'insensitive' } },
    ]
  }

  const [orders, total, statusCounts] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true } },
        items: { take: 3 },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({
      by: ['status'],
      _count: true,
    }),
  ])

  const statusStats = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count])
  )

  return { orders, total, totalPages: Math.ceil(total / limit), page, statusStats }
}

export default async function OrdersPage({ searchParams }: Props) {
  const params = await searchParams
  const data = await getOrders(params)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 mt-1">
          Manage and fulfill customer orders ({data.total} total)
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            !params.status
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({data.total})
        </Link>
        {Object.entries(statusConfig).map(([key, config]) => (
          <Link
            key={key}
            href={`/admin/orders?status=${key}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              params.status === key
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {config.label} ({data.statusStats[key] || 0})
          </Link>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <form className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              name="search"
              placeholder="Search by order number or email..."
              defaultValue={params.search as string}
              className="input pl-10"
            />
          </div>
          <button type="submit" className="btn-secondary">
            <Filter className="h-4 w-4 mr-2" />
            Search
          </button>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.orders.length > 0 ? (
                data.orders.map((order) => {
                  const status = statusConfig[order.status as keyof typeof statusConfig]
                  const StatusIcon = status?.icon || Clock

                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {order.orderNumber}
                            </p>
                            <p className="text-xs text-gray-500">
                              {order._count.items} items
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">
                            {order.user
                              ? `${order.user.firstName} ${order.user.lastName}`
                              : 'Guest'}
                          </p>
                          <p className="text-sm text-gray-500">{order.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status?.color}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status?.label || order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex -space-x-2">
                          {order.items.slice(0, 3).map((item, i) => (
                            <div
                              key={item.id}
                              className="w-8 h-8 bg-gray-200 rounded border-2 border-white flex items-center justify-center text-xs"
                              title={item.name}
                            >
                              {i < 2 ? (
                                item.name.charAt(0)
                              ) : (
                                `+${order._count.items - 2}`
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-gray-900">
                          {formatPrice(parseFloat(order.total.toString()))}
                        </p>
                        {order.paymentStatus === 'PAID' && (
                          <span className="text-xs text-green-600">Paid</span>
                        )}
                        {order.paymentStatus === 'PENDING' && (
                          <span className="text-xs text-yellow-600">Pending</span>
                        )}
                        {order.paymentStatus === 'REFUNDED' && (
                          <span className="text-xs text-gray-500">Refunded</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                          View
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No orders found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(data.page - 1) * 20 + 1} to{' '}
              {Math.min(data.page * 20, data.total)} of {data.total} orders
            </p>
            <div className="flex gap-2">
              {data.page > 1 && (
                <Link
                  href={`?page=${data.page - 1}${params.status ? `&status=${params.status}` : ''}`}
                  className="btn-outline btn-sm"
                >
                  Previous
                </Link>
              )}
              {data.page < data.totalPages && (
                <Link
                  href={`?page=${data.page + 1}${params.status ? `&status=${params.status}` : ''}`}
                  className="btn-outline btn-sm"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
