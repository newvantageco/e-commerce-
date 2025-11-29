import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { formatPrice, formatDateTime } from '@/lib/utils'
import {
  ArrowLeft,
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react'
import OrderStatusForm from '@/components/admin/order-status-form'

interface Props {
  params: Promise<{ id: string }>
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

const paymentStatusConfig = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-800' },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-100 text-gray-800' },
  PARTIALLY_REFUNDED: { label: 'Partially Refunded', color: 'bg-orange-100 text-orange-800' },
}

async function getOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true, phone: true },
      },
      items: true,
      timeline: {
        orderBy: { createdAt: 'desc' },
      },
      transactions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const order = await getOrder(id)

  if (!order) {
    notFound()
  }

  const status = statusConfig[order.status as keyof typeof statusConfig]
  const StatusIcon = status?.icon || Clock
  const paymentStatus = paymentStatusConfig[order.paymentStatus as keyof typeof paymentStatusConfig]

  const shippingAddress = order.shippingAddress as {
    firstName: string
    lastName: string
    address1: string
    address2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phone?: string
  }

  const billingAddress = order.billingAddress as typeof shippingAddress | null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">
              Order #{order.orderNumber}
            </h1>
            <p className="text-gray-500 mt-1">
              {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${status?.color}`}
          >
            <StatusIcon className="h-4 w-4" />
            {status?.label || order.status}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${paymentStatus?.color}`}
          >
            <CreditCard className="h-4 w-4" />
            {paymentStatus?.label || order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
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
                    <p className="text-sm text-gray-500">SKU: {item.sku || 'N/A'}</p>
                    {item.options && Object.keys(item.options as object).length > 0 && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {Object.entries(item.options as Record<string, string>)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatPrice(parseFloat(item.price.toString()))} × {item.quantity}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatPrice(parseFloat(item.total.toString()))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-gray-50 border-t space-y-2">
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
              <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                <span>Total</span>
                <span>{formatPrice(parseFloat(order.total.toString()))}</span>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900">Order Timeline</h2>
            </div>
            <div className="p-4">
              {order.timeline.length > 0 ? (
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
                          {formatDateTime(event.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No timeline events yet</p>
              )}
            </div>
          </div>

          {/* Transactions */}
          {order.transactions.length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">Transactions</h2>
              </div>
              <div className="divide-y">
                {order.transactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {transaction.type.toLowerCase()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.gateway} - {transaction.gatewayTransactionId}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDateTime(transaction.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatPrice(parseFloat(transaction.amount.toString()))}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          transaction.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Update Status */}
          <OrderStatusForm
            orderId={order.id}
            currentStatus={order.status}
            trackingNumber={order.trackingNumber || ''}
            trackingUrl={order.trackingUrl || ''}
          />

          {/* Customer Info */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Customer</h2>
            </div>
            <div className="p-4 space-y-3">
              <p className="font-medium text-gray-900">
                {order.user
                  ? `${order.user.firstName} ${order.user.lastName}`
                  : 'Guest Customer'}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${order.email}`} className="hover:text-primary-600">
                  {order.email}
                </a>
              </div>
              {order.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${order.phone}`} className="hover:text-primary-600">
                    {order.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Shipping Address</h2>
            </div>
            <div className="p-4">
              <p className="text-gray-600 text-sm">
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
                {shippingAddress.phone && (
                  <>
                    <br />
                    {shippingAddress.phone}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Billing Address */}
          {billingAddress && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <h2 className="font-semibold text-gray-900">Billing Address</h2>
              </div>
              <div className="p-4">
                <p className="text-gray-600 text-sm">
                  {billingAddress.firstName} {billingAddress.lastName}
                  <br />
                  {billingAddress.address1}
                  {billingAddress.address2 && (
                    <>
                      <br />
                      {billingAddress.address2}
                    </>
                  )}
                  <br />
                  {billingAddress.city}, {billingAddress.state} {billingAddress.postalCode}
                  <br />
                  {billingAddress.country}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">Order Notes</h2>
              </div>
              <div className="p-4">
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{order.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
