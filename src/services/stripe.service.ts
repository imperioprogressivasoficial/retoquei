import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
})

export async function createCustomer(
  tenantId: string,
  email: string,
  name: string,
): Promise<Stripe.Customer> {
  const customer = await stripe.customers.create({ email, name, metadata: { tenantId } })

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { stripeCustomerId: customer.id },
  })

  return customer
}

export async function createCheckoutSession(
  tenantId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<Stripe.Checkout.Session> {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } })

  let customerId = tenant.stripeCustomerId
  if (!customerId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: tenant.ownerId },
    })
    const customer = await createCustomer(tenantId, dbUser?.email ?? '', dbUser?.fullName ?? tenant.name)
    customerId = customer.id
  }

  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { tenantId },
    subscription_data: { metadata: { tenantId } },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  })
}

export async function createBillingPortalSession(
  tenantId: string,
  returnUrl: string,
): Promise<Stripe.BillingPortal.Session> {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } })

  if (!tenant.stripeCustomerId) {
    throw new Error('Tenant has no Stripe customer ID')
  }

  return stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: returnUrl,
  })
}

export async function getSubscription(
  stripeCustomerId: string,
): Promise<Stripe.Subscription | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'all',
    limit: 1,
  })

  return subscriptions.data[0] ?? null
}

export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
}

export function constructWebhookEvent(
  rawBody: string,
  signature: string,
): Stripe.Event {
  return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!)
}
