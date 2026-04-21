import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MessageCircle, Search } from 'lucide-react'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Chat' }

export default async function ChatPage() {
  const salon = await getServerSalon()
  if (!salon) redirect('/salon')

  // Get all chats with latest messages
  const chats = await prisma.chat.findMany({
    where: { salonId: salon.id },
    include: {
      client: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          lifecycleStage: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  })

  return (
    <div className="flex flex-col h-full bg-white/[0.02]">
      {/* Header */}
      <div className="px-6 py-6 border-b border-white/[0.08]">
        <h1 className="text-2xl font-bold text-white mb-4">Mensagens</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A14A]/50 focus:bg-white/[0.08] transition-colors"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageCircle className="h-10 w-10 text-gray-500 mb-3" />
            <p className="text-gray-400 mb-2">Nenhuma conversa iniciada</p>
            <p className="text-xs text-gray-500">
              Clientes que responderem suas mensagens aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {chats.map((chat) => {
              const lastMessage = chat.messages[0]
              const isUnread = chat.unreadCount > 0

              return (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className={`block px-6 py-4 hover:bg-white/[0.05] transition-colors ${isUnread ? 'bg-white/[0.03]' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className={`font-medium ${isUnread ? 'text-[#C9A14A]' : 'text-white'}`}>
                        {chat.client.fullName}
                      </p>
                      <p className="text-xs text-gray-500">{chat.client.phone}</p>
                    </div>
                    {isUnread && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-[#C9A14A] text-black font-semibold px-2 py-1 rounded-full">
                          {chat.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>

                  {lastMessage && (
                    <p className="text-sm text-gray-400 truncate">
                      {lastMessage.direction === 'inbound' ? '← ' : '→ '}
                      {lastMessage.content}
                    </p>
                  )}

                  <p className="text-xs text-gray-600 mt-2">
                    {chat.lastMessageAt
                      ? new Date(chat.lastMessageAt).toLocaleString('pt-BR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Sem mensagens'}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
