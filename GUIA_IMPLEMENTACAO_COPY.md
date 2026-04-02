# GUIA DE IMPLEMENTAÇÃO - COPY DE VENDAS RETOQUEI
## Roadmap prático para usar todos os materiais

---

## RESUMO EXECUTIVO

Você tem 3 documentos pronto para usar:

1. **COPY_VENDAS.md** — O copy completo: headline, problema, solução, benefícios, preços, garantia, objections
2. **COPY_VARIAÇÕES.md** — Variações para diferentes públicos, canais e estágios do funil
3. **LANDING_PAGE_COPY.md** — Estrutura de landing page pronta para implementar

**Objetivo:** Converter 15-25% dos visitantes em trials, e 20-40% dos trials em clientes pagantes.

---

## FASE 1: VALIDAÇÃO RÁPIDA (Semana 1)

Antes de investir em implementação, teste as mensagens com públicos pequenos.

### Ação 1.1: Teste de Copy em WhatsApp
**Tempo:** 30 min
**Público:** 20-30 donos de salão que você conhece

**Mensagem:**

> "Oi! Descobri algo que pode ajudar seu salão:
>
> **Você está deixando dinheiro na mesa sem saber.**
>
> Salões perdem 20-25 clientes por ano silenciosamente = R$ 7-15 mil em receita perdida.
>
> Retoquei traz elas de volta automaticamente.
> Teste 14 dias grátis: [LINK]"

**Métrica:** % de cliques (meta: 10-20%)

---

### Ação 1.2: Teste de Email
**Tempo:** 1 hora
**Público:** Sua base de leads existentes (50-200 pessoas)

**Use:** Email 1 do COPY_VARIAÇÕES.md ("Seus últimos 25 clientes inativos")

**Envie por:** Mailchimp, Brevo ou similar

**Métricas a acompanhar:**
- Open rate (meta: 25-35%)
- Click rate (meta: 5-10%)

---

### Ação 1.3: Teste de LinkedIn
**Tempo:** 1 dia
**Público:** 100-200 donos de salão

**Post:**

> "Sua taxa de churn está entre 15-30% ao ano.
>
> Ninguém sabe. Ninguém faz nada.
>
> Retoquei identifica clientes prestes a sair e as traz de volta automaticamente.
>
> Resultado: 5-15 clientes recuperados por mês.
>
> Testar é grátis. [LINK]"

**Métricas:**
- Reach (meta: 200-500)
- Engagement (meta: 5-10%)
- Cliques (meta: 5-15)

---

### Decisão após Fase 1:
- **Se click rate > 10%:** Avança para Fase 2
- **Se click rate < 5%:** Volta ao copy, testa novo ângulo
- **Se click rate 5-10%:** Refina mensagem, testa novamente

---

## FASE 2: CONSTRUIR LANDING PAGE (Semana 2-3)

### Ação 2.1: Escolher Plataforma
**Opções:**
1. **Webflow** — Melhor design flexibility, CMS built-in
2. **Framer** — Melhor para animações + conversão
3. **Super.com** — Rápido, templates prontos
4. **Carrd.co** — Ultra-simples (mini landing)
5. **HTML puro + Tailwind** — Controle total (Se você tem dev)

**Recomendação:** Comece com Webflow (templates prontos + qualidade).

---

### Ação 2.2: Estrutura da Landing
**Use:** LANDING_PAGE_COPY.md

**Ordem:**
1. Hero (headline + subheadline + CTA + imagem dashboard)
2. Problema (3 cards)
3. Como Funciona (3 passos)
4. Resultados (métricas + depoimentos)
5. Benefícios (5 cards)
6. Preços (3 planos)
7. FAQ (8 perguntas)
8. Garantia
9. CTA Final
10. Footer

**Tempo estimado:** 2-3 dias (se usar template)

---

### Ação 2.3: Assets Visuais
**Obrigatório (mínimo):**
- [ ] Screenshot do dashboard Retoquei (real ou mockup)
- [ ] 3 ícones para passos (Importa, Identifica, Envia)
- [ ] 3-5 ícones para benefícios
- [ ] 3 avatares para depoimentos (ou fotos reais)

**Recomendado:**
- [ ] Vídeo 2-min (demo do dashboard)
- [ ] Gráfico de ROI (números visuais)

**Onde conseguir:**
- **Ícones:** Heroicons, Feather, Phosphor
- **Avatares:** ThisPersonDoesNotExist.com (fake mas natural)
- **Design:** Figma (templates prontos)

---

### Ação 2.4: Integrar Forms & Tracking
**Ferramentas:**

| Função | Ferramenta | Setup |
|--------|-----------|-------|
| Form | Typeform / Formbricks | 30 min |
| Email automático | Brevo / Mailchimp | 1 hora |
| Analytics | Google Analytics 4 | 15 min |
| Pixel conversão | Facebook / Google | 15 min |

**Fluxo após submit:**
1. User preenche form com email
2. Recebe confirmação ("Check your email!")
3. Email com link para iniciar trial
4. Link vai para seu app (onboarding do Retoquei)

---

### Ação 2.5: SEO Básico
**Essencial:**

```html
<title>Recupere Clientes Perdidos Automaticamente | Retoquei</title>

<meta name="description" content="Retoquei identifica clientes em risco e as traz de volta com WhatsApp automático. Aumente faturamento 40%. Teste grátis.">

<meta name="keywords" content="retenção de clientes salão, recuperar clientes perdidos, automação salão, WhatsApp marketing salão">

<h1>Recupere Clientes Perdidos Automaticamente</h1>
```

**Estrutura:**
- H1 (1x) — Headline principal
- H2 (6x) — Subheadings de seções
- H3 (12x) — Subheadings de cards
- Alt text (todas imagens)
- Internal links (se houver blog)

---

## FASE 3: CAMPANHA DE AQUISIÇÃO (Semana 3-4)

### Canal 1: Google Ads (SEM)

**Estrutura:**

| Campaign | Audience | Budget | Goal |
|----------|----------|--------|------|
| Brand | Searches: "retoquei" | R$ 50/dia | Defend brand |
| Problem-aware | Searches: "retenção salão", "churn cliente", "recuperar cliente salão" | R$ 100/dia | Awareness |
| Solution-aware | Searches: "automação WhatsApp salão", "CRM salão" | R$ 100/dia | Consideration |
| **TOTAL** | | **R$ 250/dia** | Leads |

**Headlines (3 obrigatórios):**

1. "Recupere Clientes Perdidos"
2. "Aumente Faturamento 40%"
3. "Automático com Retoquei"

**Description:**

"Retoquei identifica suas clientes desaparecidas e as traz de volta via WhatsApp. Teste 14 dias grátis — sem cartão de crédito."

**Bid strategy:** Maximize Conversions (set max CPA = R$ 100-150)

**Landing:** Sua landing page Retoquei

**Expected:** 50-100 clicks/dia, 10-20 conversões/dia (15-25% conv rate)

---

### Canal 2: Email (List Warm)

**Audiência:** Contatos existentes do salão / newsletter

**Sequência (5 emails, 2x por semana):**

| Dia | Email | Subject | Goal |
|-----|-------|---------|------|
| 1 | Email 1 (COPY_VARIAÇÕES) | "Seus últimos 25 clientes inativos..." | Awareness |
| 3 | Email 2 | "Como salões ganham R$ 50 mil extras..." | Social proof |
| 7 | Email 3 | "Preocupado? Temos garantia 30 dias" | Objection |
| 14 | Email 4 | "Promoção termina na sexta" | Urgência |
| 21 | Email 5 | "Sua última chance: -50%" | Last-chance |

**Expected:** 25-35% open rate, 5-10% click rate, 2-5% signup rate

---

### Canal 3: LinkedIn Outreach (Manual)

**Audiência:** Donos de salão + gerentes (1.000-2.000 prospects)

**Processo:**
1. Buscar por "salão", "estética", "beleza" no LinkedIn
2. Enviar connection request + mensagem personalizada
3. Follow-up em 1 semana se não responde

**Mensagem padrão:**

> "Oi [NOME], vi que você gerencia [SALÃO].
>
> Trabalho com retenção de clientes em salões.
>
> Rápida pergunta: qual é sua maior dor operacional agora?
>
> (Se responder 'churn' ou 'faturamento':)
>
> Exato. Ajudamos com Retoquei — automação de reengajamento.
> Traz 5-15 clientes de volta por mês, com zero trabalho manual.
>
> Quer testar 14 dias grátis?"

**Expected:** 5-10% response rate, 1-3% signup rate

---

### Canal 4: Instagram / TikTok (Orgânico)

**Estratégia:** 3-5 reels por semana com ângulos diferentes

**Formatos:**

1. **"Wake Up Call"** — Número brutal (R$ 10 mil perdido)
2. **"Antes/Depois"** — Proprietária antes (cansada) vs depois (feliz)
3. **"Pergunta Viral"** — "Quantos clientes você deixou escapar?"
4. **"Tutorial Rápido"** — Como usar Retoquei em 30 seg
5. **"Estatística"** — "45% de reativação em 30 dias"

**CTA em cada:** "Link na bio"

**Expected:** 50-200 views/reel, 5-15% engagement, 1-3 clicks/dia

---

### Canal 5: Partnerships (Manual)

**Parcerias com:**
- Softwares de agenda (Trinks, Booksy, Agenda Edu)
- Consultores de salão
- Influenciadores de beleza
- Comunidades online (grupos Facebook, Discord)

**Oferta:** Affiliate commission (10-20% LTV) ou revenue share

---

## FASE 4: OTIMIZAR & ESCALAR (Semana 4+)

### Métricas a Acompanhar

| Métrica | Target | Ação se Não Atingir |
|---------|--------|-------------------|
| **Landing CTR** | 3-8% | Testar novo headline |
| **Landing Conv Rate** | 12-25% | Testar novo CTA ou oferta |
| **Trial → Paid** | 20-40% | Melhorar onboarding ou copywriting |
| **CAC** | R$ 500-1.500 | Reduzir ad spend em canais caros |
| **LTV** | R$ 2.500-5.000 | Aumentar retention com upsells |
| **Payback** | 1-3 meses | Melhorar product ou pricing |

---

### Testes A/B Recomendados

**Teste 1: Headline (Semana 1)**
- Variante A: "Recupere clientes perdidos"
- Variante B: "Aumente faturamento 40%"
- Variante C: "Seu salão está perdendo R$ 10 mil/mês"

**Teste 2: CTA (Semana 2)**
- Variante A: "Começar teste grátis"
- Variante B: "Recuperar clientes agora"
- Variante C: "Proteger meu faturamento"

**Teste 3: Oferta (Semana 3)**
- Variante A: "14 dias grátis"
- Variante B: "14 dias + bônus onboarding"
- Variante C: "50% off primeiros 3 meses"

---

### Otimizações de Copy

**Se conv rate está baixa (<10%):**

Problema provávelmente é:
- Headline não é clara
- Falta social proof
- CTA não é compelling

**Solução:**
1. Colocar número grande na headline (40%, R$ 50 mil, 45-55%)
2. Adicionar depoimento real logo abaixo do CTA
3. Mudar CTA para verbo mais ativo ("Recuperar agora" vs "Saiba mais")

---

**Se trial → paid é baixo (<20%):**

Problema provávelmente é:
- Onboarding muito longo
- Falta de quick wins
- Suporte ruim na integração

**Solução:**
1. Encurtar onboarding para 5-10 min
2. Mostrar clientes em risco no dia 1 (ativa dopamina)
3. Oferecer call 1:1 com especialista para todos os trials

---

## FASE 5: ESCALABILIDADE (Mês 2+)

### Aumentar Ad Spend
Se CAC está abaixo de R$ 1.500 e LTV está acima de R$ 2.500:

```
Mês 1: R$ 250/dia (teste) = R$ 7.500/mês
Mês 2: R$ 500/dia (2x budget) = R$ 15 mil/mês
Mês 3: R$ 1.000/dia (4x budget) = R$ 30 mil/mês
```

**Regra:** "Não gaste mais de 30-50% do LTV em CAC"

---

### Adicionar Novos Canais
**Prioridade:**
1. Google Ads (já testado)
2. Email (já testado)
3. LinkedIn (já testado)
4. **Novo:** Podcast sponsorship (beleza + empreendedorismo)
5. **Novo:** Webinar (free trial → paid)
6. **Novo:** Affiliate program (donos de salão indicam)

---

### Content Marketing
**Blog posts (2-3/semana):**
1. "Quanto você está perdendo em churn?"
2. "5 sinais que sua cliente está prestes a sair"
3. "Automação de retenção vs. retenção manual"
4. "Histórias de sucesso: como [SALÃO] recuperou R$ 20 mil"
5. "O guia completo de retenção para salões"

**Objetivo:** Organic traffic, backlinks, SEO authority

---

## CHECKLIST FINAL

### Antes de Lançar
- [ ] Landing page 100% responsiva (mobile + desktop)
- [ ] Form funcionando (sem erros)
- [ ] Email automático configurado
- [ ] Analytics rastreando (Google + pixel)
- [ ] Copywriting revisado por nativo PT-BR
- [ ] Dashboard screenshot real (ou bom mockup)
- [ ] 3 depoimentos coletados (ou placeholders qualidade)
- [ ] Preços definidos e testados
- [ ] Garantia 30 dias clara na página
- [ ] FAQ completo (8+ perguntas)

### Depois de Lançar (Dia 1-7)
- [ ] Teste de click-through (pessoal em seus contatos)
- [ ] Teste de conversão (você mesmo preenche form)
- [ ] Check de email automático (chega na caixa?)
- [ ] Monitoring de Google Analytics
- [ ] Feedback loop com primeiros leads

### Semana 2
- [ ] Ligar para primeiros 5 leads (feedback qualitativo)
- [ ] Analisar drop-off na landing (onde as pessoas saem?)
- [ ] Rolar out Google Ads (pequeno orçamento)
- [ ] Iniciar email sequence (se tiver base)

### Semana 3+
- [ ] A/B testing de headlines
- [ ] A/B testing de CTAs
- [ ] Análise de CAC vs LTV
- [ ] Otimizar conversão rota crítica
- [ ] Aumentar orçamento em canais que funcionam

---

## FÓRMULA DE SUCESSO

```
Tráfego de Qualidade
        ↓
Landing Page Clara (12-25% conv)
        ↓
Onboarding Rápido (80%+ completion)
        ↓
Valor Imediato (cliente vê resultado em 3-7 dias)
        ↓
Trial → Paid (20-40% conversion)
        ↓
Retenção & Expansion (3+ meses média)
        ↓
CRESCIMENTO EXPONENCIAL
```

---

## REFERÊNCIAS RÁPIDAS

**Se precisar de ideias de copy rápido:**
- Vá para COPY_VARIAÇÕES.md
- Escolha o público (proprietário, gerente, estética, etc)
- Copie o copy para seu canal

**Se precisar de estrutura de landing:**
- Vá para LANDING_PAGE_COPY.md
- Copy-paste seção por seção
- Preencha com seus assets

**Se precisar de template de email:**
- Vá para COPY_VARIAÇÕES.md > SEÇÃO 8
- Use no Brevo ou Mailchimp

**Se precisar de script de vendas:**
- Vá para COPY_VARIAÇÕES.md > SEÇÃO 6
- Adapte para sua voz

---

## PERGUNTAS FREQUENTES SOBRE IMPLEMENTAÇÃO

**P: Por onde começo?**
R: Comece pela Fase 1 (validação rápida). Se click rate > 10%, vai para Fase 2.

**P: Posso pular etapas?**
R: Não recomendo. A ordem é importante (validação → landing → tráfego → otimização).

**P: Quanto vou gastar em ads?**
R: Comece com R$ 7.500-10 mil/mês. Se CAC < R$ 1.500, escala.

**P: Qual canal é melhor?**
R: Google Ads (SEM) é mais previsível. LinkedIn é mais qualificado. Email é mais barato.

**P: Quanto tempo até ver ROI?**
R: 30-60 dias se executar bem. Antes disso, ainda em teste.

**P: E se a conversão for baixa?**
R: Volte aos testes A/B. Problema é 90% de copy/oferta, 10% de tráfego.

---

## PRÓXIMOS PASSOS

1. Escolha Fase 1 (validação) — Comece HOJE
2. Faça testes com 20-30 pessoas
3. Analyze resultados (click rate > 10%?)
4. Se sim → Fase 2 (landing page)
5. Se não → Volte, mude copy, teste novamente

**Tempo total:** 3-4 semanas até landing ao vivo.

Boa sorte! 🚀

---

**Documentos associados:**
- COPY_VENDAS.md (copy completo)
- COPY_VARIAÇÕES.md (variações por público/canal)
- LANDING_PAGE_COPY.md (estrutura de landing)
