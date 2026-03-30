import type { PlanKey } from '@/lib/constants'

// ─────────────────────────────────────────────
// User Roles
// ─────────────────────────────────────────────

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER'

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  OWNER: 'Proprietário',
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  VIEWER: 'Visualizador',
}

export const USER_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  OWNER: ['*'],
  ADMIN: ['read', 'write', 'delete', 'manage_team'],
  MANAGER: ['read', 'write'],
  VIEWER: ['read'],
}

// ─────────────────────────────────────────────
// Onboarding
// ─────────────────────────────────────────────

export type OnboardingStep =
  | 'profile'          // Step 1 — Tenant name, logo, segment (beauty, health, etc.)
  | 'plan'             // Step 2 — Plan selection
  | 'connector'        // Step 3 — Connect a data source
  | 'import'           // Step 4 — First data import / sync
  | 'done'             // Step 5 — All done, redirect to dashboard

export const ONBOARDING_STEPS: Array<{
  key: OnboardingStep
  label: string
  path: string
  stepNumber: number
}> = [
  { key: 'profile',   label: 'Perfil do negócio', path: '/onboarding/1', stepNumber: 1 },
  { key: 'plan',      label: 'Escolher plano',     path: '/onboarding/2', stepNumber: 2 },
  { key: 'connector', label: 'Conectar dados',     path: '/onboarding/3', stepNumber: 3 },
  { key: 'import',    label: 'Importar dados',     path: '/onboarding/4', stepNumber: 4 },
  { key: 'done',      label: 'Pronto!',            path: '/onboarding/5', stepNumber: 5 },
]

// ─────────────────────────────────────────────
// Tenant Settings
// ─────────────────────────────────────────────

export interface TenantThresholds {
  /** Multiplier applied to avgDaysBetweenVisits to determine AT_RISK threshold */
  atRiskMultiplier: number
  /** Multiplier applied to avgDaysBetweenVisits to determine LOST threshold */
  lostMultiplier: number
  /** Absolute minimum days without visit to classify as LOST */
  lostMinDays: number
  /** Minimum total appointments to qualify as VIP */
  vipMinAppointments: number
  /** Minimum average ticket (BRL) to qualify as VIP (0 = no minimum) */
  vipMinAvgTicket: number
  /** Minimum average ticket to qualify for High Ticket segment */
  highTicketMinAvg: number
  /** Minimum days between visits to qualify for Low Frequency segment */
  lowFrequencyMinDays: number
  /** Maximum days between visits for High Frequency segment */
  highFrequencyMaxDays: number
  /** Minimum total appointments for High Frequency segment */
  highFrequencyMinAppointments: number
}

export interface WhatsAppSettings {
  /** Meta Business Account ID */
  businessAccountId: string | null
  /** Phone Number ID from Meta */
  phoneNumberId: string | null
  /** Display phone number */
  displayPhoneNumber: string | null
  /** WhatsApp API access token */
  accessToken: string | null
  /** Webhook verify token (used for Meta webhook verification) */
  webhookVerifyToken: string | null
  /** Whether WhatsApp is connected and verified */
  isConnected: boolean
}

export interface NotificationSettings {
  /** Send email to owner when a new customer is detected */
  newCustomerEmail: boolean
  /** Send email on sync failures */
  syncFailureEmail: boolean
  /** Send weekly summary digest */
  weeklySummaryEmail: boolean
}

export interface TenantSettings {
  thresholds: TenantThresholds
  whatsapp: WhatsAppSettings
  notifications: NotificationSettings
  /** Timezone (IANA format, e.g. "America/Sao_Paulo") */
  timezone: string
  /** Locale (e.g. "pt-BR") */
  locale: string
  /** Business segment (e.g. "beauty", "health", "fitness") */
  segment: string | null
  /** Whether the AI assistant feature is enabled */
  aiEnabled: boolean
}

// ─────────────────────────────────────────────
// Tenant
// ─────────────────────────────────────────────

export interface Tenant {
  id: string
  /** Unique slug used in URLs */
  slug: string
  name: string
  logoUrl: string | null
  planKey: PlanKey
  /** Whether the tenant account is active */
  isActive: boolean
  /** Whether the onboarding flow has been completed */
  onboardingComplete: boolean
  /** Current onboarding step (if not complete) */
  currentOnboardingStep: OnboardingStep | null
  settings: TenantSettings
  /** Supabase auth user ID of the owner */
  ownerUserId: string
  createdAt: Date
  updatedAt: Date
}

// ─────────────────────────────────────────────
// Tenant User
// ─────────────────────────────────────────────

export interface TenantUser {
  id: string
  tenantId: string
  /** Supabase auth user ID */
  userId: string
  role: UserRole
  /** User's display name */
  name: string | null
  email: string
  avatarUrl: string | null
  /** Whether this user's account has been confirmed (invite accepted) */
  isActive: boolean
  /** Timestamp of last login */
  lastSeenAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// ─────────────────────────────────────────────
// Tenant Summary (for admin views)
// ─────────────────────────────────────────────

export interface TenantSummary {
  id: string
  slug: string
  name: string
  planKey: PlanKey
  isActive: boolean
  customerCount: number
  messagesSentThisMonth: number
  lastSyncAt: Date | null
  createdAt: Date
}

// ─────────────────────────────────────────────
// Invite
// ─────────────────────────────────────────────

export interface TenantInvite {
  id: string
  tenantId: string
  email: string
  role: UserRole
  token: string
  expiresAt: Date
  acceptedAt: Date | null
  createdAt: Date
}
