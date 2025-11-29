import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatPrice, formatDate } from '@/lib/utils'
import {
  User,
  Package,
  MapPin,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react'

async function getUserData(userId: string) {
  const [orders, addresses, wishlistCount] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    }),
    prisma.wishlistItem.count({ where: { userId } }),
  ])

  return { orders, addresses, wishlistCount }
}

export default async function AccountPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/account')
  }

  const { orders, addresses, wishlistCount } = await getUserData(user.id)

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">
        My Account
      </h1>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-bold text-xl">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            <nav className="space-y-1">
              <Link
                href="/account"
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary-50 text-primary-600 font-medium"
              >
                <User className="h-5 w-5" />
                Overview
              </Link>
              <Link
                href="/account/orders"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <Package className="h-5 w-5" />
                Orders
              </Link>
              <Link
                href="/account/addresses"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <MapPin className="h-5 w-5" />
                Addresses
              </Link>
              <Link
                href="/wishlist"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <Heart className="h-5 w-5" />
                Wishlist ({wishlistCount})
              </Link>
              <Link
                href="/account/settings"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 w-full"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </form>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3 space-y-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-xl border">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Orders</h2>
              <Link
                href="/account/orders"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>

            {orders.length > 0 ? (
              <div className="divide-y">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/account/orders/${order.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50"
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
                          {order._count.items} items · {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatPrice(parseFloat(order.total.toString()))}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            order.status === 'DELIVERED'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'SHIPPED'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No orders yet</p>
                <Link href="/shop" className="btn-primary">
                  Start Shopping
                </Link>
              </div>
            )}
          </div>

          {/* Addresses */}
          <div className="bg-white rounded-xl border">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Saved Addresses</h2>
              <Link
                href="/account/addresses"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Manage
              </Link>
            </div>

            {addresses.length > 0 ? (
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                {addresses.slice(0, 2).map((address) => (
                  <div key={address.id} className="p-4">
                    {address.isDefault && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded mb-2 inline-block">
                        Default
                      </span>
                    )}
                    <p className="font-medium text-gray-900">
                      {address.firstName} {address.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {address.address1}
                      {address.address2 && `, ${address.address2}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No addresses saved</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
