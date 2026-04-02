import { Queue, QueueOptions } from 'bullmq';
import { redis } from './lib/redis';

// ---------------------------------------------------------------------------
// Shared default job options
// ---------------------------------------------------------------------------

const defaultJobOptions: QueueOptions['defaultJobOptions'] = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  removeOnComplete: {
    age: 24 * 3600, // keep completed jobs for 24 h
    count: 1000,
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // keep failed jobs for 7 days
  },
};

const connectionOpts = { connection: redis };

// ---------------------------------------------------------------------------
// Queue definitions
// ---------------------------------------------------------------------------

/** Syncs appointments/customers from external booking connectors */
export const connectorSyncQueue = new Queue('connector-sync', {
  ...connectionOpts,
  defaultJobOptions,
});

/** Recomputes RFM / LTV / lifecycle metrics per customer */
export const customerRecomputeQueue = new Queue('customer-recompute', {
  ...connectionOpts,
  defaultJobOptions,
});

/** Re-evaluates segment rules and updates memberships */
export const segmentRefreshQueue = new Queue('segment-refresh', {
  ...connectionOpts,
  defaultJobOptions,
});

/** Sends a single outbound message via a messaging provider */
export const messageSendQueue = new Queue('message-send', {
  ...connectionOpts,
  defaultJobOptions,
});

/** Processes raw webhook events stored in the DB */
export const webhookProcessQueue = new Queue('webhook-process', {
  ...connectionOpts,
  defaultJobOptions,
});

/** Dispatches scheduled campaigns whose scheduledAt has arrived */
export const campaignScheduleQueue = new Queue('campaign-schedule', {
  ...connectionOpts,
  defaultJobOptions,
});

/** Retries messages that failed in a previous attempt */
export const retryFailedMessagesQueue = new Queue('retry-failed-messages', {
  ...connectionOpts,
  defaultJobOptions,
});

/** Executes automation flows based on triggers */
export const flowExecutorQueue = new Queue('flow-executor', {
  ...connectionOpts,
  defaultJobOptions,
});

// ---------------------------------------------------------------------------
// Typed job data interfaces (shared across queues & processors)
// ---------------------------------------------------------------------------

export interface ConnectorSyncJobData {
  tenantId: string;
  connectorId: string;
  syncType: 'full' | 'incremental';
}

export interface CustomerRecomputeJobData {
  tenantId: string;
  /** When omitted all customers for the tenant are recomputed */
  customerId?: string;
}

export interface SegmentRefreshJobData {
  tenantId: string;
  /** When omitted all segments for the tenant are refreshed */
  segmentId?: string;
}

export interface MessageSendJobData {
  messageId: string;
}

export interface WebhookProcessJobData {
  webhookEventId: string;
}

export interface CampaignScheduleJobData {
  campaignId?: string; // omit to check all due campaigns
}

export interface RetryFailedMessagesJobData {
  tenantId?: string; // omit to retry across all tenants
}

export interface FlowExecutorJobData {
  type: 'trigger_inactive' | 'trigger_birthday' | 'trigger_segment' | 'trigger_post_service' | 'execute_manual';
  tenantId: string;
  customerId?: string;
  appointmentId?: string;
  segmentId?: string;
}
