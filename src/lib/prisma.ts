import { PrismaClient } from '@prisma/client'

// Extend the NodeJS global type so TypeScript knows about the cached client.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

/**
 * Prisma client singleton.
 *
 * In development (with HMR), Next.js clears module cache on each reload which
 * would create a new PrismaClient instance on every hot-reload, exhausting the
 * connection pool. We avoid this by caching the instance on the global object.
 *
 * In production, the module is only loaded once, so global caching is not
 * necessary but harmless.
 */
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
    errorFormat: 'minimal',
  })

  // Eagerly connect to avoid cold-start connection delay on first query
  client.$connect().catch(() => {})

  return client
}

const prisma = globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

export { prisma }
export default prisma
