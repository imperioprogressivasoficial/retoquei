/**
 * Shared types for flow execution
 * Used by both the main app and the worker
 */

export interface FlowExecutorJobData {
  type: 'trigger_inactive' | 'trigger_birthday' | 'trigger_segment' | 'trigger_post_service' | 'execute_manual'
  tenantId: string
  customerId?: string
  appointmentId?: string
  segmentId?: string
}
