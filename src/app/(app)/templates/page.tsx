import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, FileText } from 'lucide-react'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Tooltip } from '@/components/ui/Tooltip'
import TemplatesList from './TemplatesList'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Templates' }

export default async function TemplatesPage() {
  const salon = await getServerSalon()
  if (!salon) redirect('/salon')

  const templates = await prisma.template.findMany({
    where: { salonId: salon.id },
    orderBy: { createdAt: 'desc' },
  })

  const data = templates.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    content: t.content,
    archivedAt: t.archivedAt ? t.archivedAt.toISOString() : null,
    createdAt: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Templates</h1>
          <p className="text-gray-400 mt-1">{templates.length} templates criados</p>
        </div>
        <Tooltip content="Crie um novo template para suas campanhas de WhatsApp" side="left">
          <Link
            href="/templates/new"
            className="flex items-center gap-2 bg-[#C9A14A] text-black font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-[#b8903e] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo template
          </Link>
        </Tooltip>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.03] border border-white/[0.08] rounded-xl">
          <FileText className="h-10 w-10 text-gray-400 mb-3" />
          <p className="text-gray-400 mb-4">Nenhum template criado ainda</p>
          <Link
            href="/templates/new"
            className="bg-[#C9A14A] text-black font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#b8903e] transition-colors"
          >
            Criar primeiro template
          </Link>
        </div>
      ) : (
        <TemplatesList templates={data} />
      )}
    </div>
  )
}
