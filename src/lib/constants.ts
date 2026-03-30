// ─────────────────────────────────────────────
// Lifecycle Stages
// ─────────────────────────────────────────────

export const LIFECYCLE_STAGES = {
  NEW: {
    key: 'NEW',
    label: 'Novo',
    color: '#3B82F6',       // blue-500
    bgColor: '#EFF6FF',     // blue-50
    textColor: '#1D4ED8',   // blue-700
    description: 'Realizou apenas 1 visita',
  },
  RECURRING: {
    key: 'RECURRING',
    label: 'Recorrente',
    color: '#22C55E',       // green-500
    bgColor: '#F0FDF4',     // green-50
    textColor: '#15803D',   // green-700
    description: 'Retorna regularmente',
  },
  VIP: {
    key: 'VIP',
    label: 'VIP',
    color: '#EAB308',       // yellow-500 (gold)
    bgColor: '#FEFCE8',     // yellow-50
    textColor: '#A16207',   // yellow-700
    description: 'Cliente fidelizado de alto valor',
  },
  AT_RISK: {
    key: 'AT_RISK',
    label: 'Em Risco',
    color: '#F97316',       // orange-500
    bgColor: '#FFF7ED',     // orange-50
    textColor: '#C2410C',   // orange-700
    description: 'Passou do tempo médio de retorno',
  },
  LOST: {
    key: 'LOST',
    label: 'Perdido',
    color: '#EF4444',       // red-500
    bgColor: '#FEF2F2',     // red-50
    textColor: '#B91C1C',   // red-700
    description: 'Há muito tempo sem visita',
  },
  INACTIVE: {
    key: 'INACTIVE',
    label: 'Inativo',
    color: '#9CA3AF',       // gray-400
    bgColor: '#F9FAFB',     // gray-50
    textColor: '#6B7280',   // gray-500
    description: 'Sem agendamentos recentes',
  },
} as const

export type LifecycleStageKey = keyof typeof LIFECYCLE_STAGES

// ─────────────────────────────────────────────
// Risk Levels
// ─────────────────────────────────────────────

export const RISK_LEVELS = {
  LOW: {
    key: 'LOW',
    label: 'Baixo',
    color: '#22C55E',
    bgColor: '#F0FDF4',
    textColor: '#15803D',
    description: 'Dentro do período esperado de retorno',
  },
  MEDIUM: {
    key: 'MEDIUM',
    label: 'Médio',
    color: '#EAB308',
    bgColor: '#FEFCE8',
    textColor: '#A16207',
    description: 'Levemente acima do tempo médio',
  },
  HIGH: {
    key: 'HIGH',
    label: 'Alto',
    color: '#F97316',
    bgColor: '#FFF7ED',
    textColor: '#C2410C',
    description: 'Muito acima do tempo médio de retorno',
  },
  CRITICAL: {
    key: 'CRITICAL',
    label: 'Crítico',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    textColor: '#B91C1C',
    description: 'Provável perda definitiva do cliente',
  },
} as const

export type RiskLevelKey = keyof typeof RISK_LEVELS

// ─────────────────────────────────────────────
// System Segment Keys
// ─────────────────────────────────────────────

export enum SYSTEM_SEGMENT_KEYS {
  NEW_CUSTOMERS      = 'sys_new_customers',
  RECURRING          = 'sys_recurring',
  VIP                = 'sys_vip',
  AT_RISK            = 'sys_at_risk',
  LOST               = 'sys_lost',
  INACTIVE_30D       = 'sys_inactive_30d',
  INACTIVE_60D       = 'sys_inactive_60d',
  INACTIVE_90D       = 'sys_inactive_90d',
  HIGH_TICKET        = 'sys_high_ticket',
  LOW_FREQUENCY      = 'sys_low_frequency',
  HIGH_FREQUENCY     = 'sys_high_frequency',
  BIRTHDAY_THIS_MONTH = 'sys_birthday_this_month',
}

// ─────────────────────────────────────────────
// Default Thresholds
// ─────────────────────────────────────────────

export const DEFAULT_THRESHOLDS = {
  /** Multiplier of avgDaysBetweenVisits after which client becomes AT_RISK */
  atRiskMultiplier: 1.3,
  /** Multiplier of avgDaysBetweenVisits after which client becomes LOST */
  lostMultiplier: 2.0,
  /** Absolute minimum days without visit to become LOST (regardless of avg) */
  lostMinDays: 60,
  /** Minimum total appointments to qualify as VIP */
  vipMinAppointments: 10,
  /** Minimum average ticket (BRL) to qualify as VIP */
  vipMinAvgTicket: 0,
  /** High-ticket threshold for segmentation (BRL) */
  highTicketMinAvg: 150,
  /** Low-frequency threshold (days between visits) */
  lowFrequencyMinDays: 60,
  /** High-frequency maximum days between visits */
  highFrequencyMaxDays: 30,
  /** High-frequency minimum total appointments */
  highFrequencyMinAppointments: 3,
} as const

// ─────────────────────────────────────────────
// WhatsApp Template Variables
// ─────────────────────────────────────────────

export const WHATSAPP_VARIABLES: ReadonlyArray<{
  key: string
  label: string
  description: string
  example: string
}> = [
  { key: '{{name}}',                 label: 'Nome',                       description: 'Primeiro nome do cliente',                  example: 'Maria' },
  { key: '{{full_name}}',            label: 'Nome completo',              description: 'Nome completo do cliente',                  example: 'Maria Silva' },
  { key: '{{last_visit_date}}',      label: 'Última visita',              description: 'Data da última visita',                     example: '15/03/2026' },
  { key: '{{days_since_last}}',      label: 'Dias desde última visita',   description: 'Número de dias desde a última visita',      example: '30' },
  { key: '{{next_predicted_date}}',  label: 'Próxima visita prevista',    description: 'Data prevista para próximo agendamento',    example: '12/04/2026' },
  { key: '{{avg_ticket}}',           label: 'Ticket médio',               description: 'Ticket médio do cliente',                   example: 'R$ 85,00' },
  { key: '{{total_visits}}',         label: 'Total de visitas',           description: 'Número total de visitas',                   example: '12' },
  { key: '{{last_service}}',         label: 'Último serviço',             description: 'Nome do último serviço realizado',          example: 'Corte + Escova' },
  { key: '{{clinic_name}}',          label: 'Nome do estabelecimento',    description: 'Nome do seu estabelecimento',               example: 'Studio Bella' },
  { key: '{{phone}}',                label: 'Telefone do cliente',        description: 'Telefone formatado do cliente',             example: '(11) 98765-4321' },
  { key: '{{birthday}}',             label: 'Aniversário',                description: 'Data de aniversário do cliente',            example: '12/07' },
]

// ─────────────────────────────────────────────
// Connector Types
// ─────────────────────────────────────────────

export const CONNECTOR_TYPES = {
  CSV: {
    key: 'CSV',
    label: 'Importação CSV',
    description: 'Importe clientes, agendamentos e serviços via arquivos CSV.',
    icon: 'FileSpreadsheet',
    isNative: true,
  },
  WEBHOOK: {
    key: 'WEBHOOK',
    label: 'Webhook / API',
    description: 'Receba dados via webhook ou consulte uma API externa periodicamente.',
    icon: 'Webhook',
    isNative: true,
  },
  TRINKS: {
    key: 'TRINKS',
    label: 'Trinks',
    description: 'Integração oficial com o sistema de gestão Trinks.',
    icon: 'Scissors',
    isNative: false,
    docsUrl: 'https://trinks.com',
  },
  BELASIS: {
    key: 'BELASIS',
    label: 'Belasis',
    description: 'Integração com o sistema Belasis de gestão de salões.',
    icon: 'Scissors',
    isNative: false,
    docsUrl: 'https://belasis.com.br',
  },
  SIMPLES_DENTAL: {
    key: 'SIMPLES_DENTAL',
    label: 'Simples Dental',
    description: 'Integração com o sistema Simples Dental para clínicas odontológicas.',
    icon: 'Stethoscope',
    isNative: false,
    docsUrl: 'https://simplesdental.com',
  },
  CUSTOM_API: {
    key: 'CUSTOM_API',
    label: 'API Personalizada',
    description: 'Conecte qualquer sistema com uma API REST personalizada.',
    icon: 'Code',
    isNative: false,
  },
} as const

export type ConnectorTypeKey = keyof typeof CONNECTOR_TYPES

// ─────────────────────────────────────────────
// App Routes
// ─────────────────────────────────────────────

export const APP_ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Onboarding
  ONBOARDING_START: '/onboarding',
  ONBOARDING_PROFILE: '/onboarding/1',
  ONBOARDING_PLAN: '/onboarding/2',
  ONBOARDING_CONNECTOR: '/onboarding/3',
  ONBOARDING_IMPORT: '/onboarding/4',
  ONBOARDING_DONE: '/onboarding/5',

  // App (protected)
  DASHBOARD: '/app/dashboard',
  CUSTOMERS: '/app/customers',
  CUSTOMER_DETAIL: (id: string) => `/app/customers/${id}`,
  SEGMENTS: '/app/segments',
  SEGMENT_DETAIL: (id: string) => `/app/segments/${id}`,
  CAMPAIGNS: '/app/campaigns',
  CAMPAIGN_DETAIL: (id: string) => `/app/campaigns/${id}`,
  CAMPAIGN_NEW: '/app/campaigns/new',
  ANALYTICS: '/app/analytics',
  CONNECTORS: '/app/connectors',
  CONNECTOR_DETAIL: (id: string) => `/app/connectors/${id}`,
  SETTINGS: '/app/settings',
  SETTINGS_PROFILE: '/app/settings/profile',
  SETTINGS_TEAM: '/app/settings/team',
  SETTINGS_BILLING: '/app/settings/billing',
  SETTINGS_WHATSAPP: '/app/settings/whatsapp',
  SETTINGS_NOTIFICATIONS: '/app/settings/notifications',

  // Admin (platform)
  ADMIN: '/admin',
  ADMIN_TENANTS: '/admin/tenants',
  ADMIN_TENANT_DETAIL: (id: string) => `/admin/tenants/${id}`,
  ADMIN_USERS: '/admin/users',
  ADMIN_BILLING: '/admin/billing',
  ADMIN_AUDIT: '/admin/audit',

  // API
  API_WEBHOOKS: '/api/webhooks',
  API_WEBHOOK_WHATSAPP: '/api/webhooks/whatsapp',
  API_CONNECTORS: '/api/connectors',
  API_SYNC: '/api/sync',
} as const

// ─────────────────────────────────────────────
// Plan definitions
// ─────────────────────────────────────────────

export const PLANS = {
  FREE: {
    key: 'FREE',
    label: 'Grátis',
    maxCustomers: 100,
    maxMessages: 50,
    maxConnectors: 1,
    maxCampaigns: 2,
    maxTeamMembers: 1,
  },
  STARTER: {
    key: 'STARTER',
    label: 'Starter',
    maxCustomers: 500,
    maxMessages: 500,
    maxConnectors: 2,
    maxCampaigns: 10,
    maxTeamMembers: 3,
  },
  GROWTH: {
    key: 'GROWTH',
    label: 'Growth',
    maxCustomers: 2000,
    maxMessages: 2000,
    maxConnectors: 5,
    maxCampaigns: -1, // unlimited
    maxTeamMembers: 10,
  },
  SCALE: {
    key: 'SCALE',
    label: 'Scale',
    maxCustomers: -1,
    maxMessages: -1,
    maxConnectors: -1,
    maxCampaigns: -1,
    maxTeamMembers: -1,
  },
} as const

export type PlanKey = keyof typeof PLANS

// ─────────────────────────────────────────────
// Pagination defaults
// ─────────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
} as const

// ─────────────────────────────────────────────
// Date / time
// ─────────────────────────────────────────────

export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  API: 'yyyy-MM-dd',
} as const

// ─────────────────────────────────────────────
// Message status labels
// ─────────────────────────────────────────────

export const MESSAGE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  QUEUED: 'Na fila',
  SENT: 'Enviado',
  DELIVERED: 'Entregue',
  READ: 'Lido',
  FAILED: 'Falhou',
  CANCELLED: 'Cancelado',
}
