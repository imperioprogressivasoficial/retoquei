import { Job } from 'bullmq';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import {
  customerRecomputeQueue,
  ConnectorSyncJobData,
  CustomerRecomputeJobData,
} from '../queues';
import { ConnectorType, SyncRunStatus, AppointmentStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types mirroring what external APIs return (simplified)
// ---------------------------------------------------------------------------

interface TrinksAppointment {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  professionalName: string;
  scheduledAt: string;
  completedAt: string | null;
  status: string;
  price: number | null;
  branchName: string | null;
}

interface TrinksResponse {
  appointments: TrinksAppointment[];
  totalCount: number;
}

interface SyncResult {
  customersCreated: number;
  customersUpdated: number;
  appointmentsCreated: number;
  appointmentsUpdated: number;
  servicesCreated: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Helper: normalize Brazilian phone number to E.164
// ---------------------------------------------------------------------------

function normalizePhoneE164(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    return `+${digits}`;
  }
  if (digits.length === 11 || digits.length === 10) {
    return `+55${digits}`;
  }
  return `+55${digits}`;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ---------------------------------------------------------------------------
// Connector implementations
// ---------------------------------------------------------------------------

async function syncTrinksConnector(
  tenantId: string,
  connectorId: string,
  syncType: 'full' | 'incremental',
  config: Record<string, unknown>,
): Promise<SyncResult> {
  const result: SyncResult = {
    customersCreated: 0,
    customersUpdated: 0,
    appointmentsCreated: 0,
    appointmentsUpdated: 0,
    servicesCreated: 0,
    errors: [],
  };

  const apiKey = config['apiKey'] as string | undefined;
  const baseUrl = (config['baseUrl'] as string | undefined) ?? 'https://api.trinks.com/v1';

  if (!apiKey) {
    throw new Error('Trinks connector missing apiKey in config');
  }

  const since = syncType === 'incremental'
    ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    : undefined;

  const params: Record<string, string> = { limit: '500', offset: '0' };
  if (since) params['since'] = since;

  let offset = 0;
  const limit = 500;
  let hasMore = true;

  while (hasMore) {
    params['offset'] = String(offset);

    let trinksData: TrinksResponse;
    try {
      const response = await axios.get<TrinksResponse>(`${baseUrl}/appointments`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        params,
        timeout: 30_000,
      });
      trinksData = response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push(`Trinks API error at offset ${offset}: ${message}`);
      break;
    }

    for (const appt of trinksData.appointments) {
      try {
        const phoneE164 = normalizePhoneE164(appt.clientPhone);
        const normalizedName = normalizeName(appt.clientName);

        // Upsert customer
        const existing = await prisma.customer.findFirst({
          where: { tenantId, phoneE164 },
        });

        let customerId: string;
        if (!existing) {
          const created = await prisma.customer.create({
            data: {
              tenantId,
              fullName: appt.clientName.trim(),
              normalizedName,
              phoneE164,
              whatsappOptIn: true,
            },
          });
          customerId = created.id;
          result.customersCreated++;
        } else {
          customerId = existing.id;
          // Update name if different
          if (existing.normalizedName !== normalizedName) {
            await prisma.customer.update({
              where: { id: customerId },
              data: { fullName: appt.clientName.trim(), normalizedName },
            });
            result.customersUpdated++;
          }
        }

        // Upsert service
        let serviceId: string | undefined;
        if (appt.serviceName) {
          const service = await prisma.service.findFirst({
            where: { tenantId, name: appt.serviceName },
          });
          if (!service) {
            const created = await prisma.service.create({
              data: { tenantId, name: appt.serviceName },
            });
            serviceId = created.id;
            result.servicesCreated++;
          } else {
            serviceId = service.id;
          }
        }

        // Upsert professional
        let professionalId: string | undefined;
        if (appt.professionalName) {
          const prof = await prisma.professional.findFirst({
            where: { tenantId, name: appt.professionalName },
          });
          if (!prof) {
            const created = await prisma.professional.create({
              data: { tenantId, name: appt.professionalName },
            });
            professionalId = created.id;
          } else {
            professionalId = prof.id;
          }
        }

        // Map status
        const statusMap: Record<string, AppointmentStatus> = {
          completed: 'COMPLETED',
          cancelled: 'CANCELLED',
          no_show: 'NO_SHOW',
          scheduled: 'SCHEDULED',
        };
        const status: AppointmentStatus =
          statusMap[appt.status.toLowerCase()] ?? 'SCHEDULED';

        // Upsert appointment by externalId
        const existingAppt = await prisma.appointment.findUnique({
          where: { tenantId_externalId: { tenantId, externalId: appt.id } },
        });

        if (!existingAppt) {
          await prisma.appointment.create({
            data: {
              tenantId,
              customerId,
              connectorId,
              externalId: appt.id,
              serviceId,
              professionalId,
              scheduledAt: new Date(appt.scheduledAt),
              completedAt: appt.completedAt ? new Date(appt.completedAt) : null,
              status,
              price: appt.price ?? null,
              branchName: appt.branchName ?? null,
            },
          });
          result.appointmentsCreated++;
        } else {
          await prisma.appointment.update({
            where: { id: existingAppt.id },
            data: {
              status,
              completedAt: appt.completedAt ? new Date(appt.completedAt) : null,
              price: appt.price ?? null,
            },
          });
          result.appointmentsUpdated++;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        result.errors.push(`Error processing appointment ${appt.id}: ${message}`);
      }
    }

    offset += limit;
    hasMore = offset < trinksData.totalCount;
  }

  return result;
}

async function syncWebhookConnector(
  _tenantId: string,
  _connectorId: string,
): Promise<SyncResult> {
  // Webhook connectors are push-based — nothing to pull here.
  // Sync just verifies the connector is reachable / marks it as synced.
  return {
    customersCreated: 0,
    customersUpdated: 0,
    appointmentsCreated: 0,
    appointmentsUpdated: 0,
    servicesCreated: 0,
    errors: [],
  };
}

async function syncCsvConnector(
  tenantId: string,
  connectorId: string,
  config: Record<string, unknown>,
): Promise<SyncResult> {
  // CSV connectors are typically one-shot imports.
  // A real implementation would read from object storage (e.g. Supabase Storage).
  console.info(
    `[connector-sync] CSV connector ${connectorId} for tenant ${tenantId} — skipping automated sync (manual import only)`,
    config,
  );
  return {
    customersCreated: 0,
    customersUpdated: 0,
    appointmentsCreated: 0,
    appointmentsUpdated: 0,
    servicesCreated: 0,
    errors: [],
  };
}

// ---------------------------------------------------------------------------
// Main processor
// ---------------------------------------------------------------------------

export async function connectorSyncProcessor(
  job: Job<ConnectorSyncJobData>,
): Promise<void> {
  const { tenantId, connectorId, syncType } = job.data;
  const log = (msg: string) =>
    console.info(`[connector-sync] job=${job.id} connector=${connectorId} ${msg}`);

  log(`Starting ${syncType} sync`);

  // Create sync run record
  const syncRun = await prisma.connectorSyncRun.create({
    data: {
      connectorId,
      tenantId,
      status: SyncRunStatus.RUNNING,
    },
  });

  let result: SyncResult;
  let finalStatus: SyncRunStatus = SyncRunStatus.COMPLETED;

  try {
    const connector = await prisma.bookingConnector.findUniqueOrThrow({
      where: { id: connectorId },
    });

    await prisma.bookingConnector.update({
      where: { id: connectorId },
      data: { status: 'SYNCING' },
    });

    const config = (connector.config as Record<string, unknown>) ?? {};

    switch (connector.type as ConnectorType) {
      case 'TRINKS':
        result = await syncTrinksConnector(tenantId, connectorId, syncType, config);
        break;
      case 'WEBHOOK':
        result = await syncWebhookConnector(tenantId, connectorId);
        break;
      case 'CSV':
        result = await syncCsvConnector(tenantId, connectorId, config);
        break;
      default:
        throw new Error(`Unknown connector type: ${connector.type}`);
    }

    if (result.errors.length > 0) {
      finalStatus = SyncRunStatus.PARTIAL;
    }

    // Update connector last sync
    await prisma.bookingConnector.update({
      where: { id: connectorId },
      data: {
        status: 'CONNECTED',
        lastSyncAt: new Date(),
        nextSyncAt: new Date(
          Date.now() + connector.syncIntervalMinutes * 60 * 1000,
        ),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    finalStatus = SyncRunStatus.FAILED;
    result = {
      customersCreated: 0,
      customersUpdated: 0,
      appointmentsCreated: 0,
      appointmentsUpdated: 0,
      servicesCreated: 0,
      errors: [message],
    };

    // Mark connector as errored
    await prisma.bookingConnector.update({
      where: { id: connectorId },
      data: { status: 'ERROR' },
    });

    log(`Failed: ${message}`);
    throw err; // BullMQ will handle retries
  } finally {
    // Always persist the sync run result
    await prisma.connectorSyncRun.update({
      where: { id: syncRun.id },
      data: {
        status: finalStatus,
        customersCreated: result?.customersCreated ?? 0,
        customersUpdated: result?.customersUpdated ?? 0,
        appointmentsCreated: result?.appointmentsCreated ?? 0,
        appointmentsUpdated: result?.appointmentsUpdated ?? 0,
        servicesCreated: result?.servicesCreated ?? 0,
        errors: result?.errors ?? [],
        finishedAt: new Date(),
      },
    });
  }

  log(
    `Completed (${finalStatus}) — +${result.customersCreated} customers, +${result.appointmentsCreated} appointments, ${result.errors.length} errors`,
  );

  // Enqueue customer recompute for this tenant
  const recomputePayload: CustomerRecomputeJobData = { tenantId };
  await customerRecomputeQueue.add('recompute-after-sync', recomputePayload, {
    jobId: `recompute-${tenantId}-${Date.now()}`,
  });
}
