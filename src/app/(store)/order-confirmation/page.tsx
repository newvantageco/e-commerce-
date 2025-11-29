import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import { CheckCircle, Package, Truck, Mail, ArrowRight } from 'lucide-react'

interface Props {
  searchParams: Promise<{ order?: string }>
}

async function getOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  })
}

export default async function OrderConfirmationPage({ searchParams }: Props) {
  const params = await searchParams
  const orderId = params.order

  if (!orderId) {
    redirect('/')
  }

  const order = await getOrder(orderId)

  if (!order) {
    redirect('/')
  }

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
    <div className="min-h-[80vh] bg-gray-50 py-12">
      <div className="container max-w-3xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Thank You for Your Order!
          </h1>
          <p className="text-gray-500">
            We&apos;ve received your order and will begin processing it shortly.
          </p>
        </div>

        {/* Order Info */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b bg-gray-50">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="text-xl font-bold text-gray-900">
                  {order.orderNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="font-medium text-gray-900">
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-medium text-gray-900">
                    {formatPrice(parseFloat(item.total.toString()))}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="p-6 border-b">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatPrice(parseFloat(order.subtotal.toString()))}</span>
              </div>
              {parseFloat(order.discountTotal.toString()) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>
                    -{formatPrice(parseFloat(order.discountTotal.toString()))}
                  </span>
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
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span>{formatPrice(parseFloat(order.total.toString()))}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Shipping Address</h3>
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
              {shippingAddress.city}, {shippingAddress.state}{' '}
              {shippingAddress.postalCode}
              <br />
              {shippingAddress.country}
            </p>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">What&apos;s Next?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Confirmation Email</p>
                <p className="text-sm text-gray-500">
                  We&apos;ve sent order details to {order.email}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Processing</p>
                <p className="text-sm text-gray-500">
                  We&apos;ll prepare your order within 1-2 business days
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Truck className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Shipping Update</p>
                <p className="text-sm text-gray-500">
                  You&apos;ll receive tracking info once shipped
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/account/orders" className="btn-primary">
            View Your Orders
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
          <Link href="/shop" className="btn-outline">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
