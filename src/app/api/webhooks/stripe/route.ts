import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { constructWebhookEvent } from '@/services/stripe.service'
import type Stripe from 'stripe'
import type { SubscriptionPlan, SubscriptionStatus } from '@prisma/client'

const PRICE_TO_PLAN: Record<string, SubscriptionPlan> = {
  [process.env.STRIPE_PRICE_STARTER ?? '']: 'STARTER',
  [process.env.STRIPE_PRICE_GROWTH ?? '']: 'GROWTH',
  [process.env.STRIPE_PRICE_SCALE ?? '']: 'SCALE',
}

function stripeStatusToPrisma(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':       return 'ACTIVE'
    case 'past_due':     return 'PAST_DUE'
    case 'canceled':     return 'CANCELLED'
    case 'trialing':     return 'TRIALING'
    default:             return 'ACTIVE'
  }
}

async function getTenantIdFromCustomer(customerId: string): Promise<string | null> {
  const tenant = await prisma.tenant.findFirst({ where: { stripeCustomerId: customerId } })
  return tenant?.id ?? null
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const tenantId = session.metadata?.tenantId
  if (!tenantId || !session.subscription) return

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription.id

  const priceId = typeof session.subscription === 'object'
    ? (session.subscription as Stripe.Subscription).items.data[0]?.price.id
    : null

  const plan: SubscriptionPlan = priceId ? (PRICE_TO_PLAN[priceId] ?? 'FREE') : 'FREE'

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { tenantId },
      create: {
        tenantId,
        plan,
        status: 'ACTIVE',
        startedAt: new Date(),
      },
      update: {
        plan,
        status: 'ACTIVE',
        startedAt: new Date(),
      },
    }),
    prisma.tenant.update({
      where: { id: tenantId },
      data: { plan, status: 'ACTIVE' },
    }),
  ])

  // Store the Stripe subscription ID on the subscription record
  await prisma.subscription.update({
    where: { tenantId },
    data: { stripeSubscriptionId: subscriptionId },
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const tenantId =
    subscription.metadata?.tenantId ??
    (await getTenantIdFromCustomer(
      typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
    ))

  if (!tenantId) return

  const priceId = subscription.items.data[0]?.price.id
  const plan: SubscriptionPlan = priceId ? (PRICE_TO_PLAN[priceId] ?? 'FREE') : 'FREE'
  const status = stripeStatusToPrisma(subscription.status)
  const expiresAt = subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { tenantId },
      create: { tenantId, plan, status, expiresAt: expiresAt ?? undefined },
      update: { plan, status, expiresAt },
    }),
    prisma.tenant.update({
      where: { id: tenantId },
      data: { plan },
    }),
  ])
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const tenantId =
    subscription.metadata?.tenantId ??
    (await getTenantIdFromCustomer(
      typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
    ))

  if (!tenantId) return

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { tenantId },
      create: { tenantId, plan: 'FREE', status: 'CANCELLED' },
      update: { plan: 'FREE', status: 'CANCELLED' },
    }),
    prisma.tenant.update({
      where: { id: tenantId },
      data: { plan: 'FREE' },
    }),
  ])
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return

  const tenantId = await getTenantIdFromCustomer(customerId)
  if (!tenantId) return

  await prisma.subscription.updateMany({
    where: { tenantId },
    data: { status: 'ACTIVE' },
  })
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return

  const tenantId = await getTenantIdFromCustomer(customerId)
  if (!tenantId) return

  await prisma.subscription.updateMany({
    where: { tenantId },
    data: { status: 'PAST_DUE' },
  })
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(rawBody, signature)
  } catch (err) {
    console.error('[Stripe webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      default:
        break
    }
  } catch (err) {
    console.error(`[Stripe webhook] Error handling ${event.type}:`, err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
