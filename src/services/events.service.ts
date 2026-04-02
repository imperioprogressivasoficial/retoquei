/**
 * Custom events tracking service
 * Tracks business events like signups, campaigns, messages, etc.
 */

import { trackEvent } from '@/lib/monitoring'

// ─────────────────────────────────────────────────────────────────────────────
// Event Definitions
// ─────────────────────────────────────────────────────────────────────────────

export type EventName =
  | 'user_signup'
  | 'user_login'
  | 'user_logout'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'connector_connected'
  | 'connector_sync_started'
  | 'connector_sync_completed'
  | 'connector_sync_failed'
  | 'customer_imported'
  | 'segment_created'
  | 'segment_updated'
  | 'campaign_created'
  | 'campaign_scheduled'
  | 'campaign_sent'
  | 'campaign_cancelled'
  | 'message_sent'
  | 'message_delivered'
  | 'message_read'
  | 'message_failed'
  | 'flow_created'
  | 'flow_activated'
  | 'flow_deactivated'
  | 'template_created'
  | 'template_used'
  | 'payment_initiated'
  | 'payment_completed'
  | 'payment_failed'
  | 'subscription_upgraded'
  | 'subscription_downgraded'
  | 'subscription_cancelled'
  | 'team_member_invited'
  | 'team_member_removed'
  | 'api_error'
  | 'api_success'

interface BaseEventProperties {
  userId?: string
  tenantId?: string
  timestamp?: Date
  [key: string]: any
}

// ─────────────────────────────────────────────────────────────────────────────
// Signup & Authentication Events
// ─────────────────────────────────────────────────────────────────────────────

export class SignupEvent {
  static track(userId: string, properties?: BaseEventProperties) {
    trackEvent({
      name: 'user_signup',
      userId,
      tenantId: properties?.tenantId,
      properties: {
        ...properties,
      },
      timestamp: properties?.timestamp,
    })
  }
}

export class LoginEvent {
  static track(userId: string, properties?: BaseEventProperties) {
    trackEvent({
      name: 'user_login',
      userId,
      tenantId: properties?.tenantId,
      properties,
      timestamp: properties?.timestamp,
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding Events
// ─────────────────────────────────────────────────────────────────────────────

export class OnboardingEvent {
  static started(userId: string, tenantId: string, properties?: BaseEventProperties) {
    trackEvent({
      name: 'onboarding_started',
      userId,
      tenantId,
      properties,
    })
  }

  static completed(userId: string, tenantId: string, properties?: BaseEventProperties) {
    trackEvent({
      name: 'onboarding_completed',
      userId,
      tenantId,
      properties: {
        ...properties,
      },
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Connector Events
// ─────────────────────────────────────────────────────────────────────────────

export class ConnectorEvent {
  static connected(userId: string, tenantId: string, connectorType: string, properties?: BaseEventProperties) {
    trackEvent({
      name: 'connector_connected',
      userId,
      tenantId,
      properties: {
        connectorType,
        ...properties,
      },
    })
  }

  static syncStarted(tenantId: string, connectorId: string, syncType: 'full' | 'incremental', properties?: BaseEventProperties) {
    trackEvent({
      name: 'connector_sync_started',
      tenantId,
      properties: {
        connectorId,
        syncType,
        ...properties,
      },
    })
  }

  static syncCompleted(
    tenantId: string,
    connectorId: string,
    customerCount: number,
    appointmentCount: number,
    properties?: BaseEventProperties
  ) {
    trackEvent({
      name: 'connector_sync_completed',
      tenantId,
      properties: {
        connectorId,
        customerCount,
        appointmentCount,
        ...properties,
      },
    })
  }

  static syncFailed(tenantId: string, connectorId: string, error: string, properties?: BaseEventProperties) {
    trackEvent({
      name: 'connector_sync_failed',
      tenantId,
      properties: {
        connectorId,
        error,
        ...properties,
      },
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Campaign Events
// ─────────────────────────────────────────────────────────────────────────────

export class CampaignEvent {
  static created(
    userId: string,
    tenantId: string,
    campaignId: string,
    segmentName: string,
    properties?: BaseEventProperties
  ) {
    trackEvent({
      name: 'campaign_created',
      userId,
      tenantId,
      properties: {
        campaignId,
        segmentName,
        ...properties,
      },
    })
  }

  static scheduled(tenantId: string, campaignId: string, scheduledAt: Date, properties?: BaseEventProperties) {
    trackEvent({
      name: 'campaign_scheduled',
      tenantId,
      properties: {
        campaignId,
        scheduledAt,
        ...properties,
      },
    })
  }

  static sent(
    tenantId: string,
    campaignId: string,
    recipientCount: number,
    properties?: BaseEventProperties
  ) {
    trackEvent({
      name: 'campaign_sent',
      tenantId,
      properties: {
        campaignId,
        recipientCount,
        ...properties,
      },
    })
  }

  static cancelled(tenantId: string, campaignId: string, reason?: string, properties?: BaseEventProperties) {
    trackEvent({
      name: 'campaign_cancelled',
      tenantId,
      properties: {
        campaignId,
        reason,
        ...properties,
      },
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Message Events
// ─────────────────────────────────────────────────────────────────────────────

export class MessageEvent {
  static sent(tenantId: string, messageId: string, channel: string, properties?: BaseEventProperties) {
    trackEvent({
      name: 'message_sent',
      tenantId,
      properties: {
        messageId,
        channel,
        ...properties,
      },
    })
  }

  static delivered(tenantId: string, messageId: string, properties?: BaseEventProperties) {
    trackEvent({
      name: 'message_delivered',
      tenantId,
      properties: {
        messageId,
        ...properties,
      },
    })
  }

  static read(tenantId: string, messageId: string, properties?: BaseEventProperties) {
    trackEvent({
      name: 'message_read',
      tenantId,
      properties: {
        messageId,
        ...properties,
      },
    })
  }

  static failed(tenantId: string, messageId: string, error: string, properties?: BaseEventProperties) {
    trackEvent({
      name: 'message_failed',
      tenantId,
      properties: {
        messageId,
        error,
        ...properties,
      },
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Events
// ─────────────────────────────────────────────────────────────────────────────

export class PaymentEvent {
  static initiated(userId: string, tenantId: string, planName: string, amount: number, properties?: BaseEventProperties) {
    trackEvent({
      name: 'payment_initiated',
      userId,
      tenantId,
      properties: {
        planName,
        amount,
        ...properties,
      },
    })
  }

  static completed(
    userId: string,
    tenantId: string,
    planName: string,
    amount: number,
    stripePaymentId?: string,
    properties?: BaseEventProperties
  ) {
    trackEvent({
      name: 'payment_completed',
      userId,
      tenantId,
      properties: {
        planName,
        amount,
        stripePaymentId,
        ...properties,
      },
    })
  }

  static failed(
    userId: string,
    tenantId: string,
    planName: string,
    error: string,
    properties?: BaseEventProperties
  ) {
    trackEvent({
      name: 'payment_failed',
      userId,
      tenantId,
      properties: {
        planName,
        error,
        ...properties,
      },
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API Events
// ─────────────────────────────────────────────────────────────────────────────

export class APIEvent {
  static success(endpoint: string, method: string, statusCode: number, duration: number) {
    trackEvent({
      name: 'api_success',
      properties: {
        endpoint,
        method,
        statusCode,
        duration,
      },
    })
  }

  static error(endpoint: string, method: string, statusCode: number, error: string) {
    trackEvent({
      name: 'api_error',
      properties: {
        endpoint,
        method,
        statusCode,
        error,
      },
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Export all event classes
// ─────────────────────────────────────────────────────────────────────────────

export default {
  SignupEvent,
  LoginEvent,
  OnboardingEvent,
  ConnectorEvent,
  CampaignEvent,
  MessageEvent,
  PaymentEvent,
  APIEvent,
}
