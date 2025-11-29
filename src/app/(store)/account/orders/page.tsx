'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { formatPrice, formatDate } from '@/lib/utils'

interface Order {
  id: string
  orderNumber: string
  status: string
  total: string
  createdAt: string
  items: Array<{
    id: string
    name: string
    quantity: number
  }>
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  PROCESSING: { label: 'Processing', color: 'bg-purple-100 text-purple-800', icon: Clock },
  SHIPPED: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
}

export default function OrdersPage() {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch('/api/orders')
        const data = await response.json()
        if (data.data) {
          setOrders(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchOrders()
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/account" className="hover:text-gray-700">
            Account
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900">Orders</span>
        </nav>

        <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">
          Your Orders
        </h1>

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.PENDING
              const StatusIcon = status.icon

              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="block bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Order #{order.orderNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(new Date(order.createdAt))}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                      <p className="font-semibold text-gray-900 mt-2">
                        {formatPrice(parseFloat(order.total))}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No orders yet
            </h2>
            <p className="text-gray-500 mb-6">
              When you place an order, it will appear here.
            </p>
            <Link href="/shop" className="btn-primary">
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
