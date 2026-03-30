-- =============================================================================
-- Migration: 00001_rls_policies.sql
-- Description: Row Level Security policies for all tenant-scoped tables
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper function: get_user_tenant_id()
-- Returns the tenant_id for the currently authenticated Supabase user.
-- Looks up the tenant_users table joining via the users.supabase_id.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id TEXT;
BEGIN
  SELECT tu.tenant_id
  INTO v_tenant_id
  FROM public.tenant_users tu
  INNER JOIN public.users u ON u.id = tu.user_id
  WHERE u.supabase_id = auth.uid()::TEXT
  LIMIT 1;

  RETURN v_tenant_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Helper function: get_user_tenant_ids()
-- Returns all tenant_ids the current user belongs to (for multi-tenant support)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS TEXT[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_ids TEXT[];
BEGIN
  SELECT ARRAY_AGG(tu.tenant_id)
  INTO v_tenant_ids
  FROM public.tenant_users tu
  INNER JOIN public.users u ON u.id = tu.user_id
  WHERE u.supabase_id = auth.uid()::TEXT;

  RETURN COALESCE(v_tenant_ids, ARRAY[]::TEXT[]);
END;
$$;

-- ---------------------------------------------------------------------------
-- Helper function: is_platform_admin()
-- Returns true if the current user has platform admin privileges
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT is_platform_admin
  INTO v_is_admin
  FROM public.users
  WHERE supabase_id = auth.uid()::TEXT
  LIMIT 1;

  RETURN COALESCE(v_is_admin, FALSE);
END;
$$;

-- ---------------------------------------------------------------------------
-- Grant execute on helper functions to authenticated users
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

-- =============================================================================
-- Enable RLS on all tenant-scoped tables
-- =============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segment_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_flow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS Policies
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Table: tenants
-- ---------------------------------------------------------------------------

-- Users can view tenants they belong to
CREATE POLICY "tenants_select_own"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

-- Only owners/admins can update their tenant
CREATE POLICY "tenants_update_owner"
ON public.tenants
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users tu
    INNER JOIN public.users u ON u.id = tu.user_id
    WHERE u.supabase_id = auth.uid()::TEXT
      AND tu.tenant_id = tenants.id
      AND tu.role IN ('OWNER', 'ADMIN')
  )
  OR public.is_platform_admin()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tenant_users tu
    INNER JOIN public.users u ON u.id = tu.user_id
    WHERE u.supabase_id = auth.uid()::TEXT
      AND tu.tenant_id = tenants.id
      AND tu.role IN ('OWNER', 'ADMIN')
  )
  OR public.is_platform_admin()
);

-- Service role can do everything (bypasses RLS automatically)
-- Platform admins can insert tenants
CREATE POLICY "tenants_insert_admin"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Table: users
-- ---------------------------------------------------------------------------

-- Users can view their own record
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (
  supabase_id = auth.uid()::TEXT
  OR public.is_platform_admin()
);

-- Users can update their own record
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (supabase_id = auth.uid()::TEXT)
WITH CHECK (supabase_id = auth.uid()::TEXT);

-- Users can insert their own record (on signup)
CREATE POLICY "users_insert_own"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (supabase_id = auth.uid()::TEXT);

-- ---------------------------------------------------------------------------
-- Table: tenant_users
-- ---------------------------------------------------------------------------

-- Members can see who else is in their tenant
CREATE POLICY "tenant_users_select_own_tenant"
ON public.tenant_users
FOR SELECT
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

-- Only owners/managers can add members to their tenant
CREATE POLICY "tenant_users_insert_manager"
ON public.tenant_users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tenant_users tu
    INNER JOIN public.users u ON u.id = tu.user_id
    WHERE u.supabase_id = auth.uid()::TEXT
      AND tu.tenant_id = tenant_users.tenant_id
      AND tu.role IN ('OWNER', 'MANAGER', 'ADMIN')
  )
  OR public.is_platform_admin()
);

-- Only owners/managers can update member roles
CREATE POLICY "tenant_users_update_manager"
ON public.tenant_users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users tu
    INNER JOIN public.users u ON u.id = tu.user_id
    WHERE u.supabase_id = auth.uid()::TEXT
      AND tu.tenant_id = tenant_users.tenant_id
      AND tu.role IN ('OWNER', 'MANAGER', 'ADMIN')
  )
  OR public.is_platform_admin()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tenant_users tu
    INNER JOIN public.users u ON u.id = tu.user_id
    WHERE u.supabase_id = auth.uid()::TEXT
      AND tu.tenant_id = tenant_users.tenant_id
      AND tu.role IN ('OWNER', 'MANAGER', 'ADMIN')
  )
  OR public.is_platform_admin()
);

-- Only owners can delete members
CREATE POLICY "tenant_users_delete_owner"
ON public.tenant_users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users tu
    INNER JOIN public.users u ON u.id = tu.user_id
    WHERE u.supabase_id = auth.uid()::TEXT
      AND tu.tenant_id = tenant_users.tenant_id
      AND tu.role IN ('OWNER', 'ADMIN')
  )
  OR public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- Table: booking_connectors
-- ---------------------------------------------------------------------------

CREATE POLICY "booking_connectors_tenant_select"
ON public.booking_connectors
FOR SELECT
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "booking_connectors_tenant_insert"
ON public.booking_connectors
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "booking_connectors_tenant_update"
ON public.booking_connectors
FOR UPDATE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
)
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "booking_connectors_tenant_delete"
ON public.booking_connectors
FOR DELETE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- Table: connector_sync_runs
-- ---------------------------------------------------------------------------

CREATE POLICY "connector_sync_runs_tenant_select"
ON public.connector_sync_runs
FOR SELECT
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "connector_sync_runs_tenant_insert"
ON public.connector_sync_runs
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "connector_sync_runs_tenant_update"
ON public.connector_sync_runs
FOR UPDATE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
)
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- Table: customers
-- ---------------------------------------------------------------------------

CREATE POLICY "customers_tenant_select"
ON public.customers
FOR SELECT
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "customers_tenant_insert"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "customers_tenant_update"
ON public.customers
FOR UPDATE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
)
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "customers_tenant_delete"
ON public.customers
FOR DELETE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- Table: customer_metrics
-- ---------------------------------------------------------------------------

CREATE POLICY "customer_metrics_tenant_select"
ON public.customer_metrics
FOR SELECT
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "customer_metrics_tenant_insert"
ON public.customer_metrics
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "customer_metrics_tenant_update"
ON public.customer_metrics
FOR UPDATE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
)
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- Table: services
-- ---------------------------------------------------------------------------

CREATE POLICY "services_tenant_select"
ON public.services
FOR SELECT
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "services_tenant_insert"
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "services_tenant_update"
ON public.services
FOR UPDATE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
)
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "services_tenant_delete"
ON public.services
FOR DELETE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- Table: professionals
-- ---------------------------------------------------------------------------

CREATE POLICY "professionals_tenant_select"
ON public.professionals
FOR SELECT
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "professionals_tenant_insert"
ON public.professionals
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "professionals_tenant_update"
ON public.professionals
FOR UPDATE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
)
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "professionals_tenant_delete"
ON public.professionals
FOR DELETE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- Table: appointments
-- ---------------------------------------------------------------------------

CREATE POLICY "appointments_tenant_select"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "appointments_tenant_insert"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "appointments_tenant_update"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
)
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "appointments_tenant_delete"
ON public.appointments
FOR DELETE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- Table: segments
-- ---------------------------------------------------------------------------

CREATE POLICY "segments_tenant_select"
ON public.segments
FOR SELECT
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "segments_tenant_insert"
ON public.segments
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "segments_tenant_update"
ON public.segments
FOR UPDATE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
)
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "segments_tenant_delete"
ON public.segments
FOR DELETE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- Table: segment_memberships
-- ---------------------------------------------------------------------------

CREATE POLICY "segment_memberships_tenant_select"
ON public.segment_memberships
FOR SELECT
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "segment_memberships_tenant_insert"
ON public.segment_memberships
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "segment_memberships_tenant_delete"
ON public.segment_memberships
FOR DELETE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- Table: message_templates
-- ---------------------------------------------------------------------------

-- Users can see system templates AND their own tenant templates
CREATE POLICY "message_templates_tenant_select"
ON public.message_templates
FOR SELECT
TO authenticated
USING (
  is_system = TRUE
  OR tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "message_templates_tenant_insert"
ON public.message_templates
FOR INSERT
TO authenticated
WITH CHECK (
  (tenant_id = ANY(public.get_user_tenant_ids()) AND is_system = FALSE)
  OR public.is_platform_admin()
);

CREATE POLICY "message_templates_tenant_update"
ON public.message_templates
FOR UPDATE
TO authenticated
USING (
  (tenant_id = ANY(public.get_user_tenant_ids()) AND is_system = FALSE)
  OR public.is_platform_admin()
)
WITH CHECK (
  (tenant_id = ANY(public.get_user_tenant_ids()) AND is_system = FALSE)
  OR public.is_platform_admin()
);

CREATE POLICY "message_templates_tenant_delete"
ON public.message_templates
FOR DELETE
TO authenticated
USING (
  (tenant_id = ANY(public.get_user_tenant_ids()) AND is_system = FALSE)
  OR public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- Table: automation_flows
-- ---------------------------------------------------------------------------

CREATE POLICY "automation_flows_tenant_select"
ON public.automation_flows
FOR SELECT
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "automation_flows_tenant_insert"
ON public.automation_flows
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "automation_flows_tenant_update"
ON public.automation_flows
FOR UPDATE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
)
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "automation_flows_tenant_delete"
ON public.automation_flows
FOR DELETE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- Table: automation_flow_steps
-- ---------------------------------------------------------------------------

-- Access is controlled via the parent flow's tenant
CREATE POLICY "automation_flow_steps_tenant_select"
ON public.automation_flow_steps
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.automation_flows af
    WHERE af.id = automation_flow_steps.flow_id
      AND af.tenant_id = ANY(public.get_user_tenant_ids())
  )
  OR public.is_platform_admin()
);

CREATE POLICY "automation_flow_steps_tenant_insert"
ON public.automation_flow_steps
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.automation_flows af
    WHERE af.id = automation_flow_steps.flow_id
      AND af.tenant_id = ANY(public.get_user_tenant_ids())
  )
  OR public.is_platform_admin()
);

CREATE POLICY "automation_flow_steps_tenant_update"
ON public.automation_flow_steps
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.automation_flows af
    WHERE af.id = automation_flow_steps.flow_id
      AND af.tenant_id = ANY(public.get_user_tenant_ids())
  )
  OR public.is_platform_admin()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.automation_flows af
    WHERE af.id = automation_flow_steps.flow_id
      AND af.tenant_id = ANY(public.get_user_tenant_ids())
  )
  OR public.is_platform_admin()
);

CREATE POLICY "automation_flow_steps_tenant_delete"
ON public.automation_flow_steps
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.automation_flows af
    WHERE af.id = automation_flow_steps.flow_id
      AND af.tenant_id = ANY(public.get_user_tenant_ids())
  )
  OR public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- Table: campaigns
-- ---------------------------------------------------------------------------

CREATE POLICY "campaigns_tenant_select"
ON public.campaigns
FOR SELECT
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "campaigns_tenant_insert"
ON public.campaigns
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "campaigns_tenant_update"
ON public.campaigns
FOR UPDATE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
)
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "campaigns_tenant_delete"
ON public.campaigns
FOR DELETE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- Table: outbound_messages
-- ---------------------------------------------------------------------------

CREATE POLICY "outbound_messages_tenant_select"
ON public.outbound_messages
FOR SELECT
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "outbound_messages_tenant_insert"
ON public.outbound_messages
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "outbound_messages_tenant_update"
ON public.outbound_messages
FOR UPDATE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
)
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- Table: inbound_messages
-- ---------------------------------------------------------------------------

CREATE POLICY "inbound_messages_tenant_select"
ON public.inbound_messages
FOR SELECT
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "inbound_messages_tenant_insert"
ON public.inbound_messages
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- Table: webhook_events
-- ---------------------------------------------------------------------------

CREATE POLICY "webhook_events_tenant_select"
ON public.webhook_events
FOR SELECT
TO authenticated
USING (
  (tenant_id IS NOT NULL AND tenant_id = ANY(public.get_user_tenant_ids()))
  OR public.is_platform_admin()
);

CREATE POLICY "webhook_events_tenant_insert"
ON public.webhook_events
FOR INSERT
TO authenticated
WITH CHECK (
  (tenant_id IS NOT NULL AND tenant_id = ANY(public.get_user_tenant_ids()))
  OR public.is_platform_admin()
);

CREATE POLICY "webhook_events_tenant_update"
ON public.webhook_events
FOR UPDATE
TO authenticated
USING (
  (tenant_id IS NOT NULL AND tenant_id = ANY(public.get_user_tenant_ids()))
  OR public.is_platform_admin()
)
WITH CHECK (
  (tenant_id IS NOT NULL AND tenant_id = ANY(public.get_user_tenant_ids()))
  OR public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- Table: audit_logs
-- ---------------------------------------------------------------------------

-- Audit logs are read-only via RLS; only managers and above can read them
CREATE POLICY "audit_logs_tenant_select"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  (
    tenant_id = ANY(public.get_user_tenant_ids())
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      INNER JOIN public.users u ON u.id = tu.user_id
      WHERE u.supabase_id = auth.uid()::TEXT
        AND tu.tenant_id = audit_logs.tenant_id
        AND tu.role IN ('OWNER', 'MANAGER', 'ADMIN')
    )
  )
  OR public.is_platform_admin()
);

-- Audit logs can be inserted by all authenticated tenant members
CREATE POLICY "audit_logs_tenant_insert"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- Table: subscriptions
-- ---------------------------------------------------------------------------

CREATE POLICY "subscriptions_tenant_select"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "subscriptions_tenant_update"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Table: usage_counters
-- ---------------------------------------------------------------------------

CREATE POLICY "usage_counters_tenant_select"
ON public.usage_counters
FOR SELECT
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "usage_counters_tenant_insert"
ON public.usage_counters
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

CREATE POLICY "usage_counters_tenant_update"
ON public.usage_counters
FOR UPDATE
TO authenticated
USING (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
)
WITH CHECK (
  tenant_id = ANY(public.get_user_tenant_ids())
  OR public.is_platform_admin()
);

-- ---------------------------------------------------------------------------
-- Table: feature_flags
-- ---------------------------------------------------------------------------

-- All authenticated users can read feature flags (needed to check feature availability)
CREATE POLICY "feature_flags_authenticated_select"
ON public.feature_flags
FOR SELECT
TO authenticated
USING (TRUE);

-- Only platform admins can modify feature flags
CREATE POLICY "feature_flags_admin_insert"
ON public.feature_flags
FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_admin());

CREATE POLICY "feature_flags_admin_update"
ON public.feature_flags
FOR UPDATE
TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

CREATE POLICY "feature_flags_admin_delete"
ON public.feature_flags
FOR DELETE
TO authenticated
USING (public.is_platform_admin());

-- =============================================================================
-- Service role bypass note:
-- The service_role key in Supabase bypasses RLS automatically.
-- Any server-side operations using the service role key (e.g., from API routes
-- using the admin Supabase client) will have unrestricted access to all tables.
-- Always use the anon/user key on the client side.
-- =============================================================================

-- Create indexes to support the RLS helper functions efficiently
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id_tenant_id
  ON public.tenant_users (user_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_users_supabase_id
  ON public.users (supabase_id);
