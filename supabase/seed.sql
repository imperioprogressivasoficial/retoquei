-- =============================================================================
-- Seed file: supabase/seed.sql
-- Project: Retoquei
-- Description: Demo data for Salão Aurora
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. Demo User
-- =============================================================================

INSERT INTO public.users (id, supabase_id, email, full_name, avatar_url, is_platform_admin, created_at, updated_at)
VALUES (
  'demo-user-1',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'demo@retoquei.com',
  'Demo Admin',
  NULL,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. Demo Tenant
-- =============================================================================

INSERT INTO public.tenants (
  id, name, slug, status, plan, owner_id, settings,
  at_risk_threshold_days, lost_threshold_days,
  vip_appointment_count, vip_avg_ticket_multiplier,
  created_at, updated_at
)
VALUES (
  'tenant-aurora-1',
  'Salão Aurora',
  'salao-aurora',
  'ACTIVE',
  'GROWTH',
  'demo-user-1',
  '{"timezone": "America/Sao_Paulo", "currency": "BRL", "locale": "pt-BR"}',
  60,
  120,
  10,
  1.5,
  NOW() - INTERVAL '180 days',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. TenantUser (Owner link)
-- =============================================================================

INSERT INTO public.tenant_users (id, tenant_id, user_id, role, invited_at, joined_at)
VALUES (
  'tu-aurora-demo-1',
  'tenant-aurora-1',
  'demo-user-1',
  'OWNER',
  NOW() - INTERVAL '180 days',
  NOW() - INTERVAL '180 days'
)
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- =============================================================================
-- 4. Subscription
-- =============================================================================

INSERT INTO public.subscriptions (id, tenant_id, plan, status, started_at, expires_at, created_at, updated_at)
VALUES (
  'sub-aurora-1',
  'tenant-aurora-1',
  'GROWTH',
  'ACTIVE',
  NOW() - INTERVAL '180 days',
  NOW() + INTERVAL '185 days',
  NOW() - INTERVAL '180 days',
  NOW()
)
ON CONFLICT (tenant_id) DO NOTHING;

-- =============================================================================
-- 5. Booking Connector (CSV)
-- =============================================================================

INSERT INTO public.booking_connectors (
  id, tenant_id, type, name, status, config, column_mappings,
  webhook_secret, last_sync_at, next_sync_at, sync_interval_minutes,
  created_at, updated_at
)
VALUES (
  'connector-aurora-csv-1',
  'tenant-aurora-1',
  'CSV',
  'Importação CSV Principal',
  'CONNECTED',
  '{"delimiter": ";", "encoding": "UTF-8", "hasHeader": true}',
  '{
    "customerName": "Nome do Cliente",
    "customerPhone": "Telefone",
    "customerEmail": "E-mail",
    "serviceName": "Servico",
    "professionalName": "Profissional",
    "appointmentDate": "Data",
    "appointmentTime": "Hora",
    "price": "Valor"
  }',
  NULL,
  NOW() - INTERVAL '2 hours',
  NOW() + INTERVAL '22 hours',
  1440,
  NOW() - INTERVAL '180 days',
  NOW() - INTERVAL '2 hours'
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 6. Services
-- =============================================================================

INSERT INTO public.services (id, tenant_id, external_id, name, category, avg_price, deleted_at, created_at)
VALUES
  ('svc-aurora-1',  'tenant-aurora-1', 'SVC001', 'Corte Feminino',          'Cabelo',       60.00,  NULL, NOW() - INTERVAL '180 days'),
  ('svc-aurora-2',  'tenant-aurora-1', 'SVC002', 'Coloração',               'Cabelo',       180.00, NULL, NOW() - INTERVAL '180 days'),
  ('svc-aurora-3',  'tenant-aurora-1', 'SVC003', 'Mechas',                  'Cabelo',       250.00, NULL, NOW() - INTERVAL '180 days'),
  ('svc-aurora-4',  'tenant-aurora-1', 'SVC004', 'Unhas',                   'Estética',     80.00,  NULL, NOW() - INTERVAL '180 days'),
  ('svc-aurora-5',  'tenant-aurora-1', 'SVC005', 'Design de Sobrancelhas',  'Estética',     50.00,  NULL, NOW() - INTERVAL '180 days'),
  ('svc-aurora-6',  'tenant-aurora-1', 'SVC006', 'Limpeza de Pele',         'Estética',     120.00, NULL, NOW() - INTERVAL '180 days'),
  ('svc-aurora-7',  'tenant-aurora-1', 'SVC007', 'Depilação',               'Estética',     90.00,  NULL, NOW() - INTERVAL '180 days'),
  ('svc-aurora-8',  'tenant-aurora-1', 'SVC008', 'Tratamento Capilar',      'Cabelo',       150.00, NULL, NOW() - INTERVAL '180 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 7. Professionals
-- =============================================================================

INSERT INTO public.professionals (id, tenant_id, external_id, name, email, phone, deleted_at, created_at)
VALUES
  ('prof-aurora-1', 'tenant-aurora-1', 'PRF001', 'Ana Costa',     'ana.costa@salaoaurora.com.br',     '+5511991110001', NULL, NOW() - INTERVAL '180 days'),
  ('prof-aurora-2', 'tenant-aurora-1', 'PRF002', 'Bianca Lima',   'bianca.lima@salaoaurora.com.br',   '+5511991110002', NULL, NOW() - INTERVAL '180 days'),
  ('prof-aurora-3', 'tenant-aurora-1', 'PRF003', 'Carlos Mendes', 'carlos.mendes@salaoaurora.com.br', '+5511991110003', NULL, NOW() - INTERVAL '180 days'),
  ('prof-aurora-4', 'tenant-aurora-1', 'PRF004', 'Daniela Souza', 'daniela.souza@salaoaurora.com.br', '+5511991110004', NULL, NOW() - INTERVAL '180 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 8. Message Templates
-- =============================================================================

INSERT INTO public.message_templates (id, tenant_id, name, body, variables, category, is_system, created_at, updated_at)
VALUES
  (
    'tmpl-system-post-visit',
    NULL,
    'Agradecimento Pós-Visita',
    'Olá {{nome}}, obrigada pela sua visita ao {{salao}} hoje! Foi um prazer atendê-la. Esperamos vê-la em breve! 💇‍♀️✨',
    ARRAY['nome', 'salao'],
    'pos_visita',
    TRUE,
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '180 days'
  ),
  (
    'tmpl-system-at-risk',
    NULL,
    'Recuperação de Cliente em Risco',
    'Oi {{nome}}! Já faz {{dias}} dias que não te vemos no {{salao}}. Sentimos sua falta! 🥺 Que tal agendar um horário? Temos novidades incríveis para você!',
    ARRAY['nome', 'dias', 'salao'],
    'reativacao',
    TRUE,
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '180 days'
  ),
  (
    'tmpl-system-lost',
    NULL,
    'Reativação de Cliente Perdido',
    'Olá {{nome}}! Há muito tempo não nos encontramos... 😢 No {{salao}}, temos uma oferta especial para sua volta: {{oferta}}. Que tal renovar o visual?',
    ARRAY['nome', 'salao', 'oferta'],
    'reativacao',
    TRUE,
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '180 days'
  ),
  (
    'tmpl-aurora-birthday',
    'tenant-aurora-1',
    'Feliz Aniversário',
    'Feliz Aniversário, {{nome}}! 🎂🎉 O Salão Aurora tem um presente especial para você: {{desconto}}% de desconto no seu próximo agendamento. Válido durante todo o mês do seu aniversário! 🎁',
    ARRAY['nome', 'desconto'],
    'aniversario',
    FALSE,
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '90 days'
  ),
  (
    'tmpl-aurora-appointment-reminder',
    'tenant-aurora-1',
    'Lembrete de Agendamento',
    'Oi {{nome}}! Lembrando que você tem um horário amanhã às {{horario}} no Salão Aurora com {{profissional}} para {{servico}}. Qualquer dúvida, fale conosco! 📅',
    ARRAY['nome', 'horario', 'profissional', 'servico'],
    'lembrete',
    FALSE,
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '90 days'
  ),
  (
    'tmpl-aurora-new-service',
    'tenant-aurora-1',
    'Divulgação de Novo Serviço',
    'Olá {{nome}}! Novidade no Salão Aurora! 🌟 Acabamos de lançar {{servico}} com condições especiais de lançamento. Agende já o seu horário e garanta o desconto de estreia!',
    ARRAY['nome', 'servico'],
    'marketing',
    FALSE,
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 9. System Segments
-- =============================================================================

INSERT INTO public.segments (
  id, tenant_id, name, description, type, rules_json,
  customer_count, last_computed_at, is_active, is_system, created_at, updated_at
)
VALUES
  (
    'seg-aurora-new',
    'tenant-aurora-1',
    'Clientes Novos',
    'Clientes que visitaram o salão pela primeira vez nos últimos 30 dias',
    'SYSTEM',
    '{"conditions": [{"field": "lifecycleStage", "operator": "eq", "value": "NEW"}]}',
    120, NOW(), TRUE, TRUE, NOW() - INTERVAL '180 days', NOW()
  ),
  (
    'seg-aurora-active',
    'tenant-aurora-1',
    'Clientes Ativos',
    'Clientes com visitas regulares nos últimos 60 dias',
    'SYSTEM',
    '{"conditions": [{"field": "lifecycleStage", "operator": "eq", "value": "ACTIVE"}]}',
    150, NOW(), TRUE, TRUE, NOW() - INTERVAL '180 days', NOW()
  ),
  (
    'seg-aurora-recurring',
    'tenant-aurora-1',
    'Clientes Recorrentes',
    'Clientes com 3+ visitas nos últimos 6 meses',
    'SYSTEM',
    '{"conditions": [{"field": "lifecycleStage", "operator": "eq", "value": "RECURRING"}]}',
    80, NOW(), TRUE, TRUE, NOW() - INTERVAL '180 days', NOW()
  ),
  (
    'seg-aurora-vip',
    'tenant-aurora-1',
    'Clientes VIP',
    'Clientes com alto ticket médio e frequência acima da média',
    'SYSTEM',
    '{"conditions": [{"field": "lifecycleStage", "operator": "eq", "value": "VIP"}]}',
    40, NOW(), TRUE, TRUE, NOW() - INTERVAL '180 days', NOW()
  ),
  (
    'seg-aurora-at-risk',
    'tenant-aurora-1',
    'Clientes em Risco',
    'Clientes sem visita há mais de 60 dias mas menos de 120 dias',
    'SYSTEM',
    '{"conditions": [{"field": "lifecycleStage", "operator": "eq", "value": "AT_RISK"}]}',
    60, NOW(), TRUE, TRUE, NOW() - INTERVAL '180 days', NOW()
  ),
  (
    'seg-aurora-lost',
    'tenant-aurora-1',
    'Clientes Perdidos',
    'Clientes sem visita há mais de 120 dias',
    'SYSTEM',
    '{"conditions": [{"field": "lifecycleStage", "operator": "eq", "value": "LOST"}]}',
    30, NOW(), TRUE, TRUE, NOW() - INTERVAL '180 days', NOW()
  ),
  (
    'seg-aurora-dormant',
    'tenant-aurora-1',
    'Clientes Inativos',
    'Clientes que visitaram apenas uma vez e não retornaram em 90+ dias',
    'SYSTEM',
    '{"conditions": [{"field": "lifecycleStage", "operator": "eq", "value": "DORMANT"}]}',
    20, NOW(), TRUE, TRUE, NOW() - INTERVAL '180 days', NOW()
  ),
  (
    'seg-aurora-high-ticket',
    'tenant-aurora-1',
    'Alto Ticket Médio',
    'Clientes com ticket médio acima de R$ 150',
    'CUSTOM',
    '{"conditions": [{"field": "avgTicket", "operator": "gt", "value": 150}]}',
    0, NULL, TRUE, FALSE, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'
  ),
  (
    'seg-aurora-birthday-month',
    'tenant-aurora-1',
    'Aniversariantes do Mês',
    'Clientes cujo aniversário é no mês atual',
    'CUSTOM',
    '{"conditions": [{"field": "birthdayMonth", "operator": "eq", "value": "current_month"}]}',
    0, NULL, TRUE, FALSE, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 10. Automation Flows
-- =============================================================================

INSERT INTO public.automation_flows (
  id, tenant_id, name, description, trigger_type, trigger_config,
  is_active, is_system, runs_count, created_at, updated_at
)
VALUES
  (
    'flow-aurora-post-visit',
    'tenant-aurora-1',
    'Agradecimento Pós-Visita',
    'Envia mensagem de agradecimento 2 horas após o término do atendimento',
    'AFTER_APPOINTMENT',
    '{"appointmentStatus": "COMPLETED", "delayHours": 2}',
    TRUE,
    FALSE,
    342,
    NOW() - INTERVAL '150 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    'flow-aurora-at-risk',
    'tenant-aurora-1',
    'Recuperação de Cliente em Risco',
    'Ativa quando cliente entra no segmento de risco e envia mensagem personalizada',
    'SEGMENT_ENTER',
    '{"segmentId": "seg-aurora-at-risk", "waitDays": 0}',
    TRUE,
    FALSE,
    87,
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    'flow-aurora-lost-reactivation',
    'tenant-aurora-1',
    'Reativação de Cliente Perdido',
    'Sequência de 3 mensagens para tentar reativar clientes perdidos ao longo de 30 dias',
    'SEGMENT_ENTER',
    '{"segmentId": "seg-aurora-lost", "waitDays": 0}',
    TRUE,
    FALSE,
    43,
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '3 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 10b. Automation Flow Steps
-- =============================================================================

-- Post-Visit Flow Steps
INSERT INTO public.automation_flow_steps (id, flow_id, step_order, type, config, created_at)
VALUES
  (
    'step-post-visit-1',
    'flow-aurora-post-visit',
    1,
    'DELAY',
    '{"hours": 2}',
    NOW() - INTERVAL '150 days'
  ),
  (
    'step-post-visit-2',
    'flow-aurora-post-visit',
    2,
    'SEND_MESSAGE',
    '{"templateId": "tmpl-system-post-visit", "channel": "WHATSAPP", "variables": {"salao": "Salão Aurora"}}',
    NOW() - INTERVAL '150 days'
  ),
  (
    'step-post-visit-3',
    'flow-aurora-post-visit',
    3,
    'UPDATE_CUSTOMER',
    '{"field": "lifecycleStage", "value": "ACTIVE"}',
    NOW() - INTERVAL '150 days'
  )
ON CONFLICT (id) DO NOTHING;

-- At-Risk Recovery Flow Steps
INSERT INTO public.automation_flow_steps (id, flow_id, step_order, type, config, created_at)
VALUES
  (
    'step-at-risk-1',
    'flow-aurora-at-risk',
    1,
    'SEND_MESSAGE',
    '{"templateId": "tmpl-system-at-risk", "channel": "WHATSAPP", "variables": {"salao": "Salão Aurora"}}',
    NOW() - INTERVAL '120 days'
  ),
  (
    'step-at-risk-2',
    'flow-aurora-at-risk',
    2,
    'DELAY',
    '{"days": 7}',
    NOW() - INTERVAL '120 days'
  ),
  (
    'step-at-risk-3',
    'flow-aurora-at-risk',
    3,
    'CONDITION',
    '{"field": "lastVisitAt", "operator": "within_days", "value": 7, "onTrue": "end", "onFalse": "continue"}',
    NOW() - INTERVAL '120 days'
  ),
  (
    'step-at-risk-4',
    'flow-aurora-at-risk',
    4,
    'SEND_MESSAGE',
    '{"templateId": "tmpl-aurora-new-service", "channel": "WHATSAPP", "variables": {"salao": "Salão Aurora", "servico": "nossos tratamentos capilares"}}',
    NOW() - INTERVAL '120 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Lost Reactivation Flow Steps
INSERT INTO public.automation_flow_steps (id, flow_id, step_order, type, config, created_at)
VALUES
  (
    'step-lost-1',
    'flow-aurora-lost-reactivation',
    1,
    'SEND_MESSAGE',
    '{"templateId": "tmpl-system-lost", "channel": "WHATSAPP", "variables": {"salao": "Salão Aurora", "oferta": "20% de desconto"}}',
    NOW() - INTERVAL '90 days'
  ),
  (
    'step-lost-2',
    'flow-aurora-lost-reactivation',
    2,
    'DELAY',
    '{"days": 14}',
    NOW() - INTERVAL '90 days'
  ),
  (
    'step-lost-3',
    'flow-aurora-lost-reactivation',
    3,
    'CONDITION',
    '{"field": "lastVisitAt", "operator": "within_days", "value": 14, "onTrue": "end", "onFalse": "continue"}',
    NOW() - INTERVAL '90 days'
  ),
  (
    'step-lost-4',
    'flow-aurora-lost-reactivation',
    4,
    'SEND_MESSAGE',
    '{"templateId": "tmpl-system-at-risk", "channel": "WHATSAPP", "variables": {"salao": "Salão Aurora", "dias": "120"}}',
    NOW() - INTERVAL '90 days'
  ),
  (
    'step-lost-5',
    'flow-aurora-lost-reactivation',
    5,
    'DELAY',
    '{"days": 16}',
    NOW() - INTERVAL '90 days'
  ),
  (
    'step-lost-6',
    'flow-aurora-lost-reactivation',
    6,
    'UPDATE_CUSTOMER',
    '{"field": "riskLevel", "value": "LOST"}',
    NOW() - INTERVAL '90 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 11. Customers (500 total)
-- Distribution:
--   NEW        = 120  (indices 1-120)
--   ACTIVE     = 150  (indices 121-270)
--   RECURRING  = 80   (indices 271-350)
--   VIP        = 40   (indices 351-390)
--   AT_RISK    = 60   (indices 391-450)
--   LOST       = 30   (indices 451-480)
--   DORMANT    = 20   (indices 481-500)
-- =============================================================================

-- Helper to build normalized name (simple lowercase, accent removal handled at app level)
-- We store normalized_name as lowercase for basic matching

-- Brazilian first names (female and male)
-- We'll use a DO block with a loop to generate 500 customers

DO $$
DECLARE
  v_first_names_f TEXT[] := ARRAY[
    'Ana','Maria','Juliana','Fernanda','Camila','Beatriz','Larissa','Gabriela',
    'Patricia','Mariana','Amanda','Thais','Carolina','Leticia','Renata',
    'Vanessa','Isabela','Aline','Priscila','Viviane','Sandra','Luciana',
    'Cristina','Claudia','Debora','Simone','Carla','Andrea','Elaine','Fabiana',
    'Giovanna','Helena','Ingrid','Jessica','Karina','Livia','Melissa','Natalia',
    'Olga','Paula','Rafaela','Sabrina','Tatiana','Ursula','Valentina','Wanda',
    'Xuxa','Yasmin','Zelia','Adriana','Bruna','Cintia','Diana','Eduarda'
  ];
  v_first_names_m TEXT[] := ARRAY[
    'Carlos','Pedro','Lucas','Rafael','Bruno','Gustavo','Felipe','Rodrigo',
    'Thiago','Eduardo','Andre','Marcos','Leandro','Fabio','Renato',
    'Diego','Vinicius','Leonardo','Gabriel','Daniel','Paulo','Roberto',
    'Sergio','Marcelo','Jorge','Ricardo','Fernando','Alexandre','Henrique','Julio'
  ];
  v_last_names TEXT[] := ARRAY[
    'Silva','Santos','Oliveira','Souza','Lima','Costa','Ferreira','Almeida',
    'Rodrigues','Nascimento','Pereira','Carvalho','Araujo','Gomes','Martins',
    'Rocha','Ribeiro','Alves','Monteiro','Moraes','Nunes','Cardoso','Freitas',
    'Castro','Barbosa','Pinto','Moreira','Cavalcanti','Fernandes','Vieira',
    'Correia','Cruz','Lopes','Azevedo','Andrade','Teixeira','Borges','Cunha',
    'Machado','Mendes','Ramos','Fonseca','Campos','Dias','Tavares','Duarte',
    'Pinheiro','Vasconcelos','Figueiredo','Batista'
  ];
  v_ddd TEXT[] := ARRAY['11','21','31','41','51','61','71','81','85','92'];
  v_services TEXT[] := ARRAY[
    'svc-aurora-1','svc-aurora-2','svc-aurora-3','svc-aurora-4',
    'svc-aurora-5','svc-aurora-6','svc-aurora-7','svc-aurora-8'
  ];
  v_professionals TEXT[] := ARRAY[
    'prof-aurora-1','prof-aurora-2','prof-aurora-3','prof-aurora-4'
  ];
  v_prices FLOAT[] := ARRAY[60.0, 180.0, 250.0, 80.0, 50.0, 120.0, 90.0, 150.0];

  i INT;
  v_id TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
  v_normalized TEXT;
  v_phone TEXT;
  v_ddd_val TEXT;
  v_phone_num TEXT;
  v_lifecycle TEXT;
  v_risk TEXT;
  v_birthdate DATE;
  v_email TEXT;
  v_preferred_service TEXT;
  v_preferred_prof TEXT;
  v_created_at TIMESTAMPTZ;
  v_tags TEXT[];
  v_gender_roll INT;

  -- appointment variables
  v_appt_count INT;
  j INT;
  v_appt_id TEXT;
  v_svc_idx INT;
  v_prof_idx INT;
  v_scheduled_at TIMESTAMPTZ;
  v_completed_at TIMESTAMPTZ;
  v_price FLOAT;
  v_appt_status TEXT;
  v_days_back INT;
  v_last_visit TIMESTAMPTZ;
  v_first_visit TIMESTAMPTZ;
  v_total_spent FLOAT;
  v_avg_ticket FLOAT;
  v_total_appts INT;
  v_days_since INT;
  v_avg_days FLOAT;
  v_predicted_return TIMESTAMPTZ;
  v_ltv FLOAT;
  v_repeat_rate FLOAT;
  v_rfm FLOAT;

BEGIN
  FOR i IN 1..500 LOOP
    v_id := 'cust-aurora-' || LPAD(i::TEXT, 4, '0');

    -- Pick gender-based name
    v_gender_roll := (i % 5);  -- 0-3 female, 4 male (80/20 split for beauty salon)
    IF v_gender_roll < 4 THEN
      v_first_name := v_first_names_f[1 + ((i * 7 + 3) % array_length(v_first_names_f, 1))];
    ELSE
      v_first_name := v_first_names_m[1 + ((i * 11 + 5) % array_length(v_first_names_m, 1))];
    END IF;
    v_last_name := v_last_names[1 + ((i * 13 + 7) % array_length(v_last_names, 1))];
    v_full_name := v_first_name || ' ' || v_last_name;
    v_normalized := LOWER(v_first_name || ' ' || v_last_name);

    -- Phone number
    v_ddd_val := v_ddd[1 + (i % array_length(v_ddd, 1))];
    v_phone_num := LPAD(((i * 97 + 10000000) % 90000000 + 10000000)::TEXT, 8, '0');
    v_phone := '+55' || v_ddd_val || '9' || v_phone_num;

    -- Email (some customers don't have email)
    IF i % 3 = 0 THEN
      v_email := LOWER(v_first_name || '.' || v_last_name || i::TEXT || '@email.com');
    ELSE
      v_email := NULL;
    END IF;

    -- Birthdate (ages 18-65)
    v_birthdate := CURRENT_DATE - ((18 * 365) + (i * 179 % (47 * 365))) * INTERVAL '1 day';

    -- Preferred service and professional
    v_preferred_service := v_services[1 + (i % array_length(v_services, 1))];
    v_preferred_prof := v_professionals[1 + (i % array_length(v_professionals, 1))];

    -- Lifecycle stage based on range
    IF i <= 120 THEN
      v_lifecycle := 'NEW';
      v_risk := 'LOW';
      v_tags := ARRAY['nova-cliente'];
      v_created_at := NOW() - ((i % 30) * INTERVAL '1 day');
    ELSIF i <= 270 THEN
      v_lifecycle := 'ACTIVE';
      v_risk := 'LOW';
      v_tags := ARRAY['ativa'];
      v_created_at := NOW() - ((30 + (i % 90)) * INTERVAL '1 day');
    ELSIF i <= 350 THEN
      v_lifecycle := 'RECURRING';
      v_risk := 'LOW';
      v_tags := ARRAY['recorrente', 'fidelizada'];
      v_created_at := NOW() - ((60 + (i % 150)) * INTERVAL '1 day');
    ELSIF i <= 390 THEN
      v_lifecycle := 'VIP';
      v_risk := 'LOW';
      v_tags := ARRAY['vip', 'fidelizada', 'alto-ticket'];
      v_created_at := NOW() - ((90 + (i % 180)) * INTERVAL '1 day');
    ELSIF i <= 450 THEN
      v_lifecycle := 'AT_RISK';
      v_risk := 'MEDIUM';
      v_tags := ARRAY['em-risco'];
      v_created_at := NOW() - ((120 + (i % 180)) * INTERVAL '1 day');
    ELSIF i <= 480 THEN
      v_lifecycle := 'LOST';
      v_risk := 'HIGH';
      v_tags := ARRAY['perdida', 'reativar'];
      v_created_at := NOW() - ((180 + (i % 180)) * INTERVAL '1 day');
    ELSE
      v_lifecycle := 'DORMANT';
      v_risk := 'MEDIUM';
      v_tags := ARRAY['inativa'];
      v_created_at := NOW() - ((365 + (i % 365)) * INTERVAL '1 day');
    END IF;

    -- Insert customer
    INSERT INTO public.customers (
      id, tenant_id, external_id, full_name, normalized_name, phone_e164,
      whatsapp_opt_in, email, birthdate, preferred_service_id, preferred_staff_id,
      lifecycle_stage, risk_level, notes, tags, deleted_at, created_at, updated_at
    ) VALUES (
      v_id,
      'tenant-aurora-1',
      'EXT-' || LPAD(i::TEXT, 6, '0'),
      v_full_name,
      v_normalized,
      v_phone,
      CASE WHEN i % 15 = 0 THEN FALSE ELSE TRUE END,
      v_email,
      v_birthdate,
      v_preferred_service,
      v_preferred_prof,
      v_lifecycle::public."LifecycleStage",
      v_risk::public."RiskLevel",
      NULL,
      v_tags,
      NULL,
      v_created_at,
      NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- ----- Generate Appointments -----
    -- Appointment count based on lifecycle
    IF v_lifecycle = 'NEW' THEN
      v_appt_count := 1 + (i % 2);
    ELSIF v_lifecycle = 'ACTIVE' THEN
      v_appt_count := 2 + (i % 4);
    ELSIF v_lifecycle = 'RECURRING' THEN
      v_appt_count := 5 + (i % 6);
    ELSIF v_lifecycle = 'VIP' THEN
      v_appt_count := 10 + (i % 6);
    ELSIF v_lifecycle = 'AT_RISK' THEN
      v_appt_count := 3 + (i % 4);
    ELSIF v_lifecycle = 'LOST' THEN
      v_appt_count := 2 + (i % 3);
    ELSE -- DORMANT
      v_appt_count := 1;
    END IF;

    v_total_spent := 0;
    v_total_appts := 0;
    v_first_visit := NULL;
    v_last_visit := NULL;

    FOR j IN 1..v_appt_count LOOP
      v_appt_id := 'appt-aurora-' || LPAD(i::TEXT, 4, '0') || '-' || LPAD(j::TEXT, 2, '0');
      v_svc_idx := 1 + ((i + j * 3) % 8);
      v_prof_idx := 1 + ((i + j * 5) % 4);
      v_price := v_prices[v_svc_idx];

      -- Calculate appointment date based on lifecycle
      IF v_lifecycle = 'NEW' THEN
        v_days_back := (j * 5) + (i % 10);  -- 0-30 days ago
      ELSIF v_lifecycle = 'ACTIVE' THEN
        v_days_back := (j * 12) + (i % 15);  -- 0-60 days ago
      ELSIF v_lifecycle = 'RECURRING' THEN
        v_days_back := (j * 18) + (i % 20);  -- spread over ~6 months
      ELSIF v_lifecycle = 'VIP' THEN
        v_days_back := (j * 15) + (i % 10);  -- frequent visits
      ELSIF v_lifecycle = 'AT_RISK' THEN
        v_days_back := 60 + (j * 25) + (i % 30);  -- last visit 60+ days ago
      ELSIF v_lifecycle = 'LOST' THEN
        v_days_back := 150 + (j * 45) + (i % 60);  -- last visit 150+ days ago
      ELSE -- DORMANT
        v_days_back := 300 + (i % 60);  -- very old
      END IF;

      v_scheduled_at := NOW() - (v_days_back * INTERVAL '1 day') + ((i % 8) * INTERVAL '1 hour');
      v_completed_at := v_scheduled_at + INTERVAL '1 hour';
      v_appt_status := 'COMPLETED';

      -- Some appointments are future (scheduled) for active clients
      IF v_lifecycle IN ('NEW', 'ACTIVE', 'RECURRING', 'VIP') AND j = 1 THEN
        IF i % 8 = 0 THEN
          v_scheduled_at := NOW() + ((1 + i % 14) * INTERVAL '1 day');
          v_completed_at := NULL;
          v_appt_status := 'SCHEDULED';
        END IF;
      END IF;

      -- Some no-shows
      IF i % 20 = 0 AND j = v_appt_count THEN
        v_appt_status := 'NO_SHOW';
        v_completed_at := NULL;
        v_price := NULL;
      END IF;

      INSERT INTO public.appointments (
        id, tenant_id, customer_id, professional_id, service_id, connector_id,
        external_id, scheduled_at, completed_at, status, price, notes, branch_name,
        created_at, updated_at
      ) VALUES (
        v_appt_id,
        'tenant-aurora-1',
        v_id,
        'prof-aurora-' || v_prof_idx,
        'svc-aurora-' || v_svc_idx,
        'connector-aurora-csv-1',
        'APPT-EXT-' || LPAD(i::TEXT, 4, '0') || '-' || LPAD(j::TEXT, 2, '0'),
        v_scheduled_at,
        v_completed_at,
        v_appt_status::public."AppointmentStatus",
        v_price,
        NULL,
        'Unidade Centro',
        v_created_at,
        NOW()
      ) ON CONFLICT (tenant_id, external_id) DO NOTHING;

      -- Track metrics
      IF v_appt_status = 'COMPLETED' AND v_price IS NOT NULL THEN
        v_total_spent := v_total_spent + v_price;
        v_total_appts := v_total_appts + 1;
        IF v_first_visit IS NULL OR v_scheduled_at < v_first_visit THEN
          v_first_visit := v_scheduled_at;
        END IF;
        IF v_last_visit IS NULL OR v_scheduled_at > v_last_visit THEN
          v_last_visit := v_scheduled_at;
        END IF;
      END IF;
    END LOOP;

    -- ----- Insert CustomerMetrics -----
    IF v_total_appts > 0 THEN
      v_avg_ticket := v_total_spent / v_total_appts;
    ELSE
      v_avg_ticket := 0;
    END IF;

    IF v_last_visit IS NOT NULL THEN
      v_days_since := EXTRACT(DAY FROM NOW() - v_last_visit)::INT;
    ELSE
      v_days_since := NULL;
    END IF;

    IF v_total_appts > 1 AND v_first_visit IS NOT NULL AND v_last_visit IS NOT NULL THEN
      v_avg_days := EXTRACT(DAY FROM v_last_visit - v_first_visit)::FLOAT / (v_total_appts - 1);
      v_predicted_return := v_last_visit + (v_avg_days * INTERVAL '1 day');
    ELSE
      v_avg_days := NULL;
      v_predicted_return := NULL;
    END IF;

    v_ltv := v_total_spent * 1.2;  -- simplified LTV calculation
    v_repeat_rate := CASE WHEN v_total_appts > 1 THEN LEAST(1.0, v_total_appts::FLOAT / 12.0) ELSE 0 END;

    -- RFM score (simplified: recency 0-10 + frequency 0-10 + monetary 0-10 = 0-30)
    DECLARE
      v_rfm_r FLOAT;
      v_rfm_f FLOAT;
      v_rfm_m FLOAT;
    BEGIN
      v_rfm_r := CASE
        WHEN v_days_since IS NULL THEN 5
        WHEN v_days_since <= 30 THEN 10
        WHEN v_days_since <= 60 THEN 7
        WHEN v_days_since <= 90 THEN 5
        WHEN v_days_since <= 180 THEN 3
        ELSE 1
      END;
      v_rfm_f := LEAST(10, v_total_appts::FLOAT);
      v_rfm_m := CASE
        WHEN v_avg_ticket >= 200 THEN 10
        WHEN v_avg_ticket >= 150 THEN 8
        WHEN v_avg_ticket >= 100 THEN 6
        WHEN v_avg_ticket >= 60 THEN 4
        ELSE 2
      END;
      v_rfm := (v_rfm_r + v_rfm_f + v_rfm_m) / 3.0;
    END;

    INSERT INTO public.customer_metrics (
      id, customer_id, tenant_id, total_appointments, total_spent, avg_ticket,
      first_visit_at, last_visit_at, avg_days_between_visits, predicted_return_date,
      days_since_last_visit, ltv, repeat_visit_rate, rfm_score, recomputed_at
    ) VALUES (
      'cm-aurora-' || LPAD(i::TEXT, 4, '0'),
      v_id,
      'tenant-aurora-1',
      v_total_appts,
      v_total_spent,
      v_avg_ticket,
      v_first_visit,
      v_last_visit,
      v_avg_days,
      v_predicted_return,
      v_days_since,
      v_ltv,
      v_repeat_rate,
      v_rfm,
      NOW()
    ) ON CONFLICT (customer_id) DO NOTHING;

  END LOOP;
END $$;

-- =============================================================================
-- 12. Segment Memberships (link customers to their lifecycle segments)
-- =============================================================================

-- NEW customers -> seg-aurora-new
INSERT INTO public.segment_memberships (segment_id, customer_id, tenant_id, added_at)
SELECT
  'seg-aurora-new',
  c.id,
  'tenant-aurora-1',
  NOW()
FROM public.customers c
WHERE c.tenant_id = 'tenant-aurora-1'
  AND c.lifecycle_stage = 'NEW'
ON CONFLICT (segment_id, customer_id) DO NOTHING;

-- ACTIVE customers -> seg-aurora-active
INSERT INTO public.segment_memberships (segment_id, customer_id, tenant_id, added_at)
SELECT
  'seg-aurora-active',
  c.id,
  'tenant-aurora-1',
  NOW()
FROM public.customers c
WHERE c.tenant_id = 'tenant-aurora-1'
  AND c.lifecycle_stage = 'ACTIVE'
ON CONFLICT (segment_id, customer_id) DO NOTHING;

-- RECURRING customers -> seg-aurora-recurring
INSERT INTO public.segment_memberships (segment_id, customer_id, tenant_id, added_at)
SELECT
  'seg-aurora-recurring',
  c.id,
  'tenant-aurora-1',
  NOW()
FROM public.customers c
WHERE c.tenant_id = 'tenant-aurora-1'
  AND c.lifecycle_stage = 'RECURRING'
ON CONFLICT (segment_id, customer_id) DO NOTHING;

-- VIP customers -> seg-aurora-vip
INSERT INTO public.segment_memberships (segment_id, customer_id, tenant_id, added_at)
SELECT
  'seg-aurora-vip',
  c.id,
  'tenant-aurora-1',
  NOW()
FROM public.customers c
WHERE c.tenant_id = 'tenant-aurora-1'
  AND c.lifecycle_stage = 'VIP'
ON CONFLICT (segment_id, customer_id) DO NOTHING;

-- AT_RISK customers -> seg-aurora-at-risk
INSERT INTO public.segment_memberships (segment_id, customer_id, tenant_id, added_at)
SELECT
  'seg-aurora-at-risk',
  c.id,
  'tenant-aurora-1',
  NOW()
FROM public.customers c
WHERE c.tenant_id = 'tenant-aurora-1'
  AND c.lifecycle_stage = 'AT_RISK'
ON CONFLICT (segment_id, customer_id) DO NOTHING;

-- LOST customers -> seg-aurora-lost
INSERT INTO public.segment_memberships (segment_id, customer_id, tenant_id, added_at)
SELECT
  'seg-aurora-lost',
  c.id,
  'tenant-aurora-1',
  NOW()
FROM public.customers c
WHERE c.tenant_id = 'tenant-aurora-1'
  AND c.lifecycle_stage = 'LOST'
ON CONFLICT (segment_id, customer_id) DO NOTHING;

-- DORMANT customers -> seg-aurora-dormant
INSERT INTO public.segment_memberships (segment_id, customer_id, tenant_id, added_at)
SELECT
  'seg-aurora-dormant',
  c.id,
  'tenant-aurora-1',
  NOW()
FROM public.customers c
WHERE c.tenant_id = 'tenant-aurora-1'
  AND c.lifecycle_stage = 'DORMANT'
ON CONFLICT (segment_id, customer_id) DO NOTHING;

-- High ticket -> seg-aurora-high-ticket (avg ticket > 150)
INSERT INTO public.segment_memberships (segment_id, customer_id, tenant_id, added_at)
SELECT
  'seg-aurora-high-ticket',
  cm.customer_id,
  'tenant-aurora-1',
  NOW()
FROM public.customer_metrics cm
WHERE cm.tenant_id = 'tenant-aurora-1'
  AND cm.avg_ticket > 150
ON CONFLICT (segment_id, customer_id) DO NOTHING;

-- Update segment counts
UPDATE public.segments s
SET
  customer_count = (
    SELECT COUNT(*) FROM public.segment_memberships sm
    WHERE sm.segment_id = s.id
  ),
  last_computed_at = NOW()
WHERE s.tenant_id = 'tenant-aurora-1';

-- =============================================================================
-- 13. Campaigns
-- =============================================================================

INSERT INTO public.campaigns (
  id, tenant_id, name, segment_id, template_id, status,
  scheduled_at, started_at, completed_at,
  sent_count, delivered_count, read_count,
  created_at, updated_at
)
VALUES
  (
    'camp-aurora-1',
    'tenant-aurora-1',
    'Reativação At-Risk - Março 2026',
    'seg-aurora-at-risk',
    'tmpl-system-at-risk',
    'COMPLETED',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days' + INTERVAL '2 hours',
    52, 48, 21,
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '20 days'
  ),
  (
    'camp-aurora-2',
    'tenant-aurora-1',
    'Aniversariantes de Março',
    'seg-aurora-birthday-month',
    'tmpl-aurora-birthday',
    'COMPLETED',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days' + INTERVAL '1 hour',
    38, 36, 19,
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '15 days'
  ),
  (
    'camp-aurora-3',
    'tenant-aurora-1',
    'Recuperação Clientes Perdidos Q1',
    'seg-aurora-lost',
    'tmpl-system-lost',
    'RUNNING',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days',
    NULL,
    28, 25, 8,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    'camp-aurora-4',
    'tenant-aurora-1',
    'Lançamento Novo Serviço - Tratamento Capilar Premium',
    'seg-aurora-vip',
    'tmpl-aurora-new-service',
    'DRAFT',
    NOW() + INTERVAL '7 days',
    NULL,
    NULL,
    0, 0, 0,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 14. Sample Outbound Messages (50 messages)
-- =============================================================================

DO $$
DECLARE
  v_customer_ids TEXT[];
  v_cust_id TEXT;
  v_cust_phone TEXT;
  i INT;
  v_msg_id TEXT;
  v_status TEXT;
  v_statuses TEXT[] := ARRAY['SENT','DELIVERED','DELIVERED','READ','READ','READ','FAILED','PENDING'];
  v_sent_at TIMESTAMPTZ;
  v_delivered_at TIMESTAMPTZ;
  v_read_at TIMESTAMPTZ;
  v_template TEXT;
  v_campaign TEXT;
  v_body TEXT;
BEGIN
  -- Get first 50 customer IDs for sample messages
  SELECT ARRAY_AGG(id ORDER BY id)
  INTO v_customer_ids
  FROM (
    SELECT id FROM public.customers
    WHERE tenant_id = 'tenant-aurora-1'
    ORDER BY id
    LIMIT 50
  ) sub;

  FOR i IN 1..50 LOOP
    v_cust_id := v_customer_ids[i];

    SELECT phone_e164 INTO v_cust_phone
    FROM public.customers WHERE id = v_cust_id;

    v_msg_id := 'msg-aurora-' || LPAD(i::TEXT, 4, '0');
    v_status := v_statuses[1 + (i % array_length(v_statuses, 1))];
    v_sent_at := NOW() - ((50 - i) * INTERVAL '1 hour') - (i % 5 * INTERVAL '1 day');

    IF v_status IN ('DELIVERED', 'READ') THEN
      v_delivered_at := v_sent_at + INTERVAL '5 minutes';
    ELSE
      v_delivered_at := NULL;
    END IF;

    IF v_status = 'READ' THEN
      v_read_at := v_delivered_at + INTERVAL '30 minutes';
    ELSE
      v_read_at := NULL;
    END IF;

    -- Alternate between campaigns and flows
    IF i <= 20 THEN
      v_campaign := 'camp-aurora-1';
      v_template := 'tmpl-system-at-risk';
      v_body := 'Oi ' || (SELECT full_name FROM public.customers WHERE id = v_cust_id) || '! Já faz algum tempo que não te vemos no Salão Aurora. Sentimos sua falta! Que tal agendar um horário?';
    ELSIF i <= 35 THEN
      v_campaign := 'camp-aurora-2';
      v_template := 'tmpl-aurora-birthday';
      v_body := 'Feliz Aniversário, ' || (SELECT full_name FROM public.customers WHERE id = v_cust_id) || '! O Salão Aurora tem um presente especial para você: 15% de desconto no seu próximo agendamento!';
    ELSE
      v_campaign := 'camp-aurora-3';
      v_template := 'tmpl-system-lost';
      v_body := 'Olá ' || (SELECT full_name FROM public.customers WHERE id = v_cust_id) || '! Há muito tempo não nos encontramos. No Salão Aurora, temos uma oferta especial para sua volta: 20% de desconto.';
    END IF;

    INSERT INTO public.outbound_messages (
      id, tenant_id, customer_id, template_id, campaign_id, flow_id,
      channel, to_number, body_rendered, status,
      provider_message_id, scheduled_at, sent_at, delivered_at, read_at,
      error, retry_count, created_at, updated_at
    ) VALUES (
      v_msg_id,
      'tenant-aurora-1',
      v_cust_id,
      v_template,
      v_campaign,
      NULL,
      'WHATSAPP',
      v_cust_phone,
      v_body,
      v_status::public."MessageStatus",
      CASE WHEN v_status IN ('SENT','DELIVERED','READ') THEN 'wamid.' || LPAD(i::TEXT, 20, '0') ELSE NULL END,
      v_sent_at - INTERVAL '10 minutes',
      CASE WHEN v_status IN ('SENT','DELIVERED','READ') THEN v_sent_at ELSE NULL END,
      v_delivered_at,
      v_read_at,
      CASE WHEN v_status = 'FAILED' THEN 'Provider error: number not on WhatsApp' ELSE NULL END,
      CASE WHEN v_status = 'FAILED' THEN 1 ELSE 0 END,
      v_sent_at - INTERVAL '10 minutes',
      COALESCE(v_read_at, v_delivered_at, v_sent_at, NOW())
    ) ON CONFLICT (id) DO NOTHING;

  END LOOP;
END $$;

-- =============================================================================
-- 15. Connector Sync Run (historical record)
-- =============================================================================

INSERT INTO public.connector_sync_runs (
  id, connector_id, tenant_id, status,
  customers_created, customers_updated,
  appointments_created, appointments_updated,
  services_created, errors,
  started_at, finished_at
)
VALUES
  (
    'sync-aurora-1',
    'connector-aurora-csv-1',
    'tenant-aurora-1',
    'COMPLETED',
    500, 0, 0, 0, 8,
    '[]',
    NOW() - INTERVAL '180 days',
    NOW() - INTERVAL '180 days' + INTERVAL '3 minutes'
  ),
  (
    'sync-aurora-2',
    'connector-aurora-csv-1',
    'tenant-aurora-1',
    'COMPLETED',
    0, 12, 45, 8, 0,
    '[]',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '90 days' + INTERVAL '1 minute'
  ),
  (
    'sync-aurora-3',
    'connector-aurora-csv-1',
    'tenant-aurora-1',
    'COMPLETED',
    0, 5, 28, 3, 0,
    '[]',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours' + INTERVAL '45 seconds'
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 16. Usage Counters
-- =============================================================================

INSERT INTO public.usage_counters (id, tenant_id, metric, value, period_year, period_month, updated_at)
VALUES
  ('uc-aurora-msg-2026-1',  'tenant-aurora-1', 'messages_sent',    127, 2026, 1, NOW()),
  ('uc-aurora-msg-2026-2',  'tenant-aurora-1', 'messages_sent',    98,  2026, 2, NOW()),
  ('uc-aurora-msg-2026-3',  'tenant-aurora-1', 'messages_sent',    50,  2026, 3, NOW()),
  ('uc-aurora-cust-2026-1', 'tenant-aurora-1', 'customers_total',  462, 2026, 1, NOW()),
  ('uc-aurora-cust-2026-2', 'tenant-aurora-1', 'customers_total',  487, 2026, 2, NOW()),
  ('uc-aurora-cust-2026-3', 'tenant-aurora-1', 'customers_total',  500, 2026, 3, NOW()),
  ('uc-aurora-sync-2026-1', 'tenant-aurora-1', 'syncs_run',        31,  2026, 1, NOW()),
  ('uc-aurora-sync-2026-2', 'tenant-aurora-1', 'syncs_run',        28,  2026, 2, NOW()),
  ('uc-aurora-sync-2026-3', 'tenant-aurora-1', 'syncs_run',        3,   2026, 3, NOW())
ON CONFLICT (tenant_id, metric, period_year, period_month) DO NOTHING;

-- =============================================================================
-- 17. Feature Flags (platform defaults)
-- =============================================================================

INSERT INTO public.feature_flags (id, name, enabled, tenant_ids, created_at, updated_at)
VALUES
  ('ff-whatsapp-integration', 'whatsapp_integration',    TRUE,  ARRAY[]::TEXT[], NOW(), NOW()),
  ('ff-ai-insights',          'ai_insights',             FALSE, ARRAY['tenant-aurora-1'], NOW(), NOW()),
  ('ff-multi-branch',         'multi_branch',            FALSE, ARRAY[]::TEXT[], NOW(), NOW()),
  ('ff-trinks-connector',     'trinks_connector',        TRUE,  ARRAY[]::TEXT[], NOW(), NOW()),
  ('ff-birthday-automation',  'birthday_automation',     TRUE,  ARRAY[]::TEXT[], NOW(), NOW()),
  ('ff-advanced-segments',    'advanced_segments',       TRUE,  ARRAY['tenant-aurora-1'], NOW(), NOW()),
  ('ff-export-csv',           'export_csv',              TRUE,  ARRAY[]::TEXT[], NOW(), NOW()),
  ('ff-webhook-connector',    'webhook_connector',       TRUE,  ARRAY[]::TEXT[], NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 18. Audit Log entries
-- =============================================================================

INSERT INTO public.audit_logs (
  id, tenant_id, user_id, action, resource_type, resource_id,
  diff, ip_address, user_agent, created_at
)
VALUES
  (
    'al-aurora-1', 'tenant-aurora-1', 'demo-user-1',
    'tenant.created', 'tenant', 'tenant-aurora-1',
    '{"name": "Salão Aurora", "plan": "GROWTH"}',
    '177.75.10.42', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    NOW() - INTERVAL '180 days'
  ),
  (
    'al-aurora-2', 'tenant-aurora-1', 'demo-user-1',
    'connector.created', 'booking_connector', 'connector-aurora-csv-1',
    '{"type": "CSV", "name": "Importação CSV Principal"}',
    '177.75.10.42', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    NOW() - INTERVAL '179 days'
  ),
  (
    'al-aurora-3', 'tenant-aurora-1', 'demo-user-1',
    'connector.sync_completed', 'booking_connector', 'connector-aurora-csv-1',
    '{"customersCreated": 500, "servicesCreated": 8}',
    '177.75.10.42', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    NOW() - INTERVAL '180 days' + INTERVAL '3 minutes'
  ),
  (
    'al-aurora-4', 'tenant-aurora-1', 'demo-user-1',
    'campaign.sent', 'campaign', 'camp-aurora-1',
    '{"name": "Reativação At-Risk - Março 2026", "sentCount": 52}',
    '177.75.10.42', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    NOW() - INTERVAL '20 days'
  ),
  (
    'al-aurora-5', 'tenant-aurora-1', 'demo-user-1',
    'automation_flow.activated', 'automation_flow', 'flow-aurora-post-visit',
    '{"name": "Agradecimento Pós-Visita", "isActive": true}',
    '177.75.10.42', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    NOW() - INTERVAL '150 days'
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- =============================================================================
-- End of seed file
-- =============================================================================
