'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, CheckCheck, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  content: string
  direction: string
  status?: string
  whatsappMessageId?: string
  createdAt: string | Date
  deliveredAt?: string | Date | null
  readAt?: string | Date | null
}

interface ChatWindowProps {
  chatId: string
  initialMessages: Message[]
  clientName: string
}

export default function ChatWindow({ chatId, initialMessages, clientName }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Subscribe to real-time message updates via Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // New message received (from webhook or other user)
            const newMsg = payload.new as Message
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.find((m) => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
          } else if (payload.eventType === 'UPDATE') {
            // Message status updated (delivery, read)
            const updatedMsg = payload.new as Message
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)),
            )
          }
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [chatId, supabase])

  // Render status icon for outbound messages
  function renderStatusIcon(msg: Message) {
    if (msg.direction !== 'outbound') return null

    const status = msg.status || 'pending'
    const iconProps = 'h-3 w-3'

    switch (status) {
      case 'read':
        return <CheckCheck className={`${iconProps} text-blue-400`} />
      case 'delivered':
        return <CheckCheck className={`${iconProps} text-gray-400`} />
      case 'sent':
        return <Check className={`${iconProps} text-gray-400`} />
      case 'failed':
        return <AlertCircle className={`${iconProps} text-red-400`} />
      default:
        return <Loader2 className={`${iconProps} animate-spin text-gray-400`} />
    }
  }

  // Get status text for tooltip
  function getStatusText(msg: Message): string {
    const status = msg.status || 'pending'
    const statusMap: Record<string, string> = {
      pending: 'Enviando...',
      sent: 'Enviada',
      delivered: 'Entregue',
      read: 'Lida',
      failed: 'Falha ao enviar',
    }
    return statusMap[status] || status
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    const messageText = newMessage
    setNewMessage('')
    setSending(true)

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageText }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.whatsappError) {
          toast.error(`WhatsApp: ${data.whatsappError}`)
        } else {
          toast.error('Erro ao enviar mensagem')
        }
        setNewMessage(messageText)
        setSending(false)
        return
      }

      const message = await res.json()
      setMessages([...messages, message])

      // Show status based on send result
      if (message.status === 'failed') {
        toast.warning('Mensagem falhou ao ser enviada via WhatsApp')
      } else {
        toast.success('Mensagem enviada')
      }
    } catch (err) {
      toast.error('Erro ao enviar mensagem')
      setNewMessage(messageText)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-center">
              Nenhuma mensagem ainda. <br /> Inicie a conversa com {clientName}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.direction === 'outbound'
                    ? 'bg-[#C9A14A] text-black'
                    : 'bg-white/[0.1] text-white'
                }`}
              >
                <p className="break-words">{msg.content}</p>
                <div className="flex items-center gap-1 mt-1 justify-between">
                  <p className="text-xs opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {msg.direction === 'outbound' && (
                    <div title={getStatusText(msg)}>
                      {renderStatusIcon(msg)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSend}
        className="border-t border-white/[0.08] px-6 py-4 flex items-center gap-3"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escrever mensagem WhatsApp..."
          disabled={sending}
          className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A14A]/50 focus:bg-white/[0.08] transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="flex items-center justify-center gap-2 bg-[#C9A14A] text-black font-semibold px-4 py-2.5 rounded-lg text-sm hover:bg-[#b8903e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Enviar
        </button>
      </form>
    </div>
  )
}
