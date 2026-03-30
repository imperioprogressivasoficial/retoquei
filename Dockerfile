# ============================================================
# Retoquei — Next.js Multi-Stage Dockerfile
# ============================================================
# Stages:
#   1. base    — shared Node.js alpine image
#   2. deps    — install ALL node_modules (including dev)
#   3. builder — run `next build` (produces .next/standalone)
#   4. runner  — minimal production image
# ============================================================

# ------------------------------------------------------------
# Stage 1: base
# ------------------------------------------------------------
FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# ------------------------------------------------------------
# Stage 2: deps — install dependencies
# ------------------------------------------------------------
FROM base AS deps

COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# ------------------------------------------------------------
# Stage 3: builder — build the Next.js application
# ------------------------------------------------------------
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client before building
RUN npx prisma generate

# Build the app — requires NEXT_PUBLIC_* vars at build time if used
# Pass them as build args if needed:
# ARG NEXT_PUBLIC_APP_URL
# ARG NEXT_PUBLIC_SUPABASE_URL
# ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
# ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
# ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
# ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ------------------------------------------------------------
# Stage 4: runner — minimal production image
# ------------------------------------------------------------
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy static assets from builder
COPY --from=builder /app/public ./public

# Copy standalone output (produced by output: 'standalone' in next.config.ts)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and generated client (needed at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
