import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import { ChevronRight, Package, Truck, CheckCircle, Clock, MapPin } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  PROCESSING: { label: 'Processing', color: 'bg-purple-100 text-purple-800', icon: Clock },
  SHIPPED: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: Clock },
}

async function getOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      timeline: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const order = await getOrder(id)

  if (!order) {
    redirect('/account/orders')
  }

  const status = statusConfig[order.status] || statusConfig.PENDING
  const StatusIcon = status.icon

  const shippingAddress = order.shippingAddress as {
    firstName: string
    lastName: string
    address1: string
    address2?: string
    city: string
    state: string
    postalCode: string
    country: string
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
          <Link href="/account/orders" className="hover:text-gray-700">
            Orders
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900">#{order.orderNumber}</span>
        </nav>

        {/* Order Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">
              Order #{order.orderNumber}
            </h1>
            <p className="text-gray-500 mt-1">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${status.color}`}
          >
            <StatusIcon className="h-4 w-4" />
            {status.label}
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Order Items & Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Items */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">Order Items</h2>
              </div>
              <div className="divide-y">
                {order.items.map((item) => (
                  <div key={item.id} className="p-4 flex gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.options && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {Object.entries(item.options as Record<string, string>)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(', ')}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-900">
                      {formatPrice(parseFloat(item.total.toString()))}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Timeline */}
            {order.timeline.length > 0 && (
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h2 className="font-semibold text-gray-900">Order Timeline</h2>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    {order.timeline.map((event, index) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="relative">
                          <div className="w-3 h-3 bg-primary-600 rounded-full mt-1.5" />
                          {index < order.timeline.length - 1 && (
                            <div className="absolute top-4 left-1.5 w-px h-full -translate-x-1/2 bg-gray-200" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-gray-900">{event.title}</p>
                          {event.description && (
                            <p className="text-sm text-gray-500">{event.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(event.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">Order Summary</h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatPrice(parseFloat(order.subtotal.toString()))}</span>
                </div>
                {parseFloat(order.discountTotal.toString()) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(parseFloat(order.discountTotal.toString()))}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span>
                    {parseFloat(order.shippingTotal.toString()) === 0
                      ? 'Free'
                      : formatPrice(parseFloat(order.shippingTotal.toString()))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span>{formatPrice(parseFloat(order.taxTotal.toString()))}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-3 border-t">
                  <span>Total</span>
                  <span>{formatPrice(parseFloat(order.total.toString()))}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <h2 className="font-semibold text-gray-900">Shipping Address</h2>
              </div>
              <div className="p-4">
                <p className="text-gray-600">
                  {shippingAddress.firstName} {shippingAddress.lastName}
                  <br />
                  {shippingAddress.address1}
                  {shippingAddress.address2 && (
                    <>
                      <br />
                      {shippingAddress.address2}
                    </>
                  )}
                  <br />
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                  <br />
                  {shippingAddress.country}
                </p>
              </div>
            </div>

            {/* Tracking */}
            {order.trackingNumber && (
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-500" />
                  <h2 className="font-semibold text-gray-900">Tracking</h2>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-500 mb-1">Tracking Number</p>
                  <p className="font-mono text-gray-900">{order.trackingNumber}</p>
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
                    >
                      Track Package →
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Need Help */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-500 mb-3">
                If you have any questions about your order, we're here to help.
              </p>
              <Link href="/contact" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Contact Support →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
