/**
 * Simula o fluxo completo da plataforma Retoquei:
 * 1. Busca o salão do usuário
 * 2. Importa 10 clientes
 * 3. Cria um template de mensagem
 * 4. Cria um segmento (todos os clientes)
 * 5. Cria uma campanha
 * 6. Mostra o resumo final
 */
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// Load .env manually
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

const prisma = new PrismaClient()

const CLIENTES_TESTE = [
  { nome: 'Maria Silva', telefone: '11987654321', email: 'maria.silva@email.com' },
  { nome: 'Ana Santos', telefone: '11976543210', email: 'ana.santos@email.com' },
  { nome: 'Juliana Costa', telefone: '11965432109', email: 'juliana.costa@email.com' },
  { nome: 'Fernanda Lima', telefone: '11954321098', email: 'fernanda.lima@email.com' },
  { nome: 'Carolina Rocha', telefone: '11943210987', email: 'carolina.rocha@email.com' },
  { nome: 'Patricia Souza', telefone: '11932109876', email: 'patricia.souza@email.com' },
  { nome: 'Beatriz Oliveira', telefone: '11921098765', email: 'beatriz.oliveira@email.com' },
  { nome: 'Camila Ferreira', telefone: '11910987654', email: 'camila.ferreira@email.com' },
  { nome: 'Rafaela Alves', telefone: '11909876543', email: 'rafaela.alves@email.com' },
  { nome: 'Larissa Martins', telefone: '11998765432', email: 'larissa.martins@email.com' },
]

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

async function main() {
  console.log('\nINICIANDO SIMULACAO DO FLUXO RETOQUEI\n')
  console.log('='.repeat(60))

  // 1. Buscar o salão
  console.log('\n[1/6] Buscando salao...')
  const salon = await prisma.salon.findFirst({
    where: { name: 'Império Progressivas' },
  })

  if (!salon) {
    console.error('ERRO: Salao "Imperio Progressivas" nao encontrado!')
    process.exit(1)
  }

  console.log(`   OK Salao encontrado: ${salon.name} (ID: ${salon.id})`)

  // 2. Importar 10 clientes
  console.log('\n[2/6] Importando 10 clientes...')
  let importados = 0
  let atualizados = 0

  for (const cliente of CLIENTES_TESTE) {
    const phoneNormalized = normalizePhone(cliente.telefone)

    const result = await prisma.client.upsert({
      where: {
        salonId_phoneNormalized: {
          salonId: salon.id,
          phoneNormalized,
        },
      },
      update: {
        fullName: cliente.nome,
        email: cliente.email,
      },
      create: {
        salonId: salon.id,
        fullName: cliente.nome,
        phone: `+55${phoneNormalized}`,
        phoneNormalized,
        email: cliente.email,
        source: 'CSV',
        lifecycleStage: 'NEW',
      },
    })

    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      importados++
    } else {
      atualizados++
    }
  }

  console.log(`   OK ${importados} clientes importados, ${atualizados} atualizados`)

  // 3. Criar template
  console.log('\n[3/6] Criando template de mensagem...')
  const templateExistente = await prisma.template.findFirst({
    where: {
      salonId: salon.id,
      name: 'Retorno - 30 dias',
    },
  })

  let template
  if (templateExistente) {
    template = templateExistente
    console.log(`   OK Template ja existe: ${template.name}`)
  } else {
    template = await prisma.template.create({
      data: {
        salonId: salon.id,
        name: 'Retorno - 30 dias',
        category: 'REACTIVATION',
        content: 'Oi {{nome}}! Faz tempo que nao te vejo aqui no Imperio Progressivas. Que tal agendar seu proximo atendimento? Tenho horarios disponiveis essa semana!',
      },
    })
    console.log(`   OK Template criado: ${template.name}`)
  }

  // 4. Criar segmento (todos os clientes)
  console.log('\n[4/6] Criando segmento...')
  const segmentoExistente = await prisma.segment.findFirst({
    where: {
      salonId: salon.id,
      name: 'Todos os clientes',
    },
  })

  let segmento
  if (segmentoExistente) {
    segmento = segmentoExistente
    console.log(`   OK Segmento ja existe: ${segmento.name}`)
  } else {
    segmento = await prisma.segment.create({
      data: {
        salonId: salon.id,
        name: 'Todos os clientes',
        description: 'Segmento com todos os clientes ativos',
        type: 'DYNAMIC',
        rulesJson: { all: true },
      },
    })
    console.log(`   OK Segmento criado: ${segmento.name}`)
  }

  // 5. Criar campanha
  console.log('\n[5/6] Criando campanha...')
  const campanha = await prisma.campaign.create({
    data: {
      salonId: salon.id,
      name: `Campanha Teste - ${new Date().toLocaleDateString('pt-BR')}`,
      status: 'DRAFT',
      segmentId: segmento.id,
      templateId: template.id,
    },
  })

  console.log(`   OK Campanha criada: ${campanha.name}`)
  console.log(`   ID: ${campanha.id}`)
  console.log(`   Status: ${campanha.status}`)

  // 6. Resumo final
  console.log('\n[6/6] RESUMO FINAL')
  console.log('='.repeat(60))

  const totalClientes = await prisma.client.count({ where: { salonId: salon.id } })
  const totalTemplates = await prisma.template.count({ where: { salonId: salon.id } })
  const totalSegmentos = await prisma.segment.count({ where: { salonId: salon.id } })
  const totalCampanhas = await prisma.campaign.count({ where: { salonId: salon.id } })

  console.log(`   Salao:      ${salon.name}`)
  console.log(`   Clientes:   ${totalClientes}`)
  console.log(`   Templates:  ${totalTemplates}`)
  console.log(`   Segmentos:  ${totalSegmentos}`)
  console.log(`   Campanhas:  ${totalCampanhas}`)
  console.log('')
  console.log('SIMULACAO CONCLUIDA COM SUCESSO!')
  console.log('')
  console.log('Acesse https://retoquei-tawny.vercel.app para ver os dados')
  console.log('')
}

main()
  .catch((err) => {
    console.error('ERRO na simulacao:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
