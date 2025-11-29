'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import {
  ChevronLeft,
  Lock,
  CreditCard,
  Truck,
  Shield,
  Loader2,
  Check,
  Tag,
  ShoppingBag,
} from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { formatPrice, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

interface CheckoutFormData {
  email: string
  firstName: string
  lastName: string
  address1: string
  address2: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
  couponCode: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getSubtotal, clearCart } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()

  const [step, setStep] = useState(1)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)

  const [formData, setFormData] = useState<CheckoutFormData>({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    phone: '',
    couponCode: '',
  })

  const subtotal = getSubtotal()
  const shipping = subtotal >= 100 ? 0 : 9.99
  const tax = (subtotal - couponDiscount) * 0.08
  const total = subtotal - couponDiscount + shipping + tax

  useEffect(() => {
    if (items.length === 0) {
      router.push('/shop')
    }
  }, [items, router])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const applyCoupon = async () => {
    if (!formData.couponCode) return

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.couponCode,
          subtotal,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid coupon')
      }

      setCouponDiscount(data.data.discount)
      setAppliedCoupon(formData.couponCode.toUpperCase())
      toast.success(`Coupon applied! You saved ${formatPrice(data.data.discount)}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid coupon')
    }
  }

  const createOrder = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          shippingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            address1: formData.address1,
            address2: formData.address2,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            country: formData.country,
            phone: formData.phone,
          },
          sameAsShipping: true,
          couponCode: appliedCoupon,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order')
      }

      setClientSecret(data.data.clientSecret)
      setOrderId(data.data.order.id)
      setStep(2)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Checkout failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitShipping = (e: React.FormEvent) => {
    e.preventDefault()
    createOrder()
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/shop"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Continue Shopping
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Lock className="h-4 w-4" />
            Secure Checkout
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div>
            {/* Progress Steps */}
            <div className="flex items-center gap-4 mb-8">
              <div
                className={cn(
                  'flex items-center gap-2',
                  step >= 1 ? 'text-primary-600' : 'text-gray-400'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    step >= 1
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {step > 1 ? <Check className="h-4 w-4" /> : '1'}
                </div>
                <span className="font-medium">Shipping</span>
              </div>
              <div className="flex-1 h-px bg-gray-200" />
              <div
                className={cn(
                  'flex items-center gap-2',
                  step >= 2 ? 'text-primary-600' : 'text-gray-400'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    step >= 2
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  )}
                >
                  2
                </div>
                <span className="font-medium">Payment</span>
              </div>
            </div>

            {step === 1 && (
              <form onSubmit={handleSubmitShipping} className="space-y-6">
                <div className="bg-white rounded-xl border p-6">
                  <h2 className="text-lg font-semibold mb-4">
                    Contact Information
                  </h2>
                  <div>
                    <label className="label mb-1.5 block">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="input"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-6">
                  <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label mb-1.5 block">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label mb-1.5 block">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          className="input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label mb-1.5 block">Address</label>
                      <input
                        type="text"
                        name="address1"
                        value={formData.address1}
                        onChange={handleChange}
                        required
                        className="input"
                        placeholder="Street address"
                      />
                    </div>

                    <div>
                      <label className="label mb-1.5 block">
                        Apt, suite, etc. (optional)
                      </label>
                      <input
                        type="text"
                        name="address2"
                        value={formData.address2}
                        onChange={handleChange}
                        className="input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label mb-1.5 block">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          required
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label mb-1.5 block">State</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          required
                          className="input"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label mb-1.5 block">ZIP Code</label>
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleChange}
                          required
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label mb-1.5 block">Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="input"
                          placeholder="(optional)"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full h-12"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Continue to Payment
                      <CreditCard className="h-5 w-5 ml-2" />
                    </>
                  )}
                </button>
              </form>
            )}

            {step === 2 && clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#0ea5e9',
                    },
                  },
                }}
              >
                <PaymentForm
                  orderId={orderId!}
                  onSuccess={() => {
                    clearCart()
                    router.push(`/order-confirmation?order=${orderId}`)
                  }}
                  onBack={() => setStep(1)}
                />
              </Elements>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <div className="bg-white rounded-xl border p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500 text-white text-xs rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      {item.variant && (
                        <p className="text-sm text-gray-500">{item.variant.name}</p>
                      )}
                    </div>
                    <p className="font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="couponCode"
                      value={formData.couponCode}
                      onChange={handleChange}
                      placeholder="Coupon code"
                      disabled={!!appliedCoupon}
                      className="input pl-10"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={!!appliedCoupon || !formData.couponCode}
                    className="btn-secondary"
                  >
                    Apply
                  </button>
                </div>
                {appliedCoupon && (
                  <p className="text-sm text-green-600 mt-2">
                    <Check className="h-4 w-4 inline mr-1" />
                    Coupon {appliedCoupon} applied!
                  </p>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-3">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-3 gap-4 text-center text-xs text-gray-500">
                  <div>
                    <Truck className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                    Free Shipping
                  </div>
                  <div>
                    <Shield className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                    Secure Payment
                  </div>
                  <div>
                    <Check className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                    30-Day Returns
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PaymentForm({
  orderId,
  onSuccess,
  onBack,
}: {
  orderId: string
  onSuccess: () => void
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setIsLoading(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message || 'Payment failed')
      setIsLoading(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation?order=${orderId}`,
      },
    })

    if (confirmError) {
      setError(confirmError.message || 'Payment failed')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
        <PaymentElement />
        {error && (
          <p className="text-red-500 text-sm mt-4">{error}</p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="btn-outline flex-1 h-12"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || isLoading}
          className="btn-primary flex-1 h-12"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Lock className="h-5 w-5 mr-2" />
              Pay Now
            </>
          )}
        </button>
      </div>
    </form>
  )
}
