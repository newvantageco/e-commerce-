import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export interface CreatePaymentIntentParams {
  amount: number // In cents
  currency?: string
  customerId?: string
  metadata?: Record<string, string>
  description?: string
}

export async function createPaymentIntent({
  amount,
  currency = 'usd',
  customerId,
  metadata,
  description,
}: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    metadata,
    description,
    automatic_payment_methods: {
      enabled: true,
    },
  })
}

export async function retrievePaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.retrieve(paymentIntentId)
}

export async function confirmPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.confirm(paymentIntentId)
}

export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.cancel(paymentIntentId)
}

export async function createRefund(
  paymentIntentId: string,
  amount?: number
): Promise<Stripe.Refund> {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount, // If not provided, full refund
  })
}

// Customer management
export async function createStripeCustomer(
  email: string,
  name: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> {
  return stripe.customers.create({
    email,
    name,
    metadata,
  })
}

export async function retrieveStripeCustomer(
  customerId: string
): Promise<Stripe.Customer> {
  return stripe.customers.retrieve(customerId) as Promise<Stripe.Customer>
}

export async function updateStripeCustomer(
  customerId: string,
  data: Stripe.CustomerUpdateParams
): Promise<Stripe.Customer> {
  return stripe.customers.update(customerId, data)
}

// Webhook verification
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}

// Format amount for Stripe (convert dollars to cents)
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100)
}

// Format amount from Stripe (convert cents to dollars)
export function formatAmountFromStripe(amount: number): number {
  return amount / 100
}

// Payment method types
export const PAYMENT_METHODS = {
  card: { name: 'Credit/Debit Card', icon: 'credit-card' },
  // Add more payment methods as needed
} as const
