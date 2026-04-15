-- Add phone column to profiles with unique constraint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "phone" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_phone_key" ON "profiles"("phone") WHERE "phone" IS NOT NULL;

-- OTP codes table for WhatsApp passwordless login
CREATE TABLE IF NOT EXISTS "otp_codes" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "otp_codes_phone_created_at_idx" ON "otp_codes"("phone", "created_at");
