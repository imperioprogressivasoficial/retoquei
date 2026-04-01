-- AddColumn: stripeCustomerId on tenants
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;

-- AddColumn: stripeSubscriptionId on subscriptions
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
