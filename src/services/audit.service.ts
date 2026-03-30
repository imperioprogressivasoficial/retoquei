import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Audit Service — immutable action log for compliance and debugging
// ---------------------------------------------------------------------------

export const AuditAction = {
  // Auth
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_INVITE: 'user.invite',
  USER_REMOVE: 'user.remove',
  // Tenant
  TENANT_CREATED: 'tenant.created',
  TENANT_UPDATED: 'tenant.updated',
  // Connectors
  CONNECTOR_CREATED: 'connector.created',
  CONNECTOR_DELETED: 'connector.deleted',
  CONNECTOR_SYNC_TRIGGERED: 'connector.sync_triggered',
  // Customers
  CUSTOMER_IMPORTED: 'customer.imported',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_DELETED: 'customer.deleted',
  // Campaigns
  CAMPAIGN_CREATED: 'campaign.created',
  CAMPAIGN_SENT: 'campaign.sent',
  CAMPAIGN_CANCELLED: 'campaign.cancelled',
  // Flows
  FLOW_ACTIVATED: 'flow.activated',
  FLOW_DEACTIVATED: 'flow.deactivated',
  // Messages
  MESSAGE_SENT: 'message.sent',
  MESSAGE_FAILED: 'message.failed',
  // Admin
  ADMIN_IMPERSONATE: 'admin.impersonate',
  ADMIN_RESYNC: 'admin.resync',
} as const

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction]

interface AuditLogParams {
  tenantId: string
  userId?: string
  action: AuditActionType | string
  resourceType?: string
  resourceId?: string
  diff?: Record<string, unknown>
  req?: NextRequest | Request
}

export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    let ipAddress: string | undefined
    let userAgent: string | undefined

    if (params.req) {
      ipAddress =
        params.req.headers.get?.('x-forwarded-for')?.split(',')[0]?.trim() ??
        params.req.headers.get?.('x-real-ip') ??
        undefined
      userAgent = params.req.headers.get?.('user-agent') ?? undefined
    }

    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        diff: params.diff as object,
        ipAddress,
        userAgent,
      },
    })
  } catch (err) {
    // Audit logging should never break the main flow
    console.error('[Audit] Failed to write audit log:', err)
  }
}
