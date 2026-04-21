import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, MessageCircle, AlertCircle } from 'lucide-react'
import { getServerSalon } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ChatWindow from './ChatWindow'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Chat' }

export default async function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const salon = await getServerSalon()
  if (!salon) redirect('/salon')

  const chat = await prisma.chat.findFirst({
    where: { id, salonId: salon.id },
    include: {
      client: true,
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!chat) notFound()

  // Mark as read
  await prisma.chat.update({
    where: { id },
    data: { unreadCount: 0 },
  })

  return (
    <div className="flex flex-col h-full bg-white/[0.02]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-4">
          <Link href="/chat" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">{chat.client.fullName}</h1>
            <p className="text-sm text-gray-500">{chat.client.phone}</p>
          </div>
        </div>

        {/* WhatsApp Status */}
        <div className="flex items-center gap-2">
          {chat.isWhatsAppConnected ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">WhatsApp Conectado</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-yellow-400">Sem WhatsApp</span>
            </>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <ChatWindow chatId={id} initialMessages={chat.messages} clientName={chat.client.fullName} />
    </div>
  )
}
