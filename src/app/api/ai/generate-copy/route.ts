// Requires: npm install @anthropic-ai/sdk
// Env var: ANTHROPIC_API_KEY

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

type Tone = 'friendly' | 'professional' | 'casual'
type MessageType = 'reengagement' | 'welcome' | 'birthday' | 'promotion'

interface Body {
  context?: string
  tone: Tone
  variables: string[]
  type: MessageType
}

const TONE_MAP: Record<Tone, string> = {
  friendly: 'amigável e caloroso',
  professional: 'profissional e formal',
  casual: 'casual e descontraído',
}

const TYPE_MAP: Record<MessageType, string> = {
  reengagement: 'reengajamento de clientes inativos',
  welcome: 'boas-vindas a novos clientes',
  birthday: 'parabéns de aniversário',
  promotion: 'promoção ou oferta especial',
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 503 })
  }

  const body: Body = await req.json()
  if (!body.tone || !body.type) {
    return NextResponse.json({ error: 'tone e type são obrigatórios' }, { status: 400 })
  }

  const prompt = `Você é um especialista em marketing para salões de beleza brasileiros.
Crie 3 variações de mensagem de WhatsApp para ${TYPE_MAP[body.type]}.

Regras:
- Máximo 1024 caracteres por mensagem (WhatsApp)
- Tom: ${TONE_MAP[body.tone]}
- Variáveis disponíveis: ${body.variables.length ? body.variables.join(', ') : 'nenhuma'} (formato {{variavel}})
- Escreva em português brasileiro
- Máximo 2 emojis por mensagem
- Cada variação deve ter abordagem diferente
- Sempre termine com uma call-to-action clara
- Contexto adicional: ${body.context?.trim() || 'nenhum'}

Responda APENAS com JSON válido, sem texto extra:
{"suggestions":["msg1","msg2","msg3"]}`

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

    let suggestions: string[] = []
    try {
      const parsed = JSON.parse(cleaned) as { suggestions?: unknown }
      if (Array.isArray(parsed.suggestions)) {
        suggestions = parsed.suggestions.filter((s): s is string => typeof s === 'string').slice(0, 3)
      }
    } catch {
      const matches = raw.match(/"([^"]{10,})"/g)
      if (matches) suggestions = matches.map((m) => m.slice(1, -1)).slice(0, 3)
    }

    if (!suggestions.length) {
      return NextResponse.json({ error: 'Não foi possível gerar sugestões. Tente novamente.' }, { status: 502 })
    }

    return NextResponse.json({ suggestions })
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
