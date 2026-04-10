import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, FileText } from 'lucide-react'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const metadata = { title: 'Templates' }

const CATEGORY_LABELS: Record<string, string> = {
  REACTIVATION: 'Reativação',
  POST_VISIT: 'Pós-visita',
  BIRTHDAY: 'Aniversário',
  UPSELL: 'Upsell',
  CUSTOM: 'Personalizado',
}

export default async function TemplatesPage() {
  const salon = await getServerSalon()
  if (!salon) redirect('/salon')

  const templates = await prisma.template.findMany({
    where: { salonId: salon.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Templates</h1>
          <p className="text-gray-400 mt-1">{templates.length} templates criados</p>
        </div>
        <Link
          href="/templates/new"
          className="flex items-center gap-2 bg-[#C9A14A] text-black font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-[#b8903e] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.03] border border-white/[0.08] rounded-xl">
          <FileText className="h-10 w-10 text-gray-600 mb-3" />
          <p className="text-gray-400 mb-4">Nenhum template criado ainda</p>
          <Link
            href="/templates/new"
            className="bg-[#C9A14A] text-black font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#b8903e] transition-colors"
          >
            Criar primeiro template
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 hover:border-[#C9A14A]/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{t.name}</h3>
                  <span className="text-xs text-gray-500 mt-0.5">
                    {CATEGORY_LABELS[t.category] ?? t.category}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-400 line-clamp-3">{t.content}</p>
              <p className="text-xs text-gray-600 mt-3">
                {new Date(t.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
